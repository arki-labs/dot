import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    vault: z.ZodString;
    force: z.ZodDefault<z.ZodBoolean>;
    env: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, import("@arki/failure").Failure<"dot.env_load_failed", {
    errors: {
        code: string;
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}> | import("@arki/failure").Failure<"dot.env_vault_failed", {
    reason: string;
}> | import("@arki/failure").Failure<"dot.env_vault_write_unconfirmed", {
    operation: "create" | "edit";
}> | import("@arki/failure").Failure<"env.file_read_failed", {
    file: string;
}> | import("@arki/failure").Failure<"schema.async_required", undefined> | import("@arki/failure").Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | {
    vault: string;
    item: string;
    replaced: boolean;
}, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=keys-push.d.ts.map