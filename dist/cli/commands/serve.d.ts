/** `dot _serve`: the runner `dot dev` spawns without Vite or `--run`. Starts the app until SIGINT/SIGTERM. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    app: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<import("@arki/failure").Failure | {
    readonly app: string;
}>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=serve.d.ts.map