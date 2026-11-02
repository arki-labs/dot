/**
 * The process that serves the app under `dot dev`: `--run "<cmd>"`, else
 * `vite dev` when the project has a Vite config, else the hidden
 * `dot _serve`. The child gets its own process group on POSIX, so stopping
 * it stops whatever it spawned too: SIGTERM to the group, a grace period,
 * then SIGKILL to the group.
 */
import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { getLogger } from '@arki/log';
import { sleep } from './dev-net.js';
import { DevRunnerFailed } from './failures.js';
const debugRunner = getLogger('arki:dot:cli:dev');
const VITE_CONFIGS = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'];
const VITE_BINARIES = process.platform === 'win32' ? ['vite.exe', 'vite.cmd', 'vite'] : ['vite'];
async function isFile(file) {
    try {
        const info = await stat(file);
        return info.isFile();
    }
    catch {
        return false;
    }
}
/** Pick the runner: `--run` wins, then a Vite config, then `dot _serve`. A Vite config without the binary is `dot.dev_runner_failed`. */
export async function chooseRunner(options) {
    if (options.run !== undefined && options.run.trim() !== '') {
        return { kind: 'run', command: options.run, file: options.run, args: [], shell: true };
    }
    for (const config of VITE_CONFIGS) {
        if (!(await isFile(path.join(options.cwd, config))))
            continue;
        const args = ['dev', '--port', String(options.port), '--strictPort'];
        for (const binary of VITE_BINARIES) {
            const file = path.join(options.cwd, 'node_modules', '.bin', binary);
            if (await isFile(file))
                return { kind: 'vite', command: `vite ${args.join(' ')}`, file, args, shell: false };
        }
        return DevRunnerFailed({
            command: `vite ${args.join(' ')}`,
            causeMessage: `${config} exists but node_modules/.bin/vite does not`,
        });
    }
    const [program, ...entry] = options.cliEntry;
    return {
        kind: 'serve',
        command: `dot _serve --app ${options.appFile}`,
        file: program,
        args: [...entry, '_serve', '--app', options.appFile, '--output', 'text'],
        shell: false,
    };
}
export function createOutputBuffer(maxLines = 2000, maxBytes = 2 * 1024 * 1024) {
    const kept = [];
    let bytes = 0;
    let dropped = 0;
    return {
        push(line) {
            kept.push(line);
            bytes += Buffer.byteLength(line) + 1;
            while (kept.length > maxLines || (bytes > maxBytes && kept.length > 0)) {
                const oldest = kept.shift() ?? '';
                bytes -= Buffer.byteLength(oldest) + 1;
                dropped += 1;
            }
        },
        lines: () => [...kept],
        get dropped() {
            return dropped;
        },
    };
}
function hasCode(error, code) {
    return error instanceof Error && 'code' in error && error.code === code;
}
const POSIX = process.platform !== 'win32';
/** Signal the child's process group. False when the group is gone. */
function signalGroup(pid, signal) {
    try {
        process.kill(-pid, signal);
        return true;
    }
    catch (error) {
        if (hasCode(error, 'ESRCH'))
            return false;
        // EPERM: the group exists but a member is not ours to signal.
        if (hasCode(error, 'EPERM'))
            return true;
        throw error;
    }
}
function readLines(child, onLine) {
    for (const stream of [child.stdout, child.stderr]) {
        if (stream === null)
            continue;
        createInterface({ input: stream, crlfDelay: Infinity }).on('line', onLine);
    }
}
/** Spawn the runner. Resolves once the child runs, or with `dot.dev_runner_failed` when it cannot start. */
export function startRunner(spec, options) {
    const child = spawn(spec.file, [...spec.args], {
        cwd: options.cwd,
        env: options.env,
        shell: spec.shell,
        // Its own process group, so a stop reaches what it spawned (Vite workers, a shell's children).
        detached: POSIX,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    readLines(child, options.onLine);
    const exited = new Promise(resolve => {
        child.once('exit', (code, signal) => {
            resolve({ code, signal });
        });
    });
    return new Promise(resolve => {
        child.once('error', error => {
            resolve(DevRunnerFailed({ command: spec.command, causeMessage: error.message }));
        });
        child.once('spawn', () => {
            const pid = child.pid;
            if (pid === undefined) {
                resolve(DevRunnerFailed({ command: spec.command, causeMessage: 'the child has no pid' }));
                return;
            }
            resolve(createHandle(spec, child, pid, exited));
        });
    });
}
function createHandle(spec, child, pid, exited) {
    let stopping = false;
    let done = false;
    exited.then(() => {
        done = true;
    }, () => {
        done = true;
    });
    // Last resort: when the supervisor exits without stopping the runner, the group must not outlive it.
    const killOnExit = () => {
        if (POSIX)
            signalGroup(pid, 'SIGKILL');
        else
            child.kill('SIGKILL');
    };
    process.once('exit', killOnExit);
    let stopped;
    const stop = async (graceMs) => {
        stopping = true;
        try {
            if (!POSIX) {
                if (!done)
                    child.kill();
                if (!(await settlesWithin(exited, graceMs)) && !done)
                    child.kill('SIGKILL');
                return await exited;
            }
            if (!signalGroup(pid, 'SIGTERM'))
                return await exited;
            const deadline = Date.now() + graceMs;
            // The leader may exit first while its children still drain: wait for the whole group.
            while (Date.now() < deadline && signalGroup(pid, 0))
                await sleep(50);
            if (signalGroup(pid, 0)) {
                debugRunner.debug('runner group {pid} ignored SIGTERM for {graceMs} ms; sending SIGKILL', { pid, graceMs });
                signalGroup(pid, 'SIGKILL');
            }
            return await exited;
        }
        finally {
            process.removeListener('exit', killOnExit);
        }
    };
    return {
        pid,
        spec,
        exited,
        get stopping() {
            return stopping;
        },
        stop(graceMs = 10_000) {
            stopped ??= stop(graceMs);
            return stopped;
        },
        kill() {
            stopping = true;
            killOnExit();
        },
    };
}
async function settlesWithin(promise, ms) {
    let settled = false;
    const watched = promise.then(() => {
        settled = true;
    });
    await Promise.race([watched, sleep(ms)]);
    return settled;
}
//# sourceMappingURL=dev-runner.js.map