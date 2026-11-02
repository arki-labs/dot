/** Feeds chunks through `write`; call `end` once the stream closes. */
export type Redactor = {
    write(chunk: Buffer): void;
    end(): void;
};
export declare function createRedactor(secrets: readonly string[], emit: (text: string) => void): Redactor;
//# sourceMappingURL=env-redact.d.ts.map