import { defineFailure, isFailure, UnexpectedDefect } from '@arki/failure';
/**
 * An operation tried to initialize a service after its owner closed admission.
 * @fix Use the handle only while its owning application is running.
 * @verify bun run test -- src/tests/lazy-handle.test.ts
 */
export const LazyClosed = defineFailure('dot.lazy_closed', {
    status: 503,
    message: 'The lazy service handle is closed.',
    remediation: 'Use the handle only while its owning application is running.',
});
/** Runtime identity shared by lazy providers and the kernel's ownership checks. */
export const LazyTag = Symbol('dot.lazy');
function succeeded(value) {
    return !isFailure(value);
}
// The public authoring boundaries reject untyped outputs. This private guard
// retains the declared callback failure union after the callback has settled.
function failed(value) {
    return isFailure(value);
}
function createLazy(init, options) {
    let closed = false;
    let ready;
    let pending;
    let disposing;
    async function initialize() {
        try {
            const result = await init();
            if (succeeded(result))
                ready = { value: result };
            return result;
        }
        catch (error) {
            return UnexpectedDefect({ cause: error });
        }
    }
    function get() {
        if (closed)
            return Promise.resolve(LazyClosed());
        if (ready !== undefined)
            return Promise.resolve(ready.value);
        if (pending !== undefined)
            return pending;
        pending = Promise.resolve()
            .then(initialize)
            .finally(() => {
            pending = undefined;
        });
        return pending;
    }
    async function dispose() {
        if (pending !== undefined) {
            const initialized = await pending;
            if (failed(initialized))
                return initialized;
        }
        const current = ready;
        ready = undefined;
        if (current === undefined)
            return;
        try {
            const result = await options.dispose?.(current.value);
            if (failed(result))
                return result;
        }
        catch (error) {
            return UnexpectedDefect({ cause: error });
        }
        return;
    }
    return {
        [LazyTag]: true,
        get,
        get initialized() {
            return !closed && ready !== undefined;
        },
        peek() {
            return closed ? undefined : ready?.value;
        },
        dispose() {
            if (disposing !== undefined)
                return disposing;
            // Close admission before awaiting initialization. Its pending refusal is
            // part of this disposal; every caller observes the same complete result.
            closed = true;
            disposing = Promise.resolve().then(dispose);
            return disposing;
        },
    };
}
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
export function lazy(init, options = {}) {
    return createLazy(init, options);
}
/** Detect a published lazy handle without claiming its cleanup is infallible. */
export function isLazy(value) {
    return typeof value === 'object' && value !== null && LazyTag in value && value[LazyTag] === true;
}
/**
 * Borrow an already available service without initializing or owning it.
 * A failure is returned by get and is never marked initialized.
 *
 * @example
 * const db = lazyOf(fakeDatabase);
 * const value = db.peek(); // The already available fake; no initialization.
 */
export function lazyOf(value) {
    let closed = false;
    return {
        [LazyTag]: true,
        get() {
            return Promise.resolve(closed ? LazyClosed() : value);
        },
        get initialized() {
            return !closed && succeeded(value);
        },
        peek() {
            return !closed && succeeded(value) ? value : undefined;
        },
        dispose() {
            closed = true;
            // The explicit value keeps Promise<undefined> compatible with owned Lazy disposal.
            // eslint-disable-next-line unicorn/no-useless-undefined
            return Promise.resolve(undefined);
        },
    };
}
//# sourceMappingURL=lazy.js.map