/**
 * Public plugin contract for the DOT kernel (v2).
 *
 * A plugin declares what it **needs** as a shape of type witnesses and
 * publishes what it **provides** from its `boot` hook. The kernel wires
 * services by key, injects them into hook contexts under the plugin's local
 * aliases, and fails loudly (coded errors) on unsatisfied needs or key
 * collisions.
 *
 * Design constraints:
 *
 *  - `configure` is SYNC. Returning a Promise is an error — the kernel
 *    throws {@link DotLifecycleError} with code `DOT_LIFECYCLE_E001`.
 *  - Declaration order IS boot order. The app builder's type-level guard
 *    makes out-of-order composition a compile error; the kernel re-validates
 *    at runtime for erased/dynamic composition.
 *  - `stop` and `dispose` run in reverse declaration order and continue
 *    through individual plugin failures, reporting an aggregate error.
 */
/**
 * Create an app-local (anonymous) service witness for a `needs` shape.
 *
 * `service.lazy<T>()` creates a lifting witness instead — the hook context
 * delivers a `Lazy<T>` handle whether the provider is eager or lazy.
 */
export const service = Object.assign(() => ({}), { lazy: () => ({ lazy: true }) });
/** Internal (kernel) check: is this witness a lazy-lifting one? */
export function isLazyWitness(witness) {
    return 'lazy' in witness && witness.lazy === true;
}
/**
 * Create a token. Curried so `T` is explicit while `K` is inferred as a
 * literal: `const Db = token<DbHandle>()('arki.db')`.
 */
export function token() {
    return (key) => ({
        key,
        instance(name) {
            // Safe by construction: the runtime string is exactly the template type.
            return token()(`${key}#${name}`);
        },
    });
}
/**
 * Publish a value under a token's wire key. Returns a record typed by the
 * token's literal key, so `boot: () => provide(Db, handle)` infers
 * `TProvides = { 'arki.db': DbHandle }`.
 */
export function provide(tok, value) {
    // Safe by construction: the computed key is exactly `tok.key: K`.
    return { [tok.key]: value };
}
/** Runtime brand for lazy service handles (kernel detects these for auto-dispose). */
export const LazyTag = Symbol('dot.lazy');
/**
 * Create a lazy service handle. See {@link Lazy} for semantics.
 *
 * @param init - Opens the resource. Runs at most once concurrently; a
 *   rejected attempt is not cached, so a later `get()` retries.
 * @param options.dispose - Cleanup for the initialized value. Skipped when
 *   the handle was never initialized.
 */
export function lazy(init, options = {}) {
    let state = { status: 'idle' };
    return {
        [LazyTag]: true,
        get() {
            if (state.status === 'ready')
                return Promise.resolve(state.value);
            if (state.status === 'pending')
                return state.promise;
            if (state.status === 'disposed') {
                return Promise.reject(new Error('Lazy service handle is disposed — the app has shut down.'));
            }
            const promise = Promise.resolve()
                .then(init)
                .then(value => {
                state = { status: 'ready', value };
                return value;
            }, (error) => {
                // Failed initialization is not cached — allow retry.
                state = { status: 'idle' };
                throw error;
            });
            state = { status: 'pending', promise };
            return promise;
        },
        get initialized() {
            return state.status === 'ready';
        },
        peek() {
            return state.status === 'ready' ? state.value : undefined;
        },
        async dispose() {
            if (state.status === 'pending') {
                try {
                    await state.promise;
                }
                catch {
                    // Failed init: nothing to clean up.
                }
            }
            if (state.status === 'ready') {
                const { value } = state;
                state = { status: 'disposed' };
                await options.dispose?.(value);
                return;
            }
            state = { status: 'disposed' };
        },
    };
}
/** Type guard: is this published value a lazy service handle? */
export function isLazy(value) {
    return typeof value === 'object' && value !== null && LazyTag in value;
}
/**
 * Wrap an already-available value in a pre-initialized `Lazy<T>` handle.
 * Used by the kernel to lift eager provides for `service.lazy` consumers;
 * also handy for handing fakes to lazy-consuming plugins in tests. The handle
 * has no cleanup of its own — the underlying value's lifecycle belongs to
 * whoever created it.
 */
export function lazyOf(value) {
    let disposed = false;
    return {
        [LazyTag]: true,
        get: () => disposed
            ? Promise.reject(new Error('Lazy service handle is disposed — the app has shut down.'))
            : Promise.resolve(value),
        get initialized() {
            return !disposed;
        },
        peek: () => (disposed ? undefined : value),
        async dispose() {
            disposed = true;
        },
    };
}
export function plugin(def) {
    return {
        name: def.name,
        ...(def.version === undefined ? {} : { version: def.version }),
        needs: def.needs ?? {},
        actions: def.actions ?? [],
        renames: {},
        hooks: {
            ...(def.configure === undefined ? {} : { configure: def.configure }),
            ...(def.boot === undefined ? {} : { boot: def.boot }),
            ...(def.start === undefined ? {} : { start: def.start }),
            ...(def.stop === undefined ? {} : { stop: def.stop }),
            ...(def.dispose === undefined ? {} : { dispose: def.dispose }),
        },
    };
}
/**
 * Mount-time rename. `rename(dbPlugin, { db: 'reportsDb' }, 'reports-db')`
 * publishes the same service under a different wire key, retyped
 * accordingly — the way to mount a second instance of an adapter without
 * a key collision. Renames compose: renaming an already-renamed key
 * rewrites the earlier entry.
 */
export function rename(p, map, newName) {
    const renames = { ...p.renames };
    for (const [wireKey, next] of Object.entries(map)) {
        if (typeof next !== 'string')
            continue;
        // If `wireKey` is itself the *result* of an earlier rename, rewrite that
        // entry (compose); otherwise it is a local publish key.
        const localKey = Object.entries(renames).find(([, w]) => w === wireKey)?.[0] ?? wireKey;
        renames[localKey] = next;
    }
    // Phantom-only cast: runtime fields are unchanged except `renames`/`name`;
    // only the [ProvidesSym] carrier retypes.
    return { ...p, name: newName ?? p.name, renames };
}
/**
 * Stable error thrown by DOT plugin adapters.
 *
 * Adapters MUST throw `DotPluginError` (not raw `Error`) when surfacing a
 * misconfiguration, missing-input, or other fail-fast condition. Consumers
 * and coding agents can then match on a stable `code`, follow `docsUrl`,
 * and apply `remediation` without parsing the message.
 *
 * Codes are per-adapter. Recommended prefix is `<PKG>_PLUGIN_E<NNN>` (e.g.
 * `KV_PLUGIN_E001`, `DB_PLUGIN_E001`). The kernel does not own the code
 * namespace — each adapter defines its own constants and links them in
 * its README.
 *
 * @see packages/dot/docs/principles.md — principle 1.3 ("errors are part
 * of the API") and principle 4 ("agent-discoverable everywhere").
 */
export class DotPluginError extends Error {
    /** Stable error code, e.g. `KV_PLUGIN_E001`. */
    code;
    /** One-sentence guidance on how to fix the underlying problem. */
    remediation;
    /** URL of the documentation page that explains this error. */
    docsUrl;
    constructor(args) {
        super(args.message);
        this.name = 'DotPluginError';
        this.code = args.code;
        this.remediation = args.remediation;
        this.docsUrl = args.docsUrl;
    }
}
/** Re-exported for downstream typing. */
export {} from './manifest.js';
//# sourceMappingURL=plugin-contract.js.map