/**
 * `dot new <app>` — scaffold a DOT app from a bundled template.
 *
 * Two templates ship with the package (`--template <name>`):
 *
 *   - `stack` (default) — a full-stack app: TanStack Start + oRPC +
 *     Drizzle/Postgres via `@arki/db` + `@arki/journal`, composed with
 *     `@arki/dot`, styled with `@arki/ui` and the workbench design system.
 *   - `minimal` — the smallest DOT app: `defineApp` + `@arki/env`.
 *
 * Two-phase: we first build an in-memory list of {@link FileOperation}
 * entries describing every file the scaffold WOULD write (template
 * substitution included), then either:
 *
 *   - `--dry-run` -> return the plan, write nothing.
 *   - real run    -> commit the planned operations to disk.
 *
 * The dry-run result is the contract: agents read `.data.operations[]` to
 * know exactly which files will land, with sha256 hashes so they can verify
 * the post-run filesystem matches the plan.
 *
 * Templates live at `packages/dot/templates/app-<name>/` and use
 * `.tmpl` suffixes + `{{name}}`-style placeholders. The suffix is
 * stripped during scaffolding so `package.json.tmpl` becomes
 * `package.json` on disk.
 *
 * Commands deferred to v1.1 (`dot add <unit>`, `dot migrate`) are
 * deliberately NOT surfaced here.
 */
import type { Failure } from '@arki/failure';
import type { FileOperation } from './files.js';
import type { DotNewResult } from './json.js';
/**
 * Package manager the generated README + AGENTS.md will reference.
 * `bun` is the default because the kernel + adapter packages are tested
 * with Bun first.
 */
export type PackageManager = 'npm' | 'pnpm' | 'bun';
/** Template names accepted by `--template`. */
export declare const TEMPLATE_NAMES: readonly ['stack', 'minimal'];
/** A bundled template. */
export type TemplateName = (typeof TEMPLATE_NAMES)[number];
/** The template `dot new` uses when `--template` is omitted. */
export declare const DEFAULT_TEMPLATE: TemplateName;
/** What {@link planOperations} returns: every file the scaffold would write, and where. */
export type NewPlan = {
    readonly operations: FileOperation[];
    readonly target: string;
};
/** Options accepted by {@link runNew}. */
export type RunNewOptions = {
    /** Application name (becomes `package.json#name`). */
    readonly name: string;
    /**
     * Working directory for resolving `--target`. Defaults to
     * `process.cwd()` when omitted.
     */
    readonly cwd?: string;
    /**
     * Target directory; resolved against `cwd`. Defaults to `<name>`
     * under `cwd`. The directory is created if missing.
     */
    readonly target?: string;
    /** Package manager hint surfaced in README/AGENTS.md. Defaults to `bun`. */
    readonly pm?: PackageManager;
    /**
     * Bundled template to scaffold (`stack` or `minimal`). Defaults to
     * {@link DEFAULT_TEMPLATE}. Any other value fails with `cli.invalid_input`.
     */
    readonly template?: string;
    /** When true, only plan operations — write nothing. */
    readonly dryRun?: boolean;
    /** When true, overwrite existing files in the target dir. */
    readonly force?: boolean;
    /**
     * Override template root. Used by tests; production callers should
     * leave this undefined so the bundled `templates/app-<template>/`
     * directory is used.
     */
    readonly templateRoot?: string;
    /**
     * Version values inlined into the generated `package.json`. `dot`
     * defaults to this package's own version; the others default to
     * {@link TEMPLATE_VERSIONS} (see `versions.ts`).
     */
    readonly versions?: {
        readonly dot?: string;
        readonly env?: string;
        readonly zod?: string;
        readonly log?: string;
        readonly db?: string;
        readonly journal?: string;
        readonly failure?: string;
        readonly ui?: string;
    };
};
export declare const DEFAULT_PM: PackageManager;
/**
 * The template a `--template` value names: omitted means
 * {@link DEFAULT_TEMPLATE}; an unknown name is `undefined`.
 */
export declare function resolveTemplateName(value: string | undefined): TemplateName | undefined;
/**
 * Resolve the absolute target path for a given app + options bundle.
 * Exported so tests can assert resolution behaviour without running the
 * full scaffold.
 */
export declare function resolveTargetDir(opts: {
    name: string;
    cwd?: string;
    target?: string;
}): string;
/**
 * What is wrong with an app name, or `undefined` when it is valid. Rules
 * match `package.json#name` constraints (lower-case, leading alphanumeric,
 * no spaces) with one extra: scoped names are refused so the scaffold
 * produces a single-segment dir. The `name` schema of `dot new` calls it.
 */
export declare function validateAppName(name: string): string | undefined;
/**
 * Plan the file operations for a scaffold run. Pure — does not touch
 * disk other than reading templates and `stat`-ing target paths.
 */
export declare function planOperations(opts: RunNewOptions): Promise<NewPlan | Failure>;
/**
 * Run `dot new`: plan, then write unless `dryRun`. Returns `{ app, operations }`
 * or a failure: `cli.invalid_input` (name, template), `dot.target_not_empty`,
 * `dot.template_missing`, `dot.write_failed`. Prints nothing.
 */
export declare function runNew(opts: RunNewOptions): Promise<DotNewResult | Failure>;
//# sourceMappingURL=new.d.ts.map