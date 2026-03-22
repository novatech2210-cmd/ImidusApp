/**
 * Web entry point for React Native Web preview
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('[Web Entry] Registering App...');
AppRegistry.registerComponent(appName, () => App);
console.log('[Web Entry] Running Application...');
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
console.log('[Web Entry] Initialization complete.');
