/** `dot explain`: the app's static manifest, unit graph or a registered projection. Never boots the app. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    app: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    graph: z.ZodOptional<z.ZodBoolean>;
    as: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, Promise<import("@arki/failure").Failure | import("../explain.js").ExplainData>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=explain.d.ts.map