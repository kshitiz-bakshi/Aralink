import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'splash', // Start with splash
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Web font optimization - add font-display: swap to prevent FCP warnings
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: system-ui;
          font-display: swap;
        }
      `;
      if (!document.getElementById('font-display-optimization')) {
        style.id = 'font-display-optimization';
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="properties" />
        <Stack.Screen name="tenants" />
        <Stack.Screen name="leases" />
        <Stack.Screen name="accounting" />
        <Stack.Screen name="maintenance" />
        <Stack.Screen name="applicants" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="property-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tenant-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="maintenance-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="applicant-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="invoice-detail" options={{ presentation: 'modal' }} />
        
        {/* Lease Application Routes */}
        <Stack.Screen name="tenant-lease-start" />
        <Stack.Screen name="tenant-lease-step1" />
        <Stack.Screen name="tenant-lease-step2" />
        <Stack.Screen name="tenant-lease-step3" />
        <Stack.Screen name="tenant-lease-step4" />
        <Stack.Screen name="tenant-lease-step5" />
        <Stack.Screen name="tenant-lease-step6" />
        <Stack.Screen name="tenant-lease-submitted" />
        <Stack.Screen name="tenant-lease-status" />
        <Stack.Screen name="tenant-lease-review-sign" />
        
        {/* Landlord Lease Routes */}
        <Stack.Screen name="landlord-applications" />
        <Stack.Screen name="landlord-application-review" />
        <Stack.Screen name="finalize-lease-terms" />
        <Stack.Screen name="lease-preview" />
        <Stack.Screen name="lease-sent" />

        {/* Maintenance Flow Routes */}
        <Stack.Screen name="tenant-maintenance-request" />
        <Stack.Screen name="tenant-maintenance-confirmation" />
        <Stack.Screen name="tenant-maintenance-status" />
        <Stack.Screen name="tenant-maintenance-detail" />
        <Stack.Screen name="landlord-maintenance-overview" />
        <Stack.Screen name="landlord-maintenance-detail" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
