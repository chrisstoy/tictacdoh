import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { withZustandDevtools } from './zustandDevtools';

const OPTIONS_STORAGE_KEY = '@tic-tac-doh:options';

type OptionsActions = {
  setAutoReplay(autoReplay: boolean): void;
  setEnableSound(enableSound: boolean): void;
  setEnableMusic(enableMusic: boolean): void;
};

type PersistedOptions = {
  autoReplay: boolean;
  enableSound: boolean;
  enableMusic: boolean;
};

type OptionsState = PersistedOptions & {
  /** True after AsyncStorage load settles (or immediately when there is no window). Not persisted. */
  hydrated: boolean;
};

// Load persisted options from AsyncStorage
const loadPersistedOptions = async (): Promise<Partial<PersistedOptions>> => {
  try {
    const storedData = await AsyncStorage.getItem(OPTIONS_STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData) as Partial<PersistedOptions & { hydrated?: boolean }>;
      const { hydrated: _ignored, ...persisted } = parsed;
      return persisted;
    }
  } catch (error) {
    console.error('Failed to load persisted options:', error);
  }
  return {};
};

// Save options to AsyncStorage (never write the in-memory hydrated flag)
const saveOptions = async (options: PersistedOptions): Promise<void> => {
  try {
    await AsyncStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch (error) {
    console.error('Failed to save options:', error);
  }
};

const toPersisted = (state: OptionsState): PersistedOptions => ({
  autoReplay: state.autoReplay,
  enableSound: state.enableSound,
  enableMusic: state.enableMusic,
});

// Default values for options. Browser starts unhydrated so music cannot blip
// before AsyncStorage applies a saved music-off preference.
const defaultOptions: OptionsState = {
  autoReplay: false,
  enableSound: true,
  enableMusic: true,
  hydrated: typeof window === 'undefined',
};

/** Apply AsyncStorage (or defaults) and mark the store hydrated. Safe to call more than once. */
export async function hydrateOptionsStore(): Promise<void> {
  const persisted = await loadPersistedOptions();
  useOptionsStore.setState({ ...defaultOptions, ...persisted, hydrated: true });
}

export const useOptionsStore = create<OptionsState & OptionsActions>()(
  withZustandDevtools(
    (set, get) => ({
      ...defaultOptions,

      setAutoReplay(autoReplay: boolean) {
        set({ autoReplay });
        saveOptions(toPersisted(get()));
      },

      setEnableSound(enableSound: boolean) {
        set({ enableSound });
        saveOptions(toPersisted(get()));
      },
      setEnableMusic(enableMusic: boolean) {
        set({ enableMusic });
        saveOptions(toPersisted(get()));
      },
    }),
    {
      name: 'OptionsStore',
    }
  )
);

// Only load persisted options in browser environment (not during SSR)
if (typeof window !== 'undefined') {
  void hydrateOptionsStore();
}

/** State Selectors */
export const selectAutoReplay = (state: OptionsState) => state.autoReplay;
export const selectEnableSound = (state: OptionsState) => state.enableSound;
export const selectEnableMusic = (state: OptionsState) => state.enableMusic;
export const selectOptionsHydrated = (state: OptionsState) => state.hydrated;

/** Complex Selectors */

/** Action Selectors */
export const useOptionsActions = () =>
  useOptionsStore(
    useShallow((s) => ({
      setAutoReplay: s.setAutoReplay,
      setEnableSound: s.setEnableSound,
      setEnableMusic: s.setEnableMusic,
    }))
  );
