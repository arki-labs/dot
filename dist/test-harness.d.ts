/**
 * Test harness for unit-testing DOT pips.
 *
 * Provides `testApp` — a convenience wrapper that lets pip authors verify
 * lifecycle behaviour, registration, and service publishing without dragging
 * in concrete framework dependencies.
 *
 * NOTE: `testApp` takes an erased pip array, so the compile-time wiring
 * guard does not apply here — the kernel's runtime validation (unsatisfied
 * needs, collisions) still does. Use `defineApp(...).use(...)` chains in
 * tests that should exercise the type-level guard.
 *
 * @example
 *   import { testApp, pip } from '@arki/dot';
 *
 *   const myPip = pip({
 *     name: 'counter',
 *     boot: () => ({ counter: { value: 0 } }),
 *   });
 *
 *   it('publishes a counter service', async () => {
 *     const app = await bootTestApp<{ counter: { value: number } }>([myPip]);
 *     expect(app.services.counter.value).toBe(0);
 *     await app.dispose();
 *   });
 */
import type { DotApp, DotAppBuilder } from './define-app.js';
import type { AnyPip, EmptyShape, Pip, ServiceRecord, Token } from './pip-contract.js';
export type TestAppOptions = {
    /** App name used in the manifest. Defaults to `'test-app'`. */
    name?: string;
    /** Runtime config bag exposed to hooks as `$config`. */
    config?: Readonly<Record<string, unknown>>;
};
/**
 * Build a DOT app builder pre-populated with the given pips, ready to
 * `.configure()`, `.boot()` or `.start()` from a test.
 */
export declare function testApp<TServices extends ServiceRecord = EmptyShape>(pips?: readonly AnyPip[], options?: TestAppOptions): DotAppBuilder<TServices>;
/**
 * Convenience: build, boot, return the running app. Caller is responsible for
 * calling `app.dispose()` when finished.
 */
export declare function bootTestApp<TServices extends ServiceRecord = EmptyShape>(pips?: readonly AnyPip[], options?: TestAppOptions): Promise<DotApp<TServices>>;
/**
 * Rest-tuple guard for {@link TestPipBuilder.boot} — the same trick the app
 * builder's `UseGuard` uses. While any need is still unprovided, `boot()`
 * demands an impossible second argument, so the call site fails with
 * "Expected 2 arguments, but got 1" and the error payload names the
 * missing wire keys and their types.
 */
type TestPipBootGuard<TRemaining extends ServiceRecord> = keyof TRemaining extends never ? readonly [] : readonly [
    needs: {
        readonly 'DOT-TEST: pip needs still unprovided — call .provide() for each': {
            readonly [K in keyof TRemaining]: TRemaining[K];
        };
    }
];
/**
 * Typed unit-test builder for a single pip — see {@link testPip}.
 *
 * `TRemaining` tracks the wire keys not yet covered by `.provide()`;
 * `TServices` accumulates what the booted app will expose (the fakes plus
 * the pip's own provides).
 */
export type TestPipBuilder<TRemaining extends ServiceRecord, TServices extends ServiceRecord> = {
    /**
     * Satisfy one need directly with a fake. Token form — the token names
     * the wire key and carries the type:
     *
     * ```ts
     * testPip(reports).provide(Db, fakeDb)
     * ```
     */
    provide<K extends keyof TRemaining & string, T extends TRemaining[K]>(token: Token<T, K>, value: T): TestPipBuilder<Omit<TRemaining, K>, TServices & Readonly<Record<K, T>>>;
    /**
     * Satisfy one need directly with a fake. Key form — for anonymous
     * `service<T>()` needs, where the wire key is the property name:
     *
     * ```ts
     * testPip(billing).provide('db', fakeDb)
     * ```
     */
    provide<K extends keyof TRemaining & string>(key: K, value: TRemaining[K]): TestPipBuilder<Omit<TRemaining, K>, TServices & Readonly<Record<K, TRemaining[K]>>>;
    /** Boot the pip against the provided fakes. Compile error until every need is provided. */
    boot(...guard: TestPipBootGuard<TRemaining>): Promise<DotApp<TServices>>;
    /** Boot + start. Same guard as {@link TestPipBuilder.boot}. */
    start(...guard: TestPipBootGuard<TRemaining>): Promise<DotApp<TServices>>;
};
/**
 * Unit-test a single pip with **typed overrides** — the compile-checked
 * counterpart to {@link testApp}'s erased arrays.
 *
 * Each `.provide()` satisfies one of the pip's needs directly (no real
 * provider pip, no dependency chain) and removes it from the builder's
 * remaining-needs type. `boot()` only compiles once every need is covered,
 * and a fake of the wrong shape fails at the `.provide()` call site:
 *
 * ```ts
 * import { testPip } from '@arki/dot/test-harness';
 *
 * const app = await testPip(catalog)
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
 * synthetic first pip, so reverse-order teardown and lazy auto-dispose
 * behave exactly as in production.
 */
export declare function testPip<TNeeds extends ServiceRecord, TProvides extends ServiceRecord>(pip: Pip<TNeeds, TProvides>, options?: TestAppOptions): TestPipBuilder<TNeeds, TProvides>;
export {};
//# sourceMappingURL=test-harness.d.ts.map