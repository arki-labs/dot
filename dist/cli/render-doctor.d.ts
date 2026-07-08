/**
 * Renderers for `dot doctor`.
 *
 * Reads a booted (or fully-failed) app's `diagnostics` snapshot and emits
 * either a JSON envelope or a human-readable per-plugin status report.
 *
 * Envelope `status` reflects the worst severity present:
 *   - `failure` if any issue has severity `error`
 *   - `warning` if any issue has severity `warning` (and no errors)
 *   - `success` otherwise
 */
import type { DotDiagnosticsSnapshot } from '../diagnostics.js';
import type { DotCliEnvelope, RenderOptions } from './render-explain.js';
export type DoctorSource = {
    diagnostics: DotDiagnosticsSnapshot;
};
/**
 * Compose the JSON envelope. Pure — no IO. Useful for tests and embedding.
 */
export declare function buildDoctorEnvelope(source: DoctorSource, opts: RenderOptions): DotCliEnvelope<DotDiagnosticsSnapshot>;
/**
 * Render the doctor output. Returns the envelope so callers can act on it
 * (e.g. set the process exit code based on `status`).
 */
export declare function renderDoctor(source: DoctorSource, opts: RenderOptions): DotCliEnvelope<DotDiagnosticsSnapshot>;
//# sourceMappingURL=render-doctor.d.ts.map