/**
 * Lifecycle primitives for the DOT kernel.
 *
 * The kernel uses a 5-hook lifecycle that runs in dependency order:
 *
 *  - `configure` — synchronous registration of metadata, routes, services
 *  - `boot`       — async open of resources, publishes services into `app.services`
 *  - `start`      — async start of active work (workers, schedulers, listeners)
 *  - `stop`       — async stop of active work, runs in reverse-topological order
 *  - `dispose`    — async release of booted resources, runs in reverse-topological order
 *
 * Hook semantics, failure ordering, and idempotency rules are documented on the
 * public `DotApp` interface in `./define-app.ts`.
 */
/**
 * The complete set of lifecycle hooks in topological execution order.
 * `stop` and `dispose` run in reverse-topological order across pips, but the
 * sequence of hooks themselves is always `configure -> boot -> start -> stop -> dispose`.
 */
export const DOT_LIFECYCLE_HOOKS = [
    'configure',
    'boot',
    'start',
    'stop',
    'dispose',
];
/** Stable error codes for lifecycle failures. */
export const DotLifecycleErrorCode = {
    /** A `configure` hook attempted async work (returned a Promise). */
    ConfigureAsync: 'DOT_LIFECYCLE_E001',
    /** A `configure` hook threw. */
    ConfigureFailed: 'DOT_LIFECYCLE_E002',
    /** A `boot` hook threw. */
    BootFailed: 'DOT_LIFECYCLE_E003',
    /** A `start` hook threw. */
    StartFailed: 'DOT_LIFECYCLE_E004',
    /** One or more `stop` hooks threw — aggregate. */
    StopFailed: 'DOT_LIFECYCLE_E005',
    /** One or more `dispose` hooks threw — aggregate. */
    DisposeFailed: 'DOT_LIFECYCLE_E006',
    /** Caller tried to reuse the app after dispose. */
    ReuseAfterDispose: 'DOT_LIFECYCLE_E007',
    /** Caller tried to reuse the app after a failed lifecycle. */
    ReuseAfterFailure: 'DOT_LIFECYCLE_E008',
    /** Dependency graph contains a cycle. */
    DependencyCycle: 'DOT_LIFECYCLE_E009',
    /** Pip declared a dependency that isn't registered. */
    MissingDependency: 'DOT_LIFECYCLE_E010',
    /** Pip registered twice. */
    DuplicatePip: 'DOT_LIFECYCLE_E011',
};
/**
 * Structured error thrown for any lifecycle failure or misuse.
 *
 * Carries:
 *  - `code`     — stable machine-readable error code (see {@link DotLifecycleErrorCode}).
 *  - `phase`    — which hook (or pseudo-hook) failed.
 *  - `pip`   — which pip name, when applicable.
 *  - `cause`    — original error if wrapped from a hook throw.
 *  - `failures` — for aggregate errors (stop/dispose), the per-pip failures.
 */
export class DotLifecycleError extends Error {
    code;
    phase;
    pip;
    cause;
    failures;
    constructor(args) {
        super(args.message);
        this.name = 'DotLifecycleError';
        this.code = args.code;
        this.phase = args.phase;
        this.pip = args.pip;
        this.cause = args.cause;
        this.failures = args.failures;
    }
}
//# sourceMappingURL=lifecycle.js.map