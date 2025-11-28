import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMaintenanceStore } from '@/store/maintenanceStore';
import { StatusChip } from '@/components/maintenance/StatusChip';
import { FilePreview } from '@/components/maintenance/FilePreview';

export default function TenantMaintenanceRequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requests } = useMaintenanceStore();

  const request = requests.find((req) => req.id === id) ?? requests[0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{request.title}</Text>
            <StatusChip status={request.status} />
          </View>
          <Text style={styles.subtitle}>
            {request.property} • {request.unit}
          </Text>
          <Text style={styles.description}>{request.description}</Text>
        </View>

        <View style={styles.card}>
          <DetailRow icon="tag" label="Category" value={request.category} />
          <DetailRow icon="alert-circle" label="Urgency" value={request.urgency} />
          <DetailRow
            icon="calendar-clock"
            label="Availability"
            value={new Date(request.availability).toLocaleString()}
          />
          <DetailRow
            icon="account-check"
            label="Permission to Enter"
            value={request.permissionToEnter ? 'Yes' : 'No'}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity</Text>
          {request.activity.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <MaterialCommunityIcons name="checkbox-blank-circle" size={8} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityMessage}>{item.message}</Text>
                <Text style={styles.activityMeta}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {request.attachments.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <FilePreview files={request.attachments} />
          </View>
        ) : null}

        {request.resolutionNotes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <Text style={styles.description}>{request.resolutionNotes}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.feedbackButton}>
          <Text style={styles.feedbackText}>Provide Feedback</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#2563eb" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  subtitle: {
    color: '#475569',
    fontWeight: '600',
  },
  description: {
    color: '#475569',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#475569',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityIcon: {
    width: 16,
    alignItems: 'center',
  },
  activityMessage: {
    fontSize: 14,
    color: '#111827',
  },
  activityMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  feedbackButton: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 14,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#2563eb',
    fontWeight: '700',
  },
});

