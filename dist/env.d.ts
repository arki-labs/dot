/**
 * Env adapter for Dot (`@arki/dot/env`), built on `@arki/env`.
 *
 * Wraps `defineEnv()` as a DOT unit so a DOT app validates its
 * environment at boot. The `env` factory builds the env and forces
 * validation right there, so a bad config stops `boot()` with
 * `ARKI_ENV_UNIT_E001` instead of failing on the first request.
 * `configure` only registers metadata, so `dot explain` needs no secrets.
 *
 * @example
 * ```ts
 * import { defineApp } from '@arki/dot';
 * import { env } from '@arki/dot/env';
 * import { z } from 'zod';
 *
 * const app = await defineApp('pizzeria')
 *   .infra(env({ schema: { PORT: z.coerce.number().default(3000) } }))
 *   .boot();
 *
 * console.log(app.services.env.PORT); // number, typed.
 * ```
 *
 * To mount a second env scope in the same app, rename the published wire
 * key at the mount site:
 *
 * ```ts
 * import { rename } from '@arki/dot';
 *
 * .infra(env({ schema: appSchema }))
 * .infra(rename(env({ schema: publicSchema }), { env: 'publicEnv' }, 'public-env'))
 * ```
 *
 * `@arki/dot` depends on `@arki/env`, so this adapter needs no extra install. Importing
 * this adapter without `@arki/dot` installed will fail at module load —
 * that is intentional: the adapter only makes sense in a DOT app.
 */
import type { StandardSchemaV1 } from '@arki/schema';
import { defineEnv } from '@arki/env/core';
export declare const ENV_UNIT_ERROR_CODES: {
    /**
     * The env failed its schema at boot. The message lists every bad key.
     *
     * @fix Set the listed variables, or fix their values, before booting the app.
     * @verify dot doctor --json | jq '.data'
     */
    readonly invalidEnv: 'ARKI_ENV_UNIT_E001';
};
/**
 * Options for the env DOT adapter.
 *
 * @typeParam TSchema - The shape of the `server` schema record. The
 *   resulting `app.services.env` is typed from this.
 */
export type EnvDotOptions<TSchema extends Record<string, StandardSchemaV1>> = {
    /** One Standard Schema (Zod, Valibot, ArkType, ...) per env var the unit validates. */
    readonly schema: TSchema;
    /**
     * Forwarded to `defineEnv`. If `true`, the validator is skipped
     * entirely. By default the env is validated at boot, in every
     * environment, unless the process sets `SKIP_ENV_VALIDATION=1`.
     */
    readonly skipValidation?: boolean;
};
/** The shape of services published by the env adapter. */
export type EnvServices<TSchema extends Record<string, StandardSchemaV1>> = {
    readonly env: ReturnType<typeof defineEnv<TSchema>>;
};
/**
 * Build a DOT unit that validates and publishes a typed `env` service.
 *
 * @param options - Schema + optional config.
 * @returns A unit that publishes `services.env`.
 */
export declare function env<TSchema extends Record<string, StandardSchemaV1>>(options: EnvDotOptions<TSchema>): Omit<import("./unit-contract.js").Unit<import("./unit-contract.js").WireNeeds<import("./unit-contract.js").EmptyShape>, import("./unit-contract.js").ProvidedValues<{
    env: Readonly<(Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> extends infer T_2 ? T_2 extends Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> ? T_2 extends Readonly<infer U> ? U : T_2 : never : never) & Omit<object, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema] | Exclude<keyof TSchema, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> extends infer T ? { [P in keyof T]: T[P]; } : never>;
}>, import("./unit-contract.js").EmptyShape, "env", import("./unit-contract.js").EmptyOwnership, import("./unit-contract.js").EmptyPhases>, "factories" | "hooks" | "logging"> & import("./unit-contract.js").LoggingSlot<import("./unit-contract.js").DotLoggingHandle<undefined>> & import("./unit-contract.js").FactoryContract<import("./unit-contract.js").ProvidedValues<{
    env: Readonly<(Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> extends infer T_2 ? T_2 extends Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> ? T_2 extends Readonly<infer U> ? U : T_2 : never : never) & Omit<object, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema] | Exclude<keyof TSchema, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> extends infer T ? { [P in keyof T]: T[P]; } : never>;
}>> & {
    readonly factories: {
        readonly env: (ctx: never) => Readonly<(Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> extends infer T_2 ? T_2 extends Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> ? T_2 extends Readonly<infer U> ? U : T_2 : never : never) & Omit<object, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema] | Exclude<keyof TSchema, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> extends infer T ? { [P in keyof T]: T[P]; } : never>;
    };
    readonly hooks: import("./unit-contract.js").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("./unit-contract.js").DotConfigureContext> & import("./unit-contract.js").BootSlot<import("./unit-contract.js").CtxOf<import("./unit-contract.js").EmptyShape> & import("./unit-contract.js").ProvidedValues<{
        env: Readonly<(Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> extends infer T_2 ? T_2 extends Partial<Pick<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> & Omit<import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}>, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]> ? T_2 extends Readonly<infer U> ? U : T_2 : never : never) & Omit<object, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema] | Exclude<keyof TSchema, (import("@t3-oss/env-core").StandardSchemaDictionary.InferOutput<TSchema & {}> extends infer T_1 ? { [K in keyof T_1]: undefined extends T_1[K] ? K : never; } : never)[keyof TSchema]>> extends infer T ? { [P in keyof T]: T[P]; } : never>;
    }> & import("./unit-contract.js").KernelCtx, undefined>;
} & import("./unit-contract.js").InfraRole;
//# sourceMappingURL=env.d.ts.map