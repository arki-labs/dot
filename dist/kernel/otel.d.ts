/**
 * OpenTelemetry instrumentation for the DOT kernel.
 *
 * DOT is OTel-first: every lifecycle phase and every per-plugin hook
 * automatically emits a span and a duration histogram. When no SDK is
 * registered, the OTel API returns no-op implementations and the kernel
 * pays zero allocation per call — the discipline that makes "OTel-first"
 * compatible with principle 5 (zero optional dependencies in the kernel).
 *
 * Consumers wire the SDK however they like (`@opentelemetry/sdk-node`,
 * `@arki/meter`, etc.); the kernel never touches the SDK directly.
 *
 * Span / attribute conventions:
 *
 *   - Phase span: `dot.app.<phase>` — one root span per `configure()` /
 *     `boot()` / `start()` / `stop()` / `dispose()` call. Children
 *     auto-link via async-context.
 *   - Hook span:  `dot.plugin.<hook>` — one child span per plugin's hook
 *     execution. The plugin name lives on `dot.plugin.name`, not in the span
 *     name, so backends can aggregate by hook across plugins.
 *   - Attributes (`dot.app.name`, `dot.plugin.name`, `dot.plugin.version`,
 *     `dot.hook`, `dot.plugin.order`) follow the OTel convention of
 *     namespacing under the library's prefix.
 *
 * @see packages/dot/docs/principles.md — principle 3 (deterministic) +
 *      principle 4 (agent-discoverable).
 */
import { type Span } from '@opentelemetry/api';
import type { Logger } from '@arki/log';
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
    /**
     * Optional plugin-scoped logger. When present, the helper threads the
     * span's `traceId` + `spanId` onto the logger via `setTraceContext`
     * before invoking the body — every log line emitted from within the
     * plugin's hook is automatically correlated with this span in the
     * `traceId`/`spanId` fields of `LogRecord`.
     */
    readonly logger?: Logger;
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
    /**
     * Optional phase-scoped logger. When present, the helper threads
     * the span's `traceId` + `spanId` onto the logger before invoking
     * the body — every log line written during the phase carries the
     * trace context so it's groupable with the corresponding span in
     * any OTel-compatible backend.
     */
    readonly logger?: Logger;
}, fn: (span: Span) => R): R;
//# sourceMappingURL=otel.d.ts.map