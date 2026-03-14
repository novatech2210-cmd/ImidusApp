import 'react-native-gesture-handler/jestSetup';

try {
  console.log('DEBUG: react-native path:', require.resolve('react-native'));
} catch (e) {
  console.log('DEBUG: react-native resolution failed');
}

// Mock react-native to ensure Animated and other critical modules are available
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  // Fix for "Cannot read properties of undefined (reading 'spring')"
  // We need to handle the getter
  const originalAnimated = RN.Animated;
  if (originalAnimated) {
    if (!originalAnimated.spring) {
      originalAnimated.spring = jest.fn(() => ({
        start: jest.fn(cb => cb && cb({finished: true})),
        stop: jest.fn(),
      }));
    }
    if (!originalAnimated.timing) {
      originalAnimated.timing = jest.fn(() => ({
        start: jest.fn(cb => cb && cb({finished: true})),
        stop: jest.fn(),
      }));
    }
  }

  return RN;
});

// Mock InteractionManager
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  createInteractionHandle: jest.fn(),
  clearInteractionHandle: jest.fn(),
  runAfterInteractions: jest.fn(callback => callback()),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  apps: [],
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
  })),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  const mockContext = {
    Consumer: jest.fn(({children}) => children(inset)),
    Provider: jest.fn(({children}) => children),
  };
  return {
    SafeAreaProvider: jest.fn(({children}) => children),
    SafeAreaView: jest.fn(({children}) => children),
    useSafeAreaInsets: jest.fn(() => inset),
    SafeAreaConsumer: jest.fn(({children}) => children(inset)),
    SafeAreaContext: mockContext,
    SafeAreaInsetsContext: mockContext,
  };
});

// Mock linear gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});
