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
import type { DotDiagnosticsSnapshot } from './diagnostics.js';
import type { DotLifecycleObserver } from './lifecycle-observer.js';
import type { DotLifecycleState } from './lifecycle.js';
import type { DotAppManifest } from './manifest.js';
import type { DotPip } from './pip-contract.js';
/**
 * Public DotApp surface. The internal `DotAppImpl` implements this; consumers
 * see only these members.
 */
export type DotApp<TServices extends Record<string, unknown>> = {
    /** App name (passed to `defineApp`). */
    readonly name: string;
    /** Current lifecycle state. */
    readonly state: DotLifecycleState;
    /**
     * Services published by booted pips, merged into a single record.
     * Empty before `boot()` succeeds.
     */
    readonly services: TServices;
    /** Declarative manifest — describes the static shape of the app. */
    readonly manifest: DotAppManifest;
    /** Point-in-time diagnostics snapshot. Re-computed on every access. */
    readonly diagnostics: DotDiagnosticsSnapshot;
    /**
     * Start active work. Boots first if app is `defined` or `configured`.
     * Idempotent while `started`. Throws if app is `failed` or `disposed`.
     */
    start(): Promise<void>;
    /**
     * Stop active work. Keeps booted resources for later cleanup.
     * Idempotent while not `started`.
     */
    stop(): Promise<void>;
    /**
     * Release booted resources. Runs stop() first if `started`.
     * Idempotent while `disposed`.
     */
    dispose(): Promise<void>;
    /**
     * Register an in-process lifecycle observer. Returns an unsubscribe
     * function. Observers added here see events from this point onward —
     * pass observers through `defineApp(name, { observers })` to catch
     * `configure`-phase events too.
     */
    subscribe(observer: DotLifecycleObserver): () => void;
    /**
     * Render the recorded lifecycle as an ASCII waterfall. Reads from
     * the current `diagnostics` snapshot — call after `boot()` /
     * `dispose()` / a failure to see the full picture.
     */
    timeline(): string;
};
/**
 * Intermediate type after `configure()` but before `boot()`.
 * Exposes the manifest and diagnostics already, but no `services` yet.
 */
export type DotAppConfigured<TServices extends Record<string, unknown>> = {
    readonly name: string;
    readonly state: DotLifecycleState;
    readonly manifest: DotAppManifest;
    readonly diagnostics: DotDiagnosticsSnapshot;
    /** Continue the lifecycle. */
    boot(): Promise<DotApp<TServices>>;
    start(): Promise<DotApp<TServices>>;
    /** See {@link DotApp.subscribe}. */
    subscribe(observer: DotLifecycleObserver): () => void;
    /** See {@link DotApp.timeline}. */
    timeline(): string;
};
/**
 * Builder produced by `defineApp(name)`.
 *
 * `.use(pip)` is type-tracking: services published by the pip are
 * merged into `TServices` for the next builder.
 */
export type DotAppBuilder<TServices extends Record<string, unknown>> = {
    /** Register a pip. Returns a new builder with merged services. */
    use<TNew extends Record<string, unknown>>(pip: DotPip<TNew>): DotAppBuilder<TServices & TNew>;
    /** Run the configure phase synchronously. Throws on configure failure. */
    configure(): DotAppConfigured<TServices>;
    /** Run configure + boot. Throws on configure or boot failure. */
    boot(): Promise<DotApp<TServices>>;
    /** Convenience: configure + boot + start. */
    start(): Promise<DotApp<TServices>>;
};
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
export declare function defineApp<TServices extends Record<string, unknown> = Record<string, never>>(name: string, options?: {
    version?: string;
    config?: Readonly<Record<string, unknown>>;
    /**
     * In-process lifecycle observers, registered before the first phase
     * fires. Required if you want to see `configure`-phase events — after
     * configure runs, observers can be added post-hoc via
     * `configured.subscribe(...)` or `app.subscribe(...)`.
     */
    observers?: readonly DotLifecycleObserver[];
}): DotAppBuilder<TServices>;
//# sourceMappingURL=define-app.d.ts.map