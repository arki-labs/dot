/**
 * Filesystem helpers for the `dot new` scaffold.
 *
 * Kept deliberately small and dependency-free so the scaffolding code path
 * stays auditable. The scaffold first builds an in-memory list of
 * {@link FileOperation} entries describing every file it WOULD write, then
 * either prints them (`--dry-run`) or commits them to disk.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
/**
 * Walk a template directory and return the relative paths of every file.
 *
 * Subdirectories are descended into; symlinks and non-regular files are
 * ignored. Paths are returned without a leading separator and are sorted
 * lexicographically for deterministic output.
 */
export async function collectTemplateFiles(root) {
    const out = [];
    async function walk(dir) {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full);
            }
            else if (entry.isFile()) {
                out.push(path.relative(root, full));
            }
        }
    }
    await walk(root);
    out.sort();
    return out;
}
/** Compute the sha256 hex digest of a string payload (utf-8 encoded). */
export function sha256(content) {
    return createHash('sha256').update(content, 'utf8').digest('hex');
}
/** Byte length of a utf-8 string. Wrapper exists so the call site is obvious. */
export function utf8ByteLength(content) {
    return Buffer.byteLength(content, 'utf8');
}
/** Return `true` when a regular file exists at the given path. */
export async function fileExists(filePath) {
    try {
        const result = await stat(filePath);
        return result.isFile();
    }
    catch {
        return false;
    }
}
/** Return `true` when a directory exists and contains at least one entry. */
export async function directoryIsNonEmpty(dirPath) {
    try {
        const entries = await readdir(dirPath);
        return entries.length > 0;
    }
    catch {
        return false;
    }
}
/**
 * Write a single file, creating parent directories as needed.
 */
export async function writeFileEnsuringDir(filePath, content) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
}
/**
 * Read a template file from disk. Trivially thin wrapper around
 * `fs.readFile`, but exists so the scaffold imports stay symmetric with
 * its helpers.
 */
export async function readTemplate(filePath) {
    return readFile(filePath, 'utf8');
}
//# sourceMappingURL=files.js.map