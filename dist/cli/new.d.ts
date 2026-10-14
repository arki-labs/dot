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
 *   - `--dry-run` -> print the JSON envelope, write nothing.
 *   - real run    -> commit the planned operations to disk.
 *
 * The dry-run envelope is the contract: agents read it to know exactly
 * which files will land, with sha256 hashes so they can verify the
 * post-run filesystem matches the plan.
 *
 * Templates live at `packages/dot/templates/app-<name>/` and use
 * `.tmpl` suffixes + `{{name}}`-style placeholders. The suffix is
 * stripped during scaffolding so `package.json.tmpl` becomes
 * `package.json` on disk.
 *
 * Commands deferred to v1.1 (`dot add <plugin>`, `dot dev`,
 * `dot migrate`) are deliberately NOT surfaced here.
 */
import type { FileOperation } from './files.js';
import type { DotNewEnvelope } from './json.js';
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
     * {@link DEFAULT_TEMPLATE}. Any other value fails with `DOT_CLI_E005`.
     */
    readonly template?: string;
    /** When true, only plan operations — write nothing. */
    readonly dryRun?: boolean;
    /** When true, emit JSON to `out`. Otherwise emit progress lines. */
    readonly json?: boolean;
    /** When true, overwrite existing files in the target dir. */
    readonly force?: boolean;
    /** Stdout sink. Defaults to `process.stdout.write`. */
    readonly out?: (line: string) => void;
    /** Stderr sink. Defaults to `process.stderr.write`. */
    readonly err?: (line: string) => void;
    /** Override clock for deterministic envelopes. */
    readonly now?: () => Date;
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
        readonly ui?: string;
        readonly designSystems?: string;
    };
};
/**
 * Validate a `--template` value. Omitted means {@link DEFAULT_TEMPLATE}.
 * Exported so tests can assert the error without running a scaffold.
 */
export declare function resolveTemplateName(value: string | undefined): TemplateName;
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
 * Validate an app name. Rules match `package.json#name` constraints
 * (lower-case, leading alphanumeric, no spaces) with one extra: we
 * disallow scoped names so the scaffold produces a single-segment dir.
 */
export declare function validateAppName(name: string): void;
/**
 * Plan the file operations for a scaffold run. Pure — does not touch
 * disk other than reading templates and `stat`-ing target paths.
 */
export declare function planOperations(opts: RunNewOptions): Promise<{
    operations: FileOperation[];
    target: string;
}>;
/**
 * Run the `new` command. Returns the envelope so callers (CLI + tests)
 * can act on it. Side effects: writes files when not in dry-run mode,
 * emits progress to `out`/`err`.
 */
export declare function runNew(opts: RunNewOptions): Promise<DotNewEnvelope>;
//# sourceMappingURL=new.d.ts.map