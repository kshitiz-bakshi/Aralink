import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function OTPScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const handleVerifyOTP = () => {
    // TODO: Verify OTP with Supabase
    router.replace('/(tabs)');
  };

  const handleResendOTP = () => {
    setResendTimer(60);
    // TODO: Call resend OTP API
    setTimeout(() => setResendTimer(0), 60000);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Verify OTP</ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter the one-time password sent to your email or phone
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>One-Time Password</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Enter 6-digit code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </ThemedView>

          <TouchableOpacity
            style={[styles.verifyBtn, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleVerifyOTP}>
            <ThemedText style={styles.verifyBtnText}>Verify OTP</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={resendTimer > 0}
            onPress={handleResendOTP}>
            <ThemedText style={[styles.link, resendTimer > 0 && styles.disabledLink]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={styles.link}>Back to login</ThemedText>
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
  subtitle: { marginTop: 8, opacity: 0.7, lineHeight: 20 },
  form: { gap: 20 },
  formGroup: { gap: 8 },
  label: { fontWeight: 'bold', fontSize: 16 },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, fontSize: 18, textAlign: 'center', letterSpacing: 8 },
  verifyBtn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', color: '#2196F3', marginTop: 12 },
  disabledLink: { opacity: 0.5 },
});
