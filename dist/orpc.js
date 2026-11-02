import { implement, ORPCError, os, traverseContractProcedures } from '@orpc/server';
import { isFailure } from '@arki/failure';
import { rpcError } from '@arki/failure/orpc';
import { is, recordSchema } from '@arki/schema';
import { FEATURE_ERROR_CODES, FeatureError } from './feature-error.js';
import { handlerObserverOf } from './feature.js';
import { toJsonObject } from './manifest.js';
import { HANDLERS_KEY } from './unit-contract.js';
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
export function needsMiddleware() {
    const builder = os.$context();
    return (logic) => builder.middleware(({ context, next, path }) => {
        const key = `${logic.name}.services`;
        const services = context.services[key];
        if (typeof services !== 'object' || services === null) {
            throw new FeatureError({
                code: FEATURE_ERROR_CODES.missingCapability,
                message: `[feature] "${logic.name}": its services ("${key}") are not in the request context's bag.`,
                remediation: "Spread providesOf(units) over the features' units() into the gateway's needs and pass servicesOf(ctx, units) to createContext.",
            });
        }
        // The bag carries the kernel's `$handlers` for this adapter; the handler's context stays kernel-free.
        const handlerServices = Object.fromEntries(Object.entries(services).filter(([name]) => name !== HANDLERS_KEY));
        return handlerObserverOf(services).run({ transport: 'rpc', name: path.join('.') }, () => next({
            // Erasure seam: the kernel built this record from the unit's needs, which the
            // chain typed as the feature's handles. oRPC asks that new context keys agree
            // with the current ones (`IntersectPick`); no alias is a request key — the
            // guard above proves it — but TypeScript cannot see that through a generic `H`.
            context: handlerServices,
        }), { thrown: refusalOf });
    });
}
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
export function rpcFor() {
    const bind = needsMiddleware();
    return {
        bind,
        implement: (contract, config) => ({
            with: (logic) => implementWith(contract, config, bind(logic)),
        }),
    };
}
// Erasure seam: oRPC's `Implementer<C, …>` is a conditional on `C` (one procedure, or a router)
// that stays unresolved inside a generic, so `.use` is not callable on it there. The body is
// written against a plain router contract and the overload above carries the types.
function implementWith(contract, config, boundLogic) {
    return implement(contract, config).use(boundLogic);
}
/**
 * An oRPC error below 500 (`UNAUTHORIZED`, `BAD_REQUEST`, a declared failure, a step's refusal)
 * is normal traffic: the call was refused, not broken. Anything else thrown is a bug.
 */
function refusalOf(thrown) {
    if (!(thrown instanceof ORPCError) || thrown.status >= 500)
        return undefined;
    // `rpcError` keeps the failure as `cause`; a hand-thrown error may carry one as `data`.
    if (isFailure(thrown.cause))
        return { failure: thrown.cause };
    return isFailure(thrown.data) ? { failure: thrown.data } : {};
}
// Erasure seam: `SuccessOf` of a generic `R` does not narrow under `isFailure`, so
// the body is written against `Context` and the overload above carries the types.
export function step(fn) {
    return async (options) => {
        const value = await fn(options.context);
        if (isFailure(value))
            throw rpcError(value, options.errors);
        return options.next({ context: value });
    };
}
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
export function around(fn) {
    return async (options) => fn(options.context, async () => options.next());
}
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
export function rpc(contract, implementer, procedures) {
    // Read now, so a bad `meta` fails where the feature is declared, not at boot.
    const contractProcedures = rpcProcedures(contract);
    const router = procedures(implementer);
    return {
        kind: 'rpc',
        key: 'rpc',
        actions: [],
        actionsOf: (feature, children = []) => {
            const mounted = mountedPaths(router, new Set(children.map(child => child.router)));
            return contractProcedures
                .filter(procedure => !mounted.some(prefix => procedure.path === prefix || procedure.path.startsWith(`${prefix}.`)))
                .map(procedure => rpcAction(feature, procedure));
        },
        contract,
        router,
        // The router is static: it is the same object before boot and after, so `resolve` just hands it back.
        resolve: () => router,
    };
}
/** The dotted paths in the built router whose value is a declared child's router — the child declares those actions. */
function mountedPaths(router, childRouters, path = []) {
    return Object.entries(router).flatMap(([key, value]) => {
        const here = [...path, key];
        if (childRouters.has(value))
            return [here.join('.')];
        // A procedure carries `~orpc`; only plain groups are walked.
        if (is(value, recordSchema) && !('~orpc' in value))
            return mountedPaths(value, childRouters, here);
        return [];
    });
}
/** Identifies the layout of an rpc action's `meta`, for tools that read `dot explain --json`. */
export const RPC_ACTION_META_SCHEMA = '@arki/dot/rpc-action-meta@1';
/** Every procedure of a contract with what `dot explain` shows: path, HTTP route, errors and declared meta. */
function rpcProcedures(contract) {
    const found = [];
    traverseContractProcedures({ router: contract, path: [] }, ({ contract: procedure, path }) => {
        const { route, meta, errorMap } = procedure['~orpc'];
        const name = path.join('.');
        const detail = { procedure: name };
        if (route.method !== undefined)
            detail['method'] = route.method;
        if (route.path !== undefined)
            detail['path'] = route.path;
        if (route.tags !== undefined && route.tags.length > 0)
            detail['tags'] = [...route.tags];
        if (route.deprecated === true)
            detail['deprecated'] = true;
        const errors = Object.keys(errorMap);
        if (errors.length > 0)
            detail['errors'] = errors;
        // Contract meta is where an app declares a procedure's policy (`oc.$meta<{ auth: 'admin' }>()`);
        // copying it here is what makes that policy visible without booting anything.
        if (Object.keys(meta).length > 0)
            detail['meta'] = jsonMeta(name, meta);
        found.push({
            path: name,
            ...(route.method === undefined ? {} : { method: route.method }),
            ...(route.path === undefined ? {} : { route: route.path }),
            ...(route.summary === undefined ? {} : { summary: route.summary }),
            meta: detail,
        });
    });
    return found;
}
function jsonMeta(procedure, meta) {
    try {
        return toJsonObject(meta);
    }
    catch {
        throw new FeatureError({
            code: FEATURE_ERROR_CODES.rpcMetaNotJson,
            message: `[rpc] procedure "${procedure}" has contract meta that is not plain JSON, so dot explain cannot show it.`,
            remediation: 'Keep contract meta to strings, numbers, booleans, null, arrays and plain objects (no functions, dates or classes).',
        });
    }
}
/**
 * One manifest action per procedure. The id carries the feature
 * (`digest.preview`): ids are unique per binding across the app. The
 * address is the HTTP route when the contract declares one, else the path.
 */
function rpcAction(feature, procedure) {
    const route = procedure.route === undefined ? undefined : `${procedure.method ?? 'POST'} ${procedure.route}`;
    return {
        id: `${feature}.${procedure.path}`,
        binding: 'rpc',
        direction: 'in',
        address: route ?? procedure.path,
        ...(procedure.summary === undefined ? {} : { summary: procedure.summary }),
        metaSchema: RPC_ACTION_META_SCHEMA,
        meta: procedure.meta,
    };
}
//# sourceMappingURL=orpc.js.map