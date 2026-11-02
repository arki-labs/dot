import { z } from 'zod';
export declare function vaultItemTitle(root: string, environment: string): string;
declare const passwordItem: z.ZodObject<{
    id: z.core.$ZodBranded<z.ZodString, "VaultItemId", "out">;
    title: z.ZodString;
    category: z.ZodLiteral<"PASSWORD">;
    fields: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        value: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
}, z.core.$loose>;
/** Reads have a bounded native-child lifetime; provider diagnostics remain private. */
export declare function op(args: readonly string[]): string | import("@arki/failure").Failure<"dot.env_vault_failed", {
    reason: string;
}>;
/** Only a successful, valid list confirms absence. A title never selects a mutation target. */
export declare function readVaultItem(vault: string, title: string): import("@arki/failure").Failure<"dot.env_vault_failed", {
    reason: string;
}> | {
    [x: string]: unknown;
    id: string & z.$brand<"VaultItemId">;
    title: string;
    category: "PASSWORD";
    fields: {
        [x: string]: unknown;
        id: string;
        type: string;
        purpose?: string | undefined;
        value?: string | undefined;
    }[];
} | undefined;
/** Write once. Lost/rejected acknowledgments require a fresh provider read before any replay. */
export declare function writeVaultItem(vault: string, title: string, privateKey: string, existing: z.output<typeof passwordItem> | undefined): import("@arki/failure").Failure<"dot.env_vault_write_unconfirmed", {
    operation: "create" | "edit";
}> | {
    [x: string]: unknown;
    id: string & z.$brand<"VaultItemId">;
    title: string;
    category: "PASSWORD";
    fields: {
        [x: string]: unknown;
        id: string;
        type: string;
        purpose?: string | undefined;
        value?: string | undefined;
    }[];
};
export {};
//# sourceMappingURL=keys-shared.d.ts.map