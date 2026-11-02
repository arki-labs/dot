/** Identity-scoped custom OpenTelemetry instrumentation for Dot unit and feature authors. */
import type { Attributes, MetricOptions, SpanOptions } from '@opentelemetry/api';
import type { Fields, LevelInput } from '@arki/log';
/**
 * Scope custom instrumentation from an existing unit, feature or hook context.
 * App-owned OTel providers supply tracing; without an SDK every call is safe.
 * Use a new span only for a new operational boundary, not one already instrumented.
 *
 * @example
 * const telemetry = telemetryFor(catalog);
 * const found = telemetry.span('cache.lookup', () => cache.get(key));
 */
export declare function telemetryFor(owner: {
    readonly name: string;
} | {
    readonly $unit: string;
}): {
    /** Observe a custom operation, retaining its exact return value, promise and failure identity. */
    span<Value>(name: string, run: () => Value, options?: SpanOptions): Value;
    /** Annotate the active operation without adding a span. Explicit attributes only. */
    event(name: string, attributes?: Attributes): void;
    /** Create a counter. Keep explicit dimensions bounded; do not include user IDs or payloads. */
    counter(name: string, options?: MetricOptions): {
        add(value: number, attributes?: Attributes): void;
    };
    /** Create a histogram with the same identity and context as this scope. */
    histogram(name: string, options?: MetricOptions): {
        record(value: number, attributes?: Attributes): void;
    };
    /** Write through the app's logging setup with the active trace stamped on the record. */
    log(level: LevelInput, template: string, fields?: Fields): void;
};
/** The inferred custom instrumentation surface, shared by all unit and feature contexts. */
export type DotTelemetry = ReturnType<typeof telemetryFor>;
//# sourceMappingURL=telemetry.d.ts.map