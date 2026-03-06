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

const DEV_API_URL = 'http://10.0.0.26:5004/api';  // Physical device - your computer's IP
const PROD_API_URL = 'http://10.0.0.26:5004/api';  // Same for now

// Authorize.net Accept.js Public Client Key for tokenization
const AUTH_NET_PUBLIC_KEY = '7t8S6K3E3VV3qry33ZEWqQWqLq9xs4UmeNn268gFmZ6mdWWvz22zjHbaQH9Qmsrg';

export const ENV = {
  API_BASE_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10),
  IS_DEV: __DEV__,
  AUTHORIZE_NET: {
    PUBLIC_CLIENT_KEY: AUTH_NET_PUBLIC_KEY,
    ENVIRONMENT: __DEV__ ? 'sandbox' : 'production',
  },
};

export default ENV;
