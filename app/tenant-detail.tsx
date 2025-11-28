import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TenantDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const textPrimaryColor = isDark ? '#F4F6F8' : '#1D1D1F';
  const borderColor = isDark ? '#394a57' : '#E5E7EB';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property: '',
    moveInDate: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      const formattedDate = formatDate(date);
      setFormData({ ...formData, moveInDate: formattedDate });
    }
  };

  const handleSave = () => {
    // TODO: Save tenant to backend
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimaryColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textPrimaryColor }]}>Tenant Details</ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Full name"
              value={formData.name}
              onChangeText={(value) => setFormData({ ...formData, name: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => setFormData({ ...formData, email: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Phone</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Phone number"
              value={formData.phone}
              onChangeText={(value) => setFormData({ ...formData, phone: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Property</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Select property"
              value={formData.property}
              onChangeText={(value) => setFormData({ ...formData, property: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Move-In Date</ThemedText>
            <View style={styles.dateInputRow}>
              <TouchableOpacity
                style={[styles.input, styles.inputFlex, { borderColor: Colors[colorScheme ?? 'light'].border }]}
                onPress={() => setShowDatePicker(true)}>
                <ThemedText style={[styles.dateText, { color: formData.moveInDate ? Colors[colorScheme ?? 'light'].text : '#999' }]}>
                  {formData.moveInDate || 'MM/DD/YYYY'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => setShowDatePicker(true)}>
                <MaterialCommunityIcons name="calendar" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </ThemedView>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>Save Tenant</ThemedText>
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
  inputFlex: {
    flex: 1,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    paddingVertical: 2,
  },
  calendarButton: {
    padding: 12,
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
