import { Share } from '@capacitor/share';

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
  await Share.share({
    title: 'Tic-Tac-Doh invite',
    text,
    url: inviteUrl,
    dialogTitle: 'Share game invite',
  });
}
