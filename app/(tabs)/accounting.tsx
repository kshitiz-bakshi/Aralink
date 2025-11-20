import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface InvoiceItem {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  date: string;
  property: string;
}

export default function AccountingScreen() {
  const colorScheme = useColorScheme();
  const [invoices] = useState<InvoiceItem[]>([
    { id: '1', vendor: 'City Electric', amount: 250, category: 'Utilities', date: '2024-01-20', property: '123 Main St' },
    { id: '2', vendor: 'Acme Repairs', amount: 500, category: 'Maintenance', date: '2024-01-15', property: '456 Oak Ave' },
  ]);

  const renderInvoice: ListRenderItem<InvoiceItem> = ({ item }) => (
    <TouchableOpacity style={[styles.card, { borderColor: Colors[colorScheme ?? 'light'].tint }]}>
      <ThemedText type="subtitle">{item.vendor}</ThemedText>
      <ThemedText style={styles.text}>{item.property}</ThemedText>
      <ThemedText style={styles.text}>{item.category}</ThemedText>
      <ThemedText style={styles.amount}>${item.amount.toFixed(2)}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Accounting</ThemedText>
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <ThemedText style={styles.btnText}>+ Add Invoice</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        <FlatList
          data={invoices}
          keyExtractor={(i) => i.id}
          renderItem={renderInvoice}
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
  amount: { marginTop: 8, fontWeight: 'bold', fontSize: 16, color: '#4CAF50' },
});
