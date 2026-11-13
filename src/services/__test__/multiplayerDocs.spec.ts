import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('multiplayer docs (#44)', () => {
  it('records ADR 0004 for authoritative DO rooms (rejects P2P and PartyKit; web/watch out of scope)', () => {
    const adrPath = path.join(
      root,
      '.agents/decisions/0004-use-authoritative-durable-object-rooms-for-native-multiplaye.md'
    );
    expect(fs.existsSync(adrPath)).toBe(true);
    const adr = fs.readFileSync(adrPath, 'utf8');
    expect(adr).toMatch(/## Status\s*\n\s*Accepted/);
    expect(adr.toLowerCase()).toMatch(/durable object/);
    expect(adr).toMatch(/P2P|peer-to-peer/i);
    expect(adr).toMatch(/PartyKit/i);
    expect(adr.toLowerCase()).toMatch(/web/);
    expect(adr.toLowerCase()).toMatch(/watch/);
  });

  it('documents online mode, Worker, and stores in architecture.md', () => {
    const arch = read('.agents/reference/architecture.md');
    expect(arch).toMatch(/workers\/multiplayer/);
    expect(arch).toMatch(/GameRoom/);
    expect(arch).toMatch(/useOnlineSessionStore|sessionStore/);
    expect(arch).toMatch(/matchState|roundState/);
    expect(arch).toMatch(/EXPO_PUBLIC_MULTIPLAYER_URL/);
    expect(arch).toMatch(/ADR 0004|0004/);
  });

  it('documents wrangler deploy, EXPO_PUBLIC_MULTIPLAYER_URL, and tictacdoh:// in deployment.md', () => {
    const dep = read('.agents/reference/deployment.md');
    expect(dep).toMatch(/wrangler deploy/);
    expect(dep).toMatch(/EXPO_PUBLIC_MULTIPLAYER_URL/);
    expect(dep).toMatch(/tictacdoh:\/\//);
    expect(dep).toMatch(/#46/);
    expect(dep).toMatch(/two.?device|iOS.*Android|Manual.*checklist/i);
  });

  it('includes Worker deploy steps in both deploy-app skill copies (no new Actions)', () => {
    for (const rel of [
      '.agents/skills/deploy-app/SKILL.md',
      '.claude/skills/deploy-app/SKILL.md',
    ]) {
      const skill = read(rel);
      expect(skill).toMatch(/wrangler deploy/);
      expect(skill).toMatch(/tictacdoh-multiplayer|workers\/multiplayer/);
      expect(skill).toMatch(/EXPO_PUBLIC_MULTIPLAYER_URL/);
      expect(skill).not.toMatch(/\.github\/workflows\/.*multiplayer/);
    }
  });
});
