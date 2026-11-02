import { context, isSpanContextValid, metrics, trace } from '@opentelemetry/api';
import packageMetadata from '@arki/dot/package.json' with { type: 'json' };
import { getLogger } from '@arki/log';
import { observe, withOutcomeSpan, withSpanContext } from './kernel/otel.js';
/**
 * Scope custom instrumentation from an existing unit, feature or hook context.
 * App-owned OTel providers supply tracing; without an SDK every call is safe.
 * Use a new span only for a new operational boundary, not one already instrumented.
 *
 * @example
 * const telemetry = telemetryFor(catalog);
 * const found = telemetry.span('cache.lookup', () => cache.get(key));
 */
export function telemetryFor(owner) {
    const name = 'name' in owner ? owner.name : owner.$unit;
    const scope = `@arki/dot/${name}`;
    const identity = { 'dot.unit.name': name };
    return {
        /** Observe a custom operation, retaining its exact return value, promise and failure identity. */
        span(name, run, options) {
            const span = observe(() => trace
                .getTracer(scope, packageMetadata.version)
                .startSpan(name, { ...options, attributes: { ...options?.attributes, ...identity } }));
            return withOutcomeSpan(span, () => withSpanContext(span, run));
        },
        /** Annotate the active operation without adding a span. Explicit attributes only. */
        event(name, attributes) {
            observe(() => trace.getActiveSpan()?.addEvent(name, { ...attributes, ...identity }));
        },
        /** Create a counter. Keep explicit dimensions bounded; do not include user IDs or payloads. */
        counter(name, options) {
            const counter = observe(() => metrics.getMeter(scope, packageMetadata.version).createCounter(name, options));
            return {
                add(value, attributes) {
                    observe(() => counter?.add(value, { ...attributes, ...identity }, context.active()));
                },
            };
        },
        /** Create a histogram with the same identity and context as this scope. */
        histogram(name, options) {
            const histogram = observe(() => metrics.getMeter(scope, packageMetadata.version).createHistogram(name, options));
            return {
                record(value, attributes) {
                    observe(() => histogram?.record(value, { ...attributes, ...identity }, context.active()));
                },
            };
        },
        /** Write through the app's logging setup with the active trace stamped on the record. */
        log(level, template, fields) {
            observe(() => {
                const logger = getLogger(`arki:dot:${name}`);
                const spanContext = trace.getActiveSpan()?.spanContext();
                const correlated = spanContext !== undefined && isSpanContextValid(spanContext) ? logger.withTrace(spanContext) : logger;
                correlated.log(level, template, { ...fields, ...identity });
            });
        },
    };
}
//# sourceMappingURL=telemetry.js.map