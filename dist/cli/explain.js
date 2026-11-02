import { isFailure } from '@arki/failure';
import { guards } from './discover.js';
import { lifecycleFailed } from './failures.js';
import { renderGraph } from './render-graph.js';
import { renderProjection } from './render-projection.js';
/** The manifest of a discovered app. A builder is configured, never booted; a configured or booted app is read as is. */
export function manifestOf(discovered) {
    try {
        const configured = guards.isDotAppBuilder(discovered) ? discovered.configure() : discovered;
        if (isFailure(configured))
            return configured;
        return configured.manifest;
    }
    catch (error) {
        return lifecycleFailed(error, 'configure');
    }
}
/** Explain a discovered app: its manifest, or the `--graph` / `--as` payload derived from it. */
export async function runExplain(discovered, opts = {}) {
    const manifest = manifestOf(discovered);
    if (isFailure(manifest))
        return manifest;
    if (opts.as !== undefined) {
        return renderProjection({
            manifest,
            format: opts.as,
            appFilePath: opts.appFilePath ?? process.cwd(),
            ...(opts.module === undefined ? {} : { module: opts.module }),
            ...(opts.page === true ? { page: true } : {}),
        });
    }
    if (opts.graph === true)
        return renderGraph(manifest);
    return manifest;
}
//# sourceMappingURL=explain.js.map