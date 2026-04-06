import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const DairyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E88E5', // Clean Blue
    secondary: '#00ACC1', // Cyan for accents
    background: '#F5F9FC', // Soft blue-ish white
    surface: '#FFFFFF',
    text: '#333333',
    error: '#D32F2F',
  },
};
