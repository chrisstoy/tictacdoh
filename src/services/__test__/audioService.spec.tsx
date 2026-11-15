import { NativeAudio } from '@capacitor-community/native-audio';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { act, render } from '@testing-library/react-native';
import { useEffect } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { AudioServiceProvider, useAudioService } from '../audioService';
import { isNativeShell } from '../nativeShell';
import { useOptionsStore } from '../optionsState';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: jest.fn(() => 'ios'),
    isNativePlatform: jest.fn(() => true),
  },
}));

jest.mock('@capacitor/app', () => ({
  App: {
    addListener: jest.fn(),
  },
}));

jest.mock('@capacitor-community/native-audio', () => ({
  NativeAudio: {
    configure: jest.fn(() => Promise.resolve()),
    preload: jest.fn(() => Promise.resolve()),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    resume: jest.fn(() => Promise.resolve()),
    loop: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    isPlaying: jest.fn(() => Promise.resolve({ isPlaying: false })),
    unload: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    addListener: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(),
    release: jest.fn(),
  })),
}));

jest.mock('../nativeShell', () => ({
  isNativeShell: jest.fn(),
}));

const mockedIsNativeShell = isNativeShell as jest.Mock;
const mockedGetPlatform = Capacitor.getPlatform as jest.Mock;
const mockedAddListener = App.addListener as jest.Mock;
const mockedConfigure = NativeAudio.configure as jest.Mock;
const mockedPreload = NativeAudio.preload as jest.Mock;
const mockedPlay = NativeAudio.play as jest.Mock;
const mockedPause = NativeAudio.pause as jest.Mock;
const mockedResume = NativeAudio.resume as jest.Mock;
const mockedLoop = NativeAudio.loop as jest.Mock;
const mockedStop = NativeAudio.stop as jest.Mock;
const mockedIsPlaying = NativeAudio.isPlaying as jest.Mock;

let onAppState: (state: { isActive: boolean }) => void = () => {};
const removeListener = jest.fn(() => Promise.resolve());

function musicPreloads() {
  return mockedPreload.mock.calls.filter((call) => call[0]?.assetId === 'music');
}

const apiRef: { current: ReturnType<typeof useAudioService> | null } = { current: null };

function Harness() {
  apiRef.current = useAudioService();
  return null;
}

function renderAudio() {
  return render(
    <AudioServiceProvider>
      <Harness />
    </AudioServiceProvider>
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AudioServiceProvider', () => {
  beforeEach(async () => {
    apiRef.current = null;
    onAppState = () => {};
    mockedIsNativeShell.mockReset();
    mockedGetPlatform.mockReset();
    mockedGetPlatform.mockReturnValue('ios');
    mockedConfigure.mockClear();
    mockedPreload.mockReset();
    mockedPreload.mockImplementation(() => Promise.resolve());
    mockedPlay.mockClear();
    mockedPause.mockClear();
    mockedResume.mockClear();
    mockedLoop.mockClear();
    mockedStop.mockClear();
    mockedIsPlaying.mockReset();
    mockedIsPlaying.mockImplementation(() => Promise.resolve({ isPlaying: false }));
    (createAudioPlayer as jest.Mock).mockClear();
    removeListener.mockClear();
    mockedAddListener.mockReset();
    mockedAddListener.mockImplementation(async (_event: string, listener: typeof onAppState) => {
      onAppState = listener;
      return { remove: removeListener };
    });

    await flush();
    useOptionsStore.setState({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
      hydrated: true,
    });
  });

  it('keeps expo-audio on the web and does not touch the native plugin', async () => {
    mockedIsNativeShell.mockReturnValue(false);

    renderAudio();
    await flush();

    expect(createAudioPlayer).toHaveBeenCalled();
    expect(mockedConfigure).not.toHaveBeenCalled();
    expect(mockedAddListener).not.toHaveBeenCalled();
  });

  it('restarts web setup music on didJustFinish when loop was enabled after mount', async () => {
    mockedIsNativeShell.mockReturnValue(false);

    let onPlaybackStatus: ((status: {
      isLoaded: boolean;
      didJustFinish: boolean;
    }) => void) | null = null;
    const musicPlayer = {
      addListener: jest.fn((_event: string, listener: typeof onPlaybackStatus) => {
        onPlaybackStatus = listener;
      }),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    const soundPlayer = {
      addListener: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => soundPlayer);
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => musicPlayer);

    renderAudio();
    await flush();

    expect(onPlaybackStatus).not.toBeNull();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    musicPlayer.seekTo.mockClear();
    musicPlayer.play.mockClear();

    await act(async () => {
      onPlaybackStatus?.({ isLoaded: true, didJustFinish: true });
    });

    expect(musicPlayer.seekTo).toHaveBeenCalledWith(0);
    expect(musicPlayer.play).toHaveBeenCalled();
  });

  it('does not restart web music on didJustFinish after stopMusic', async () => {
    mockedIsNativeShell.mockReturnValue(false);

    let onPlaybackStatus: ((status: {
      isLoaded: boolean;
      didJustFinish: boolean;
    }) => void) | null = null;
    const musicPlayer = {
      addListener: jest.fn((_event: string, listener: typeof onPlaybackStatus) => {
        onPlaybackStatus = listener;
      }),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    const soundPlayer = {
      addListener: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => soundPlayer);
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => musicPlayer);

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    await act(async () => {
      apiRef.current?.stopMusic();
    });
    await flush();

    musicPlayer.seekTo.mockClear();
    musicPlayer.play.mockClear();

    await act(async () => {
      onPlaybackStatus?.({ isLoaded: true, didJustFinish: true });
    });

    expect(musicPlayer.seekTo).not.toHaveBeenCalled();
    expect(musicPlayer.play).not.toHaveBeenCalled();
  });

  it('preloads bundled sound names once and uses an ambient session on iOS', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    renderAudio();
    await flush();

    expect(mockedConfigure).toHaveBeenCalledWith({ focus: false, fade: false });
    expect(musicPreloads()).toEqual([
      [
        expect.objectContaining({
          assetId: 'music',
          assetPath: 'setup-music.mp3',
          isUrl: false,
          audioChannelNum: 1,
        }),
      ],
    ]);
    expect(mockedPreload).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: 'thump', assetPath: 'thump.mp3', isUrl: false })
    );
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('preloads Android sounds from the assets/sounds folder', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    mockedGetPlatform.mockReturnValue('android');

    renderAudio();
    await flush();

    expect(musicPreloads()[0][0]).toEqual(
      expect.objectContaining({
        assetId: 'music',
        assetPath: 'sounds/setup-music.mp3',
        isUrl: false,
      })
    );
  });

  it('does not play a sound when sound is disabled', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    useOptionsStore.setState({ enableSound: false, enableMusic: true, autoReplay: false });

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playSound('thump', 0.118);
    });

    expect(mockedPlay).not.toHaveBeenCalled();
  });

  it('plays a native sound from the requested offset when sound is enabled', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playSound('thump', 0.118);
    });
    await flush();

    expect(mockedPlay).toHaveBeenCalledWith({ assetId: 'thump', time: 0.118 });
  });

  it('pauses music when inactive and resumes the same asset when active again', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    expect(musicPreloads()).toHaveLength(1);

    await act(async () => {
      onAppState({ isActive: false });
    });
    expect(mockedPause).toHaveBeenCalledWith({ assetId: 'music' });

    await act(async () => {
      onAppState({ isActive: true });
    });
    expect(mockedResume).toHaveBeenCalledWith({ assetId: 'music' });
    expect(musicPreloads()).toHaveLength(1);
  });

  it('does not create a second music asset across rapid inactive/active toggles', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();
    mockedPause.mockClear();
    mockedResume.mockClear();

    await act(async () => {
      onAppState({ isActive: false });
      onAppState({ isActive: true });
      onAppState({ isActive: false });
      onAppState({ isActive: true });
    });

    expect(musicPreloads()).toHaveLength(1);
    expect(mockedPause).toHaveBeenCalledTimes(2);
    expect(mockedResume).toHaveBeenCalledTimes(2);
    expect(mockedPreload.mock.calls.filter((call) => call[0]?.assetId === 'music')).toHaveLength(1);
  });

  it('does not resume music on foreground when it was stopped', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();
    await act(async () => {
      apiRef.current?.stopMusic();
    });
    mockedResume.mockClear();

    await act(async () => {
      onAppState({ isActive: false });
      onAppState({ isActive: true });
    });

    expect(mockedResume).not.toHaveBeenCalled();
  });

  it('does not resume music on foreground when music is disabled', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    await act(async () => {
      useOptionsStore.getState().setEnableMusic(false);
    });
    await flush();
    mockedResume.mockClear();

    await act(async () => {
      onAppState({ isActive: false });
      onAppState({ isActive: true });
    });

    expect(mockedResume).not.toHaveBeenCalled();
    expect(mockedPause).toHaveBeenCalledWith({ assetId: 'music' });
  });

  it('on Android stops music instead of pausing, and does not call resume after stop', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    mockedGetPlatform.mockReturnValue('android');

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();
    mockedPlay.mockClear();
    mockedStop.mockClear();
    mockedPause.mockClear();
    mockedResume.mockClear();

    await act(async () => {
      apiRef.current?.stopMusic();
    });
    await flush();

    expect(mockedStop).toHaveBeenCalledWith({ assetId: 'music' });
    expect(mockedPause).not.toHaveBeenCalled();

    await act(async () => {
      onAppState({ isActive: false });
      onAppState({ isActive: true });
    });
    await flush();

    expect(mockedResume).not.toHaveBeenCalled();
    expect(mockedPlay).not.toHaveBeenCalled();
  });

  it('on Android does not resume music on foreground when music is disabled', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    mockedGetPlatform.mockReturnValue('android');

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    await act(async () => {
      useOptionsStore.getState().setEnableMusic(false);
    });
    await flush();
    mockedPlay.mockClear();
    mockedResume.mockClear();
    mockedPause.mockClear();

    await act(async () => {
      onAppState({ isActive: false });
      onAppState({ isActive: true });
    });
    await flush();

    expect(mockedStop).toHaveBeenCalledWith({ assetId: 'music' });
    expect(mockedPause).not.toHaveBeenCalled();
    expect(mockedResume).not.toHaveBeenCalled();
    expect(mockedPlay).not.toHaveBeenCalled();
  });

  it('on Android re-stops on foreground after stopMusic (resume-list race defense)', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    mockedGetPlatform.mockReturnValue('android');

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();
    await act(async () => {
      apiRef.current?.stopMusic();
    });
    await flush();
    mockedStop.mockClear();
    mockedPlay.mockClear();
    mockedResume.mockClear();
    mockedPause.mockClear();

    await act(async () => {
      onAppState({ isActive: false });
      onAppState({ isActive: true });
    });
    await flush();

    // Background silence + foreground noop both call stop — covers the case where
    // the plugin's activity resume list briefly restarted the asset before JS ran.
    expect(mockedStop).toHaveBeenCalledWith({ assetId: 'music' });
    expect(mockedStop.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mockedPlay).not.toHaveBeenCalled();
    expect(mockedResume).not.toHaveBeenCalled();
    expect(mockedPause).not.toHaveBeenCalled();
  });

  it('on Android continues music via play after background when music should keep playing', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    mockedGetPlatform.mockReturnValue('android');
    mockedIsPlaying.mockImplementation(() => Promise.resolve({ isPlaying: false }));

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();
    mockedPlay.mockClear();
    mockedStop.mockClear();
    mockedLoop.mockClear();
    mockedResume.mockClear();
    mockedPause.mockClear();

    await act(async () => {
      onAppState({ isActive: false });
    });
    await flush();
    expect(mockedStop).toHaveBeenCalledWith({ assetId: 'music' });
    expect(mockedPause).not.toHaveBeenCalled();

    await act(async () => {
      onAppState({ isActive: true });
    });
    await flush();

    expect(mockedPlay).toHaveBeenCalledWith({ assetId: 'music', time: 0 });
    expect(mockedResume).not.toHaveBeenCalled();
  });


  it('does not start native music before options hydrate when music will be off', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    useOptionsStore.setState({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
      hydrated: false,
    });

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    expect(mockedLoop).not.toHaveBeenCalled();
    expect(mockedPlay).not.toHaveBeenCalled();

    await act(async () => {
      useOptionsStore.setState({ enableMusic: false, hydrated: true });
    });
    await flush();

    expect(mockedLoop).not.toHaveBeenCalled();
    expect(mockedPlay).not.toHaveBeenCalled();
  });

  it('starts native music after options hydrate when music stays on', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    useOptionsStore.setState({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
      hydrated: false,
    });

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    expect(mockedLoop).not.toHaveBeenCalled();

    await act(async () => {
      useOptionsStore.setState({ enableMusic: true, hydrated: true });
    });
    await flush();

    expect(mockedLoop).toHaveBeenCalledWith({ assetId: 'music' });
  });

  it('does not start native music when options hydrate before preload finishes', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    useOptionsStore.setState({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
      hydrated: false,
    });
    let releasePreload: () => void = () => {};
    const pendingPreload = new Promise<void>((resolve) => {
      releasePreload = () => resolve();
    });
    mockedPreload.mockImplementation(() => pendingPreload);

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    await act(async () => {
      useOptionsStore.setState({ enableMusic: false, hydrated: true });
    });
    await flush();

    await act(async () => {
      releasePreload();
    });
    await flush();

    expect(mockedLoop).not.toHaveBeenCalled();
    expect(mockedPlay).not.toHaveBeenCalled();
  });

  it('does not start web music before options hydrate when music will be off', async () => {
    mockedIsNativeShell.mockReturnValue(false);

    const musicPlayer = {
      addListener: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    const soundPlayer = {
      addListener: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => soundPlayer);
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => musicPlayer);

    useOptionsStore.setState({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
      hydrated: false,
    });

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    expect(musicPlayer.play).not.toHaveBeenCalled();

    await act(async () => {
      useOptionsStore.setState({ enableMusic: false, hydrated: true });
    });
    await flush();

    expect(musicPlayer.play).not.toHaveBeenCalled();
  });

  it('starts web music after options hydrate when music stays on', async () => {
    mockedIsNativeShell.mockReturnValue(false);

    const musicPlayer = {
      addListener: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    const soundPlayer = {
      addListener: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      replace: jest.fn(),
      seekTo: jest.fn(),
      release: jest.fn(),
    };
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => soundPlayer);
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => musicPlayer);

    useOptionsStore.setState({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
      hydrated: false,
    });

    renderAudio();
    await flush();

    await act(async () => {
      apiRef.current?.playMusic('setup', { loop: true });
    });
    await flush();

    expect(musicPlayer.play).not.toHaveBeenCalled();

    await act(async () => {
      useOptionsStore.setState({ enableMusic: true, hydrated: true });
    });
    await flush();

    expect(musicPlayer.play).toHaveBeenCalled();
  });

  it('does not start music until native preload finishes', async () => {
    mockedIsNativeShell.mockReturnValue(true);
    let releasePreload: () => void = () => {};
    const pendingPreload = new Promise<void>((resolve) => {
      releasePreload = () => resolve();
    });
    mockedPreload.mockImplementation(() => pendingPreload);

    function AutoPlay() {
      const api = useAudioService();
      useEffect(() => {
        api.playMusic('setup', { loop: true });
      }, [api]);
      return null;
    }

    render(
      <AudioServiceProvider>
        <AutoPlay />
      </AudioServiceProvider>
    );
    await flush();

    expect(mockedLoop).not.toHaveBeenCalled();
    expect(mockedPlay).not.toHaveBeenCalled();

    await act(async () => {
      releasePreload();
    });
    await flush();

    expect(mockedLoop).toHaveBeenCalledWith({ assetId: 'music' });
  });

  it('removes the app state listener on unmount', async () => {
    mockedIsNativeShell.mockReturnValue(true);

    const { unmount } = renderAudio();
    await flush();

    await act(async () => {
      unmount();
    });

    expect(removeListener).toHaveBeenCalled();
  });
});
