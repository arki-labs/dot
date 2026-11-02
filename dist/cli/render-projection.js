/**
 * `dot explain --as <format>`: select the projection the app registered,
 * resolve its module relative to the app file, import it and run
 * `project(manifest)`. The adapter owns the projection module and its
 * document vocabulary; every failure here is returned, not thrown.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isFailure } from '@arki/failure';
import { is, plainObjectSchema, recordSchema } from '@arki/schema';
import { ProjectionConflict, ProjectionExecutionFailed, ProjectionImportFailed, ProjectionNotFound, } from './failures.js';
function isJsonPrimitive(value) {
    return value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number';
}
function isJsonValue(value) {
    if (isJsonPrimitive(value))
        return typeof value !== 'number' || Number.isFinite(value);
    if (Array.isArray(value))
        return value.every(item => isJsonValue(item));
    if (!is(value, plainObjectSchema))
        return false;
    return Object.values(value).every(item => isJsonValue(item));
}
function jsonDeepEqual(left, right) {
    if (isJsonPrimitive(left) || isJsonPrimitive(right))
        return Object.is(left, right);
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length)
            return false;
        return left.every((value, index) => jsonDeepEqual(value, right[index]));
    }
    if (!is(left, plainObjectSchema) || !is(right, plainObjectSchema))
        return false;
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);
    if (leftEntries.length !== rightEntries.length)
        return false;
    for (const [key, value] of leftEntries) {
        if (!Object.hasOwn(right, key) || !jsonDeepEqual(value, right[key]))
            return false;
    }
    return true;
}
function toProjectionJsonValue(value) {
    let serialized;
    try {
        serialized = JSON.stringify(value);
    }
    catch (error) {
        throw new TypeError('Projection output must be JSON-serializable.', { cause: error });
    }
    if (serialized === undefined) {
        throw new TypeError('Projection output must be JSON-serializable.');
    }
    const parsed = JSON.parse(serialized);
    if (!isJsonValue(parsed) || !jsonDeepEqual(value, parsed)) {
        throw new TypeError('Projection output must survive a JSON round trip without lossy coercions.');
    }
    return parsed;
}
function selectProjection(manifest, format) {
    const projections = manifest.projections.filter(projection => projection.format === format);
    const [first] = projections;
    if (first === undefined) {
        const registeredFormats = [...new Set(manifest.projections.map(projection => projection.format))];
        return ProjectionNotFound({ format, registeredFormats });
    }
    const modules = new Set(projections.map(projection => projection.module));
    if (modules.size > 1) {
        return ProjectionConflict({
            format,
            projections: projections.map(projection => ({ plugin: projection.plugin, module: projection.module })),
        });
    }
    return first;
}
function getBunResolver() {
    const candidate = globalThis.Bun;
    if (typeof candidate !== 'object' || candidate === null)
        return undefined;
    const resolveSync = candidate.resolveSync;
    if (typeof resolveSync !== 'function')
        return undefined;
    return { resolveSync: (specifier, from) => resolveSync.call(candidate, specifier, from) };
}
function importSpecifierFor(resolved) {
    if (resolved.startsWith('file:'))
        return resolved;
    if (path.isAbsolute(resolved))
        return pathToFileURL(resolved).href;
    return resolved;
}
function resolveProjectionSpecifier(specifier, appFilePath) {
    const fromDir = path.dirname(appFilePath);
    const bun = getBunResolver();
    if (bun !== undefined)
        return bun.resolveSync(specifier, fromDir);
    return createRequire(appFilePath).resolve(specifier);
}
function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
function hasProject(value) {
    return (is(value, recordSchema) &&
        typeof value['project'] === 'function' &&
        (value['render'] === undefined || typeof value['render'] === 'function') &&
        (value['consolePage'] === undefined || typeof value['consolePage'] === 'function'));
}
/** Resolve the specifier relative to the app file and `import()` it: the default importer. */
function importRelativeToApp(appFilePath) {
    return async (specifier) => {
        let resolved;
        try {
            resolved = resolveProjectionSpecifier(specifier, appFilePath);
        }
        catch (error) {
            throw new ProjectionResolveError(error);
        }
        return import(importSpecifierFor(resolved));
    };
}
/** Marks a failure of the resolve step, so the import failure names that stage. */
class ProjectionResolveError extends Error {
    cause;
    constructor(cause) {
        super(messageOf(cause), { cause });
        this.cause = cause;
    }
}
async function loadProjectionModule(specifier, registeringPlugin, importModule) {
    let imported;
    try {
        imported = await importModule(specifier);
    }
    catch (error) {
        if (error instanceof ProjectionResolveError) {
            return ProjectionImportFailed({ specifier, registeringPlugin, stage: 'resolve', causeMessage: error.message }, { cause: error.cause });
        }
        return ProjectionImportFailed({ specifier, registeringPlugin, stage: 'import', causeMessage: messageOf(error) }, { cause: error });
    }
    if (!hasProject(imported)) {
        return ProjectionImportFailed({ specifier, registeringPlugin, stage: 'export', causeMessage: null });
    }
    return imported;
}
/** Run the projection registered for `source.format` and return its document. */
export async function renderProjection(source) {
    const projection = selectProjection(source.manifest, source.format);
    if (isFailure(projection))
        return projection;
    const specifier = source.module ?? projection.module;
    const importModule = source.importModule ?? importRelativeToApp(source.appFilePath);
    const loaded = await loadProjectionModule(specifier, projection.plugin, importModule);
    if (isFailure(loaded))
        return loaded;
    try {
        const document = toProjectionJsonValue(await loaded.project(source.manifest));
        let page;
        if (source.page === true) {
            if (loaded.consolePage === undefined)
                throw new TypeError('A projection module needs consolePage(document) to give the console a page.');
            const html = loaded.consolePage(document);
            if (typeof html !== 'string')
                throw new TypeError('A projection module\'s consolePage(document) must return a string.');
            page = html;
        }
        const withPage = page === undefined ? {} : { page };
        if (loaded.render === undefined)
            return { format: source.format, document, ...withPage };
        const text = loaded.render(document);
        if (typeof text !== 'string')
            throw new TypeError('A projection module\'s render(document) must return a string.');
        return { format: source.format, document, text, ...withPage };
    }
    catch (error) {
        return ProjectionExecutionFailed({ format: source.format, specifier, registeringPlugin: projection.plugin, causeMessage: messageOf(error) }, { cause: error });
    }
}
/** True when a command's data is the `--as` payload. */
export function isProjectionData(value) {
    return is(value, recordSchema) && 'format' in value && 'document' in value;
}
//# sourceMappingURL=render-projection.js.map