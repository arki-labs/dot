import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    vault: z.ZodString;
    env: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, import("@arki/failure").Failure<"dot.env_vault_failed", {
    reason: string;
}> | import("@arki/failure").Failure<"env.file_read_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.file_write_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.unrepresentable_value", undefined> | import("@arki/failure").Failure<"schema.async_required", undefined> | import("@arki/failure").Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | {
    vault: string;
    item: string;
    keysFile: string;
}, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=keys-pull.d.ts.map