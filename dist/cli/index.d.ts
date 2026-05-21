#!/usr/bin/env node
/**
 * `dot` CLI entry point.
 *
 * Two commands are wired today (more land in v1.1):
 *   - `dot explain` — print the static app graph (manifest)
 *   - `dot doctor`  — boot the app and print runtime diagnostics
 *
 * Common options:
 *   --json       Emit JSON envelope instead of human-readable text
 *   --app <p>    Path to the app file (overrides auto-discovery)
 *   --cwd <p>    Working directory (default: process.cwd())
 *   --help       Show help
 *   --version    Print version
 *
 * Exit codes: `0` on success/warning envelopes (doctor warnings still mean the
 * app booted), `1` on `failure` envelopes and on every structured CLI error.
 */
import type { DiscoveredApp } from './discover.js';
import type { DotCliEnvelope } from './render-explain.js';
import { DotCliError, DotCliErrorCode, dotCliDocsUrl } from './error-codes.js';
export type CliCommand = 'explain' | 'doctor' | 'new' | 'help' | 'version';
export type CliArgs = {
    command: CliCommand;
    json: boolean;
    appPath?: string;
    cwd?: string;
    /** Positional after the command (used by `new` for the app name). */
    positional?: string;
    /** `--target` (only honored by `new`). */
    target?: string;
    /** `--pm` (only honored by `new`). */
    pm?: 'npm' | 'pnpm' | 'bun';
    /** `--dry-run` (only honored by `new`). */
    dryRun?: boolean;
    /** `--force` (only honored by `new`). */
    force?: boolean;
    /** `--observability` (only honored by `doctor`). */
    observability?: boolean;
};
/**
 * Parse argv into a typed shape. Exported so tests can exercise it without
 * spawning the binary.
 */
export declare function parseArgs(argv: readonly string[]): CliArgs;
/**
 * Run `explain` on a discovered app.
 * Pure dependency on a `DiscoveredApp` so tests can pass synthetic values.
 */
export declare function runExplain(discovered: DiscoveredApp, opts: {
    json: boolean;
    out?: (line: string) => void;
    now?: () => Date;
}): Promise<DotCliEnvelope<unknown>>;
type DoctorRunOptions = {
    json: boolean;
    out?: (line: string) => void;
    now?: () => Date;
    /**
     * When `true`, probes for a registered OpenTelemetry SDK and injects
     * a warning-severity issue into the diagnostics envelope when none is
     * present. Default `false`.
     */
    observability?: boolean;
};
/**
 * Run `doctor` on a discovered app. The CLI owns boot+dispose only when it
 * receives a builder. If the caller passed an already-booted app, we leave
 * lifecycle to them.
 *
 * If `boot()` throws, doctor's job is still to surface diagnostics — so we
 * pre-configure the builder, then re-read the configured seam's diagnostics
 * even after a boot throw. This is the whole point of `doctor`: failure
 * should be observable, not opaque.
 */
export declare function runDoctor(discovered: DiscoveredApp, opts: DoctorRunOptions): Promise<DotCliEnvelope<unknown>>;
type MainOptions = {
    argv: readonly string[];
    stdout?: (line: string) => void;
    stderr?: (line: string) => void;
    now?: () => Date;
};
/**
 * Run the CLI. Returns the exit code so tests can assert without calling
 * `process.exit`. Real entry point at the bottom of the file calls `exit()`.
 */
export declare function main(options: MainOptions): Promise<number>;
/**
 * Re-exports for test consumers and adapter packages.
 */
export { DotCliError, DotCliErrorCode, dotCliDocsUrl };
export type { DotCliEnvelope, DotCliEnvelopeStatus } from './render-explain.js';
export { runNew } from './new.js';
export type { DotNewEnvelope, DotNewOperation } from './json.js';
//# sourceMappingURL=index.d.ts.map