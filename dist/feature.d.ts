/**
 * `@arki/dot/feature` — Domain modules for Dot apps: `defineFeature`, its routers and the services bag.
 *
 * A feature is a named, inert declaration of what one domain module
 * contributes to an app, written as one chain:
 *
 *   defineFeature('orders')
 *     .needs({ db })       what the feature takes from the app
 *     .infra({ ... })      its driven adapters (repositories, clients)
 *     .usecases({ ... })   its business rules
 *     .provides({ ... })   capabilities other features may need
 *     .entrypoints(...)    what drives it (rpc routers, jobs, schedules, HTTP routes)
 *
 * Entrypoint declarations come from the adapter that consumes them
 * (e.g. `jobs()` from `@arki/queue/dot`). Each carries its payload plus
 * the manifest actions derived from it, so this module depends on no
 * adapter and the set stays open.
 *
 * The app mounts features in the middle phase of the hexagon:
 *
 *   defineApp(name)
 *     .infra(...)       what features need (db, kv, queue client)
 *     .features([...]) the domain core
 *     .entrypoints(...) what calls the features (http, workers)
 *
 * `.features()` turns each feature into its units; driving adapters are
 * `entrypoint(...)` values that `.entrypoints()` binds to the mounted feature list.
 */
import type { AnyDefinedFeature } from './define-feature.js';
import type { ActionSource, AnyHandle, AnyUnit, CtxOf, DotHandlerObserver, NeedsShape, Service, Token, UnitBinder } from './unit-contract.js';
export { FEATURE_ERROR_CODES, FeatureError } from './feature-error.js';
export type { FeatureErrorCode } from './feature-error.js';
export { allFeatures, defineFeature, domainService, entrypointOnly, instanceOf, mountFeatures, ownUnits, requestServices, routerFor, } from './define-feature.js';
export type { AnyApplicationContribution, AnyDefinedFeature, AnyEntrypoint, AnyFeatureCore, AppContract, ApplicationContribution, ChildHandles, ChildOverrides, ChildProvides, ChildrenGuard, ChildUnits, ContractOf, CoreDeps, CoreHandles, DefinedFeature, DepsOf, EntrypointServicesOf, DomainServiceHandle, Entrypoint, EntrypointOnly, EntrypointOnlyNeeds, RequestHandles, EntrypointPayloads, EntrypointServices, EntrypointsStage, FeatureCore, FeatureParams, DomainServicesStage, DomainServiceValues, FeaturesStage, FeatureUnit, InfraProvides, InfraStage, InstanceChildren, NeedsGuard, NeedsStage, ProvidesDeps, ProvidesStage, QualifiedInfra, QualifiedUnit, RebindNeeds, RebindOf, ReservedAlias, RouterFor, RouterOf, RpcEntrypoint, ScopedHandle, ScopedHandles, UnitsOf, UsecaseFactories, UsecaseFactoriesOf, UsecaseGuard, UsecaseNeeds, Usecases, UsecasesStage, } from './define-feature.js';
export type { Handle, Handles, LazyHandle, Provided, ProvidesFactories } from './unit-contract.js';
/**
 * A boot-time slice contract. Adapter packages export factories that
 * produce these (`jobs()`, `schedules()`, `endpoints()`): the payload
 * lands under `key` in the feature's published slice record, and the
 * `actions` derived from the payload join the feature's manifest. The
 * shape is structural on purpose — an adapter can mint slices without
 * importing this module.
 */
export type FeatureSlice<K extends string = string, P = unknown, TServices = never> = {
    readonly key: K;
    readonly actions: readonly ActionSource[];
    /** Actions named after the mounting feature (an instance's ids carry its name); the chain form reads it. */
    readonly actionsOf?: (feature: string, children: readonly AnyDefinedFeature[]) => readonly ActionSource[];
    readonly resolve: (services: TServices) => P;
};
export type AnyFeatureSlice = FeatureSlice<string, unknown, never>;
type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (value: infer I) => void ? I : never;
/**
 * The service values a feature provides, keyed by wire key — each handle
 * unwrapped to its value type. Distributive over `F`, so a union of
 * features maps member by member (a mapped type over the union would keep
 * only the keys every member shares).
 */
export type ProvidedOf<F extends HasProvides> = F extends HasProvides ? {
    [K in keyof F['provides']]: F['provides'][K] extends Service<infer T> ? T : never;
} : never;
/**
 * The services a request context carries: wire key → value. Opaque on
 * purpose — naming the merged type in the context closes a type loop
 * through the routers. Procedures narrow it with their feature's own
 * `needs` through {@link resolveNeeds}.
 */
export type ServicesBag = Readonly<Record<string, unknown>>;
/** Anything with static handles — a feature or a unit. */
export type HasProvides = {
    readonly provides: Readonly<Record<string, AnyHandle>>;
};
/** Every handle the units in the tuple provide, merged into one record. */
export type HandlesIn<T extends readonly HasProvides[]> = UnionToIntersection<T[number]['provides']>;
/** Every service value the units (features or units) in the tuple provide, keyed by wire key. */
export type ServicesOf<T extends readonly HasProvides[]> = UnionToIntersection<ProvidedOf<T[number]>>;
/** The entries of a needs shape that are capability handles (driven services like `db` drop out). */
export type HandleEntries<N extends NeedsShape> = {
    [K in keyof N as N[K] extends {
        readonly provider: string;
    } ? K : never]: N[K];
};
/**
 * Every handle the features (and units) provide, merged — spread it into
 * a gateway feature's `needs` and the kernel hands it every capability:
 * `providesOf([database, cache, ...features])`. The builder guard then
 * proves the gateway is mounted after every provider.
 */
export declare function providesOf<const T extends readonly HasProvides[]>(units: T): HandlesIn<T>;
/**
 * A provides factory receives only `{ usecases }` (plus kernel keys), so the
 * capabilities `servicesOf` reads are never in it and it would throw
 * `ARKI_DOT_E026` at boot. This type turns that into a compile error: a
 * context that has a `usecases` key is rejected; any other object passes.
 */
export type RejectProvidesContext<C extends object> = [C] extends [{
    readonly usecases: unknown;
}] ? never : C;
/**
 * Read every capability the units (features or units) provide out of a hook context whose
 * `needs` spread {@link providesOf} — the bag a gateway passes to its
 * request context.
 */
export declare function servicesOf<const T extends readonly HasProvides[], const C extends object>(ctx: RejectProvidesContext<C>, features: T): ServicesOf<T>;
/**
 * Narrow a request context's services bag with a feature's own `needs`:
 * each capability handle resolves to its value under the local alias.
 * Infra services (`db`) are not in the bag and drop out of the result.
 *
 * @throws {FeatureError} `ARKI_DOT_E026` when a handle's key is not in the bag.
 */
export declare function resolveNeeds<N extends NeedsShape>(bag: ServicesBag, needs: N): CtxOf<HandleEntries<N>>;
export { entrypoint, infra, unit } from './unit-contract.js';
export type { EntrypointBinder, FeaturesContext, FromFeaturesDefinition, InfraBinder, UnitBinder, } from './unit-contract.js';
/**
 * Bind a driver and add the features' slice tokens to its runtime needs,
 * so the kernel hands it every slice record and `dot explain` draws the
 * feature → driver edges. Called by `.entrypoints()`.
 */
export declare function bindEntrypoint<const Unit extends AnyUnit>(adapter: UnitBinder<'infra' | 'entrypoint', Unit>, features: readonly AnyDefinedFeature[]): Unit & {
    needs: {
        [x: string]: Service<unknown> | Token<Readonly<Record<string, unknown>>, string>;
    };
};
/**
 * The slice record one feature published — read inside a bound driver's
 * hooks. Values are untyped on purpose: the adapter that minted the slice
 * checks its own payload shape (`jobs()`, `schedules()`, `endpoints()`).
 */
export declare function sliceOf(ctx: object, f: AnyDefinedFeature): Readonly<Record<string, unknown>>;
/**
 * The handler observer a feature's services bag carries (its `$handlers`), for
 * transport adapters that emit handler events. A bag without one — an adapter
 * used outside Dot, a hand-made test bag — gets a pass-through that just runs the call.
 */
export declare function handlerObserverOf(services: object): DotHandlerObserver;
export { telemetryFor } from './telemetry.js';
export type { DotTelemetry } from './telemetry.js';
//# sourceMappingURL=feature.d.ts.map