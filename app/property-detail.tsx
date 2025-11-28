import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PropertyDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const textPrimaryColor = isDark ? '#F4F6F8' : '#1D1D1F';
  const borderColor = isDark ? '#394a57' : '#E5E7EB';

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    units: '',
  });

  const handleSave = () => {
    // TODO: Save property to backend
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimaryColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textPrimaryColor }]}>Property Details</ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Address</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Street address"
              value={formData.address}
              onChangeText={(value) => setFormData({ ...formData, address: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>City</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="City"
              value={formData.city}
              onChangeText={(value) => setFormData({ ...formData, city: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>State</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="State"
              value={formData.state}
              onChangeText={(value) => setFormData({ ...formData, state: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Zip Code</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Zip Code"
              value={formData.zipCode}
              onChangeText={(value) => setFormData({ ...formData, zipCode: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Number of Units</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Number of units"
              value={formData.units}
              onChangeText={(value) => setFormData({ ...formData, units: value })}
              keyboardType="number-pad"
            />
          </ThemedView>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>Save Property</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  form: {
    marginTop: 20,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
