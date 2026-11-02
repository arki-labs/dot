/**
 * Test builders that boot units against fakes: `testUnit`, `testApp` and `bootTestApp`.
 *
 * Provides `testApp` — a convenience wrapper that lets unit authors verify
 * lifecycle behaviour, registration, and service publishing without dragging
 * in concrete framework dependencies.
 *
 * Tuples use the compile-time wiring guard. Runtime-built arrays use the
 * kernel's validation of missing needs and collisions at boot.
 *
 * @example
 *   import { bootTestApp, infra } from '@arki/dot';
 *   import { orThrow } from '@arki/failure';
 *
 *   const myUnit = infra({
 *     name: 'counter',
 *     provides: { counter: () => ({ value: 0 }) },
 *   });
 *
 *   it('publishes a counter service', async () => {
 *     const app = orThrow(await bootTestApp([myUnit])); // app.services typed from the units
 *     expect(app.services.counter.value).toBe(0);
 *     await app.dispose();
 *   });
 */
import { mountUnits } from './define-app.js';
import { createUnitRuntime, handleOf } from './unit-contract.js';
function runtimeUnits(units) {
    return units;
}
function runtimeUnit(unit) {
    return unit;
}
/**
 * Build a DOT app builder pre-populated with the given units, ready to
 * `.configure()`, `.boot()` or `.start()` from a test. The services are read
 * off the units — `testApp([database]).boot()` gives `app.services.db` —
 * and a tuple that would not mount (a need before its provider, a wire key
 * provided twice) is a compile error on the argument.
 */
export function testApp(units, options = {}) {
    return mountUnits(options.name ?? 'test-app', runtimeUnits(units ?? []), { config: options.config });
}
/** Build and boot an app, returning declared ownership failures to its caller. */
export function bootTestApp(units, options = {}) {
    return testApp(units, options).boot();
}
/**
 * Unit-test a single unit with **typed overrides** — the compile-checked
 * counterpart to {@link testApp}'s erased arrays.
 *
 * Each `.provide()` satisfies one of the unit's needs directly (no real
 * provider unit, no dependency chain) and removes it from the builder's
 * remaining-needs type. `boot()` only compiles once every need is covered,
 * and a fake of the wrong shape fails at the `.provide()` call site:
 *
 * ```ts
 * import { testUnit } from '@arki/dot/test-harness';
 * import { orThrow } from '@arki/failure';
 *
 * const app = orThrow(await testUnit(catalog)
 *   .provide(Db, fakeDb)          // token need
 *   .provide('cache', fakeKv)     // anonymous need — wire key is the alias
 *   .boot());
 *
 * expect(app.services.catalog.list()).toEqual([]);
 * await app.dispose();
 * ```
 *
 * `service.lazy<T>()` needs accept either a plain `T` fake (the kernel
 * lifts it) or a `Lazy<T>` handle (`lazyOf(value)` is handy here).
 * Lifecycle semantics are the real kernel's — the fakes are published by a
 * synthetic first unit, so reverse-order teardown and lazy auto-dispose
 * behave exactly as in production.
 */
export function testUnit(unit, options = {}) {
    return makeTestUnitBuilder({
        plugin: runtimeUnit(unit),
        fakes: {},
        options,
    });
}
/** The factories return their original fake values; only their computed key record is remapped. */
function fakeUnit(name, fakes) {
    const entries = Object.entries(fakes);
    const factories = Object.fromEntries(entries.map(([key, value]) => [key, () => value]));
    return {
        name,
        needs: {},
        actions: [],
        renames: {},
        provides: Object.fromEntries(entries.map(([key]) => [key, handleOf(key, name)])),
        factories,
        runtime: createUnitRuntime(),
        hooks: {},
    };
}
/** Generic state keeps closed operations typed while fakes accumulate by wire key. */
function makeTestUnitBuilder(state) {
    const appBuilder = () => {
        const units = [];
        if (Object.keys(state.fakes).length > 0)
            units.push(fakeUnit(`test:fakes(${state.plugin.name})`, state.fakes));
        units.push(state.plugin);
        return mountUnits(state.options.name ?? `test:${state.plugin.name}`, units, { config: state.options.config });
    };
    function provide(tokenOrKey, value) {
        const key = typeof tokenOrKey === 'string' ? tokenOrKey : tokenOrKey.key;
        // Computed-key construction preserves the same key and value supplied by provide().
        const fakes = { ...state.fakes, [key]: value };
        return makeTestUnitBuilder({
            ...state,
            fakes,
        });
    }
    return {
        provide,
        boot: () => appBuilder().boot(),
        start: () => appBuilder().start(),
    };
}
/**
 * A unit that provides one fake under a real handle's wire key — for
 * app-level tests that mount the real features against fakes:
 *
 * ```ts
 * defineApp('test').infra(fake(database.provides.db, db)).features([...features])
 * ```
 *
 * The fake is type-checked against the handle: a wrong-shaped value fails
 * at the call site. The unit is named `fake:<key>`.
 */
export function fake(handle, value) {
    // Erasure seam: the factory record is built under `handle.key` at
    // runtime; its type is exactly `{ [handle.key]: Value }`.
    const fakes = { [handle.key]: value };
    return fakeUnit(`fake:${handle.key}`, fakes);
}
//# sourceMappingURL=test-harness.js.map