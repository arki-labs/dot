/**
 * Filesystem helpers for the `dot new` scaffold.
 *
 * Kept deliberately small and dependency-free so the scaffolding code path
 * stays auditable. The scaffold first builds an in-memory list of
 * {@link FileOperation} entries describing every file it WOULD write, then
 * either prints them (`--dry-run`) or commits them to disk.
 */
/**
 * Action the generator will take for a particular file.
 *
 * - `create` — file does not yet exist at the target path.
 * - `overwrite` — file exists; the generator will replace it (only when
 *   `--force` was passed).
 * - `skip` — file exists and the generator refuses to overwrite without
 *   `--force`. Surfaced in dry-run output and converted to a failure on
 *   real runs.
 */
export type FileOperationAction = 'create' | 'overwrite' | 'skip';
/**
 * Description of a single file the scaffold plans to emit.
 *
 * `path` is always relative to the target directory so the envelope is
 * portable across machines. `contentHash` is sha256 of the rendered bytes
 * — agents can use it to confirm the file we wrote matches the file we
 * planned.
 */
export type FileOperation = {
    readonly path: string;
    readonly action: FileOperationAction;
    readonly contentHash: string;
    readonly contentBytes: number;
    readonly reason: string;
    /**
     * Rendered file contents. Internal to the generator — NOT emitted in the
     * JSON envelope. Kept on the in-memory plan so a non-dry-run can write
     * the same bytes that produced `contentHash`.
     */
    readonly content: string;
};
/**
 * Walk a template directory and return the relative paths of every file.
 *
 * Subdirectories are descended into; symlinks and non-regular files are
 * ignored. Paths are returned without a leading separator and are sorted
 * lexicographically for deterministic output.
 */
export declare function collectTemplateFiles(root: string): Promise<string[]>;
/** Compute the sha256 hex digest of a string payload (utf-8 encoded). */
export declare function sha256(content: string): string;
/** Byte length of a utf-8 string. Wrapper exists so the call site is obvious. */
export declare function utf8ByteLength(content: string): number;
/** Return `true` when a regular file exists at the given path. */
export declare function fileExists(filePath: string): Promise<boolean>;
/** Return `true` when a directory exists and contains at least one entry. */
export declare function directoryIsNonEmpty(dirPath: string): Promise<boolean>;
/**
 * Write a single file, creating parent directories as needed.
 */
export declare function writeFileEnsuringDir(filePath: string, content: string): Promise<void>;
/**
 * Read a template file from disk. Trivially thin wrapper around
 * `fs.readFile`, but exists so the scaffold imports stay symmetric with
 * its helpers.
 */
export declare function readTemplate(filePath: string): Promise<string>;
//# sourceMappingURL=files.d.ts.map