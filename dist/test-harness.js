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
import { defineApp } from './define-app.js';
/**
 * Build a DOT app builder pre-populated with the given pips, ready to
 * `.configure()`, `.boot()` or `.start()` from a test.
 */
export function testApp(
// Accept any pip shape — tests routinely mix services types. Internally
// we erase to `AnyDotPip` for the kernel.
pips = [], options = {}) {
    let builder = defineApp(options.name ?? 'test-app', { config: options.config });
    for (const pip of pips) {
        builder = builder.use(pip);
    }
    return builder;
}
/**
 * Convenience: build, boot, return the running app. Caller is responsible for
 * calling `app.dispose()` when finished.
 */
export async function bootTestApp(pips = [], options = {}) {
    return testApp(pips, options).boot();
}
//# sourceMappingURL=test-harness.js.map