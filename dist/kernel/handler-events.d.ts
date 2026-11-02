/**
 * The `$handlers` kernel key: one handler call becomes `starting`, then
 * `completed` or `failed`, fanned out to the app's lifecycle observers.
 *
 * Transport adapters (rpc, http, job, schedule) wrap each call in `run`; this
 * file owns the one rule for what an outcome is, so the transports agree:
 * a returned `Failure` is a refusal (`completed/refused`), a throw is `failed`,
 * unless the transport's `outcome` reads its own values or throws differently.
 */
import type { DotHandlerLifecycleEvent } from '../lifecycle-observer.js';
import type { DotHandlerObserver } from '../unit-contract.js';
/** What the app instance lends one unit's observer: who it is, whether anyone listens, where events go. */
export type HandlerObserverSource = {
    readonly appName: string;
    /** The unit's `$unit`. */
    readonly feature: string;
    readonly hasObservers: () => boolean;
    readonly emit: (event: DotHandlerLifecycleEvent) => void;
};
export declare function handlerObserverFor(source: HandlerObserverSource): DotHandlerObserver;
//# sourceMappingURL=handler-events.d.ts.map