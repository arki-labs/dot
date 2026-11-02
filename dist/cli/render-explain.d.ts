/**
 * Text renderer for `dot explain`: the manifest as plain-text tables. In
 * json mode the manifest is the envelope's `data` and this never runs.
 */
import type { Ui } from '@arki/cli';
import type { DotAppManifest } from '../manifest.js';
/** Print the manifest as text: units, services, actions, projections, dependencies, lifecycle hooks. */
export declare function renderExplainText(manifest: DotAppManifest, ui: Ui): void;
//# sourceMappingURL=render-explain.d.ts.map