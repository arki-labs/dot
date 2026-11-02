/**
 * `dot _serve`: the runner `dot dev` uses when the project has no Vite config
 * and no `--run`. It starts the app in this process and keeps it running
 * until the CLI's signal aborts (SIGINT/SIGTERM, owned by `@arki/cli`), then
 * disposes it within 10 s.
 */
import type { Failure } from '@arki/failure';
export type RunServeOptions = {
    readonly app?: string | undefined;
    readonly cwd?: string | undefined;
    readonly signal: AbortSignal;
    /** How long `dispose` may take before `_serve` gives up on it. Default 10 s. */
    readonly disposeTimeoutMs?: number | undefined;
};
/** Start the app, wait for the abort, dispose it. */
export declare function runServe(options: RunServeOptions): Promise<{
    readonly app: string;
} | Failure>;
//# sourceMappingURL=serve.d.ts.map