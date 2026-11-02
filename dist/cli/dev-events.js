/**
 * The events `dot dev` reports, one per step: `--output ndjson` prints one
 * per line, and `onEvent` sees them as they happen. Consumers (`--json`
 * readers, a future `dot mcp`) parse them with `devEventSchema`.
 */
import { z } from 'zod';
const devEventZod = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('app'),
        file: z.string(),
        exportName: z.string(),
        plugins: z.number(),
        features: z.number(),
    }),
    z.object({ kind: z.literal('db'), driver: z.enum(['pglite', 'pg']), target: z.string(), owned: z.boolean() }),
    z.object({ kind: z.literal('migrations'), pending: z.array(z.string()) }),
    z.object({
        kind: z.literal('preflight'),
        status: z.enum(['ok', 'warning', 'failure']),
        codes: z.array(z.string()),
    }),
    z.object({ kind: z.literal('runner'), command: z.string(), pid: z.number() }),
    z.object({ kind: z.literal('console'), url: z.url() }),
    z.object({
        kind: z.literal('restart'),
        reason: z.enum(['file', 'key', 'crash']),
        path: z.string().optional(),
    }),
    z.object({ kind: z.literal('exit'), code: z.number() }),
]);
/** Parses a `DevEvent` (Standard Schema: no validator library in the public type). */
export const devEventSchema = devEventZod;
//# sourceMappingURL=dev-events.js.map