import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    command: z.ZodArray<z.ZodString>;
    redact: z.ZodOptional<z.ZodBoolean>;
    env: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<number | import("@arki/failure").Failure<"dot.env_command_failed", {
    command: string;
    reason: string;
}> | import("@arki/failure").Failure<"env.cancelled", undefined> | import("@arki/failure").Failure<"env.deadline", undefined> | import("@arki/failure").Failure<"env.file_read_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.files_failed", {
    environment: string;
    errors: {
        code: "env.cancelled" | "env.deadline" | "env.decryption_failed" | "env.file_read_failed" | "env.missing_private_key" | "env.reference_failed";
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}> | import("@arki/failure").Failure<"schema.async_required", undefined> | import("@arki/failure").Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | import("@arki/failure").Failure<"schema.validator_defect", undefined>>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=run.d.ts.map