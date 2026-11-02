import { z } from 'zod';
import type { EnvDescription } from '@arki/env/core';
/** The flags every `dot env` command shares. */
export declare const envTargetInput: {
    env: z.ZodOptional<z.ZodString>;
    file: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
};
/** The resolved target of a command. */
export type EnvTarget = {
    readonly cwd: string;
    readonly root: string;
    readonly environment: string;
    readonly file: string;
};
/** Resolve the flags into absolute paths and an environment name. */
export declare function resolveTarget(input: {
    readonly env?: string | undefined;
    readonly file?: string | undefined;
    readonly cwd?: string | undefined;
}): EnvTarget;
/** `file` relative to `root`, for messages and JSON. */
export declare function relative(root: string, file: string): string;
/**
 * What git says about the repository: a list, or why it could not answer. Outside a git repository
 * nothing is tracked (an empty list); inside one, a failing git is `unknown`, never "nothing tracked",
 * so a check that depends on it fails closed.
 */
export type GitAnswer<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly reason: string;
};
/** The files among `files` that git tracks. Files outside `root` are never tracked. */
export declare function trackedFiles(root: string, files: readonly string[]): GitAnswer<ReadonlySet<string>>;
/** Every file in the repository (tracked or not ignored) whose name is `name`. */
export declare function filesNamed(root: string, name: string): GitAnswer<readonly string[]>;
/** Tracked files whose name starts with `.env.keys`: each is a leaked private key. */
export declare function trackedKeyFiles(root: string): GitAnswer<readonly string[]>;
/** The app's env schema, or why it could not be read (`problem`). No module at all is not a problem. */
export type SchemaAnswer = {
    readonly description: EnvDescription | undefined;
    readonly problem?: string;
};
/**
 * The env schema of the app in `cwd`, merged across every `defineEnv` export of its env module
 * (`--schema`, else `src/env.ts`, else `env.ts`). A module that fails to import (Node without
 * TypeScript support, a broken import) is reported in `problem`, never thrown and never silent.
 */
export declare function loadDescription(cwd: string, schema?: string): Promise<SchemaAnswer>;
/** The shape of a value, safe to print: `hex`, `base64`, `url`, `number`, `text`. */
export declare function charClass(value: string): string;
/** All of stdin as text, with one trailing newline removed. */
export declare function readStdin(): Promise<string>;
//# sourceMappingURL=env-files.d.ts.map