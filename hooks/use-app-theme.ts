import { useColorScheme } from './use-color-scheme';

/**
 * Standardized theme hook for consistent colors across all screens
 */
export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    // Background colors
    bgColor: isDark ? '#101922' : '#F4F6F8',
    cardBgColor: isDark ? '#192734' : '#ffffff',
    // Text colors
    textPrimaryColor: isDark ? '#F4F6F8' : '#1D1D1F',
    textSecondaryColor: isDark ? '#8A8A8F' : '#8A8A8F',
    // Border colors
    borderColor: isDark ? '#394a57' : '#E5E7EB',
    // Primary brand color
    primaryColor: '#2A64F5',
    // Input background
    inputBgColor: isDark ? '#1a202c' : '#ffffff',
    // Status colors
    successColor: '#34C759',
    warningColor: '#FF9500',
    dangerColor: '#FF3B30',
    infoColor: '#007AFF',
  };
}

