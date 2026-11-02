import { isFailure, UnexpectedDefect } from '@arki/failure';
import { FEATURE_ERROR_CODES, FeatureError } from './feature-error.js';
import { traceUsecase } from './kernel/otel.js';
import { superviseUsecase } from './kernel/usecase.js';
import { createUnitRuntime, handleOf, HANDLERS_KEY, isLazyWitness, rename } from './unit-contract.js';
const RESERVED = new Set(['session', 'headers', 'services', 'usecases']);
/** The chain's steps in order: `.domainServices()` refuses to run after a later one (`ARKI_DOT_E035`). */
const STEP = { needs: 0, infra: 1, domainServices: 2, features: 3, usecases: 4, provides: 5 };
const REPARENT = Symbol('dot.feature.reparent');
const NEEDS = Symbol('dot.feature.needs');
function collision(feature, what, remediation) {
    return new FeatureError({
        code: FEATURE_ERROR_CODES.keyCollision,
        message: `[feature] "${feature}": ${what}.`,
        remediation,
    });
}
/** The handle a witness was written with: a remap or an `entrypointOnly` clone keeps it under `origin`. */
const canonical = (w) => w.origin ?? w;
/** The lazy form a handle carries, if any. */
const lazyFormOf = (h) => h.lazy;
/** Is `witness` the feature's own handle `own` (either form, lazy included)? */
function sameHandle(witness, own) {
    const a = canonical(witness);
    const b = canonical(own);
    return a === b || a === lazyFormOf(b) || lazyFormOf(a) === b;
}
/** The wire key a witness names: a token's own key, else the alias (anonymous `service<T>()`). */
function wireKeyOf(witness, alias) {
    return 'key' in witness && typeof witness.key === 'string' ? witness.key : alias;
}
/** `digest.compile.rank` → `digest.compile`; a top-level name has no parent. */
function parentOf(name) {
    const at = name.lastIndexOf('.');
    return at === -1 ? undefined : name.slice(0, at);
}
/**
 * The instance segment of a feature or unit name: `reports#eu`, `reports#eu.audit` and `reports#eu/store` → `eu`;
 * `reports` → `undefined`.
 * Adapters qualify what they register by it (`send-digest#eu`), so a plain feature's names never change.
 */
export function instanceOf(name) {
    const at = name.indexOf('#');
    if (at === -1)
        return undefined;
    // The segment ends at the next `.` (a nested child) or `/` (an infra unit, `reports#eu/store`).
    const end = name.slice(at + 1).search(/[./]/);
    return end === -1 ? name.slice(at + 1) : name.slice(at + 1, at + 1 + end);
}
/** Mint a handle with explicit ownership; `.lazy` carries the same metadata. */
function scopedHandleOf(key, provider, scope, internal = false) {
    const h = handleOf(key, provider);
    const lazy = { ...h.lazy, scope, internal };
    return { ...h, scope, internal, lazy };
}
/**
 * Mark a need as entrypoint-only: usecases never receive it; entrypoints and
 * `provides` factories do. The flag survives `.lazy`. The clone keeps the
 * handle it was made from under `origin`, so identity checks (`.infra()`,
 * the child remap, assembly) still see the original.
 */
export function entrypointOnly(handle) {
    const lazy = { ...handle.lazy, entrypointOnly: true, origin: canonical(handle.lazy) };
    // Erasure seam: the flag and the provenance are added to the handle and its lazy form; the type says the flag only.
    return { ...handle, entrypointOnly: true, origin: canonical(handle), lazy };
}
/** One witness per factory, so a child's need and its parent's declaration meet by identity. */
const domainServiceWitnesses = new WeakMap();
/**
 * Need a domain service the parent feature declares: `needs({ extras: domainService(extras) })` in a
 * child, where `extras` is the factory the parent passes to `.domainServices({ extras })`. The parent
 * binds it to the value it built, once per boot (`domainService(fn).lazy` gives the lazy form). Only a
 * child may need one, and only of a factory its parent declares above `.features()`
 * (`ARKI_DOT_E034` otherwise). The same factory always gives the same witness.
 */
export function domainService(fn) {
    const known = domainServiceWitnesses.get(fn);
    // Erasure seam: the map is keyed by the factory itself, so the witness stored under `fn` was made for `Fn`.
    if (known !== undefined)
        return known;
    const made = {
        domainService: fn,
        parentBound: true,
        lazy: { lazy: true, domainService: fn, parentBound: true },
    };
    domainServiceWitnesses.set(fn, made);
    return made;
}
/** The factory a `domainService(fn)` witness names, or `undefined` for any other witness. */
const domainServiceIn = (witness) => ('domainService' in witness ? witness.domainService : undefined);
/** A feature and every descendant, depth-first in declaration order — what drivers and `dot explain` walk. Each node once. */
export function allFeatures(features) {
    return features.flatMap(f => [f, ...allFeatures(f.features)]);
}
/** A node's OWN kernel units — its qualified infra and its feature unit — never a descendant's. Adapters read declarations from these. */
export function ownUnits(feature) {
    return feature.units().filter(u => u.name === feature.name || u.name.startsWith(`${feature.name}/`));
}
/**
 * The handles a gateway needs to serve requests for these features, as one
 * `provides` record: the top-level features' public handles, and the
 * `<name>.services` bag of every node (nested children included), which
 * `bind(core)` reads per request. The bags are published public here on
 * purpose — serving requests is the assembly's job, not a feature's — so a
 * gateway may spread them into its needs. The gateway is a driving adapter,
 * not a feature (a feature's `provides` sees only its usecases), mounted with
 * the app's `.entrypoints(gateway)`:
 *
 * ```ts
 * const units = [...legacy, requestServices(converted)];
 * entrypoint({ name: 'gateway', needs: { ...providesOf(units) }, provides: { rpc: ctx => servicesOf(ctx, units) … } })
 * ```
 */
export function requestServices(features) {
    const provides = {};
    for (const f of features)
        Object.assign(provides, f.provides);
    for (const node of allFeatures(features))
        provides[`${node.name}.services`] = handleOf(`${node.name}.services`, node.name);
    // Erasure seam: built key by key at runtime; the type is read off the features' own units.
    return { provides: provides };
}
function within(feature, scope) {
    return feature === scope || feature.startsWith(`${scope}.`);
}
/** Why `feature` may not need `witness`, or `undefined` when it may. Reads the handle's own metadata, nothing derived. */
function unreachable(feature, witness) {
    if (witness.internal === true)
        return 'an internal handle (usecases/services); need its provides instead';
    if (typeof witness.scope === 'string' && !within(feature, witness.scope))
        return `private to "${witness.scope}"`;
    return undefined;
}
/**
 * Assemble features for an app: the normalized node list (each node once, depth-first)
 * and the kernel units. Checks raw-handle ownership before anything binds by key: a unit
 * outside a feature's scope that still holds one of its raw infra handles is refused —
 * the remap at `.features()` has replaced every legitimate one, so only outsiders keep them.
 * `defineApp().features()` runs this; drivers and driven adapters read `features` from it.
 *
 * @throws {FeatureError} `ARKI_DOT_E026` naming the unit, the alias and the owning feature.
 */
export function mountFeatures(features) {
    const nodes = allFeatures(features);
    // A feature and its instances share the same infra unit objects, so one raw handle may have several owners.
    const owned = new Map();
    for (const f of nodes) {
        for (const [handle, scope] of f.owned) {
            const scopes = owned.get(handle) ?? new Set();
            scopes.add(scope);
            owned.set(handle, scopes);
        }
    }
    const units = features.flatMap(f => f.units());
    for (const unit of units) {
        const feature = unit.name.split('/')[0] ?? unit.name;
        for (const [alias, witness] of Object.entries(unit.needs)) {
            // Only a parent binds `domainService(fn)` (it rewires the need when it compiles); one still raw here
            // belongs to a child mounted without its parent, and must not bind by alias to whatever publishes the key.
            if (domainServiceIn(witness) !== undefined) {
                throw new FeatureError({
                    code: FEATURE_ERROR_CODES.domainServiceNotAbove,
                    message: `[feature] "${unit.name}": need "${alias}" is domainService(...), which only the parent feature binds, but "${feature}" is mounted without its parent.`,
                    remediation: `Mount the parent feature "${parentOf(feature) ?? feature}"; it mounts this child with .features().`,
                });
            }
            // A remapped need (or an entrypointOnly clone) keeps the handle it was written with under `origin`.
            const scopes = owned.get(canonical(witness));
            if (scopes !== undefined && ![...scopes].some(owner => within(feature, owner))) {
                const scope = [...scopes].join('", "');
                throw new FeatureError({
                    code: FEATURE_ERROR_CODES.missingCapability,
                    message: `[feature] "${unit.name}": need "${alias}" is a raw infra handle of "${scope}" (private); it would otherwise bind to whatever publishes "${wireKeyOf(witness, alias)}".`,
                    remediation: `Need a public handle, or have "${scope}" re-export the service with provides().`,
                });
            }
        }
    }
    return { features: nodes, units };
}
/**
 * Rewrite a child unit's needs that name THIS feature's infra handles — matched by
 * handle identity (the object the child wrote, its lazy form, or an `entrypointOnly`
 * clone of either), never by key, so a same-key handle of another store is left as
 * it is for `mountFeatures` to refuse. The remapped handle keeps the original under
 * `origin` and the entrypoint-only flag.
 */
function remapNeeds(unit, ownedInfra) {
    const needs = {};
    let touched = false;
    for (const [alias, witness] of Object.entries(unit.needs)) {
        const original = canonical(witness);
        const target = ownedInfra.get(original);
        if (target === undefined) {
            needs[alias] = witness;
            continue;
        }
        const handle = scopedHandleOf(target.key, target.unit, target.scope);
        const flag = witness.entrypointOnly === true ? { entrypointOnly: true } : {};
        // Provenance: the handle the child wrote stays attached, so assembly can validate the original owner.
        const remapped = isLazyWitness(witness)
            ? { ...handle.lazy, ...flag, origin: original }
            : { ...handle, ...flag, origin: original };
        needs[alias] = remapped;
        touched = true;
    }
    return touched ? { ...unit, needs } : unit;
}
/** The children's public handles, merged by local key. */
function childHandles(children) {
    return Object.assign({}, ...children.map(c => c.provides));
}
/**
 * Qualify every infra plugin: keys → `<feature>.<key>`, names → `<feature>/<unit>`,
 * sibling needs → the qualified key, every other need alias → the feature's own handle.
 */
function qualifyInfra(feature, declared, infra) {
    const unitByKey = new Map();
    for (const p of infra)
        for (const key of Object.keys(p.provides))
            unitByKey.set(key, `${feature}/${p.name}`);
    const handles = {};
    const units = infra.map((p) => {
        const unitName = `${feature}/${p.name}`;
        const qualified = {};
        for (const key of Object.keys(p.provides)) {
            qualified[key] = `${feature}.${key}`;
            handles[key] = scopedHandleOf(`${feature}.${key}`, unitName, feature);
        }
        const needs = {};
        for (const [alias, witness] of Object.entries(p.needs)) {
            const key = wireKeyOf(witness, alias);
            const sibling = unitByKey.get(key);
            if (sibling === undefined) {
                // Not a sibling: the feature's own need under this alias (`.infra()` proved it exists). A lazy witness takes the lazy form.
                const own = declared[alias] ?? witness;
                needs[alias] =
                    isLazyWitness(witness) && !isLazyWitness(own)
                        ? (own.lazy ?? own)
                        : own;
                continue;
            }
            // The sibling's key is qualified now; the need follows it (a lazy witness stays lazy).
            const handle = handleOf(`${feature}.${key}`, sibling);
            needs[alias] = isLazyWitness(witness) ? handle.lazy : handle;
        }
        const renamed = rename(p, qualified, unitName);
        // The unit's own handles carry ownership too, so `units()[i].provides[k]` is refused outside the feature.
        const provides = Object.fromEntries(Object.keys(renamed.provides).map(key => [key, scopedHandleOf(key, unitName, feature)]));
        return { ...renamed, needs, provides };
    });
    return { units, handles };
}
/** Rebuild one infra unit with some services replaced; untouched units are returned as they are. */
function replaceServices(p, values, used) {
    const factories = { ...p.factories };
    let touched = false;
    for (const key of Object.keys(p.provides)) {
        if (!(key in values))
            continue;
        // `factories` is keyed by publish key; `provides` by wire key (they differ after a rename()).
        const local = Object.entries(p.renames).find(([, wire]) => wire === key)?.[0] ?? key;
        const value = values[key];
        factories[local] = () => value;
        used.add(key);
        touched = true;
    }
    return touched ? { ...p, factories, runtime: createUnitRuntime(), hooks: {} } : p;
}
function checkEntrypoints(state, entrypoints) {
    const seen = new Set();
    // Contributions share the slice record with the entrypoints, so one key may name one of them only.
    for (const c of state.contributions) {
        if (seen.has(c.key)) {
            throw new FeatureError({
                code: FEATURE_ERROR_CODES.duplicateSliceKey,
                message: `[feature] "${state.name}" lists two "${c.key}" contributions; the second would silently replace the first.`,
                remediation: `Merge the two "${c.key}" contributions into one call (journalHandlers(core, { effects, taps, workflows })).`,
            });
        }
        seen.add(c.key);
    }
    for (const e of entrypoints) {
        if (seen.has(e.key)) {
            throw new FeatureError({
                code: FEATURE_ERROR_CODES.duplicateSliceKey,
                message: `[feature] "${state.name}" declares two "${e.key}" entrypoints or contributions; the second would silently replace the first.`,
                remediation: `Merge the two "${e.key}" entrypoints into one, or move one into its own feature.`,
            });
        }
        seen.add(e.key);
        if (e.key in state.provides || e.key === 'usecases') {
            throw collision(state.name, `entrypoint "${e.key}" collides with a provided service`, 'Rename the provided service; entrypoint keys are fixed by their adapter.');
        }
    }
}
function checkChildContracts(state, entrypoints) {
    const rpc = entrypoints.find(e => e.kind === 'rpc');
    // By router identity: `rpc(contract, implementer, () => ({ compile: compile.router }))` keeps the child's router object as it is.
    const mounted = new Set(rpc !== undefined && 'router' in rpc ? Object.values(rpc.router) : []);
    for (const child of state.children) {
        if (child.contract !== undefined && !mounted.has(child.router)) {
            throw new FeatureError({
                code: FEATURE_ERROR_CODES.contractNotMounted,
                message: `[feature] "${state.name}": the rpc contract of its child "${child.name}" is not mounted in its own contract.`,
                remediation: `Add the child's contract under a key of "${state.name}"'s contract and its router under the same key in rpc(...).`,
            });
        }
    }
}
/** A usecase is supervised, then traced. A domain service is traced only (`traceUsecase`: a function gets a span, any other value passes as is). */
const wrapUsecase = (feature, key, value) => traceUsecase(feature, key, superviseUsecase(value));
/**
 * Keep creation failures typed while the kernel owns and joins asynchronous preparation. Builds the
 * usecases, and the domain services too: each under the reserved `usecases` slot of the unit's context,
 * which no need alias or infra key may take.
 */
async function prepareUsecases(feature, factories, deps, wrap) {
    const usecases = {};
    for (const key in factories) {
        const create = factories[key];
        // Each factory gets its own frozen copy, so one factory cannot change what the next one sees.
        const ownDeps = Object.freeze({ ...deps });
        const created = await Promise.resolve(create(ownDeps));
        if (creationFailed(created))
            return created;
        usecases[key] = wrap(feature, key, created);
    }
    return { usecases };
}
/**
 * Build the domain services. The types refuse a factory that can fail (`DomainServicesGuard`); one that
 * fails anyway, past erased types, fails boot as a defect: no reader's type expects that Failure.
 */
async function prepareDomainServices(feature, factories, deps) {
    const built = await prepareUsecases(feature, factories, deps, traceUsecase);
    return creationFailed(built) ? UnexpectedDefect({ cause: built }) : built;
}
function creationFailed(value) {
    return isFailure(value);
}
function compile(state, infra, handles, entrypoints) {
    checkEntrypoints(state, entrypoints);
    checkChildContracts(state, entrypoints);
    const usecasesKey = `${state.name}.usecases`;
    const servicesKey = `${state.name}.services`;
    const sliceKey = `feature.${state.name}`;
    const nested = parentOf(state.name) !== undefined;
    const instanced = state.name.includes('#');
    const domainServices = state.domainServices ?? {};
    const domainUnitName = `${state.name}/domain-services`;
    // Each domain service under its local key, published as `<name>.<key>` and private to this feature and its children.
    const domainHandles = {};
    for (const key of Object.keys(domainServices))
        domainHandles[key] = scopedHandleOf(`${state.name}.${key}`, domainUnitName, state.name);
    // Inside a parent a provided key is scoped: `digest.compile.compiler`; an instance qualifies too
    // (`reports#eu.summary`), so two copies mount side by side. At the top level it is public and bare.
    const publishKey = (key) => (nested || instanced ? `${state.name}.${key}` : key);
    // This feature's raw infra handles (and their lazy forms) → where they live now (`digest.repos`, unit `digest/store`).
    const ownedInfra = new Map();
    for (const p of state.infra) {
        for (const [key, h] of Object.entries(p.provides)) {
            const target = { key: `${state.name}.${key}`, unit: `${state.name}/${p.name}`, scope: state.name };
            ownedInfra.set(h, target);
            ownedInfra.set(h.lazy, target);
        }
    }
    // A child's `domainService(fn)` (either form) → this feature's domain-service unit, rewired like an infra handle.
    for (const [key, fn] of Object.entries(domainServices)) {
        const witness = domainService(fn);
        const target = { key: `${state.name}.${key}`, unit: domainUnitName, scope: state.name };
        ownedInfra.set(witness, target);
        ownedInfra.set(witness.lazy, target);
    }
    // Entrypoint-only needs: in the unit's needs (boot order, explain), out of the usecases' deps.
    const doorKeys = new Set(Object.keys(entrypointOnlyNeeds(state.needs)));
    // Preparation enriches the owned kernel context once before any provider can run.
    const usecasesOf = (ctx) => ('usecases' in ctx ? ctx.usecases : undefined);
    // The exits: `provides` factories get the usecases; entrypoints get the entrypoint-only needs and the
    // usecases. Both keep the kernel's `$` keys. Infra, plain needs, children and domain services stay below.
    const kernelOf = (ctx) => Object.fromEntries(Object.entries(ctx).filter(([k]) => k.startsWith('$')));
    const providesDepsOf = (ctx) => Object.freeze({ ...kernelOf(ctx), usecases: usecasesOf(ctx) });
    const servicesOf = (ctx) => ({
        ...Object.fromEntries(Object.entries(ctx).filter(([k]) => doorKeys.has(k) || k.startsWith('$'))),
        usecases: usecasesOf(ctx),
    });
    // What a contribution binds to: what a usecase factory sees (no entrypoint-only need), without the kernel's keys
    // and without the usecases themselves. A contribution is application code, never an exit.
    const usecaseDepsOf = (ctx) => Object.freeze(Object.fromEntries(Object.entries(ctx).filter(([k]) => !doorKeys.has(k) && !k.startsWith('$') && k !== 'usecases')));
    const factories = {
        [usecasesKey]: usecasesOf,
        // The resolved services (entrypoint-only needs + usecases, by local key) — what `bind(logic)` hands a request.
        // One key per feature, read by the feature's own name: no per-handle resolution, so a remapped need just works.
        // The kernel's `$` keys stay out: a handler context carries the feature's services, not the kernel's.
        // The one exception is `$handlers`: transport adapters read it to emit handler events, then strip it.
        [servicesKey]: ctx => Object.fromEntries(Object.entries(servicesOf(ctx)).filter(([k]) => !k.startsWith('$') || k === HANDLERS_KEY)),
        // One record under `feature.<name>`, keyed by entrypoint and contribution key — what `sliceOf` reads.
        [sliceKey]: ctx => {
            const services = servicesOf(ctx);
            const deps = usecaseDepsOf(ctx);
            return Object.fromEntries([
                // Erasure seam: each contribution was typed against the usecase deps by `.usecases()`.
                ...state.contributions.map(c => [c.key, c.bind(deps)]),
                // Erasure seam: each entrypoint was typed against these services by `.entrypoints()`.
                ...entrypoints.map(e => [e.key, e.resolve(services)]),
            ]);
        },
    };
    for (const [key, factory] of Object.entries(state.provides)) {
        // Erasure seam: each factory was typed against these services by `.provides()`.
        factories[publishKey(key)] = ctx => factory(providesDepsOf(ctx));
    }
    // The unit's published handles keep ownership too: provides scoped to the parent, generated keys internal.
    const unitHandles = {};
    for (const key of Object.keys(factories)) {
        const generated = key === usecasesKey || key === servicesKey || key === sliceKey;
        unitHandles[key] = scopedHandleOf(key, state.name, generated ? state.name : parentOf(state.name), generated);
    }
    const runtime = createUnitRuntime(undefined, ctx => prepareUsecases(state.name, state.usecases, Object.fromEntries(Object.entries(ctx).filter(([key]) => !doorKeys.has(key))), wrapUsecase));
    // The domain services: one unit, built once per boot after the infra and before the children, from the
    // usecase-visible needs and the infra. Functions are traced, nothing is supervised.
    const domainUnit = state.domainServices === undefined
        ? undefined
        : {
            runtime: createUnitRuntime(undefined, ctx => prepareDomainServices(state.name, domainServices, ctx)),
            name: domainUnitName,
            needs: {
                ...Object.fromEntries(Object.entries(state.needs).filter(([key]) => !doorKeys.has(key))),
                ...infra.handles,
            },
            actions: [],
            renames: {},
            role: 'domain-service',
            provides: Object.fromEntries(Object.values(domainHandles).map(h => [h.key, h])),
            factories: Object.fromEntries(Object.entries(domainHandles).map(([key, h]) => [h.key, (ctx) => ctx.usecases[key]])),
            hooks: {},
        };
    // The record infra() builds, written out: the needs here are already handles, and the keys already wire keys.
    const unit = {
        runtime,
        name: state.name,
        needs: { ...state.needs, ...infra.handles, ...domainHandles, ...childHandles(state.children) },
        actions: [
            ...state.contributions.flatMap(c => c.actionsOf?.(state.name) ?? []),
            ...entrypoints.flatMap(e => [...e.actions, ...(e.actionsOf?.(state.name, state.children) ?? [])]),
        ],
        renames: {},
        role: 'feature',
        provides: unitHandles,
        factories,
        hooks: {},
    };
    // Boot order: this feature's infra, its domain services, then each child (its own units, any depth), then this feature.
    const units = [
        ...infra.units,
        ...(domainUnit === undefined ? [] : [domainUnit]),
        ...state.children.flatMap(c => c.units().map(u => remapNeeds(u, ownedInfra))),
        unit,
    ];
    const provides = {};
    for (const key of Object.keys(state.provides))
        provides[key] = scopedHandleOf(publishKey(key), state.name, parentOf(state.name));
    // Raw infra handles this feature owns (and its descendants'): what `mountFeatures` refuses to outsiders.
    const owned = new Map(state.children.flatMap(c => [...c.owned]));
    for (const p of state.infra) {
        for (const h of Object.values(p.provides)) {
            owned.set(h, state.name);
            owned.set(h.lazy, state.name);
        }
    }
    for (const fn of Object.values(domainServices)) {
        const witness = domainService(fn);
        owned.set(witness, state.name);
        owned.set(witness.lazy, state.name);
    }
    const rpc = entrypoints.find(e => e.kind === 'rpc');
    // A copy under another name: needs follow the rebind, children are re-derived under the new parent,
    // everything else is recompiled from the same declarations. Only the root copy gets its own rpc
    // contract identity — a parent's router holds its children's routers by identity.
    const reparent = (name, follow, root) => {
        const needs = Object.fromEntries(Object.entries(state.needs).map(([alias, w]) => [alias, followRebind(w, follow)]));
        const children = state.children.map(c => c[REPARENT](`${name}.${c.name.slice(state.name.length + 1)}`, follow));
        const next = { ...state, name, needs, children };
        const nextInfra = qualifyInfra(name, needs, next.infra);
        return compile(next, nextInfra, handlesOf(next), root ? ownContract(entrypoints) : entrypoints);
    };
    return {
        runtime,
        name: state.name,
        handles,
        provides,
        features: state.children,
        owned,
        entrypoints,
        contributions: state.contributions,
        contract: rpc !== undefined && 'contract' in rpc ? rpc.contract : undefined,
        router: rpc !== undefined && 'router' in rpc ? rpc.router : undefined,
        units: () => units,
        override: values => {
            // `compile.ranker` → the child named `<this>.compile`, override `ranker` there (recursive by construction).
            const own = {};
            const forChild = new Map();
            for (const [key, value] of Object.entries(values)) {
                const dot = key.indexOf('.');
                if (dot === -1) {
                    own[key] = value;
                    continue;
                }
                const local = key.slice(0, dot);
                const sub = forChild.get(local) ?? {};
                sub[key.slice(dot + 1)] = value;
                forChild.set(local, sub);
            }
            const used = new Set();
            const replaced = state.infra.map(p => replaceServices(p, own, used));
            for (const key of Object.keys(own)) {
                if (!used.has(key)) {
                    throw new FeatureError({
                        code: FEATURE_ERROR_CODES.unknownOverride,
                        message: `[feature] "${state.name}": override("${key}") names no service of its infra units.`,
                        remediation: `Override one of: ${state.infra.flatMap(p => Object.keys(p.provides)).join(', ') || '(no infra)'}.`,
                    });
                }
            }
            for (const local of forChild.keys()) {
                if (!state.children.some(c => c.name === `${state.name}.${local}`)) {
                    throw new FeatureError({
                        code: FEATURE_ERROR_CODES.unknownOverride,
                        message: `[feature] "${state.name}": override("${local}.…") names no child feature.`,
                        remediation: `Children: ${state.children.map(c => c.name).join(', ') || '(none)'}.`,
                    });
                }
            }
            const children = state.children.map(c => {
                const sub = forChild.get(c.name.slice(state.name.length + 1));
                return sub === undefined ? c : c.override(sub);
            });
            const next = { ...state, infra: replaced, children };
            return compile(next, qualifyInfra(next.name, next.needs, next.infra), handles, entrypoints);
        },
        instance: (suffix, rebind = {}) => {
            if (suffix === '' || /[./#]/.test(suffix)) {
                throw new FeatureError({
                    code: FEATURE_ERROR_CODES.keyCollision,
                    message: `[feature] "${state.name}": instance name "${suffix}" is not one plain segment.`,
                    remediation: 'Letters, digits and dashes only: .instance("eu"). "." nests, "/" marks an infra unit, "#" an instance.',
                });
            }
            const follow = new Map();
            for (const [alias, next] of Object.entries(rebind)) {
                const own = state.needs[alias];
                if (own === undefined) {
                    throw new FeatureError({
                        code: FEATURE_ERROR_CODES.unknownOverride,
                        message: `[feature] "${state.name}": instance("${suffix}") rebinds "${alias}", which is not a need.`,
                        remediation: `Needs: ${Object.keys(state.needs).join(', ') || '(none)'}.`,
                    });
                }
                follow.set(canonical(own), next);
            }
            return reparent(`${state.name}#${suffix}`, follow, true);
        },
        [REPARENT]: (name, follow) => reparent(name, follow, false),
        [NEEDS]: state.needs,
    };
}
/** The rebound handle with the flag `entrypointOnly(...)` sets, on it and on its lazy form; the clone keeps the handle under `origin`. */
function markEntrypointOnly(handle) {
    const lazy = lazyFormOf(handle);
    const flag = (w) => ({ entrypointOnly: true, origin: canonical(w) });
    const lazyFlagged = typeof lazy === 'object' && lazy !== null ? { lazy: Object.assign({}, lazy, flag(lazy)) } : {};
    return Object.assign({}, handle, flag(handle), lazyFlagged);
}
/** The witness after a rebind: the rebound handle (its lazy form for a lazy need), else the witness as written. */
function followRebind(witness, follow) {
    const base = canonical(witness);
    const direct = follow.get(base);
    if (direct !== undefined)
        return keepEntrypointOnly(witness, direct);
    for (const [from, to] of follow) {
        if (lazyFormOf(from) !== base)
            continue;
        const lazy = lazyFormOf(to);
        return keepEntrypointOnly(witness, typeof lazy === 'object' && lazy !== null ? lazy : to);
    }
    return witness;
}
/**
 * A rebound `entrypointOnly` need stays entrypoint-only, in either form: the flag belongs to the
 * alias, not to the old handle, so a rebind that drops it would hand a usecase the entrypoint's db.
 */
function keepEntrypointOnly(witness, rebound) {
    const flagged = witness.entrypointOnly === true && rebound.entrypointOnly !== true;
    return flagged ? markEntrypointOnly(rebound) : rebound;
}
/**
 * The rpc entrypoint with its own contract and router records: `routerFor`
 * finds a feature by contract identity, so a copy needs its own. The
 * procedures inside are shared; a child's router stays the same object, so
 * the parent's mount check still finds it.
 */
function ownContract(entrypoints) {
    return entrypoints.map(e => {
        if (e.kind !== 'rpc' || !('contract' in e) || !('router' in e))
            return e;
        const router = { ...e.router };
        return { ...e, contract: { ...e.contract }, router, resolve: () => router };
    });
}
/** The handles a feature's entrypoints and `bind(logic)` see: entrypoint-only needs and usecases. */
function handlesOf(state) {
    return {
        ...entrypointOnlyNeeds(state.needs),
        usecases: scopedHandleOf(`${state.name}.usecases`, state.name, state.name, true),
    };
}
/** The needs declared with `entrypointOnly(...)`: the only needs that pass the usecases to the exits. */
function entrypointOnlyNeeds(needs) {
    return Object.fromEntries(Object.entries(needs).filter(([, w]) => w.entrypointOnly === true));
}
function stage(state) {
    const infra = qualifyInfra(state.name, state.needs, state.infra);
    const handles = handlesOf(state);
    return {
        name: state.name,
        handles,
        needs: needs => {
            if ('provider' in needs && typeof needs.provider === 'string' && 'key' in needs) {
                throw collision(state.name, 'needs() takes a record of aliases, not a bare handle', 'Write .needs({ db: database.provides.db }) — the alias is the name usecases and entrypoints see.');
            }
            for (const [alias, witness] of Object.entries(needs)) {
                if (RESERVED.has(alias)) {
                    throw collision(state.name, `need alias "${alias}" is reserved`, 'Pick another alias for this need.');
                }
                const why = unreachable(state.name, witness);
                if (why !== undefined) {
                    throw new FeatureError({
                        code: FEATURE_ERROR_CODES.missingCapability,
                        message: `[feature] "${state.name}": need "${alias}" reaches "${wireKeyOf(witness, alias)}", ${why}.`,
                        remediation: 'Need a public handle, or have the owning feature re-export the service with provides().',
                    });
                }
                if (parentOf(state.name) === undefined && domainServiceIn(witness) !== undefined) {
                    throw new FeatureError({
                        code: FEATURE_ERROR_CODES.domainServiceNotAbove,
                        message: `[feature] "${state.name}": need "${alias}" is domainService(...), which names a parent's domain service; a top-level feature has no parent.`,
                        remediation: "Declare the factory in this feature's own .domainServices({ … }) and read it in the usecases by key, or need a public handle.",
                    });
                }
            }
            return stage({ ...state, needs, step: STEP.needs });
        },
        features: (...children) => {
            const seen = new Map([
                ...Object.keys(state.needs),
                ...state.infra.flatMap(p => Object.keys(p.provides)),
                ...Object.keys(state.domainServices ?? {}),
            ].map(k => [k, state.name]));
            const declared = new Set(Object.values(state.domainServices ?? {}));
            for (const child of children) {
                if (parentOf(child.name) !== state.name) {
                    throw new FeatureError({
                        code: FEATURE_ERROR_CODES.keyCollision,
                        message: `[feature] "${state.name}": child "${child.name}" is not named "${state.name}.<child>".`,
                        remediation: `Name the child "${state.name}.${child.name.split('.').at(-1)}" (its folder sits under this feature's).`,
                    });
                }
                for (const [alias, witness] of Object.entries(child[NEEDS])) {
                    const fn = domainServiceIn(witness);
                    if (fn === undefined || declared.has(fn))
                        continue;
                    throw new FeatureError({
                        code: FEATURE_ERROR_CODES.domainServiceNotAbove,
                        message: `[feature] "${state.name}": child "${child.name}" needs "${alias}" through domainService(...), but "${state.name}" does not declare that factory above .features().`,
                        remediation: `Pass the factory to "${state.name}".domainServices({ … }) before .features(); the child names the same function.`,
                    });
                }
                for (const key of Object.keys(child.provides)) {
                    const owner = seen.get(key);
                    if (RESERVED.has(key) || owner !== undefined) {
                        throw collision(state.name, `child "${child.name}" provides "${key}", which collides with ${owner === state.name ? 'a need alias or an infra service or a domain service' : `a service of "${owner}"`}`, 'Rename one of the two; inside a feature one key means one thing.');
                    }
                    seen.set(key, child.name);
                }
            }
            return stage({ ...state, children, step: STEP.features });
        },
        infra: (...units) => {
            const seen = new Set();
            for (const key of units.flatMap(p => Object.keys(p.provides))) {
                if (RESERVED.has(key) || key in state.needs || seen.has(key)) {
                    throw collision(state.name, `infra service "${key}" collides with a need alias, another infra service or a reserved name`, 'Give one of them another key with rename(), or another need alias.');
                }
                seen.add(key);
            }
            const siblingKeys = new Set(units.flatMap(p => Object.keys(p.provides)));
            for (const p of units) {
                for (const [alias, witness] of Object.entries(p.needs)) {
                    if (siblingKeys.has(wireKeyOf(witness, alias)))
                        continue;
                    const own = state.needs[alias];
                    if (own === undefined) {
                        throw new FeatureError({
                            code: FEATURE_ERROR_CODES.missingCapability,
                            message: `[feature] "${state.name}": infra unit "${p.name}" needs "${alias}", which the feature does not declare.`,
                            remediation: `Add it to .needs({ ${alias}: … }); the feature's handle is what the unit gets.`,
                        });
                    }
                    if ('key' in witness && !sameHandle(witness, own)) {
                        throw new FeatureError({
                            code: FEATURE_ERROR_CODES.missingCapability,
                            message: `[feature] "${state.name}": infra unit "${p.name}" binds "${alias}" to a handle other than the feature's.`,
                            remediation: 'Declare the unit need unbound (service<T>()); the feature passes its own handle.',
                        });
                    }
                    const why = unreachable(state.name, witness);
                    if (why !== undefined) {
                        throw new FeatureError({
                            code: FEATURE_ERROR_CODES.missingCapability,
                            message: `[feature] "${state.name}": infra unit "${p.name}" needs "${alias}", ${why}.`,
                            remediation: "An infra unit may need public handles and its own feature's scope only.",
                        });
                    }
                }
            }
            return stage({ ...state, infra: units, step: STEP.infra });
        },
        domainServices: factories => {
            if (state.step > STEP.domainServices || state.domainServices !== undefined) {
                throw new FeatureError({
                    code: FEATURE_ERROR_CODES.stepOrder,
                    message: `[feature] "${state.name}": .domainServices() runs once, after .needs()/.infra() and before .features(), .usecases() and .provides().`,
                    remediation: 'Declare every domain service in one .domainServices({ … }) call, right after .infra().',
                });
            }
            const infraKeys = new Set(state.infra.flatMap(p => Object.keys(p.provides)));
            for (const key of Object.keys(factories)) {
                if (RESERVED.has(key) || key in state.needs || infraKeys.has(key)) {
                    throw collision(state.name, `domain service "${key}" collides with a need alias, an infra service or a reserved name`, 'Rename the domain service; usecases see needs, infra and domain services by one key each.');
                }
            }
            return stage({ ...state, domainServices: factories, step: STEP.domainServices });
        },
        usecases: (factories, ...contributions) => stage({ ...state, usecases: factories, contributions, step: STEP.usecases }),
        provides: factories => {
            const infraKeys = new Set(state.infra.flatMap(p => Object.keys(p.provides)));
            for (const key of Object.keys(factories)) {
                if (RESERVED.has(key) ||
                    key === `${state.name}.usecases` ||
                    key === `${state.name}.services` ||
                    key === `feature.${state.name}`) {
                    throw collision(state.name, `provided service "${key}" is generated by the feature itself`, 'Rename the provided service.');
                }
                if (parentOf(state.name) !== undefined && infraKeys.has(key)) {
                    throw collision(state.name, `provided service "${key}" collides with an infra service`, "Rename one of the two; both publish under this feature's name.");
                }
            }
            return stage({ ...state, provides: factories, step: STEP.provides });
        },
        entrypoints: (...entrypoints) => compile(state, infra, handles, entrypoints),
    };
}
/**
 * Declare a feature. Pure data capture — nothing runs until the app boots.
 * See the module comment for the chain; `.entrypoints(...)` finishes it.
 */
export function defineFeature(name) {
    if (name.includes('#')) {
        throw new FeatureError({
            code: FEATURE_ERROR_CODES.keyCollision,
            message: `[feature] "${name}": "#" marks an instance.`,
            remediation: `Define the feature as "${name.split('#')[0]}" and call .instance("${name.split('#').slice(1).join('#')}").`,
        });
    }
    // Erasure seam: one runtime object serves every stage; the stage types
    // decide which step is callable and type each step's input and result.
    return stage({
        name,
        needs: {},
        infra: [],
        domainServices: undefined,
        step: STEP.needs,
        children: [],
        usecases: undefined,
        contributions: [],
        provides: {},
    });
}
/**
 * Resolve the app router from the app contract. Mount keys are written once,
 * in the app contract; each feature is found by contract identity. Compile
 * errors at the call: an app-contract key no feature implements, a feature
 * whose contract the app contract does not mount. Features without an `rpc`
 * entrypoint are skipped, so the app's whole feature list can be passed.
 * A nested feature's contract is mounted by its parent, not here.
 *
 * @throws {FeatureError} `ARKI_DOT_E029` / `ARKI_DOT_E030` for callers that skip the types.
 */
export function routerFor(app, features) {
    const out = {};
    for (const [key, contract] of Object.entries(app)) {
        const owners = features.filter(f => f.contract === contract);
        const owner = owners[0];
        if (owners.length !== 1 || owner === undefined) {
            throw new FeatureError({
                code: FEATURE_ERROR_CODES.contractOwner,
                message: `[feature] app contract key "${key}" is implemented by ${owners.length} features; expected exactly one.`,
                remediation: 'Pass the feature whose rpc entrypoint uses this contract, once.',
            });
        }
        out[key] = owner.router;
    }
    const mounted = new Set(Object.values(app));
    for (const f of features) {
        if (f.contract !== undefined && !mounted.has(f.contract)) {
            throw new FeatureError({
                code: FEATURE_ERROR_CODES.contractNotMounted,
                message: `[feature] the contract of feature "${f.name}" is not mounted in the app contract.`,
                remediation: `Add the contract of "${f.name}" to the app contract under its mount key.`,
            });
        }
    }
    // Erasure seam: resolved by contract identity at runtime; typed by the same lookup over the tuple.
    return out;
}
//# sourceMappingURL=define-feature.js.map