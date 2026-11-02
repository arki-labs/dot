import { z } from 'zod';
import type { Failure } from '@arki/failure';
import type { StandardSchemaV1 } from '@arki/schema';
/** Where the state file lives, relative to the project directory. */
export declare const DEV_STATE_PATH = ".local/dot/dev.json";
declare const devStateZod: z.ZodObject<{
    pid: z.ZodNumber;
    startedAt: z.ZodISODateTime;
    console: z.ZodOptional<z.ZodObject<{
        url: z.ZodURL;
    }, z.core.$strip>>;
}, z.core.$strip>;
/** The content of `dev.json`. */
export type DevState = z.infer<typeof devStateZod>;
/** Parses `dev.json` (Standard Schema: no validator library in the public type). */
export declare const devStateSchema: StandardSchemaV1<unknown, DevState>;
/** The absolute path of the state file of a project. */
export declare function devStatePath(cwd: string): string;
/** True when a process with this pid exists. EPERM means it exists but belongs to another user. */
export declare function isPidAlive(pid: number): boolean;
/** The parsed state at `file`, or null when it is missing or not a valid state. */
export declare function readDevState(file: string): Promise<DevState | null>;
/**
 * Create the state file for this supervisor. A file that names a live pid is
 * `dot.dev_already_running`; a dead pid or an unreadable file is reclaimed.
 */
export declare function claimDevState(cwd: string, pid?: number, now?: Date): Promise<{
    readonly file: string;
} | Failure>;
/**
 * Add `console.url` to the state file, but only while it still names `pid`. The rewrite goes through a private
 * temp file and a rename, so a reader never sees half a file.
 */
export declare function publishConsoleUrl(file: string, url: string, pid?: number): Promise<void>;
/** Remove the state file, but only while it still names `pid`: never another supervisor's file. */
export declare function releaseDevState(file: string, pid?: number): Promise<void>;
export {};
//# sourceMappingURL=dev-state.d.ts.map