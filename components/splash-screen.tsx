import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // catch is here in case SplashScreen is already hidden
});

export default function SplashScreenComponent() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Hide the splash screen after animation completes (3-4 seconds)
      await SplashScreen.hideAsync();
      // Navigate to auth or home based on authentication state
      router.replace('/(auth)');
    }, 4000); // Show splash for 4 seconds

    return () => clearTimeout(timer);
  }, [router]);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#F4F6F8';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <LottieView
        source={require('@/assets/animations/splash.json')}
        autoPlay
        loop={false}
        style={styles.animation}
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
  animation: {
    width: '100%',
    height: '100%',
  },
});
