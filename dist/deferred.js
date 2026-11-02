/** `Deferred<T>` and `resolveDeferred`: adapter options given now or as a thunk the adapter calls at boot. */
/** Resolve a {@link Deferred}: call it if it is a thunk, return it otherwise. */
export function resolveDeferred(value) {
    return typeof value === 'function' ? value() : value;
}
//# sourceMappingURL=deferred.js.map