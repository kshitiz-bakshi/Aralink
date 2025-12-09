import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reanimated specifically requires a catch handler */
});

export default function SplashRoute() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth if not already done
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  useEffect(() => {
    const navigateAway = async () => {
      try {
        // Wait for auth to be initialized
        if (!isInitialized) return;

        // Hide the splash screen
        await SplashScreen.hideAsync();

        // Navigate based on auth state
        if (user) {
          // User is logged in, navigate to appropriate dashboard
          if (user.role === 'tenant') {
            router.replace('/(tabs)/tenant-dashboard');
          } else {
            router.replace('/(tabs)/landlord-dashboard');
          }
        } else {
          // User is not logged in, go to auth
          router.replace('/(auth)');
        }
      } catch (e) {
        console.log('Error hiding splash:', e);
        // Fallback to auth screen
        router.replace('/(auth)');
      }
    };

    // Wait for animation to complete (2 seconds) then check auth
    const timer = setTimeout(navigateAway, 2000);

    return () => clearTimeout(timer);
  }, [router, user, isInitialized]);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const textColor = isDark ? '#F4F6F8' : '#111827';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <ThemedText style={styles.logoText}>🏠</ThemedText>
        </View>
        <ThemedText style={[styles.appName, { color: textColor }]}>
          Aralink
        </ThemedText>
        <ThemedText style={[styles.tagline, { color: textColor, opacity: 0.7 }]}>
          Your Rental Home, Managed
        </ThemedText>
      </View>
      <ActivityIndicator 
        size="large" 
        color={isDark ? '#2A64F5' : '#2A64F5'} 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#2A64F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});
