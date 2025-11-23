import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'splash', // Start with splash
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
