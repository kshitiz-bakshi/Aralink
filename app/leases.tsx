import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Lease {
  id: string;
  tenantName: string;
  property: string;
  unit: string;
  startDate: string;
  endDate: string;
  rent: number;
  status: 'active' | 'expired' | 'upcoming';
}

const MOCK_LEASES: Lease[] = [
  {
    id: '1',
    tenantName: 'John Smith',
    property: '123 Main Street',
    unit: 'Unit 5B',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rent: 1500,
    status: 'active',
  },
  {
    id: '2',
    tenantName: 'Jane Doe',
    property: '456 Oak Avenue',
    unit: 'Apt 3',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    rent: 1200,
    status: 'active',
  },
  {
    id: '3',
    tenantName: 'Bob Johnson',
    property: '789 Pine Lane',
    unit: 'Unit 7C',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    rent: 1800,
    status: 'expired',
  },
];

export default function LeasesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101622' : '#f6f6f8';
  const cardBgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#4b5563' : '#e0e0e0';
  const textColor = isDark ? '#f3f4f6' : '#4a4a4a';
  const secondaryTextColor = isDark ? '#9ca3af' : '#9ca3af';
  const primaryColor = '#4A90E2';
  const successColor = '#10b981';
  const warningColor = '#f59e0b';
  const dangerColor = '#ef4444';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return successColor;
      case 'expired':
        return dangerColor;
      case 'upcoming':
        return warningColor;
      default:
        return secondaryTextColor;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { borderBottomColor: borderColor, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={[styles.headerTitle, { color: textColor }]}>
          Leases
        </ThemedText>
        <View style={styles.iconButton} />
      </View>

      {/* Leases List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {MOCK_LEASES.map((lease) => (
          <TouchableOpacity
            key={lease.id}
            style={[styles.leaseCard, { backgroundColor: cardBgColor, borderColor }]}>
            <View style={styles.leaseHeader}>
              <View>
                <ThemedText style={[styles.tenantName, { color: textColor }]}>
                  {lease.tenantName}
                </ThemedText>
                <ThemedText style={[styles.propertyText, { color: secondaryTextColor }]}>
                  {lease.property} • {lease.unit}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(lease.status)}20` },
                ]}>
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: getStatusColor(lease.status), fontSize: 12, fontWeight: '500' },
                  ]}>
                  {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <View style={styles.leaseDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                  Start Date:
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                  {new Date(lease.startDate).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                  End Date:
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                  {new Date(lease.endDate).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                  Monthly Rent:
                </ThemedText>
                <ThemedText style={[styles.rentAmount, { color: primaryColor }]}>
                  ${lease.rent.toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  leaseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  propertyText: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  leaseDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  rentAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

