// zustandDevtools.ts
import type { StateCreator } from 'zustand';
import { Platform } from 'react-native';

type Middleware = <T>(
  fn: StateCreator<T, [], []>,
  options?: { name?: string }
) => StateCreator<T, [], []>;

/**
 * Enables zustand devtools in development on Web. This avoids the
 * `Uncaught SyntaxError: Cannot use 'import.meta' outside a module` error
 * in Expo Metro.
 */
export const withZustandDevtools: Middleware =
  __DEV__ && Platform.OS === 'web'
    ? // ⬇️ dynamic require avoids import.meta crash
      (fn, options) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { devtools } = require('zustand/middleware');
        return devtools(fn, options);
      }
    : (fn) => fn;
