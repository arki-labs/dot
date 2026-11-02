import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    env: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, import("@arki/failure").Failure<"dot.env_no_change", {
    file: string;
    reason: string;
}> | import("@arki/failure").Failure<"env.decryption_failed", undefined> | import("@arki/failure").Failure<"env.encryption_failed", undefined> | import("@arki/failure").Failure<"env.file_read_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.file_write_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.key_generation_failed", undefined> | import("@arki/failure").Failure<"env.missing_private_key", {
    file: string;
}> | import("@arki/failure").Failure<"env.rotation_incomplete", {
    keysFile: string;
    completedFiles: number;
    totalFiles: number;
}> | import("@arki/failure").Failure<"env.unrepresentable_value", undefined> | import("@arki/failure").Failure<"schema.async_required", undefined> | import("@arki/failure").Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | {
    privateKeyName: string;
    files: {
        file: string;
        values: number;
    }[];
    keysFile: string;
    next: string[];
}, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=rotate.d.ts.map