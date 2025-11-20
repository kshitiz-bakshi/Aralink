import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useOTP, setUseOTP] = useState(false);

  const handleLogin = () => {
    if (useOTP) {
      router.push('/(auth)/otp');
    } else {
      // TODO: Authenticate with Supabase
      router.replace('/(tabs)');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Welcome Back</ThemedText>
          <ThemedText style={styles.subtitle}>Login to your Aralink account</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Email or Username</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </ThemedView>

          {!useOTP && (
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </ThemedView>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleLogin}>
            <ThemedText style={styles.loginBtnText}>
              {useOTP ? 'Send OTP' : 'Login'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setUseOTP(!useOTP)}>
            <ThemedText style={styles.toggleText}>
              {useOTP ? 'Use password instead' : 'Or login with OTP'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <ThemedText style={styles.link}>Don't have an account? Sign up</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 40 },
  subtitle: { marginTop: 8, opacity: 0.7 },
  form: { gap: 20 },
  formGroup: { gap: 8 },
  label: { fontWeight: 'bold', fontSize: 16 },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  loginBtn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggleBtn: { alignItems: 'center', paddingVertical: 8 },
  toggleText: { opacity: 0.7, textDecorationLine: 'underline' },
  link: { textAlign: 'center', color: '#2196F3', marginTop: 16 },
});
