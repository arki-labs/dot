/** `dot dev`: supervise the app in development. Exit 3 (`dot.dev_*`) when it cannot start. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    app: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    db: z.ZodDefault<z.ZodEnum<{
        auto: "auto";
        pg: "pg";
        pglite: "pglite";
    }>>;
    allowRemoteDb: z.ZodDefault<z.ZodBoolean>;
    port: z.ZodDefault<z.ZodNumber>;
    consolePort: z.ZodDefault<z.ZodNumber>;
    console: z.ZodDefault<z.ZodBoolean>;
    open: z.ZodDefault<z.ZodBoolean>;
    once: z.ZodDefault<z.ZodBoolean>;
    run: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<import("../dev.js").DevResult | import("@arki/failure").Failure>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=dev.d.ts.map