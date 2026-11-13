import { Share } from '@capacitor/share';
import { isNativeShell } from '@/services/nativeShell';

export function buildInviteShareText(code: string, inviteUrl: string): string {
  const normalized = code.trim().toUpperCase();
  return `Join my Tic-Tac-Doh game! Code: ${normalized}\n${inviteUrl}`;
}

export async function shareOnlineInvite(input: {
  code: string;
  inviteUrl: string;
}): Promise<void> {
  const code = input.code.trim();
  const inviteUrl = input.inviteUrl.trim();
  if (!code) {
    throw new Error('Room code is required to share');
  }
  if (!inviteUrl) {
    throw new Error('Invite URL is required to share');
  }

  const text = buildInviteShareText(code, inviteUrl);
  const title = 'Tic-Tac-Doh invite';

  if (isNativeShell()) {
    await Share.share({
      title,
      text,
      url: inviteUrl,
      dialogTitle: 'Share game invite',
    });
    return;
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url: inviteUrl });
      return;
    } catch (error) {
      // User cancel — treat as success; other errors fall through to clipboard.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error('Sharing is not available in this browser');
}
