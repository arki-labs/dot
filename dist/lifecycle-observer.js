/**
 * Lifecycle observer surface for the DOT kernel.
 *
 * `DotLifecycleObserver` is the in-process companion to the OTel signals
 * emitted by {@link withPhaseSpan} / {@link withPipHookSpan}. Where OTel
 * is the contract for cross-process tracing (consumers register an SDK
 * and ship spans to a backend), the observer is the contract for *local*
 * programmatic inspection — used by tests, CLI tooling, ASCII waterfalls,
 * and ad-hoc diagnostics that don't require an SDK to be registered.
 *
 * Both signals are emitted from the same kernel sites; neither is layered
 * under the other. A consumer can use one, both, or neither — the kernel
 * pays zero allocation for the observer fan-out when no observers are
 * registered.
 *
 * @see packages/dot/docs/observability.md — consumer-facing surface
 * @see packages/dot/docs/principles.md — principle 5 (zero optional deps)
 */
//# sourceMappingURL=lifecycle-observer.js.map