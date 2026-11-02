/** The child preflight report shared by command failures and the dev supervisor. */
import { z } from 'zod';
/** What `dot _preflight` reports. Written once here; the supervisor parses it with the same schema. */
export declare const preflightMessageSchema: z.ZodObject<{
    app: z.ZodNullable<z.ZodObject<{
        file: z.ZodString;
        exportName: z.ZodString;
        plugins: z.ZodNumber;
        features: z.ZodNumber;
    }, z.core.$strip>>;
    migrations: z.ZodNullable<z.ZodArray<z.ZodString>>;
    report: z.ZodNullable<z.ZodObject<{
        status: z.ZodEnum<{
            failure: "failure";
            success: "success";
            warning: "warning";
        }>;
        plugins: z.ZodArray<z.ZodObject<{
            issues: z.ZodArray<z.ZodObject<{
                code: z.ZodString;
            }, z.core.$loose>>;
        }, z.core.$loose>>;
        actions: z.ZodArray<z.ZodObject<{
            issues: z.ZodArray<z.ZodObject<{
                code: z.ZodString;
            }, z.core.$loose>>;
        }, z.core.$loose>>;
        services: z.ZodArray<z.ZodObject<{
            issues: z.ZodArray<z.ZodObject<{
                code: z.ZodString;
            }, z.core.$loose>>;
        }, z.core.$loose>>;
        lifecycle: z.ZodArray<z.ZodObject<{
            issues: z.ZodArray<z.ZodObject<{
                code: z.ZodString;
            }, z.core.$loose>>;
        }, z.core.$loose>>;
        issues: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
        }, z.core.$loose>>;
    }, z.core.$loose>>;
    failure: z.ZodNullable<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        data: z.ZodUnknown;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PreflightMessage = z.infer<typeof preflightMessageSchema>;
//# sourceMappingURL=preflight-message.d.ts.map