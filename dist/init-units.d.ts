import type { ScopePlan } from '@arki/async';
import type { Failure } from '@arki/failure';
import type { ActionSource, AuthoredUnit, BootGuard, CheckedProvider, CtxOf, DotLoggingHandle, EmptyHookReturns, EmptyShape, HookReturns, InferredPhases, KernelCtx, LoggingSlot, NeedsShape, NoReservedKeys, PhaseHooks, ProvidedValues, Service, ServiceRecord, WireNeeds } from './unit-contract.js';
type MaybePromise<T> = T | Promise<T>;
type ServiceKey<TServices extends object> = Extract<keyof TServices, string>;
type ServiceKeys<TServices extends object> = readonly ServiceKey<TServices>[];
type PickServices<TServices extends object, TKeys extends ServiceKeys<TServices>> = {
    readonly [K in TKeys[number]]: TServices[K];
};
type WitnessesFor<TServices extends object, TKeys extends ServiceKeys<TServices>> = {
    readonly [K in TKeys[number]]: Service<TServices[K]>;
};
type SchemaCheckedProvides<TServices extends object, TProvides extends ServiceRecord> = {
    readonly [K in keyof TProvides]: K extends keyof TServices ? ProvidedValues<TProvides>[K] extends TServices[K] ? TProvides[K] : never : TProvides[K];
};
/** One factory per published key, each checked against the context's service schema. */
type CheckedFactories<TCtx, TServices extends object, TProvides extends ServiceRecord> = {
    readonly [K in keyof TProvides]: (ctx: TCtx & KernelCtx) => TProvides[K] & SchemaCheckedProvides<TServices, NoInfer<TProvides>>[K] & CheckedProvider<NoInfer<TProvides[K]>>;
};
type CommonUnitDefinition = {
    readonly name: string;
    readonly actions?: readonly ActionSource[];
};
type KeyArrayUnitDefinition<TServices extends object, TKeys extends ServiceKeys<TServices>, TProvides extends ServiceRecord & NoReservedKeys, TBoot extends undefined | ScopePlan | Failure = undefined, TReturns extends HookReturns = EmptyHookReturns, TLogging extends DotLoggingHandle | Failure = DotLoggingHandle<undefined>> = CommonUnitDefinition & LoggingSlot<TLogging> & PhaseHooks<PickServices<TServices, TKeys> & ProvidedValues<NoInfer<TProvides>> & KernelCtx, TReturns> & {
    readonly needs?: TKeys;
    readonly provides?: CheckedFactories<PickServices<TServices, TKeys>, TServices, TProvides>;
    readonly boot?: (ctx: PickServices<TServices, TKeys> & ProvidedValues<NoInfer<TProvides>> & KernelCtx) => MaybePromise<TBoot>;
};
type WitnessUnitDefinition<TServices extends object, TShape extends NeedsShape & NoReservedKeys, TProvides extends ServiceRecord & NoReservedKeys, TBoot extends undefined | ScopePlan | Failure = undefined, TReturns extends HookReturns = EmptyHookReturns, TLogging extends DotLoggingHandle | Failure = DotLoggingHandle<undefined>> = CommonUnitDefinition & LoggingSlot<TLogging> & PhaseHooks<CtxOf<TShape> & ProvidedValues<NoInfer<TProvides>> & KernelCtx, TReturns> & {
    readonly needs: TShape;
    readonly provides?: CheckedFactories<CtxOf<TShape>, TServices, TProvides>;
    readonly boot?: (ctx: CtxOf<TShape> & ProvidedValues<NoInfer<TProvides>> & KernelCtx) => MaybePromise<TBoot>;
};
export type InitUnitsFactory<TServices extends object> = ReturnType<typeof createUnitFactory<TServices>>;
declare function createUnitFactory<TServices extends object>(): {
    infra: {
        <const TKeys extends ServiceKeys<TServices> = readonly [], TProvides extends ServiceRecord & NoReservedKeys = EmptyShape, TBoot extends undefined = undefined>(def: KeyArrayUnitDefinition<TServices, TKeys, TProvides, undefined, EmptyHookReturns, DotLoggingHandle<undefined>>, ...guard: BootGuard<NoInfer<TBoot>>): AuthoredUnit<PickServices<TServices, TKeys>, ProvidedValues<TProvides>, WitnessesFor<TServices, TKeys>, string, TProvides, InferredPhases<EmptyHookReturns>, DotLoggingHandle<undefined>, TBoot>;
        <const TKeys extends ServiceKeys<TServices> = readonly [], TProvides extends ServiceRecord & NoReservedKeys = EmptyShape, TBoot extends undefined | ScopePlan | Failure = undefined, TConfigure extends undefined | Failure = undefined, TStart extends undefined | Failure = undefined, TStop extends undefined | Failure = undefined, TDispose extends undefined | Failure = undefined, TLogging extends DotLoggingHandle | Failure = DotLoggingHandle<undefined>>(def: KeyArrayUnitDefinition<TServices, TKeys, TProvides, TBoot, {
            configure: TConfigure;
            start: TStart;
            stop: TStop;
            dispose: TDispose;
        }, TLogging>, ...guard: BootGuard<NoInfer<TBoot>>): AuthoredUnit<PickServices<TServices, TKeys>, ProvidedValues<TProvides>, WitnessesFor<TServices, TKeys>, string, TProvides, InferredPhases<{
            configure: TConfigure;
            start: TStart;
            stop: TStop;
            dispose: TDispose;
        }>, TLogging, TBoot>;
        <TShape extends NeedsShape & NoReservedKeys, TProvides extends ServiceRecord & NoReservedKeys = EmptyShape, TBoot extends undefined = undefined>(def: WitnessUnitDefinition<TServices, TShape, TProvides, undefined, EmptyHookReturns, DotLoggingHandle<undefined>>, ...guard: BootGuard<NoInfer<TBoot>>): AuthoredUnit<WireNeeds<TShape>, ProvidedValues<TProvides>, TShape, string, TProvides, InferredPhases<EmptyHookReturns>, DotLoggingHandle<undefined>, TBoot>;
        <TShape extends NeedsShape & NoReservedKeys, TProvides extends ServiceRecord & NoReservedKeys = EmptyShape, TBoot extends undefined | ScopePlan | Failure = undefined, TConfigure extends undefined | Failure = undefined, TStart extends undefined | Failure = undefined, TStop extends undefined | Failure = undefined, TDispose extends undefined | Failure = undefined, TLogging extends DotLoggingHandle | Failure = DotLoggingHandle<undefined>>(def: WitnessUnitDefinition<TServices, TShape, TProvides, TBoot, {
            configure: TConfigure;
            start: TStart;
            stop: TStop;
            dispose: TDispose;
        }, TLogging>, ...guard: BootGuard<NoInfer<TBoot>>): AuthoredUnit<WireNeeds<TShape>, ProvidedValues<TProvides>, TShape, string, TProvides, InferredPhases<{
            configure: TConfigure;
            start: TStart;
            stop: TStop;
            dispose: TDispose;
        }>, TLogging, TBoot>;
    };
    needs: <const TKeys extends ServiceKeys<TServices>>(...keys: TKeys) => WitnessesFor<TServices, TKeys>;
};
export declare const initUnits: {
    context<TServices extends object>(): {
        create(): InitUnitsFactory<TServices>;
    };
};
export {};
//# sourceMappingURL=init-units.d.ts.map