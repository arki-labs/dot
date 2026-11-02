import { Deadline } from '@arki/async';
import { isFailure, UnexpectedDefect } from '@arki/failure';
import { getLogger } from '@arki/log';
import { sleep } from './dev-net.js';
import { discoverApp, guards } from './discover.js';
import { DevAppStarted, lifecycleFailed } from './failures.js';
const debugServe = getLogger('arki:dot:cli:dev');
/** Start the app, wait for the abort, dispose it. */
export async function runServe(options) {
    const discovered = await discoverApp({ appPath: options.app, cwd: options.cwd, prefer: 'dev' });
    if (isFailure(discovered))
        return discovered;
    const builder = discovered.app;
    if (!guards.isDotAppBuilder(builder)) {
        return DevAppStarted({ filePath: discovered.filePath, exportName: discovered.exportName });
    }
    let app;
    try {
        app = await builder.start();
    }
    catch (error) {
        return lifecycleFailed(error, 'boot');
    }
    if (isFailure(app))
        return app;
    let disposalFailure;
    // An app with no server holds no handle; this timer keeps the process alive until the stop.
    const keepAlive = setInterval(() => {
        // Nothing to do: the timer only keeps the event loop alive.
    }, 2 ** 30);
    try {
        await new Promise(resolve => {
            if (options.signal.aborted)
                resolve();
            else
                options.signal.addEventListener('abort', () => resolve(), { once: true });
        });
    }
    finally {
        clearInterval(keepAlive);
        const timeoutMs = options.disposeTimeoutMs ?? 10_000;
        const gaveUp = new AbortController();
        const disposed = app
            .dispose()
            .catch((error) => UnexpectedDefect({ cause: error }))
            .then(outcome => {
            if (isFailure(outcome)) {
                debugServe.error('dispose failed: {code}', { code: outcome.code });
            }
            return outcome;
        });
        const outcome = await Promise.race([disposed, sleep(timeoutMs, gaveUp.signal).then(() => Deadline())]);
        gaveUp.abort();
        if (isFailure(outcome))
            disposalFailure = outcome;
    }
    if (disposalFailure !== undefined)
        return disposalFailure;
    return { app: app.name };
}
//# sourceMappingURL=serve.js.map