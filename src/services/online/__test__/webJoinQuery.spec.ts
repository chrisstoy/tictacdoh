import { parseJoinQueryParam, stripJoinQueryFromLocation } from '../webJoinQuery';

describe('webJoinQuery', () => {
  it('parses ?join= from a full Pages URL', () => {
    expect(parseJoinQueryParam('https://chrisstoy.github.io/tictacdoh/?join=ab12cd')).toBe(
      'AB12CD'
    );
  });

  it('parses a search string', () => {
    expect(parseJoinQueryParam('?join=XY99ZZ')).toBe('XY99ZZ');
    expect(parseJoinQueryParam('join=xy99zz')).toBe('XY99ZZ');
  });

  it('returns null for missing or invalid codes', () => {
    expect(parseJoinQueryParam('https://chrisstoy.github.io/tictacdoh/')).toBeNull();
    expect(parseJoinQueryParam('?join=bad')).toBeNull();
    expect(parseJoinQueryParam('')).toBeNull();
  });

  it('strips join from the location via replaceState', () => {
    const replaceState = jest.fn();
    stripJoinQueryFromLocation(
      { href: 'https://chrisstoy.github.io/tictacdoh/?join=AB12CD', search: '?join=AB12CD' },
      { replaceState }
    );
    expect(replaceState).toHaveBeenCalledWith(
      expect.anything(),
      '',
      '/tictacdoh/'
    );
  });
});
