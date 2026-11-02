import type { PreflightMessage } from './preflight-message.js';
export { preflightMessageSchema } from './preflight-message.js';
export type { PreflightMessage } from './preflight-message.js';
/** Discover, configure once, boot through `runDoctor`, dispose: the report of one preflight. */
export declare function runPreflightChild(options: {
    readonly app?: string | undefined;
    readonly cwd?: string | undefined;
}): Promise<PreflightMessage>;
//# sourceMappingURL=preflight-child.d.ts.map