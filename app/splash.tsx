import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reanimated specifically requires a catch handler */
});

export default function SplashRoute() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const navigateAway = async () => {
      try {
        // Hide the splash screen after animation completes
        await SplashScreen.hideAsync();
        // Navigate to auth
        router.replace('/(auth)');
      } catch (e) {
        console.log('Error hiding splash:', e);
      }
    };

    // Wait for animation to complete (3-4 seconds)
    const timer = setTimeout(navigateAway, 3500);

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
        resizeMode="contain"
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
    width: 300,
    height: 300,
  },
});
