/**
 * The unit author's surface: the `unit` / `infra` / `entrypoint` constructors,
 * handles, tokens, `rename` and the contract types.
 *
 * Exposes the unit contract and the entry points a unit author needs to
 * author + test units — `infra`, `entrypoint` (and their `fromFeatures`
 * forms), `unit`, `service`, `token`, `provide`, `rename`, `defineApp`,
 * `testApp` / `bootTestApp`, plus lifecycle / manifest / diagnostics types.
 *
 * Adapter packages (e.g. `@arki/dot/env`, `@arki/kv/dot`, `@arki/db/dot`)
 * import from this subpath so their `*.d.ts` graphs stay tight.
 *
 * @example
 * ```ts
 * import { infra, service, type Unit } from '@arki/dot/unit';
 * ```
 */
export { handleOf, isLazy, lazy, lazyOf, entrypoint, infra, provide, rename, service, token, unit, DotUnitError, } from './unit-contract.js';
export { LazyClosed } from './lazy.js';
export { resolveDeferred } from './deferred.js';
export { defineApp } from './define-app.js';
export { initUnits } from './init-units.js';
export { testApp, bootTestApp } from './test-harness.js';
export { DotLifecycleError, DotLifecycleErrorCode, DOT_LIFECYCLE_HOOKS } from './lifecycle.js';
export { toJsonObject } from './manifest.js';
export { renderTimeline } from './timeline.js';
export { telemetryFor } from './telemetry.js';
//# sourceMappingURL=unit.js.map