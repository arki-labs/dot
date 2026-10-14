import { plugin, provide, token } from './plugin-contract.js';
/**
 * Declare a feature. Pure data capture — nothing executes here; the app
 * builder's `.features()` turns it into a plugin.
 */
export function feature(name, config) {
    const sliceKeys = new Set();
    for (const slice of config.use ?? []) {
        // A second slice under one key would silently replace the first once the
        // feature is mounted (the payload record is keyed by slice key).
        if (sliceKeys.has(slice.key)) {
            throw new FeatureError({
                code: FEATURE_ERROR_CODES.duplicateSliceKey,
                message: `[feature] feature "${name}" declares two "${slice.key}" slices in \`use\`; the second would silently replace the first.`,
                remediation: `Move one of the "${slice.key}" slices into its own feature, or merge them into one slice.`,
            });
        }
        sliceKeys.add(slice.key);
    }
    return {
        name,
        router: (config.router ?? {}),
        repos: (config.repos ?? {}),
        use: (config.use ?? []),
        actions: config.actions ?? [],
        needs: (config.needs ?? {}),
        boot: config.boot,
    };
}
export const FEATURE_ERROR_CODES = {
    duplicateRouterKey: 'FEATURE_E001',
    duplicateRepoKey: 'FEATURE_E002',
    duplicateSliceKey: 'FEATURE_E003',
    missingSlices: 'FEATURE_E004',
};
/**
 * A mistake in how features are composed. The types reject the same
 * mistake at compile time; this is the backstop for code that skips them.
 */
export class FeatureError extends Error {
    code;
    remediation;
    constructor(args) {
        super(args.message);
        this.name = 'FeatureError';
        this.code = args.code;
        this.remediation = args.remediation;
    }
}
/**
 * Fold the features' router fragments into one router — value AND type
 * from the single list. A mount key claimed by two features is a compile
 * error, and throws `FeatureError` at module load for code that skips types.
 */
export function composeRouter(features) {
    const merged = {};
    for (const f of features) {
        for (const [key, fragment] of Object.entries(f.router)) {
            if (key in merged) {
                throw new FeatureError({
                    code: FEATURE_ERROR_CODES.duplicateRouterKey,
                    message: `[feature] router mount key "${key}" is contributed by more than one feature.`,
                    remediation: 'Give each feature its own router mount key, or merge the two fragments in one feature.',
                });
            }
            merged[key] = fragment;
        }
    }
    return merged;
}
/**
 * Fold the features' repo factories over one db handle. A repo key claimed
 * by two features is a compile error, and throws `FeatureError` for code
 * that skips types.
 */
export function composeRepos(features, database) {
    const repos = {};
    for (const f of features) {
        for (const [key, factory] of Object.entries(f.repos)) {
            if (key in repos) {
                throw new FeatureError({
                    code: FEATURE_ERROR_CODES.duplicateRepoKey,
                    message: `[feature] repo key "${key}" is contributed by more than one feature.`,
                    remediation: 'Give each feature its own repo key, or move both factories into one feature.',
                });
            }
            repos[key] = factory(database);
        }
    }
    return repos;
}
/**
 * The slice token a feature publishes. Driving adapters list these as
 * runtime needs so the kernel hands them each feature's slice record.
 */
export function tokenOf(f) {
    return token()(`feature.${f.name}`);
}
/** Compile one feature into the kernel unit the app mounts. Called by `.features()`. */
export function plug(f) {
    const tok = tokenOf(f);
    const actions = [...f.actions, ...f.use.flatMap(slice => slice.actions)];
    const boot = async (ctx) => {
        const extra = f.boot === undefined ? undefined : await f.boot(ctx);
        const payloads = {};
        for (const slice of f.use) {
            payloads[slice.key] = slice.resolve(ctx);
        }
        return { ...extra, ...provide(tok, payloads) };
    };
    // Factory seam: plugin()'s inference through the merged boot is erased
    // here and re-typed to the true shape declared above. feature()'s
    // signature already enforced NoReservedKeys on the caller's needs.
    return plugin({
        name: f.name,
        actions,
        needs: f.needs,
        boot: boot,
    });
}
/** Author a driving adapter. `bind` receives the app's mounted features, in order. */
export function driver(bind) {
    return { side: 'driving', bind };
}
/** Author a driven adapter that reads the features' declarations. */
export function driven(bind) {
    return { side: 'driven', bind };
}
/**
 * Bind a driver and add the features' slice tokens to its runtime needs,
 * so the kernel hands it every slice record and `dot explain` draws the
 * feature → driver edges. Called by `.serve()`.
 */
export function bindDriver(adapter, features) {
    const bound = adapter.bind(features);
    const sliceNeeds = Object.fromEntries(features.map(f => [tokenOf(f).key, tokenOf(f)]));
    return { ...bound, needs: { ...sliceNeeds, ...bound.needs } };
}
/**
 * The slice record one feature published — read inside a bound driver's
 * hooks. Values are untyped on purpose: the adapter that minted the slice
 * checks its own payload shape (`jobs()`, `schedules()`, `endpoints()`).
 */
export function sliceOf(ctx, f) {
    const key = tokenOf(f).key;
    const record = ctx[key];
    if (typeof record !== 'object' || record === null) {
        throw new FeatureError({
            code: FEATURE_ERROR_CODES.missingSlices,
            message: `[feature] the slice record of feature "${f.name}" is not in this hook's context.`,
            remediation: 'Mount the adapter with `.serve(adapter)` after `.features([...])`, so it is bound to the features.',
        });
    }
    return record;
}
//# sourceMappingURL=feature.js.map