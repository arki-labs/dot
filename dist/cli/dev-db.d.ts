import type { Failure } from '@arki/failure';
import type { DevEvent } from './dev-events.js';
import type { Probe } from './dev-net.js';
export type DbChoice = 'auto' | 'pglite' | 'pg';
export type ExecResult = {
    readonly code: number;
    readonly stdout: string;
    readonly stderr: string;
};
/** Run a program to completion. Injectable in tests. A missing program resolves with code 127. */
export type Exec = (command: string, args: readonly string[], options: {
    readonly cwd: string;
}) => Promise<ExecResult>;
export declare const execFile: Exec;
type Env = Readonly<Record<string, string>>;
/** The env files of the project, lowest precedence first (the Vite order for the `development` mode). */
export declare const ENV_FILES: readonly ['.env', '.env.local', '.env.development', '.env.development.local'];
/** The project's env files merged in precedence order, overridden by the process env. */
export declare function mergedEnv(cwd: string, processEnv: Readonly<Record<string, string | undefined>>): Promise<Failure<"env.decryption_failed", undefined> | Failure<"env.file_read_failed", {
    file: string;
}> | Failure<"schema.async_required", undefined> | Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | Failure<"schema.validator_defect", undefined> | Readonly<Record<string, string>>>;
/** The URL for display: password replaced by `***`, also a `password` query parameter. */
export declare function redactUrl(url: URL): string;
/** `localhost`, `127.0.0.0/8`, `::1`, or a Unix socket directory. */
export declare function isLoopbackHost(host: string): boolean;
export type ComposeService = {
    readonly name: string;
    readonly publishedPorts: readonly number[];
};
/**
 * The services of the project's compose file, from `docker compose config
 * --format json`. Null without a compose file; empty when docker cannot read it.
 */
export declare function composeServices(cwd: string, exec: Exec): Promise<readonly ComposeService[] | null>;
export type DbEvent = Extract<DevEvent, {
    readonly kind: 'db';
}>;
/** What the database step decided: the event, and the env the preflight and runner get. */
export type PreparedDb = {
    readonly event: DbEvent;
    readonly env: Env;
};
export type PrepareDbOptions = {
    readonly cwd: string;
    readonly db: DbChoice;
    readonly allowRemoteDb: boolean;
    /** The process env; merged over `.env`. */
    readonly env: Readonly<Record<string, string | undefined>>;
    readonly exec?: Exec | undefined;
    readonly probe?: Probe | undefined;
    readonly lookup?: Lookup | undefined;
    readonly signal?: AbortSignal | undefined;
    /** Progress lines (`starting compose service db`). */
    readonly info?: ((line: string) => void) | undefined;
    /** How long to wait for a started compose service. Default 30 s. */
    readonly startTimeoutMs?: number | undefined;
    /** How often to probe a starting service. Default 500 ms. */
    readonly pollIntervalMs?: number | undefined;
};
/** Resolve a host name to its addresses; null when it does not resolve. Injectable in tests. */
export type Lookup = (host: string) => Promise<readonly string[] | null>;
export declare const lookupHost: Lookup;
/** The driver `--db` picks with this env: `auto` is pg when a URL is set. */
export declare function selectDriver(db: DbChoice, env: Env): 'pglite' | 'pg';
/** `env` without `DB_URL` and `DATABASE_URL`: under pglite, no URL may reach the app. */
export declare function withoutDbUrls(env: Env): Env;
/**
 * Decide the database, check it is local, and start its compose service
 * when it is closed. Fails closed: every `DB_URL` / `DATABASE_URL` value in
 * the process env and in every env file must be local, under pglite too,
 * because a runner (Vite, Nitro) may load those files again on its own.
 */
export declare function prepareDb(options: PrepareDbOptions): Promise<PreparedDb | Failure>;
export {};
//# sourceMappingURL=dev-db.d.ts.map