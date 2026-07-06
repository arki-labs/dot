/**
 * Renderer for `dot explain --graph` / `dot doctor --graph`.
 *
 * Emits the app's pip graph as [Mermaid](https://mermaid.js.org) `flowchart`
 * source — paste-able into GitHub markdown, docs, and mermaid.live.
 *
 * The nodes are the pips in declaration order (which IS boot order in v2 —
 * the numbering makes that visible); the edges are the manifest's
 * **observed** dependency edges, recorded by the kernel when a pip's need
 * was satisfied during boot. `explain` never boots, so its graph shows
 * declaration order with whatever edges configure-time metadata declared;
 * `doctor` boots, so its graph shows the real wiring.
 */
import type { DotAppManifest } from '../manifest.js';
import type { DotCliEnvelope, RenderOptions } from './render-explain.js';
/** Envelope payload for graph output. */
export type GraphData = {
    format: 'mermaid';
    /** Mermaid `flowchart` source. */
    source: string;
};
/**
 * Build Mermaid `flowchart` source from a manifest. Deterministic: node
 * ids follow declaration order, edges follow manifest order.
 */
export declare function buildMermaidGraph(manifest: DotAppManifest): string;
/**
 * Render the graph output. Plain mode prints raw Mermaid source (pipe it
 * straight into a markdown code fence); `--json` wraps it in the standard
 * CLI envelope under `data.source`.
 */
export declare function renderGraph(source: {
    manifest: DotAppManifest;
    command: 'explain' | 'doctor';
}, opts: RenderOptions): DotCliEnvelope<GraphData>;
//# sourceMappingURL=render-graph.d.ts.map