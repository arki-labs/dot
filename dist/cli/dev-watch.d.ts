import type { RunnerKind } from './dev-runner.js';
export type ChangeKind = 'full' | 'runner' | 'ignore';
/**
 * What a change to `relative` (project-relative, `/` separators) does.
 * `appFile` is the app file, project-relative the same way.
 */
export declare function classifyChange(relative: string, context: {
    readonly appFile: string;
    readonly runner: RunnerKind;
}): ChangeKind;
export type ProjectWatcher = {
    close(): void;
};
export type WatchOptions = {
    readonly cwd: string;
    /** The app file, project-relative with `/` separators: watched when it sits at the project root. */
    readonly appFile: string;
    /** Called once per quiet period with every path that changed in it. */
    readonly onChanges: (paths: readonly string[]) => void;
    readonly debounceMs?: number;
};
/** Watch `src/` and `drizzle/` recursively and the project root for `.env*` and the app file. */
export declare function watchProject(options: WatchOptions): ProjectWatcher;
export type RestartRequest = {
    /** `full`: db step, preflight and runner; `runner`: the runner only. */
    readonly kind: 'full' | 'runner';
    readonly reason: 'file' | 'key';
    readonly path?: string | undefined;
};
export type RestartScheduler = {
    request(request: RestartRequest): void;
    /** Resolves once no restart runs and none is pending. */
    idle(): Promise<void>;
};
/**
 * Run restarts one at a time. Requests that arrive while one runs collapse
 * into a single pending one (the dirty flag), run once the current one ends.
 */
export declare function createRestartScheduler(restart: (request: RestartRequest) => Promise<void>, onError: (error: unknown) => void): RestartScheduler;
//# sourceMappingURL=dev-watch.d.ts.map