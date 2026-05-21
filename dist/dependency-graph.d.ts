/**
 * Topological sort + cycle detection for pip dependencies.
 *
 * Internal to the kernel. Tests must reach it through `defineApp(...)`, never
 * directly.
 */
import type { AnyDotPip } from './pip-contract.js';
/**
 * Sort pips so that every pip appears after the pips it depends on.
 *
 * @throws {DotLifecycleError}
 *   - `DOT_LIFECYCLE_E009` if the dependency graph contains a cycle.
 *   - `DOT_LIFECYCLE_E010` if a declared dependency isn't registered.
 *   - `DOT_LIFECYCLE_E011` if the same pip name appears twice.
 */
export declare function topologicalSort(pips: readonly AnyDotPip[]): readonly AnyDotPip[];
/** Reverse a sorted pip array — used for `stop` and `dispose` ordering. */
export declare function reverseTopologicalSort(pips: readonly AnyDotPip[]): readonly AnyDotPip[];
/** Build the list of dependency edges for the manifest. */
export declare function buildDependencyEdges(pips: readonly AnyDotPip[]): readonly {
    from: string;
    to: string;
    kind: 'requires';
}[];
//# sourceMappingURL=dependency-graph.d.ts.map