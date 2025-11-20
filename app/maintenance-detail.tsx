import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MaintenanceDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property: '',
    priority: 'medium',
    status: 'open',
  });

  const handleSave = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title">Maintenance Request</ThemedText>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="e.g., Roof repair needed"
              value={formData.title}
              onChangeText={(value) => setFormData({ ...formData, title: value })}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input, styles.multilineInput, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Describe the issue..."
              value={formData.description}
              onChangeText={(value) => setFormData({ ...formData, description: value })}
              multiline
              numberOfLines={4}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Priority</ThemedText>
            <ThemedView style={styles.priorityContainer}>
              {['low', 'medium', 'high'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityBtn,
                    formData.priority === p && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  ]}
                  onPress={() => setFormData({ ...formData, priority: p })}>
                  <ThemedText>{p.charAt(0).toUpperCase() + p.slice(1)}</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>Submit Request</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  form: { marginTop: 20, gap: 16 },
  formGroup: { gap: 8 },
  label: { fontWeight: 'bold', fontSize: 16 },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  multilineInput: { height: 100, textAlignVertical: 'top' },
  priorityContainer: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center' },
  saveButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});
