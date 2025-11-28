import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface Vendor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  eta: string;
}

interface VendorListProps {
  vendors: Vendor[];
  selectedVendor?: string;
  onSelect: (vendorId: string) => void;
}

export function VendorList({ vendors, selectedVendor, onSelect }: VendorListProps) {
  return (
    <View>
      {vendors.map((item, index) => {
        const isSelected = selectedVendor === item.id;
        return (
          <View key={item.id}>
            {index > 0 && <View style={{ height: 12 }} />}
            <TouchableOpacity
              style={[
                styles.card,
                { borderColor: isSelected ? '#2563eb' : '#e2e8f0', backgroundColor: isSelected ? '#eff6ff' : '#fff' },
              ]}
              onPress={() => onSelect(item.id)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={styles.vendorName}>{item.name}</Text>
                  <Text style={styles.specialty}>{item.specialty}</Text>
                </View>
                <View style={styles.rating}>
                  <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.eta}>Typical response: {item.eta}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  specialty: {
    fontSize: 13,
    color: '#4b5563',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontWeight: '600',
    color: '#0f172a',
  },
  eta: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default VendorList;

