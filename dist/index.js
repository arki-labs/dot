/**
 * @arki/dot — TypeScript-first application composition framework
 *
 * Public surface:
 *   - `defineApp(name)` — the entry point for composing applications.
 *   - `plugin(config)` — author lifecycle-aware plugins with typed needs/provides.
 *   - `service<T>()` / `token<T>()(key)` — service witnesses for DI wiring.
 *   - `rename(plugin, map)` — mount-time multi-instance primitive.
 *   - Lifecycle / manifest / diagnostics types.
 *   - `testApp` / `bootTestApp` — test harnesses for plugin authors.
 */
// #region Kernel — public surface
export { defineApp } from './define-app.js';
export { isLazy, lazy, lazyOf, plugin, provide, rename, service, token, DotPluginError } from './plugin-contract.js';
export { initPlugins } from './init-plugins.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS, } from './lifecycle.js';
export { toJsonObject } from './manifest.js';
export { renderTimeline } from './timeline.js';
export { testApp, bootTestApp, testPlugin } from './test-harness.js';
export { hookSignals } from './signals.js';
// #endregion
//# sourceMappingURL=index.js.map