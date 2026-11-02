/** `dot env get KEY`: the shape of a value; the value itself only with `--reveal` on a terminal. */
import { z } from 'zod';
declare const _default: import("@arki/cli").Command<z.ZodObject<{
    key: z.ZodString;
    reveal: z.ZodDefault<z.ZodBoolean>;
    env: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, import("@arki/failure").Failure<"dot.env_key_not_found", {
    key: string;
    environment: string;
}> | import("@arki/failure").Failure<"dot.env_load_failed", {
    errors: {
        code: string;
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}> | import("@arki/failure").Failure<"dot.env_reveal_refused", {
    key: string;
}> | import("@arki/failure").Failure<"env.cancelled", undefined> | import("@arki/failure").Failure<"env.deadline", undefined> | import("@arki/failure").Failure<"env.files_failed", {
    environment: string;
    errors: {
        code: "env.cancelled" | "env.deadline" | "env.decryption_failed" | "env.file_read_failed" | "env.missing_private_key" | "env.reference_failed";
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}> | {
    key: string;
    file: string;
    line: number;
    kind: import("@arki/env/node").EnvValueKind;
    length: number;
    charClass: string;
} | {
    key: string;
    file: string;
    line: number;
    kind: import("@arki/env/node").EnvValueKind;
    length: number;
    charClass: string;
    value: string;
}, Readonly<Record<string, never>>, readonly []>;
export default _default;
//# sourceMappingURL=get.d.ts.map