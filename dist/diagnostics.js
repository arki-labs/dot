/**
 * Diagnostics types for the DOT kernel.
 *
 * Where the manifest describes the static shape of an app, a
 * `DotDiagnosticsSnapshot` is a point-in-time observability record: the
 * lifecycle state of the app and every pip, plus structured issues with
 * remediation guidance.
 *
 * CONTRACT: `DotDiagnosticsSnapshot` always exposes the same five arrays
 * (`pips`, `routes`, `services`, `lifecycle`, `issues`). Consumers must
 * never see an omitted array — empty is empty, but never missing.
 * This is the "5 arrays" contract referenced by the kernel spec.
 */
//# sourceMappingURL=diagnostics.js.map