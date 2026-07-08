import { pip as definePip, service } from './pip-contract.js';
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
function createPipFactory() {
    const factory = {
        pip(def) {
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
            return definePip(kernelDef);
        },
        needs(...keys) {
            return needsFor(keys);
        },
    };
    return factory;
}
export const initPips = {
    context() {
        return {
            create() {
                return createPipFactory();
            },
        };
    },
};
//# sourceMappingURL=init-pips.js.map