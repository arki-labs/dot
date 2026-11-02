#!/usr/bin/env node
/** The `dot` program. `program.main(argv, io)` runs one command line without touching the process. */
export declare const program: import("@arki/cli").Program;
export { runDev } from './dev.js';
export type { DevResult, RunDevOptions } from './dev.js';
export { devEventSchema } from './dev-events.js';
export type { DevEvent } from './dev-events.js';
export { DEV_STATE_PATH, devStateSchema } from './dev-state.js';
export type { DevState } from './dev-state.js';
export { runDoctor } from './doctor.js';
export type { DoctorOptions } from './doctor.js';
export { runExplain } from './explain.js';
export type { ExplainData, ExplainOptions } from './explain.js';
export { AppImportFailed, AppInvalidExport, AppLifecycleFailed, AppNotFound, DevAlreadyRunning, DevAppStarted, DevDbUnreachable, DevPortInUse, DevPreflightFailed, DevRemoteDbRefused, DevRunnerFailed, DoctorFailed, ObservabilityNoSdk, PreflightFailed, ProjectionConflict, ProjectionExecutionFailed, ProjectionImportFailed, ProjectionNotFound, TargetNotEmpty, TemplateMissing, WriteFailed, } from './failures.js';
export type { DoctorReport, DoctorStatus } from './failures.js';
export { EnvCheckFailed, EnvCommandFailed, EnvDecryptTracked, EnvKeyNotFound, EnvLoadFailed, EnvNoChange, EnvNoHeader, EnvPlainSecret, EnvRevealRefused, EnvValueMissing, EnvVaultFailed, EnvVaultWriteUnconfirmed, } from './env-failures.js';
export type { EnvFinding } from './env-failures.js';
export type { DotNewOperation, DotNewResult } from './json.js';
export { runNew } from './new.js';
export type { RunNewOptions } from './new.js';
export type { GraphData } from './render-graph.js';
export type { ProjectionData } from './render-projection.js';
//# sourceMappingURL=index.d.ts.map