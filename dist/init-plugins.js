import { plugin as definePlugin, service } from './plugin-contract.js';
function needsFor(keys) {
    const needs = {};
    for (const key of keys) {
        needs[key] = service();
    }
    return needs;
}
function isServiceKeyArray(needs) {
    return Array.isArray(needs);
}
function createPluginFactory() {
    const factory = {
        plugin(def) {
            const rawNeeds = def.needs;
            const needs = isServiceKeyArray(rawNeeds)
                ? needsFor(rawNeeds)
                : rawNeeds;
            // Factory seam: key-array authoring is runtime-compiled to the same
            // witness record that the kernel already understands.
            const kernelDef = {
                name: def.name,
                ...(def.version === undefined ? {} : { version: def.version }),
                ...(needs === undefined ? {} : { needs }),
                ...(def.actions === undefined ? {} : { actions: def.actions }),
                ...(def.configure === undefined ? {} : { configure: def.configure }),
                ...(def.boot === undefined ? {} : { boot: def.boot }),
                ...(def.start === undefined ? {} : { start: def.start }),
                ...(def.stop === undefined ? {} : { stop: def.stop }),
                ...(def.dispose === undefined ? {} : { dispose: def.dispose }),
            };
            return definePlugin(kernelDef);
        },
        needs(...keys) {
            return needsFor(keys);
        },
    };
    return factory;
}
export const initPlugins = {
    context() {
        return {
            create() {
                return createPluginFactory();
            },
        };
    },
};
//# sourceMappingURL=init-plugins.js.map