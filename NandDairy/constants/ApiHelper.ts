import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (__DEV__) {
      // Both Android (physical) and iOS use the laptop's local IP on the same network
      return 'http://192.168.235.3:5001/api';
  }
  return 'https://nand-dairy-backend.onrender.com/api'; // Live Render backend
};

export const API_URL = getBaseUrl();
