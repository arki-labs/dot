import { createUnit as defineUnit, service } from './unit-contract.js';
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
function createUnitFactory() {
    function infra(def) {
        const rawNeeds = def.needs;
        const needs = isServiceKeyArray(rawNeeds)
            ? needsFor(rawNeeds)
            : rawNeeds;
        // Factory seam: key-array authoring is runtime-compiled to the same
        // witness record that the kernel already understands.
        const kernelDef = {
            name: def.name,
            ...(needs === undefined ? {} : { needs }),
            ...(def.actions === undefined ? {} : { actions: def.actions }),
            ...(def.logging === undefined ? {} : { logging: def.logging }),
            ...(def.configure === undefined ? {} : { configure: def.configure }),
            ...(def.provides === undefined
                ? {}
                : {
                    provides: def.provides,
                }),
            ...(def.boot === undefined
                ? {}
                : {
                    boot: def.boot,
                }),
            ...(def.start === undefined
                ? {}
                : {
                    start: def.start,
                }),
            ...(def.stop === undefined
                ? {}
                : {
                    stop: def.stop,
                }),
            ...(def.dispose === undefined
                ? {}
                : {
                    dispose: def.dispose,
                }),
        };
        return defineUnit(kernelDef);
    }
    function needs(...keys) {
        return needsFor(keys);
    }
    return { infra, needs };
}
export const initUnits = {
    context() {
        return {
            create() {
                return createUnitFactory();
            },
        };
    },
};
//# sourceMappingURL=init-units.js.map