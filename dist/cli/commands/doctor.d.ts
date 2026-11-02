/** `dot doctor`: boot the app, report its diagnostics, dispose it. Exit 3 (`dot.doctor_failed`) on error issues. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    app: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    graph: z.ZodOptional<z.ZodBoolean>;
    observability: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, Promise<import("@arki/failure").Failure | import("../render-graph.js").GraphData | import("../failures.js").DoctorReport>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=doctor.d.ts.map