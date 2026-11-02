import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    resolve: z.ZodDefault<z.ZodBoolean>;
    schema: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<import("@arki/failure").Failure<"dot.env_check_failed", {
    findings: {
        code: string;
        severity: "error" | "warning";
        message: string;
        remediation: string;
        file?: string | undefined;
        key?: string | undefined;
    }[];
}> | import("@arki/failure").Failure<"env.cancelled", undefined> | import("@arki/failure").Failure<"env.deadline", undefined> | import("@arki/failure").Failure<"env.files_failed", {
    environment: string;
    errors: {
        code: "env.cancelled" | "env.deadline" | "env.decryption_failed" | "env.file_read_failed" | "env.missing_private_key" | "env.reference_failed";
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}> | {
    ok: boolean;
    environment: string;
    files: string[];
    findings: {
        code: string;
        severity: "error" | "warning";
        message: string;
        remediation: string;
        file?: string | undefined;
        key?: string | undefined;
    }[];
}>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=check.d.ts.map