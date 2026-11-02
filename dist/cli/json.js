/**
 * The `data` shape of `dot new`: the app and the file operations, without
 * the in-memory file contents.
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