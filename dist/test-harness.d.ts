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
import type { AnyPip, EmptyShape, ServiceRecord } from './pip-contract.js';
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
//# sourceMappingURL=test-harness.d.ts.map