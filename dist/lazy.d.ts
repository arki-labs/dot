/** Lazy service ownership with typed initialization and cleanup outcomes. */
import type { Failure, SuccessOf } from '@arki/failure';
/**
 * An operation tried to initialize a service after its owner closed admission.
 * @fix Use the handle only while its owning application is running.
 * @verify bun run test -- src/tests/lazy-handle.test.ts
 */
export declare const LazyClosed: import("@arki/failure").FailureDefinition<"dot.lazy_closed", undefined>;
/** Runtime identity shared by lazy providers and the kernel's ownership checks. */
export declare const LazyTag: unique symbol;
type TypedOutput<Value> = unknown extends Awaited<Value> ? never : unknown;
type Initializer<Value> = () => Value | PromiseLike<Value>;
type LazyOptions<Value, Cleanup> = {
    readonly dispose?: ((value: SuccessOf<() => Value>) => Cleanup | PromiseLike<Cleanup>) & TypedOutput<Cleanup>;
};
declare function createLazy<Value, Cleanup>(init: Initializer<Value>, options: LazyOptions<Value, Cleanup>): {
    [LazyTag]: true;
    get: () => Promise<(Value | Failure<"failure.unexpected_defect", undefined>) | ReturnType<typeof LazyClosed>>;
    readonly initialized: boolean;
    peek(): SuccessOf<() => Value> | undefined;
    dispose(): Promise<Failure<"failure.unexpected_defect", undefined> | Extract<Awaited<Awaited<Cleanup>>, Failure<string, unknown>> | Extract<Awaited<Awaited<Value>>, Failure<string, unknown>> | undefined>;
};
/**
 * Own a service initialized on first use. Concurrent gets share an attempt;
 * returned failures and defects are retried only by a later get. Cleanup receives
 * successful services only. Disposal closes admission immediately, waits for a
 * pending attempt, and caches its complete typed outcome.
 *
 * @example
 * const db = lazy(() => openDb(), { dispose: value => value.close() });
 * const value = await db.get();
 * if (isFailure(value)) return value;
 * return value.query();
 */
export declare function lazy<Value, Cleanup = void>(init: Initializer<Value> & TypedOutput<Value>, options?: LazyOptions<Value, Cleanup>): {
    [LazyTag]: true;
    get: () => Promise<Value | Failure<"dot.lazy_closed", undefined> | Failure<"failure.unexpected_defect", undefined>>;
    readonly initialized: boolean;
    peek(): Exclude<Awaited<Value>, Failure<string, unknown>> | undefined;
    dispose(): Promise<Failure<"failure.unexpected_defect", undefined> | Extract<Awaited<Awaited<Cleanup>>, Failure<string, unknown>> | Extract<Awaited<Awaited<Value>>, Failure<string, unknown>> | undefined>;
};
/**
 * A service handle derived from its callback outputs. `Lazy<T>` includes the
 * canonical closed/defect outcomes; providers with other declared failures keep
 * their inferred handle type, or supply their original callback output types.
 */
export type Lazy<Value, Cleanup = void> = ReturnType<typeof lazy<Value, Cleanup>>;
/** An erased published service may return any canonical failure during cleanup. */
type PublishedLazy = ReturnType<typeof createLazy<unknown, Failure>>;
/** Detect a published lazy handle without claiming its cleanup is infallible. */
export declare function isLazy(value: unknown): value is PublishedLazy;
/**
 * Borrow an already available service without initializing or owning it.
 * A failure is returned by get and is never marked initialized.
 *
 * @example
 * const db = lazyOf(fakeDatabase);
 * const value = db.peek(); // The already available fake; no initialization.
 */
export declare function lazyOf<Value>(value: Awaited<Value>): {
    [LazyTag]: true;
    get(): Promise<Failure<"dot.lazy_closed", undefined> | Awaited<Awaited<Value>>>;
    readonly initialized: boolean;
    peek(): Exclude<Awaited<Value>, Failure> | undefined;
    dispose(): Promise<undefined>;
};
export {};
//# sourceMappingURL=lazy.d.ts.map