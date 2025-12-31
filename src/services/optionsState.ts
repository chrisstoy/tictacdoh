import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { withZustandDevtools } from './zustandDevtools';

type OptionsActions = {
  setAutoReplay(autoReplay: boolean): void;
  setEnableSound(enableSound: boolean): void;
};

type OptionsState = {
  autoReplay: boolean;
  enableSound: boolean;
};

export const useOptionsStore = create<OptionsState & OptionsActions>()(
  withZustandDevtools(
    (set) => ({
      autoReplay: false,
      enableSound: true,

      setAutoReplay(autoReplay: boolean) {
        set({ autoReplay });
      },

      setEnableSound(enableSound: boolean) {
        set({ enableSound });
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

/** Complex Selectors */

/** Action Selectors */
export const useOptionsActions = () =>
  useOptionsStore(
    useShallow((s) => ({
      setAutoReplay: s.setAutoReplay,
      setEnableSound: s.setEnableSound,
    }))
  );
