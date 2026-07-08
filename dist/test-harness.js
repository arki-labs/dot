/**
 * Test harness for unit-testing DOT plugins.
 *
 * Provides `testApp` — a convenience wrapper that lets plugin authors verify
 * lifecycle behaviour, registration, and service publishing without dragging
 * in concrete framework dependencies.
 *
 * NOTE: `testApp` takes an erased plugin array, so the compile-time wiring
 * guard does not apply here — the kernel's runtime validation (unsatisfied
 * needs, collisions) still does. Use `defineApp(...).use(...)` chains in
 * tests that should exercise the type-level guard.
 *
 * @example
 *   import { testApp, plugin } from '@arki/dot';
 *
 *   const myPlugin = plugin({
 *     name: 'counter',
 *     boot: () => ({ counter: { value: 0 } }),
 *   });
 *
 *   it('publishes a counter service', async () => {
 *     const app = await bootTestApp<{ counter: { value: number } }>([myPlugin]);
 *     expect(app.services.counter.value).toBe(0);
 *     await app.dispose();
 *   });
 */
import { defineApp } from './define-app.js';
/**
 * Build a DOT app builder pre-populated with the given plugins, ready to
 * `.configure()`, `.boot()` or `.start()` from a test.
 */
export function testApp(plugins = [], options = {}) {
    let builder = defineApp(options.name ?? 'test-app', { config: options.config });
    for (const p of plugins) {
        builder = builder.use(p);
    }
    return builder;
}
/**
 * Convenience: build, boot, return the running app. Caller is responsible for
 * calling `app.dispose()` when finished.
 */
export async function bootTestApp(plugins = [], options = {}) {
    return testApp(plugins, options).boot();
}
/**
 * Unit-test a single plugin with **typed overrides** — the compile-checked
 * counterpart to {@link testApp}'s erased arrays.
 *
 * Each `.provide()` satisfies one of the plugin's needs directly (no real
 * provider plugin, no dependency chain) and removes it from the builder's
 * remaining-needs type. `boot()` only compiles once every need is covered,
 * and a fake of the wrong shape fails at the `.provide()` call site:
 *
 * ```ts
 * import { testPlugin } from '@arki/dot/test-harness';
 *
 * const app = await testPlugin(catalog)
 *   .provide(Db, fakeDb)          // token need
 *   .provide('cache', fakeKv)     // anonymous need — wire key is the alias
 *   .boot();
 *
 * expect(app.services.catalog.list()).toEqual([]);
 * await app.dispose();
 * ```
 *
 * `service.lazy<T>()` needs accept either a plain `T` fake (the kernel
 * lifts it) or a `Lazy<T>` handle (`lazyOf(value)` is handy here).
 * Lifecycle semantics are the real kernel's — the fakes are published by a
 * synthetic first plugin, so reverse-order teardown and lazy auto-dispose
 * behave exactly as in production.
 */
export function testPlugin(plugin, options = {}) {
    // Erasure seam — same boundary as `makeBuilder` in define-app.ts: the
    // runtime impl is untyped, the type parameters do all the guarding.
    return makeTestPluginBuilder({ plugin: plugin, fakes: {}, options });
}
/**
 * Erased implementation behind {@link testPlugin}. Mirrors `makeBuilder` in
 * `define-app.ts`: the runtime is untyped, the single cast at the return
 * is the seam, and the type parameters do all the guarding.
 */
function makeTestPluginBuilder(state) {
    const bootApp = async () => {
        const plugins = [];
        if (Object.keys(state.fakes).length > 0) {
            const fakes = { ...state.fakes };
            plugins.push({
                name: `test:fakes(${state.plugin.name})`,
                needs: {},
                actions: [],
                renames: {},
                hooks: { boot: () => fakes },
            });
        }
        plugins.push(state.plugin);
        return testApp(plugins, {
            name: state.options.name ?? `test:${state.plugin.name}`,
            ...(state.options.config === undefined ? {} : { config: state.options.config }),
        }).boot();
    };
    const impl = {
        provide(tokenOrKey, value) {
            const key = typeof tokenOrKey === 'string' ? tokenOrKey : tokenOrKey.key;
            return makeTestPluginBuilder({ ...state, fakes: { ...state.fakes, [key]: value } });
        },
        async boot(..._guard) {
            return bootApp();
        },
        async start(..._guard) {
            const app = await bootApp();
            await app.start();
            return app;
        },
    };
    return impl;
}
//# sourceMappingURL=test-harness.js.map