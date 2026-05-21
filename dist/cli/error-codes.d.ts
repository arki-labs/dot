/**
 * Stable error codes used by the DOT CLI.
 *
 * Every code starts with `DOT_CLI_E` so it can be visually distinguished from
 * lifecycle errors (`DOT_LIFECYCLE_E*`). Codes are part of the public contract
 * — agents grep on them to branch behaviour. Do not renumber.
 */
export declare const DotCliErrorCode: {
    /** No app file could be discovered at the cwd and `--app` was not provided. */
    readonly AppNotFound: "DOT_CLI_E001";
    /** App file was located but its default export is not a DotApp/DotAppBuilder. */
    readonly AppInvalidExport: "DOT_CLI_E002";
    /** Importing the app file threw an exception. */
    readonly AppImportFailed: "DOT_CLI_E003";
    /** Unknown CLI command. */
    readonly UnknownCommand: "DOT_CLI_E004";
    /** CLI args were malformed. */
    readonly InvalidArgs: "DOT_CLI_E005";
    /** Configure or boot threw while preparing the app for inspection. */
    readonly AppLifecycleFailed: "DOT_CLI_E006";
    /** `dot doctor --observability` ran but no OTel SDK is registered. */
    readonly ObservabilityNoSdk: "DOT_CLI_E007";
};
export type DotCliErrorCodeValue = (typeof DotCliErrorCode)[keyof typeof DotCliErrorCode];
/**
 * Anchors on the CLI docs page. Kept here so both the renderers and tests can
 * reference the same URL without drift.
 */
export declare const DotCliDocsAnchor: Record<DotCliErrorCodeValue, string>;
export declare function dotCliDocsUrl(code: DotCliErrorCodeValue): string;
/**
 * Structured CLI error. Carries enough metadata to be rendered as a JSON
 * envelope or a human-readable diagnostic line.
 */
export declare class DotCliError extends Error {
    readonly code: DotCliErrorCodeValue;
    readonly remediation: string;
    readonly docsUrl: string;
    readonly metadata?: Record<string, unknown>;
    readonly cause?: unknown;
    constructor(args: {
        code: DotCliErrorCodeValue;
        message: string;
        remediation: string;
        metadata?: Record<string, unknown>;
        cause?: unknown;
    });
}
//# sourceMappingURL=error-codes.d.ts.map