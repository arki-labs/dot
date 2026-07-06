/**
 * Signal wiring for graceful shutdown.
 *
 * `hookSignals(app)` connects OS termination signals to the app's
 * lifecycle: on the first SIGTERM/SIGINT the app is disposed (which
 * cascades `stop()` when started — transitions are serialized, so a
 * signal racing a slow `start()` still ends in `disposed`), then the
 * signal is re-raised with the default handler restored so the process
 * terminates with conventional signal semantics.
 *
 * Design points:
 *
 *  - **First signal drains, second signal kills.** All handlers are
 *    removed the moment the first signal fires, so an impatient second
 *    Ctrl-C hits the runtime default (immediate termination) instead of
 *    a stuck drain.
 *  - **Bounded.** `timeoutMs` caps the drain. On timeout or dispose
 *    failure the process still terminates — exit code reflects the
 *    failure via the re-raised signal; the error is logged on
 *    `arki:dot:signals`.
 *  - **No `process.exit()`.** The signal is re-raised via
 *    `proc.kill(proc.pid, signal)` so the exit status is the standard
 *    128+n signal encoding — supervisors (systemd, Docker, Coolify)
 *    read it correctly.
 */
import { Logger } from '@arki/log';
/**
 * Wire termination signals to `app.dispose()`. Returns an unhook function
 * that removes the handlers without disposing — call it if the app is
 * torn down through another path first.
 *
 * ```ts
 * const app = await defineApp('shop').use(...).start();
 * hookSignals(app);                          // SIGTERM/SIGINT → drain → exit
 * hookSignals(app, { timeoutMs: 30_000 });   // slower drain budget
 * ```
 */
export function hookSignals(app, options = {}) {
    const signals = options.signals ?? ['SIGTERM', 'SIGINT'];
    const timeoutMs = options.timeoutMs ?? 10_000;
    const proc = options.proc ?? process;
    const logger = new Logger('arki:dot:signals', { 'dot.app.name': app.name });
    const handlers = new Map();
    const unhook = () => {
        for (const [signal, handler] of handlers)
            proc.off(signal, handler);
        handlers.clear();
    };
    for (const signal of signals) {
        const handler = () => {
            // First signal wins; the rest fall through to runtime defaults.
            unhook();
            logger.info('signal received — draining', { 'dot.signal': signal, 'dot.drain.timeout.ms': timeoutMs });
            void drainAndReraise({ app, signal, timeoutMs, proc, logger });
        };
        handlers.set(signal, handler);
        proc.once(signal, handler);
    }
    return unhook;
}
/** Dispose with a timeout cap, then re-raise the signal for default handling. */
async function drainAndReraise(args) {
    const { app, signal, timeoutMs, proc, logger } = args;
    let timer;
    const timedOut = new Promise(resolve => {
        timer = setTimeout(() => {
            resolve('timeout');
        }, timeoutMs);
        // A pending drain timer must never keep an otherwise-finished process alive.
        if (typeof timer === 'object' && 'unref' in timer)
            timer.unref();
    });
    try {
        const outcome = await Promise.race([app.dispose().then(() => 'disposed'), timedOut]);
        if (outcome === 'timeout') {
            logger.error('drain timed out — terminating without a clean dispose', {
                'dot.signal': signal,
                'dot.drain.timeout.ms': timeoutMs,
            });
        }
        else {
            logger.info('drain complete', { 'dot.signal': signal });
        }
    }
    catch (error) {
        logger.error('dispose failed during drain — terminating', {
            'dot.signal': signal,
            'dot.error.message': error instanceof Error ? error.message : String(error),
        });
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
        proc.kill(proc.pid, signal);
    }
}
//# sourceMappingURL=signals.js.map