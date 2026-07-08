/**
 * Renderer for `dot explain --as <format>`.
 *
 * The kernel owns selection, app-file-relative module resolution, import, and
 * envelope printing. The adapter owns the projection module and document
 * vocabulary.
 */
import type { DotAppManifest, JsonValue } from '../manifest.js';
import type { DotCliEnvelope, RenderOptions } from './render-explain.js';
export type ProjectionData = {
    format: string;
    document: JsonValue;
};
export type ProjectionSource = {
    manifest: DotAppManifest;
    command: 'explain';
    format: string;
    /** Absolute app file path; projection specifiers resolve relative to it. */
    appFilePath: string;
    /** Per-invocation debug override for the selected projection module. */
    module?: string;
};
/**
 * Render an adapter-owned projection. Plain mode prints strings verbatim and
 * JSON values as pretty JSON; JSON mode wraps the document in the standard
 * CLI envelope.
 */
export declare function renderProjection(source: ProjectionSource, opts: RenderOptions): Promise<DotCliEnvelope<ProjectionData>>;
//# sourceMappingURL=render-projection.d.ts.map