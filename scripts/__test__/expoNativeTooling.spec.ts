import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../..');

describe('expo native tooling removal', () => {
  it('keeps Expo as the web toolchain and drops the native scripts and dev client', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(pkg.dependencies['expo-dev-client']).toBeUndefined();
    expect(pkg.devDependencies['expo-dev-client']).toBeUndefined();
    expect(pkg.scripts.ios).toBeUndefined();
    expect(pkg.scripts.android).toBeUndefined();
    expect(pkg.scripts.deploy).toBeUndefined();
    expect(pkg.scripts.web).toBe('expo start --web');
    expect(pkg.scripts.build).toBe('node scripts/build-pwa.js');
    expect(pkg.scripts['build:native']).toBe('GITHUB_PAGES= node scripts/build-pwa.js');
    expect(pkg.scripts['cap:sync']).toBe('cap sync');
    expect(pkg.scripts['cap:ios']).toBe('cap open ios');
    expect(pkg.scripts['cap:android']).toBe('cap open android');
  });

  it('removes the Expo ios and android blocks without changing the web base path or plugins', () => {
    const source = fs.readFileSync(path.join(root, 'app.config.js'), 'utf8');
    const config = require(path.join(root, 'app.config.js')) as {
      expo: {
        ios?: unknown;
        android?: unknown;
        plugins: unknown[];
        web: { publicPath: string };
        experiments: { baseUrl: string };
      };
    };

    expect(source).toContain("publicPath: process.env.GITHUB_PAGES ? '/tictacdoh/' : '/'");
    expect(source).toContain("baseUrl: process.env.GITHUB_PAGES ? '/tictacdoh/' : '/'");
    expect(source).not.toMatch(/^\s+ios:\s*\{/m);
    expect(source).not.toMatch(/^\s+android:\s*\{/m);
    expect(config.expo.ios).toBeUndefined();
    expect(config.expo.android).toBeUndefined();
    expect(config.expo.web.publicPath).toBe('/');
    expect(config.expo.experiments.baseUrl).toBe('/');
    expect(
      config.expo.plugins.map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin))
    ).toEqual(['expo-splash-screen', 'expo-audio']);
  });
});
