/** Worker room codes are 6 alphanumeric characters (case-insensitive). */
const JOIN_CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function normalizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidJoinCode(raw: string): boolean {
  return JOIN_CODE_PATTERN.test(normalizeJoinCode(raw));
}
