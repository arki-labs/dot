/**
 * @arki/dot — TypeScript-first application composition framework
 *
 * Public surface:
 *   - `defineApp(name)` — the entry point for composing applications.
 *   - `pip(config)` — author lifecycle-aware pips with typed needs/provides.
 *   - `service<T>()` / `token<T>()(key)` — service witnesses for DI wiring.
 *   - `rename(pip, map)` — mount-time multi-instance primitive.
 *   - Lifecycle / manifest / diagnostics types.
 *   - `testApp` / `bootTestApp` — test harnesses for pip authors.
 */
// #region Kernel — public surface
export { defineApp } from './define-app.js';
export { isLazy, lazy, lazyOf, pip, provide, rename, service, token, DotPipError } from './pip-contract.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS, } from './lifecycle.js';
export { renderTimeline } from './timeline.js';
export { testApp, bootTestApp } from './test-harness.js';
// #endregion
//# sourceMappingURL=index.js.map