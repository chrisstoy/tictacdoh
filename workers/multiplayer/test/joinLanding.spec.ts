import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WEB_JOIN_BASE,
  joinLandingHtml,
  resolveWebJoinBase,
  webJoinUrl,
} from '../src/joinLanding';

describe('joinLanding', () => {
  it('builds a Pages ?join= URL from WEB_JOIN_BASE', () => {
    expect(webJoinUrl('ab12cd')).toBe(`${DEFAULT_WEB_JOIN_BASE}/?join=AB12CD`);
    expect(resolveWebJoinBase('https://example.com/game/')).toBe('https://example.com/game');
    expect(webJoinUrl('xy99zz', 'https://example.com/game/')).toBe(
      'https://example.com/game/?join=XY99ZZ'
    );
  });

  it('includes app deep link and browser fallback in landing HTML', () => {
    const html = joinLandingHtml('ab12cd');
    expect(html).toContain('tictacdoh://join/AB12CD');
    expect(html).toContain(`${DEFAULT_WEB_JOIN_BASE}/?join=AB12CD`);
    expect(html).toContain('id="open-app"');
    expect(html).toContain('id="open-browser"');
    expect(html).toContain('<code>AB12CD</code>');
  });
});
