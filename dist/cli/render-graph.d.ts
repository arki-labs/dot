/**
 * Renderer for `dot explain --graph` / `dot doctor --graph`.
 *
 * Emits the app's unit graph as [Mermaid](https://mermaid.js.org) `flowchart`
 * source — paste-able into GitHub markdown, docs, and mermaid.live.
 *
 * The nodes are the units in declaration order (which IS boot order in v2 —
 * the numbering makes that visible); the edges are the manifest's dependency
 * edges. Capability edges between features are derived before boot from
 * their static `provides` and labelled with the capability key, so
 * `explain` (which never boots) draws them; the rest are **observed** when a
 * unit's need is satisfied during boot, so `doctor` shows the full wiring.
 */
import type { DotAppManifest } from '../manifest.js';
/** The `data` of `--graph`: Mermaid source. */
export type GraphData = {
    format: 'mermaid';
    /** Mermaid `flowchart` source. */
    source: string;
};
/**
 * Build Mermaid `flowchart` source from a manifest. Deterministic: node
 * ids follow declaration order, edges follow manifest order. An app built
 * with `.features()` / `.entrypoints()` is drawn as the hexagon's three
 * groups; an app of infra alone is a flat list.
 */
export declare function buildMermaidGraph(manifest: DotAppManifest): string;
/** The graph payload of `explain --graph` / `doctor --graph`. Text mode prints `source` as is. */
export declare function renderGraph(manifest: DotAppManifest): GraphData;
/** True when a command's data is the `--graph` payload. */
export declare function isGraphData(value: unknown): value is GraphData;
//# sourceMappingURL=render-graph.d.ts.map