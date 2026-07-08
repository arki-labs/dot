/**
 * Renderer for `dot explain --graph` / `dot doctor --graph`.
 *
 * Emits the app's plugin graph as [Mermaid](https://mermaid.js.org) `flowchart`
 * source — paste-able into GitHub markdown, docs, and mermaid.live.
 *
 * The nodes are the plugins in declaration order (which IS boot order in v2 —
 * the numbering makes that visible); the edges are the manifest's
 * **observed** dependency edges, recorded by the kernel when a plugin's need
 * was satisfied during boot. `explain` never boots, so its graph shows
 * declaration order with whatever edges configure-time metadata declared;
 * `doctor` boots, so its graph shows the real wiring.
 */
/** Escape a plugin name for use inside a quoted Mermaid node label. */
function escapeLabel(name) {
    return name.replaceAll('"', '#quot;');
}
/**
 * Build Mermaid `flowchart` source from a manifest. Deterministic: node
 * ids follow declaration order, edges follow manifest order.
 */
export function buildMermaidGraph(manifest) {
    const lines = ['flowchart TD'];
    const idByPlugin = new Map();
    for (const [index, plugin] of manifest.plugins.entries()) {
        const id = `p${index.toString()}`;
        idByPlugin.set(plugin.name, id);
        const order = (index + 1).toString();
        const version = plugin.version === undefined ? '' : `@${plugin.version}`;
        lines.push(`  ${id}["${order} · ${escapeLabel(plugin.name)}${escapeLabel(version)}"]`);
    }
    for (const edge of manifest.dependencies) {
        const from = idByPlugin.get(edge.from);
        const to = idByPlugin.get(edge.to);
        // Edges referencing unknown plugins would be a kernel bug — skip rather
        // than emit invalid Mermaid.
        if (from === undefined || to === undefined)
            continue;
        lines.push(`  ${from} -->|${edge.kind}| ${to}`);
    }
    return `${lines.join('\n')}\n`;
}
/**
 * Render the graph output. Plain mode prints raw Mermaid source (pipe it
 * straight into a markdown code fence); `--json` wraps it in the standard
 * CLI envelope under `data.source`.
 */
export function renderGraph(source, opts) {
    const mermaid = buildMermaidGraph(source.manifest);
    const nowFactory = opts.now ?? (() => new Date());
    const envelope = {
        status: 'success',
        command: source.command,
        generatedAt: nowFactory().toISOString(),
        data: { format: 'mermaid', source: mermaid },
        errors: [],
    };
    const out = opts.out ??
        ((line) => {
            process.stdout.write(line);
        });
    if (opts.json) {
        out(`${JSON.stringify(envelope, null, 2)}\n`);
    }
    else {
        out(mermaid);
    }
    return envelope;
}
//# sourceMappingURL=render-graph.js.map