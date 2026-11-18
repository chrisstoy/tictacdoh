import { render } from '@testing-library/react-native';
import { useMatchStore } from '@/services/matchState';
import { useOnlineSessionStore } from '@/services/online';
import { useRoundStore } from '@/services/roundState';
import { Player } from '../Player';

jest.mock('@/services/matchState', () => ({
  useMatchStore: jest.fn(),
  selectIsPlayerCPU: (player: string) => (state: { isCPU: Record<string, boolean> }) =>
    state.isCPU[player],
  selectRoundsWonByPlayer: (player: string) => (state: { wins: Record<string, number> }) =>
    state.wins[player],
}));

jest.mock('@/services/roundState', () => ({
  useRoundStore: jest.fn(),
  selectIsPlayerTurn: (player: string) => (state: { turn: string }) => state.turn === player,
}));

jest.mock('@/services/online', () => ({
  useOnlineSessionStore: jest.fn(),
  selectOnlineSeat: (state: { seat?: string }) => state.seat,
}));

const mockedMatch = useMatchStore as unknown as jest.Mock;
const mockedRound = useRoundStore as unknown as jest.Mock;
const mockedOnline = useOnlineSessionStore as unknown as jest.Mock;

function titleTestId(player: 'X' | 'O', seat?: 'X' | 'O') {
  if (!seat) return `player-title-${player}`;
  return seat === player ? `local-player-${player}` : `remote-player-${player}`;
}

type RenderOptions = { cpu?: boolean; turn?: 'X' | 'O'; seat?: 'X' | 'O' };

function renderPlayer(player: 'X' | 'O', options: RenderOptions) {
  mockedMatch.mockImplementation((selector) =>
    selector({
      isCPU: {
        X: options.cpu === true && player === 'X',
        O: options.cpu === true && player === 'O',
      },
      wins: { X: 1, O: 2 },
    })
  );
  mockedRound.mockImplementation((selector) => selector({ turn: options.turn ?? 'X' }));
  mockedOnline.mockImplementation((selector) => selector({ seat: options.seat }));
  return render(<Player player={player} />);
}

describe('Player scoreboard column', () => {
  it('spaces title, mark, and wins evenly with a small top and bottom margin', () => {
    const view = renderPlayer('X', {});
    expect(view.getByTestId('player-column-X')).toHaveStyle({
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 8,
    });
    expect(view.getByTestId('player-title-X')).toHaveStyle({ height: 40 });
    expect(view.getByTestId('player-mark-X')).toHaveStyle({ height: 56 });
    expect(view.getByTestId('player-wins-X')).toBeTruthy();
    expect(view.queryByTestId('player-mark-wins-gap-X')).toBeNull();
    expect(view.getByText('Wins: 1')).toBeTruthy();
  });

  it.each<[string, 'X' | 'O', RenderOptions]>([
    ['human X', 'X' as const, {}],
    ['human O', 'O' as const, {}],
    ['clanker X', 'X' as const, { cpu: true }],
    ['clanker O', 'O' as const, { cpu: true }],
    ['local seat X', 'X' as const, { seat: 'X' as const }],
    ['remote seat O', 'O' as const, { seat: 'X' as const }],
    ['local seat O', 'O' as const, { seat: 'O' as const }],
    ['remote seat X', 'X' as const, { seat: 'O' as const }],
  ])('keeps the same three-row frame for %s', (_label, player, options) => {
    const view = renderPlayer(player, options);
    expect(view.getByTestId(`player-column-${player}`)).toHaveStyle({
      justifyContent: 'space-between',
      paddingVertical: 8,
    });
    expect(view.getByTestId(titleTestId(player, options.seat))).toHaveStyle({ height: 40 });
    expect(view.getByTestId(`player-mark-${player}`)).toHaveStyle({ height: 56 });
  });

  it('shows Meatbag, Clanker, Local, and Remote in the title slot', () => {
    expect(renderPlayer('X', {}).getByTestId('meatbag-image')).toBeTruthy();
    expect(renderPlayer('O', { cpu: true }).getByTestId('clanker-image')).toBeTruthy();
    expect(renderPlayer('X', { seat: 'X' }).getByText('Local')).toBeTruthy();
    expect(renderPlayer('O', { seat: 'X' }).getByText('Remote')).toBeTruthy();
  });
});
