import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const root = path.join(__dirname, '../../..');
const preflight = path.join(root, 'scripts/release-preflight.sh');
const PROD_URL = 'https://tictacdoh-multiplayer.chrisstoy.workers.dev';

function bash(script: string, env: Record<string, string | undefined> = {}) {
  const merged: NodeJS.ProcessEnv = { ...process.env };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete merged[k];
    else merged[k] = v;
  }
  return spawnSync('bash', ['-c', `source "${preflight}"; ${script}`], {
    encoding: 'utf8',
    env: merged,
  });
}

describe('release-preflight.sh multiplayer URL', () => {
  it('defaults EXPO_PUBLIC_MULTIPLAYER_URL to the production Worker for store builds', () => {
    const result = bash('release_multiplayer_env; echo "$EXPO_PUBLIC_MULTIPLAYER_URL"', {
      EXPO_PUBLIC_MULTIPLAYER_URL: undefined,
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(PROD_URL);
  });

  it('keeps an explicit override', () => {
    const result = bash('release_multiplayer_env; echo "$EXPO_PUBLIC_MULTIPLAYER_URL"', {
      EXPO_PUBLIC_MULTIPLAYER_URL: 'https://mp.example.com',
    });
    expect(result.stdout.trim()).toBe('https://mp.example.com');
  });

  it('build-pwa.js exports with --clear so a cached bundle cannot drop EXPO_PUBLIC_* values', () => {
    const script = fs.readFileSync(path.join(root, 'scripts/build-pwa.js'), 'utf8');
    expect(script).toMatch(/npx expo export --platform web --clear/);
  });

  describe('assert_multiplayer_baked', () => {
    let dir: string;
    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttd-dist-'));
      fs.mkdirSync(path.join(dir, '_expo'));
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    it('fails when the web bundle does not contain the Worker URL', () => {
      fs.writeFileSync(path.join(dir, '_expo', 'entry.js'), 'const base = "";');
      const result = bash(`assert_multiplayer_baked "${dir}"`, {
        EXPO_PUBLIC_MULTIPLAYER_URL: PROD_URL,
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/EXPO_PUBLIC_MULTIPLAYER_URL/);
    });

    it('passes when the web bundle contains the Worker URL', () => {
      fs.writeFileSync(path.join(dir, '_expo', 'entry.js'), `const base = "${PROD_URL}";`);
      const result = bash(`assert_multiplayer_baked "${dir}"`, {
        EXPO_PUBLIC_MULTIPLAYER_URL: PROD_URL,
      });
      expect(result.status).toBe(0);
    });
  });
});
