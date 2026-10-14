/**
 * `log()`: the plugin that fills Dot's logging slot (`@arki/log` redesign RFC §9).
 *
 * ```ts
 * import { defineApp } from '@arki/dot';
 * import { log } from '@arki/dot/log';
 * import { asyncContext, fromEnv, stdout } from '@arki/log/node';
 *
 * const app = await defineApp('checkout')
 *   .use(log(() => ({ ...fromEnv(), context: asyncContext(), channels: { stdout: stdout() }, default: { level: 'info', channels: ['stdout'] } })))
 *   .boot();
 * ```
 *
 * - The kernel calls the config thunk before its first lifecycle record and
 *   closes logging after its last one. Importing this module does nothing.
 * - `resource['service.name']` defaults to the app's name.
 * - The `configure()` handle is published as the `logging` service.
 * - It reads no env on its own (spread `fromEnv()`), installs no OTel SDK and
 *   does not patch `console`.
 */
import type { Configured, LogConfig } from '@arki/log';
export declare const DOT_LOG_ERROR_CODES: {
    /** `boot` ran before the kernel activated the logging slot. */
    readonly notActivated: 'DOT_LOG_E001';
};
/** What `log()` publishes. */
export type LogServices<C extends string> = {
    readonly logging: Configured<C>;
};
/** The Dot plugin that configures `@arki/log` for the app. Pass a thunk: it runs when the app boots, never at import. */
export declare function log<const C extends string>(config: () => LogConfig<C>): import("./plugin-contract.js").Plugin<import("./plugin-contract.js").WireNeeds<import("./plugin-contract.js").EmptyShape>, LogServices<C>>;
//# sourceMappingURL=log.d.ts.map