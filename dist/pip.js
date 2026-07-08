/**
 * Narrow public surface for pip authors.
 *
 * Exposes the pip contract and the entry points a pip author needs to
 * author + test pips — `pip`, `service`, `token`, `provide`, `rename`,
 * `defineApp`, `testApp` / `bootTestApp`, plus lifecycle / manifest /
 * diagnostics types.
 *
 * Adapter packages (e.g. `@arki/env/dot`, `@arki/kv/dot`, `@arki/db/dot`)
 * import from this subpath so their `*.d.ts` graphs stay tight.
 *
 * @example
 * ```ts
 * import { pip, service, type Pip } from '@arki/dot/pip';
 * ```
 */
export { isLazy, lazy, lazyOf, pip, provide, rename, service, token, DotPipError } from './pip-contract.js';
export { defineApp } from './define-app.js';
export { initPips } from './init-pips.js';
export { testApp, bootTestApp } from './test-harness.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS } from './lifecycle.js';
export { toJsonObject } from './manifest.js';
export { renderTimeline } from './timeline.js';
//# sourceMappingURL=pip.js.map