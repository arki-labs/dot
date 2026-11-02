/**
 * The failures `dot env` returns. Each code is stable: agents branch on `.error.code`. Messages
 * name keys and files, never a value. Data schemas are Zod (A-39: schemas own validation).
 */
import { z } from 'zod';
declare const finding: z.ZodObject<{
    code: z.ZodString;
    severity: z.ZodEnum<{
        error: "error";
        warning: "warning";
    }>;
    message: z.ZodString;
    remediation: z.ZodString;
    file: z.ZodOptional<z.ZodString>;
    key: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** One `dot env check` finding. */
export type EnvFinding = z.output<typeof finding>;
/**
 * `dot env check` found at least one error.
 * @fix Work through `.error.data.findings`; each has its own `remediation`.
 * @verify dot env check --json | jq -e .ok
 */
export declare const EnvCheckFailed: import("@arki/failure").FailureDefinition<"dot.env_check_failed", import("@standard-schema/spec").StandardSchemaV1<{
    findings: {
        code: string;
        severity: "error" | "warning";
        message: string;
        remediation: string;
        file?: string | undefined;
        key?: string | undefined;
    }[];
}, {
    findings: {
        code: string;
        severity: "error" | "warning";
        message: string;
        remediation: string;
        file?: string | undefined;
        key?: string | undefined;
    }[];
}>>;
/**
 * The env files could not be loaded: a private key is missing, a value cannot be decrypted, or a reference cannot be resolved.
 * @fix Follow the message of each entry in `.error.data.errors` (codes `ARKI_ENV_FILES_E00x`).
 * @verify dot env check --json | jq -e .ok
 */
export declare const EnvLoadFailed: import("@arki/failure").FailureDefinition<"dot.env_load_failed", import("@standard-schema/spec").StandardSchemaV1<{
    errors: {
        code: string;
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}, {
    errors: {
        code: string;
        message: string;
        file: string;
        key?: string | undefined;
    }[];
}>>;
/**
 * The command would write nothing: the value is already there, or there was nothing to encrypt or decrypt.
 * @fix Read `.error.data.reason`; a variable exported in the shell does not change the file.
 * @verify dot env ls --json
 */
export declare const EnvNoChange: import("@arki/failure").FailureDefinition<"dot.env_no_change", import("@standard-schema/spec").StandardSchemaV1<{
    file: string;
    reason: string;
}, {
    file: string;
    reason: string;
}>>;
/**
 * The file has no dotenvx public key header, so values cannot be encrypted into it.
 * @fix Run `dot env init` with the same `--env`/`--file`.
 * @verify dot env ls --json
 */
export declare const EnvNoHeader: import("@arki/failure").FailureDefinition<"dot.env_no_header", import("@standard-schema/spec").StandardSchemaV1<{
    file: string;
}, {
    file: string;
}>>;
/**
 * `--plain` was asked for a key the env schema declares with `secret()`.
 * @fix Drop `--plain`: a secret must be encrypted in a tracked file.
 * @verify dot env check --json | jq -e .ok
 */
export declare const EnvPlainSecret: import("@arki/failure").FailureDefinition<"dot.env_plain_secret", import("@standard-schema/spec").StandardSchemaV1<{
    key: string;
}, {
    key: string;
}>>;
/**
 * The key is in none of the loaded env files.
 * @fix Check the name and `--env`; `dot env ls` lists the keys.
 * @verify dot env ls --json
 */
export declare const EnvKeyNotFound: import("@arki/failure").FailureDefinition<"dot.env_key_not_found", import("@standard-schema/spec").StandardSchemaV1<{
    key: string;
    environment: string;
}, {
    key: string;
    environment: string;
}>>;
/**
 * A value was asked for where it would leave the terminal (a pipe, a file, an agent's transcript).
 * @fix Run `dot env get <KEY> --reveal` in an interactive terminal, or `dot env run -- <cmd>` to hand values to a process.
 * @verify dot env get <KEY> --json
 */
export declare const EnvRevealRefused: import("@arki/failure").FailureDefinition<"dot.env_reveal_refused", import("@standard-schema/spec").StandardSchemaV1<{
    key: string;
}, {
    key: string;
}>>;
/**
 * Decrypting a tracked file would put plaintext secrets one `git add` away from a commit.
 * @fix Pass `--force` if you really mean it, and do not commit the result.
 * @verify git diff --stat
 */
export declare const EnvDecryptTracked: import("@arki/failure").FailureDefinition<"dot.env_decrypt_tracked", import("@standard-schema/spec").StandardSchemaV1<{
    file: string;
}, {
    file: string;
}>>;
/**
 * The value came from both a positional argument and `--stdin`, or from neither.
 * @fix Give exactly one: `dot env set KEY value`, or `printf %s "$VALUE" | dot env set KEY --stdin`.
 * @verify dot env ls --json
 */
export declare const EnvValueMissing: import("@arki/failure").FailureDefinition<"dot.env_value_missing", import("@standard-schema/spec").StandardSchemaV1<{
    key: string;
}, {
    key: string;
}>>;
/**
 * The command after `--` could not be started.
 * @fix Check the command name and PATH.
 * @verify dot env run -- node --version
 */
export declare const EnvCommandFailed: import("@arki/failure").FailureDefinition<"dot.env_command_failed", import("@standard-schema/spec").StandardSchemaV1<{
    command: string;
    reason: string;
}, {
    command: string;
    reason: string;
}>>;
/**
 * The 1Password CLI (`op`) failed or is not signed in.
 * @fix Install `op`, sign in (`op signin`), and check the vault name.
 * @verify op vault list
 */
export declare const EnvVaultFailed: import("@arki/failure").FailureDefinition<"dot.env_vault_failed", import("@standard-schema/spec").StandardSchemaV1<{
    reason: string;
}, {
    reason: string;
}>>;
/**
 * A vault write was attempted but its result was not confirmed.
 * @fix Read the item from 1Password before retrying; the write may already have completed.
 * @verify dot env keys push --vault <vault> --json
 */
export declare const EnvVaultWriteUnconfirmed: import("@arki/failure").FailureDefinition<"dot.env_vault_write_unconfirmed", import("@standard-schema/spec").StandardSchemaV1<{
    operation: "create" | "edit";
}, {
    operation: "create" | "edit";
}>>;
export {};
//# sourceMappingURL=env-failures.d.ts.map