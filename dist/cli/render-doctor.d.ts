/**
 * `dot doctor`'s verdict and text renderer.
 *
 * The verdict is the worst severity among every issue in the snapshot:
 *   - `failure` if any issue has severity `error`
 *   - `warning` if any issue has severity `warning` (and no errors)
 *   - `success` otherwise
 */
import type { Ui } from '@arki/cli';
import type { DiagnosticIssue, DotDiagnosticsSnapshot } from '../diagnostics.js';
import type { DoctorReport, DoctorStatus } from './failures.js';
/** Every issue in the snapshot: top-level, then per unit, action, service and lifecycle entry. */
export declare function allIssues(snap: DotDiagnosticsSnapshot): DiagnosticIssue[];
/** The worst severity among all the snapshot's issues. */
export declare function doctorStatus(snap: DotDiagnosticsSnapshot): DoctorStatus;
/** Print the report as text: per-unit status, services, actions, lifecycle and app-level issues, the verdict. */
export declare function renderDoctorText(report: DoctorReport, ui: Ui): void;
//# sourceMappingURL=render-doctor.d.ts.map