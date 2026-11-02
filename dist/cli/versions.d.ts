/**
 * Versions the CLI reports and inlines into scaffolded apps.
 *
 * `@arki/dot` itself is read from this package's own `package.json`, so
 * `dot --version` and the scaffolded `@arki/dot` dependency always match
 * the installed CLI. It works from `src/cli/` (Bun, tests) and from
 * `dist/cli/` (published bin): both sit two levels below the package root.
 *
 * Every other `@arki/*` package a template depends on is pinned in
 * {@link TEMPLATE_VERSIONS}. A test in `new.test.ts` fails when one of these
 * falls behind the workspace `package.json` of that package, so a release
 * that bumps a dependency also has to refresh this table.
 */
/** Read `version` from `@arki/dot`'s own package.json. */
export declare function readDotVersion(): string;
/**
 * Lowest published version of each `@arki/*` dependency the templates use.
 * Keys are the package names without the `@arki/` scope; the template
 * placeholder is `{{<camelCaseKey>Version}}` (see `new.ts`).
 */
export declare const TEMPLATE_VERSIONS: {
    readonly env: '0.2.0';
    readonly log: '0.4.0';
    readonly db: '0.5.0';
    readonly journal: '0.4.0';
    readonly failure: '0.3.0';
    readonly ui: '0.2.0';
};
/** Third-party versions the templates inline through a placeholder. */
export declare const ZOD_VERSION = "4.6.5";
//# sourceMappingURL=versions.d.ts.map