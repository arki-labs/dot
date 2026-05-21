/**
 * @arki/dot — TypeScript-first application composition framework
 *
 * Public surface:
 *   - `defineApp(name)` — the modern entry point for composing applications.
 *   - `defineDotPip(config)` — define lifecycle-aware pips.
 *   - Lifecycle / manifest / diagnostics types.
 *   - `testApp` / `bootTestApp` — test harnesses for pip authors.
 */
// #region New kernel — public surface (Task 9a)
export { defineApp } from './define-app.js';
export { defineDotPip, DotPipError } from './pip-contract.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS, } from './lifecycle.js';
export { renderTimeline } from './timeline.js';
export { testApp, bootTestApp } from './test-harness.js';
// #endregion
//# sourceMappingURL=index.js.map