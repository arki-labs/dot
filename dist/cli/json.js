/**
 * JSON envelope shapes for the `dot new` command.
 *
 * The envelope mirrors `DotCliEnvelope` in spirit but exposes the
 * scaffold-specific `app` + `operations` payload directly at the top level
 * so consumers don't have to dig under a generic `data` field.
 */
/** Strip the in-memory `content` field before serialising. */
export function toPublicOperation(op) {
    return {
        path: op.path,
        action: op.action,
        contentHash: op.contentHash,
        contentBytes: op.contentBytes,
        reason: op.reason,
    };
}
//# sourceMappingURL=json.js.map