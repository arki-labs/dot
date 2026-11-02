/**
 * `@arki/dot/runtime` — `createAppRuntime`: the one started Dot app of a server process, safe under
 * Vite hot updates.
 *
 * TanStack Start boots the app lazily inside Vite's SSR graph. A hot update
 * re-runs the module that owns the app, so the old instance must be gone
 * before the new one starts: two live apps mean two database pools, and two
 * PGlite handles on one data directory corrupt it. Disposing in
 * `import.meta.hot.dispose` is not enough on its own, because Vite does not
 * wait for it — the next request starts the new app at once. This helper
 * leaves the old app's disposal in `hot.data`, and the new instance's first
 * `get()` waits for it before `start()`.
 */
import type { Failure } from '@arki/failure';
import type { DotApp, DotAppLifecycle } from './define-app.js';
import type { EmptyPhases, UnitPhases, ServiceRecord } from './unit-contract.js';
/**
 * A replaced module no longer owns the application's runtime.
 * @fix Obtain the runtime exported by the current module.
 * @verify bun run test -- src/tests/app-runtime.test.ts
 */
export declare const RuntimeReplaced: import("@arki/failure").FailureDefinition<"dot.runtime_replaced", undefined>;
/**
 * Previous ownership could not be released, so starting another app is unsafe.
 * @fix Resolve the disposal failure before starting another owner of the resources.
 * @verify bun run test -- src/tests/app-runtime.test.ts
 */
export declare const RuntimeReleaseFailed: import("@arki/failure").FailureDefinition<"dot.runtime_release_failed", undefined>;
/**
 * Start one Dot app per module instance and wait for prior HMR disposal.
 * Resolved start failures are never cached as ready. A failed release prevents
 * another owner from starting. Replaced modules return RuntimeReplaced.
 *
 * @example
 * const runtime = createAppRuntime(app, { hot: import.meta.hot });
 * export const getApp = runtime.get;
 */
export declare function createAppRuntime<S extends ServiceRecord, Open extends Failure = never, Close extends Failure = never, Phases extends UnitPhases = EmptyPhases>(app: DotAppLifecycle<S, Open, Close, Phases>, options?: {
    readonly hot?: {
        readonly data: Record<string, unknown>;
        dispose(callback: (data: Record<string, unknown>) => void): void;
    } | undefined;
    readonly onStarted?: ((app: DotApp<S, Close, Open, Phases>) => void) | undefined;
    /**
     * Start the app as soon as the runtime is created instead of on the first
     * `get()`. A production server boots before it serves, so the first
     * request pays no boot and a boot failure shows at process start. Leave
     * it off in dev: Vite re-runs the module on a hot update, and the lazy
     * start lets the previous instance finish disposing first. A failed start
     * is not cached, so the next `get()` still retries.
     */
    readonly eager?: boolean | undefined;
}): {
    get: () => Promise<DotApp<S, Close, Open, Phases> | Failure<"async.cancelled", undefined> | Failure<"async.deadline", undefined> | Failure<"dot.runtime_release_failed", undefined> | Failure<"dot.runtime_replaced", undefined> | Failure<"failure.unexpected_defect", undefined> | Exclude<Phases["configure"], void> | Exclude<Phases["start"], void> | Exclude<Exclude<Close, void>, void> | Exclude<Exclude<Open, void>, void> | import("@arki/async").ScopeAggregate<Failure<"failure.unexpected_defect", undefined>, Failure<"async.cancelled", undefined> | Failure<"async.deadline", undefined> | Failure<"failure.unexpected_defect", undefined> | import("@arki/async").ScopeAggregate<never, Phases["stop"] | (Phases["dispose"] | (Failure<"async.cancelled", undefined> | Failure<"async.deadline", undefined> | Failure<"failure.unexpected_defect", undefined> | Exclude<Close, void> | import("@arki/async").ScopeAggregate<Close | import("@arki/async").SupervisorFailure, Close | import("@arki/async").SupervisorFailure>))> | import("@arki/async").ScopeAggregate<Close | import("@arki/async").SupervisorFailure, Close | import("@arki/async").SupervisorFailure>> | import("@arki/async").ScopeAggregate<Phases["start"] | import("@arki/async").SupervisorFailure, Phases["stop"] | (Phases["dispose"] | (Failure<"async.cancelled", undefined> | Failure<"async.deadline", undefined> | Failure<"failure.unexpected_defect", undefined> | Exclude<Close, void> | import("@arki/async").ScopeAggregate<Close | import("@arki/async").SupervisorFailure, Close | import("@arki/async").SupervisorFailure>))> | import("@arki/async").ScopeAggregate<Close | Open | import("@arki/async").SupervisorFailure, Close | import("@arki/async").SupervisorFailure> | import("@arki/async").ScopeAggregate<Exclude<Close, void> | Exclude<Open, void> | import("@arki/async").SupervisorFailure | import("@arki/async").ScopeAggregate<Close | Open | import("@arki/async").SupervisorFailure, Close | import("@arki/async").SupervisorFailure>, Phases["dispose"] | (Failure<"async.cancelled", undefined> | Failure<"async.deadline", undefined> | Failure<"failure.unexpected_defect", undefined> | Exclude<Close, void> | import("@arki/async").ScopeAggregate<Close | import("@arki/async").SupervisorFailure, Close | import("@arki/async").SupervisorFailure>)>>;
};
//# sourceMappingURL=runtime.d.ts.map