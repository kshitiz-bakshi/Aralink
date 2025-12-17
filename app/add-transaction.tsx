import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { usePropertyStore } from '@/store/propertyStore';

type TransactionType = 'income' | 'expense';

interface FormData {
  type: TransactionType;
  amount: string;
  date: Date;
  propertyId: string;
  category: string;
  serviceType: string;
  description: string;
}

const INCOME_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'garage', label: 'Garage' },
  { value: 'parking', label: 'Parking' },
  { value: 'other', label: 'Other' },
];

const EXPENSE_CATEGORIES = [
  { value: 'utility', label: 'Utility Bill' },
  { value: 'maintenance', label: 'Maintenance/Service' },
  { value: 'other', label: 'Other' },
];

export default function AddTransactionScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { properties } = usePropertyStore();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#f6f7f8';
  const cardBgColor = isDark ? '#1a2632' : '#ffffff';
  const inputBgColor = isDark ? '#1e293b' : '#f6f7f8';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#e0e6ed' : '#0d141b';
  const secondaryTextColor = isDark ? '#94a3b8' : '#4c739a';
  const placeholderColor = isDark ? '#64748b' : '#9ca3af';
  const primaryColor = '#137fec';

  const [formData, setFormData] = useState<FormData>({
    type: 'expense',
    amount: '',
    date: new Date(),
    propertyId: '',
    category: 'maintenance',
    serviceType: '',
    description: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Save to Supabase when ready
      // For now, just go back
      console.log('Transaction data:', formData);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Add New Transaction
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Income/Expense Toggle */}
          <View style={[styles.toggleWrapper, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                formData.type === 'income' && [styles.toggleActive, { backgroundColor: cardBgColor }],
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type: 'income', category: 'rent' }))}
            >
              <ThemedText 
                style={[
                  styles.toggleText,
                  { 
                    color: formData.type === 'income' ? primaryColor : secondaryTextColor,
                    fontWeight: formData.type === 'income' ? '700' : '500',
                  },
                ]}
              >
                Income
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                formData.type === 'expense' && [styles.toggleActive, { backgroundColor: cardBgColor }],
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type: 'expense', category: 'maintenance' }))}
            >
              <ThemedText 
                style={[
                  styles.toggleText,
                  { 
                    color: formData.type === 'expense' ? primaryColor : secondaryTextColor,
                    fontWeight: formData.type === 'expense' ? '700' : '500',
                  },
                ]}
              >
                Expense
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
              AMOUNT
            </ThemedText>
            <View style={[styles.amountInputContainer, { backgroundColor: cardBgColor, borderColor }]}>
              <ThemedText style={[styles.currencySymbol, { color: textColor }]}>$</ThemedText>
              <TextInput
                style={[styles.amountInput, { color: textColor }]}
                placeholder="0.00"
                placeholderTextColor={placeholderColor}
                keyboardType="decimal-pad"
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              />
            </View>
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
              DATE
            </ThemedText>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: cardBgColor, borderColor }]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={[styles.inputText, { color: textColor }]}>
                {formData.date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </ThemedText>
              <MaterialCommunityIcons name="calendar" size={20} color={secondaryTextColor} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormData(prev => ({ ...prev, date: selectedDate }));
                }
              }}
            />
          )}

          {/* Property Selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
              PROPERTY / UNIT
            </ThemedText>
            <View style={[styles.selectContainer, { backgroundColor: cardBgColor, borderColor }]}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.propertyOptions}
              >
                <TouchableOpacity
                  style={[
                    styles.propertyOption,
                    !formData.propertyId && { backgroundColor: `${primaryColor}15`, borderColor: primaryColor },
                    { borderColor },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, propertyId: '' }))}
                >
                  <ThemedText 
                    style={[
                      styles.propertyOptionText, 
                      { color: !formData.propertyId ? primaryColor : textColor }
                    ]}
                  >
                    None
                  </ThemedText>
                </TouchableOpacity>
                {properties.map((property) => (
                  <TouchableOpacity
                    key={property.id}
                    style={[
                      styles.propertyOption,
                      formData.propertyId === property.id && { backgroundColor: `${primaryColor}15`, borderColor: primaryColor },
                      { borderColor },
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, propertyId: property.id }))}
                  >
                    <ThemedText 
                      style={[
                        styles.propertyOptionText, 
                        { color: formData.propertyId === property.id ? primaryColor : textColor }
                      ]}
                    >
                      {property.name || `${property.city}, ${property.state}`}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
              CATEGORY
            </ThemedText>
            <View style={styles.categoryOptions}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    formData.category === cat.value 
                      ? { backgroundColor: primaryColor }
                      : { backgroundColor: cardBgColor, borderColor, borderWidth: 1 },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                >
                  <ThemedText 
                    style={[
                      styles.categoryOptionText,
                      { color: formData.category === cat.value ? '#ffffff' : textColor },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Service Type (for expense) */}
          {formData.type === 'expense' && formData.category === 'maintenance' && (
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
                SERVICE TYPE
              </ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: cardBgColor, borderColor, color: textColor }]}
                placeholder="e.g. Plumbing, Electrical, Cleaning"
                placeholderTextColor={placeholderColor}
                value={formData.serviceType}
                onChangeText={(text) => setFormData(prev => ({ ...prev, serviceType: text }))}
              />
            </View>
          )}

          {/* Description */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: secondaryTextColor }]}>
              DESCRIPTION / NOTES
            </ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: cardBgColor, borderColor, color: textColor }]}
              placeholder="Add details..."
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Buttons */}
      <View 
        style={[
          styles.bottomButtons, 
          { 
            backgroundColor: cardBgColor, 
            borderTopColor: borderColor,
            paddingBottom: insets.bottom + 16,
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
          onPress={() => router.back()}
        >
          <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
            Cancel
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: primaryColor, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </ThemedText>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
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
    padding: 16,
    gap: 24,
    paddingBottom: 120,
  },
  toggleWrapper: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    height: 48,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: 16,
    paddingLeft: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  propertyOptions: {
    gap: 8,
  },
  propertyOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  propertyOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 100,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

