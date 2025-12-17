import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadImage, STORAGE_BUCKETS } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { usePropertyStore } from '@/store/propertyStore';
import { useTenantStore } from '@/store/tenantStore';

export default function AddTenantScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { properties } = usePropertyStore();
  const { addTenant, updateTenant, getTenantById } = useTenantStore();
  const { user } = useAuthStore();
  
  const isEditing = !!id;
  const existingTenant = id ? getTenantById(id) : null;

  useEffect(() => {
    if (existingTenant) {
      setFormData({
        firstName: existingTenant.firstName,
        lastName: existingTenant.lastName,
        email: existingTenant.email,
        phone: existingTenant.phone,
        propertyId: existingTenant.propertyId,
        startDate: existingTenant.startDate || '',
        endDate: existingTenant.endDate || '',
        rentAmount: existingTenant.rentAmount?.toString() || '',
        photo: existingTenant.photo || '',
      });
    }
  }, [existingTenant]);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#f6f7f8';
  const cardBgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#f3f4f6' : '#0d141b';
  const secondaryTextColor = isDark ? '#9ca3af' : '#6b7280';
  const inputBgColor = isDark ? '#1a242d' : '#f9fafb';
  const primaryColor = '#137fec';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    photo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter first and last name');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return;
    }
    if (!formData.propertyId) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload photo to Supabase Storage if it's a local file
      let photoUrl = formData.photo;
      if (formData.photo && !formData.photo.startsWith('http') && user?.id) {
        const folder = `tenants/${user.id}`;
        const result = await uploadImage(
          formData.photo, 
          STORAGE_BUCKETS.TENANT_PHOTOS, 
          folder
        );
        if (result.success && result.url) {
          photoUrl = result.url;
        }
      }

      if (isEditing && id) {
        // Update existing tenant
        await updateTenant(id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          propertyId: formData.propertyId,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : undefined,
          photo: photoUrl || undefined,
        });
      } else {
        // Add new tenant
        await addTenant({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          propertyId: formData.propertyId,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : undefined,
          photo: photoUrl || undefined,
        }, user?.id);
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving tenant:', error);
      Alert.alert('Error', 'Failed to save tenant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const propertyOptions = properties.map(p => ({
    id: p.id,
    label: `${p.streetAddress}, ${p.city}, ${p.state}`,
  }));

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          {isEditing ? 'Edit Tenant' : 'New Tenant'}
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
              {formData.photo ? (
                <Image source={{ uri: formData.photo }} style={styles.photo} />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? '#374151' : '#e5e7eb', borderColor }]}>
                  <MaterialCommunityIcons name="camera-plus" size={48} color={secondaryTextColor} />
                </View>
              )}
            </TouchableOpacity>
            <ThemedText style={[styles.photoLabel, { color: secondaryTextColor }]}>
              Upload Photo (Optional)
            </ThemedText>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* First Name and Last Name */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>First Name</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="Enter first name"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>Last Name</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="Enter last name"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>Email</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="Enter email address"
                placeholderTextColor={secondaryTextColor}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>Phone</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="Enter phone number"
                placeholderTextColor={secondaryTextColor}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
            </View>

            {/* Property Selection */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>Address/Location</ThemedText>
              <TouchableOpacity
                style={[styles.select, { backgroundColor: inputBgColor, borderColor }]}
                onPress={() => setShowPropertyDropdown(!showPropertyDropdown)}
              >
                <ThemedText style={[styles.selectText, { color: formData.propertyId ? textColor : secondaryTextColor }]}>
                  {selectedProperty ? `${selectedProperty.streetAddress}, ${selectedProperty.city}` : 'Select a property'}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
              {showPropertyDropdown && (
                <View style={[styles.dropdown, { backgroundColor: cardBgColor, borderColor }]}>
                  {propertyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.dropdownItem, { borderBottomColor: borderColor }]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, propertyId: option.id }));
                        setShowPropertyDropdown(false);
                      }}
                    >
                      <ThemedText style={[styles.dropdownItemText, { color: textColor }]}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Start Date and End Date */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>Start Date</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="Optional"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.startDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>End Date</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="Optional"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.endDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                />
              </View>
            </View>

            {/* Rent Amount */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>Rent Amount</ThemedText>
              <View style={styles.currencyInput}>
                <MaterialCommunityIcons name="currency-usd" size={20} color={secondaryTextColor} style={styles.currencyIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithCurrency, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="Optional"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.rentAmount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, rentAmount: text }))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: primaryColor, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={styles.submitButtonText}>Saving...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      <Modal visible={isSubmitting} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: cardBgColor }]}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>
              Saving tenant...
            </ThemedText>
            <ThemedText style={[styles.loadingSubtext, { color: secondaryTextColor }]}>
              {formData.photo ? 'Uploading photo...' : 'Please wait'}
            </ThemedText>
          </View>
        </View>
      </Modal>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photoContainer: {
    marginBottom: 12,
  },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: '#fff',
  },
  photoPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  formSection: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  select: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  currencyIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputWithCurrency: {
    paddingLeft: 48,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    backgroundColor: 'rgba(246, 247, 248, 0.95)',
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
  },
});

