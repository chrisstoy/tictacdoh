import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { act } from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { isAndroidNativeShell } from '@/services/nativeShell';
import { createOnlineSession, joinOnlineSession } from '@/services/online';
import { OnlinePlayScreen } from '../OnlinePlayScreen';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-reanimated/mock');
});

jest.mock('@/animations/pushAnim', () => ({
  createPushAnim: (done: () => void) => {
    done();
    return 1;
  },
}));

jest.mock('@/services/audioService', () => ({
  useAudioService: () => ({ playSound: jest.fn(), playMusic: jest.fn(), stopMusic: jest.fn() }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/online', () => {
  const actual = jest.requireActual('@/services/online');
  return {
    ...actual,
    createOnlineSession: jest.fn(),
    joinOnlineSession: jest.fn(),
  };
});

jest.mock('@/services/nativeShell', () => ({
  isNativeShell: jest.fn(() => false),
  isAndroidNativeShell: jest.fn(() => false),
}));

const mockedAndroidShell = isAndroidNativeShell as jest.Mock;
const mockedCreate = createOnlineSession as jest.Mock;
const mockedJoin = joinOnlineSession as jest.Mock;

describe('OnlinePlayScreen', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    mockedCreate.mockReset();
    mockedJoin.mockReset();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('creates a room and enters the lobby', async () => {
    mockedCreate.mockResolvedValue({ code: 'ABCD12', inviteUrl: 'https://mp.example/join/ABCD12' });
    const onEnterLobby = jest.fn();

    const view = render(<OnlinePlayScreen onEnterLobby={onEnterLobby} onBack={jest.fn()} />);

    expect(view.getByRole('header')).toHaveStyle({
      fontFamily: 'PoppinsBlack',
      color: '#f06c1c',
      fontSize: 56,
    });
    expect(view.getByLabelText('Create Game')).toBeTruthy();
    expect(view.getByLabelText('Join Game')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Create Game'));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalled();
      expect(onEnterLobby).toHaveBeenCalledTimes(1);
    });
  });

  it('join flow validates code then enters lobby', async () => {
    mockedJoin.mockResolvedValue(undefined);
    const onEnterLobby = jest.fn();

    const view = render(<OnlinePlayScreen onEnterLobby={onEnterLobby} onBack={jest.fn()} />);

    fireEvent.press(view.getByLabelText('Join Game'));
    expect(view.getByLabelText('Room code')).toHaveStyle({ fontFamily: 'Komigo' });
    fireEvent.changeText(view.getByLabelText('Room code'), 'ab12cd');
    fireEvent.press(view.getByLabelText('Join room'));

    await waitFor(() => {
      expect(mockedJoin).toHaveBeenCalledWith('AB12CD');
      expect(onEnterLobby).toHaveBeenCalledTimes(1);
    });
  });

  it('tells the user the game is not available when the room cannot be joined', async () => {
    mockedJoin.mockRejectedValue(new Error('The game is not available'));
    const onEnterLobby = jest.fn();
    const view = render(<OnlinePlayScreen onEnterLobby={onEnterLobby} onBack={jest.fn()} />);

    fireEvent.press(view.getByLabelText('Join Game'));
    fireEvent.changeText(view.getByLabelText('Room code'), 'ABCD12');
    fireEvent.press(view.getByLabelText('Join room'));

    await waitFor(() => {
      expect(view.getByText('The game is not available')).toBeTruthy();
    });
    expect(onEnterLobby).not.toHaveBeenCalled();
  });

  it('shows an error when join code is invalid', () => {
    const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);

    fireEvent.press(view.getByLabelText('Join Game'));
    fireEvent.changeText(view.getByLabelText('Room code'), 'ab');
    fireEvent.press(view.getByLabelText('Join room'));

    expect(mockedJoin).not.toHaveBeenCalled();
    expect(view.getByText(/valid 6-character/i)).toBeTruthy();
  });

  it('keeps the orange fill inside a dark outline on web', () => {
    Platform.OS = 'web';

    const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
    const style = JSON.stringify(view.getByRole('header').props.style);

    expect(style).toContain('#f06c1c');
    expect(style).toContain('8px #582008');
    expect(style).toContain('stroke fill');
  });

  it('goes back to the menu', () => {
    const onBack = jest.fn();
    const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={onBack} />);

    fireEvent.press(view.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe('keyboard height pin', () => {
    const layout = (view: ReturnType<typeof render>, width: number, height: number) =>
      act(() => {
        fireEvent(view.getByTestId('online-play-frame'), 'layout', {
          nativeEvent: { layout: { x: 0, y: 0, width, height } },
        });
      });
    const minHeight = (view: ReturnType<typeof render>) =>
      StyleSheet.flatten(view.getByTestId('online-play-scroll').props.contentContainerStyle)
        .minHeight;

    afterEach(() => {
      mockedAndroidShell.mockReturnValue(false);
    });

    it('is inactive on web and iOS: same tree as before, no scroll wrapper or minHeight', () => {
      mockedAndroidShell.mockReturnValue(false);
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      expect(view.queryByTestId('online-play-frame')).toBeNull();
      expect(view.queryByTestId('online-play-scroll')).toBeNull();
      expect(view.getByTestId('online-play-screen')).toBeTruthy();
    });

    it('pins minHeight to the pre-keyboard height on Android native', () => {
      mockedAndroidShell.mockReturnValue(true);
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      expect(minHeight(view)).toBeUndefined();

      layout(view, 400, 800);
      expect(minHeight(view)).toBe(800);
      // keyboard opens: height shrinks, width unchanged
      layout(view, 400, 480);
      expect(minHeight(view)).toBe(800);
      layout(view, 400, 850);
      expect(minHeight(view)).toBe(850);
      // keyboard closes, and a small settling shrink (insets) is the new baseline, not pinned
      layout(view, 400, 826);
      expect(minHeight(view)).toBe(826);
    });

    it('resets when the window width changes (rotation), not when only the frame narrows', () => {
      mockedAndroidShell.mockReturnValue(true);
      const spy = jest.spyOn(Dimensions, 'get');
      spy.mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      layout(view, 400, 800);
      // keyboard: the capped frame also narrows (useFrameMaxWidth), window width unchanged
      layout(view, 330, 480);
      expect(minHeight(view)).toBe(800);

      // rotation: window width changes
      spy.mockReturnValue({ width: 800, height: 400, scale: 1, fontScale: 1 });
      act(() => {
        Dimensions.set({ window: { width: 800, height: 400, scale: 1, fontScale: 1 } });
      });
      layout(view, 700, 400);
      expect(minHeight(view)).toBe(400);
      spy.mockRestore();
    });
  });

  it('reserves the same error slot height with and without an error', () => {
    mockedJoin.mockRejectedValue(new Error('The game is not available'));
    const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
    fireEvent.press(view.getByLabelText('Join Game'));
    const slotStyle = () =>
      StyleSheet.flatten(view.getByTestId('online-setup-error-slot').props.style);
    const before = slotStyle();
    expect(before.height).toBeGreaterThan(0);
    expect(view.queryByTestId('online-setup-error')).toBeNull();

    fireEvent.changeText(view.getByLabelText('Room code'), 'ab');
    fireEvent.press(view.getByLabelText('Join room'));
    expect(view.getByTestId('online-setup-error')).toBeTruthy();
    expect(slotStyle()).toEqual(before);
  });
});
