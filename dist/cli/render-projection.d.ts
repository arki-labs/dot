/**
 * `dot explain --as <format>`: select the projection the app registered,
 * resolve its module relative to the app file, import it and run
 * `project(manifest)`. The adapter owns the projection module and its
 * document vocabulary; every failure here is returned, not thrown.
 */
import type { Failure } from '@arki/failure';
import type { DotAppManifest, JsonValue } from '../manifest.js';
/**
 * The `data` of `explain --as`: the format and the document `project(manifest)` returned. `text` is set when
 * the module also exports `render(document)`: what `dot explain --as <format>` prints without `--json`.
 */
export type ProjectionData = {
    format: string;
    document: JsonValue;
    text?: string;
    /** Set when `page` was asked for and the module exports `consolePage(document)`: the console page's HTML. */
    page?: string;
};
export type ProjectionSource = {
    manifest: DotAppManifest;
    format: string;
    /** Absolute app file path; projection specifiers resolve relative to it. */
    appFilePath: string;
    /** Per-invocation debug override for the selected projection module. */
    module?: string;
    /** Also run the module's `consolePage(document)` and return its HTML as `page`. */
    page?: boolean;
    /**
     * How to import the projection module. Default: resolve the specifier
     * relative to the app file (Bun's resolver, else Node's) and `import()` it.
     * `@arki/dot/vite` imports through Vite's module runner instead, so a
     * workspace package distributed as TypeScript source loads under Node too.
     */
    importModule?: (specifier: string) => Promise<unknown>;
};
/** Run the projection registered for `source.format` and return its document. */
export declare function renderProjection(source: ProjectionSource): Promise<ProjectionData | Failure>;
/** True when a command's data is the `--as` payload. */
export declare function isProjectionData(value: unknown): value is ProjectionData;
//# sourceMappingURL=render-projection.d.ts.map