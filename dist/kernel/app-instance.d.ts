/**
 * Internal DotApp implementation — the kernel's lifecycle scheduler.
 *
 * Not exported from the public surface. Tests reach it only through
 * `defineApp(...)` and its returned `DotApp` interface.
 */
import type { ScopeAggregate, SupervisorFailure } from '@arki/async';
import type { Clock } from '@arki/clock';
import type { Failure } from '@arki/failure';
import { UnexpectedDefect } from '@arki/failure';
import type { DotDiagnosticsSnapshot } from '../diagnostics.js';
import type { DotLifecycleObserver } from '../lifecycle-observer.js';
import type { DotLifecycleState } from '../lifecycle.js';
import type { DotAppManifest } from '../manifest.js';
import type { EmptyPhases, UnitBootOutcome, UnitCloseOutcome, UnitPhases, RuntimeUnit } from '../unit-contract.js';
type CloseMember<Close extends Failure> = Exclude<UnitCloseOutcome<Close>, void>;
type DisposeMember<Close extends Failure, Phases extends UnitPhases> = CloseMember<Close> | Phases['dispose'];
type CleanupMember<Close extends Failure, Phases extends UnitPhases> = DisposeMember<Close, Phases> | Phases['stop'];
declare function closeOutcome<Close extends Failure>(failures: readonly Close[]): Close | ScopeAggregate<never, Close> | undefined;
export type DotConfigureOutcome<Phases extends UnitPhases = EmptyPhases> = void | Phases['configure'] | ReturnType<typeof UnexpectedDefect>;
export type DotStopOutcome<Phases extends UnitPhases = EmptyPhases> = ReturnType<typeof closeOutcome<Phases['stop'] | SupervisorFailure>>;
export type DotDisposeOutcome<Close extends Failure, Phases extends UnitPhases = EmptyPhases> = ReturnType<typeof closeOutcome<CleanupMember<Close, Phases>>>;
export type DotBootOutcome<Open extends Failure, Close extends Failure, Phases extends UnitPhases = EmptyPhases> = void | Exclude<UnitBootOutcome<Open, Close>, void> | ScopeAggregate<Exclude<UnitBootOutcome<Open, Close>, void>, DisposeMember<Close, Phases>>;
export type DotStartedOutcome<Close extends Failure, Phases extends UnitPhases = EmptyPhases> = void | Phases['start'] | SupervisorFailure | ScopeAggregate<Phases['start'] | SupervisorFailure, CleanupMember<Close, Phases>>;
export type DotStartOutcome<Open extends Failure, Close extends Failure, Phases extends UnitPhases = EmptyPhases> = DotBootOutcome<Open, Close, Phases> | DotStartedOutcome<Close, Phases>;
export type DotAppInternalConfig<Open extends Failure, Close extends Failure, Phases extends UnitPhases = EmptyPhases> = {
    appName: string;
    appVersion?: string;
    plugins: readonly RuntimeUnit<Open, Close, Phases>[];
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
    clock?: Clock;
};
/**
 * Internal app implementation. Public consumers see the `DotApp` interface
 * from `../define-app.ts`.
 */
export declare class DotAppImpl<TOpen extends Failure = never, TClose extends Failure = never, TPhases extends UnitPhases = EmptyPhases> {
    #private;
    constructor(config: DotAppInternalConfig<TOpen, TClose, TPhases>);
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
    runConfigure(): DotConfigureOutcome<TPhases>;
    /** Public boot() — idempotent + concurrent-safe. */
    boot(): Promise<DotBootOutcome<TOpen, TClose, TPhases> | DotConfigureOutcome<TPhases>>;
    /** Boot an already configured app, without reaching configure callbacks. */
    bootConfigured(): Promise<DotBootOutcome<TOpen, TClose, TPhases>>;
    /** Public start(). Boots first if needed. Idempotent + concurrent-safe. */
    start(): Promise<DotStartOutcome<TOpen, TClose, TPhases> | DotConfigureOutcome<TPhases>>;
    /** Start an already configured app; configure failures are unreachable. */
    startConfigured(): Promise<DotStartOutcome<TOpen, TClose, TPhases>>;
    /** Start an already booted app; configure and boot failures are unreachable. */
    startBooted(): Promise<DotStartedOutcome<TClose, TPhases>>;
    /** Public stop(). Idempotent + concurrent-safe. */
    stop(): Promise<DotStopOutcome<TPhases>>;
    /** Public dispose(). Idempotent + concurrent-safe. */
    dispose(): Promise<DotDisposeOutcome<TClose, TPhases>>;
}
/** Re-export `ServiceKind` for the kernel's internal use. */
export { type ServiceKind } from '../manifest.js';
export { type Unit } from '../unit-contract.js';
//# sourceMappingURL=app-instance.d.ts.map