import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    env: z.ZodOptional<z.ZodString>;
    file: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, import("@arki/failure").Failure<"env.file_read_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.file_write_failed", {
    file: string;
}> | import("@arki/failure").Failure<"env.key_generation_failed", undefined> | import("@arki/failure").Failure<"env.unrepresentable_value", undefined> | import("@arki/failure").Failure<"schema.async_required", undefined> | import("@arki/failure").Failure<"schema.invalid_input", {
    issues: readonly import("@standard-schema/spec").StandardSchemaV1.Issue[];
}> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | {
    file: string;
    publicKey: import("@arki/env/node").EnvPublicKey;
    headerAdded: boolean;
    keysWritten: string | null;
    gitignore: "added" | "present";
    agentDeny: "added" | "no-settings" | "present";
}, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=init.d.ts.map