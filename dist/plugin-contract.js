/**
 * Public plugin contract for the DOT kernel.
 *
 * A `DotPlugin` is a plain object with a name, optional dependency list, and
 * up to five lifecycle hooks. The kernel calls each hook in dependency order
 * (or reverse-dependency order for `stop`/`dispose`).
 *
 * Design constraints:
 *
 *  - `configure` is SYNC. Returning a Promise is an error — the kernel will
 *    throw {@link DotLifecycleError} with code `DOT_LIFECYCLE_E001`.
 *  - `boot` may publish services into the app; downstream plugins see them via
 *    {@link DotBootContext.services}.
 *  - `stop` and `dispose` continue through individual plugin failures and
 *    report an aggregate error.
 */
/**
 * Type-narrowing helper for plugin authors.
 *
 * @example
 * export const myPlugin = defineDotPlugin<{ db: MyDb }>({
 *   name: 'my-plugin',
 *   async boot() {
 *     const db = await openDb();
 *     return { services: { db } };
 *   },
 *   async dispose({ services }) {
 *     await services.db.close();
 *   },
 * });
 */
export function defineDotPlugin(plugin) {
    return plugin;
}
/** Internal helper: extract the `provides` field from a plugin (always returns an array). */
export function pluginProvides(plugin) {
    return plugin.provides ?? [];
}
/** Internal helper: extract the `dependencies` field from a plugin (always returns an array). */
export function pluginDependencies(plugin) {
    return plugin.dependencies ?? [];
}
/** Re-exported for downstream typing. */
export {} from './manifest.js';
//# sourceMappingURL=plugin-contract.js.map