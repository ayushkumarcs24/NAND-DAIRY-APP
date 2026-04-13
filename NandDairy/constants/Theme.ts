import { MD3DarkTheme } from 'react-native-paper';

// Apple Obsidian Dark Design System
export const C = {
  bg:        '#131313', // Main background
  surface:   '#1f1f1f', // Card / surface
  surfaceHi: '#2a2a2a', // Elevated card
  surfaceVar:'#353535', // Input background
  primary:   '#0071e3', // Apple Blue — interactive ONLY
  textPri:   '#e2e2e2', // Primary text (near-white)
  textSec:   'rgba(255,255,255,0.5)', // Secondary text
  textTer:   'rgba(255,255,255,0.3)', // Tertiary / hint
  morning:   '#FF9500', // Shift amber
  evening:   '#5856D6', // Shift indigo
  success:   '#34C759', // Green
  error:     '#FF3B30', // Red
  outline:   'rgba(255,255,255,0.08)', // Ghost border
};

export const DairyTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary:    C.primary,
    background: C.bg,
    surface:    C.surface,
    onSurface:  C.textPri,
    error:      C.error,
    secondary:  C.surfaceVar,
  },
};
