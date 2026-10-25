// Setup file for Jest
// This file is executed before each test file

// Expo's WinterCG polyfills are lazy getters that require() on first access.
// Jest 30's teardown walks every global outside test scope and trips those
// getters ("import a file outside of the scope of the test code"). Touch them
// here, while still inside the test, so the getters resolve first.
void globalThis.TextDecoder;
void globalThis.TextDecoderStream;
void globalThis.TextEncoderStream;
void globalThis.URL;
void globalThis.URLSearchParams;
void globalThis.__ExpoImportMetaRegistry;
void globalThis.structuredClone;

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));

// Extend Jest matchers (if needed for additional custom matchers)
// Note: @testing-library/react-native now includes built-in matchers
