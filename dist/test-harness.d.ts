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
import type { Failure } from '@arki/failure';
import type { DotAppLifecycle, ListGuard, UseAllAvail, UseAllGuard } from './define-app.js';
import type { AnyUnit, EmptyPhases, EmptyShape, Handle, InferredOwnership, Unit, UnitCloseFailure, UnitNeeds, UnitOpenFailure, UnitPhaseFailures, UnitPhases, UnitProvides, UnitSourceGuard, ProvidedValues, ServiceRecord, Token } from './unit-contract.js';
export type TestAppOptions = {
    /** App name used in the manifest. Defaults to `'test-app'`. */
    name?: string;
    /** Runtime config bag exposed to hooks as `$config`. */
    config?: Readonly<Record<string, unknown>>;
};
/**
 * What `testApp(units)` exposes as `app.services`: the services the tuple
 * accumulates, as `.infra(...)` would type them. A runtime-built array
 * (`feature.units()`) has no tuple to read, so it gets the open record.
 */
export type TestAppServices<TUnits extends readonly AnyUnit[]> = number extends TUnits['length'] ? ServiceRecord : UseAllAvail<EmptyShape, TUnits>;
/**
 * The `.infra(...)` wiring check on the argument, minus the tuple requirement:
 * a test may mount a runtime-built array and let the kernel check it at boot.
 */
type TestAppGuard<TUnits extends readonly AnyUnit[]> = number extends TUnits['length'] ? ListGuard<UnitSourceGuard<TUnits[number]>> : ListGuard<UseAllGuard<EmptyShape, TUnits>>;
/**
 * Build a DOT app builder pre-populated with the given units, ready to
 * `.configure()`, `.boot()` or `.start()` from a test. The services are read
 * off the units — `testApp([database]).boot()` gives `app.services.db` —
 * and a tuple that would not mount (a need before its provider, a wire key
 * provided twice) is a compile error on the argument.
 */
export declare function testApp<const TUnits extends readonly AnyUnit[] = readonly []>(units?: TUnits & TestAppGuard<TUnits>, options?: TestAppOptions): import("./define-app.js").DotAppBuilder<TestAppServices<TUnits>, UnitOpenFailure<TUnits[number]>, UnitCloseFailure<TUnits[number]>, UnitPhaseFailures<TUnits[number]>>;
/** Build and boot an app, returning declared ownership failures to its caller. */
export declare function bootTestApp<const TUnits extends readonly AnyUnit[] = readonly []>(units?: TUnits & TestAppGuard<TUnits>, options?: TestAppOptions): Promise<import("./define-app.js").DotApp<TestAppServices<TUnits>, UnitCloseFailure<TUnits[number]>, UnitOpenFailure<TUnits[number]>, UnitPhaseFailures<TUnits[number]>> | Failure<"async.cancelled", undefined> | Failure<"async.deadline", undefined> | Failure<"failure.unexpected_defect", undefined> | Exclude<UnitPhaseFailures<TUnits[number]>["configure"], void> | Exclude<Exclude<(TUnits[number] extends infer T_3 ? T_3 extends TUnits[number] ? T_3 extends {
    readonly factories: infer Factories;
    readonly hooks: infer Hooks;
} ? InferredOwnership<{ [Key in keyof Factories]: Factories[Key] extends infer T_4 ? T_4 extends Factories[Key] ? T_4 extends (...args: never[]) => infer Value ? Value : never : never : never; }, Hooks extends {
    readonly boot?: (...args: never[]) => infer Boot;
} ? Awaited<Boot> : never> : import("./unit-contract.js").EmptyOwnership : never : never)["close"], void>, void> | Exclude<Exclude<(TUnits[number] extends infer T_3 ? T_3 extends TUnits[number] ? T_3 extends {
    readonly factories: infer Factories;
    readonly hooks: infer Hooks;
} ? InferredOwnership<{ [Key in keyof Factories]: Factories[Key] extends infer T_4 ? T_4 extends Factories[Key] ? T_4 extends (...args: never[]) => infer Value ? Value : never : never : never; }, Hooks extends {
    readonly boot?: (...args: never[]) => infer Boot;
} ? Awaited<Boot> : never> : import("./unit-contract.js").EmptyOwnership : never : never)["open"], void>, void> | Exclude<Exclude<import("./unit-contract.js").UnitPreparation<TUnits[number]>["close"], void>, void> | Exclude<Exclude<import("./unit-contract.js").UnitPreparation<TUnits[number]>["open"], void>, void> | Exclude<Exclude<(TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never) extends infer T_5 ? T_5 extends (TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never) ? T_5 extends Record<"close", infer Callback extends (...args: never[]) => unknown> ? Extract<Awaited<ReturnType<Callback>>, Failure<string, unknown>> : never : never : never, void>, void> | Exclude<Exclude<Extract<TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never, Failure>, void>, void> | import("@arki/async").ScopeAggregate<import("@arki/async").SupervisorFailure | UnitCloseFailure<TUnits[number]> | UnitOpenFailure<TUnits[number]>, import("@arki/async").SupervisorFailure | UnitCloseFailure<TUnits[number]>> | import("@arki/async").ScopeAggregate<Exclude<(TUnits[number] extends infer T_3 ? T_3 extends TUnits[number] ? T_3 extends {
    readonly factories: infer Factories;
    readonly hooks: infer Hooks;
} ? InferredOwnership<{ [Key in keyof Factories]: Factories[Key] extends infer T_4 ? T_4 extends Factories[Key] ? T_4 extends (...args: never[]) => infer Value ? Value : never : never : never; }, Hooks extends {
    readonly boot?: (...args: never[]) => infer Boot;
} ? Awaited<Boot> : never> : import("./unit-contract.js").EmptyOwnership : never : never)["close"], void> | Exclude<(TUnits[number] extends infer T_3 ? T_3 extends TUnits[number] ? T_3 extends {
    readonly factories: infer Factories;
    readonly hooks: infer Hooks;
} ? InferredOwnership<{ [Key in keyof Factories]: Factories[Key] extends infer T_4 ? T_4 extends Factories[Key] ? T_4 extends (...args: never[]) => infer Value ? Value : never : never : never; }, Hooks extends {
    readonly boot?: (...args: never[]) => infer Boot;
} ? Awaited<Boot> : never> : import("./unit-contract.js").EmptyOwnership : never : never)["open"], void> | Exclude<import("./unit-contract.js").UnitPreparation<TUnits[number]>["close"], void> | Exclude<import("./unit-contract.js").UnitPreparation<TUnits[number]>["open"], void> | Exclude<(TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never) extends infer T_5 ? T_5 extends (TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never) ? T_5 extends Record<"close", infer Callback extends (...args: never[]) => unknown> ? Extract<Awaited<ReturnType<Callback>>, Failure<string, unknown>> : never : never : never, void> | Exclude<Extract<TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never, Failure>, void> | import("@arki/async").SupervisorFailure | import("@arki/async").ScopeAggregate<import("@arki/async").SupervisorFailure | UnitCloseFailure<TUnits[number]> | UnitOpenFailure<TUnits[number]>, import("@arki/async").SupervisorFailure | UnitCloseFailure<TUnits[number]>>, UnitPhaseFailures<TUnits[number]>["dispose"] | (Failure<"async.cancelled", undefined> | Failure<"async.deadline", undefined> | Failure<"failure.unexpected_defect", undefined> | Exclude<(TUnits[number] extends infer T_3 ? T_3 extends TUnits[number] ? T_3 extends {
    readonly factories: infer Factories;
    readonly hooks: infer Hooks;
} ? InferredOwnership<{ [Key in keyof Factories]: Factories[Key] extends infer T_4 ? T_4 extends Factories[Key] ? T_4 extends (...args: never[]) => infer Value ? Value : never : never : never; }, Hooks extends {
    readonly boot?: (...args: never[]) => infer Boot;
} ? Awaited<Boot> : never> : import("./unit-contract.js").EmptyOwnership : never : never)["close"], void> | Exclude<import("./unit-contract.js").UnitPreparation<TUnits[number]>["close"], void> | Exclude<(TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never) extends infer T_5 ? T_5 extends (TUnits[number] extends infer T_4 ? T_4 extends TUnits[number] ? T_4 extends {
    readonly logging?: (...args: never[]) => infer Result;
} ? Result : never : never : never) ? T_5 extends Record<"close", infer Callback extends (...args: never[]) => unknown> ? Extract<Awaited<ReturnType<Callback>>, Failure<string, unknown>> : never : never : never, void> | import("@arki/async").ScopeAggregate<import("@arki/async").SupervisorFailure | UnitCloseFailure<TUnits[number]>, import("@arki/async").SupervisorFailure | UnitCloseFailure<TUnits[number]>>)>>;
/**
 * `this` type for {@link TestUnitBuilder.boot}: the builder itself once every
 * need is provided, else a record naming the missing wire keys and their
 * types. A `this` parameter puts that record in the error text ("The 'this'
 * context of type … is not assignable to method's 'this' of type { 'DOT-TEST:
 * …' }"), on the `.boot()` call.
 */
type BootReady<TRemaining extends ServiceRecord, TSelf> = keyof TRemaining extends never ? TSelf : {
    readonly 'DOT-TEST: unit needs still unprovided — call .provide() for each': {
        readonly [K in keyof TRemaining]: TRemaining[K];
    };
};
/**
 * Typed unit-test builder for a single unit — see {@link testUnit}.
 *
 * `TRemaining` tracks the wire keys not yet covered by `.provide()`;
 * `TServices` accumulates what the booted app will expose (the fakes plus
 * the unit's own provides).
 */
type TestUnitLifecycle<Services extends ServiceRecord, Open extends Failure, Close extends Failure, Fakes extends ServiceRecord, Phases extends UnitPhases> = DotAppLifecycle<Services, Open | InferredOwnership<Fakes, void>['open'], Close | InferredOwnership<Fakes, void>['close'], Phases>;
export type TestUnitBuilder<TRemaining extends ServiceRecord, TServices extends ServiceRecord, TOpen extends Failure = never, TClose extends Failure = never, TFakes extends ServiceRecord = EmptyShape, TPhases extends UnitPhases = EmptyPhases> = {
    /**
     * Satisfy one need directly with a fake. Token form — the token names
     * the wire key and carries the type:
     *
     * ```ts
     * testUnit(reports).provide(Db, fakeDb)
     * ```
     */
    provide<K extends keyof TRemaining & string, T extends TRemaining[K]>(token: Token<T, K>, value: T): TestUnitBuilder<Omit<TRemaining, K>, TServices & Readonly<Record<K, T>>, TOpen, TClose, TFakes & Readonly<Record<K, T>>, TPhases>;
    /**
     * Satisfy one need directly with a fake. Key form — for anonymous
     * `service<T>()` needs, where the wire key is the property name:
     *
     * ```ts
     * testUnit(billing).provide('db', fakeDb)
     * ```
     */
    provide<K extends keyof TRemaining & string, T extends TRemaining[K]>(key: K, value: T): TestUnitBuilder<Omit<TRemaining, K>, TServices & Readonly<Record<K, T>>, TOpen, TClose, TFakes & Readonly<Record<K, T>>, TPhases>;
    /** Boot the unit against the provided fakes. Compile error until every need is provided. */
    boot(this: BootReady<TRemaining, TestUnitBuilder<TRemaining, TServices, TOpen, TClose, TFakes, TPhases>>): ReturnType<TestUnitLifecycle<TServices, TOpen, TClose, TFakes, TPhases>['boot']>;
    /** Boot + start. Same guard as {@link TestUnitBuilder.boot}. */
    start(this: BootReady<TRemaining, TestUnitBuilder<TRemaining, TServices, TOpen, TClose, TFakes, TPhases>>): ReturnType<TestUnitLifecycle<TServices, TOpen, TClose, TFakes, TPhases>['start']>;
};
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
export declare function testUnit<const P extends AnyUnit>(unit: P & ListGuard<UnitSourceGuard<P>>, options?: TestAppOptions): TestUnitBuilder<UnitNeeds<P>, UnitProvides<P>, UnitOpenFailure<P>, UnitCloseFailure<P>, EmptyShape, UnitPhaseFailures<P>>;
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
export declare function fake<T, K extends string, Value extends NoInfer<T>>(handle: Handle<T, K>, value: Value): Omit<Unit<EmptyShape, ProvidedValues<Readonly<Record<K, Value>>>, EmptyShape, string, InferredOwnership<Readonly<Record<K, Value>>, void>>, "hooks"> & {
    readonly hooks: EmptyShape;
};
export {};
//# sourceMappingURL=test-harness.d.ts.map