import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="alerts" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="property-detail" options={{ presentation: 'modal', title: 'Property Details' }} />
        <Stack.Screen name="tenant-detail" options={{ presentation: 'modal', title: 'Tenant Details' }} />
        <Stack.Screen name="maintenance-detail" options={{ presentation: 'modal', title: 'Maintenance Ticket' }} />
        <Stack.Screen name="applicant-detail" options={{ presentation: 'modal', title: 'Applicant Details' }} />
        <Stack.Screen name="invoice-detail" options={{ presentation: 'modal', title: 'Invoice Details' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
