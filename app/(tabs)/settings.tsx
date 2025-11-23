import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SettingItem {
  icon: string;
  iconBg: string;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#000000' : '#f2f2f7';
  const cardBgColor = isDark ? '#1c1c1e' : '#ffffff';
  const textPrimaryColor = isDark ? '#ffffff' : '#000000';
  const textSecondaryColor = isDark ? '#8e8e93' : '#6b6b70';
  const borderColor = isDark ? '#38383a' : '#e5e5ea';
  const primaryColor = '#005A9C';
  const dangerColor = '#ff3b30';

  const accountItems: SettingItem[] = [
    {
      icon: 'account',
      iconBg: '#007aff',
      label: 'Profile Information',
      onPress: () => router.push('/profile'),
    },
    {
      icon: 'key',
      iconBg: '#8e8e93',
      label: 'Change Password',
    },
    {
      icon: 'credit-card',
      iconBg: '#ff3b30',
      label: 'Manage Subscription',
    },
  ];

  const notificationItems: SettingItem[] = [
    {
      icon: 'bell',
      iconBg: '#ff9500',
      label: 'Push Notifications',
    },
    {
      icon: 'email-outline',
      iconBg: '#007aff',
      label: 'Email Notifications',
    },
  ];

  const securityItems: SettingItem[] = [
    {
      icon: 'shield-lock',
      iconBg: '#34c759',
      label: 'Two-Factor Authentication',
      showToggle: true,
      toggleValue: twoFactorEnabled,
      onToggleChange: setTwoFactorEnabled,
    },
    {
      icon: 'file-document-outline',
      iconBg: '#5856d6',
      label: 'Privacy Policy',
    },
  ];

  const appPreferenceItems: SettingItem[] = [
    {
      icon: 'theme-light-dark',
      iconBg: '#8e8e93',
      label: 'Appearance',
    },
    {
      icon: 'web',
      iconBg: '#007aff',
      label: 'Language',
    },
    {
      icon: 'help-circle-outline',
      iconBg: '#007aff',
      label: 'Help & Support',
    },
    {
      icon: 'information-outline',
      iconBg: '#007aff',
      label: 'About',
    },
  ];

  const SettingSection = ({ title, items }: { title: string; items: SettingItem[] }) => (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: textSecondaryColor }]}>{title}</ThemedText>
      <View style={[styles.card, { backgroundColor: cardBgColor }]}>
        {items.map((item, index) => (
          <View key={index}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={item.onPress}
              disabled={!item.onPress && !item.showToggle}>
              <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color="#ffffff" />
              </View>
              <ThemedText style={[styles.settingLabel, { color: textPrimaryColor }]}>
                {item.label}
              </ThemedText>
              {item.showToggle ? (
                <Switch
                  value={item.toggleValue}
                  onValueChange={item.onToggleChange}
                  trackColor={{ false: '#d1d5db', true: '#34c759' }}
                  thumbColor="#ffffff"
                />
              ) : (
                item.showChevron !== false && (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={isDark ? '#4b5563' : '#d1d5db'}
                  />
                )
              )}
            </TouchableOpacity>
            {index < items.length - 1 && (
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={primaryColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textPrimaryColor }]}>Settings</ThemedText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentInner}>
          <SettingSection title="Account" items={accountItems} />
          <SettingSection title="Notifications" items={notificationItems} />
          <SettingSection title="Security & Privacy" items={securityItems} />
          <SettingSection title="App Preferences" items={appPreferenceItems} />

          {/* Logout Button */}
          <View style={styles.logoutSection}>
            <View style={[styles.card, { backgroundColor: cardBgColor }]}>
              <TouchableOpacity style={styles.logoutButton}>
                <ThemedText style={[styles.logoutText, { color: dangerColor }]}>Log Out</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.versionText, { color: textSecondaryColor }]}>
              App Version 1.0.0
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 56,
  },
  backButton: {
    width: 48,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingTop: 8,
    gap: 32,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '400',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    gap: 16,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
  logoutSection: {
    paddingTop: 8,
    gap: 16,
  },
  logoutButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '400',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 16,
  },
});
