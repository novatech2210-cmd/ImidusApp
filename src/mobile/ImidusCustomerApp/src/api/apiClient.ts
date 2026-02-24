import axios from 'axios';

const BASE_URL = 'http://localhost:5004/api'; // Matched with backend launchSettings.json

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
