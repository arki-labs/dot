/**
 * Public entry point for the DOT kernel (v2).
 *
 * `defineApp(name)` returns a `DotAppBuilder` that accumulates units in three
 * hexagonal steps, then transitions through the 5-hook lifecycle:
 *
 *   defineApp -> use* -> features? -> serve* -> configure() -> boot() -> start() -> stop() -> dispose()
 *
 * `.use()` is compile-time guarded: a plugin whose `needs` are not satisfied
 * by services provided so far — or whose provides collide with existing
 * wire keys — fails to typecheck at the call site ("Expected 2 arguments,
 * but got 1", with the diagnostic embedded in the expected second
 * argument's type). Declaration order IS boot order.
 *
 * Most callers don't need to call `configure()` explicitly — `boot()` runs it
 * implicitly. `boot()` is also implicit when starting from `defined` via
 * `start()`.
 *
 * See `./lifecycle.ts` for hook semantics, failure ordering, idempotency rules.
 */
import { bindDriver, plug } from './feature.js';
import { DotAppImpl } from './kernel/app-instance.js';
import { renderTimeline } from './timeline.js';
/**
 * Create a new DOT app builder.
 *
 * @example
 * const app = await defineApp('my-app')
 *   .use(dbPlugin)
 *   .use(billingPlugin)   // billing's needs must be satisfied by now
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
        config: options.config,
        observers: options.observers,
        hookTimeoutMs: options.hookTimeoutMs,
    };
    return makeBuilder(state);
}
function buildImpl(state) {
    return new DotAppImpl({
        appName: state.appName,
        appVersion: state.appVersion,
        plugins: state.plugins.map(unit => ('bind' in unit ? unit.bind(state.features) : unit)),
        config: state.config,
        observers: state.observers,
        hookTimeoutMs: state.hookTimeoutMs,
    });
}
function makeBuilder(state) {
    // The `use` implementation is signature-erased (the guard exists purely
    // at the type level); the single cast below is the same kernel boundary
    // v1 crossed in its wrapApp helper. The phase split is type-only too:
    // one runtime object serves every phase.
    const impl = {
        features(features, ..._guard) {
            const nextState = {
                ...state,
                plugins: [...state.plugins, ...features.map((f) => ({ ...plug(f), role: 'feature' }))],
                features: [...state.features, ...features],
            };
            return makeBuilder(nextState);
        },
        serve(adapter, ..._guard) {
            const bound = 'bind' in adapter ? bindDriver(adapter, state.features) : adapter;
            const nextState = {
                ...state,
                plugins: [...state.plugins, { ...bound, role: 'driving' }],
            };
            return makeBuilder(nextState);
        },
        use(plugin, ..._guard) {
            const nextState = {
                ...state,
                plugins: [...state.plugins, plugin],
            };
            return makeBuilder(nextState);
        },
        useAll(plugins, ..._guard) {
            const nextState = {
                ...state,
                plugins: [...state.plugins, ...plugins],
            };
            return makeBuilder(nextState);
        },
        configure() {
            const appImpl = buildImpl(state);
            appImpl.runConfigure();
            return wrapConfigured(appImpl);
        },
        async boot() {
            const appImpl = buildImpl(state);
            await appImpl.boot();
            return wrapApp(appImpl);
        },
        async start() {
            const appImpl = buildImpl(state);
            await appImpl.start();
            return wrapApp(appImpl);
        },
    };
    return impl;
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
        start: () => impl.start(),
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
            await impl.boot();
            return wrapApp(impl);
        },
        async start() {
            await impl.start();
            return wrapApp(impl);
        },
        subscribe: observer => impl.subscribe(observer),
        timeline: () => renderTimeline(impl.diagnostics),
    };
}
//# sourceMappingURL=define-app.js.map