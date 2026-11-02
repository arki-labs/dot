/**
 * `dot explain` logic: configure the app (never boot it) and return its
 * manifest, its plugin graph (`--graph`) or a registered projection (`--as`).
 */
import type { Failure } from '@arki/failure';
import type { DotAppManifest } from '../manifest.js';
import type { DiscoveredApp } from './discover.js';
import type { GraphData } from './render-graph.js';
import type { ProjectionData } from './render-projection.js';
export type ExplainOptions = {
    /** Return the plugin graph as Mermaid source instead of the manifest. */
    readonly graph?: boolean | undefined;
    /** Return the document of this registered projection format instead of the manifest. */
    readonly as?: string | undefined;
    /** Replace the projection module for this run (`--as` only). */
    readonly module?: string | undefined;
    /** With `as`: also return the console page the projection module offers. */
    readonly page?: boolean | undefined;
    /** The app file: projection modules resolve relative to it. Defaults to the cwd. */
    readonly appFilePath?: string | undefined;
};
/** What `dot explain` returns: the manifest, or the `--graph` / `--as` payload. */
export type ExplainData = DotAppManifest | GraphData | ProjectionData;
/** The manifest of a discovered app. A builder is configured, never booted; a configured or booted app is read as is. */
export declare function manifestOf(discovered: DiscoveredApp): DotAppManifest | Failure;
/** Explain a discovered app: its manifest, or the `--graph` / `--as` payload derived from it. */
export declare function runExplain(discovered: DiscoveredApp, opts?: ExplainOptions): Promise<ExplainData | Failure>;
//# sourceMappingURL=explain.d.ts.map