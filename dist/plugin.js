/**
 * Narrow public surface for plugin authors.
 *
 * Exposes the plugin contract and the entry points a plugin author needs to
 * author + test plugins — `plugin`, `service`, `token`, `provide`, `rename`,
 * `defineApp`, `testApp` / `bootTestApp`, plus lifecycle / manifest /
 * diagnostics types.
 *
 * Adapter packages (e.g. `@arki/env/dot`, `@arki/kv/dot`, `@arki/db/dot`)
 * import from this subpath so their `*.d.ts` graphs stay tight.
 *
 * @example
 * ```ts
 * import { plugin, service, type Plugin } from '@arki/dot/plugin';
 * ```
 */
export { isLazy, lazy, lazyOf, plugin, provide, rename, service, token, DotPluginError } from './plugin-contract.js';
export { defineApp } from './define-app.js';
export { initPlugins } from './init-plugins.js';
export { testApp, bootTestApp } from './test-harness.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS } from './lifecycle.js';
export { toJsonObject } from './manifest.js';
export { renderTimeline } from './timeline.js';
//# sourceMappingURL=plugin.js.map