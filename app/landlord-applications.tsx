import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLeaseStore, LeaseApplication } from '@/store/leaseStore';

export default function LandlordApplicationsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { landlordApplications, loadLandlordApplications } = useLeaseStore();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const cardBgColor = isDark ? '#192734' : '#ffffff';
  const textPrimaryColor = isDark ? '#F4F6F8' : '#1D1D1F';
  const textSecondaryColor = isDark ? '#8A8A8F' : '#8A8A8F';
  const primaryColor = '#2A64F5';
  const borderColor = isDark ? '#394a57' : '#E5E7EB';

  useEffect(() => {
    loadLandlordApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#FF9500';
      case 'under_review':
        return '#007AFF';
      case 'approved':
        return '#34C759';
      case 'lease_ready':
        return '#5856D6';
      case 'lease_signed':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      default:
        return textSecondaryColor;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderApplication = ({ item }: { item: LeaseApplication }) => (
    <TouchableOpacity
      style={[styles.applicationCard, { backgroundColor: cardBgColor, borderColor }]}
      onPress={() => router.push(`/landlord-application-review?id=${item.id}`)}>
      <View style={styles.applicationHeader}>
        <View style={styles.applicationInfo}>
          <ThemedText style={[styles.applicationName, { color: textPrimaryColor }]}>
            {item.tenantName}
          </ThemedText>
          <ThemedText style={[styles.applicationProperty, { color: textSecondaryColor }]}>
            {item.propertyAddress || 'Property Address'}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </ThemedText>
        </View>
      </View>
      <View style={styles.applicationFooter}>
        <ThemedText style={[styles.applicationDate, { color: textSecondaryColor }]}>
          Submitted: {formatDate(item.submittedAt)}
        </ThemedText>
        <MaterialCommunityIcons name="chevron-right" size={20} color={textSecondaryColor} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimaryColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textPrimaryColor }]}>Applications</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {landlordApplications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={64} color={textSecondaryColor} />
          <ThemedText style={[styles.emptyText, { color: textSecondaryColor }]}>No applications yet</ThemedText>
        </View>
      ) : (
        <FlatList
          data={landlordApplications}
          keyExtractor={(item) => item.id}
          renderItem={renderApplication}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  applicationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  applicationName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  applicationProperty: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  applicationDate: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

