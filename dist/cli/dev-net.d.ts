/** Is `host:port` accepting connections within `timeoutMs`? Injectable in tests. */
export type Probe = (host: string, port: number, timeoutMs: number) => Promise<boolean>;
/** One TCP connect attempt; any error or the timeout counts as closed. */
export declare const probeTcp: Probe;
/** The loopback address that accepts connections on `port`, or null. */
export declare function openLoopbackHost(port: number, probe?: Probe): Promise<string | null>;
/** Resolves after `ms`, or early when `signal` aborts. */
export declare function sleep(ms: number, signal?: AbortSignal): Promise<void>;
/**
 * Call `check` every `intervalMs` until it is true, `timeoutMs` passes or
 * `signal` aborts. Resolves to the last result.
 */
export declare function pollUntil(check: () => Promise<boolean>, options: {
    readonly intervalMs: number;
    readonly timeoutMs: number;
    readonly signal?: AbortSignal | undefined;
}): Promise<boolean>;
//# sourceMappingURL=dev-net.d.ts.map