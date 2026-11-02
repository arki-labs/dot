/** `dot _preflight`: one preflight boot in a fresh process; failed reports exit nonzero. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    app: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<import("@arki/failure").Failure<"dot.preflight_failed", {
    app: {
        file: string;
        exportName: string;
        plugins: number;
        features: number;
    } | null;
    migrations: string[] | null;
    report: {
        [x: string]: unknown;
        status: "failure" | "success" | "warning";
        plugins: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        actions: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        services: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        lifecycle: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        issues: {
            [x: string]: unknown;
            code: string;
        }[];
    } | null;
    failure: {
        code: string;
        message: string;
        data: unknown;
    } | null;
}> | {
    app: {
        file: string;
        exportName: string;
        plugins: number;
        features: number;
    } | null;
    migrations: string[] | null;
    report: {
        [x: string]: unknown;
        status: "failure" | "success" | "warning";
        plugins: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        actions: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        services: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        lifecycle: {
            [x: string]: unknown;
            issues: {
                [x: string]: unknown;
                code: string;
            }[];
        }[];
        issues: {
            [x: string]: unknown;
            code: string;
        }[];
    } | null;
    failure: {
        code: string;
        message: string;
        data: unknown;
    } | null;
}>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=preflight.d.ts.map