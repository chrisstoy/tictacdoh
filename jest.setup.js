// Setup file for Jest
// This file is executed before each test file

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
