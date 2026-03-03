#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const webcliDir = resolve(rootDir, 'vendor', 'webcli');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const webcliPort = process.env.OCTRA_WEBCLI_PORT ?? '8420';
const vitePort = process.env.VITE_PORT ?? '5173';
const viteHost = process.env.VITE_HOST ?? '127.0.0.1';

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

const run = (command, args, options = {}) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options,
    });

    child.on('error', rejectPromise);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(
        new Error(
          `${command} ${args.join(' ')} failed with ${
            signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`
          }`,
        ),
      );
    });
  });

const waitForProcessExit = (child, label) =>
  new Promise((resolvePromise, rejectPromise) => {
    child.on('error', rejectPromise);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise({ label, code: 0, signal: null });
        return;
      }
      resolvePromise({
        label,
        code: code ?? 1,
        signal: signal ?? null,
      });
    });
  });

const waitForWebCli = async (child) => {
  const timeoutMs = Number(process.env.OCTRA_WEBCLI_READY_TIMEOUT_MS ?? 20_000);
  const deadline = Date.now() + timeoutMs;
  const statusUrl = `http://127.0.0.1:${webcliPort}/api/wallet/status`;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`webcli exited before becoming ready (code: ${child.exitCode})`);
    }
    try {
      const response = await fetch(statusUrl, { method: 'GET' });
      if (response.ok || response.status >= 400) {
        return;
      }
    } catch {
      // Retry until timeout.
    }
    await sleep(500);
  }

  throw new Error(`webcli did not become reachable at ${statusUrl} within ${timeoutMs}ms`);
};

const killProcess = (child, signal = 'SIGTERM') => {
  if (!child || child.killed || child.exitCode !== null) {
    return;
  }

  try {
    child.kill(signal);
  } catch {
    // Ignore shutdown errors.
  }
};

const main = async () => {
  console.log('[local] ensuring webcli submodule is present...');
  await run('git', ['submodule', 'update', '--init', '--recursive', 'vendor/webcli']);

  if (!existsSync(webcliDir)) {
    throw new Error(`webcli submodule path not found: ${webcliDir}`);
  }

  const webcliBinary = resolve(webcliDir, isWin ? 'octra_wallet.exe' : 'octra_wallet');
  const autoBuild = process.env.OCTRA_WEBCLI_AUTO_BUILD !== '0';
  const useSetupScript = process.env.OCTRA_WEBCLI_USE_SETUP !== '0';

  if (!existsSync(webcliBinary)) {
    if (!autoBuild) {
      throw new Error(
        `webcli binary missing at ${webcliBinary} and auto-build disabled (OCTRA_WEBCLI_AUTO_BUILD=0).`,
      );
    }

    console.log('[local] building webcli...');
    try {
      if (isWin) {
        await run('cmd', ['/c', 'setup.bat'], { cwd: webcliDir });
      } else {
        if (useSetupScript) {
          await run('bash', ['./setup.sh'], { cwd: webcliDir });
        } else {
          await run('make', [], { cwd: webcliDir });
        }
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new Error(
        `failed to build webcli. Install prerequisites first (C++17 toolchain, OpenSSL 3, LevelDB, make), or allow setup script (OCTRA_WEBCLI_USE_SETUP=1). ${details}`,
      );
    }
  }

  console.log(`[local] starting webcli on port ${webcliPort}...`);
  const webcli = spawn(webcliBinary, [webcliPort], {
    cwd: webcliDir,
    stdio: 'inherit',
    env: process.env,
  });

  let vite = null;
  let closing = false;

  const shutdown = () => {
    if (closing) {
      return;
    }
    closing = true;
    killProcess(vite);
    killProcess(webcli);

    setTimeout(() => {
      killProcess(vite, 'SIGKILL');
      killProcess(webcli, 'SIGKILL');
    }, 3_000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await waitForWebCli(webcli);
  console.log(`[local] webcli is reachable; starting vite on http://${viteHost}:${vitePort}`);

  vite = spawn(
    npmCmd,
    ['run', 'dev', '--', '--host', viteHost, '--port', vitePort],
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        OCTRA_WEBCLI_PORT: webcliPort,
      },
    },
  );

  const result = await Promise.race([
    waitForProcessExit(webcli, 'webcli'),
    waitForProcessExit(vite, 'vite'),
  ]);

  shutdown();

  if (result.code !== 0) {
    const signalText = result.signal ? `, signal ${result.signal}` : '';
    throw new Error(`${result.label} exited with code ${result.code}${signalText}`);
  }
};

main().catch((error) => {
  console.error(`[local] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
