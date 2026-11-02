import type { Mode, Ui } from '@arki/cli';
import type { Failure } from '@arki/failure';
import type { DbChoice, Exec, Lookup } from './dev-db.js';
import type { DevEvent } from './dev-events.js';
import type { Probe } from './dev-net.js';
export type RunDevOptions = {
    /** App file (default: discovery's search list). */
    readonly app?: string | undefined;
    readonly cwd?: string | undefined;
    readonly db: DbChoice;
    /** Accept a database that is neither local nor a compose service. Boot migrates it. */
    readonly allowRemoteDb: boolean;
    readonly port: number;
    readonly consolePort: number;
    /** Hand `CONSOLE_PORT` to the runner and announce the console URL once it appears in `dev.json`. */
    readonly console: boolean;
    /** Open the console URL in the browser when it appears. */
    readonly open: boolean;
    /** Stop after the preflight: no runner. */
    readonly once: boolean;
    /** A shell command line that serves the app, instead of Vite or `dot _serve`. */
    readonly run?: string | undefined;
    readonly ui: Ui;
    readonly mode: Mode;
    /** Aborting it ends the session: the runner is stopped, `dev.json` removed. */
    readonly signal: AbortSignal;
    /** Sees every event as it happens; the result lists them all at the end. */
    readonly onEvent?: ((event: DevEvent) => void) | undefined;
    /** The process env, merged over `.env`. Default `process.env`. */
    readonly env?: Readonly<Record<string, string | undefined>> | undefined;
    readonly exec?: Exec | undefined;
    readonly probe?: Probe | undefined;
    readonly lookup?: Lookup | undefined;
    /** How to start the `dot` CLI for `_serve`: the program, then its entry script. Default: this runtime and this CLI. */
    readonly cliEntry?: readonly [string, ...string[]] | undefined;
    /** Where keys are read from in a text-mode terminal. Default `process.stdin`. */
    readonly stdin?: KeyInput | undefined;
    readonly openUrl?: ((url: string) => void) | undefined;
    /** How long the runner gets between SIGTERM and SIGKILL. Default 10 s. */
    readonly stopGraceMs?: number | undefined;
    /** How long one preflight process may run before it is killed and the preflight fails. Default 120 s. */
    readonly preflightTimeoutMs?: number | undefined;
};
/** What `dot dev` succeeds with: every event, so `--output ndjson` prints one per line. */
export type DevResult = {
    readonly items: DevEvent[];
};
/** The CLI entry next to this module: `index.ts` from source, `index.js` from `dist`; under Bun with `--no-env-file`. */
export declare function defaultCliEntry(isBun?: boolean): readonly [string, ...string[]];
/** Open `url` in the browser. A missing opener is logged, never a failure. */
export declare function openInBrowser(url: string): void;
/** What keys are read from: the parts of `process.stdin` `dot dev` uses. */
export type KeyInput = {
    readonly isTTY?: boolean | undefined;
    setRawMode?(mode: boolean): unknown;
    on(event: 'data', listener: (chunk: Buffer | string) => void): unknown;
    off(event: 'data', listener: (chunk: Buffer | string) => void): unknown;
    resume(): unknown;
    pause(): unknown;
};
/**
 * Run one `dot dev` session. Returns every event, or the failure that
 * stopped it before the runner ran (discovery, `dev.json`, db, preflight,
 * runner). Failures after the start are printed and the session waits for
 * a change.
 */
export declare function runDev(options: RunDevOptions): Promise<DevResult | Failure>;
//# sourceMappingURL=dev.d.ts.map