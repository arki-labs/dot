import type { InlineConfig, Plugin } from 'vite';
import type { Failure } from '@arki/failure';
import type { DotAppManifest } from './manifest.js';
export type DotViteOptions = {
    /**
     * The app module, relative to the Vite root or absolute. It exports the app
     * the way the `dot` CLI finds it: `default`, else `app`, else the one export
     * that is a Dot app.
     */
    readonly app: string;
    /** File name of the manifest JSON in the server output. `false` writes none. Default `dot-manifest.json`. */
    readonly manifestFile?: string | false;
    /** Write each registered projection as `<format>.json` in the server output. Default `true`. */
    readonly projections?: boolean;
    /** Vite config for the import of the app module (aliases, conditions). Default: the app's root with `tsconfig` paths. */
    readonly importConfig?: InlineConfig;
};
/** What the build knows about the app once it configured: the manifest, the files to write, the modules it read. */
export type DotBuildDescription = {
    readonly manifest: DotAppManifest;
    /** `fileName → JSON text`: the manifest and one document per projection format. */
    readonly files: ReadonlyMap<string, string>;
    /** Every module the app import read; the dev server re-checks when one changes. */
    readonly dependencies: readonly string[];
};
export type DescribeDotAppOptions = {
    /** The Vite root the app path and its imports resolve against. */
    readonly root: string;
    readonly manifestFile: string | false;
    readonly projections: boolean;
    readonly importConfig: InlineConfig | undefined;
};
/**
 * Import the app through Vite, configure it, and render its manifest and
 * projections to JSON. Every failure is returned, never thrown: an import
 * error, a module that exports no app, a `configure()` that refuses the
 * composition, or a projection module that cannot render.
 */
export declare function describeDotApp(appFilePath: string, options: DescribeDotAppOptions): Promise<DotBuildDescription | Failure>;
/**
 * The Vite plugin. `vite build`: the app is described once per process (Vite
 * runs `buildStart` once per environment) and a failure fails the build; the
 * files are emitted into the server environment's output only, never the
 * client's. `vite dev`: the same check on start and whenever a module of the
 * app's graph changes, reported through Vite's logger.
 */
export declare function dotVite(options: DotViteOptions): Plugin;
//# sourceMappingURL=vite.d.ts.map