import type { CtxOf, DotConfigureContext, EmptyShape, InferredProvides, KernelCtx, NeedsShape, NoReservedKeys, Pip, ActionSource, Service, ServiceRecord, WireNeeds } from './pip-contract.js';
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
    readonly [K in keyof TProvides]: K extends keyof TServices ? TProvides[K] extends TServices[K] ? TProvides[K] : never : TProvides[K];
};
type CommonPipDefinition = {
    readonly name: string;
    readonly version?: string;
    readonly actions?: readonly ActionSource[];
    readonly configure?: (ctx: DotConfigureContext) => void;
};
type KeyArrayPipDefinition<TServices extends object, TKeys extends ServiceKeys<TServices>, TProvides extends ServiceRecord & NoReservedKeys> = CommonPipDefinition & {
    readonly needs?: TKeys;
    readonly boot?: (ctx: PickServices<TServices, TKeys> & KernelCtx) => MaybePromise<SchemaCheckedProvides<TServices, TProvides> | void>;
    readonly start?: (ctx: PickServices<TServices, TKeys> & TProvides & KernelCtx) => MaybePromise<void>;
    readonly stop?: (ctx: PickServices<TServices, TKeys> & TProvides & KernelCtx) => MaybePromise<void>;
    readonly dispose?: (ctx: PickServices<TServices, TKeys> & TProvides & KernelCtx) => MaybePromise<void>;
};
type WitnessPipDefinition<TServices extends object, TShape extends NeedsShape & NoReservedKeys, TProvides extends ServiceRecord & NoReservedKeys> = CommonPipDefinition & {
    readonly needs: TShape;
    readonly boot?: (ctx: CtxOf<TShape> & KernelCtx) => MaybePromise<SchemaCheckedProvides<TServices, TProvides> | void>;
    readonly start?: (ctx: CtxOf<TShape> & TProvides & KernelCtx) => MaybePromise<void>;
    readonly stop?: (ctx: CtxOf<TShape> & TProvides & KernelCtx) => MaybePromise<void>;
    readonly dispose?: (ctx: CtxOf<TShape> & TProvides & KernelCtx) => MaybePromise<void>;
};
export type InitPipsFactory<TServices extends object> = {
    pip<const TKeys extends ServiceKeys<TServices> = readonly [], TProvides extends ServiceRecord & NoReservedKeys = EmptyShape>(def: KeyArrayPipDefinition<TServices, TKeys, TProvides>): Pip<PickServices<TServices, TKeys>, InferredProvides<TProvides>>;
    pip<TShape extends NeedsShape & NoReservedKeys, TProvides extends ServiceRecord & NoReservedKeys = EmptyShape>(def: WitnessPipDefinition<TServices, TShape, TProvides>): Pip<WireNeeds<TShape>, InferredProvides<TProvides>>;
    needs<const TKeys extends ServiceKeys<TServices>>(...keys: TKeys): WitnessesFor<TServices, TKeys>;
};
export declare const initPips: {
    context<TServices extends object>(): {
        create(): InitPipsFactory<TServices>;
    };
};
export {};
//# sourceMappingURL=init-pips.d.ts.map