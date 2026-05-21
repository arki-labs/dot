/**
 * Manifest types for the DOT kernel.
 *
 * A `DotAppManifest` is the static, declarative description of an app: which
 * pips are registered, what routes/services they contribute, and how they
 * depend on each other. It is built up during the `configure` phase from
 * registration calls and finalised once `configure` completes.
 *
 * CONTRACT: `DotAppManifest` always exposes the same five top-level arrays
 * (`pips`, `routes`, `services`, `lifecycle`, `dependencies`). Consumers
 * MUST NOT see an omitted array — empty is empty, but never missing.
 * This shape is referenced by Task 7's scorecard.
 */
//# sourceMappingURL=manifest.js.map