import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type UserType = 'landlord' | 'tenant' | 'manager';

interface UserTypeSelectorProps {
  selectedType: UserType | null;
  onTypeSelect: (type: UserType) => void;
}

export function UserTypeSelector({ selectedType, onTypeSelect }: UserTypeSelectorProps) {
  const userTypes: { type: UserType; label: string; description: string; icon: string }[] = [
    {
      type: 'landlord',
      label: 'Landlord',
      description: 'Manage properties and collect rent',
      icon: 'home-city',
    },
    {
      type: 'tenant',
      label: 'Tenant',
      description: 'Pay rent and manage requests',
      icon: 'account-home',
    },
    {
      type: 'manager',
      label: 'Manager',
      description: 'Oversee multiple properties',
      icon: 'briefcase',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        I am a...
      </ThemedText>
      <View style={styles.selectorContainer}>
        {userTypes.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[
              styles.selectorCard,
              selectedType === item.type && styles.selectorCardSelected,
            ]}
            onPress={() => onTypeSelect(item.type)}>
            <View
              style={[
                styles.iconContainer,
                selectedType === item.type && styles.iconContainerSelected,
              ]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={32}
                color={selectedType === item.type ? '#ffffff' : '#135bec'}
              />
            </View>
            <ThemedText style={styles.selectorLabel}>{item.label}</ThemedText>
            <ThemedText style={styles.selectorDescription}>{item.description}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectorContainer: {
    gap: 12,
  },
  selectorCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  selectorCardSelected: {
    borderColor: '#135bec',
    backgroundColor: '#eff6ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: '#135bec',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectorDescription: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
});
