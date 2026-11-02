/**
 * `dot doctor` logic: boot the app, read its diagnostics, dispose it. A boot
 * that throws is still reported: the configured app's diagnostics say which
 * unit failed, so failure stays observable instead of opaque.
 */
import type { Failure } from '@arki/failure';
import type { DotApp } from '../define-app.js';
import type { UnitPhases } from '../unit-contract.js';
import type { DiscoveredApp } from './discover.js';
import type { DoctorReport } from './failures.js';
import type { GraphData } from './render-graph.js';
export type DoctorOptions = {
    /** Also check that an OpenTelemetry SDK is registered; a missing one is a warning issue. */
    readonly observability?: boolean | undefined;
    /** Return the observed unit graph as Mermaid source instead of the diagnostics. */
    readonly graph?: boolean | undefined;
    /**
     * Called with the booted app before it is disposed, when boot succeeded.
     * `dot dev` reads what the preflight boot published here (the
     * `migrations` service of `dbMigrations`).
     */
    readonly onBooted?: ((app: DotApp<Record<string, unknown>, Failure, Failure, UnitPhases>) => void) | undefined;
};
/**
 * Run `doctor` on a discovered app. The CLI owns boot and dispose only when
 * it receives a builder or a configured app; an already-booted app is read
 * and left to its caller. With `graph`, a boot that throws returns
 * `dot.doctor_failed` with the diagnostics, not the graph.
 */
export declare function runDoctor(discovered: DiscoveredApp, opts?: DoctorOptions): Promise<DoctorReport | GraphData | Failure>;
//# sourceMappingURL=doctor.d.ts.map