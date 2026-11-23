/**
 * The failures the `dot` commands return. Each code is stable: agents branch
 * on `.error.code`. A returned failure exits 3; the framework's own
 * (`cli.unknown_command`, `cli.invalid_input`) exit 2.
 *
 * Each failure's `data` is a zod schema; its exported `...Data` type is the
 * schema's output, so a shape is written once.
 */
import { z } from 'zod';
import type { Failure } from '@arki/failure';
import type { DotDiagnosticsSnapshot } from '../diagnostics.js';
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
declare const appNotFoundDataSchema: z.ZodReadonly<z.ZodObject<{
    cwd: z.ZodString;
    searched: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export type AppNotFoundData = z.output<typeof appNotFoundDataSchema>;
/**
 * No app file at the default paths and no `--app`.
 * @fix Create `dot.config.ts` that exports the app, or pass `--app <path>`.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppNotFound: import("@arki/failure").FailureDefinition<"dot.app_not_found", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    cwd: string;
    searched: readonly string[];
}>, Readonly<{
    cwd: string;
    searched: readonly string[];
}>>>;
declare const appInvalidExportDataSchema: z.ZodReadonly<z.ZodObject<{
    filePath: z.ZodString;
    exportName: z.ZodNullable<z.ZodString>;
    exports: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    matches: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export type AppInvalidExportData = z.output<typeof appInvalidExportDataSchema>;
/**
 * The app file loaded, but no export is a DOT app, or several are and none is `default` or `app`.
 * @fix Export the app as `default` or as `app`.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppInvalidExport: import("@arki/failure").FailureDefinition<"dot.app_invalid_export", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    filePath: string;
    exportName: string | null;
    exports: readonly string[];
    matches: readonly string[];
}>, Readonly<{
    filePath: string;
    exportName: string | null;
    exports: readonly string[];
    matches: readonly string[];
}>>>;
declare const appImportFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    filePath: z.ZodString;
    exportName: z.ZodNullable<z.ZodString>;
    causeMessage: z.ZodString;
    causeCode: z.ZodNullable<z.ZodString>;
    causeRemediation: z.ZodNullable<z.ZodString>;
}, z.core.$strip>>;
export type AppImportFailedData = z.output<typeof appImportFailedDataSchema>;
/**
 * Importing the app file threw, or its exported factory did.
 * @fix Apply `.error.data.causeRemediation` when it is set; otherwise run `bun <app file>` to reproduce.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppImportFailed: import("@arki/failure").FailureDefinition<"dot.app_import_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    filePath: string;
    exportName: string | null;
    causeMessage: string;
    causeCode: string | null;
    causeRemediation: string | null;
}>, Readonly<{
    filePath: string;
    exportName: string | null;
    causeMessage: string;
    causeCode: string | null;
    causeRemediation: string | null;
}>>>;
declare const appLifecycleFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    phase: z.ZodEnum<{
        boot: "boot";
        configure: "configure";
    }>;
    underlyingCode: z.ZodString;
    causeMessage: z.ZodString;
}, z.core.$strip>>;
export type AppLifecycleFailedData = z.output<typeof appLifecycleFailedDataSchema>;
/**
 * `configure` threw while the CLI prepared the app.
 * @fix Read `.error.data.underlyingCode` and look it up in the kernel error table; `ARKI_DOT_E020` means a provider is mounted after its consumer.
 * @verify dot explain --json | jq -e .ok
 */
export declare const AppLifecycleFailed: import("@arki/failure").FailureDefinition<"dot.app_lifecycle_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    phase: "boot" | "configure";
    underlyingCode: string;
    causeMessage: string;
}>, Readonly<{
    phase: "boot" | "configure";
    underlyingCode: string;
    causeMessage: string;
}>>>;
/**
 * `doctor --observability` found no OpenTelemetry SDK. Reported as a warning issue in the snapshot, not returned.
 * @fix Register an OpenTelemetry SDK once at app entry, before any app boots.
 * @verify dot doctor --observability --json | jq '.data.issues'
 */
export declare const ObservabilityNoSdk: import("@arki/failure").FailureDefinition<"dot.observability_no_sdk", undefined>;
declare const projectionNotFoundDataSchema: z.ZodReadonly<z.ZodObject<{
    format: z.ZodString;
    registeredFormats: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export type ProjectionNotFoundData = z.output<typeof projectionNotFoundDataSchema>;
/**
 * No unit registers the `--as` format.
 * @fix Use a format from `.error.data.registeredFormats`, or mount the adapter that provides it.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionNotFound: import("@arki/failure").FailureDefinition<"dot.projection_not_found", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    format: string;
    registeredFormats: readonly string[];
}>, Readonly<{
    format: string;
    registeredFormats: readonly string[];
}>>>;
declare const projectionImportFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    specifier: z.ZodString;
    registeringPlugin: z.ZodString;
    stage: z.ZodEnum<{
        export: "export";
        import: "import";
        resolve: "resolve";
    }>;
    causeMessage: z.ZodNullable<z.ZodString>;
}, z.core.$strip>>;
export type ProjectionImportFailedData = z.output<typeof projectionImportFailedDataSchema>;
/**
 * The projection module could not be resolved or imported, or exports no `project(manifest)`.
 * @fix Install the module and export a named `project(manifest)` function from it.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionImportFailed: import("@arki/failure").FailureDefinition<"dot.projection_import_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    specifier: string;
    registeringPlugin: string;
    stage: "export" | "import" | "resolve";
    causeMessage: string | null;
}>, Readonly<{
    specifier: string;
    registeringPlugin: string;
    stage: "export" | "import" | "resolve";
    causeMessage: string | null;
}>>>;
declare const projectionExecutionFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    format: z.ZodString;
    specifier: z.ZodString;
    registeringPlugin: z.ZodString;
    causeMessage: z.ZodString;
}, z.core.$strip>>;
export type ProjectionExecutionFailedData = z.output<typeof projectionExecutionFailedDataSchema>;
/**
 * `project(manifest)` threw or returned output that does not survive a JSON round trip.
 * @fix Make `project(manifest)` pure and return JSON-round-trip-safe output.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionExecutionFailed: import("@arki/failure").FailureDefinition<"dot.projection_execution_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    format: string;
    specifier: string;
    registeringPlugin: string;
    causeMessage: string;
}>, Readonly<{
    format: string;
    specifier: string;
    registeringPlugin: string;
    causeMessage: string;
}>>>;
declare const projectionConflictDataSchema: z.ZodReadonly<z.ZodObject<{
    format: z.ZodString;
    projections: z.ZodReadonly<z.ZodArray<z.ZodReadonly<z.ZodObject<{
        plugin: z.ZodString;
        module: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strip>>;
export type ProjectionConflictData = z.output<typeof projectionConflictDataSchema>;
/**
 * Two units register different modules for one projection format.
 * @fix Remove one registration, or make both units register the same module.
 * @verify dot explain --as <format> --json | jq -e .ok
 */
export declare const ProjectionConflict: import("@arki/failure").FailureDefinition<"dot.projection_conflict", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    format: string;
    projections: readonly Readonly<{
        plugin: string;
        module: string;
    }>[];
}>, Readonly<{
    format: string;
    projections: readonly Readonly<{
        plugin: string;
        module: string;
    }>[];
}>>>;
/**
 * `doctor` found error-severity issues. The data is the whole report: `.error.data.plugins[]`.
 * @fix Apply the `remediation` of each issue in `.error.data.plugins[].issues` and `.error.data.issues`.
 * @verify dot doctor --json | jq -e .ok
 */
export declare const DoctorFailed: import("@arki/failure").FailureDefinition<"dot.doctor_failed", import("@standard-schema/spec").StandardSchemaV1<{
    snapshotVersion: 2;
    generatedAt: string;
    app: {
        name: string;
        state: "booted" | "configured" | "defined" | "disposed" | "failed" | "started" | "stopped";
    };
    plugins: {
        plugin: string;
        status: "degraded" | "failed" | "ok" | "skipped";
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    actions: {
        id: string;
        plugin: string;
        binding: string;
        summary?: string | undefined;
        status: "degraded" | "failed" | "ok";
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    services: {
        service: string;
        plugin: string;
        status: "degraded" | "failed" | "missing" | "ok";
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    lifecycle: {
        plugin: string;
        hook: "boot" | "configure" | "dispose" | "start" | "stop";
        state: "booted" | "configured" | "defined" | "disposed" | "failed" | "started" | "stopped";
        order: number;
        durationMs?: number | undefined;
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    issues: {
        code: string;
        severity: "error" | "info" | "warning";
        plugin?: string | undefined;
        message: string;
        remediation: string;
        docsUrl: string;
        metadata?: Record<string, unknown> | undefined;
    }[];
    status: "failure" | "success" | "warning";
}, {
    snapshotVersion: 2;
    generatedAt: string;
    app: {
        name: string;
        state: "booted" | "configured" | "defined" | "disposed" | "failed" | "started" | "stopped";
    };
    plugins: {
        plugin: string;
        status: "degraded" | "failed" | "ok" | "skipped";
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    actions: {
        id: string;
        plugin: string;
        binding: string;
        summary?: string | undefined;
        status: "degraded" | "failed" | "ok";
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    services: {
        service: string;
        plugin: string;
        status: "degraded" | "failed" | "missing" | "ok";
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    lifecycle: {
        plugin: string;
        hook: "boot" | "configure" | "dispose" | "start" | "stop";
        state: "booted" | "configured" | "defined" | "disposed" | "failed" | "started" | "stopped";
        order: number;
        durationMs?: number | undefined;
        issues: {
            code: string;
            severity: "error" | "info" | "warning";
            plugin?: string | undefined;
            message: string;
            remediation: string;
            docsUrl: string;
            metadata?: Record<string, unknown> | undefined;
        }[];
    }[];
    issues: {
        code: string;
        severity: "error" | "info" | "warning";
        plugin?: string | undefined;
        message: string;
        remediation: string;
        docsUrl: string;
        metadata?: Record<string, unknown> | undefined;
    }[];
    status: "failure" | "success" | "warning";
}>>;
declare const targetNotEmptyDataSchema: z.ZodReadonly<z.ZodObject<{
    target: z.ZodString;
    conflicting: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export type TargetNotEmptyData = z.output<typeof targetNotEmptyDataSchema>;
/**
 * `dot new` would overwrite files in a non-empty target directory.
 * @fix Choose an empty directory, or re-run with `--force` to overwrite.
 * @verify dot new <name> --dry-run --json | jq -e .ok
 */
export declare const TargetNotEmpty: import("@arki/failure").FailureDefinition<"dot.target_not_empty", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    target: string;
    conflicting: readonly string[];
}>, Readonly<{
    target: string;
    conflicting: readonly string[];
}>>>;
declare const templateMissingDataSchema: z.ZodReadonly<z.ZodObject<{
    templateRoot: z.ZodString;
}, z.core.$strip>>;
export type TemplateMissingData = z.output<typeof templateMissingDataSchema>;
/**
 * The package's bundled template directory is empty or missing.
 * @fix Reinstall `@arki/dot`: it must ship its `templates/` directory.
 * @verify dot new <name> --dry-run --json | jq -e .ok
 */
export declare const TemplateMissing: import("@arki/failure").FailureDefinition<"dot.template_missing", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    templateRoot: string;
}>, Readonly<{
    templateRoot: string;
}>>>;
declare const writeFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    target: z.ZodString;
    written: z.ZodReadonly<z.ZodArray<z.ZodReadonly<z.ZodObject<{
        path: z.ZodString;
        action: z.ZodEnum<{
            create: "create";
            overwrite: "overwrite";
            skip: "skip";
        }>;
        contentHash: z.ZodString;
        contentBytes: z.ZodNumber;
        reason: z.ZodString;
    }, z.core.$strip>>>>;
    failed: z.ZodReadonly<z.ZodArray<z.ZodReadonly<z.ZodObject<{
        path: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strip>>;
export type WriteFailedData = z.output<typeof writeFailedDataSchema>;
/**
 * `dot new` could not write some files. `written` lists the ones that landed.
 * @fix Check the permissions of the target directory, then re-run with `--force`.
 * @verify dot new <name> --dry-run --json | jq -e .ok
 */
export declare const WriteFailed: import("@arki/failure").FailureDefinition<"dot.write_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    target: string;
    written: readonly Readonly<{
        path: string;
        action: "create" | "overwrite" | "skip";
        contentHash: string;
        contentBytes: number;
        reason: string;
    }>[];
    failed: readonly Readonly<{
        path: string;
        message: string;
    }>[];
}>, Readonly<{
    target: string;
    written: readonly Readonly<{
        path: string;
        action: "create" | "overwrite" | "skip";
        contentHash: string;
        contentBytes: number;
        reason: string;
    }>[];
    failed: readonly Readonly<{
        path: string;
        message: string;
    }>[];
}>>>;
/** `dot.app_lifecycle_failed` from what `configure` or `boot` threw. */
export declare function lifecycleFailed(error: unknown, phase: 'configure' | 'boot'): Failure;
declare const devDbUnreachableDataSchema: z.ZodReadonly<z.ZodObject<{
    target: z.ZodString;
    reason: z.ZodString;
}, z.core.$strip>>;
export type DevDbUnreachableData = z.output<typeof devDbUnreachableDataSchema>;
/**
 * `dot dev` found no Postgres to talk to: no URL, a bad URL, or a closed port it could not start.
 * @fix Start the database, fix `DB_URL` in `.env`, or run `dot dev --db pglite`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevDbUnreachable: import("@arki/failure").FailureDefinition<"dot.dev_db_unreachable", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    target: string;
    reason: string;
}>, Readonly<{
    target: string;
    reason: string;
}>>>;
declare const devRunnerFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    command: z.ZodString;
    causeMessage: z.ZodString;
}, z.core.$strip>>;
export type DevRunnerFailedData = z.output<typeof devRunnerFailedDataSchema>;
/**
 * The app runner (`vite dev`, `--run`, or `dot _serve`) could not be started.
 * @fix Install the runner, or pass the command that serves the app with `dot dev --run "<cmd>"`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevRunnerFailed: import("@arki/failure").FailureDefinition<"dot.dev_runner_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    command: string;
    causeMessage: string;
}>, Readonly<{
    command: string;
    causeMessage: string;
}>>>;
declare const devPortInUseDataSchema: z.ZodReadonly<z.ZodObject<{
    port: z.ZodNumber;
}, z.core.$strip>>;
export type DevPortInUseData = z.output<typeof devPortInUseDataSchema>;
/**
 * Something already listens on the app port, so the runner would not get it.
 * @fix Stop the process on that port, or pick another one with `dot dev --port <n>`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevPortInUse: import("@arki/failure").FailureDefinition<"dot.dev_port_in_use", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    port: number;
}>, Readonly<{
    port: number;
}>>>;
declare const devAlreadyRunningDataSchema: z.ZodReadonly<z.ZodObject<{
    pid: z.ZodNumber;
    statePath: z.ZodString;
}, z.core.$strip>>;
export type DevAlreadyRunningData = z.output<typeof devAlreadyRunningDataSchema>;
/**
 * Another `dot dev` is alive in this project: its pid is in the state file.
 * @fix Stop the other `dot dev`; if its pid is not a `dot dev`, delete the file in `.error.data.statePath`.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevAlreadyRunning: import("@arki/failure").FailureDefinition<"dot.dev_already_running", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    pid: number;
    statePath: string;
}>, Readonly<{
    pid: number;
    statePath: string;
}>>>;
declare const devStateFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    statePath: z.ZodString;
    reason: z.ZodString;
}, z.core.$strip>>;
export type DevStateFailedData = z.output<typeof devStateFailedDataSchema>;
/**
 * `dot dev` could not create its state file: the project folder is read-only or full.
 * @fix Make the project folder writable and free some disk space, then run `dot dev` again.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevStateFailed: import("@arki/failure").FailureDefinition<"dot.dev_state_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    statePath: string;
    reason: string;
}>, Readonly<{
    statePath: string;
    reason: string;
}>>>;
declare const devRemoteDbRefusedDataSchema: z.ZodReadonly<z.ZodObject<{
    target: z.ZodString;
    host: z.ZodString;
    source: z.ZodString;
}, z.core.$strip>>;
export type DevRemoteDbRefusedData = z.output<typeof devRemoteDbRefusedDataSchema>;
/**
 * The database is neither on this machine nor a compose service: `dot dev` would migrate it on boot.
 * @fix Point every database URL at this machine or a compose service, or pass `--allow-remote-db` on purpose.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevRemoteDbRefused: import("@arki/failure").FailureDefinition<"dot.dev_remote_db_refused", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    target: string;
    host: string;
    source: string;
}>, Readonly<{
    target: string;
    host: string;
    source: string;
}>>>;
declare const devAppStartedDataSchema: z.ZodReadonly<z.ZodObject<{
    filePath: z.ZodString;
    exportName: z.ZodString;
}, z.core.$strip>>;
export type DevAppStartedData = z.output<typeof devAppStartedDataSchema>;
/**
 * The app export is already configured, booted or started: `dot dev` cannot own its lifecycle.
 * @fix Export the unstarted builder: no `configure()`, `boot()` or `start()` call on the `dev` export.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevAppStarted: import("@arki/failure").FailureDefinition<"dot.dev_app_started", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    filePath: string;
    exportName: string;
}>, Readonly<{
    filePath: string;
    exportName: string;
}>>>;
declare const devPreflightFailedDataSchema: z.ZodReadonly<z.ZodObject<{
    reason: z.ZodString;
    exitCode: z.ZodNullable<z.ZodNumber>;
    output: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export type DevPreflightFailedData = z.output<typeof devPreflightFailedDataSchema>;
/**
 * The preflight process did not report a result: a crash, a hang past the timeout, or output that is not its report. Never a pass.
 * @fix Read `.error.data.output`, then run `dot doctor --app <file>` to see the same boot in the foreground.
 * @verify dot dev --once --json | jq -e .ok
 */
export declare const DevPreflightFailed: import("@arki/failure").FailureDefinition<"dot.dev_preflight_failed", import("@standard-schema/spec").StandardSchemaV1<Readonly<{
    reason: string;
    exitCode: number | null;
    output: readonly string[];
}>, Readonly<{
    reason: string;
    exitCode: number | null;
    output: readonly string[];
}>>>;
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
export declare const PreflightFailed: import("@arki/failure").FailureDefinition<"dot.preflight_failed", import("@standard-schema/spec").StandardSchemaV1<{
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
export {};
//# sourceMappingURL=failures.d.ts.map