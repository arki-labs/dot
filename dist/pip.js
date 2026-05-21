/**
 * Narrow public surface for pip authors.
 *
 * Exposes the new-kernel pip contract and the entry points a pip
 * author needs to author + test pips — `defineDotPip`, `defineApp`,
 * `testApp` / `bootTestApp`, plus lifecycle / manifest / diagnostics types.
 *
 * Does NOT re-export the legacy `Dot` / `createDot` builder or the legacy
 * auth/db/event-sourcing modules. Adapter packages (e.g. `@arki/env/dot`,
 * `@arki/kv/dot`, `@arki/db/dot`) import from this subpath so their
 * `*.d.ts` graphs do not pull in the legacy surface — keeping their
 * compile times tight and decoupling adapters from the legacy retirement
 * schedule (Task 12).
 *
 * @example
 * ```ts
 * import { defineDotPip, type DotPip } from '@arki/dot/pip';
 * ```
 */
export { defineDotPip, DotPipError } from './pip-contract.js';
export { defineApp } from './define-app.js';
export { testApp, bootTestApp } from './test-harness.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS } from './lifecycle.js';
export { renderTimeline } from './timeline.js';
//# sourceMappingURL=pip.js.map