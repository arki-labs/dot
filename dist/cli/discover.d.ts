/**
 * App-file discovery + dynamic import for the DOT CLI.
 *
 * The CLI inspects a user's DOT app at the command line. Apps live in source
 * files like `dot.config.ts` or `src/app.ts`; this module resolves the right
 * file, imports it, unwraps the default export, and returns either a
 * `DotApp` or `DotAppBuilder`.
 *
 * The CLI commands (`explain`, `doctor`) then decide whether to call
 * `.configure()` / `.boot()` on the result.
 */
import type { DotApp, DotAppBuilder, DotAppConfigured } from '../define-app.js';
export type DiscoveredApp = DotApp<Record<string, unknown>> | DotAppBuilder<Record<string, unknown>> | DotAppConfigured<Record<string, unknown>>;
export type DiscoveryOptions = {
    /** Explicit app file path. When set, takes precedence over the search list. */
    appPath?: string;
    /** Working directory for discovery. Defaults to `process.cwd()`. */
    cwd?: string;
};
export type DiscoveryResult = {
    /** Absolute path of the resolved app file. */
    filePath: string;
    /** Discovered app (builder, configured, or booted). */
    app: DiscoveredApp;
};
/**
 * Resolve which app file to load.
 *
 * If `appPath` is set, return its absolute path (without checking existence —
 * the caller's `import` will throw with a clearer error if missing).
 * Otherwise, walk the default file list and return the first that exists.
 *
 * Returns `null` when nothing was found.
 */
export declare function resolveAppFile(options?: DiscoveryOptions): Promise<string | null>;
/**
 * Heuristic guard: detect whether the default export looks like a `DotApp` or
 * `DotAppBuilder` / `DotAppConfigured`. We avoid `instanceof` because the
 * surface types are structural; instead we duck-type the key methods.
 */
declare function isDotAppBuilder(value: unknown): value is DotAppBuilder<Record<string, unknown>>;
declare function isDotAppConfigured(value: unknown): value is DotAppConfigured<Record<string, unknown>>;
declare function isDotApp(value: unknown): value is DotApp<Record<string, unknown>>;
/**
 * Dynamic-import the app file and unwrap its default export into a
 * `DotApp` / `DotAppBuilder`. Functions returning either are awaited.
 *
 * Throws `DotCliError` on any failure path.
 */
export declare function loadAppFromFile(filePath: string): Promise<DiscoveredApp>;
/**
 * Combined: resolve the file and load the app. Throws `DotCliError` when no
 * file was found or the import/export shape is invalid.
 */
export declare function discoverApp(options?: DiscoveryOptions): Promise<DiscoveryResult>;
/**
 * Type guards re-exported for test and renderer consumers.
 */
export declare const guards: {
    isDotApp: typeof isDotApp;
    isDotAppBuilder: typeof isDotAppBuilder;
    isDotAppConfigured: typeof isDotAppConfigured;
};
export {};
//# sourceMappingURL=discover.d.ts.map