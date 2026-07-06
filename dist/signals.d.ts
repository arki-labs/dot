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
/**
 * The slice of `process` the signal hook touches. Injectable so tests can
 * drive signals through a fake without terminating the test runner —
 * defaults to the real `process`.
 */
export type SignalTarget = {
    readonly pid: number;
    once(event: string, listener: (...args: never[]) => void): unknown;
    off(event: string, listener: (...args: never[]) => void): unknown;
    kill(pid: number, signal?: string): unknown;
};
export type HookSignalsOptions = {
    /** Signals to intercept. Default: `['SIGTERM', 'SIGINT']`. */
    readonly signals?: readonly string[];
    /**
     * Maximum time the drain (`dispose()`) may take before the process is
     * terminated anyway. Default: 10 000 ms.
     */
    readonly timeoutMs?: number;
    /** Test seam — a process-like target. Default: the real `process`. */
    readonly proc?: SignalTarget;
};
/** The app surface the hook needs — satisfied by any `DotApp`. */
export type Disposable = {
    readonly name: string;
    dispose(): Promise<void>;
};
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
export declare function hookSignals(app: Disposable, options?: HookSignalsOptions): () => void;
//# sourceMappingURL=signals.d.ts.map