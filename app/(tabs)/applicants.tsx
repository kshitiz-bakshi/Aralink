import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ApplicantItem {
  id: string;
  name: string;
  property: string;
  email: string;
  status: 'new' | 'under-review' | 'approved' | 'rejected';
  appliedAt: string;
}

export default function ApplicantsScreen() {
  const colorScheme = useColorScheme();
  const [applicants] = useState<ApplicantItem[]>([
    { id: '1', name: 'Mike Johnson', property: '123 Main St', email: 'mike@example.com', status: 'new', appliedAt: '2024-01-20' },
    { id: '2', name: 'Sarah Lee', property: '456 Oak Ave', email: 'sarah@example.com', status: 'under-review', appliedAt: '2024-01-18' },
  ]);

  const statusColor = (status: ApplicantItem['status']) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'under-review': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const renderApplicant: ListRenderItem<ApplicantItem> = ({ item }) => (
    <TouchableOpacity style={[styles.card, { borderColor: Colors[colorScheme ?? 'light'].tint }]}>
      <ThemedText type="subtitle">{item.name}</ThemedText>
      <ThemedText style={styles.text}>{item.email}</ThemedText>
      <ThemedText style={styles.text}>{item.property}</ThemedText>
      <ThemedText style={[styles.status, { color: statusColor(item.status) }]}>
        {item.status.replace('-', ' ').toUpperCase()}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">New Applicants</ThemedText>
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <ThemedText style={styles.btnText}>+ Add Applicant</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        <FlatList
          data={applicants}
          keyExtractor={(i) => i.id}
          renderItem={renderApplicant}
          scrollEnabled={false}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20, gap: 12 },
  btn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  text: { marginTop: 4, fontSize: 14 },
  status: { marginTop: 8, fontWeight: 'bold' },
});
