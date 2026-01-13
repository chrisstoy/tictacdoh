import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { withZustandDevtools } from './zustandDevtools';

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

export const useOptionsStore = create<OptionsState & OptionsActions>()(
  withZustandDevtools(
    (set) => ({
      autoReplay: false,
      enableSound: true,
      enableMusic: true,

      setAutoReplay(autoReplay: boolean) {
        set({ autoReplay });
      },

      setEnableSound(enableSound: boolean) {
        set({ enableSound });
      },
      setEnableMusic(enableMusic: boolean) {
        set({ enableMusic });
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
