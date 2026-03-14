/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Register background message handler
// This must be called before AppRegistry.registerComponent
// NOTE: Wrapped in try-catch to make Firebase optional during development
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background notification received:', remoteMessage);
    // Handle background notification here if needed
  });
} catch (error) {
  console.log('Firebase not configured (dev mode):', error.message);
}

AppRegistry.registerComponent(appName, () => App);
