/**
 * App-file discovery + dynamic import for the DOT CLI.
 *
 * The CLI inspects a user's DOT app at the command line. Apps live in source
 * files like `dot.config.ts` or `src/app.ts`; this module resolves the right
 * file, imports it, finds the app export, and returns either a
 * `DotApp` or `DotAppBuilder`.
 *
 * The app export is found in this order: the `default` export, else a named
 * export `app` (the shape app templates use), else the one export that looks
 * like a DOT app. Several candidates and no `default`/`app` is an error.
 *
 * The CLI commands (`explain`, `doctor`) then decide whether to call
 * `.configure()` / `.boot()` on the result.
 */
import type { Failure } from '@arki/failure';
import type { DotApp, DotAppBuilder, DotAppConfigured } from '../define-app.js';
import type { PluginPhases } from '../plugin-contract.js';
export type DiscoveredApp = DotApp<Record<string, unknown>, Failure, Failure, PluginPhases> | DotAppBuilder<Record<string, unknown>, Failure, Failure, PluginPhases> | DotAppConfigured<Record<string, unknown>, Failure, Failure, PluginPhases>;
export type DiscoveryOptions = {
    /** Explicit app file path. When set, takes precedence over the search list. */
    appPath?: string;
    /** Working directory for discovery. Defaults to `process.cwd()`. */
    cwd?: string;
    /**
     * `'dev'` (used by `dot dev`): a `dev` export that is an unstarted builder
     * wins over the usual order. Default `'default'`: the usual order only.
     */
    prefer?: 'default' | 'dev';
};
export type DiscoveryResult = {
    /** Absolute path of the resolved app file. */
    filePath: string;
    /** Discovered app (builder, configured, or booted). */
    app: DiscoveredApp;
    /** The export the app was taken from: `default`, `app`, `dev` or another name. */
    exportName: string;
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
declare function isDotAppBuilder(value: unknown): value is DotAppBuilder<Record<string, unknown>, Failure, Failure, PluginPhases>;
declare function isDotAppConfigured(value: unknown): value is DotAppConfigured<Record<string, unknown>, Failure, Failure, PluginPhases>;
declare function isDotApp(value: unknown): value is DotApp<Record<string, unknown>, Failure, Failure, PluginPhases>;
/** `dot.app_import_failed` for an app module that threw while loading, naming the declaration error's own code when it has one. */
export declare function importFailed(filePath: string, exportName: string | null, error: unknown): Failure;
/**
 * Dynamic-import the app file and unwrap its app export into a `DotApp` /
 * `DotAppBuilder`. A function export is called and awaited. Every failure
 * path is returned: `dot.app_import_failed` or `dot.app_invalid_export`.
 */
export declare function loadAppFromFile(filePath: string): Promise<DiscoveredApp | Failure>;
/**
 * Unwrap an already-imported app module into its app export. Shared by the
 * CLI (which imports the file itself) and `@arki/dot/vite` (which imports it
 * through Vite's module runner, so aliases and workspace packages resolve the
 * way the app's own build resolves them).
 */
export declare function appFromModule(mod: unknown, filePath: string, prefer?: 'default' | 'dev'): Promise<{
    readonly app: DiscoveredApp;
    readonly exportName: string;
} | Failure>;
/**
 * Resolve the file and load the app. Returns `dot.app_not_found` when no
 * file was found, or the failure of `loadAppFromFile`.
 */
export declare function discoverApp(options?: DiscoveryOptions): Promise<DiscoveryResult | Failure>;
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