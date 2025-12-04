import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: 'studio' | '1' | '2' | '3';
  bathrooms: '1' | '1.5' | '2';
}

interface AddressSuggestion {
  id: string;
  description: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface FormData {
  propertyType: 'single' | 'multi';
  numberOfUnits: string;
  addressInput: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  units: Unit[];
}

const PROPERTY_TYPES = [
  { label: 'Single Unit Home', value: 'single' },
  { label: 'Multi-Unit Building', value: 'multi' },
];

const BEDROOM_OPTIONS = ['Studio', '1', '2', '3'];
const BATHROOM_OPTIONS = ['1', '1.5', '2'];

// Mock address suggestions for autocomplete
const MOCK_ADDRESSES: AddressSuggestion[] = [
  {
    id: '1',
    description: '123 Main Street, Toronto, ON M5V 3A8',
    street: '123 Main Street',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5V 3A8',
    country: 'Canada',
  },
  {
    id: '2',
    description: '456 Queen Avenue, Vancouver, BC V6B 4N9',
    street: '456 Queen Avenue',
    city: 'Vancouver',
    province: 'BC',
    postalCode: 'V6B 4N9',
    country: 'Canada',
  },
  {
    id: '3',
    description: '789 Park Lane, Montreal, QC H1A 0A1',
    street: '789 Park Lane',
    city: 'Montreal',
    province: 'QC',
    postalCode: 'H1A 0A1',
    country: 'Canada',
  },
];

export default function PropertyDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const isDark = colorScheme === 'dark';
  const primaryColor = '#2A64F5';
  const bgColor = isDark ? '#101922' : '#F4F6F8';
  const cardBgColor = isDark ? '#1a202c' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#D1D5DB';
  const textColor = isDark ? '#F4F6F8' : '#111827';
  const subtextColor = isDark ? '#94a3b8' : '#6B7280';
  const placeholderColor = isDark ? '#64748b' : '#9ca3af';
  const inputBgColor = isDark ? '#1e293b' : '#F4F6F8';
  const errorColor = '#ef4444';
  const successColor = '#10b981';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    propertyType: 'single',
    numberOfUnits: '',
    addressInput: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    units: [],
  });

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 2;

  const handleAddressSearch = (text: string) => {
    setFormData({ ...formData, addressInput: text });

    if (text.length > 0) {
      const filtered = MOCK_ADDRESSES.filter((addr) =>
        addr.description.toLowerCase().includes(text.toLowerCase())
      );
      setAddressSuggestions(filtered);
      setShowAddressSuggestions(true);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setFormData({
      ...formData,
      addressInput: suggestion.description,
      street: suggestion.street,
      city: suggestion.city,
      province: suggestion.province,
      postalCode: suggestion.postalCode,
      country: suggestion.country,
    });
    setShowAddressSuggestions(false);
  };

  const handlePropertyTypeChange = (type: 'single' | 'multi') => {
    setFormData({
      ...formData,
      propertyType: type,
      numberOfUnits: '',
      units: [],
    });
  };

  const handleNumberOfUnitsChange = (text: string) => {
    const numUnits = parseInt(text);
    const units: Unit[] = [];

    for (let i = 0; i < numUnits; i++) {
      units.push({
        id: `unit-${i}`,
        unitNumber: `Unit ${i + 1}`,
        bedrooms: '1',
        bathrooms: '1',
      });
    }

    setFormData({
      ...formData,
      numberOfUnits: text,
      units,
    });
  };

  const handleUpdateUnit = (unitId: string, field: keyof Unit, value: any) => {
    setFormData({
      ...formData,
      units: formData.units.map((unit) =>
        unit.id === unitId ? { ...unit, [field]: value } : unit
      ),
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Property saved successfully!');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save property');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <View style={styles.stepContent}>
          <ThemedText style={[styles.stepTitle, { color: textColor }]}>
            Property Basics
          </ThemedText>

          {/* Property Type */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Property Type <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <View style={styles.typeButtonContainer}>
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        formData.propertyType === type.value
                          ? primaryColor + '20'
                          : inputBgColor,
                      borderColor:
                        formData.propertyType === type.value ? primaryColor : borderColor,
                    },
                  ]}
                  onPress={() =>
                    handlePropertyTypeChange(type.value as 'single' | 'multi')
                  }
                >
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      {
                        color:
                          formData.propertyType === type.value ? primaryColor : textColor,
                        fontWeight:
                          formData.propertyType === type.value ? '600' : '500',
                      },
                    ]}
                  >
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Number of Units - Show only if Multi-Unit */}
          {formData.propertyType === 'multi' && (
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Number of Units <ThemedText style={{ color: errorColor }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBgColor, borderColor, color: textColor },
                ]}
                placeholder="Enter number of units (e.g., 3)"
                placeholderTextColor={placeholderColor}
                value={formData.numberOfUnits}
                onChangeText={handleNumberOfUnitsChange}
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* Property Address */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Property Address <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <View style={[styles.addressInputContainer, { borderColor }]}>
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color={subtextColor}
              />
              <TextInput
                style={[styles.addressInput, { color: textColor }]}
                placeholder="Search address..."
                placeholderTextColor={placeholderColor}
                value={formData.addressInput}
                onChangeText={handleAddressSearch}
                onFocus={() => {
                  if (formData.addressInput.length > 0) {
                    setShowAddressSuggestions(true);
                  }
                }}
              />
            </View>

            {/* Address Suggestions */}
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <View
                style={[
                  styles.suggestionsContainer,
                  { backgroundColor: cardBgColor, borderColor },
                ]}
              >
                {addressSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={[
                      styles.suggestionItem,
                      { borderBottomColor: borderColor },
                    ]}
                    onPress={() => handleSelectAddress(suggestion)}
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={16}
                      color={primaryColor}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={[styles.suggestionText, { color: textColor }]}
                      >
                        {suggestion.description}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected Address Display */}
            {formData.street && (
              <View
                style={[
                  styles.selectedAddressBox,
                  { backgroundColor: inputBgColor, borderColor },
                ]}
              >
                <ThemedText
                  style={[styles.selectedAddressLabel, { color: subtextColor }]}
                >
                  Selected Address
                </ThemedText>
                <ThemedText
                  style={[styles.selectedAddressText, { color: textColor }]}
                >
                  {formData.street}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.selectedAddressText,
                    { color: subtextColor, fontSize: 12 },
                  ]}
                >
                  {formData.city}, {formData.province} {formData.postalCode}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      );
    } else if (currentStep === 2) {
      return (
        <View style={styles.stepContent}>
          <ThemedText style={[styles.stepTitle, { color: textColor }]}>
            {formData.propertyType === 'multi' ? 'Unit Details' : 'Review & Save'}
          </ThemedText>

          {formData.propertyType === 'multi' ? (
            <>
              {formData.units.map((unit) => (
                <View
                  key={unit.id}
                  style={[
                    styles.unitCard,
                    { backgroundColor: inputBgColor, borderColor },
                  ]}
                >
                  <ThemedText style={[styles.unitTitle, { color: textColor }]}>
                    {unit.unitNumber}
                  </ThemedText>

                  <View style={styles.unitForm}>
                    {/* Unit Name/Number */}
                    <View style={styles.inputGroup}>
                      <ThemedText style={[styles.label, { color: textColor }]}>
                        Unit Name/Number
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: cardBgColor,
                            borderColor,
                            color: textColor,
                          },
                        ]}
                        placeholder="e.g., Unit A, 101"
                        placeholderTextColor={placeholderColor}
                        value={unit.unitNumber}
                        onChangeText={(value) =>
                          handleUpdateUnit(unit.id, 'unitNumber', value)
                        }
                      />
                    </View>

                    {/* Bedrooms */}
                    <View style={styles.inputGroup}>
                      <ThemedText style={[styles.label, { color: textColor }]}>
                        Bedrooms
                      </ThemedText>
                      <View style={styles.dropdownContainer}>
                        {BEDROOM_OPTIONS.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.dropdownButton,
                              {
                                backgroundColor:
                                  unit.bedrooms ===
                                  (option === 'Studio' ? 'studio' : option)
                                    ? primaryColor + '20'
                                    : inputBgColor,
                                borderColor:
                                  unit.bedrooms ===
                                  (option === 'Studio' ? 'studio' : option)
                                    ? primaryColor
                                    : borderColor,
                              },
                            ]}
                            onPress={() =>
                              handleUpdateUnit(
                                unit.id,
                                'bedrooms',
                                option === 'Studio' ? 'studio' : (option as any)
                              )
                            }
                          >
                            <ThemedText
                              style={[
                                styles.dropdownButtonText,
                                {
                                  color:
                                    unit.bedrooms ===
                                    (option === 'Studio' ? 'studio' : option)
                                      ? primaryColor
                                      : textColor,
                                },
                              ]}
                            >
                              {option}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Bathrooms */}
                    <View style={styles.inputGroup}>
                      <ThemedText style={[styles.label, { color: textColor }]}>
                        Bathrooms
                      </ThemedText>
                      <View style={styles.dropdownContainer}>
                        {BATHROOM_OPTIONS.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.dropdownButton,
                              {
                                backgroundColor:
                                  unit.bathrooms === option
                                    ? primaryColor + '20'
                                    : inputBgColor,
                                borderColor:
                                  unit.bathrooms === option
                                    ? primaryColor
                                    : borderColor,
                              },
                            ]}
                            onPress={() =>
                              handleUpdateUnit(unit.id, 'bathrooms', option as any)
                            }
                          >
                            <ThemedText
                              style={[
                                styles.dropdownButtonText,
                                {
                                  color:
                                    unit.bathrooms === option ? primaryColor : textColor,
                                },
                              ]}
                            >
                              {option}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View
              style={[
                styles.reviewBox,
                { backgroundColor: inputBgColor, borderColor },
              ]}
            >
              <ThemedText style={[styles.reviewLabel, { color: subtextColor }]}>
                Property Summary
              </ThemedText>
              <ThemedText style={[styles.reviewText, { color: textColor }]}>
                {`Address:\n${formData.street}\n${formData.city}, ${formData.province} ${formData.postalCode}\n\nType: Single Unit Home`}
              </ThemedText>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            {id ? 'Edit Property' : 'Add Property'}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress */}
        <View style={[styles.progressContainer, { backgroundColor: cardBgColor }]}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: primaryColor,
                  width: `${(currentStep / totalSteps) * 100}%`,
                },
              ]}
            />
          </View>
          <ThemedText style={[styles.progressText, { color: subtextColor }]}>
            Step {currentStep} of {totalSteps}
          </ThemedText>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: cardBgColor }]}>
          {renderStep()}
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View
        style={[
          styles.footer,
          { backgroundColor: cardBgColor, borderTopColor: borderColor },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.footerButton,
            {
              backgroundColor: inputBgColor,
              borderColor,
              opacity: currentStep === 1 ? 0.5 : 1,
            },
          ]}
          onPress={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ThemedText style={[styles.footerButtonText, { color: textColor }]}>
            Previous
          </ThemedText>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: primaryColor }]}
            onPress={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
          >
            <ThemedText style={[styles.footerButtonText, { color: '#ffffff' }]}>
              Next
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: successColor }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <ThemedText style={[styles.footerButtonText, { color: '#ffffff' }]}>
              {isLoading ? 'Saving...' : 'Save'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 1.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 14,
  },
  typeButtonContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 0,
  },
  addressInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  suggestionsContainer: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    marginTop: -8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectedAddressBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  selectedAddressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedAddressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  unitCard: {
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  unitTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
  },
  unitForm: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dropdownButton: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    gap: 8,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
