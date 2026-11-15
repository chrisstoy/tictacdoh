import AsyncStorage from '@react-native-async-storage/async-storage';
import { hydrateOptionsStore, useOptionsStore } from '../optionsState';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

const mockedGetItem = AsyncStorage.getItem as jest.Mock;
const mockedSetItem = AsyncStorage.setItem as jest.Mock;

describe('optionsState hydration', () => {
  beforeEach(() => {
    mockedGetItem.mockReset();
    mockedSetItem.mockReset();
    mockedGetItem.mockResolvedValue(null);
    mockedSetItem.mockResolvedValue(undefined);
    useOptionsStore.setState({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
      hydrated: false,
    });
  });

  it('marks hydrated after AsyncStorage load with music saved off', async () => {
    mockedGetItem.mockResolvedValue(
      JSON.stringify({ autoReplay: false, enableSound: true, enableMusic: false })
    );

    await hydrateOptionsStore();

    const state = useOptionsStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.enableMusic).toBe(false);
  });

  it('marks hydrated with defaults when nothing is stored', async () => {
    mockedGetItem.mockResolvedValue(null);

    await hydrateOptionsStore();

    const state = useOptionsStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.enableMusic).toBe(true);
    expect(state.enableSound).toBe(true);
  });

  it('marks hydrated with defaults when AsyncStorage read fails', async () => {
    mockedGetItem.mockRejectedValue(new Error('storage unavailable'));

    await hydrateOptionsStore();

    const state = useOptionsStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.enableMusic).toBe(true);
  });

  it('does not persist the hydrated flag', async () => {
    useOptionsStore.setState({ hydrated: true, enableMusic: false });

    useOptionsStore.getState().setEnableMusic(true);

    expect(mockedSetItem).toHaveBeenCalled();
    const saved = JSON.parse(mockedSetItem.mock.calls[0][1]);
    expect(saved).toEqual({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,
    });
    expect(saved.hydrated).toBeUndefined();
  });
});
