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

  describe('Android keyboard pin', () => {
    type View_ = ReturnType<typeof render>;
    const layout = (view: View_, width: number, height: number) =>
      act(() => {
        fireEvent(view.getByTestId('online-play-frame'), 'layout', {
          nativeEvent: { layout: { x: 0, y: 0, width, height } },
        });
      });
    const minHeight = (view: View_) =>
      StyleSheet.flatten(view.getByTestId('online-play-scroll').props.contentContainerStyle)
        .minHeight;
    const openJoin = (view: View_) => fireEvent.press(view.getByLabelText('Join Game'));
    const focus = (view: View_) => fireEvent(view.getByLabelText('Room code'), 'focus');
    const blur = (view: View_) => fireEvent(view.getByLabelText('Room code'), 'blur');

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

    it('renders a persistent-taps ScrollView and tracks natural height while unfocused', () => {
      mockedAndroidShell.mockReturnValue(true);
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      expect(view.getByTestId('online-play-scroll').props.keyboardShouldPersistTaps).toBe(
        'handled'
      );
      expect(minHeight(view)).toBeUndefined();

      layout(view, 400, 800);
      expect(minHeight(view)).toBe(800);
      // transient/settling layouts of any size are followed (no pin without focus)
      layout(view, 400, 826);
      expect(minHeight(view)).toBe(826);
      layout(view, 400, 300);
      expect(minHeight(view)).toBe(300);
    });

    it('pins to the pre-focus height through stepwise shrinks, releases on blur', () => {
      mockedAndroidShell.mockReturnValue(true);
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      layout(view, 400, 800);
      openJoin(view);
      focus(view);
      expect(minHeight(view)).toBe(800);

      // IME animates in: several stepwise shrinks, all keep the pin
      layout(view, 330, 700);
      layout(view, 330, 600);
      layout(view, 330, 480);
      expect(minHeight(view)).toBe(800);

      blur(view);
      // keyboard closes: frame tracks its natural height again
      layout(view, 400, 790);
      expect(minHeight(view)).toBe(790);
    });

    it('resets when the window width changes (rotation), not when only the frame narrows', () => {
      mockedAndroidShell.mockReturnValue(true);
      const spy = jest.spyOn(Dimensions, 'get');
      spy.mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      layout(view, 400, 800);
      openJoin(view);
      focus(view);
      // keyboard: the capped frame also narrows (useFrameMaxWidth), window width unchanged
      layout(view, 330, 480);
      expect(minHeight(view)).toBe(800);

      // rotation: window width changes
      spy.mockReturnValue({ width: 800, height: 400, scale: 1, fontScale: 1 });
      act(() => {
        Dimensions.set({ window: { width: 800, height: 400, scale: 1, fontScale: 1 } });
      });
      expect(minHeight(view)).toBeUndefined();
      blur(view);
      layout(view, 700, 400);
      expect(minHeight(view)).toBe(400);
      spy.mockRestore();
    });
  });

  describe('status slot', () => {
    const joinWithError = async (view: ReturnType<typeof render>, message: string) => {
      mockedJoin.mockRejectedValue(new Error(message));
      if (view.queryByLabelText('Join Game')) fireEvent.press(view.getByLabelText('Join Game'));
      fireEvent.changeText(view.getByLabelText('Room code'), 'ABCD12');
      fireEvent.press(view.getByLabelText('Join room'));
      await waitFor(() => expect(view.getByTestId('online-setup-error')).toBeTruthy());
    };

    afterEach(() => {
      mockedAndroidShell.mockReturnValue(false);
    });

    it('web/iOS: no reserved slot, error rendered conditionally as a direct child of the panel', async () => {
      mockedAndroidShell.mockReturnValue(false);
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      fireEvent.press(view.getByLabelText('Join Game'));
      expect(view.queryByTestId('online-setup-status-slot')).toBeNull();
      expect(view.queryByTestId('online-setup-error')).toBeNull();
      const panelChildren = view.getByTestId('online-setup-panel').children.length;

      await joinWithError(view, 'The game is not available');
      expect(view.queryByTestId('online-setup-status-slot')).toBeNull();
      // exactly one extra child (the error), none reserved while idle
      expect(view.getByTestId('online-setup-panel').children.length).toBe(panelChildren + 1);
      expect(view.getByTestId('online-setup-error').props.accessibilityRole).toBeUndefined();
    });

    it('android: slot uses minHeight (not fixed height); long errors wrap untruncated', async () => {
      mockedAndroidShell.mockReturnValue(true);
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      fireEvent.press(view.getByLabelText('Join Game'));
      const slot = () =>
        StyleSheet.flatten(view.getByTestId('online-setup-status-slot').props.style);
      expect(slot().minHeight).toBeGreaterThan(0);
      expect(slot().height).toBeUndefined();

      const long = 'x'.repeat(200);
      await joinWithError(view, long);
      expect(slot().height).toBeUndefined();
      expect(view.getByTestId('online-setup-error').props.numberOfLines).toBeUndefined();
      expect(view.getByText(long)).toBeTruthy();
    });

    it('android: busy spinner is labelled and stacked with the error, not overlapping', async () => {
      mockedAndroidShell.mockReturnValue(true);
      mockedJoin.mockRejectedValueOnce(new Error('first failure'));
      const view = render(<OnlinePlayScreen onEnterLobby={jest.fn()} onBack={jest.fn()} />);
      fireEvent.press(view.getByLabelText('Join Game'));
      fireEvent.changeText(view.getByLabelText('Room code'), 'ABCD12');
      fireEvent.press(view.getByLabelText('Join room'));
      await waitFor(() => expect(view.getByTestId('online-setup-error')).toBeTruthy());

      // retry while the old error is still showing is cleared on start; spinner replaces it
      let resolveJoin: () => void = () => {};
      mockedJoin.mockReturnValue(new Promise<void>((r) => (resolveJoin = r)));
      fireEvent.press(view.getByLabelText('Join room'));
      expect(view.getByLabelText('Loading')).toBeTruthy();
      const slotStyle = StyleSheet.flatten(
        view.getByTestId('online-setup-status-slot').props.style
      );
      // column flow (default), no absolute positioning: children stack
      expect(slotStyle.position).toBeUndefined();
      expect(slotStyle.flexDirection).toBeUndefined();
      await act(async () => {
        resolveJoin();
      });
    });
  });
});
