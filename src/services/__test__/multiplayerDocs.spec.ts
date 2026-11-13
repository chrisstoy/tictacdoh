import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('multiplayer docs', () => {
  it('records ADR 0004 for DO rooms and ADR 0005 for web/PWA parity', () => {
    const adr4 = read(
      '.agents/decisions/0004-use-authoritative-durable-object-rooms-for-native-multiplaye.md'
    );
    expect(adr4.toLowerCase()).toMatch(/durable object/);
    expect(adr4).toMatch(/P2P|peer-to-peer/i);
    expect(adr4).toMatch(/PartyKit/i);
    expect(adr4).toMatch(/0005|Superseded/i);

    const adr5 = read('.agents/decisions/0005-enable-durable-object-multiplayer-on-the-web-pwa.md');
    expect(adr5).toMatch(/## Status\s*\n\s*Accepted/);
    expect(adr5.toLowerCase()).toMatch(/web|pwa/);
    expect(adr5.toLowerCase()).toMatch(/watch/);
  });

  it('documents online mode, Worker, and stores in architecture.md', () => {
    const arch = read('.agents/reference/architecture.md');
    expect(arch).toMatch(/workers\/multiplayer/);
    expect(arch).toMatch(/GameRoom/);
    expect(arch).toMatch(/useOnlineSessionStore|sessionStore/);
    expect(arch).toMatch(/matchState|roundState/);
    expect(arch).toMatch(/EXPO_PUBLIC_MULTIPLAYER_URL/);
    expect(arch).toMatch(/ADR 0004|0004/);
    expect(arch).toMatch(/0005|web\/PWA/);
    expect(arch).toMatch(/\?join=/);
  });

  it('documents wrangler deploy, Pages env, CORS, and join dual-path in deployment.md', () => {
    const dep = read('.agents/reference/deployment.md');
    expect(dep).toMatch(/wrangler deploy/);
    expect(dep).toMatch(/EXPO_PUBLIC_MULTIPLAYER_URL/);
    expect(dep).toMatch(/tictacdoh:\/\//);
    expect(dep).toMatch(/CORS_ORIGINS/);
    expect(dep).toMatch(/chrisstoy\.github\.io/);
    expect(dep).toMatch(/WEB_JOIN_BASE|\?join=/);
    expect(dep).toMatch(/main\.yml|Pages/);
    expect(dep).toMatch(/two.?device|web.*native|Manual.*checklist/i);
  });

  it('includes Worker deploy steps in both deploy-app skill copies (no new Worker Actions)', () => {
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
