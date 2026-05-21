/**
 * Stable error codes used by the DOT CLI.
 *
 * Every code starts with `DOT_CLI_E` so it can be visually distinguished from
 * lifecycle errors (`DOT_LIFECYCLE_E*`). Codes are part of the public contract
 * — agents grep on them to branch behaviour. Do not renumber.
 */
export const DotCliErrorCode = {
    /** No app file could be discovered at the cwd and `--app` was not provided. */
    AppNotFound: 'DOT_CLI_E001',
    /** App file was located but its default export is not a DotApp/DotAppBuilder. */
    AppInvalidExport: 'DOT_CLI_E002',
    /** Importing the app file threw an exception. */
    AppImportFailed: 'DOT_CLI_E003',
    /** Unknown CLI command. */
    UnknownCommand: 'DOT_CLI_E004',
    /** CLI args were malformed. */
    InvalidArgs: 'DOT_CLI_E005',
    /** Configure or boot threw while preparing the app for inspection. */
    AppLifecycleFailed: 'DOT_CLI_E006',
    /** `dot doctor --observability` ran but no OTel SDK is registered. */
    ObservabilityNoSdk: 'DOT_CLI_E007',
};
const DOCS_BASE = 'https://docs.arki.dev/dot/cli';
/**
 * Anchors on the CLI docs page. Kept here so both the renderers and tests can
 * reference the same URL without drift.
 */
export const DotCliDocsAnchor = {
    [DotCliErrorCode.AppNotFound]: 'app-not-found',
    [DotCliErrorCode.AppInvalidExport]: 'app-invalid-export',
    [DotCliErrorCode.AppImportFailed]: 'app-import-failed',
    [DotCliErrorCode.UnknownCommand]: 'unknown-command',
    [DotCliErrorCode.InvalidArgs]: 'invalid-args',
    [DotCliErrorCode.AppLifecycleFailed]: 'app-lifecycle-failed',
    [DotCliErrorCode.ObservabilityNoSdk]: 'observability-no-sdk',
};
export function dotCliDocsUrl(code) {
    return `${DOCS_BASE}#${DotCliDocsAnchor[code]}`;
}
/**
 * Structured CLI error. Carries enough metadata to be rendered as a JSON
 * envelope or a human-readable diagnostic line.
 */
export class DotCliError extends Error {
    code;
    remediation;
    docsUrl;
    metadata;
    cause;
    constructor(args) {
        super(args.message);
        this.name = 'DotCliError';
        this.code = args.code;
        this.remediation = args.remediation;
        this.docsUrl = dotCliDocsUrl(args.code);
        this.metadata = args.metadata;
        this.cause = args.cause;
    }
}
//# sourceMappingURL=error-codes.js.map