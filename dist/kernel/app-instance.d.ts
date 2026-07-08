/**
 * Internal DotApp implementation — the kernel's lifecycle scheduler.
 *
 * Not exported from the public surface. Tests reach it only through
 * `defineApp(...)` and its returned `DotApp` interface.
 */
import type { DotDiagnosticsSnapshot } from '../diagnostics.js';
import type { DotLifecycleObserver } from '../lifecycle-observer.js';
import type { DotLifecycleState } from '../lifecycle.js';
import type { DotAppManifest } from '../manifest.js';
import type { AnyPlugin } from '../plugin-contract.js';
export type DotAppInternalConfig = {
    appName: string;
    appVersion?: string;
    plugins: readonly AnyPlugin[];
    /** Runtime config bag passed to every `boot` hook. */
    config?: Readonly<Record<string, unknown>>;
    /**
     * Observers registered at construction time, before any phase fires.
     * Required if a consumer wants to see `configure`-phase events — those
     * happen before there's a public seam to call `subscribe()` on.
     */
    observers?: readonly DotLifecycleObserver[];
    /** Per-hook watchdog budget in ms — see `defineApp`'s option of the same name. */
    hookTimeoutMs?: number;
};
/**
 * Internal app implementation. Public consumers see the `DotApp` interface
 * from `../define-app.ts`.
 */
export declare class DotAppImpl {
    #private;
    constructor(config: DotAppInternalConfig);
    /**
     * Register a lifecycle observer. The returned function unregisters it.
     * Observers added through `subscribe()` see events emitted *after*
     * subscription only — to catch `configure` events, pass observers
     * through `defineApp(name, { observers })` at construction time.
     */
    subscribe(observer: DotLifecycleObserver): () => void;
    get name(): string;
    get state(): DotLifecycleState;
    get services(): Record<string, unknown>;
    get manifest(): DotAppManifest;
    get diagnostics(): DotDiagnosticsSnapshot;
    /**
     * Run the `configure` phase synchronously. Idempotent.
     *
     * @throws {DotLifecycleError} if any configure hook throws or returns a Promise.
     */
    runConfigure(): void;
    /** Public boot() — idempotent + concurrent-safe. */
    boot(): Promise<void>;
    /** Public start(). Boots first if needed. Idempotent + concurrent-safe. */
    start(): Promise<void>;
    /** Public stop(). Idempotent + concurrent-safe. */
    stop(): Promise<void>;
    /** Public dispose(). Idempotent + concurrent-safe. */
    dispose(): Promise<void>;
}
/** Re-export `ServiceKind` for the kernel's internal use. */
export { type ServiceKind } from '../manifest.js';
export { type Plugin } from '../plugin-contract.js';
//# sourceMappingURL=app-instance.d.ts.map