/**
 * Public entry point for the new DOT kernel.
 *
 * `defineApp(name)` returns a `DotAppBuilder` that accumulates pips via
 * `.use(pip)`, then transitions through the 5-hook lifecycle:
 *
 *   defineApp -> use* -> configure() -> boot() -> start() -> stop() -> dispose()
 *
 * Most callers don't need to call `configure()` explicitly — `boot()` runs it
 * implicitly. `boot()` is also implicit when starting from `defined` via
 * `start()`.
 *
 * See `./lifecycle.ts` for hook semantics, failure ordering, idempotency rules.
 */
import { DotAppImpl } from './kernel/app-instance.js';
import { renderTimeline } from './timeline.js';
/**
 * Create a new DOT app builder.
 *
 * @example
 * const app = await defineApp('my-app')
 *   .use(dbPip)
 *   .use(authPip)
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
        pips: [],
        config: options.config,
        observers: options.observers,
    };
    return makeBuilder(state);
}
function buildImpl(state) {
    return new DotAppImpl({
        appName: state.appName,
        appVersion: state.appVersion,
        pips: state.pips,
        config: state.config,
        observers: state.observers,
    });
}
function makeBuilder(state) {
    return {
        use(pip) {
            const nextState = {
                ...state,
                pips: [...state.pips, pip],
            };
            return makeBuilder(nextState);
        },
        configure() {
            const impl = buildImpl(state);
            impl.runConfigure();
            return wrapConfigured(impl);
        },
        async boot() {
            const impl = buildImpl(state);
            await impl.boot();
            return wrapApp(impl);
        },
        async start() {
            const impl = buildImpl(state);
            await impl.start();
            return wrapApp(impl);
        },
    };
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