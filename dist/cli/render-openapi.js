/**
 * Renderer for `dot explain --openapi`.
 *
 * Emits an OpenAPI 3.1 document straight from `manifest.routes` — no boot
 * required. Adapters (e.g. `@arki/http`'s `registerRoutes`) convert their
 * validation schemas to JSON Schema at `configure` time and register them
 * via `ctx.registerRoute`, so the manifest already carries everything the
 * document needs: methods, paths, per-location input schemas, output
 * schemas, and the `streaming` flag for `text/event-stream` responses.
 *
 * Deterministic: paths and operations follow manifest registration order
 * (which follows pip declaration order). Only `transport: 'http'` routes
 * are rendered — rpc mounts have their own schema story.
 */
function openApiPath(path) {
    return path.replaceAll(/:(\w+)/g, '{$1}');
}
function pathParamNames(path) {
    return [...path.matchAll(/:(\w+)/g)]
        .map(match => match[1])
        .filter((name) => name !== undefined);
}
function buildOperation(route) {
    const parameters = pathParamNames(route.path ?? '').map(name => ({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' },
    }));
    const querySchema = route.input?.query;
    if (querySchema !== undefined) {
        const properties = (querySchema['properties'] ?? {});
        const required = new Set(querySchema['required']);
        for (const [name, propertySchema] of Object.entries(properties)) {
            parameters.push({ name, in: 'query', required: required.has(name), schema: propertySchema });
        }
    }
    const operation = {
        operationId: route.id,
        tags: [route.pip],
    };
    if (route.description !== undefined)
        operation['summary'] = route.description;
    if (parameters.length > 0)
        operation['parameters'] = parameters;
    const bodySchema = route.input?.body;
    if (bodySchema !== undefined) {
        operation['requestBody'] = {
            required: true,
            content: { 'application/json': { schema: bodySchema } },
        };
    }
    if (route.streaming === true) {
        operation['responses'] = {
            '200': {
                description: 'event stream',
                content: {
                    'text/event-stream': route.output === undefined ? {} : { schema: route.output },
                },
            },
        };
    }
    else if (route.output === undefined) {
        operation['responses'] = { '200': { description: 'success' } };
    }
    else {
        operation['responses'] = {
            '200': {
                description: 'success',
                content: { 'application/json': { schema: route.output } },
            },
        };
    }
    return operation;
}
/**
 * Build an OpenAPI 3.1 document from a manifest. First registration wins
 * on a method+path collision — collisions are an app bug the serving
 * adapter rejects at boot; the document renderer stays total.
 */
export function buildOpenApiDocument(manifest) {
    const paths = {};
    for (const route of manifest.routes) {
        if (route.transport !== 'http')
            continue;
        if (route.path === undefined)
            continue;
        const path = openApiPath(route.path);
        const method = (route.method ?? 'GET').toLowerCase();
        const entry = (paths[path] ??= {});
        if (entry[method] !== undefined)
            continue;
        entry[method] = buildOperation(route);
    }
    return {
        openapi: '3.1.0',
        info: {
            title: manifest.app.name,
            version: manifest.app.version ?? '0.0.0',
        },
        paths,
    };
}
/**
 * Render the OpenAPI output. Plain mode prints the document as JSON
 * (pipe it into a file or a swagger viewer); `--json` wraps it in the
 * standard CLI envelope under `data.document`.
 */
export function renderOpenApi(source, opts) {
    const document = buildOpenApiDocument(source.manifest);
    const nowFactory = opts.now ?? (() => new Date());
    const envelope = {
        status: 'success',
        command: source.command,
        generatedAt: nowFactory().toISOString(),
        data: { format: 'openapi', document },
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
        out(`${JSON.stringify(document, null, 2)}\n`);
    }
    return envelope;
}
//# sourceMappingURL=render-openapi.js.map