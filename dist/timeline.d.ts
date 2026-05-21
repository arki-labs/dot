/**
 * ASCII waterfall renderer for DOT lifecycle diagnostics.
 *
 * Given a `DotDiagnosticsSnapshot`, builds a compact per-phase, per-pip
 * duration chart suitable for printing in a terminal or embedding in a
 * `dot doctor` text report. No colour, no Unicode beyond `█` so the
 * output stays clean in log aggregators and CI.
 *
 * @example
 * ```
 * Timeline: my-app (state=booted)
 * ─────────────────────────────────────────────────────────
 * configure
 *   env       0.5ms  █
 *   db        1.4ms  █████
 *   kv        0.3ms  █
 *
 * boot
 *   env       2.8ms  █████████
 *   db       32.9ms  ███████████████████████████████████████████
 *   kv        3.9ms  ████████████
 * ─────────────────────────────────────────────────────────
 * ```
 *
 * @see packages/dot/docs/observability.md
 */
import type { DotDiagnosticsSnapshot } from './diagnostics.js';
export type RenderTimelineOptions = {
    /** Maximum bar width in characters (default `50`). */
    readonly barWidth?: number;
    /**
     * When `true`, also emit any pip's diagnostic `issues[]` underneath
     * the bar so failure reasons are visible in the timeline view.
     * Default `true`.
     */
    readonly showIssues?: boolean;
};
/**
 * Render the snapshot's lifecycle records as a per-phase waterfall.
 * Pure — no IO. Caller is responsible for printing the result.
 */
export declare function renderTimeline(snapshot: DotDiagnosticsSnapshot, opts?: RenderTimelineOptions): string;
//# sourceMappingURL=timeline.d.ts.map