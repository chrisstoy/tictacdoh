import { isValidJoinCode, normalizeJoinCode } from '../joinCode';

describe('joinCode', () => {
  it('normalizes trim + uppercase', () => {
    expect(normalizeJoinCode('  ab12cd  ')).toBe('AB12CD');
  });

  it('accepts 6 alphanumeric characters after normalize', () => {
    expect(isValidJoinCode('ab12cd')).toBe(true);
    expect(isValidJoinCode('AB12CD')).toBe(true);
  });

  it('rejects empty, short, or non-alphanumeric codes', () => {
    expect(isValidJoinCode('')).toBe(false);
    expect(isValidJoinCode('   ')).toBe(false);
    expect(isValidJoinCode('abc')).toBe(false);
    expect(isValidJoinCode('ab12c!')).toBe(false);
  });
});
