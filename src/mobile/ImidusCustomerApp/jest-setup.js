import 'react-native-gesture-handler/jestSetup';

// Mock react-native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const mockAnimation = () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
    interpolate: jest.fn(() => ({})),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  });
  const Animated = {
    Value: jest.fn(() => mockAnimation()),
    ValueXY: jest.fn(() => mockAnimation()),
    timing: jest.fn(() => mockAnimation()),
    spring: jest.fn(() => mockAnimation()),
    parallel: jest.fn(() => mockAnimation()),
    sequence: jest.fn(() => mockAnimation()),
    loop: jest.fn(() => mockAnimation()),
    event: jest.fn(),
    createAnimatedComponent: jest.fn((component) => component),
    View: RN.View,
    Text: RN.Text,
    Image: RN.Image,
    ScrollView: RN.ScrollView,
  };
  const I18nManager = {
    getConstants: jest.fn(() => ({ isRTL: false })),
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
  };
  Object.defineProperty(RN, 'Animated', { get: () => Animated });
  Object.defineProperty(RN, 'I18nManager', { get: () => I18nManager });
  return RN;
});

// Mock WebView
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props) => React.createElement(View, props),
    default: (props) => React.createElement(View, props),
  };
});

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
  const React = require('react');
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  const mockContext = {
    Consumer: ({children}) => children(inset),
    Provider: ({children}) => children,
  };
  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaView: ({children}) => children,
    useSafeAreaInsets: () => inset,
    SafeAreaInsetsContext: mockContext,
    SafeAreaContext: mockContext,
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: inset,
    },
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
