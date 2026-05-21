/**
 * Public pip contract for the DOT kernel.
 *
 * A `DotPip` is a plain object with a name, optional dependency list, and
 * up to five lifecycle hooks. The kernel calls each hook in dependency order
 * (or reverse-dependency order for `stop`/`dispose`).
 *
 * Design constraints:
 *
 *  - `configure` is SYNC. Returning a Promise is an error — the kernel will
 *    throw {@link DotLifecycleError} with code `DOT_LIFECYCLE_E001`.
 *  - `boot` may publish services into the app; downstream pips see them via
 *    {@link DotBootContext.services}.
 *  - `stop` and `dispose` continue through individual pip failures and
 *    report an aggregate error.
 */
/**
 * Type-narrowing helper for pip authors.
 *
 * @example
 * export const myPip = defineDotPip<{ db: MyDb }>({
 *   name: 'my-pip',
 *   async boot() {
 *     const db = await openDb();
 *     return { services: { db } };
 *   },
 *   async dispose({ services }) {
 *     await services.db.close();
 *   },
 * });
 */
export function defineDotPip(pip) {
    return pip;
}
/** Internal helper: extract the `provides` field from a pip (always returns an array). */
export function pipProvides(pip) {
    return pip.provides ?? [];
}
/** Internal helper: extract the `dependencies` field from a pip (always returns an array). */
export function pipDependencies(pip) {
    return pip.dependencies ?? [];
}
/**
 * Stable error thrown by DOT pip adapters.
 *
 * Adapters MUST throw `DotPipError` (not raw `Error`) when surfacing a
 * misconfiguration, missing-input, or other fail-fast condition. Consumers
 * and coding agents can then match on a stable `code`, follow `docsUrl`,
 * and apply `remediation` without parsing the message.
 *
 * Codes are per-adapter. Recommended prefix is `<PKG>_PIP_E<NNN>` (e.g.
 * `KV_PIP_E001`, `DB_PIP_E001`). The kernel does not own the code
 * namespace — each adapter defines its own constants and links them in
 * its README.
 *
 * @see packages/dot/docs/principles.md — principle 1.3 ("errors are part
 * of the API") and principle 4 ("agent-discoverable everywhere").
 *
 * @example
 * ```ts
 * import { DotPipError } from '@arki/dot/pip';
 *
 * const KV_PIP_ERROR_CODES = { urlNotConfigured: 'KV_PIP_E001' } as const;
 *
 * throw new DotPipError({
 *   code: KV_PIP_ERROR_CODES.urlNotConfigured,
 *   message: '[kv] KV URL is not configured.',
 *   remediation: 'Pass options.url to kv(...) or set KV_URL in the environment.',
 *   docsUrl: 'https://arki.dev/dot/errors/kv-pip-e001',
 * });
 * ```
 */
export class DotPipError extends Error {
    /** Stable error code, e.g. `KV_PIP_E001`. */
    code;
    /** One-sentence guidance on how to fix the underlying problem. */
    remediation;
    /** URL of the documentation page that explains this error. */
    docsUrl;
    constructor(args) {
        super(args.message);
        this.name = 'DotPipError';
        this.code = args.code;
        this.remediation = args.remediation;
        this.docsUrl = args.docsUrl;
    }
}
/** Re-exported for downstream typing. */
export {} from './manifest.js';
//# sourceMappingURL=pip-contract.js.map