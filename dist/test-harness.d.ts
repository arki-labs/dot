/**
 * Test harness for unit-testing DOT pips.
 *
 * Provides `testApp` — a convenience wrapper that lets pip authors verify
 * lifecycle behaviour, registration, and service publishing without dragging
 * in concrete framework dependencies.
 *
 * @example
 *   import { testApp, defineDotPip } from '@arki/dot';
 *
 *   const myPip = defineDotPip<{ counter: { value: number } }>({
 *     name: 'counter',
 *     async boot() {
 *       return { services: { counter: { value: 0 } } };
 *     },
 *   });
 *
 *   it('publishes a counter service', async () => {
 *     const app = await testApp([myPip]).boot();
 *     expect(app.services.counter.value).toBe(0);
 *     await app.dispose();
 *   });
 */
import type { DotApp, DotAppBuilder } from './define-app.js';
import type { AnyDotPip, DotPip } from './pip-contract.js';
export type TestAppOptions = {
    /** App name used in the manifest. Defaults to `'test-app'`. */
    name?: string;
    /** Runtime config bag passed to every boot hook. */
    config?: Readonly<Record<string, unknown>>;
};
/**
 * Build a DOT app builder pre-populated with the given pips, ready to
 * `.configure()`, `.boot()` or `.start()` from a test.
 */
export declare function testApp<TServices extends Record<string, unknown> = Record<string, never>>(pips?: readonly DotPip<never>[] | readonly DotPip<Record<string, never>>[] | readonly AnyDotPip[], options?: TestAppOptions): DotAppBuilder<TServices>;
/**
 * Convenience: build, boot, return the running app. Caller is responsible for
 * calling `app.dispose()` when finished.
 */
export declare function bootTestApp<TServices extends Record<string, unknown> = Record<string, never>>(pips?: readonly DotPip<never>[] | readonly DotPip<Record<string, never>>[] | readonly AnyDotPip[], options?: TestAppOptions): Promise<DotApp<TServices>>;
//# sourceMappingURL=test-harness.d.ts.map