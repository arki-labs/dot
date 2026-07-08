/**
 * Manifest types for the DOT kernel.
 *
 * A `DotAppManifest` is the static, declarative description of an app: which
 * plugins are registered, what actions/services/projections they contribute, and how they
 * depend on each other. It is built up during the `configure` phase from
 * registration calls and finalised once `configure` completes.
 *
 * CONTRACT: `DotAppManifest` always exposes the same six top-level arrays
 * (`plugins`, `actions`, `services`, `lifecycle`, `dependencies`,
 * `projections`). Consumers MUST NOT see an omitted array — empty is empty,
 * but never missing.
 */
function jsonRoundTrip(value) {
    let serialized;
    try {
        serialized = JSON.stringify(value);
    }
    catch (error) {
        throw new TypeError('Value must be JSON-serializable manifest data.', { cause: error });
    }
    if (serialized === undefined) {
        throw new TypeError('Value must be a JSON-serializable object.');
    }
    return JSON.parse(serialized);
}
function isJsonPrimitive(value) {
    return value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number';
}
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function isJsonValue(value) {
    if (isJsonPrimitive(value))
        return typeof value !== 'number' || Number.isFinite(value);
    if (Array.isArray(value))
        return value.every(isJsonValue);
    if (!isPlainObject(value))
        return false;
    return Object.values(value).every(isJsonValue);
}
function isJsonObject(value) {
    return isPlainObject(value) && Object.values(value).every(isJsonValue);
}
function jsonDeepEqual(left, right) {
    if (isJsonPrimitive(left) || isJsonPrimitive(right))
        return Object.is(left, right);
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length)
            return false;
        return left.every((value, index) => jsonDeepEqual(value, right[index]));
    }
    if (!isPlainObject(left) || !isPlainObject(right))
        return false;
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);
    if (leftEntries.length !== rightEntries.length)
        return false;
    for (const [key, value] of leftEntries) {
        if (!Object.hasOwn(right, key) || !jsonDeepEqual(value, right[key]))
            return false;
    }
    return true;
}
/**
 * Validate and narrow unknown adapter data into manifest JSON metadata.
 *
 * The check intentionally compares the original value against a
 * JSON.stringify/parse round trip. Dates, functions, undefined fields, NaN,
 * Infinity, class instances, and cycles fail instead of being silently
 * coerced in `dot explain --json`.
 */
export function toJsonObject(value) {
    const parsed = jsonRoundTrip(value);
    if (!isJsonObject(parsed) || !jsonDeepEqual(value, parsed)) {
        throw new TypeError('Value must be a JSON-serializable object without lossy coercions.');
    }
    return parsed;
}
//# sourceMappingURL=manifest.js.map