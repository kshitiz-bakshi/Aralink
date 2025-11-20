import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AuthMode = 'login' | 'signup';

export default function AuthIndexScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const isDark = colorScheme === 'dark';
  const primaryColor = '#135bec';
  const bgColor = isDark ? '#101622' : '#f6f6f8';
  const cardBgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#4b5563' : '#d1d5db';
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const placeholderColor = '#9ca3af';

  const handleAuthToggle = (mode: AuthMode) => {
    setAuthMode(mode);
  };

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  const handleSignup = () => {
    router.replace('/(tabs)');
  };

  const handleGoogleSignIn = () => {
    console.log('Google Sign In');
  };

  const handleAppleSignIn = () => {
    console.log('Apple Sign In');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <MaterialCommunityIcons name="home-city" size={56} color={primaryColor} />
          <ThemedText type="title" style={styles.headerTitle}>
            Your Rental Home, Managed.
          </ThemedText>
        </View>

        {/* Auth Card */}
        <View style={[styles.authCard, { backgroundColor: cardBgColor }]}>
          {/* Toggle Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: bgColor }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === 'login' && [styles.tabButtonActive, { backgroundColor: cardBgColor }],
              ]}
              onPress={() => handleAuthToggle('login')}>
              <ThemedText
                style={[
                  styles.tabButtonText,
                  authMode === 'login' && { color: primaryColor, fontWeight: '600' },
                ]}>
                Log In
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === 'signup' && [styles.tabButtonActive, { backgroundColor: cardBgColor }],
              ]}
              onPress={() => handleAuthToggle('signup')}>
              <ThemedText
                style={[
                  styles.tabButtonText,
                  authMode === 'signup' && { color: primaryColor, fontWeight: '600' },
                ]}>
                Sign Up
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            <ThemedText type="subtitle" style={styles.formTitle}>
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </ThemedText>

            {/* Email/Phone Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {authMode === 'login' ? 'Email or Phone' : 'Email'}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    color: textColor,
                  },
                ]}
                placeholder={authMode === 'login' ? 'Enter your email or phone' : 'your@email.com'}
                placeholderTextColor={placeholderColor}
                keyboardType={authMode === 'login' ? 'default' : 'email-address'}
                value={formData.email}
                onChangeText={(value) => setFormData({ ...formData, email: value })}
              />
            </View>

            {/* Phone Input (Signup only) */}
            {authMode === 'signup' && (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Phone Number</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      color: textColor,
                    },
                  ]}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={placeholderColor}
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(value) => setFormData({ ...formData, phone: value })}
                />
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>Password</ThemedText>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      color: textColor,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(value) => setFormData({ ...formData, password: value })}
                />
                <TouchableOpacity
                  style={[styles.visibilityIcon, { borderColor: borderColor }]}
                  onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password (Signup only) */}
            {authMode === 'signup' && (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>Confirm Password</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      color: textColor,
                    },
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
                />
              </View>
            )}

            {/* Links (Login only) */}
            {authMode === 'login' && (
              <View style={styles.linksContainer}>
                <TouchableOpacity>
                  <ThemedText style={[styles.link, { color: primaryColor }]}>
                    Forgot Password?
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(auth)/otp')}>
                  <ThemedText style={[styles.link, { color: primaryColor }]}>
                    Log in with OTP
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: primaryColor }]}
              onPress={authMode === 'login' ? handleLogin : handleSignup}>
              <ThemedText style={styles.submitButtonText}>
                {authMode === 'login' ? 'Log In' : 'Create Account'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { borderTopColor: borderColor }]} />
            <ThemedText style={[styles.dividerText, { color: placeholderColor }]}>OR</ThemedText>
            <View style={[styles.divider, { borderTopColor: borderColor }]} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { borderColor: borderColor, backgroundColor: cardBgColor },
              ]}
              onPress={handleGoogleSignIn}>
              <MaterialCommunityIcons name="google" size={20} color={primaryColor} />
              <ThemedText style={[styles.socialButtonText, { color: textColor }]}>
                Continue with Google
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialButton,
                { borderColor: borderColor, backgroundColor: cardBgColor },
              ]}
              onPress={handleAppleSignIn}>
              <MaterialCommunityIcons name="apple" size={20} color={primaryColor} />
              <ThemedText style={[styles.socialButtonText, { color: textColor }]}>
                Continue with Apple
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <ThemedText style={[styles.footerText, { color: placeholderColor }]}>
              By continuing, you agree to our{' '}
              <ThemedText style={{ color: primaryColor, fontWeight: '600' }}>
                Terms of Service
              </ThemedText>{' '}
              and{' '}
              <ThemedText style={{ color: primaryColor, fontWeight: '600' }}>
                Privacy Policy
              </ThemedText>
              .
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  headerTitle: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
  },
  authCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    margin: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  visibilityIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  link: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    borderTopWidth: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
