import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (__DEV__) {
      // Both Android (physical) and iOS use the laptop's local IP on the same WiFi
      return 'http://10.210.2.64:5001/api';
  }
  
  return 'https://your-production-url.render.com/api'; // Replace later with Render URL
};

export const API_URL = getBaseUrl();
