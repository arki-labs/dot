/**
 * Public unit contract for the DOT kernel (v2).
 *
 * A unit declares what it **needs** as a shape of type witnesses and
 * what it **provides** as one factory per published key. The keys are
 * static, so `unit.provides` holds a typed handle per key before
 * anything boots. The kernel wires services by key, injects them into
 * hook contexts under the unit's local aliases, and fails loudly (coded
 * errors) on unsatisfied needs or key collisions.
 *
 * Design constraints:
 *
 *  - `configure` is SYNC. Returning a Promise is an error — the kernel
 *    throws {@link DotLifecycleError} with code `ARKI_DOT_E001`.
 *  - Declaration order IS boot order. The app builder's type-level guard
 *    makes out-of-order composition a compile error; the kernel re-validates
 *    at configure time from the static `provides` handles.
 *  - `stop` and `dispose` run in reverse declaration order and continue
 *    through individual unit failures, reporting an aggregate error.
 */
import { createLifetime, isScopeEntry } from '@arki/async';
import { isFailure, UnexpectedDefect } from '@arki/failure';
import { isLazy } from './lazy.js';
/**
 * Create an app-local (anonymous) service witness for a `needs` shape.
 *
 * `service.lazy<T>()` creates a lifting witness instead — the hook context
 * delivers a `Lazy<T>` handle whether the provider is eager or lazy.
 */
export const service = Object.assign(() => ({}), { lazy: () => ({ lazy: true }) });
/** Internal (kernel) check: is this witness a lazy-lifting one? */
export function isLazyWitness(witness) {
    return 'lazy' in witness && witness.lazy === true;
}
/**
 * Create a token. Curried so `T` is explicit while `K` is inferred as a
 * literal: `const Db = token<DbHandle>()('arki.db')`.
 */
export function token() {
    return (key) => ({
        key,
        instance(name) {
            // Safe by construction: the runtime string is exactly the template type.
            return token()(`${key}#${name}`);
        },
    });
}
/**
 * A record holding one value under a token's wire key, typed by the
 * token's literal key: `provide(Db, handle)` is `{ 'arki.db': DbHandle }`.
 */
export function provide(tok, value) {
    // Safe by construction: the computed key is exactly `tok.key: K`.
    return { [tok.key]: value };
}
export { LazyTag, LazyClosed, lazy, lazyOf, isLazy } from './lazy.js';
/** The kernel context key that carries {@link DotHandlerObserver}; a feature's services bag keeps it for adapters. */
export const HANDLERS_KEY = '$handlers';
/** Mint the handle for wire key `key` provided by `provider` (and its lazy form). */
export function handleOf(key, provider) {
    const tok = token()(key);
    return { ...tok, provider, lazy: { ...tok, provider, lazy: true } };
}
export function unit(def, ..._guard) {
    return createUnit(def);
}
export function infra(def) {
    return { ...createUnit(def), role: 'infra' };
}
function infraFromFeatures(def) {
    return fromFeaturesBinder('infra', def);
}
infra.fromFeatures = infraFromFeatures;
export function entrypoint(def) {
    return { ...createUnit(def), role: 'entrypoint' };
}
function entrypointFromFeatures(def) {
    return fromFeaturesBinder('entrypoint', def);
}
entrypoint.fromFeatures = entrypointFromFeatures;
/** Mint the binder's static handles from the declaration's keys; `bind` makes one unit per app. */
function fromFeaturesBinder(role, def) {
    const provides = {};
    for (const key of Object.keys(def.provides ?? {}))
        provides[key] = handleOf(key, def.name);
    return { role, name: def.name, provides, bind: features => bindFromFeatures(def, features) };
}
/**
 * One app's unit from a `fromFeatures` declaration: `state()` runs here, once,
 * and every factory and hook gets this app's `$features` and `$state`.
 */
function bindFromFeatures(def, features) {
    const added = { $features: features, $state: def.state?.() };
    const { actions, provides, configure, boot, start, stop, dispose } = def;
    // Erasure seam (each `as never` below): the kernel builds every context as a
    // plain record; adding this app's keys to it is what the overloads typed.
    const factories = {};
    for (const [key, factory] of Object.entries(provides ?? {}))
        factories[key] = ctx => factory({ ...ctx, ...added });
    return createUnit({
        name: def.name,
        ...(def.needs === undefined ? {} : { needs: def.needs }),
        ...(def.logging === undefined ? {} : { logging: def.logging }),
        ...(actions === undefined ? {} : { actions: typeof actions === 'function' ? actions(features) : actions }),
        // Erasure seam: each factory returns what the declaration's own factory
        // returns, which the `fromFeatures` overloads checked.
        provides: factories,
        ...(configure === undefined ? {} : { configure: ctx => configure({ ...ctx, ...added }) }),
        ...(boot === undefined ? {} : { boot: ctx => boot({ ...ctx, ...added }) }),
        ...(start === undefined ? {} : { start: ctx => start({ ...ctx, ...added }) }),
        ...(stop === undefined ? {} : { stop: ctx => stop({ ...ctx, ...added }) }),
        ...(dispose === undefined ? {} : { dispose: ctx => dispose({ ...ctx, ...added }) }),
    });
}
export function createUnit(def) {
    const factories = factoriesOf(def.provides);
    const handles = {};
    for (const key of Object.keys(factories))
        handles[key] = handleOf(key, def.name);
    const runtime = createUnitRuntime();
    return {
        name: def.name,
        needs: def.needs ?? {},
        actions: def.actions ?? [],
        renames: {},
        // Erasure seam: the record is built by key at runtime; its type comes
        // from the factory returns that `infra()` inferred, its `provider` from `name`.
        provides: handles,
        runtime,
        factories,
        ...(def.logging === undefined ? {} : { logging: def.logging }),
        hooks: {
            ...createPhaseHooks(def),
            ...(def.boot === undefined ? {} : { boot: def.boot }),
        },
    };
}
function factoriesOf(factories) {
    return factories ?? {};
}
function createPhaseHooks(hooks) {
    return {
        ...(hooks.configure === undefined ? {} : { configure: hooks.configure }),
        ...(hooks.start === undefined ? {} : { start: hooks.start }),
        ...(hooks.stop === undefined ? {} : { stop: hooks.stop }),
        ...(hooks.dispose === undefined ? {} : { dispose: hooks.dispose }),
    };
}
function failed(value) {
    return isFailure(value);
}
export function createUnitRuntime(project, prepare) {
    return {
        async construct(factories, boot, ctx, options, claimLazy) {
            const lifetime = createLifetime(options);
            const normalize = async (run) => {
                try {
                    const result = await run();
                    if (failed(result))
                        return result;
                }
                catch (error) {
                    return UnexpectedDefect({ cause: error });
                }
                return;
            };
            const acquire = (prepare) => {
                const run = async (signal) => {
                    const prepared = await prepare(signal);
                    if (failed(prepared))
                        return prepared;
                    return { value: prepared.value, close: () => normalize(prepared.close) };
                };
                return lifetime.acquire(run);
            };
            const services = {};
            const context = { ...ctx, $signal: lifetime.signal };
            try {
                if (prepare !== undefined) {
                    const prepared = await lifetime.acquire(async () => {
                        const value = await prepare(context);
                        if (failed(value))
                            return value;
                        return { value, close: () => Promise.resolve() };
                    });
                    if (failed(prepared))
                        lifetime.fail(prepared);
                    else if (prepared !== undefined)
                        Object.assign(context, prepared);
                }
                for (const [key, factory] of Object.entries(factories)) {
                    if (lifetime.signal.aborted || lifetime.hasFailure())
                        break;
                    // Admit the factory before it runs so shutdown also owns a late Lazy.
                    const prepareFactory = async () => {
                        const provided = await factory(context);
                        if (failed(provided))
                            return provided;
                        const ownedLazy = isLazy(provided) && claimLazy(provided) ? provided : undefined;
                        return { value: provided, close: () => normalize(() => ownedLazy?.dispose()) };
                    };
                    const provided = await lifetime.acquire(prepareFactory);
                    if (failed(provided)) {
                        lifetime.fail(provided);
                        break;
                    }
                    const value = isScopeEntry(provided) && provided.kind === 'resource' ? await acquire(provided.prepare) : provided;
                    if (failed(value)) {
                        lifetime.fail(value);
                        break;
                    }
                    services[key] = value;
                }
                if (!lifetime.signal.aborted && !lifetime.hasFailure())
                    project?.(services, context);
                if (!lifetime.signal.aborted && !lifetime.hasFailure() && boot !== undefined) {
                    const result = await boot({ ...context, ...services });
                    if (failed(result))
                        lifetime.fail(result);
                    else if (result !== undefined) {
                        if (typeof result !== 'object' || result === null)
                            lifetime.fail(UnexpectedDefect({ cause: result }));
                        else
                            for (const value of Object.values(result)) {
                                if (!isScopeEntry(value)) {
                                    lifetime.fail(UnexpectedDefect({ cause: result }));
                                    break;
                                }
                                if (value.kind === 'resource') {
                                    const opened = await acquire(value.prepare);
                                    if (failed(opened)) {
                                        lifetime.fail(opened);
                                        break;
                                    }
                                }
                                else if (value.kind === 'cleanup') {
                                    // eslint-disable-next-line failure/must-use -- close() owns cleanup outcomes; admission denial only follows an already retained primary failure.
                                    lifetime.defer(() => normalize(value.close));
                                }
                                else {
                                    const run = async (signal) => {
                                        const result = await value.run(signal);
                                        if (failed(result))
                                            return result;
                                        return;
                                    };
                                    // eslint-disable-next-line failure/must-use -- close() owns child outcomes; admission denial only follows an already retained primary failure.
                                    lifetime.fork(run);
                                }
                            }
                    }
                }
            }
            catch (error) {
                const defect = lifetime.defect(error);
                if (defect !== undefined)
                    lifetime.fail(defect);
            }
            if (lifetime.signal.aborted || lifetime.hasFailure()) {
                const closed = await lifetime.close();
                return failed(closed) ? closed : UnexpectedDefect({ cause: new Error('Unit construction lost its failure') });
            }
            return { services, quiesce: lifetime.quiesce, close: lifetime.close };
        },
    };
}
/**
 * Mount-time rename. `rename(dbUnit, { db: 'reportsDb' }, 'reports-db')`
 * publishes the same service under a different wire key, retyped
 * accordingly — the way to mount a second instance of an adapter without
 * a key collision. Renames compose: renaming an already-renamed key
 * rewrites the earlier entry.
 *
 * The returned unit's `provides` handles are rebuilt on the new keys and
 * name, so `rename(...).provides.reportsDb` is the handle to reference. A
 * handle taken from the object before the rename keeps the old key — the
 * builder guard reports it missing; reference the handle of the object you
 * mount. Without `newName` the handles keep the original provider.
 */
export function rename(p, map, newName) {
    const renames = { ...p.renames };
    const entries = map;
    for (const [wireKey, next] of Object.entries(entries)) {
        if (typeof next !== 'string')
            continue;
        // If `wireKey` is itself the *result* of an earlier rename, rewrite that
        // entry (compose); otherwise it is a local publish key.
        const localKey = Object.entries(renames).find(([, w]) => w === wireKey)?.[0] ?? wireKey;
        renames[localKey] = next;
    }
    const name = newName ?? p.name;
    const handles = {};
    for (const wireKey of Object.keys(p.provides)) {
        const next = entries[wireKey];
        const key = typeof next === 'string' ? next : wireKey;
        handles[key] = handleOf(key, name);
    }
    // Only rebuilt wire handles need the existing service-shape assertion;
    // the source runtime operation retains its checked ownership parameters.
    const metadata = p;
    return {
        ...metadata,
        name,
        renames,
        provides: handles,
        runtime: p.runtime,
    };
}
/**
 * Stable error thrown by DOT unit adapters.
 *
 * Adapters MUST throw `DotUnitError` (not raw `Error`) when surfacing a
 * misconfiguration, missing-input, or other fail-fast condition. Consumers
 * and coding agents can then match on a stable `code`, follow `docsUrl`,
 * and apply `remediation` without parsing the message.
 *
 * Codes are per-adapter. Recommended prefix is `ARKI_<PKG>_UNIT_E<NNN>` (e.g.
 * `ARKI_KV_UNIT_E001`, `ARKI_DB_UNIT_E001`). The kernel does not own the code
 * namespace — each adapter defines its own constants and links them in
 * its README.
 *
 * @see packages/dot/docs/principles.md — principle 1.3 ("errors are part
 * of the API") and principle 4 ("agent-discoverable everywhere").
 */
export class DotUnitError extends Error {
    /** Stable error code, e.g. `ARKI_KV_UNIT_E001`. */
    code;
    /** One-sentence guidance on how to fix the underlying problem. */
    remediation;
    /** URL of the documentation page that explains this error. */
    docsUrl;
    constructor(args) {
        super(args.message);
        this.name = 'DotUnitError';
        this.code = args.code;
        this.remediation = args.remediation;
        this.docsUrl = args.docsUrl;
    }
}
/** Re-exported for downstream typing. */
export {} from './manifest.js';
//# sourceMappingURL=unit-contract.js.map