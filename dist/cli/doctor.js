import { scopeAggregate } from '@arki/async';
import { isFailure, UnexpectedDefect } from '@arki/failure';
import { getLogger } from '@arki/log';
import { guards } from './discover.js';
import { DoctorFailed, lifecycleFailed } from './failures.js';
import { probeObservability } from './observability-probe.js';
import { doctorStatus } from './render-doctor.js';
import { renderGraph } from './render-graph.js';
const debugDoctor = getLogger('arki:dot:cli:doctor');
/** Fold the observability probe's issue, if any, into the top-level issues. Never mutates the input. */
function withObservability(diagnostics, enabled) {
    if (!enabled)
        return diagnostics;
    const probeIssue = probeObservability();
    if (!probeIssue)
        return diagnostics;
    return { ...diagnostics, issues: [...diagnostics.issues, probeIssue] };
}
/** The report, or `dot.doctor_failed` carrying it when an issue is an error or boot threw. */
function reportOf(snapshot, observability, bootThrew, cause) {
    const diagnostics = withObservability(snapshot, observability);
    const status = bootThrew ? 'failure' : doctorStatus(diagnostics);
    const report = { ...diagnostics, status };
    return status === 'failure' ? DoctorFailed(report, { cause }) : report;
}
/**
 * Run `doctor` on a discovered app. The CLI owns boot and dispose only when
 * it receives a builder or a configured app; an already-booted app is read
 * and left to its caller. With `graph`, a boot that throws returns
 * `dot.doctor_failed` with the diagnostics, not the graph.
 */
export async function runDoctor(discovered, opts = {}) {
    const observability = opts.observability ?? false;
    if (!guards.isDotAppBuilder(discovered) && !guards.isDotAppConfigured(discovered)) {
        if (opts.graph === true)
            return renderGraph(discovered.manifest);
        return reportOf(discovered.diagnostics, observability, false);
    }
    let configured;
    try {
        configured = guards.isDotAppBuilder(discovered) ? discovered.configure() : discovered;
    }
    catch (error) {
        return lifecycleFailed(error, 'configure');
    }
    if (isFailure(configured))
        return configured;
    let booted;
    try {
        booted = await configured.boot();
    }
    catch (error) {
        debugDoctor.debug('boot threw, falling back to configured diagnostics', {
            error: error instanceof Error ? error : String(error),
        });
        return reportOf(configured.diagnostics, observability, true);
    }
    if (isFailure(booted))
        return reportOf(configured.diagnostics, observability, true, booted);
    let report;
    try {
        opts.onBooted?.(booted);
        report = opts.graph === true ? renderGraph(booted.manifest) : reportOf(booted.diagnostics, observability, false);
    }
    catch (error) {
        report = UnexpectedDefect({ cause: error });
    }
    let disposed;
    try {
        disposed = await booted.dispose();
    }
    catch (error) {
        disposed = UnexpectedDefect({ cause: error });
    }
    if (isFailure(disposed)) {
        return isFailure(report) ? scopeAggregate([report], [disposed]) : disposed;
    }
    return report;
}
//# sourceMappingURL=doctor.js.map