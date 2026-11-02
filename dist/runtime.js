import { scopeAggregate, ScopeFailed } from '@arki/async';
import { defineFailure, isFailure, UnexpectedDefect } from '@arki/failure';
import { hookSignals } from './signals.js';
/**
 * A replaced module no longer owns the application's runtime.
 * @fix Obtain the runtime exported by the current module.
 * @verify bun run test -- src/tests/app-runtime.test.ts
 */
export const RuntimeReplaced = defineFailure('dot.runtime_replaced', {
    status: 503,
    message: 'This module was replaced; the current module owns the application.',
    remediation: 'Obtain the runtime exported by the current module.',
});
/**
 * Previous ownership could not be released, so starting another app is unsafe.
 * @fix Resolve the disposal failure before starting another owner of the resources.
 * @verify bun run test -- src/tests/app-runtime.test.ts
 */
export const RuntimeReleaseFailed = defineFailure('dot.runtime_release_failed', {
    status: 500,
    message: 'The previous application could not release its resources.',
    remediation: 'Resolve the disposal failure before starting another owner of the resources.',
});
const DISPOSING_KEY = 'arki.appRuntime.disposing';
function failed(value) {
    return isFailure(value);
}
function startedApp(value) {
    return !isFailure(value);
}
function cleanupFailed(outcome) {
    return ScopeFailed.is(outcome) && outcome.data.cleanupCount > 0;
}
/** HMR data is an untyped edge; preserve its failure privately under one canonical definition. */
async function previousDisposal(previous) {
    if (previous === undefined)
        return;
    try {
        const outcome = await Promise.resolve(previous);
        if (outcome !== undefined)
            return RuntimeReleaseFailed({ cause: outcome });
    }
    catch (error) {
        return RuntimeReleaseFailed({ cause: error });
    }
    return;
}
async function disposeOwned(dispose) {
    try {
        return await dispose();
    }
    catch (error) {
        return UnexpectedDefect({ cause: error });
    }
}
/**
 * Start one Dot app per module instance and wait for prior HMR disposal.
 * Resolved start failures are never cached as ready. A failed release prevents
 * another owner from starting. Replaced modules return RuntimeReplaced.
 *
 * @example
 * const runtime = createAppRuntime(app, { hot: import.meta.hot });
 * export const getApp = runtime.get;
 */
export function createAppRuntime(app, options = {}) {
    const { hot, onStarted, eager = false } = options;
    const previousGone = previousDisposal(hot?.data[DISPOSING_KEY]);
    let running;
    let unhookSignals;
    let replaced = false;
    let releaseFailure;
    async function start() {
        const previous = await previousGone;
        if (previous !== undefined)
            return previous;
        if (releaseFailure !== undefined)
            return releaseFailure;
        if (replaced)
            return RuntimeReplaced();
        let started;
        try {
            started = await app.start();
        }
        catch (error) {
            // An unmanaged thrown start has no typed proof that rollback completed.
            releaseFailure = RuntimeReleaseFailed({ cause: error });
            return UnexpectedDefect({ cause: error });
        }
        if (!startedApp(started)) {
            if (cleanupFailed(started)) {
                releaseFailure = RuntimeReleaseFailed({ cause: started });
            }
            return started;
        }
        try {
            onStarted?.(started);
            if (!replaced)
                unhookSignals = hookSignals(started);
        }
        catch (error) {
            const failure = UnexpectedDefect({ cause: error });
            const disposed = await disposeOwned(() => started.dispose());
            if (failed(disposed)) {
                releaseFailure = RuntimeReleaseFailed({ cause: disposed });
                return scopeAggregate([failure], [disposed]);
            }
            return failure;
        }
        return started;
    }
    hot?.dispose(data => {
        replaced = true;
        const current = running;
        running = undefined;
        unhookSignals?.();
        unhookSignals = undefined;
        // This promise always resolves, so HMR without a replacement module cannot
        // leave an unobserved rejection. The next module validates its outcome.
        data[DISPOSING_KEY] = (async () => {
            const previous = await previousGone;
            if (previous !== undefined)
                return previous;
            if (releaseFailure !== undefined)
                return releaseFailure;
            if (current === undefined)
                return;
            const started = await current;
            if (!startedApp(started))
                return releaseFailure;
            return disposeOwned(() => started.dispose());
        })();
    });
    function get() {
        if (replaced)
            return Promise.resolve(RuntimeReplaced());
        running ??= start().then(outcome => {
            if (failed(outcome))
                running = undefined;
            return outcome;
        });
        return running;
    }
    // eslint-disable-next-line failure/must-use -- the first `get()` observes the same outcome: a success is cached in `running`, a failure is not and that `get()` retries.
    if (eager)
        void get();
    return { get };
}
//# sourceMappingURL=runtime.js.map