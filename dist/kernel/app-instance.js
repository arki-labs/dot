/**
 * Internal DotApp implementation — the kernel's lifecycle scheduler.
 *
 * Not exported from the public surface. Tests reach it only through
 * `defineApp(...)` and its returned `DotApp` interface.
 */
import { Deadline, scopeAggregate } from '@arki/async';
import { SystemClock } from '@arki/clock';
import { isFailure, UnexpectedDefect } from '@arki/failure';
import { getLogger } from '@arki/log';
import { DotLifecycleError, DotLifecycleErrorCode } from '../lifecycle.js';
import { toJsonObject } from '../manifest.js';
import { isLazy, isLazyWitness, lazyOf } from '../unit-contract.js';
import { telemetryFor } from '../telemetry.js';
import { handlerObserverFor } from './handler-events.js';
import { nowMs } from './now.js';
import { withPhaseSpan, withUnitHookSpan } from './otel.js';
const kernelLog = getLogger('arki:dot:kernel');
/**
 * Logging cannot report its own failure through logging (RFC §7 of the
 * `@arki/log` redesign), so a failed close of the logging slot goes to the
 * console, once. It never replaces the lifecycle's own result or error.
 */
function reportLoggingCloseFailure(error) {
    try {
        console.error('[arki:dot] closing the logging slot failed', error);
    }
    catch {
        // A broken fallback reporter cannot replace the owned cleanup result.
    }
}
const DOCS_BASE = 'https://docs.arki.dev/dot/diagnostics';
function failed(value) {
    return isFailure(value);
}
function closeOutcome(failures) {
    if (failures.length === 1)
        return failures[0];
    if (failures.length > 1)
        return scopeAggregate([], failures);
    return;
}
function startupOutcome(primary, cleanup) {
    return cleanup.length === 0 ? primary : scopeAggregate([primary], cleanup);
}
function constructed(value) {
    return !isFailure(value);
}
function loggingHandle(value) {
    return !isFailure(value);
}
/** Resolve a needs-shape witness to its wire key. */
function wireKeyOf(witness, alias) {
    return 'key' in witness && typeof witness.key === 'string' ? witness.key : alias;
}
/** Helper for stable issue construction. */
function makeIssue(args) {
    return {
        code: args.code,
        severity: args.severity ?? 'error',
        plugin: args.plugin,
        message: args.message,
        remediation: args.remediation,
        docsUrl: `${DOCS_BASE}#${args.docsAnchor}`,
        metadata: args.metadata,
    };
}
/**
 * Internal app implementation. Public consumers see the `DotApp` interface
 * from `../define-app.ts`.
 */
export class DotAppImpl {
    #appName;
    #appVersion;
    #config;
    /** Units in declaration order — v2 boot order IS declaration order. */
    #ordered;
    #records;
    /** Macro-state of the app. */
    #state = 'defined';
    /** Per-hook watchdog budget (ms); `undefined` = no watchdog. */
    #hookTimeoutMs;
    #clock;
    #lazyOwners = new Set();
    /** Manifest finalised after `configure`. */
    #manifest;
    /** Wire-keyed services map — populated as units boot. */
    #serviceMap = new Map();
    /** Which unit provided each wire key — feeds dependency edges + collisions. */
    #providerByWireKey = new Map();
    /** Dependency edges observed during boot (consumer → provider). */
    #wiringEdges = [];
    /** Merged wire-keyed services record exposed as `app.services`. */
    #aggregatedServices = {};
    /** Configure has already happened (idempotent). */
    #configured = false;
    /** In-flight boot promise — used for concurrent boot() coalescing. */
    #bootInflight = null;
    /** In-flight start promise — used for concurrent start() coalescing. */
    #startInflight = null;
    /** Narrow public entry points coalesce without widening the phases reached. */
    #bootConfiguredInflight = null;
    #startConfiguredInflight = null;
    #startBootedInflight = null;
    /** In-flight stop promise — used for concurrent stop() coalescing. */
    #stopInflight = null;
    /** In-flight dispose promise — used for concurrent dispose() coalescing. */
    #disposeInflight = null;
    /**
     * Serializes lifecycle transitions. Each of boot/start/stop/dispose
     * queues behind whatever transition is in flight and re-checks
     * `#state` only once it reaches the head of the queue. Without this,
     * phases interleave at await points — e.g. `dispose()` completes while
     * `start()` awaits a hook, and the resuming start stamps `started`
     * over `disposed`, resurrecting a dead app.
     */
    #transitionChain = Promise.resolve();
    /**
     * Structured lifecycle logger. One per app instance; named so consumers
     * can elevate it to DEBUG via `DEBUG=arki:dot:lifecycle` without
     * touching unrelated namespaces. Every line carries the app name plus
     * any phase/unit attributes from the call site. The span helpers
     * (see `./otel.ts`) thread the active span's `traceId`+`spanId` onto
     * forked instances of this logger, so every log record is groupable
     * with its trace in any OTel-compatible backend.
     */
    #logger;
    /** The unit that fills the logging slot, found when the app is assembled. */
    #loggingUnit;
    /** The active logging handle, between activation and close. */
    #logging;
    /** Set once logging is closed; later closes return the same promise. */
    #loggingClosed;
    /**
     * In-process lifecycle observers. Fan-out is synchronous; observer
     * exceptions are caught and dropped (DEBUG-logged). Mutable through
     * `subscribe()` even after lifecycle starts — observers added later
     * see only events from their subscription onwards.
     */
    #observers;
    constructor(config) {
        this.#appName = config.appName;
        this.#appVersion = config.appVersion;
        this.#hookTimeoutMs = config.hookTimeoutMs;
        this.#clock = config.clock ?? new SystemClock();
        this.#config = Object.freeze({ ...config.config });
        this.#logger = getLogger('arki:dot:lifecycle').with({ 'dot.app.name': config.appName });
        this.#observers = new Set(config.observers);
        // Declaration order is boot order in v2. Duplicate names are surfaced at
        // construction (the `configure` phase pseudo-time).
        this.#ordered = [...config.plugins];
        // The logging slot is discovered without I/O and activated only during boot.
        const loggingUnits = this.#ordered.filter(unit => unit.logging !== undefined);
        if (loggingUnits.length > 1) {
            const names = loggingUnits.map(unit => `"${unit.name}"`).join(', ');
            throw new DotLifecycleError({
                code: DotLifecycleErrorCode.DuplicateLogging,
                phase: 'configure',
                plugin: loggingUnits[1]?.name,
                message: `Units ${names} all fill the logging slot — an app has at most one logging unit. Keep one.`,
            });
        }
        this.#loggingUnit = loggingUnits[0];
        this.#records = new Map();
        for (const [order, unit] of this.#ordered.entries()) {
            if (this.#records.has(unit.name)) {
                throw new DotLifecycleError({
                    code: DotLifecycleErrorCode.DuplicateUnit,
                    phase: 'configure',
                    plugin: unit.name,
                    message: `Unit "${unit.name}" is registered twice`,
                });
            }
            // `$` is the kernel context namespace ($app/$unit/$config). The infra()
            // constraint bans these at compile time; this is the runtime backstop
            // for erased units and rename() targets, which types cannot see.
            for (const alias of Object.keys(unit.needs)) {
                if (alias.startsWith('$')) {
                    throw new DotLifecycleError({
                        code: DotLifecycleErrorCode.ReservedServiceKey,
                        phase: 'configure',
                        plugin: unit.name,
                        message: `Unit "${unit.name}" declares needs alias "${alias}" — the "$" prefix is reserved ` +
                            `for kernel context keys ($app, $unit, $config). Rename the alias.`,
                    });
                }
            }
            for (const [localKey, wireKey] of Object.entries(unit.renames)) {
                if (wireKey.startsWith('$')) {
                    throw new DotLifecycleError({
                        code: DotLifecycleErrorCode.ReservedServiceKey,
                        phase: 'configure',
                        plugin: unit.name,
                        message: `Unit "${unit.name}" renames "${localKey}" to "${wireKey}" — the "$" prefix is ` +
                            `reserved for kernel context keys ($app, $unit, $config). Pick a different wire key.`,
                    });
                }
            }
            this.#records.set(unit.name, {
                plugin: unit,
                order,
                actions: [],
                projections: [],
                services: [],
                hooks: new Set(),
                provides: new Set(),
                publishedServices: {},
                booted: false,
                started: false,
                issues: [],
                lifecycleDiagnostics: [],
            });
        }
        this.#checkStaticCapabilities();
        // Initial empty manifest — filled in by `runConfigure`.
        this.#manifest = this.#buildManifest();
    }
    /**
     * Walk every unit's needs against the static `provides` handles of
     * every unit (features and adapters alike). A provider mounted later is
     * a ring when its own needs lead back to the consumer (E019), otherwise an
     * order error (E020). Satisfied needs become `dot explain`'s capability
     * edges and the providers' manifest `provides`, without booting. Only
     * needs no unit declares (erased graphs, dynamic bundle tokens) are
     * left to E012 at boot.
     */
    #checkStaticCapabilities() {
        const providerByKey = new Map();
        for (const record of this.#records.values()) {
            // The handles are wire-keyed already: rename() rebuilds them on the new keys.
            for (const wireKey of Object.keys(record.plugin.provides)) {
                record.provides.add(wireKey);
                if (!providerByKey.has(wireKey))
                    providerByKey.set(wireKey, record);
            }
        }
        if (providerByKey.size === 0)
            return;
        const staticNeeds = (record) => Object.entries(record.plugin.needs).flatMap(([alias, witness]) => {
            const key = wireKeyOf(witness, alias);
            const provider = providerByKey.get(key);
            return provider === undefined ? [] : [{ key, provider }];
        });
        /** The ring `start needs k1 ← p1 needs k2 ← … ← start`, or undefined when `from` never leads back. */
        const ringBack = (start, from, seen) => {
            if (from === start)
                return [start.plugin.name];
            if (seen.has(from.plugin.name))
                return undefined;
            seen.add(from.plugin.name);
            for (const need of staticNeeds(from)) {
                const rest = ringBack(start, need.provider, seen);
                if (rest !== undefined)
                    return [`${from.plugin.name} needs ${need.key}`, ...rest];
            }
            return undefined;
        };
        for (const record of this.#records.values()) {
            const label = record.plugin.role === 'feature' ? 'Feature' : 'Unit';
            for (const { key, provider } of staticNeeds(record)) {
                if (provider.order < record.order) {
                    if (!this.#wiringEdges.some(e => e.from === record.plugin.name && e.to === provider.plugin.name && e.key === key)) {
                        this.#wiringEdges.push({ from: record.plugin.name, to: provider.plugin.name, kind: 'requires', key });
                    }
                    continue;
                }
                const ring = ringBack(record, provider, new Set());
                if (ring !== undefined) {
                    throw new DotLifecycleError({
                        code: DotLifecycleErrorCode.CapabilityRing,
                        phase: 'configure',
                        plugin: record.plugin.name,
                        message: `${label} "${record.plugin.name}" needs "${key}", which comes back around to itself:\n` +
                            `  ${[`${record.plugin.name} needs ${key}`, ...ring].join(' ← ')}\n` +
                            'Break the ring: move the shared piece into a third feature both need, or let one side read through db.query instead of a handle.',
                    });
                }
                throw new DotLifecycleError({
                    code: DotLifecycleErrorCode.ProviderMountedLater,
                    phase: 'configure',
                    plugin: record.plugin.name,
                    message: `${label} "${record.plugin.name}" needs "${key}", which "${provider.plugin.name}" provides — ` +
                        `but "${provider.plugin.name}" is mounted after it (position ${(provider.order + 1).toString()}; ` +
                        `"${record.plugin.name}" is ${(record.order + 1).toString()}).\n` +
                        (provider.plugin.role === 'feature'
                            ? `Move "${provider.plugin.name}" before "${record.plugin.name}" in .features([...]).`
                            : `Mount "${provider.plugin.name}" with .infra() before "${record.plugin.name}".`),
                });
            }
        }
    }
    /**
     * Register a lifecycle observer. The returned function unregisters it.
     * Observers added through `subscribe()` see events emitted *after*
     * subscription only — to catch `configure` events, pass observers
     * through `defineApp(name, { observers })` at construction time.
     */
    subscribe(observer) {
        this.#observers.add(observer);
        return () => {
            this.#observers.delete(observer);
        };
    }
    /**
     * Fan out one event to every registered observer. Observer exceptions
     * are caught and DEBUG-logged so a misbehaving observer can never
     * break the lifecycle or hide an event from siblings.
     *
     * Hot-path note: when `#observers` is empty, the for-loop body never
     * runs — the per-event allocation in the caller (the event object) is
     * the only cost. The kernel never builds an event when no observers
     * are present; see {@link #emitIfObserved}.
     */
    #emit(event) {
        for (const observer of this.#observers) {
            try {
                observer(event);
            }
            catch (error) {
                kernelLog.debug('[{dot.app.name}] observer threw on {dot.event.kind}/{dot.event.status}', {
                    'dot.app.name': this.#appName,
                    'dot.event.kind': event.kind,
                    'dot.event.status': event.status,
                    error: error instanceof Error ? error : String(error),
                });
            }
        }
    }
    /**
     * Guarded emit. The event factory is only invoked when at least one
     * observer is registered — keeps the no-observer path allocation-free,
     * matching the kernel's zero-cost-when-off discipline (principle 5).
     */
    #emitIfObserved(makeEvent) {
        if (this.#observers.size === 0)
            return;
        this.#emit(makeEvent());
    }
    /**
     * Emit a single hook-level event. Skipped (zero allocation) when no
     * observers are registered.
     */
    #emitHook(phase, unit, order, status, opts) {
        if (this.#observers.size === 0)
            return;
        const event = {
            kind: 'unit-hook',
            phase,
            plugin: unit,
            order,
            status,
            appName: this.#appName,
            timestamp: Date.now(),
            ...(opts?.durationMs === undefined ? {} : { durationMs: opts.durationMs }),
            ...(opts?.error === undefined ? {} : { error: opts.error }),
        };
        this.#emit(event);
    }
    #registerAction(record, action) {
        let meta;
        if (action.meta !== undefined) {
            try {
                meta = toJsonObject(action.meta);
            }
            catch (error) {
                const issue = makeIssue({
                    code: DotLifecycleErrorCode.ActionMetaNotJson,
                    plugin: record.plugin.name,
                    message: `action "${action.id}" for binding "${action.binding}" has metadata that is not JSON-round-trip safe: ` +
                        stringifyError(error),
                    remediation: 'Only put JSON-serializable data in action meta. Convert Dates to strings, remove functions/undefined fields, and avoid NaN/Infinity.',
                    docsAnchor: 'action-meta-not-json',
                    metadata: { actionId: action.id, binding: action.binding },
                });
                record.issues.push(issue);
            }
        }
        const stamped = {
            id: action.id,
            plugin: record.plugin.name,
            binding: action.binding,
            direction: action.direction,
            ...(action.address === undefined ? {} : { address: action.address }),
            ...(action.summary === undefined ? {} : { summary: action.summary }),
            ...(meta === undefined ? {} : { meta }),
            ...(action.metaSchema === undefined ? {} : { metaSchema: action.metaSchema }),
        };
        for (const existingRecord of this.#records.values()) {
            const duplicate = existingRecord.actions.find(existing => existing.binding === stamped.binding && existing.id === stamped.id);
            if (duplicate === undefined)
                continue;
            const issue = makeIssue({
                code: DotLifecycleErrorCode.DuplicateAction,
                plugin: record.plugin.name,
                message: `action "${stamped.id}" is registered more than once for binding "${stamped.binding}".`,
                remediation: 'Action ids must be unique within a binding. Rename one action or move one of them to a different binding.',
                docsAnchor: 'duplicate-action',
                metadata: { binding: stamped.binding, id: stamped.id, firstUnit: duplicate.plugin },
            });
            record.issues.push(issue);
            break;
        }
        record.actions.push(stamped);
    }
    /** Replace an action with a copy carrying the new summary, so manifests taken earlier keep the old one. */
    #describeAction(record, phase, actionId, patch) {
        for (const owner of this.#records.values()) {
            const action = owner.actions.find(candidate => candidate.id === actionId &&
                (owner === record || record.projections.some(projection => projection.binding === candidate.binding)));
            if (action === undefined)
                continue;
            owner.actions.splice(owner.actions.indexOf(action), 1, { ...action, summary: patch.summary });
            return;
        }
        throw new DotLifecycleError({
            code: DotLifecycleErrorCode.ActionNotAmendable,
            phase,
            plugin: record.plugin.name,
            message: `Unit "${record.plugin.name}" cannot describe action "${actionId}": it is not one of its own actions, nor in a binding it registered a projection for. Call $describeAction only for actions the unit declared or whose binding it owns.`,
        });
    }
    #registerProjection(record, projection) {
        // Checked like an action's meta: the manifest is plain JSON, so a projection's meta must survive a round trip.
        const meta = projection.meta === undefined ? undefined : toJsonObject(projection.meta);
        record.projections.push({ ...projection, ...(meta === undefined ? {} : { meta }), plugin: record.plugin.name });
    }
    #registerRouteShim(record, route) {
        const meta = {};
        if (route.method !== undefined)
            meta['method'] = route.method;
        if (route.path !== undefined)
            meta['path'] = route.path;
        if (route.input !== undefined) {
            const input = {};
            if (route.input.query !== undefined)
                input['query'] = route.input.query;
            if (route.input.body !== undefined)
                input['body'] = route.input.body;
            if (Object.keys(input).length > 0)
                meta['input'] = input;
        }
        if (route.output !== undefined)
            meta['output'] = route.output;
        if (route.streaming !== undefined)
            meta['streaming'] = route.streaming;
        this.#registerAction(record, {
            id: route.id,
            binding: route.transport,
            direction: 'in',
            ...(route.path === undefined ? {} : { address: `${route.method ?? 'GET'} ${route.path}` }),
            ...(route.description === undefined ? {} : { summary: route.description }),
            ...(Object.keys(meta).length === 0 ? {} : { meta }),
        });
    }
    #actionFromSource(source) {
        if (hasToDotAction(source)) {
            return source.toDotAction();
        }
        return source;
    }
    /**
     * Wrap a sync phase body with starting/completed/failed observer events.
     * `configure` is the only sync phase in the kernel today — keep the
     * async variant separate (no monomorphisation cost on the hot path).
     */
    #withPhaseEmit(phase, fn) {
        const phaseStart = nowMs();
        this.#emitIfObserved(() => ({
            kind: 'phase',
            phase,
            status: 'starting',
            appName: this.#appName,
            timestamp: Date.now(),
        }));
        try {
            const result = fn();
            this.#emitIfObserved(() => ({
                kind: 'phase',
                phase,
                status: failed(result) ? 'failed' : 'completed',
                appName: this.#appName,
                durationMs: nowMs() - phaseStart,
                timestamp: Date.now(),
                ...(failed(result) ? { error: result } : {}),
            }));
            return result;
        }
        catch (error) {
            this.#emitIfObserved(() => ({
                kind: 'phase',
                phase,
                status: 'failed',
                appName: this.#appName,
                durationMs: nowMs() - phaseStart,
                error,
                timestamp: Date.now(),
            }));
            throw error;
        }
    }
    /** Async variant of {@link #withPhaseEmit}. */
    async #withPhaseEmitAsync(phase, fn) {
        const phaseStart = nowMs();
        this.#emitIfObserved(() => ({
            kind: 'phase',
            phase,
            status: 'starting',
            appName: this.#appName,
            timestamp: Date.now(),
        }));
        try {
            const result = await fn();
            if (failed(result)) {
                this.#emitIfObserved(() => ({
                    kind: 'phase',
                    phase,
                    status: 'failed',
                    appName: this.#appName,
                    durationMs: nowMs() - phaseStart,
                    error: result,
                    timestamp: Date.now(),
                }));
            }
            else {
                this.#emitIfObserved(() => ({
                    kind: 'phase',
                    phase,
                    status: 'completed',
                    appName: this.#appName,
                    durationMs: nowMs() - phaseStart,
                    timestamp: Date.now(),
                }));
            }
            return result;
        }
        catch (error) {
            this.#emitIfObserved(() => ({
                kind: 'phase',
                phase,
                status: 'failed',
                appName: this.#appName,
                durationMs: nowMs() - phaseStart,
                error,
                timestamp: Date.now(),
            }));
            throw error;
        }
    }
    get name() {
        return this.#appName;
    }
    get state() {
        return this.#state;
    }
    get services() {
        return this.#aggregatedServices;
    }
    get manifest() {
        return this.#manifest;
    }
    get diagnostics() {
        return this.#buildDiagnostics();
    }
    /**
     * Run the `configure` phase synchronously. Idempotent.
     *
     * @throws {DotLifecycleError} if any configure hook throws or returns a Promise.
     */
    runConfigure() {
        if (this.#configured)
            return;
        if (this.#state === 'failed' || this.#state === 'disposed') {
            return this.#reuseDefect('configure');
        }
        kernelLog.debug('[{dot.app.name}] registering {dot.app.unit.count} unit(s) in declaration order', {
            'dot.app.name': this.#appName,
            'dot.app.unit.count': this.#ordered.length,
        });
        const phaseLogger = this.#logger.with({ 'dot.app.phase': 'configure' });
        phaseLogger.debug('configure: starting', { 'dot.app.unit.count': this.#ordered.length });
        try {
            return this.#withPhaseEmit('configure', () => {
                return withPhaseSpan({
                    appName: this.#appName,
                    phase: 'configure',
                    unitCount: this.#ordered.length,
                }, span => this.#runConfigureInner(phaseLogger.withTrace(span.spanContext())));
            });
        }
        catch (error) {
            this.#state = 'failed';
            return UnexpectedDefect({ cause: error });
        }
    }
    /**
     * Activate the logging slot, once, before the first lifecycle record. A
     * factory that throws fails the app in `boot`.
     */
    #activateLogging() {
        const owner = this.#loggingUnit;
        if (owner?.logging === undefined || this.#logging !== undefined || this.#loggingClosed !== undefined)
            return;
        try {
            const result = owner.logging({ appName: this.#appName });
            if (!loggingHandle(result)) {
                this.#state = 'failed';
                const record = this.#records.get(owner.name);
                if (record !== undefined)
                    this.#recordHookFailure(record, 'boot', result, 0);
                return result;
            }
            this.#logging = result;
            return;
        }
        catch (error) {
            this.#state = 'failed';
            return UnexpectedDefect({
                cause: new DotLifecycleError({
                    code: DotLifecycleErrorCode.BootFailed,
                    phase: 'boot',
                    plugin: owner.name,
                    message: `logging slot of unit "${owner.name}" threw: ${stringifyError(error)}`,
                    cause: error,
                }),
            });
        }
    }
    /**
     * Close the logging slot, once, after the app's last lifecycle record.
     * Never rejects: a failed close is reported and returned to its owner.
     */
    #closeLogging() {
        if (this.#loggingClosed === undefined) {
            const handle = this.#logging;
            this.#logging = undefined;
            this.#loggingClosed =
                handle === undefined
                    ? Promise.resolve()
                    : (async () => {
                        try {
                            const result = await handle.close();
                            if (failed(result)) {
                                const record = this.#loggingUnit === undefined ? undefined : this.#records.get(this.#loggingUnit.name);
                                if (record !== undefined)
                                    this.#recordHookFailure(record, 'dispose', result, 0);
                                reportLoggingCloseFailure(result);
                                return result;
                            }
                        }
                        catch (error) {
                            const failure = UnexpectedDefect({
                                cause: new DotLifecycleError({
                                    code: DotLifecycleErrorCode.DisposeFailed,
                                    phase: 'dispose',
                                    plugin: this.#loggingUnit?.name,
                                    message: 'The logging slot failed to close.',
                                    cause: error,
                                }),
                            });
                            const record = this.#loggingUnit === undefined ? undefined : this.#records.get(this.#loggingUnit.name);
                            if (record !== undefined)
                                this.#recordHookFailure(record, 'dispose', failure, 0);
                            reportLoggingCloseFailure(error);
                            return failure;
                        }
                        return;
                    })();
        }
        return this.#loggingClosed;
    }
    /**
     * Inner configure loop. Separated from `runConfigure` so the phase span
     * wrapper can stay thin and the loop body stays unindented — keeps the
     * intricate error-handling readable.
     */
    #runConfigureInner(phaseLogger) {
        for (const unit of this.#ordered) {
            const record = this.#records.get(unit.name);
            let unitLogger = phaseLogger.with({ 'dot.unit.name': unit.name });
            const declaredStarted = nowMs();
            try {
                for (const source of unit.actions)
                    this.#registerAction(record, this.#actionFromSource(source));
            }
            catch (error) {
                const durationMs = nowMs() - declaredStarted;
                const issue = makeIssue({
                    code: DotLifecycleErrorCode.ConfigureFailed,
                    plugin: unit.name,
                    message: `action declaration threw for unit "${unit.name}": ${stringifyError(error)}`,
                    remediation: `Fix the action declarations of "${unit.name}". Declarative actions must be static and synchronous.`,
                    docsAnchor: 'configure-failed',
                });
                record.issues.push(issue);
                record.lifecycleDiagnostics.push({
                    plugin: unit.name,
                    hook: 'configure',
                    state: 'failed',
                    order: record.order,
                    durationMs,
                    issues: [issue],
                });
                this.#emitHook('configure', unit.name, record.order, 'failed', { durationMs, error });
                this.#state = 'failed';
                this.#manifest = this.#buildManifest();
                throw new DotLifecycleError({
                    code: DotLifecycleErrorCode.ConfigureFailed,
                    phase: 'configure',
                    plugin: unit.name,
                    message: issue.message,
                    cause: error,
                });
            }
            if (!unit.hooks.configure) {
                unitLogger.debug('configure: skipped (no hook)');
                continue;
            }
            record.hooks.add('configure');
            const ctx = {
                $telemetry: telemetryFor(unit),
                unitName: unit.name,
                appName: this.#appName,
                registerService: (name, kind) => {
                    record.services.push({ name, plugin: unit.name, kind });
                },
                registerAction: action => this.#registerAction(record, action),
                registerProjection: projection => this.#registerProjection(record, projection),
                describeAction: (actionId, patch) => this.#describeAction(record, 'configure', actionId, patch),
                registerRoute: route => this.#registerRouteShim(record, route),
                registerLifecycleHook: hook => {
                    record.hooks.add(hook);
                },
                declareProvides: (...caps) => {
                    for (const cap of caps)
                        record.provides.add(cap);
                },
            };
            const started = nowMs();
            this.#emitHook('configure', unit.name, record.order, 'starting');
            let returned;
            try {
                returned = withUnitHookSpan({
                    appName: this.#appName,
                    unitName: unit.name,
                    hook: 'configure',
                    order: record.order,
                }, span => {
                    // Later records of this unit's hook carry its span too.
                    unitLogger = unitLogger.withTrace(span.spanContext());
                    return unit.hooks.configure?.(ctx);
                });
                if (returned !== undefined && !failed(returned) && !isThenable(returned)) {
                    throw new Error('configure must return undefined or a Failure', { cause: returned });
                }
            }
            catch (error) {
                const durationMs = nowMs() - started;
                const issue = makeIssue({
                    code: DotLifecycleErrorCode.ConfigureFailed,
                    plugin: unit.name,
                    message: `configure hook threw for unit "${unit.name}": ${stringifyError(error)}`,
                    remediation: `Fix the error in the configure() hook of "${unit.name}". configure() is for synchronous registration only — avoid throwing on declarative work.`,
                    docsAnchor: 'configure-failed',
                });
                record.issues.push(issue);
                record.lifecycleDiagnostics.push({
                    plugin: unit.name,
                    hook: 'configure',
                    state: 'failed',
                    order: record.order,
                    durationMs,
                    issues: [issue],
                });
                this.#emitHook('configure', unit.name, record.order, 'failed', { durationMs, error });
                this.#state = 'failed';
                this.#manifest = this.#buildManifest();
                throw new DotLifecycleError({
                    code: DotLifecycleErrorCode.ConfigureFailed,
                    phase: 'configure',
                    plugin: unit.name,
                    message: issue.message,
                    cause: error,
                });
            }
            if (isThenable(returned)) {
                // Reject async configure immediately, but observe already-started work.
                void Promise.resolve(returned).catch(() => {
                    /* The invalid configure result is already reported below. */
                });
                const durationMs = nowMs() - started;
                const issue = makeIssue({
                    code: DotLifecycleErrorCode.ConfigureAsync,
                    plugin: unit.name,
                    message: `configure hook of unit "${unit.name}" returned a Promise. configure must be synchronous.`,
                    remediation: 'Move async work to the boot() hook. configure() is for synchronous registration only.',
                    docsAnchor: 'configure-async',
                });
                record.issues.push(issue);
                record.lifecycleDiagnostics.push({
                    plugin: unit.name,
                    hook: 'configure',
                    state: 'failed',
                    order: record.order,
                    durationMs,
                    issues: [issue],
                });
                this.#emitHook('configure', unit.name, record.order, 'failed', {
                    durationMs,
                    error: new Error(issue.message),
                });
                this.#state = 'failed';
                this.#manifest = this.#buildManifest();
                throw new DotLifecycleError({
                    code: DotLifecycleErrorCode.ConfigureAsync,
                    phase: 'configure',
                    plugin: unit.name,
                    message: issue.message,
                });
            }
            if (failed(returned)) {
                this.#recordHookFailure(record, 'configure', returned, nowMs() - started);
                this.#state = 'failed';
                this.#manifest = this.#buildManifest();
                return returned;
            }
            const durationMs = nowMs() - started;
            record.lifecycleDiagnostics.push({
                plugin: unit.name,
                hook: 'configure',
                state: 'configured',
                order: record.order,
                durationMs,
                issues: [],
            });
            this.#emitHook('configure', unit.name, record.order, 'completed', { durationMs });
            unitLogger.debug('configure: done', { 'dot.unit.duration.ms': durationMs });
        }
        // Also declare lifecycle-hook participation for non-configure hooks present
        // on the unit object, so the manifest reflects them.
        for (const unit of this.#ordered) {
            const record = this.#records.get(unit.name);
            if (unit.hooks.boot || Object.keys(unit.factories).length > 0)
                record.hooks.add('boot');
            if (unit.hooks.start)
                record.hooks.add('start');
            if (unit.hooks.stop)
                record.hooks.add('stop');
            if (unit.hooks.dispose)
                record.hooks.add('dispose');
        }
        this.#configured = true;
        this.#state = 'configured';
        this.#manifest = this.#buildManifest();
        phaseLogger.debug('configure: complete', { 'dot.app.unit.count': this.#ordered.length });
    }
    /**
     * Run one lifecycle transition after all previously enqueued ones.
     * The chain itself never rejects — each link swallows its error for
     * the *next* link only; the caller still receives the original
     * rejection through the returned promise.
     */
    #enqueueTransition(run) {
        const result = this.#transitionChain.then(run);
        // The chain link settles even when the transition fails — the caller
        // still sees the original rejection through `result`.
        this.#transitionChain = result.catch(() => null);
        return result;
    }
    /** Public boot() — idempotent + concurrent-safe. */
    async boot() {
        if (this.#bootInflight)
            return this.#bootInflight;
        this.#bootInflight = this.#enqueueTransition(() => this.#bootTransition()).finally(() => {
            this.#bootInflight = null;
        });
        return this.#bootInflight;
    }
    /** State checks + boot body. Runs at the head of the transition queue. */
    async #bootTransition() {
        if (this.#state === 'failed' || this.#state === 'disposed') {
            return this.#reuseDefect('boot');
        }
        if (this.#state === 'booted' || this.#state === 'started' || this.#state === 'stopped') {
            return;
        }
        const configured = this.runConfigure();
        if (failed(configured))
            return configured;
        return this.#runBoot();
    }
    /** Boot an already configured app, without reaching configure callbacks. */
    bootConfigured() {
        if (this.#bootConfiguredInflight)
            return this.#bootConfiguredInflight;
        this.#bootConfiguredInflight = this.#enqueueTransition(async () => {
            if (this.#state === 'failed' || this.#state === 'disposed')
                return this.#reuseDefect('boot');
            if (this.#state !== 'configured')
                return;
            return this.#runBoot();
        }).finally(() => {
            this.#bootConfiguredInflight = null;
        });
        return this.#bootConfiguredInflight;
    }
    async #runBoot() {
        try {
            const activated = this.#activateLogging();
            if (failed(activated))
                return activated;
        }
        catch (error) {
            return UnexpectedDefect({ cause: error });
        }
        const phaseLogger = this.#logger.with({ 'dot.app.phase': 'boot' });
        phaseLogger.debug('boot: starting', { 'dot.app.unit.count': this.#ordered.length });
        return this.#withPhaseEmitAsync('boot', () => withPhaseSpan({
            appName: this.#appName,
            phase: 'boot',
            unitCount: this.#ordered.length,
        }, span => this.#runBootInner(phaseLogger.withTrace(span.spanContext()))));
    }
    /**
     * Resolve a unit's needs into a hook context (alias-keyed), joined with
     * the `$`-prefixed kernel keys and — for post-boot hooks — the unit's own
     * published services (local keys).
     *
     * @throws {DotLifecycleError} `ARKI_DOT_E012` when a need has no
     *   provider among earlier-booted units. Teardown hooks can never hit
     *   this: the service map only grows, and reverse-order teardown keeps
     *   providers alive until their consumers are done.
     */
    #buildHookCtx(record, phase, includeOwnProvides, signal) {
        const ctx = {
            $app: this.#appName,
            $unit: record.plugin.name,
            $telemetry: telemetryFor(record.plugin),
            $handlers: handlerObserverFor({
                appName: this.#appName,
                feature: record.plugin.name,
                hasObservers: () => this.#observers.size > 0,
                emit: event => this.#emit(event),
            }),
            $config: this.#config,
            $signal: signal,
            $describeAction: (actionId, patch) => this.#describeAction(record, phase, actionId, patch),
        };
        for (const [alias, witness] of Object.entries(record.plugin.needs)) {
            const wireKey = wireKeyOf(witness, alias);
            if (!this.#serviceMap.has(wireKey)) {
                throw new DotLifecycleError({
                    code: DotLifecycleErrorCode.UnsatisfiedNeed,
                    phase,
                    plugin: record.plugin.name,
                    message: `Unit "${record.plugin.name}" needs service "${wireKey}" but no earlier unit provides it. ` +
                        `Register a provider with .infra() before this unit. Services flow strictly forward — ` +
                        `if a later unit provides "${wireKey}", move that provider earlier; if two units need ` +
                        `each other's services, that is a cycle: merge them or extract the shared piece into ` +
                        `a third unit both consume.`,
                });
            }
            const value = this.#serviceMap.get(wireKey);
            // A lazy-lifting witness (`service.lazy<T>()`) always receives a
            // handle: lazy provides pass through, eager provides are lifted into
            // a pre-initialized wrapper. The wrapper is created per-injection and
            // never published, so the kernel's auto-dispose does not touch it —
            // the underlying value's lifecycle stays with its provider.
            ctx[alias] = isLazyWitness(witness) && !isLazy(value) ? lazyOf(value) : value;
            const provider = this.#providerByWireKey.get(wireKey);
            if (provider !== undefined && !this.#wiringEdges.some(e => e.from === record.plugin.name && e.to === provider)) {
                this.#wiringEdges.push({ from: record.plugin.name, to: provider, kind: 'requires' });
            }
        }
        if (includeOwnProvides) {
            Object.assign(ctx, record.publishedServices);
        }
        return ctx;
    }
    /**
     * Request cancellation when the injected Clock reaches the hook budget.
     * Owned work must settle before cleanup; JavaScript that ignores its signal
     * cannot be forcibly stopped. Construction reports canonical Deadline, while
     * legacy hooks retain the lifecycle timeout diagnostic after they settle.
     */
    async #withHookBudget(unitName, hook, hookAbort, run) {
        const budget = this.#hookTimeoutMs;
        if (budget === undefined)
            return run();
        let timeout;
        const cancel = this.#clock.setTimer(() => {
            timeout = new DotLifecycleError({
                code: DotLifecycleErrorCode.HookTimeout,
                phase: hook,
                plugin: unitName,
                message: `${hook} hook of unit "${unitName}" exceeded its ${budget}ms budget; cancellation was requested and owned work must settle before cleanup.`,
            });
            hookAbort.abort(timeout);
        }, budget);
        try {
            const result = await run();
            // Owned construction reports the canonical deadline after joining its scope.
            if (timeout !== undefined && !isFailure(result))
                throw timeout;
            return result;
        }
        finally {
            cancel();
        }
    }
    /**
     * Inner boot loop. Separated from `#runBoot` so the phase span wrapper
     * stays thin and the loop body — which orchestrates rollback on
     * partial failure — stays unindented.
     */
    async #runBootInner(phaseLogger) {
        const bootedRecords = [];
        /** Shared failure path: mark diagnostics, roll back, throw. */
        const fail = async (args) => {
            const issue = makeIssue({
                code: args.code,
                plugin: args.record.plugin.name,
                message: args.message,
                remediation: args.remediation,
                docsAnchor: args.docsAnchor,
            });
            args.record.issues.push(issue);
            args.record.lifecycleDiagnostics.push({
                plugin: args.record.plugin.name,
                hook: 'boot',
                state: 'failed',
                order: args.record.order,
                durationMs: args.durationMs,
                issues: [issue],
            });
            this.#emitHook('boot', args.record.plugin.name, args.record.order, 'failed', {
                durationMs: args.durationMs,
                error: args.cause ?? new Error(args.message),
            });
            phaseLogger.error('boot: FAILED — rolling back already-booted units', {
                'dot.unit.name': args.record.plugin.name,
                'dot.app.rollback.count': args.rollback.length,
            });
            const disposeFailures = await this.#runDisposeForRecords(reverseRecords(args.rollback), phaseLogger);
            const logging = await this.#closeLogging();
            if (failed(logging))
                disposeFailures.failures.push(logging);
            this.#state = 'failed';
            this.#manifest = this.#buildManifest();
            return startupOutcome(UnexpectedDefect({
                cause: new DotLifecycleError({
                    code: args.code,
                    phase: 'boot',
                    plugin: args.record.plugin.name,
                    message: args.message,
                    cause: args.cause,
                }),
            }), disposeFailures.failures);
        };
        for (const unit of this.#ordered) {
            const record = this.#records.get(unit.name);
            let unitLogger = phaseLogger.with({ 'dot.unit.name': unit.name });
            const started = nowMs();
            // Resolve needs BEFORE invoking the hook — a unit with needs but no
            // boot hook still fails fast when its wiring is unsatisfied.
            let ctx;
            const hookAbort = new AbortController();
            try {
                ctx = this.#buildHookCtx(record, 'boot', false, hookAbort.signal);
            }
            catch (error) {
                const message = error instanceof DotLifecycleError ? error.message : stringifyError(error);
                return fail({
                    record,
                    code: DotLifecycleErrorCode.UnsatisfiedNeed,
                    message,
                    remediation: `Add a provider for the missing service with .infra() before "${unit.name}", or rename an ` +
                        `existing provider's keys to match. If a later unit provides it, reorder — services flow ` +
                        `strictly forward. Mutual needs between two units are a cycle: merge them or extract the ` +
                        `shared piece into a third unit both consume.`,
                    docsAnchor: 'unsatisfied-need',
                    durationMs: nowMs() - started,
                    rollback: bootedRecords,
                });
            }
            const bootHook = unit.hooks.boot;
            const factories = Object.entries(unit.factories);
            if (!bootHook && factories.length === 0) {
                record.booted = true;
                bootedRecords.push(record);
                unitLogger.debug('boot: skipped (no hook)');
                continue;
            }
            record.hooks.add('boot');
            this.#emitHook('boot', unit.name, record.order, 'starting');
            let construction;
            try {
                construction = await this.#withHookBudget(unit.name, 'boot', hookAbort, () => withUnitHookSpan({ appName: this.#appName, unitName: unit.name, hook: 'boot', order: record.order }, span => {
                    unitLogger = unitLogger.withTrace(span.spanContext());
                    return unit.runtime.construct(unit.factories, bootHook, ctx, { deadline: hookAbort.signal }, value => {
                        if (this.#lazyOwners.has(value))
                            return false;
                        this.#lazyOwners.add(value);
                        return true;
                    });
                }));
            }
            catch (error) {
                construction = this.#hookDefect('boot', unit.name, error);
            }
            if (!constructed(construction)) {
                const timedOut = Deadline.is(construction);
                const durationMs = nowMs() - started;
                const issue = makeIssue({
                    code: timedOut ? DotLifecycleErrorCode.HookTimeout : DotLifecycleErrorCode.BootFailed,
                    plugin: unit.name,
                    message: `Unit "${unit.name}" construction failed: ${construction.message}`,
                    remediation: construction.remediation ?? 'Inspect the unit failure and its owned cleanup outcomes.',
                    docsAnchor: timedOut ? 'hook-timeout' : 'boot-failed',
                    metadata: { phase: 'boot', owner: unit.name, failureCode: construction.code },
                });
                record.issues.push(issue);
                record.lifecycleDiagnostics.push({
                    plugin: unit.name,
                    hook: 'boot',
                    state: 'failed',
                    order: record.order,
                    durationMs,
                    issues: [issue],
                });
                this.#emitHook('boot', unit.name, record.order, 'failed', { durationMs, error: construction });
                unitLogger.error('boot: FAILED — closing owned scopes', { 'dot.unit.name': unit.name });
                const cleanup = await this.#runDisposeForRecords(reverseRecords(bootedRecords), phaseLogger);
                const logging = await this.#closeLogging();
                if (failed(logging))
                    cleanup.failures.push(logging);
                this.#state = 'failed';
                this.#manifest = this.#buildManifest();
                return startupOutcome(construction, cleanup.failures);
            }
            record.lifetime = construction;
            const result = construction.services;
            const publishedServices = result;
            record.publishedServices = publishedServices;
            record.booted = true;
            for (const localKey of Object.keys(publishedServices)) {
                const wireKey = unit.renames[localKey] ?? localKey;
                if (localKey.startsWith('$') || wireKey.startsWith('$')) {
                    // The infra() constraint bans this at compile time; erased units can
                    // still reach here. A `$` publish would shadow $app/$unit/$config
                    // in the unit's own post-boot hook contexts.
                    return fail({
                        record,
                        code: DotLifecycleErrorCode.ReservedServiceKey,
                        message: `Unit "${unit.name}" publishes service "${wireKey}" — the "$" prefix is reserved ` +
                            `for kernel context keys ($app, $unit, $config).`,
                        remediation: `Rename the "${wireKey}" provides key of "${unit.name}" — "$"-prefixed keys would shadow the kernel context.`,
                        docsAnchor: 'reserved-service-key',
                        durationMs: nowMs() - started,
                        rollback: [...bootedRecords, record],
                    });
                }
                if (this.#serviceMap.has(wireKey)) {
                    const owner = this.#providerByWireKey.get(wireKey) ?? 'unknown';
                    // The current unit HAS booted — include it in the rollback.
                    return fail({
                        record,
                        code: DotLifecycleErrorCode.ServiceCollision,
                        message: `Unit "${unit.name}" publishes service "${wireKey}" which unit "${owner}" already provides.`,
                        remediation: `Mount one of the two with rename(unit, { '${wireKey}': '<newKey>' }) to keep both instances, or remove the duplicate provider.`,
                        docsAnchor: 'service-collision',
                        durationMs: nowMs() - started,
                        rollback: [...bootedRecords, record],
                    });
                }
            }
            for (const [localKey, value] of Object.entries(publishedServices)) {
                const wireKey = unit.renames[localKey] ?? localKey;
                this.#serviceMap.set(wireKey, value);
                this.#providerByWireKey.set(wireKey, unit.name);
                this.#aggregatedServices[wireKey] = value;
                record.provides.add(wireKey);
            }
            bootedRecords.push(record);
            const durationMs = nowMs() - started;
            record.lifecycleDiagnostics.push({
                plugin: unit.name,
                hook: 'boot',
                state: 'booted',
                order: record.order,
                durationMs,
                issues: [],
            });
            this.#emitHook('boot', unit.name, record.order, 'completed', { durationMs });
            unitLogger.debug('boot: done', {
                'dot.unit.duration.ms': durationMs,
                'dot.unit.services.published': Object.keys(publishedServices).length,
            });
        }
        this.#state = 'booted';
        this.#manifest = this.#buildManifest();
        phaseLogger.debug('boot: complete', { 'dot.app.unit.count': this.#ordered.length });
    }
    /** Public start(). Boots first if needed. Idempotent + concurrent-safe. */
    async start() {
        if (this.#startInflight)
            return this.#startInflight;
        this.#startInflight = this.#enqueueTransition(async () => {
            const configured = this.runConfigure();
            if (failed(configured))
                return configured;
            return this.#startTransition();
        }).finally(() => {
            this.#startInflight = null;
        });
        return this.#startInflight;
    }
    /** Start an already configured app; configure failures are unreachable. */
    startConfigured() {
        if (this.#startConfiguredInflight)
            return this.#startConfiguredInflight;
        this.#startConfiguredInflight = this.#enqueueTransition(() => this.#startTransition()).finally(() => {
            this.#startConfiguredInflight = null;
        });
        return this.#startConfiguredInflight;
    }
    /** Start an already booted app; configure and boot failures are unreachable. */
    startBooted() {
        if (this.#startBootedInflight)
            return this.#startBootedInflight;
        this.#startBootedInflight = this.#enqueueTransition(() => this.#startBootedTransition()).finally(() => {
            this.#startBootedInflight = null;
        });
        return this.#startBootedInflight;
    }
    /** State checks + start body. Runs at the head of the transition queue. */
    async #startTransition() {
        if (this.#state === 'failed' || this.#state === 'disposed') {
            return this.#reuseDefect('start');
        }
        if (this.#state === 'started')
            return;
        if (this.#state === 'defined' || this.#state === 'configured') {
            // Direct #runBoot — we already hold the head of the transition
            // queue; going through public boot() would enqueue behind
            // ourselves and deadlock.
            const booted = await this.#runBoot();
            if (failed(booted))
                return booted;
        }
        return this.#startBootedTransition();
    }
    async #startBootedTransition() {
        if (this.#state === 'failed' || this.#state === 'disposed')
            return this.#reuseDefect('start');
        if (this.#state === 'started')
            return;
        // From booted or stopped, run start hooks.
        const phaseLogger = this.#logger.with({ 'dot.app.phase': 'start' });
        phaseLogger.debug('start: starting', { 'dot.app.unit.count': this.#ordered.length });
        return this.#withPhaseEmitAsync('start', () => withPhaseSpan({
            appName: this.#appName,
            phase: 'start',
            unitCount: this.#ordered.length,
        }, span => this.#runStartInner(phaseLogger.withTrace(span.spanContext()))));
    }
    /**
     * Inner start loop. Separated from `start()` so the phase span wrapper
     * stays thin and the rollback-cascade error path stays readable.
     */
    async #runStartInner(phaseLogger) {
        const startedRecords = [];
        for (const unit of this.#ordered) {
            const record = this.#records.get(unit.name);
            const unitLogger = phaseLogger.with({ 'dot.unit.name': unit.name });
            if (!unit.hooks.start) {
                record.started = true;
                startedRecords.push(record);
                unitLogger.debug('start: skipped (no hook)');
                continue;
            }
            record.hooks.add('start');
            const result = await this.#runHook(record, 'start', unitLogger);
            if (failed(result)) {
                unitLogger.error('start: FAILED — rolling back', { 'dot.app.rollback.started.count': startedRecords.length });
                const stopFailures = await this.#runStopForRecords(reverseRecords(startedRecords), phaseLogger);
                const bootedForDispose = this.#ordered.map(p => this.#records.get(p.name)).filter(r => r.booted);
                const disposeFailures = await this.#runDisposeForRecords(reverseRecords(bootedForDispose), phaseLogger);
                const logging = await this.#closeLogging();
                if (failed(logging))
                    disposeFailures.failures.push(logging);
                this.#state = 'failed';
                this.#manifest = this.#buildManifest();
                return startupOutcome(result, [...stopFailures, ...disposeFailures.failures]);
            }
            record.started = true;
            startedRecords.push(record);
        }
        this.#state = 'started';
        this.#manifest = this.#buildManifest();
        phaseLogger.debug('start: complete', { 'dot.app.unit.count': this.#ordered.length });
    }
    /** Public stop(). Idempotent + concurrent-safe. */
    async stop() {
        if (this.#stopInflight)
            return this.#stopInflight;
        this.#stopInflight = this.#enqueueTransition(() => this.#stopTransition()).finally(() => {
            this.#stopInflight = null;
        });
        return this.#stopInflight;
    }
    /** State checks + stop body. Runs at the head of the transition queue. */
    async #stopTransition() {
        // stop() after dispose is a no-op (idempotent across terminal states only
        // for `disposed`; `failed` was already cleaned up).
        if (this.#state === 'disposed')
            return;
        if (this.#state === 'failed')
            return this.#reuseDefect('stop');
        // For non-started states (defined/configured/booted/stopped): no-op.
        if (this.#state !== 'started') {
            // Mark booted as "stopped" for state-machine clarity.
            if (this.#state === 'booted')
                this.#state = 'stopped';
            return;
        }
        return this.#runStop();
    }
    async #runStop() {
        const phaseLogger = this.#logger.with({ 'dot.app.phase': 'stop' });
        phaseLogger.debug('stop: starting', { 'dot.app.unit.count': this.#ordered.length });
        return this.#withPhaseEmitAsync('stop', () => withPhaseSpan({
            appName: this.#appName,
            phase: 'stop',
            unitCount: this.#ordered.length,
        }, async (span) => {
            const tracedLogger = phaseLogger.withTrace(span.spanContext());
            const startedRecords = this.#ordered.map(p => this.#records.get(p.name)).filter(r => r.started);
            const failures = await this.#runStopForRecords(reverseRecords(startedRecords), tracedLogger);
            this.#state = 'stopped';
            this.#manifest = this.#buildManifest();
            if (failures.length > 0) {
                tracedLogger.warn('stop: complete with failures', { 'dot.app.failure.count': failures.length });
                return closeOutcome(failures);
            }
            tracedLogger.debug('stop: complete', { 'dot.app.unit.count': this.#ordered.length });
            return;
        }));
    }
    async #runStopForRecords(records, phaseLogger) {
        const failures = [];
        for (const record of records) {
            if (record.plugin.hooks.stop) {
                const result = await this.#runHook(record, 'stop', phaseLogger.with({ 'dot.unit.name': record.plugin.name }));
                if (failed(result))
                    failures.push(result);
            }
            record.started = false;
        }
        return failures;
    }
    /** Public dispose(). Idempotent + concurrent-safe. */
    async dispose() {
        if (this.#disposeInflight)
            return this.#disposeInflight;
        this.#disposeInflight = this.#enqueueTransition(() => this.#disposeTransition());
        return this.#disposeInflight;
    }
    /** State check + dispose body. Runs at the head of the transition queue. */
    async #disposeTransition() {
        if (this.#state === 'disposed')
            return;
        return this.#runDispose();
    }
    async #runDispose() {
        const phaseLogger = this.#logger.with({ 'dot.app.phase': 'dispose' });
        phaseLogger.debug('dispose: starting', { 'dot.app.unit.count': this.#ordered.length });
        return this.#withPhaseEmitAsync('dispose', () => withPhaseSpan({
            appName: this.#appName,
            phase: 'dispose',
            unitCount: this.#ordered.length,
        }, span => this.#runDisposeInner(phaseLogger.withTrace(span.spanContext()))));
    }
    /**
     * Inner dispose orchestration. Separated from `#runDispose` so the
     * phase span wrapper stays thin and the multi-state cascade (started
     * → stop+dispose, failed → no-op, default → dispose-only) stays
     * readable.
     */
    async #runDisposeInner(phaseLogger) {
        const failures = [];
        if (this.#state === 'started') {
            const startedRecords = this.#ordered.map(p => this.#records.get(p.name)).filter(r => r.started);
            failures.push(...(await this.#runStopForRecords(reverseRecords(startedRecords), phaseLogger)));
            this.#state = 'stopped';
        }
        if (this.#state !== 'failed') {
            const bootedRecords = this.#ordered.map(p => this.#records.get(p.name)).filter(r => r.booted);
            const disposal = await this.#runDisposeForRecords(reverseRecords(bootedRecords), phaseLogger);
            failures.push(...disposal.failures);
        }
        const failedStartup = this.#state === 'failed';
        phaseLogger.debug('dispose: complete', { 'dot.app.failure.count': failures.length });
        if (!failedStartup) {
            const logging = await this.#closeLogging();
            if (failed(logging))
                failures.push(logging);
        }
        this.#state = 'disposed';
        this.#manifest = this.#buildManifest();
        return closeOutcome(failures);
    }
    async #runDisposeForRecords(records, phaseLogger) {
        const failures = [];
        for (const record of records) {
            const lifetime = record.lifetime;
            // Quiesce joins tasks before user finalizers. close() owns the final
            // task/resource result, so its result is recorded exactly once below.
            if (lifetime !== undefined) {
                try {
                    // eslint-disable-next-line failure/must-use -- close() below returns the retained primary failures together with cleanup failures exactly once.
                    await lifetime.quiesce();
                }
                catch (error) {
                    const failure = this.#hookDefect('dispose', record.plugin.name, error);
                    failures.push(failure);
                    this.#recordHookFailure(record, 'dispose', failure, 0);
                }
            }
            if (record.plugin.hooks.dispose) {
                const result = await this.#runHook(record, 'dispose', phaseLogger.with({ 'dot.unit.name': record.plugin.name }));
                if (failed(result))
                    failures.push(result);
            }
            if (lifetime !== undefined) {
                const startedAt = nowMs();
                try {
                    const result = await lifetime.close();
                    if (failed(result)) {
                        failures.push(result);
                        this.#recordHookFailure(record, 'dispose', result, nowMs() - startedAt);
                    }
                }
                catch (error) {
                    const failure = this.#hookDefect('dispose', record.plugin.name, error);
                    failures.push(failure);
                    this.#recordHookFailure(record, 'dispose', failure, nowMs() - startedAt);
                }
                finally {
                    record.lifetime = undefined;
                }
            }
            record.booted = false;
        }
        return { failures };
    }
    #hookDefect(phase, unit, error) {
        const code = phase === 'boot'
            ? DotLifecycleErrorCode.BootFailed
            : phase === 'start'
                ? DotLifecycleErrorCode.StartFailed
                : phase === 'stop'
                    ? DotLifecycleErrorCode.StopFailed
                    : DotLifecycleErrorCode.DisposeFailed;
        const diagnostic = error instanceof DotLifecycleError
            ? error
            : new DotLifecycleError({
                code,
                phase,
                plugin: unit,
                message: `${phase} hook threw for unit "${unit}": ${stringifyError(error)}`,
                cause: error,
            });
        return diagnostic.code === DotLifecycleErrorCode.HookTimeout
            ? Deadline({ cause: diagnostic })
            : UnexpectedDefect({ cause: diagnostic });
    }
    #recordHookFailure(record, phase, failure, durationMs) {
        const code = Deadline.is(failure)
            ? DotLifecycleErrorCode.HookTimeout
            : phase === 'configure'
                ? DotLifecycleErrorCode.ConfigureFailed
                : phase === 'boot'
                    ? DotLifecycleErrorCode.BootFailed
                    : phase === 'start'
                        ? DotLifecycleErrorCode.StartFailed
                        : phase === 'stop'
                            ? DotLifecycleErrorCode.StopFailed
                            : DotLifecycleErrorCode.DisposeFailed;
        const issue = makeIssue({
            code,
            plugin: record.plugin.name,
            message: `${phase} failed for unit "${record.plugin.name}": ${failure.message}`,
            remediation: failure.remediation ?? 'Inspect the returned failure and the unit hook.',
            docsAnchor: phase + '-failed',
            metadata: { phase, owner: record.plugin.name, failureCode: failure.code },
        });
        record.issues.push(issue);
        record.lifecycleDiagnostics.push({
            plugin: record.plugin.name,
            hook: phase,
            state: 'failed',
            order: record.order,
            durationMs,
            issues: [issue],
        });
        this.#emitHook(phase, record.plugin.name, record.order, 'failed', { durationMs, error: failure });
    }
    async #runHook(record, phase, logger) {
        record.hooks.add(phase);
        const startedAt = nowMs();
        const hookAbort = new AbortController();
        this.#emitHook(phase, record.plugin.name, record.order, 'starting');
        let result;
        try {
            const ctx = this.#buildHookCtx(record, phase, true, hookAbort.signal);
            result = await this.#withHookBudget(record.plugin.name, phase, hookAbort, async () => withUnitHookSpan({ appName: this.#appName, unitName: record.plugin.name, hook: phase, order: record.order }, span => {
                logger = logger.withTrace(span.spanContext());
                return record.plugin.hooks[phase]?.(ctx);
            }));
            if (result !== undefined && !failed(result)) {
                throw new Error(`${phase} must return undefined or a Failure`, { cause: result });
            }
        }
        catch (error) {
            result = this.#hookDefect(phase, record.plugin.name, error);
        }
        const durationMs = nowMs() - startedAt;
        if (failed(result)) {
            this.#recordHookFailure(record, phase, result, durationMs);
            logger.error(phase + ': failed', { 'dot.unit.failure.code': result.code });
        }
        else {
            record.lifecycleDiagnostics.push({
                plugin: record.plugin.name,
                hook: phase,
                state: phase === 'start' ? 'started' : phase === 'stop' ? 'stopped' : 'disposed',
                order: record.order,
                durationMs,
                issues: [],
            });
            this.#emitHook(phase, record.plugin.name, record.order, 'completed', { durationMs });
            logger.debug(phase + ': done', { 'dot.unit.duration.ms': durationMs });
        }
        return result;
    }
    #reuseDefect(phase) {
        return UnexpectedDefect({ cause: this.#reuseError(phase) });
    }
    #reuseError(phase) {
        const code = this.#state === 'disposed' ? DotLifecycleErrorCode.ReuseAfterDispose : DotLifecycleErrorCode.ReuseAfterFailure;
        const reason = this.#state === 'disposed' ? 'disposed' : 'failed';
        return new DotLifecycleError({
            code,
            phase,
            message: `Cannot ${phase}() — app "${this.#appName}" is ${reason}. Create a fresh app instance.`,
        });
    }
    #buildManifest() {
        const units = [];
        const actions = [];
        const services = [];
        const lifecycle = [];
        const projections = [];
        // Capability edges between features are derived at construction from
        // static `provides` (keyed); the rest are observed at boot time: consumer
        // unit → the unit whose published wire key satisfied its need. The
        // per-unit `dependencies` array (wire-key strings) is the declarative view.
        const dependencies = this.#wiringEdges.map(e => ({ ...e }));
        for (const unit of this.#ordered) {
            const record = this.#records.get(unit.name);
            const needWireKeys = Object.entries(unit.needs).map(([alias, witness]) => wireKeyOf(witness, alias));
            units.push({
                name: unit.name,
                ...(unit.role === undefined ? {} : { role: unit.role }),
                dependencies: needWireKeys,
                provides: [...record.provides],
            });
            actions.push(...record.actions);
            services.push(...record.services);
            projections.push(...record.projections);
            lifecycle.push({
                plugin: unit.name,
                hooks: [...record.hooks],
            });
        }
        return {
            manifestVersion: 2,
            app: {
                name: this.#appName,
                version: this.#appVersion,
            },
            plugins: units,
            actions,
            services,
            lifecycle,
            dependencies,
            projections,
        };
    }
    #buildDiagnostics() {
        const unitDiagnostics = [];
        const actionDiagnostics = [];
        const serviceDiagnostics = [];
        const lifecycleDiagnostics = [];
        const issues = [];
        for (const unit of this.#ordered) {
            const record = this.#records.get(unit.name);
            // Per-unit status: failed if any issue with severity error exists, ok otherwise.
            const hasError = record.issues.some(i => i.severity === 'error');
            const status = hasError ? 'failed' : 'ok';
            unitDiagnostics.push({
                plugin: unit.name,
                status,
                issues: [...record.issues],
            });
            for (const action of record.actions) {
                actionDiagnostics.push({
                    id: action.id,
                    plugin: unit.name,
                    binding: action.binding,
                    ...(action.summary === undefined ? {} : { summary: action.summary }),
                    status: hasError ? 'failed' : 'ok',
                    issues: [],
                });
            }
            for (const svc of record.services) {
                serviceDiagnostics.push({
                    service: svc.name,
                    plugin: unit.name,
                    status: hasError
                        ? 'failed'
                        : record.booted || this.#state === 'defined' || this.#state === 'configured'
                            ? 'ok'
                            : 'ok',
                    issues: [],
                });
            }
            lifecycleDiagnostics.push(...record.lifecycleDiagnostics);
            issues.push(...record.issues);
        }
        return {
            snapshotVersion: 2,
            generatedAt: new Date().toISOString(),
            app: {
                name: this.#appName,
                state: this.#state,
            },
            plugins: unitDiagnostics,
            actions: actionDiagnostics,
            services: serviceDiagnostics,
            lifecycle: lifecycleDiagnostics,
            issues,
        };
    }
}
function isThenable(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'then' in value &&
        typeof value.then === 'function');
}
function stringifyError(error) {
    if (error instanceof Error)
        return error.message;
    if (typeof error === 'string')
        return error;
    try {
        return JSON.stringify(error);
    }
    catch {
        return String(error);
    }
}
function reverseRecords(records) {
    return [...records].reverse();
}
function hasToDotAction(source) {
    return (typeof source === 'object' && source !== null && 'toDotAction' in source && typeof source.toDotAction === 'function');
}
/** Re-export `ServiceKind` for the kernel's internal use. */
export {} from '../manifest.js';
export {} from '../unit-contract.js';
//# sourceMappingURL=app-instance.js.map