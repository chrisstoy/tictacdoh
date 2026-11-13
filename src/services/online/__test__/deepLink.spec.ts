import { parseJoinDeepLink } from '../deepLink';

describe('parseJoinDeepLink', () => {
  it('extracts a valid code from tictacdoh://join/<code>', () => {
    expect(parseJoinDeepLink('tictacdoh://join/ab12cd')).toBe('AB12CD');
    expect(parseJoinDeepLink('tictacdoh://join/XY99ZZ')).toBe('XY99ZZ');
  });

  it('accepts an optional trailing slash', () => {
    expect(parseJoinDeepLink('tictacdoh://join/ABCD12/')).toBe('ABCD12');
  });

  it('returns null for wrong scheme, host, or path', () => {
    expect(parseJoinDeepLink('https://example.com/join/ABCD12')).toBeNull();
    expect(parseJoinDeepLink('tictacdoh://room/ABCD12')).toBeNull();
    expect(parseJoinDeepLink('tictacdoh://join/')).toBeNull();
    expect(parseJoinDeepLink('tictacdoh://')).toBeNull();
    expect(parseJoinDeepLink('')).toBeNull();
  });

  it('returns null for invalid room codes', () => {
    expect(parseJoinDeepLink('tictacdoh://join/abc')).toBeNull();
    expect(parseJoinDeepLink('tictacdoh://join/ab12c!')).toBeNull();
  });

  it('decodes URI-encoded path segments', () => {
    expect(parseJoinDeepLink('tictacdoh://join/ab%31%32cd')).toBe('AB12CD');
  });
});
