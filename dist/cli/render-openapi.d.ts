/**
 * Renderer for `dot explain --openapi`.
 *
 * Emits an OpenAPI 3.1 document straight from `manifest.routes` — no boot
 * required. Adapters (e.g. `@arki/http`'s `registerRoutes`) convert their
 * validation schemas to JSON Schema at `configure` time and register them
 * via `ctx.registerRoute`, so the manifest already carries everything the
 * document needs: methods, paths, per-location input schemas, output
 * schemas, and the `streaming` flag for `text/event-stream` responses.
 *
 * Deterministic: paths and operations follow manifest registration order
 * (which follows pip declaration order). Only `transport: 'http'` routes
 * are rendered — rpc mounts have their own schema story.
 */
import type { DotAppManifest } from '../manifest.js';
import type { DotCliEnvelope, RenderOptions } from './render-explain.js';
/** Envelope payload for OpenAPI output. */
export type OpenApiData = {
    format: 'openapi';
    /** OpenAPI 3.1 document. */
    document: Record<string, unknown>;
};
/**
 * Build an OpenAPI 3.1 document from a manifest. First registration wins
 * on a method+path collision — collisions are an app bug the serving
 * adapter rejects at boot; the document renderer stays total.
 */
export declare function buildOpenApiDocument(manifest: DotAppManifest): Record<string, unknown>;
/**
 * Render the OpenAPI output. Plain mode prints the document as JSON
 * (pipe it into a file or a swagger viewer); `--json` wraps it in the
 * standard CLI envelope under `data.document`.
 */
export declare function renderOpenApi(source: {
    manifest: DotAppManifest;
    command: 'explain';
}, opts: RenderOptions): DotCliEnvelope<OpenApiData>;
//# sourceMappingURL=render-openapi.d.ts.map