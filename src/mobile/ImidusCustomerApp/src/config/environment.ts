/**
 * Environment configuration for IMIDUS Customer App
 *
 * __DEV__ is a React Native built-in that indicates development mode
 * - Development: Points to local backend or Android emulator host
 * - Production: Points to deployed API endpoint
 */

// For Android emulator, 10.0.2.2 maps to host machine's localhost
// For iOS simulator, localhost works directly
// For physical devices, use your machine's local IP or production URL

const DEV_API_URL = 'http://10.0.2.2:5004/api';  // Android emulator
const PROD_API_URL = 'https://eda7-105-184-203-108.ngrok-free.app/api';  // Public test endpoint

export const ENV = {
  API_BASE_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  TIMEOUT: 30000,
  IS_DEV: __DEV__,
};

export default ENV;
