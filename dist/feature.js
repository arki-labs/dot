import { FEATURE_ERROR_CODES, FeatureError } from './feature-error.js';
import { HANDLERS_KEY, isLazy, isLazyWitness, lazyOf, token } from './unit-contract.js';
export { FEATURE_ERROR_CODES, FeatureError } from './feature-error.js';
// The chain form (`defineFeature(name).needs().infra().usecases().provides().entrypoints()`)
// and contract-first composition (`routerFor`). See RFC 2026-10-15-dot-feature-builder.
export { allFeatures, defineFeature, domainService, entrypointOnly, instanceOf, mountFeatures, ownUnits, requestServices, routerFor, } from './define-feature.js';
function isHandle(witness) {
    return ('provider' in witness && typeof witness.provider === 'string' && 'key' in witness && typeof witness.key === 'string');
}
/**
 * Every handle the features (and units) provide, merged — spread it into
 * a gateway feature's `needs` and the kernel hands it every capability:
 * `providesOf([database, cache, ...features])`. The builder guard then
 * proves the gateway is mounted after every provider.
 */
export function providesOf(units) {
    const merged = {};
    for (const unit of units)
        Object.assign(merged, unit.provides);
    // Erasure seam: the merge is built by key at runtime; its type is the
    // intersection of the features' handle records.
    return merged;
}
function missingCapability(alias, handle, where, remediation) {
    return new FeatureError({
        code: FEATURE_ERROR_CODES.missingCapability,
        message: `[feature] "${alias}" (capability "${handle.key}" from feature "${handle.provider}") is not in ${where}.`,
        remediation,
    });
}
/**
 * Read every capability the units (features or units) provide out of a hook context whose
 * `needs` spread {@link providesOf} — the bag a gateway passes to its
 * request context.
 */
export function servicesOf(ctx, features) {
    const source = ctx;
    const bag = {};
    for (const f of features) {
        for (const [key, handle] of Object.entries(f.provides)) {
            if (!(key in source)) {
                throw missingCapability(key, handle, "this hook's context", "Spread providesOf(features) into this feature's needs, so the kernel hands it every capability.");
            }
            bag[key] = source[key];
        }
    }
    // Erasure seam: the bag is built by key at runtime; its type is the
    // merge of the features' provided values.
    return bag;
}
/**
 * Narrow a request context's services bag with a feature's own `needs`:
 * each capability handle resolves to its value under the local alias.
 * Infra services (`db`) are not in the bag and drop out of the result.
 *
 * @throws {FeatureError} `ARKI_DOT_E026` when a handle's key is not in the bag.
 */
export function resolveNeeds(bag, needs) {
    const resolved = {};
    for (const [alias, witness] of Object.entries(needs)) {
        if (!isHandle(witness))
            continue;
        if (!(witness.key in bag)) {
            throw missingCapability(alias, witness, "the request context's services bag", "Spread providesOf(features) into the gateway's needs and pass servicesOf(ctx, features) to createContext.");
        }
        const value = bag[witness.key];
        // A lazy handle (`handle.lazy`) always receives a `Lazy<T>`, as in hook contexts.
        resolved[alias] = isLazyWitness(witness) && !isLazy(value) ? lazyOf(value) : value;
    }
    // Erasure seam: resolved by alias at runtime from the handles' wire keys.
    return resolved;
}
/* ------------------------------------------------------------------ */
/* Units built from the mounted features                               */
/* ------------------------------------------------------------------ */
// `infra.fromFeatures` / `entrypoint.fromFeatures` replace `driven` / `driver`.
// They live with the unit constructors; this entry re-exports them for adapters.
export { entrypoint, infra, unit } from './unit-contract.js';
/** Where a feature publishes its slice record. */
function sliceKeyOf(f) {
    return `feature.${f.name}`;
}
/** The slice record's token. Untyped on purpose: the adapter that minted each slice checks its payload. */
function sliceTokenOf(f) {
    return token()(sliceKeyOf(f));
}
/**
 * Bind a driver and add the features' slice tokens to its runtime needs,
 * so the kernel hands it every slice record and `dot explain` draws the
 * feature → driver edges. Called by `.entrypoints()`.
 */
export function bindEntrypoint(adapter, features) {
    const bound = adapter.bind(features);
    const sliceNeeds = Object.fromEntries(features.map(f => [sliceKeyOf(f), sliceTokenOf(f)]));
    return { ...bound, needs: { ...sliceNeeds, ...bound.needs } };
}
/**
 * The slice record one feature published — read inside a bound driver's
 * hooks. Values are untyped on purpose: the adapter that minted the slice
 * checks its own payload shape (`jobs()`, `schedules()`, `endpoints()`).
 */
export function sliceOf(ctx, f) {
    const key = sliceKeyOf(f);
    const record = ctx[key];
    if (typeof record !== 'object' || record === null) {
        throw new FeatureError({
            code: FEATURE_ERROR_CODES.missingSlices,
            message: `[feature] the slice record of feature "${f.name}" is not in this hook's context.`,
            remediation: 'Mount the adapter with `.entrypoints(adapter)` after `.features([...])`, so it is bound to the features.',
        });
    }
    return record;
}
const passThroughObserver = { watching: () => false, run: (_ref, run) => run() };
/**
 * The handler observer a feature's services bag carries (its `$handlers`), for
 * transport adapters that emit handler events. A bag without one — an adapter
 * used outside Dot, a hand-made test bag — gets a pass-through that just runs the call.
 */
export function handlerObserverOf(services) {
    const observer = Reflect.get(services, HANDLERS_KEY);
    if (observer === undefined)
        return passThroughObserver;
    // Erasure seam: the kernel wrote this key (`#buildHookCtx`) and the feature's services factory
    // copied it through; nothing else writes `$` keys (`ARKI_DOT_E014`).
    return observer;
}
export { telemetryFor } from './telemetry.js';
//# sourceMappingURL=feature.js.map