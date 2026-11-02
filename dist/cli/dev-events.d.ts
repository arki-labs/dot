/**
 * The events `dot dev` reports, one per step: `--output ndjson` prints one
 * per line, and `onEvent` sees them as they happen. Consumers (`--json`
 * readers, a future `dot mcp`) parse them with `devEventSchema`.
 */
import { z } from 'zod';
import type { StandardSchemaV1 } from '@arki/schema';
declare const devEventZod: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"app">;
    file: z.ZodString;
    exportName: z.ZodString;
    plugins: z.ZodNumber;
    features: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"db">;
    driver: z.ZodEnum<{
        pg: "pg";
        pglite: "pglite";
    }>;
    target: z.ZodString;
    owned: z.ZodBoolean;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"migrations">;
    pending: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"preflight">;
    status: z.ZodEnum<{
        failure: "failure";
        ok: "ok";
        warning: "warning";
    }>;
    codes: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"runner">;
    command: z.ZodString;
    pid: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"console">;
    url: z.ZodURL;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"restart">;
    reason: z.ZodEnum<{
        crash: "crash";
        file: "file";
        key: "key";
    }>;
    path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"exit">;
    code: z.ZodNumber;
}, z.core.$strip>], "kind">;
/** One `dot dev` event. */
export type DevEvent = z.infer<typeof devEventZod>;
/** Parses a `DevEvent` (Standard Schema: no validator library in the public type). */
export declare const devEventSchema: StandardSchemaV1<unknown, DevEvent>;
export {};
//# sourceMappingURL=dev-events.d.ts.map