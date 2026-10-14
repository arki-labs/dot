import type { Span } from '@opentelemetry/api';
import type { DotLifecycleHook } from '../lifecycle.js';
/** OTel tracer for the DOT kernel. No-op when no SDK is registered. */
export declare const tracer: import("@opentelemetry/api").Tracer;
/** OTel meter for the DOT kernel. No-op when no SDK is registered. */
export declare const meter: import("@opentelemetry/api").Meter;
/**
 * Histogram recording per-plugin per-hook execution duration in milliseconds.
 *
 * Attributes:
 *   - `dot.app.name` — app name
 *   - `dot.plugin.name` — plugin name
 *   - `dot.hook`     — which lifecycle hook (`configure` | `boot` | ...)
 *   - `dot.status`   — `ok` | `failed`
 */
export declare const hookDurationHistogram: import("@opentelemetry/api").Histogram<import("@opentelemetry/api").Attributes>;
/**
 * Histogram recording per-phase (app-level) execution duration.
 *
 * Attributes:
 *   - `dot.app.name`  — app name
 *   - `dot.app.phase` — which phase (`configure` | `boot` | `start` | `stop` | `dispose`)
 *   - `dot.status`    — `ok` | `failed`
 */
export declare const phaseDurationHistogram: import("@opentelemetry/api").Histogram<import("@opentelemetry/api").Attributes>;
/**
 * Wrap a single plugin-hook execution in a child span and record its
 * duration in the histogram. The span auto-links to the active phase
 * span (set by {@link withPhaseSpan}) so traces show a clean parent-child
 * hierarchy:
 *
 *     dot.app.boot
 *     ├── dot.plugin.boot   (dot.plugin.name=env, dot.hook=boot)
 *     ├── dot.plugin.boot   (dot.plugin.name=db,  dot.hook=boot)
 *     └── dot.plugin.boot   (dot.plugin.name=kv,  dot.hook=boot)
 *
 * Re-throws on failure after marking the span ERROR so the caller's
 * existing error-handling path stays intact.
 */
export declare function withPluginHookSpan<R>(opts: {
    readonly appName: string;
    readonly pluginName: string;
    readonly pluginVersion?: string;
    readonly hook: DotLifecycleHook;
    readonly order: number;
}, fn: (span: Span) => R): R;
/**
 * Wrap an entire app-level phase (`configure`/`boot`/`start`/`stop`/`dispose`)
 * in an active span. Children created by {@link withPluginHookSpan} inherit
 * this span as their parent via async-context.
 *
 * The callback's return value (sync or Promise) is propagated unchanged
 * to preserve the kernel's existing control flow.
 */
export declare function withPhaseSpan<R>(opts: {
    readonly appName: string;
    readonly appVersion?: string;
    readonly phase: DotLifecycleHook;
    readonly pluginCount: number;
}, fn: (span: Span) => R): R;
//# sourceMappingURL=otel.d.ts.map