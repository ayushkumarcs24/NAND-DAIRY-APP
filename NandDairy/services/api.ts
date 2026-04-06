import axios from 'axios';
import { API_URL } from '../constants/ApiHelper';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({ baseURL: API_URL });

// Automatically attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
