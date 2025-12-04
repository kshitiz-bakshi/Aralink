import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { FormInput } from '@/components/maintenance/FormInput';
import { CategoryDropdown } from '@/components/maintenance/CategoryDropdown';
import { UploadButton, UploadedFile } from '@/components/maintenance/UploadButton';
import { FilePreview } from '@/components/maintenance/FilePreview';
import { ProgressHeader } from '@/components/maintenance/ProgressHeader';

const categoryOptions = [
  { label: 'Plumbing', value: 'plumbing', icon: 'water-pump' },
  { label: 'Electrical', value: 'electrical', icon: 'flash' },
  { label: 'HVAC', value: 'hvac', icon: 'air-conditioner' },
  { label: 'Appliance', value: 'appliance', icon: 'fridge' },
  { label: 'General Repair', value: 'general', icon: 'wrench' },
];

const urgencyLevels = [
  { label: 'Low', value: 'low', icon: 'arrow-down' },
  { label: 'Medium', value: 'medium', icon: 'alert' },
  { label: 'High', value: 'high', icon: 'arrow-up' },
  { label: 'Emergency', value: 'emergency', icon: 'medical-bag' },
];

export default function TenantMaintenanceRequestScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addRequest } = useMaintenanceStore();

  const [category, setCategory] = useState('plumbing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>('low');
  const [availabilityDate, setAvailabilityDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [permissionToEnter, setPermissionToEnter] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const bgColor = colorScheme === 'dark' ? '#101922' : '#F4F6F8';
  const cardColor = colorScheme === 'dark' ? '#151f2b' : '#ffffff';
  const textColor = colorScheme === 'dark' ? '#F4F6F8' : '#111827';

  const formattedAvailability = useMemo(() => availabilityDate.toLocaleString(), [availabilityDate]);

  const handleUpload = async (file: UploadedFile) => {
    try {
      setAttachments((prev) => [...prev, file]);
    } catch (error) {
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleRemoveFile = (uri: string) => {
    setAttachments((prev) => prev.filter((file) => file.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Details', 'Please add a title and description.');
      return;
    }
    setSubmitting(true);
    try {
      const id = addRequest({
        tenantId: 'tenant-001',
        tenantName: 'John Doe',
        property: '123 Main St',
        unit: 'Unit 4B',
        category: category as any,
        title,
        description,
        urgency,
        availability: availabilityDate.toISOString(),
        permissionToEnter,
        attachments,
      });
      router.push({ pathname: '/tenant-maintenance-confirmation', params: { id } });
    } catch (error) {
      Alert.alert('Error', 'Could not submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: textColor }]}>New Maintenance Request</Text>
        <View style={styles.iconPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ProgressHeader
          title="Tell us about the issue"
          subtitle="Provide as much detail as possible to help the property team resolve it quickly."
          step={1}
          totalSteps={2}
        />

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <FormInput label="Category">
            <CategoryDropdown value={category} onSelect={setCategory} options={categoryOptions} />
          </FormInput>

          <FormInput label="Title" description="Give this request a short title">
            <TextInput
              style={styles.input}
              placeholder="E.g., Leaky faucet in bathroom"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#94a3b8"
            />
          </FormInput>

          <FormInput label="Describe the issue" description="The more details the better.">
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What happened? When did you notice it? Any previous fixes attempted?"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
            />
          </FormInput>

          <FormInput label="Urgency">
            <View style={styles.urgencyRow}>
              {urgencyLevels.map((level) => {
                const active = urgency === level.value;
                return (
                  <TouchableOpacity
                    key={level.value}
                    style={[styles.urgencyCard, active && styles.urgencyActive]}
                    onPress={() => setUrgency(level.value as any)}>
                    <MaterialCommunityIcons
                      name={level.icon as any}
                      size={22}
                      color={active ? '#fff' : '#2563eb'}
                    />
                    <Text style={[styles.urgencyLabel, active && { color: '#fff' }]}>{level.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormInput>

          <FormInput label="Availability" description="When can maintenance access the unit?">
            <TouchableOpacity style={styles.availabilityButton} onPress={() => setShowDatePicker(true)}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#2563eb" />
              <Text style={styles.availabilityText}>{formattedAvailability}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={availabilityDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (date) setAvailabilityDate(date);
                }}
              />
            )}
          </FormInput>

          <FormInput label="Add Photos / Video" description="Optional, up to 1 MB each.">
            <UploadButton onUpload={handleUpload} />
            <FilePreview files={attachments} onRemove={handleRemoveFile} />
          </FormInput>

          <View style={styles.permissionCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>Permission to Enter</Text>
              <Text style={styles.permissionDescription}>Allow maintenance to enter if I’m not home.</Text>
            </View>
            <Switch
              value={permissionToEnter}
              onValueChange={setPermissionToEnter}
              trackColor={{ false: '#CBD5F5', true: '#2563eb' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 40,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  urgencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  urgencyCard: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  urgencyActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  urgencyLabel: {
    fontWeight: '600',
    color: '#2563eb',
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
  },
  availabilityText: {
    fontWeight: '600',
    color: '#111827',
  },
  permissionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  permissionDescription: {
    fontSize: 13,
    color: '#475569',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

