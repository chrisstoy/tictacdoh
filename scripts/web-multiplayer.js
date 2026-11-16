/**
 * Local two-player web debug loop.
 *
 * Starts the multiplayer Worker on 127.0.0.1:8787 and Expo web on
 * localhost:8081 with EXPO_PUBLIC_MULTIPLAYER_URL set, so Online Create/Join
 * is visible. Join links from the local Worker open this Expo origin
 * (workers/multiplayer/.dev.vars WEB_JOIN_BASE).
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT = process.cwd();
const WORKER_URL = 'http://127.0.0.1:8787';
const WEB_ORIGIN = 'http://localhost:8081';

function bin(rel) {
  return path.join(ROOT, rel);
}

function waitForHealth(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`${WORKER_URL}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Worker did not become healthy at ${WORKER_URL}/health`));
        return;
      }
      setTimeout(tick, 300);
    };
    tick();
  });
}

const worker = spawn(
  bin('workers/multiplayer/node_modules/.bin/wrangler'),
  ['dev', '--port', '8787', '--ip', '127.0.0.1', '--var', `WEB_JOIN_BASE:${WEB_ORIGIN}`],
  {
    cwd: path.join(ROOT, 'workers/multiplayer'),
    stdio: 'inherit',
  }
);

let web = null;
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (web && !web.killed) web.kill('SIGINT');
  if (!worker.killed) worker.kill('SIGINT');
  setTimeout(() => process.exit(code ?? 0), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

worker.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`wrangler exited (${code ?? 'signal'})`);
    shutdown(code ?? 1);
  }
});

waitForHealth(45000)
  .then(() => {
    console.log(`\nWorker ready at ${WORKER_URL}`);
    console.log(`Starting Expo web at ${WEB_ORIGIN}`);
    console.log('Play → Online Create in one tab, then open the join link in a second tab.\n');
    web = spawn(bin('node_modules/.bin/expo'), ['start', '--web', '--port', '8081'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        EXPO_PUBLIC_MULTIPLAYER_URL: WORKER_URL,
      },
    });
    web.on('exit', (code) => {
      if (!shuttingDown) shutdown(code ?? 0);
    });
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    shutdown(1);
  });
