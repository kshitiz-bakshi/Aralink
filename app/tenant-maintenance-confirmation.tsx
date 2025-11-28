import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TenantMaintenanceRequestConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { requests } = useMaintenanceStore();
  const request = id ? requests.find((req) => req.id === id) : undefined;

  const bgColor = colorScheme === 'dark' ? '#0f172a' : '#f8fafc';
  const cardColor = colorScheme === 'dark' ? '#142033' : '#ffffff';
  const textColor = colorScheme === 'dark' ? '#f8fafc' : '#111827';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top + 32 }]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="check" size={38} color="#22c55e" />
      </View>
      <Text style={[styles.title, { color: textColor }]}>Request Submitted!</Text>
      <Text style={styles.description}>
        Your maintenance request has been received. Our property team will review the details and reach out shortly.
      </Text>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="identifier" size={20} color="#111827" />
          <Text style={styles.cardText}>{request?.id || 'Pending ID'}</Text>
        </View>
        <View style={styles.row}>
          <MaterialCommunityIcons name="progress-clock" size={20} color="#111827" />
          <Text style={styles.cardText}>{request?.status.replace('_', ' ') ?? 'Under review'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/tenant-maintenance-status')}>
        <Text style={styles.primaryText}>View Request Status</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/tenant-dashboard')}>
        <Text style={styles.secondaryText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    color: '#475569',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
});

