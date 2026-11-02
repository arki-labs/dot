/** `dot new <name>`: scaffold a DOT app from a bundled template. `--dry-run` plans and writes nothing. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    name: z.ZodString;
    target: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodEnum<{
        minimal: "minimal";
        stack: "stack";
    }>>;
    pm: z.ZodOptional<z.ZodEnum<{
        bun: "bun";
        npm: "npm";
        pnpm: "pnpm";
    }>>;
    force: z.ZodOptional<z.ZodBoolean>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<import("../json.js").DotNewResult | import("@arki/failure").Failure>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=new.d.ts.map