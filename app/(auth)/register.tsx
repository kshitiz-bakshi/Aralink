import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'landlord',
  });

  const handleRegister = () => {
    // TODO: Register with Supabase
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Create Account</ThemedText>
          <ThemedText style={styles.subtitle}>Join Aralink today</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Your full name"
              value={formData.name}
              onChangeText={(value) => setFormData({ ...formData, name: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="your@email.com"
              value={formData.email}
              onChangeText={(value) => setFormData({ ...formData, email: value })}
              keyboardType="email-address"
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Phone</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Phone number"
              value={formData.phone}
              onChangeText={(value) => setFormData({ ...formData, phone: value })}
              keyboardType="phone-pad"
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Account Type</ThemedText>
            <ThemedView style={styles.roleContainer}>
              {['landlord', 'tenant', 'manager'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleBtn,
                    formData.role === r && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  ]}
                  onPress={() => setFormData({ ...formData, role: r })}>
                  <ThemedText>{r.charAt(0).toUpperCase() + r.slice(1)}</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(value) => setFormData({ ...formData, password: value })}
              secureTextEntry
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
              secureTextEntry
            />
          </ThemedView>

          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleRegister}>
            <ThemedText style={styles.registerBtnText}>Create Account</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <ThemedText style={styles.link}>Already have an account? Log in</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 30 },
  subtitle: { marginTop: 8, opacity: 0.7 },
  form: { gap: 16 },
  formGroup: { gap: 8 },
  label: { fontWeight: 'bold', fontSize: 16 },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  roleContainer: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center' },
  registerBtn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  registerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', color: '#2196F3', marginTop: 12 },
});
