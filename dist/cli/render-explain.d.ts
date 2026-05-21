/**
 * Renderers for `dot explain`.
 *
 * Reads a configured (or booted) app's `manifest` and emits one of:
 *   - JSON envelope to stdout (when --json)
 *   - human-readable plain text to stdout (default)
 *
 * The JSON envelope shape matches the broader release-tooling envelope so
 * agents can parse the output identically across CLI surfaces.
 */
import type { DiagnosticIssue } from '../diagnostics.js';
import type { DotAppManifest } from '../manifest.js';
export type DotCliEnvelopeStatus = 'success' | 'failure' | 'warning';
export type DotCliEnvelope<T = unknown> = {
    status: DotCliEnvelopeStatus;
    command: string;
    generatedAt: string;
    data: T;
    errors: DiagnosticIssue[];
};
export type ExplainSource = {
    /** The static manifest produced by configure (or read off a booted app). */
    manifest: DotAppManifest;
};
export type RenderOptions = {
    /** Set to true to emit JSON to stdout; otherwise pretty text. */
    json: boolean;
    /** Override clock for deterministic test output. */
    now?: () => Date;
    /** Override stdout sink. Defaults to `process.stdout.write`. */
    out?: (line: string) => void;
};
/**
 * Build the envelope without writing anything. Useful for tests that need
 * to assert shape and for embedding the CLI logic from other tools.
 */
export declare function buildExplainEnvelope(source: ExplainSource, opts: RenderOptions): DotCliEnvelope<DotAppManifest>;
/**
 * Render the explain output. Returns the envelope so callers can act on it
 * (e.g. set the process exit code based on `status`).
 */
export declare function renderExplain(source: ExplainSource, opts: RenderOptions): DotCliEnvelope<DotAppManifest>;
//# sourceMappingURL=render-explain.d.ts.map