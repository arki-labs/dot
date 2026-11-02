/** The execution boundary for callable usecases, independent of telemetry. */
import { UnexpectedDefect } from '@arki/failure';
/**
 * Invoke the Promise intrinsic as the native brand check, including foreign realms.
 * It never reads an object's own `then`, so deferred query builders stay untouched.
 */
export function chainNativePromise(value, fulfilled, rejected) {
    if (typeof value !== 'object' || value === null)
        return undefined;
    try {
        return Promise.prototype.then.call(value, fulfilled, rejected);
    }
    catch {
        // The intrinsic rejects receivers without native Promise internal slots.
        return undefined;
    }
}
export function superviseUsecase(usecase) {
    if (typeof usecase !== 'function')
        return usecase;
    const call = usecase;
    function supervised(...args) {
        try {
            const result = Reflect.apply(call, this, args);
            return (chainNativePromise(result, value => value, error => UnexpectedDefect({ cause: error })) ?? result);
        }
        catch (error) {
            return UnexpectedDefect({ cause: error });
        }
    }
    return Object.defineProperties(supervised, Object.getOwnPropertyDescriptors(usecase));
}
//# sourceMappingURL=usecase.js.map