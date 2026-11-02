/** `dot env ls`: every key, where it comes from, and how it is stored. Never a value. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    schema: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, Promise<import("@arki/failure").Failure<"env.cancelled", undefined> | import("@arki/failure").Failure<"env.deadline", undefined> | import("@arki/failure").Failure<"env.files_failed", {
    environment: string;
    errors: {
        code: "env.cancelled" | "env.deadline" | "env.decryption_failed" | "env.file_read_failed" | "env.missing_private_key" | "env.reference_failed";
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}> | {
    environment: string;
    files: string[];
    keys: {
        key: string;
        kind: import("@arki/env/node").EnvValueKind;
        file: string;
        line: number;
        secret: boolean;
        source: string;
    }[];
}>, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=ls.d.ts.map