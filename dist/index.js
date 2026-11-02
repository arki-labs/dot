/**
 * @arki/dot — Compose an app from typed units that boot in declaration order and dispose in reverse.
 *
 * Public surface:
 *   - `defineApp(name)` — the entry point for composing applications.
 *   - `infra(config)` — author lifecycle-aware units with typed needs/provides.
 *   - `service<T>()` / `token<T>()(key)` — service witnesses for DI wiring.
 *   - `rename(unit, map)` — mount-time multi-instance primitive.
 *   - Lifecycle / manifest / diagnostics types.
 *   - `testApp` / `bootTestApp` — test harnesses for unit authors.
 */
// #region Kernel — public surface
export { defineApp } from './define-app.js';
export { entrypoint, infra, isLazy, lazy, lazyOf, provide, rename, service, token, DotUnitError } from './unit-contract.js';
export { LazyClosed } from './lazy.js';
export { initUnits } from './init-units.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS } from './lifecycle.js';
export { DOT_MANIFEST_ERROR_CODE, DotManifestError, toJsonObject } from './manifest.js';
export { logHandlers, reportErrors } from './handler-observers.js';
export { renderTimeline } from './timeline.js';
export { fake, testApp, bootTestApp, testUnit } from './test-harness.js';
export { hookSignals } from './signals.js';
// #endregion
export { telemetryFor } from './telemetry.js';
//# sourceMappingURL=index.js.map