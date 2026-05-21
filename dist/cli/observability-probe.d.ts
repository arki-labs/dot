/**
 * `dot doctor --observability` probe.
 *
 * Detects whether an OpenTelemetry SDK is registered in the current
 * process. The check is small and uses only the public OTel API:
 *
 *   1. Start a probe span via the kernel's tracer name.
 *   2. Read the span context's `traceId`.
 *   3. End the span.
 *
 * When no SDK is registered, the OTel API returns a `NonRecordingSpan`
 * whose context has the all-zero trace ID sentinel
 * (`'00000000000000000000000000000000'`) and `traceFlags = 0`. A
 * registered SDK produces a real, non-zero trace ID.
 *
 * If no SDK is detected, the probe returns a `DiagnosticIssue` with
 * severity `warning` — lack of an SDK is a deployment choice, not a
 * bug. The remediation points at the docs section that explains how
 * to wire one in.
 */
import type { DiagnosticIssue } from '../diagnostics.js';
/**
 * Run the probe.
 *
 * @returns `null` when an SDK is registered; a `DiagnosticIssue` when not.
 */
export declare function probeObservability(): DiagnosticIssue | null;
//# sourceMappingURL=observability-probe.d.ts.map