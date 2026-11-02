/**
 * `log()`: the unit that fills Dot's logging slot with an `@arki/log` configuration.
 *
 * ```ts
 * import { defineApp } from '@arki/dot';
 * import { log } from '@arki/dot/log';
 * import { asyncContext, fromEnv, stdout } from '@arki/log/node';
 *
 * const app = await defineApp('checkout')
 *   .infra(log(() => ({ ...fromEnv(), context: asyncContext(), channels: { stdout: stdout() }, default: { level: 'info', channels: ['stdout'] } })))
 *   .boot();
 * ```
 *
 * - The kernel calls the config thunk before its first boot record and
 *   closes logging after its last disposal record. Configure performs no logging I/O. Importing this module does nothing.
 * - `resource['service.name']` defaults to the app's name.
 * - The `configure()` handle is published as the `logging` service.
 * - It reads no env on its own (spread `fromEnv()`), installs no OTel SDK and
 *   does not patch `console`.
 */
import type { Configured, LogConfig } from '@arki/log';
export declare const DOT_LOG_ERROR_CODES: {
    /**
     * `boot` ran before the kernel activated the logging slot.
     * @fix Mount `log()` with `.infra()` in a Dot app and let the kernel run its hooks; never call them yourself.
     * @verify dot doctor --json | jq -e .ok
     */
    readonly notActivated: 'DOT_LOG_E001';
};
/** What `log()` publishes. */
export type LogServices<C extends string> = {
    readonly logging: Configured<C>;
};
/** The Dot unit that configures `@arki/log` for the app. Pass a thunk: it runs when the app boots, never at import. */
export declare function log<const C extends string>(config: () => LogConfig<C>): Omit<import("./unit-contract.js").Unit<import("./unit-contract.js").WireNeeds<import("./unit-contract.js").EmptyShape>, import("./unit-contract.js").ProvidedValues<{
    logging: Configured<C>;
}>, import("./unit-contract.js").EmptyShape, "log", import("./unit-contract.js").EmptyOwnership, import("./unit-contract.js").EmptyPhases>, "factories" | "hooks" | "logging"> & import("./unit-contract.js").LoggingSlot<import("./unit-contract.js").DotLoggingHandle<undefined>> & import("./unit-contract.js").FactoryContract<import("./unit-contract.js").ProvidedValues<{
    logging: Configured<C>;
}>> & {
    readonly factories: {
        readonly logging: (ctx: never) => Configured<C>;
    };
    readonly hooks: import("./unit-contract.js").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("./unit-contract.js").DotConfigureContext> & import("./unit-contract.js").BootSlot<import("./unit-contract.js").CtxOf<import("./unit-contract.js").EmptyShape> & import("./unit-contract.js").ProvidedValues<{
        logging: Configured<C>;
    }> & import("./unit-contract.js").KernelCtx, undefined>;
} & import("./unit-contract.js").InfraRole;
//# sourceMappingURL=log.d.ts.map