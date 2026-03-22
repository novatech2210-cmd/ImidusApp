/**
 * Web stub for @react-native-firebase/messaging
 * Provides no-op implementation for web preview
 */

const messaging = () => ({
  getToken: async () => 'web-preview-token',
  onMessage: () => () => {},
  onNotificationOpenedApp: () => () => {},
  getInitialNotification: async () => null,
  requestPermission: async () => 1,
  hasPermission: async () => 1,
  setBackgroundMessageHandler: () => {},
  onTokenRefresh: () => () => {},
});

export default messaging;
