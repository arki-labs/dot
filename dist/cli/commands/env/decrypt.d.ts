/** `dot env decrypt`: decrypt values in place. Refused on a tracked file unless `--force`. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    env: z.ZodOptional<z.ZodString>;
    file: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    key: z.ZodOptional<z.ZodArray<z.ZodString>>;
    force: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>, import("@arki/failure").Failure<"dot.env_decrypt_tracked", {
    file: string;
}> | import("@arki/failure").Failure<"dot.env_load_failed", {
    errors: {
        code: string;
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}> | import("@arki/failure").Failure<"dot.env_no_change", {
    file: string;
    reason: string;
}> | import("@arki/failure").Failure<"env.decryption_failed", undefined> | import("@arki/failure").Failure<"env.file_read_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.file_write_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.unrepresentable_value", undefined> | import("@arki/failure").Failure<"schema.async_required", undefined> | import("@arki/failure").Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | {
    file: string;
    decrypted: string[];
}, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=decrypt.d.ts.map