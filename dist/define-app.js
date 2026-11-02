import { isFailure, UnexpectedDefect } from '@arki/failure';
import { DotLifecycleError, DotLifecycleErrorCode } from './lifecycle.js';
import { allFeatures, mountFeatures } from './define-feature.js';
import { bindEntrypoint } from './feature.js';
import { DotAppImpl } from './kernel/app-instance.js';
import { renderTimeline } from './timeline.js';
function failed(value) {
    return isFailure(value);
}
function configuredApp(value) {
    return !isFailure(value);
}
/**
 * Create a new DOT app builder.
 *
 * @example
 * const app = await defineApp('pizzeria')
 *   .infra(database, cache)   // cache's needs must be satisfied by database
 *   .features([billing])
 *   .boot();
 *
 * await app.start();
 * console.log(app.manifest);
 * // ...
 * await app.dispose();
 */
export function defineApp(name, options = {}) {
    const state = {
        appName: name,
        appVersion: options.version,
        plugins: [],
        features: [],
        misplaced: [],
        config: options.config,
        observers: options.observers,
        hookTimeoutMs: options.hookTimeoutMs,
        clock: options.clock,
    };
    return makeBuilder(state);
}
function buildImpl(state) {
    const [misplaced] = state.misplaced;
    if (misplaced !== undefined) {
        throw new DotLifecycleError({
            code: DotLifecycleErrorCode.UnitOnWrongSide,
            phase: 'configure',
            plugin: misplaced.name,
            message: `Unit "${misplaced.name}" is an ${misplaced.role} unit, mounted with .${misplaced.step}()`,
        });
    }
    return new DotAppImpl({
        appName: state.appName,
        appVersion: state.appVersion,
        // A unit built by `fromFeatures` takes its binder's role: the binder is the declaration.
        plugins: state.plugins.map(unit => ('bind' in unit ? { ...unit.bind(state.features), role: unit.role } : unit)),
        config: state.config,
        observers: state.observers,
        hookTimeoutMs: state.hookTimeoutMs,
        clock: state.clock,
    });
}
function bindAdapter(adapter, features) {
    // A unit built by `fromFeatures` takes its binder's role, so an `infra.fromFeatures` here is caught as misplaced.
    return 'bind' in adapter ? { ...bindEntrypoint(adapter, features), role: adapter.role } : onSide(adapter, 'entrypoint');
}
/** Give a role-less unit the step's role; a unit built by `infra` / `entrypoint` / `defineFeature` keeps its own. */
function onSide(unit, role) {
    return unit.role === undefined ? { ...unit, role } : unit;
}
/** Infra steps take infra, feature and domain-service units; entrypoint steps take entrypoints only. */
function misplacedIn(units, step) {
    return units.flatMap(unit => {
        const role = unit.role;
        if (role === undefined ||
            role === step.role ||
            (step.role === 'infra' && (role === 'feature' || role === 'domain-service')))
            return [];
        return [{ name: unit.name, role, step: step.name }];
    });
}
function runtimeUnits(units) {
    return units;
}
function featureRuntime(features) {
    mountFeatures(features);
    return features.flatMap(f => f.units());
}
function drivingRuntime(adapters, features) {
    return adapters.map(adapter => bindAdapter(adapter, features));
}
/** Internal dynamic-list entrypoint; unlike `.infra(...list)`, this does not claim tuple wiring checks. */
export function mountUnits(name, plugins, options = {}) {
    return makeBuilder({
        appName: name,
        appVersion: options.version,
        plugins: [...plugins],
        features: [],
        misplaced: [],
        config: options.config,
        observers: options.observers,
        hookTimeoutMs: options.hookTimeoutMs,
        clock: options.clock,
    });
}
function makeBuilder(state) {
    return new Builder(state);
}
/** One checked implementation supplies both public builder phases. */
class Builder {
    #state;
    constructor(state) {
        this.#state = state;
        this.infra = this.infra.bind(this);
        this.features = this.features.bind(this);
        this.entrypoints = this.entrypoints.bind(this);
        this.configure = this.configure.bind(this);
        this.boot = this.boot.bind(this);
        this.start = this.start.bind(this);
    }
    append(units, features = this.#state.features, step) {
        return new Builder({
            ...this.#state,
            plugins: [...this.#state.plugins, ...(step === undefined ? units : units.map(u => ('bind' in u ? u : onSide(u, step.role))))],
            features,
            misplaced: step === undefined ? this.#state.misplaced : [...this.#state.misplaced, ...misplacedIn(units, step)],
        });
    }
    /** Register infrastructure in boot order, before the domain. */
    infra(...units) {
        return this.append(runtimeUnits(units), undefined, { name: 'infra', role: 'infra' });
    }
    /** Mount the domain; later steps can register only driving adapters. */
    features(features) {
        return this.append(featureRuntime(features), [...this.#state.features, ...allFeatures(features)]);
    }
    /** Register the app's driving adapters in argument order. */
    entrypoints(...adapters) {
        return this.append(drivingRuntime(adapters, this.#state.features), undefined, { name: 'entrypoints', role: 'entrypoint' });
    }
    configure() {
        try {
            const impl = buildImpl(this.#state);
            const outcome = impl.runConfigure();
            if (failed(outcome))
                return outcome;
            return wrapConfigured(impl);
        }
        catch (error) {
            return UnexpectedDefect({ cause: error });
        }
    }
    async boot() {
        const configured = this.configure();
        if (!configuredApp(configured))
            return configured;
        return configured.boot();
    }
    async start() {
        const configured = this.configure();
        if (!configuredApp(configured))
            return configured;
        return configured.start();
    }
}
function wrapApp(impl) {
    return {
        get name() {
            return impl.name;
        },
        get state() {
            return impl.state;
        },
        get services() {
            return impl.services;
        },
        get manifest() {
            return impl.manifest;
        },
        get diagnostics() {
            return impl.diagnostics;
        },
        start: () => impl.startBooted(),
        stop: () => impl.stop(),
        dispose: () => impl.dispose(),
        subscribe: observer => impl.subscribe(observer),
        timeline: () => renderTimeline(impl.diagnostics),
    };
}
function wrapConfigured(impl) {
    return {
        get name() {
            return impl.name;
        },
        get state() {
            return impl.state;
        },
        get manifest() {
            return impl.manifest;
        },
        get diagnostics() {
            return impl.diagnostics;
        },
        async boot() {
            const result = await impl.bootConfigured();
            if (failed(result))
                return result;
            return wrapApp(impl);
        },
        async start() {
            const result = await impl.startConfigured();
            if (failed(result))
                return result;
            return wrapApp(impl);
        },
        subscribe: observer => impl.subscribe(observer),
        timeline: () => renderTimeline(impl.diagnostics),
    };
}
//# sourceMappingURL=define-app.js.map