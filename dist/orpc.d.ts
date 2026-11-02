/**
 * `@arki/dot/orpc` — oRPC procedures for `defineFeature` features, contract first.
 *
 * Design: RFC `docs/rfcs/2026-10-15-dot-feature-builder.md`, Part B.
 *
 *   // app: entrypoints/middleware.ts
 *   export const { implement } = rpcFor<RequestContext>();
 *
 *   // features/digest/feature.ts
 *   const digestDeps = defineFeature('digest').needs({ plans }).infra(store);
 *   export type Deps = DepsOf<typeof digestDeps>;
 *   export const digestLogic = digestDeps.usecases({ preview });
 *   export const rpcImplementer = implement(digestRpcContract).with(digestLogic);
 *   export const digest = digestLogic.entrypoints(rpc(digestRpcContract, rpcImplementer, digestProcedures));
 *
 *   // features/digest/entrypoints/procedures.ts — `import type` only, so no runtime back-import
 *   import type { rpcImplementer } from '../feature';
 *   export const digestProcedures = (impl: typeof rpcImplementer) => ({
 *     preview: impl.preview.handler(({ context }) => context.usecases.preview()),
 *   });
 *
 * Two pieces:
 *
 * - `rpcFor<Ctx>()` makes the app's `implement` (and `bind`, the middleware
 *   behind it). `implement(contract).with(digestLogic)` is oRPC's implementer
 *   of the contract on the app's request context, with the feature's needs,
 *   private infra and usecases on the handler context, by alias, read from
 *   the request's services bag. The request context keeps request data only
 *   (`session`, `headers`, `services`); the feature's dependencies are
 *   declared once, in its chain, where `dot explain` sees them.
 * - `rpc(contract, implementer, procedures)` is the entrypoint descriptor.
 *   `procedures` is one function of the implementer that returns the router,
 *   shaped like the contract (a group is a nested object; a mounted child
 *   feature is `child.router`). Keys match the contract exactly: an extra key,
 *   a missing key or a procedure that does not implement its key do not compile.
 *   Each procedure also becomes a manifest action, so `dot explain` lists
 *   the feature's procedures and the policy their contract meta declares.
 *
 * `@orpc/server` is an optional peer. Import this module only in an app that
 * serves oRPC; the rest of Dot never loads it.
 */
import type { BuilderConfig, Context, ContractProcedure, ContractRouter, ImplementerInternalWithMiddlewares, IntersectPick, Meta, MiddlewareNextFn, MiddlewareResult, Router } from '@orpc/server';
import type { Failure, FailureOf, SuccessOf } from '@arki/failure';
import type { DeclaredErrors } from '@arki/failure/orpc';
import type { RpcEntrypoint } from './define-feature.js';
import type { HandleEntries, ServicesBag } from './feature.js';
import type { CtxOf, NeedsShape } from './unit-contract.js';
/** The least a request context carries for `bind`: the services bag the gateway built for this request. */
export type RequestContextShape = {
    readonly services: ServicesBag;
};
/** What `bind(logic)` adds to a handler's context: every handle of the feature's logic stage, resolved, under its alias. */
export type BoundContext<H extends NeedsShape> = CtxOf<HandleEntries<H>>;
/** Aliases that would land on top of a request-context key (the app's own extra keys included). */
type Shadowed<Ctx, H> = keyof H & keyof Ctx;
type ShadowGuard<Ctx, H> = [Shadowed<Ctx, H>] extends [never] ? unknown : {
    readonly 'DOT: a feature alias shadows a request-context key': Shadowed<Ctx, H>;
};
/**
 * Make the app's `bind` for its request context type, once:
 * `export const bind = needsMiddleware<RequestContext>()`.
 *
 * `bind(logic)` is an oRPC middleware. It reads the feature's resolved
 * services — the one bag key `<name>.services` the feature unit publishes
 * (needs, private infra, children's provides and usecases, by alias) — and
 * adds them to the context. One key per feature, read by the feature's own
 * name: no per-handle resolution, so a nested feature's remapped needs just
 * work. A missing key → `ARKI_DOT_E026`, naming the feature. Infra services
 * such as `db` reach a handler only when the feature itself needs them — the
 * feature's store does, the procedure does not.
 *
 * An alias equal to a request-context key is a compile error at `bind(logic)`;
 * `session`, `headers`, `services` and `usecases` are already refused by
 * `defineFeature` (and at runtime there, for callers that skip the types).
 */
export declare function needsMiddleware<Ctx extends RequestContextShape>(): <H extends NeedsShape>(logic: {
    readonly name: string;
    readonly handles: H;
} & ShadowGuard<Ctx, H>) => import("@orpc/server").DecoratedMiddleware<Ctx & Record<never, never>, CtxOf<HandleEntries<H>> & IntersectPick<Ctx, CtxOf<HandleEntries<H>>>, unknown, any, any, Record<never, never>>;
/**
 * Make the app's oRPC pieces for its request context type, once:
 * `export const { implement } = rpcFor<RequestContext>()`.
 *
 * `implement(contract).with(logic)` is the feature's implementer: oRPC's
 * `implement(contract)` on the app's request context, with `bind(logic)` as
 * its first middleware. `config` is oRPC's own, passed through
 * (`transactionalProcedureConfig` from `@arki/db/orpc`, say). `bind` is that
 * middleware alone, for an app that composes an implementer by hand.
 */
export declare function rpcFor<Ctx extends RequestContextShape>(): {
    bind: <H extends NeedsShape>(logic: {
        readonly name: string;
        readonly handles: H;
    } & ShadowGuard<Ctx, H>) => import("@orpc/server").DecoratedMiddleware<Ctx & Record<never, never>, CtxOf<HandleEntries<H>> & IntersectPick<Ctx, CtxOf<HandleEntries<H>>>, unknown, any, any, Record<never, never>>;
    implement: <C extends Record<string, ContractRouter<Meta>>>(contract: C, config?: BuilderConfig) => {
        with: <H extends NeedsShape>(logic: {
            readonly name: string;
            readonly handles: H;
        } & ShadowGuard<Ctx, H>) => FeatureImplementer<C, Ctx, H>;
    };
};
/**
 * What `implement(contract).with(logic)` returns: oRPC's implementer of the
 * contract, each procedure's handler seeing the request context plus the
 * feature's handles (what `bind(logic)` adds).
 */
export type FeatureImplementer<C extends Record<string, ContractRouter<Meta>>, Ctx extends Context, H extends NeedsShape> = ImplementerInternalWithMiddlewares<C, Ctx, Ctx & BoundContext<H>>;
/** The oRPC middleware {@link step} makes: reads `In`, adds `Added`, or refuses with `Refused`. */
export type StepMiddleware<In, Added extends Context, Refused extends Failure> = <TOutput>(options: {
    readonly context: In;
    readonly next: MiddlewareNextFn<TOutput>;
    readonly errors: DeclaredErrors<Refused>;
}) => Promise<MiddlewareResult<Added, TOutput>>;
/** The oRPC middleware {@link around} makes: wraps the rest of the chain and the handler, adds nothing. */
export type AroundMiddleware<In> = <TOutput>(options: {
    readonly context: In;
    readonly next: MiddlewareNextFn<TOutput>;
}) => Promise<MiddlewareResult<Record<never, never>, TOutput>>;
/**
 * Run a step before an oRPC procedure: `impl.refund.use(step(authed))`.
 *
 * A step is a plain function. Its parameter is the least context it reads; it
 * returns an object to add to the context, or a failure to refuse the call:
 *
 *   const authed = (ctx: { principal: Principal | null }) =>
 *     ctx.principal === null ? AuthenticationRequired() : { principal: ctx.principal };
 *
 * A refusal is thrown as the typed `ORPCError` the procedure declares, so a
 * procedure that does not list the step's failures (the contract's errors, or
 * `.errors(errorMap(...))`) does not compile. oRPC hands a middleware the
 * procedure's whole error map; the `errors` parameter asks only for the codes
 * the step can refuse with. The same function attaches to the other
 * transports with their own `step`.
 */
export declare function step<In extends Context, R extends object | PromiseLike<object>>(fn: (context: In) => R): StepMiddleware<In, Extract<SuccessOf<(context: In) => R>, Context>, FailureOf<(context: In) => R>>;
/**
 * Wrap an oRPC procedure: `impl.refund.use(around(inTransaction))`.
 *
 * An around is a plain function that runs `next` inside whatever it sets up
 * (a transaction, a retry, a span, a timeout) and returns what `next` returns.
 * It never sees the result's shape, so the same function attaches to every
 * transport with that transport's `around`:
 *
 *   const inTransaction = <T>(ctx: { db: Db }, next: () => Promise<T>) => ctx.db.transaction(() => next());
 *
 * It wraps everything declared after it: later steps and the handler.
 */
export declare function around<In extends Context>(fn: <T>(context: In, next: () => Promise<T>) => Promise<T>): AroundMiddleware<In>;
/**
 * The feature's procedures: one function of its implementer that returns the
 * router, shaped like the contract. A leaf is `impl.<path>.handler(…)`, a
 * group a nested object, a mounted child feature its router (`child.router`)
 * under the key the contract gives it. `Router<C, never>` is oRPC's own
 * "implements" check — same schemas — and `never` as the initial context
 * accepts whatever context the app's implementer settled on.
 */
export type Procedures<C extends ContractRouter<Meta>, O, R extends Router<C, never> = Router<C, never>> = (implementer: O) => R;
type ExtraKeys<C, R> = {
    [K in keyof R]: K extends keyof C ? C[K] extends ContractProcedure<infer _I, infer _O, infer _E, infer _M> ? never : ExtraKeys<C[K], R[K]> : K;
}[keyof R];
/** A compile error naming each procedure key the contract does not list. */
export type ContractKeysGuard<C, R> = [ExtraKeys<C, R>] extends [never] ? unknown : {
    readonly 'DOT: a procedure key is not in the contract': ExtraKeys<C, R>;
};
/**
 * The feature's oRPC entrypoint: its contract, and the router its procedures
 * function builds from the implementer. The whole tree lives in one
 * `entrypoints/procedures.ts`, a function that takes the feature's
 * `rpcImplementer` as a typed parameter (`import type`), so it never imports
 * the feature at runtime. The contract stays the one list of procedure names:
 * a missing, extra or wrong procedure does not compile. `DefinedFeature.contract` /
 * `.router` are read from this descriptor, so `routerFor(rpcContract,
 * features)` finds the feature by its contract. Its actions (one per
 * procedure, `<feature>.<path>`) are named when the feature compiles, through
 * `actionsOf`. A subtree whose built router IS a declared child's router is
 * the child's: the child names those actions itself, so they are skipped
 * here. An inline group (`admin: { … }`) has no child owner and keeps its
 * actions.
 *
 * A usecase need not have a procedure (a cron, a webhook or a `provides`
 * handle may call it), and a procedure need not have a usecase: `rpc` checks
 * against the contract only.
 */
export declare function rpc<C extends ContractRouter<Meta>, O, R extends Router<C, never>>(contract: C, implementer: O, procedures: Procedures<C, O, R> & ContractKeysGuard<C, R>): RpcEntrypoint<C, R>;
/** Identifies the layout of an rpc action's `meta`, for tools that read `dot explain --json`. */
export declare const RPC_ACTION_META_SCHEMA = "@arki/dot/rpc-action-meta@1";
export {};
//# sourceMappingURL=orpc.d.ts.map