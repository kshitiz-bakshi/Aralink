import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { appleAuth, facebookAuth, googleAuth } from '@/services/oauth-service';

type UserType = 'landlord' | 'tenant' | 'manager';

interface RegisterScreenProps {
  onSwitchToLogin?: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const isAndroid = Platform.OS === 'android';
  const isDark = colorScheme === 'dark';
  const primaryColor = '#2A64F5';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const cardBgColor = isDark ? '#1a202c' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#D1D5DB';
  const textColor = isDark ? '#F4F6F8' : '#111827';
  const subtextColor = isDark ? '#94a3b8' : '#6B7280';
  const placeholderColor = isDark ? '#64748b' : '#9ca3af';

  const handleRegister = async () => {
    if (!selectedUserType) {
      Alert.alert('Selection Required', 'Please select your account type');
      return;
    }

    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Save user role to AsyncStorage
      await AsyncStorage.setItem('userRole', selectedUserType);
      // TODO: Register with Supabase using selectedUserType and formData
      console.log('Registration successful:', selectedUserType, formData);
      Alert.alert('Success', 'Account created successfully!');
      if (selectedUserType === 'landlord') {
        router.replace('/(tabs)/landlord-dashboard');
      } else if (selectedUserType === 'tenant') {
        router.replace('/(tabs)/tenant-dashboard');
      } else if (selectedUserType === 'manager') {
        router.replace('/(tabs)/landlord-dashboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save user profile');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!selectedUserType) {
      Alert.alert('Selection Required', 'Please select your account type first');
      return;
    }

    setIsLoading(true);
    try {
      // Get current Google user from AsyncStorage (previously logged in)
      const currentUser = await googleAuth.getCurrentUser();
      if (currentUser) {
        // Save user role to AsyncStorage
        await AsyncStorage.setItem('userRole', selectedUserType);
        console.log('Google Sign Up successful:', currentUser, 'as', selectedUserType);
        Alert.alert('Success', 'Google sign up completed successfully!');
        if (selectedUserType === 'landlord') {
          router.replace('/(tabs)/landlord-dashboard');
        } else if (selectedUserType === 'tenant') {
          router.replace('/(tabs)/tenant-dashboard');
        } else if (selectedUserType === 'manager') {
          router.replace('/(tabs)/landlord-dashboard');
        }
      } else {
        Alert.alert('Info', 'Please use the Google Sign Up button in the app');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during Google sign up');
      console.error('Google signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    if (!selectedUserType) {
      Alert.alert('Selection Required', 'Please select your account type first');
      return;
    }

    setIsLoading(true);
    try {
      // Get current Apple user from AsyncStorage (previously logged in)
      const currentUser = await appleAuth.getCurrentUser();
      if (currentUser) {
        // Save user role to AsyncStorage
        await AsyncStorage.setItem('userRole', selectedUserType);
        console.log('Apple Sign Up successful:', currentUser, 'as', selectedUserType);
        Alert.alert('Success', 'Apple sign up completed successfully!');
        if (selectedUserType === 'landlord') {
          router.replace('/(tabs)/landlord-dashboard');
        } else if (selectedUserType === 'tenant') {
          router.replace('/(tabs)/tenant-dashboard');
        } else if (selectedUserType === 'manager') {
          router.replace('/(tabs)/landlord-dashboard');
        }
      } else {
        Alert.alert('Info', 'Please use the Apple Sign Up button in the app');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during Apple sign up');
      console.error('Apple signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    if (!selectedUserType) {
      Alert.alert('Selection Required', 'Please select your account type first');
      return;
    }

    setIsLoading(true);
    try {
      // Get current Facebook user from AsyncStorage (previously logged in)
      const currentUser = await facebookAuth.getCurrentUser();
      if (currentUser) {
        // Save user role to AsyncStorage
        await AsyncStorage.setItem('userRole', selectedUserType);
        console.log('Facebook Sign Up successful:', currentUser, 'as', selectedUserType);
        Alert.alert('Success', 'Facebook sign up completed successfully!');
        if (selectedUserType === 'landlord') {
          router.replace('/(tabs)/landlord-dashboard');
        } else if (selectedUserType === 'tenant') {
          router.replace('/(tabs)/tenant-dashboard');
        } else if (selectedUserType === 'manager') {
          router.replace('/(tabs)/landlord-dashboard');
        }
        Alert.alert('Info', 'Please use the Facebook Sign Up button in the app');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during Facebook sign up');
      console.error('Facebook signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: primaryColor }]}>
            <MaterialCommunityIcons name="home" size={32} color="#fff" />
          </View>
        </View>

        {/* Title */}
        <ThemedText type="title" style={[styles.mainTitle, { color: textColor }]}>
          Your Rental Home, Managed.
        </ThemedText>

        {/* Auth Card */}
        <View style={[styles.card, { backgroundColor: cardBgColor }]}>
          {/* Tab Navigation */}
          <View style={[styles.tabContainer, { backgroundColor: isDark ? '#0f172a' : '#e0e7ff' }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                {
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={onSwitchToLogin}
            >
              <ThemedText style={[styles.tabText, { color: subtextColor }]}>
                Log In
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                {
                  backgroundColor: cardBgColor,
                  borderRadius: 6,
                },
              ]}
            >
              <ThemedText style={[styles.tabText, { color: textColor, fontWeight: '600' }]}>
                Sign Up
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.formContent}>
            <ThemedText style={[styles.formTitle, { color: textColor }]}>
              Create Your Account
            </ThemedText>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Full Name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#F4F6F8',
                    borderColor,
                    color: textColor,
                  },
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={placeholderColor}
                value={formData.name}
                onChangeText={(value) => setFormData({ ...formData, name: value })}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Email Address
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#F4F6F8',
                    borderColor,
                    color: textColor,
                  },
                ]}
                placeholder="Enter your email address"
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(value) => setFormData({ ...formData, email: value })}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Password
              </ThemedText>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#F4F6F8',
                      borderColor,
                      color: textColor,
                    },
                  ]}
                  placeholder="Create a strong password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(value) => setFormData({ ...formData, password: value })}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={subtextColor}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Role Select */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Select your role
              </ThemedText>
              <View
                style={[
                  styles.selectWrapper,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#F4F6F8',
                    borderColor,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.selectTrigger}
                  onPress={() => {
                    Alert.alert('Select Role', 'Choose your account type', [
                      {
                        text: 'Landlord',
                        onPress: () => setSelectedUserType('landlord'),
                      },
                      {
                        text: 'Property Manager',
                        onPress: () => setSelectedUserType('manager'),
                      },
                      {
                        text: 'Tenant',
                        onPress: () => setSelectedUserType('tenant'),
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                    ]);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.selectText,
                      {
                        color: selectedUserType ? textColor : placeholderColor,
                      },
                    ]}
                  >
                    {selectedUserType
                      ? selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)
                      : 'Choose your role'}
                  </ThemedText>
                </TouchableOpacity>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={subtextColor}
                  style={styles.selectIcon}
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: selectedUserType ? primaryColor : '#cccccc',
                },
              ]}
              disabled={!selectedUserType || isLoading}
              onPress={handleRegister}
            >
              <ThemedText style={styles.submitButtonText}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <ThemedText style={[styles.dividerText, { color: subtextColor }]}>
              OR
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  borderColor,
                  backgroundColor: cardBgColor,
                },
                isLoading && styles.disabledButton,
              ]}
              disabled={isLoading}
              onPress={handleGoogleSignUp}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                  <ThemedText style={[styles.socialButtonText, { color: textColor }]}>
                    Continue with Google
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            {!isAndroid && (
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    borderColor,
                    backgroundColor: cardBgColor,
                  },
                  isLoading && styles.disabledButton,
                ]}
                disabled={isLoading}
                onPress={handleAppleSignUp}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="apple" size={20} color={textColor} />
                    <ThemedText style={[styles.socialButtonText, { color: textColor }]}>
                      Continue with Apple
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  borderColor,
                  backgroundColor: cardBgColor,
                },
                isLoading && styles.disabledButton,
              ]}
              disabled={isLoading}
              onPress={handleFacebookSignUp}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <>
                  <MaterialCommunityIcons name="facebook" size={20} color="#1877F2" />
                  <ThemedText style={[styles.socialButtonText, { color: textColor }]}>
                    Continue with Facebook
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: subtextColor }]}>
              By continuing, you agree to our{' '}
              <ThemedText style={[styles.footerLink, { color: primaryColor }]}>
                Terms of Service
              </ThemedText>
              {' '}and{' '}
              <ThemedText style={[styles.footerLink, { color: primaryColor }]}>
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
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  selectWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectTrigger: {
    flex: 1,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '400',
  },
  selectIcon: {
    marginLeft: 8,
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 16,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  socialContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '600',
  },
});
