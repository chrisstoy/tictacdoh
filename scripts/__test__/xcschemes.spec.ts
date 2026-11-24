import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../..');
const schemes = path.join(root, 'ios/App/App.xcodeproj/xcshareddata/xcschemes');
const script = path.join(root, 'scripts/add-watchos-target.py');

function read(name: string): string {
  return fs.readFileSync(path.join(schemes, name), 'utf8');
}

// Xcode rewrites shared schemes on open: 3-space indentation, no tabs, and
// the watch scheme at version 1.3. Committing anything else shows up as a
// dirty tree every time someone opens the project.
describe('shared Xcode schemes match what Xcode writes', () => {
  it.each(['App.xcscheme', 'TicTacDohWatch.xcscheme'])('%s has no tab indentation', (name) => {
    expect(read(name)).not.toMatch(/\t/);
  });

  it('TicTacDohWatch.xcscheme is at the version Xcode writes', () => {
    expect(read('TicTacDohWatch.xcscheme')).toMatch(/^\s+version = "1\.3">/m);
  });

  it('add-watchos-target.py regenerates the committed watch scheme byte-for-byte', () => {
    const result = spawnSync(
      'python3',
      [
        '-I',
        '-c',
        [
          'import importlib.util, sys',
          `spec = importlib.util.spec_from_file_location("t", ${JSON.stringify(script)})`,
          'm = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)',
          'sys.stdout.write(m.scheme_xml())',
        ].join('\n'),
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(read('TicTacDohWatch.xcscheme'));
  });

  it('add-watchos-target.py writes the App scheme watch entry without tabs', () => {
    const source = fs.readFileSync(script, 'utf8');
    const entry = source.slice(
      source.indexOf('if WATCH_TARGET not in app:'),
      source.indexOf('APP_SCHEME.write_text(app)')
    );
    expect(entry).not.toMatch(/\\t/);
  });

  it('add-watchos-target.py takes MARKETING_VERSION from package.json, not a literal', () => {
    const source = fs.readFileSync(script, 'utf8');
    expect(source).not.toMatch(/MARKETING_VERSION = \d/);
  });
});
