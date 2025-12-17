import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadMultipleImages, STORAGE_BUCKETS } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { usePropertyStore } from '@/store/propertyStore';

export default function AddPropertyScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addProperty } = usePropertyStore();
  const { user } = useAuthStore();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#f6f7f8';
  const cardBgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const secondaryTextColor = isDark ? '#9ca3af' : '#6b7280';
  const primaryColor = '#137fec';
  const inputBgColor = isDark ? '#1f2937' : '#ffffff';

  const [formData, setFormData] = useState({
    // Location fields
    location: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Property details
    name: '',
    propertyType: 'single_unit' as 'single_unit' | 'multi_unit' | 'commercial' | 'parking',
    landlordName: '',
    
    // Rental options (conditional)
    rentCompleteProperty: false,
    description: '',
    photos: [] as string[],
    
    // Parking and rent (conditional)
    parkingIncluded: false,
    rentAmount: '',
    
    // Utilities
    utilities: {
      electricity: 'landlord' as 'landlord' | 'tenant',
      heatGas: 'landlord' as 'landlord' | 'tenant',
      water: 'landlord' as 'landlord' | 'tenant',
      wifi: 'landlord' as 'landlord' | 'tenant',
      rentalEquipments: 'landlord' as 'landlord' | 'tenant',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

  // Handle address autocomplete
  const handleAddressChange = (text: string) => {
    setFormData(prev => ({ ...prev, address1: text }));
    
    // TODO: Implement Google Places API call
    // For now, just show mock suggestions
    if (text.length > 2) {
      setAddressSuggestions([
        `${text} Street, New York, NY`,
        `${text} Avenue, Los Angeles, CA`,
        `${text} Road, Chicago, IL`,
      ]);
    } else {
      setAddressSuggestions([]);
    }
  };

  const selectAddress = (address: string) => {
    // Parse the selected address
    const parts = address.split(', ');
    setFormData(prev => ({
      ...prev,
      address1: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
    }));
    setAddressSuggestions([]);
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.address1.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }
    if (!formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
      Alert.alert('Error', 'Please complete the location details');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload images to Supabase Storage if any
      let uploadedPhotoUrls: string[] = [];
      if (formData.photos.length > 0 && user?.id) {
        // Filter out already-uploaded URLs (they start with http)
        const localPhotos = formData.photos.filter(uri => !uri.startsWith('http'));
        const existingUrls = formData.photos.filter(uri => uri.startsWith('http'));
        
        if (localPhotos.length > 0) {
          const folder = `properties/${user.id}`;
          uploadedPhotoUrls = await uploadMultipleImages(
            localPhotos, 
            STORAGE_BUCKETS.PROPERTY_IMAGES, 
            folder
          );
        }
        
        // Combine existing URLs with newly uploaded ones
        uploadedPhotoUrls = [...existingUrls, ...uploadedPhotoUrls];
      }

      // Pass the user ID to save to Supabase
      await addProperty({
        location: formData.location || `${formData.city}, ${formData.state}`,
        address1: formData.address1,
        address2: formData.address2 || undefined,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        name: formData.name || undefined,
        propertyType: formData.propertyType,
        landlordName: formData.landlordName || undefined,
        rentCompleteProperty: formData.propertyType !== 'multi_unit' ? formData.rentCompleteProperty : undefined,
        description: formData.description || undefined,
        photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
        parkingIncluded: formData.propertyType !== 'multi_unit' ? formData.parkingIncluded : undefined,
        rentAmount: formData.propertyType !== 'multi_unit' && formData.rentAmount 
          ? parseFloat(formData.rentAmount) 
          : undefined,
        utilities: formData.utilities,
      }, user?.id);
      
      router.back();
    } catch (error) {
      console.error('Error adding property:', error);
      Alert.alert('Error', 'Failed to add property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMultiUnit = formData.propertyType === 'multi_unit';

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Add Property</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Location Section */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Location</ThemedText>
            
            {/* Location Name (Optional) */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
                Location Name (Optional)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="e.g., Downtown San Francisco"
                placeholderTextColor={secondaryTextColor}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>

            {/* Address 1 with Autocomplete */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Address <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="Start typing address..."
                placeholderTextColor={secondaryTextColor}
                value={formData.address1}
                onChangeText={handleAddressChange}
              />
              {addressSuggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: cardBgColor, borderColor }]}>
                  {addressSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
                      onPress={() => selectAddress(suggestion)}
                    >
                      <MaterialCommunityIcons name="map-marker" size={20} color={secondaryTextColor} />
                      <ThemedText style={[styles.suggestionText, { color: textColor }]}>
                        {suggestion}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Address 2 */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
                Address Line 2 (Optional)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="Apartment, suite, unit, etc."
                placeholderTextColor={secondaryTextColor}
                value={formData.address2}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address2: text }))}
              />
            </View>

            {/* City, State, Zip */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  City <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="City"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  State <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="State"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.state}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                />
              </View>
            </View>

            {/* Zip Code and Country */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  Zip Code <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="Zip Code"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.zipCode}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, zipCode: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>Country</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                  placeholder="Country"
                  placeholderTextColor={secondaryTextColor}
                  value={formData.country}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                />
              </View>
            </View>
          </View>

          {/* Property Name (Optional) */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Property Details</ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
                Property Name (Optional)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="e.g., Sunset Apartments"
                placeholderTextColor={secondaryTextColor}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
            </View>
          </View>

          {/* Rental Setup - 4 Radio Buttons */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Rental Setup</ThemedText>
            <View style={styles.radioGrid}>
              {[
                { value: 'single_unit', label: 'Single Unit' },
                { value: 'multi_unit', label: 'Multi-Unit' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'parking', label: 'Parking' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioButton,
                    { borderColor, backgroundColor: inputBgColor },
                    formData.propertyType === option.value && {
                      borderColor: primaryColor,
                      backgroundColor: `${primaryColor}10`,
                    },
                  ]}
                  onPress={() => setFormData(prev => ({ 
                    ...prev, 
                    propertyType: option.value as any 
                  }))}
                >
                  <View style={[
                    styles.radioCircle,
                    { borderColor: formData.propertyType === option.value ? primaryColor : borderColor },
                  ]}>
                    {formData.propertyType === option.value && (
                      <View style={[styles.radioCircleInner, { backgroundColor: primaryColor }]} />
                    )}
                  </View>
                  <ThemedText style={[styles.radioLabel, { color: textColor }]}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Landlord Name */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
                Landlord Name (Optional)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="Enter landlord name"
                placeholderTextColor={secondaryTextColor}
                value={formData.landlordName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, landlordName: text }))}
              />
            </View>
          </View>

          {/* Rent Complete Property (Only for non-multi-unit) */}
          {!isMultiUnit && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  rentCompleteProperty: !prev.rentCompleteProperty
                }))}
              >
                <View style={[styles.checkbox, { borderColor }]}>
                  {formData.rentCompleteProperty && (
                    <MaterialCommunityIcons name="check" size={18} color={primaryColor} />
                  )}
                </View>
                <ThemedText style={[styles.checkboxLabel, { color: textColor }]}>
                  Do you want to rent the complete property?
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
                Description (Optional)
              </ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                placeholder="Enter property description..."
                placeholderTextColor={secondaryTextColor}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
              Photos (Optional)
            </ThemedText>
            <View style={styles.photosGrid}>
              {formData.photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => removePhoto(index)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.photoAdd, { borderColor, backgroundColor: inputBgColor }]}
                onPress={pickImages}
              >
                <MaterialCommunityIcons name="camera-plus" size={32} color={primaryColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Parking Included (Only for non-multi-unit) */}
          {!isMultiUnit && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  parkingIncluded: !prev.parkingIncluded
                }))}
              >
                <View style={[styles.checkbox, { borderColor }]}>
                  {formData.parkingIncluded && (
                    <MaterialCommunityIcons name="check" size={18} color={primaryColor} />
                  )}
                </View>
                <ThemedText style={[styles.checkboxLabel, { color: textColor }]}>
                  Parking Included
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Rent Amount (Only for non-multi-unit) */}
          {!isMultiUnit && formData.rentCompleteProperty === true &&(
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
                  Rent Amount (Optional)
                </ThemedText>
                <View style={styles.currencyInputContainer}>
                  <ThemedText style={[styles.currencySymbol, { color: secondaryTextColor }]}>$</ThemedText>
                  <TextInput
                    style={[styles.currencyInput, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
                    placeholder="0.00"
                    placeholderTextColor={secondaryTextColor}
                    value={formData.rentAmount}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, rentAmount: text }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Utilities Section */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Utilities</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>
              Who pays for utilities?
            </ThemedText>
            
            {[
              { key: 'electricity', label: 'Electricity' },
              { key: 'heatGas', label: 'Heat / Gas' },
              { key: 'water', label: 'Water' },
              { key: 'wifi', label: 'Wi-Fi' },
              { key: 'rentalEquipments', label: 'Rental Equipments' },
            ].map((utility) => (
              <View key={utility.key} style={styles.utilityRow}>
                <ThemedText style={[styles.utilityLabel, { color: textColor }]}>
                  {utility.label}
                </ThemedText>
                <View style={styles.utilityButtons}>
                  <TouchableOpacity
                    style={[
                      styles.utilityButton,
                      { borderColor, backgroundColor: inputBgColor },
                      formData.utilities[utility.key as keyof typeof formData.utilities] === 'landlord' && {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      },
                    ]}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      utilities: {
                        ...prev.utilities,
                        [utility.key]: 'landlord',
                      },
                    }))}
                  >
                    <ThemedText style={[
                      styles.utilityButtonText,
                      { color: formData.utilities[utility.key as keyof typeof formData.utilities] === 'landlord' ? '#fff' : textColor },
                    ]}>
                      Landlord
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.utilityButton,
                      { borderColor, backgroundColor: inputBgColor },
                      formData.utilities[utility.key as keyof typeof formData.utilities] === 'tenant' && {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      },
                    ]}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      utilities: {
                        ...prev.utilities,
                        [utility.key]: 'tenant',
                      },
                    }))}
                  >
                    <ThemedText style={[
                      styles.utilityButtonText,
                      { color: formData.utilities[utility.key as keyof typeof formData.utilities] === 'tenant' ? '#fff' : textColor },
                    ]}>
                      Tenant
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: bgColor, borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: primaryColor, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={styles.submitButtonText}>Saving Property...</ThemedText>
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
              Saving property...
            </ThemedText>
            <ThemedText style={[styles.loadingSubtext, { color: secondaryTextColor }]}>
              {formData.photos.length > 0 ? 'Uploading images...' : 'Please wait'}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  suggestionsContainer: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  radioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: '48%',
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  photoAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 16,
    fontSize: 16,
    fontWeight: '600',
    zIndex: 1,
  },
  currencyInput: {
    flex: 1,
    height: 48,
    paddingLeft: 36,
    paddingRight: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  utilityLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  utilityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  utilityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  utilityButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
