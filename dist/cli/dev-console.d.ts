/** What one `dot explain` call returned: its `data`, or why there is none. */
export type ExplainResult = {
    readonly ok: true;
    readonly data: unknown;
} | {
    readonly ok: false;
    readonly message: string;
};
/** Runs `dot explain` for the app with these extra arguments (`--json` is added by the runner). */
export type ExplainRunner = (args: readonly string[]) => Promise<ExplainResult>;
/** One entry of the console's menu. */
export type ConsoleMenuItem = {
    readonly format: string;
    readonly title: string;
};
/** The `dot explain` runner a supervisor uses: the CLI entry of this package, run in the project. */
export declare function cliExplainRunner(options: {
    readonly cliEntry: readonly [string, ...string[]];
    readonly cwd: string;
    readonly appFile: string;
    /** Read at every call: a full restart prepares a new env. */
    readonly env: () => Readonly<Record<string, string>>;
    readonly timeoutMs?: number;
}): ExplainRunner;
/** One HTML document around a page: the console bar with the menu, then the page. */
export declare function shell(menu: readonly ConsoleMenuItem[], current: string | null, title: string, body: string): string;
/**
 * Whether a request's `Host` names this console. The server listens on 127.0.0.1 only, but a page on another site can
 * point its own domain at 127.0.0.1 (DNS rebinding) and read the console as same-origin. That page's requests carry its
 * domain in `Host`, so only the console's own names pass. Exported so a test needs no socket.
 */
export declare function isConsoleHost(host: string | undefined, port: number): boolean;
/** The page for one request path: the HTML and its status. Exported so a test needs no socket. */
export declare function respond(explain: ExplainRunner, pathname: string): Promise<{
    status: number;
    html: string;
}>;
/** A running console. */
export type RunningConsole = {
    readonly url: string;
    close(): Promise<void>;
};
/** Start the console on `127.0.0.1:port`. A port in use is returned as a message, not thrown: the console is optional. */
export declare function startConsole(options: {
    readonly port: number;
    readonly explain: ExplainRunner;
}): Promise<RunningConsole | {
    readonly message: string;
}>;
//# sourceMappingURL=dev-console.d.ts.map