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

describe('Player scoreboard spacing', () => {
  beforeEach(() => {
    mockedMatch.mockImplementation((selector) =>
      selector({ isCPU: { X: false, O: true }, wins: { X: 0, O: 0 } })
    );
    mockedRound.mockImplementation((selector) => selector({ turn: 'X' }));
    mockedOnline.mockImplementation((selector) => selector({ seat: 'X' }));
  });

  it('keeps a fixed mark size and spacer so Wins cannot sit against the glyph', () => {
    const view = render(<Player player="X" />);
    expect(view.getByTestId('player-mark-X')).toHaveStyle({ height: 40 });
    expect(view.getByTestId('player-mark-wins-gap-X')).toHaveStyle({ height: 36 });
    expect(view.getByText('Wins: 0')).toBeTruthy();
  });
});
