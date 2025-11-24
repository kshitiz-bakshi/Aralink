import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLeaseStore } from '@/store/leaseStore';

export default function LandlordApplicationReviewScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { selectApplication, approveApplication, rejectApplication, requestMoreInfo } = useLeaseStore();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const cardBgColor = isDark ? '#192734' : '#ffffff';
  const textPrimaryColor = isDark ? '#F4F6F8' : '#1D1D1F';
  const textSecondaryColor = isDark ? '#8A8A8F' : '#8A8A8F';
  const primaryColor = '#2A64F5';
  const borderColor = isDark ? '#394a57' : '#E5E7EB';

  const application = selectApplication(id as string);

  if (!application) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <ThemedText style={{ color: textPrimaryColor }}>Application not found</ThemedText>
      </ThemedView>
    );
  }

  const handleApprove = () => {
    router.push(`/finalize-lease-terms?applicationId=${application.id}`);
  };

  const handleReject = () => {
    rejectApplication(application.id);
    router.back();
  };

  const handleRequestInfo = () => {
    requestMoreInfo(application.id);
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textPrimaryColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textPrimaryColor }]}>
          Application: {application.tenantName}
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Applicant Info Card */}
        <View style={[styles.applicantCard, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.applicantHeader}>
            <View style={styles.applicantInfo}>
              <ThemedText style={[styles.applicantName, { color: textPrimaryColor }]}>
                {application.tenantName}
              </ThemedText>
              <ThemedText style={[styles.applicantProperty, { color: textSecondaryColor }]}>
                Applied for: {application.propertyAddress || '123 Maple St, Unit 4B'}
              </ThemedText>
              <ThemedText style={[styles.applicantDate, { color: textSecondaryColor }]}>
                Submitted: {new Date(application.submittedAt || '').toLocaleDateString()}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Insights Card */}
        <View style={[styles.insightsCard, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={[styles.insightsTitle, { color: textPrimaryColor }]}>Insights</ThemedText>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <ThemedText style={[styles.insightLabel, { color: textSecondaryColor }]}>Credit Score</ThemedText>
              <ThemedText style={[styles.insightValue, { color: textPrimaryColor }]}>750</ThemedText>
            </View>
            <View style={styles.insightItem}>
              <ThemedText style={[styles.insightLabel, { color: textSecondaryColor }]}>Income/Rent</ThemedText>
              <ThemedText style={[styles.insightValue, { color: textPrimaryColor }]}>3.5x</ThemedText>
            </View>
            <View style={styles.insightItem}>
              <ThemedText style={[styles.insightLabel, { color: textSecondaryColor }]}>On-Time Payments</ThemedText>
              <ThemedText style={[styles.insightValue, { color: textPrimaryColor }]}>100%</ThemedText>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={[styles.sectionCard, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimaryColor }]}>Personal Information</ThemedText>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textSecondaryColor }]}>Date of Birth</ThemedText>
              <ThemedText style={[styles.infoValue, { color: textPrimaryColor }]}>
                {application.draft.personal.dob}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textSecondaryColor }]}>Email</ThemedText>
              <ThemedText style={[styles.infoValue, { color: textPrimaryColor }]}>
                {application.draft.personal.email}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textSecondaryColor }]}>Phone</ThemedText>
              <ThemedText style={[styles.infoValue, { color: textPrimaryColor }]}>
                {application.draft.personal.phone}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Financial/Employment */}
        <View style={[styles.sectionCard, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimaryColor }]}>Financial / Employment</ThemedText>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textSecondaryColor }]}>Employer</ThemedText>
              <ThemedText style={[styles.infoValue, { color: textPrimaryColor }]}>
                {application.draft.employment.employerName}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textSecondaryColor }]}>Annual Income</ThemedText>
              <ThemedText style={[styles.infoValue, { color: textPrimaryColor }]}>
                ${application.draft.employment.annualIncome}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Rental History */}
        <View style={[styles.sectionCard, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimaryColor }]}>Rental History</ThemedText>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textSecondaryColor }]}>Current Address</ThemedText>
              <ThemedText style={[styles.infoValue, { color: textPrimaryColor }]}>
                {application.draft.residence.currentAddress}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Uploaded Documents */}
        <View style={[styles.sectionCard, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimaryColor }]}>Uploaded Documents</ThemedText>
          <View style={styles.sectionContent}>
            {Object.keys(application.draft.documents).map((docKey) => (
              <View key={docKey} style={styles.documentItem}>
                <MaterialCommunityIcons name="file-document" size={20} color={primaryColor} />
                <ThemedText style={[styles.documentName, { color: textPrimaryColor }]}>
                  {docKey.replace(/([A-Z])/g, ' $1').trim()}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Decision Actions */}
        <View style={styles.actionsContainer}>
          <ThemedText style={[styles.actionsTitle, { color: textPrimaryColor }]}>Make a Decision</ThemedText>

          <TouchableOpacity
            style={[styles.rejectButton, { borderColor: '#ff3b30' }]}
            onPress={handleReject}>
            <ThemedText style={[styles.rejectButtonText, { color: '#ff3b30' }]}>Reject Application</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.requestButton, { borderColor }]}
            onPress={handleRequestInfo}>
            <ThemedText style={[styles.requestButtonText, { color: textPrimaryColor }]}>
              Request More Information
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveButton, { backgroundColor: primaryColor }]}
            onPress={handleApprove}>
            <ThemedText style={styles.approveButtonText}>Approve Application</ThemedText>
          </TouchableOpacity>
        </View>
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
  applicantCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  applicantProperty: {
    fontSize: 14,
    marginBottom: 4,
  },
  applicantDate: {
    fontSize: 12,
  },
  insightsCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  documentName: {
    fontSize: 14,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  rejectButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  requestButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

