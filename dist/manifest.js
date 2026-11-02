/**
 * Manifest types for the DOT kernel.
 *
 * A `DotAppManifest` is the static, declarative description of an app: which
 * units are registered, what actions/services/projections they contribute, and how they
 * depend on each other. It is built up during the `configure` phase from
 * registration calls and finalised once `configure` completes.
 *
 * CONTRACT: `DotAppManifest` always exposes the same six top-level arrays
 * (`plugins`, `actions`, `services`, `lifecycle`, `dependencies`,
 * `projections`). Consumers MUST NOT see an omitted array — empty is empty,
 * but never missing.
 */
import { z } from 'zod';
import { isFailure } from '@arki/failure';
import { parse } from '@arki/schema';
import { dotErrorDocsUrl } from './lifecycle.js';
/** Code of {@link DotManifestError}. */
export const DOT_MANIFEST_ERROR_CODE = 'ARKI_DOT_E032';
/** Manifest metadata that is not plain JSON. A `TypeError`, so existing `instanceof TypeError` checks still match. */
export class DotManifestError extends TypeError {
    code = DOT_MANIFEST_ERROR_CODE;
    remediation = 'Pass plain JSON only: no functions, Dates, Maps, class instances, undefined fields, NaN or cycles.';
    docsUrl = dotErrorDocsUrl(DOT_MANIFEST_ERROR_CODE);
    constructor(message, options) {
        super(message, options);
        this.name = 'DotManifestError';
    }
}
/** Rejects a cycle or a BigInt before the schema walks the value: a cycle would never end. */
function assertSerializable(value) {
    let serialized;
    try {
        serialized = JSON.stringify(value);
    }
    catch (error) {
        throw new DotManifestError('Value must be JSON-serializable manifest data.', { cause: error });
    }
    if (serialized === undefined) {
        throw new DotManifestError('Value must be a JSON-serializable object.');
    }
}
/**
 * Plain JSON only: no `undefined`, `NaN`, `Infinity`, `Date`, function or class instance.
 * Zod's `z.json()` has the same shape as {@link JsonValue}.
 */
const jsonObjectSchema = z.record(z.string(), z.json());
/**
 * Validate and narrow unknown adapter data into manifest JSON metadata.
 *
 * A schema checks the value itself, so dates, functions, undefined fields, NaN,
 * Infinity, class instances, and cycles fail instead of being silently
 * coerced in `dot explain --json`.
 */
export function toJsonObject(value) {
    assertSerializable(value);
    const parsed = parse(jsonObjectSchema, value);
    if (isFailure(parsed)) {
        throw new DotManifestError('Value must be a JSON-serializable object without lossy coercions.', {
            cause: parsed,
        });
    }
    return parsed;
}
//# sourceMappingURL=manifest.js.map