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

type OptionsState = {
  autoReplay: boolean;
  enableSound: boolean;
  enableMusic: boolean;
};

// Load persisted options from AsyncStorage
const loadPersistedOptions = async (): Promise<Partial<OptionsState>> => {
  try {
    const storedData = await AsyncStorage.getItem(OPTIONS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Failed to load persisted options:', error);
  }
  return {};
};

// Save options to AsyncStorage
const saveOptions = async (options: OptionsState): Promise<void> => {
  try {
    await AsyncStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch (error) {
    console.error('Failed to save options:', error);
  }
};

// Default values for options
const defaultOptions: OptionsState = {
  autoReplay: false,
  enableSound: true,
  enableMusic: true,
};

// Initialize store with persisted values
let initialOptions = defaultOptions;
// Only load persisted options in browser environment (not during SSR)
if (typeof window !== 'undefined') {
  loadPersistedOptions().then((persisted) => {
    const merged = { ...defaultOptions, ...persisted };
    // Update the store after it's created
    useOptionsStore.setState(merged);
  });
}

export const useOptionsStore = create<OptionsState & OptionsActions>()(
  withZustandDevtools(
    (set, get) => ({
      ...initialOptions,

      setAutoReplay(autoReplay: boolean) {
        set({ autoReplay });
        // Persist after state update
        const state = get();
        saveOptions({
          autoReplay: state.autoReplay,
          enableSound: state.enableSound,
          enableMusic: state.enableMusic,
        });
      },

      setEnableSound(enableSound: boolean) {
        set({ enableSound });
        // Persist after state update
        const state = get();
        saveOptions({
          autoReplay: state.autoReplay,
          enableSound: state.enableSound,
          enableMusic: state.enableMusic,
        });
      },
      setEnableMusic(enableMusic: boolean) {
        set({ enableMusic });
        // Persist after state update
        const state = get();
        saveOptions({
          autoReplay: state.autoReplay,
          enableSound: state.enableSound,
          enableMusic: state.enableMusic,
        });
      },
    }),
    {
      name: 'OptionsStore',
    }
  )
);

/** State Selectors */
export const selectAutoReplay = (state: OptionsState) => state.autoReplay;
export const selectEnableSound = (state: OptionsState) => state.enableSound;
export const selectEnableMusic = (state: OptionsState) => state.enableMusic;

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
