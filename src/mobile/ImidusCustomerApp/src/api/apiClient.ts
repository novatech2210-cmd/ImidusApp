import axios from 'axios';
import { ENV } from '../config/environment';

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API URL in development
if (ENV.IS_DEV) {
  console.log('[API] Base URL:', ENV.API_BASE_URL);
}

export default apiClient;
