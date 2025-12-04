import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLeaseStore, LeaseApplicationStatus } from '@/store/leaseStore';

const statusSteps: { status: LeaseApplicationStatus; label: string; icon: string }[] = [
  { status: 'submitted', label: 'Application Submitted', icon: 'file-document-outline' },
  { status: 'under_review', label: 'Under Review', icon: 'clock-outline' },
  { status: 'approved', label: 'Approved', icon: 'check-circle-outline' },
  { status: 'lease_ready', label: 'Lease Ready', icon: 'file-document' },
  { status: 'lease_signed', label: 'Lease Signed', icon: 'check-circle' },
];

export default function TenantLeaseStatusScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tenantApplication, getTenantStatus } = useLeaseStore();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const cardBgColor = isDark ? '#192734' : '#ffffff';
  const textPrimaryColor = isDark ? '#F4F6F8' : '#1D1D1F';
  const textSecondaryColor = isDark ? '#8A8A8F' : '#8A8A8F';
  const primaryColor = '#2A64F5';
  const borderColor = isDark ? '#394a57' : '#E5E7EB';

  const currentStatus = getTenantStatus() || 'submitted';
  const applicationId = tenantApplication?.id || 'RNT-' + Date.now().toString().slice(-5);

  const getStatusIndex = (status: LeaseApplicationStatus) => {
    return statusSteps.findIndex((s) => s.status === status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimaryColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textPrimaryColor }]}>Application Status</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={[styles.idLabel, { color: textSecondaryColor }]}>Application ID</ThemedText>
          <ThemedText style={[styles.idValue, { color: textPrimaryColor }]}>{applicationId}</ThemedText>
        </View>

        <View style={[styles.statusCard, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={[styles.statusTitle, { color: textPrimaryColor }]}>Current Status</ThemedText>
          <ThemedText style={[styles.statusValue, { color: primaryColor }]}>
            {statusSteps.find((s) => s.status === currentStatus)?.label || currentStatus.toUpperCase()}
          </ThemedText>
        </View>

        <View style={styles.stepsContainer}>
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepIconContainer}>
                  <View
                    style={[
                      styles.stepIcon,
                      {
                        backgroundColor: isCompleted ? primaryColor : 'transparent',
                        borderColor: isCompleted ? primaryColor : borderColor,
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name={step.icon as any}
                      size={20}
                      color={isCompleted ? '#ffffff' : textSecondaryColor}
                    />
                  </View>
                  {index < statusSteps.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        {
                          backgroundColor: isCompleted ? primaryColor : borderColor,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <ThemedText
                    style={[
                      styles.stepLabel,
                      {
                        color: isCurrent ? primaryColor : isCompleted ? textPrimaryColor : textSecondaryColor,
                        fontWeight: isCurrent ? '700' : '400',
                      },
                    ]}>
                    {step.label}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>

        {currentStatus === 'lease_ready' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/tenant-lease-review-sign')}>
            <ThemedText style={styles.actionButtonText}>Review & Sign Lease</ThemedText>
          </TouchableOpacity>
        )}

        {currentStatus === 'rejected' && (
          <View style={[styles.rejectedCard, { backgroundColor: cardBgColor, borderColor }]}>
            <MaterialCommunityIcons name="close-circle" size={32} color="#ff3b30" />
            <ThemedText style={[styles.rejectedText, { color: textPrimaryColor }]}>
              Your application has been rejected. Please contact the property manager for more information.
            </ThemedText>
          </View>
        )}
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  idLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  idValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    height: 40,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  rejectedCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  rejectedText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});

