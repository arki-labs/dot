/** `dot env set KEY [VALUE]`: write one value, encrypted unless `--plain`. Needs only the public key. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    env: z.ZodOptional<z.ZodString>;
    file: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    key: z.ZodString;
    value: z.ZodOptional<z.ZodString>;
    stdin: z.ZodDefault<z.ZodBoolean>;
    plain: z.ZodDefault<z.ZodBoolean>;
    schema: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<import("@arki/failure").Failure<"dot.env_no_change", {
    file: string;
    reason: string;
}> | import("@arki/failure").Failure<"dot.env_no_header", {
    file: string;
}> | import("@arki/failure").Failure<"dot.env_plain_secret", {
    key: string;
}> | import("@arki/failure").Failure<"dot.env_value_missing", {
    key: string;
}> | import("@arki/failure").Failure<"env.encryption_failed", undefined> | import("@arki/failure").Failure<"env.file_read_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.file_write_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.missing_public_key", {
    file: string;
}> | import("@arki/failure").Failure<"env.unrepresentable_value", undefined> | import("@arki/failure").Failure<"schema.async_required", undefined> | import("@arki/failure").Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | {
    file: string;
    key: string;
    stored: string;
    shadowedByShell: boolean;
}>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=set.d.ts.map