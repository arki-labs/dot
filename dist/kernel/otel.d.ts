import type { Span } from '@opentelemetry/api';
import type { DotLifecycleHook } from '../lifecycle.js';
/**
 * Wrap a single unit-hook execution in a child span and record its
 * duration in the histogram. The span auto-links to the active phase
 * span (set by {@link withPhaseSpan}) so traces show a clean parent-child
 * hierarchy:
 *
 *     dot.app.boot
 *     ├── dot.unit.boot   (dot.unit.name=env, dot.hook=boot)
 *     ├── dot.unit.boot   (dot.unit.name=db,  dot.hook=boot)
 *     └── dot.unit.boot   (dot.unit.name=kv,  dot.hook=boot)
 *
 * Re-throws on failure after marking the span ERROR so the caller's
 * existing error-handling path stays intact.
 */
export declare function withUnitHookSpan<R>(opts: {
    readonly appName: string;
    readonly unitName: string;
    readonly hook: DotLifecycleHook;
    readonly order: number;
}, fn: (span: Span) => R): R;
/**
 * Wrap an entire app-level phase (`configure`/`boot`/`start`/`stop`/`dispose`)
 * in an active span. Children created by {@link withUnitHookSpan} inherit
 * this span as their parent via async-context.
 *
 * The callback's return value (sync or Promise) is propagated unchanged
 * to preserve the kernel's existing control flow.
 */
export declare function withPhaseSpan<R>(opts: {
    readonly appName: string;
    readonly appVersion?: string;
    readonly phase: DotLifecycleHook;
    readonly unitCount: number;
}, fn: (span: Span) => R): R;
/** Reporting is best effort: its own failure cannot replace or report the primary outcome. */
export declare function observe<Value>(report: () => Value): Value | undefined;
/**
 * Activate app-owned context without letting a defective context manager control execution.
 * The local outcome retains the one callback invocation when a manager skips, repeats,
 * swallows or throws after it. Reporter failures never become application failures.
 */
export declare function withSpanContext<Value>(span: Span | undefined, run: () => Value): Value;
/** Observe settlement without replacing the callback's value or promise identity. */
export declare function withOutcomeSpan<Value>(span: Span | undefined, run: () => Value, recordDuration?: (status: 'ok' | 'failed') => void): Value;
/**
 * Wrap one usecase so each call runs in an active span named
 * `feature.<featureName>.<usecaseName>`. A value that is not a function is
 * returned as is. Invocation supervision is a separate boundary.
 *
 * - Returns (or resolves to) an `@arki/failure` failure: status ERROR with
 *   `failure.code` and `failure.status`, and no exception event — a failure
 *   is an expected outcome, not a bug.
 * - Throws (or rejects): the exception is recorded, status ERROR, and the
 *   same value is rethrown.
 * - Anything else: status OK, like the kernel's hook spans.
 *
 * With no SDK registered (or a sampler that drops the span) the call goes
 * straight through: same `this`, same arguments, the very same return value
 * (a promise is not re-wrapped). Sync usecases stay sync; an async one ends
 * its span when its promise settles.
 */
export declare function traceUsecase(featureName: string, usecaseName: string, usecase: unknown): unknown;
//# sourceMappingURL=otel.d.ts.map