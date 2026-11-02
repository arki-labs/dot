/**
 * Ready-made observers for handler events (rpc, http, job, schedule): report
 * the bugs, log the traffic. Both read the `kind: 'handler'` events the kernel
 * fans out to the app's lifecycle observers, so they work on every transport.
 *
 *   defineApp('shop', { observers: [reportErrors({ report: (error, ref) => captureException(error) })] })
 */
import type { DotLifecycleObserver } from './lifecycle-observer.js';
import type { DotHandlerRef } from './unit-contract.js';
/** What `reportErrors` hands its reporter with the error: the transport, the entry name and the owning feature. */
export type HandlerErrorRef = DotHandlerRef & {
    readonly feature: string;
};
export type ReportErrorsOptions = {
    readonly report: (error: unknown, ref: HandlerErrorRef) => void;
};
/**
 * Send a handler's unexpected failures to your error tracker, on any transport.
 *
 * Only `failed` events reach `report`: a thrown bug. A refusal (a returned
 * `Failure`, an oRPC error below 500) is normal traffic, not an incident. The
 * observer cannot change the response: `report` runs synchronously, and a
 * reporter that throws is logged at warn on `arki:dot:handlers` and ignored.
 */
export declare function reportErrors(options: ReportErrorsOptions): DotLifecycleObserver;
/**
 * Log every handler call at DEBUG on `arki:dot:handlers`: one line when it ends,
 * `rpc digest.preview ok 12ms`, with the error attached when it failed. Opt-in:
 * with no observer registered the kernel emits nothing, so an app that does not
 * mount this pays nothing per call.
 */
export declare function logHandlers(): DotLifecycleObserver;
//# sourceMappingURL=handler-observers.d.ts.map