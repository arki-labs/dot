/** The execution boundary for callable usecases, independent of telemetry. */
import { UnexpectedDefect } from '@arki/failure';
/** A native promise can reject; an ordinary value (including a lazy thenable) stays plain. */
export type UsecaseOutcome<Value> = (Value extends Promise<infer Settled> ? Promise<Settled | ReturnType<typeof UnexpectedDefect>> : Value) | ReturnType<typeof UnexpectedDefect>;
/**
 * Preserve a usecase's parameters, receiver and properties while exposing owned defects.
 * Generic dependent return types and overload sets cannot be mapped by TypeScript;
 * unsupported signatures become `never` so their lost relationship is a compile error.
 */
export type SupervisedUsecase<Usecase> = Usecase extends (this: infer Receiver, ...args: infer Args) => infer Value ? ((this: Receiver, ...args: Args) => Value) & Pick<Usecase, keyof Usecase> extends Usecase ? ((this: Receiver, ...args: Args) => UsecaseOutcome<Value>) & Pick<Usecase, keyof Usecase> : never : Usecase;
/** A usecase service record with a supervised invocation signature at every callable slot. */
export type SupervisedUsecases<Usecases> = {
    [Key in keyof Usecases]: SupervisedUsecase<Usecases[Key]>;
};
/**
 * Invoke the Promise intrinsic as the native brand check, including foreign realms.
 * It never reads an object's own `then`, so deferred query builders stay untouched.
 */
export declare function chainNativePromise(value: unknown, fulfilled: (value: unknown) => unknown, rejected: (error: unknown) => unknown): Promise<unknown> | undefined;
/**
 * Contain unknown throws and native promise rejections as private canonical defects.
 * Factory construction belongs to the feature owner and must be supervised separately.
 *
 * @example
 * const find = superviseUsecase((id: string) => store.find(id));
 */
export declare function superviseUsecase<Usecase>(usecase: Usecase & (SupervisedUsecase<Usecase> extends never ? never : unknown)): SupervisedUsecase<Usecase>;
//# sourceMappingURL=usecase.d.ts.map