/**
 * The failures the `dot` commands return. Each code is stable: agents branch
 * on `.error.code`. A returned failure exits 3; the framework's own
 * (`cli.unknown_command`, `cli.invalid_input`) exit 2.
 *
 * Data schemas are Standard Schemas built from type guards, so the public
 * types name no validator library (the `@arki/cli` pattern).
 */
import type { Failure } from '@arki/failure';
import type { StandardSchemaV1 } from '@arki/schema';
import type { DotDiagnosticsSnapshot } from '../diagnostics.js';
import type { DotNewOperation } from './json.js';
/** Base URL of the CLI error docs: an envelope's `error.docsUrl` is `<base>#<code with . and _ as ->`. */
export declare const DOT_CLI_DOCS_URL = "https://docs.arki.dev/dot/cli";
/** `doctor`'s verdict: the worst severity among all the snapshot's issues. */
export type DoctorStatus = 'success' | 'warning' | 'failure';
/** What `dot doctor` returns: the diagnostics snapshot and its verdict. */
export type DoctorReport = DotDiagnosticsSnapshot & {
    readonly status: DoctorStatus;
};
/** The docs link of a code, the way `@arki/cli` builds `error.docsUrl`. */
export declare function dotCliDocsUrl(code: string): string;
export type AppNotFoundData = {
    readonly cwd: string;
    readonly searched: readonly string[];
};
/**
 * No app file at the default paths and no `--app`.
 * @fix Create `dot.config.ts` that exports the app, or pass `--app <path>`.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppNotFound: import("@arki/failure").FailureDefinition<"dot.app_not_found", StandardSchemaV1<AppNotFoundData, AppNotFoundData>>;
export type AppInvalidExportData = {
    readonly filePath: string;
    /** The export that was picked and is not an app; null when none was picked. */
    readonly exportName: string | null;
    readonly exports: readonly string[];
    /** The exports that look like DOT apps, when there are several. */
    readonly matches: readonly string[];
};
/**
 * The app file loaded, but no export is a DOT app, or several are and none is `default` or `app`.
 * @fix Export the app as `default` or as `app`.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppInvalidExport: import("@arki/failure").FailureDefinition<"dot.app_invalid_export", StandardSchemaV1<AppInvalidExportData, AppInvalidExportData>>;
export type AppImportFailedData = {
    readonly filePath: string;
    /** The factory export that threw; null when the import itself threw. */
    readonly exportName: string | null;
    readonly causeMessage: string;
    /** The code of the thrown error, when it carries one (a declaration rejecting a mistake). */
    readonly causeCode: string | null;
    /** The thrown error's own fix, when it carries one. */
    readonly causeRemediation: string | null;
};
/**
 * Importing the app file threw, or its exported factory did.
 * @fix Apply `.error.data.causeRemediation` when it is set; otherwise run `bun <app file>` to reproduce.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppImportFailed: import("@arki/failure").FailureDefinition<"dot.app_import_failed", StandardSchemaV1<AppImportFailedData, AppImportFailedData>>;
export type AppLifecycleFailedData = {
    readonly phase: 'configure' | 'boot';
    readonly underlyingCode: string;
    readonly causeMessage: string;
};
/**
 * `configure` threw while the CLI prepared the app.
 * @fix Read `.error.data.underlyingCode` and look it up in the kernel error table; `ARKI_DOT_E020` means a provider is mounted after its consumer.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppLifecycleFailed: import("@arki/failure").FailureDefinition<"dot.app_lifecycle_failed", StandardSchemaV1<AppLifecycleFailedData, AppLifecycleFailedData>>;
/**
 * `doctor --observability` found no OpenTelemetry SDK. Reported as a warning issue in the snapshot, not returned.
 * @fix Register an OpenTelemetry SDK once at app entry, before any app boots.
 * @verify dot doctor --observability --json | jq '.data.issues'
 */
export declare const ObservabilityNoSdk: import("@arki/failure").FailureDefinition<"dot.observability_no_sdk", undefined>;
export type ProjectionNotFoundData = {
    readonly format: string;
    readonly registeredFormats: readonly string[];
};
/**
 * No unit registers the `--as` format.
 * @fix Use a format from `.error.data.registeredFormats`, or mount the adapter that provides it.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionNotFound: import("@arki/failure").FailureDefinition<"dot.projection_not_found", StandardSchemaV1<ProjectionNotFoundData, ProjectionNotFoundData>>;
export type ProjectionImportFailedData = {
    readonly specifier: string;
    readonly registeringPlugin: string;
    /** Where it failed: resolving the specifier, importing the module, or finding `project`. */
    readonly stage: 'resolve' | 'import' | 'export';
    readonly causeMessage: string | null;
};
/**
 * The projection module could not be resolved or imported, or exports no `project(manifest)`.
 * @fix Install the module and export a named `project(manifest)` function from it.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionImportFailed: import("@arki/failure").FailureDefinition<"dot.projection_import_failed", StandardSchemaV1<ProjectionImportFailedData, ProjectionImportFailedData>>;
export type ProjectionExecutionFailedData = {
    readonly format: string;
    readonly specifier: string;
    readonly registeringPlugin: string;
    readonly causeMessage: string;
};
/**
 * `project(manifest)` threw or returned output that does not survive a JSON round trip.
 * @fix Make `project(manifest)` pure and return JSON-round-trip-safe output.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionExecutionFailed: import("@arki/failure").FailureDefinition<"dot.projection_execution_failed", StandardSchemaV1<ProjectionExecutionFailedData, ProjectionExecutionFailedData>>;
export type ProjectionConflictData = {
    readonly format: string;
    readonly projections: readonly {
        readonly plugin: string;
        readonly module: string;
    }[];
};
/**
 * Two units register different modules for one projection format.
 * @fix Remove one registration, or make both units register the same module.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionConflict: import("@arki/failure").FailureDefinition<"dot.projection_conflict", StandardSchemaV1<ProjectionConflictData, ProjectionConflictData>>;
/**
 * `doctor` found error-severity issues. The data is the whole report: `.error.data.plugins[]`.
 * @fix Apply the `remediation` of each issue in `.error.data.plugins[].issues` and `.error.data.issues`.
 * @verify dot doctor --json | jq -e .ok
 */
export declare const DoctorFailed: import("@arki/failure").FailureDefinition<"dot.doctor_failed", StandardSchemaV1<DoctorReport, DoctorReport>>;
export type TargetNotEmptyData = {
    readonly target: string;
    readonly conflicting: readonly string[];
};
/**
 * `dot new` would overwrite files in a non-empty target directory.
 * @fix Choose an empty directory, or re-run with `--force` to overwrite.
 * @verify dot new <name> --dry-run --json | jq -e .ok
 */
export declare const TargetNotEmpty: import("@arki/failure").FailureDefinition<"dot.target_not_empty", StandardSchemaV1<TargetNotEmptyData, TargetNotEmptyData>>;
export type TemplateMissingData = {
    readonly templateRoot: string;
};
/**
 * The package's bundled template directory is empty or missing.
 * @fix Reinstall `@arki/dot`: it must ship its `templates/` directory.
 * @verify dot new <name> --dry-run --json | jq -e .ok
 */
export declare const TemplateMissing: import("@arki/failure").FailureDefinition<"dot.template_missing", StandardSchemaV1<TemplateMissingData, TemplateMissingData>>;
export type WriteFailedData = {
    readonly target: string;
    /** The files that were written before and after the failures. */
    readonly written: readonly DotNewOperation[];
    readonly failed: readonly {
        readonly path: string;
        readonly message: string;
    }[];
};
/**
 * `dot new` could not write some files. `written` lists the ones that landed.
 * @fix Check the permissions of the target directory, then re-run with `--force`.
 * @verify dot new <name> --dry-run --json | jq -e .ok
 */
export declare const WriteFailed: import("@arki/failure").FailureDefinition<"dot.write_failed", StandardSchemaV1<WriteFailedData, WriteFailedData>>;
/** `dot.app_lifecycle_failed` from what `configure` or `boot` threw. */
export declare function lifecycleFailed(error: unknown, phase: 'configure' | 'boot'): Failure;
export type DevDbUnreachableData = {
    /** The database URL with its password redacted, or `<not set>` / `<invalid>`. */
    readonly target: string;
    readonly reason: string;
};
/**
 * `dot dev` found no Postgres to talk to: no URL, a bad URL, or a closed port it could not start.
 * @fix Start the database, fix `DB_URL` in `.env`, or run `dot dev --db pglite`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevDbUnreachable: import("@arki/failure").FailureDefinition<"dot.dev_db_unreachable", StandardSchemaV1<DevDbUnreachableData, DevDbUnreachableData>>;
export type DevRunnerFailedData = {
    readonly command: string;
    readonly causeMessage: string;
};
/**
 * The app runner (`vite dev`, `--run`, or `dot _serve`) could not be started.
 * @fix Install the runner, or pass the command that serves the app with `dot dev --run "<cmd>"`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevRunnerFailed: import("@arki/failure").FailureDefinition<"dot.dev_runner_failed", StandardSchemaV1<DevRunnerFailedData, DevRunnerFailedData>>;
export type DevPortInUseData = {
    readonly port: number;
};
/**
 * Something already listens on the app port, so the runner would not get it.
 * @fix Stop the process on that port, or pick another one with `dot dev --port <n>`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevPortInUse: import("@arki/failure").FailureDefinition<"dot.dev_port_in_use", StandardSchemaV1<DevPortInUseData, DevPortInUseData>>;
export type DevAlreadyRunningData = {
    readonly pid: number;
    readonly statePath: string;
};
/**
 * Another `dot dev` is alive in this project: its pid is in the state file.
 * @fix Stop the other `dot dev`; if its pid is not a `dot dev`, delete the file in `.error.data.statePath`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevAlreadyRunning: import("@arki/failure").FailureDefinition<"dot.dev_already_running", StandardSchemaV1<DevAlreadyRunningData, DevAlreadyRunningData>>;
export type DevRemoteDbRefusedData = {
    /** The database URL with its password redacted. */
    readonly target: string;
    readonly host: string;
    /** Where the URL came from: `DB_URL in .env.local`, `DATABASE_URL in process env`. */
    readonly source: string;
};
/**
 * The database is neither on this machine nor a compose service: `dot dev` would migrate it on boot.
 * @fix Point every database URL at this machine or a compose service, or pass `--allow-remote-db` on purpose.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevRemoteDbRefused: import("@arki/failure").FailureDefinition<"dot.dev_remote_db_refused", StandardSchemaV1<DevRemoteDbRefusedData, DevRemoteDbRefusedData>>;
export type DevAppStartedData = {
    readonly filePath: string;
    readonly exportName: string;
};
/**
 * The app export is already configured, booted or started: `dot dev` cannot own its lifecycle.
 * @fix Export the unstarted builder: no `configure()`, `boot()` or `start()` call on the `dev` export.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevAppStarted: import("@arki/failure").FailureDefinition<"dot.dev_app_started", StandardSchemaV1<DevAppStartedData, DevAppStartedData>>;
export type DevPreflightFailedData = {
    /** What went wrong with the preflight process: it crashed, hung, or did not report. */
    readonly reason: string;
    /** Its exit code; null when it was killed or is still running. */
    readonly exitCode: number | null;
    /** Its last output lines. */
    readonly output: readonly string[];
};
/**
 * The preflight process did not report a result: a crash, a hang past the timeout, or output that is not its report. Never a pass.
 * @fix Read `.error.data.output`, then run `dot doctor --app <file>` to see the same boot in the foreground.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevPreflightFailed: import("@arki/failure").FailureDefinition<"dot.dev_preflight_failed", StandardSchemaV1<DevPreflightFailedData, DevPreflightFailedData>>;
/**
 * A managed preflight reported a lifecycle failure, retaining the complete report.
 * @fix Read `.error.data.failure.code` and apply its message; inspect `.error.data.report` for diagnostics.
 * @verify dot _preflight --json | jq '.error.data.failure.code'
 * @example
 * ```ts
 * import { PreflightFailed } from '@arki/dot/cli';
 * const failure = PreflightFailed({
 *   app: null, migrations: null, report: null,
 *   failure: { code: 'app.refused', message: 'Setup refused.', data: null },
 * });
 * ```
 */
export declare const PreflightFailed: import("@arki/failure").FailureDefinition<"dot.preflight_failed", StandardSchemaV1<{
    app: {
        file: string;
        exportName: string;
        plugins: number;
        features: number;
    } | null;
    migrations: string[] | null;
    report: {
        [x: string]: unknown;
        status: "failure" | "success" | "warning";
        plugins: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        actions: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        services: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        lifecycle: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        issues: {
            [x: string]: unknown;
            code: string;
        }[];
    } | null;
    failure: {
        code: string;
        message: string;
        data: unknown;
    } | null;
}, {
    app: {
        file: string;
        exportName: string;
        plugins: number;
        features: number;
    } | null;
    migrations: string[] | null;
    report: {
        [x: string]: unknown;
        status: "failure" | "success" | "warning";
        plugins: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        actions: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        services: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        lifecycle: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        issues: {
            [x: string]: unknown;
            code: string;
        }[];
    } | null;
    failure: {
        code: string;
        message: string;
        data: unknown;
    } | null;
}>>;
//# sourceMappingURL=failures.d.ts.map