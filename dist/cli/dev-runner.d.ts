import type { Failure } from '@arki/failure';
export type RunnerKind = 'run' | 'vite' | 'serve';
/** A child process to spawn. `shell` runs `file` as one shell command line (`--run`). */
export type ProcessSpec = {
    /** The command line, for people. */
    readonly command: string;
    readonly file: string;
    readonly args: readonly string[];
    readonly shell: boolean;
};
/** What to spawn as the runner. */
export type RunnerSpec = ProcessSpec & {
    readonly kind: RunnerKind;
};
export type ChooseRunnerOptions = {
    readonly cwd: string;
    readonly run?: string | undefined;
    readonly port: number;
    /** The app file, handed to `_serve`. */
    readonly appFile: string;
    /** How to start the `dot` CLI: the program, then its entry script. */
    readonly cliEntry: readonly [string, ...string[]];
};
/** Pick the runner: `--run` wins, then a Vite config, then `dot _serve`. A Vite config without the binary is `dot.dev_runner_failed`. */
export declare function chooseRunner(options: ChooseRunnerOptions): Promise<RunnerSpec | Failure>;
/** The last lines of runner output: at most `maxLines` lines and `maxBytes` bytes; the oldest go first. */
export type OutputBuffer = {
    push(line: string): void;
    lines(): readonly string[];
    /** How many lines were dropped to stay within the bounds. */
    readonly dropped: number;
};
export declare function createOutputBuffer(maxLines?: number, maxBytes?: number): OutputBuffer;
export type RunnerExit = {
    readonly code: number | null;
    readonly signal: NodeJS.Signals | null;
};
export type RunnerHandle = {
    readonly pid: number;
    readonly spec: ProcessSpec;
    /** Settles when the child itself exits. */
    readonly exited: Promise<RunnerExit>;
    /** True once `stop` was called: an exit after it is ours, not a crash. */
    readonly stopping: boolean;
    /** SIGTERM the group, wait up to `graceMs`, then SIGKILL the group. Safe to call twice. */
    stop(graceMs?: number): Promise<RunnerExit>;
    /** SIGKILL the group now, synchronously: for a supervisor that is about to die. */
    kill(): void;
};
export type StartRunnerOptions = {
    readonly cwd: string;
    readonly env: Readonly<Record<string, string>>;
    /** Each output line, stdout and stderr, as written. */
    readonly onLine: (line: string) => void;
};
/** Spawn the runner. Resolves once the child runs, or with `dot.dev_runner_failed` when it cannot start. */
export declare function startRunner(spec: ProcessSpec, options: StartRunnerOptions): Promise<RunnerHandle | Failure>;
//# sourceMappingURL=dev-runner.d.ts.map