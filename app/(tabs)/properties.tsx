import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Property {
  id: string;
  address: string;
  city: string;
  units: number;
  occupied: number;
  status: 'active' | 'inactive';
  image: string;
}

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    address: '123 Main Street',
    city: 'Anytown, USA 12345',
    units: 4,
    occupied: 2,
    status: 'active',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmzGX6ps0Axputp-bjpvCY5yiPz5AlpQvGCW9Mq1Y20gSzf7tbrLThVBqXvIZY59y-jB8rsojYXreULJte3rUfLozFgtyKM5JyAJ2dngaXPegDuk4bjNK-6JGDtmx3NZm3fDcNrcDccJzotw-W8XLqEmjZqUZA5BIUfFQxZSUB1VZf_5-P1EIOw99C0IDQKmNOGGOSrFo4Dwcx3rEVKef1Tpi6pJiYK6B9KVEjLdQiuIEbLK1LvDU3OmgmYsHUR6OEknEWgHZeRMNs',
  },
  {
    id: '2',
    address: '456 Oak Avenue',
    city: 'Springfield, USA 67890',
    units: 2,
    occupied: 0,
    status: 'inactive',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaQrNC5AVv_VN4gyhuq1ObvDv4lxocsTs0JvkK9DQ-45Zgw9uye_1ivcovcB2Z_rbBQDbNWfDw9mjpQcPeSS1T5CEs9aCySdJnJOA3a2aB4ji3AqqCe5xbS5mGx-QYFxJbn4LLNRtFIgqeSngm63LLSms23UmEDqCwR7To82mubPInHRhEY5C35wy7twj3XoN5VizEx9VFidxL_b1dTNDOaEO2ZeOcU5jD5dvVCsI1pxqH2g20hTAjAyc-6c5N3v-59Gf5C6zuWXvk',
  },
  {
    id: '3',
    address: '789 Pine Lane',
    city: 'Rivertown, USA 54321',
    units: 3,
    occupied: 1,
    status: 'active',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArhC6WSeHtE0JWt9WeX4kBHe-izTwmluzQAVor-6Uqy98SVY-7r_Uu2mFg0i8_rox-DznmIBTpOkLHlUzlWmw_lIg05ZDF1u27itGzo4VKDjDMYLFirTGctnpxecIUbOy8sQGicTrdEmX27ybhhA_bz83d7698wxoTX8GHLrwt0d8ujN88PaWufNBeOCK1_Mg-mWuxjD4x776Unz9VKLW4CkQQkuakn5qT1-ON0ztwiNm9C_kLsmNbg-5utcHSKygVdyKkazPFxpmh',
  },
];

export default function PropertiesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101622' : '#f6f6f8';
  const cardBgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#4b5563' : '#e0e0e0';
  const textColor = isDark ? '#f3f4f6' : '#4a4a4a';
  const secondaryTextColor = isDark ? '#9ca3af' : '#9ca3af';
  const successColor = '#50E3C2';
  const dangerColor = '#D0021B';

  const filteredProperties = MOCK_PROPERTIES.filter((p) =>
    p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PropertyCard = ({ property }: { property: Property }) => {
    const statusColor = property.status === 'active' ? successColor : dangerColor;

    return (
      <TouchableOpacity
        onPress={() => router.push('/property-detail')}
        style={[styles.propertyCard, { backgroundColor: cardBgColor, borderColor }]}>
        <Image source={{ uri: property.image }} style={styles.propertyImage} />
        <View style={styles.propertyContent}>
          <View style={styles.propertyHeader}>
            <ThemedText type="subtitle" style={[styles.propertyTitle, { color: textColor }]}>
              {property.address}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <ThemedText
                style={[styles.statusText, { color: statusColor, fontSize: 12, fontWeight: '500' }]}>
                {property.status === 'active' ? 'Active' : 'Inactive'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.cityText, { color: secondaryTextColor }]}>
            {property.city}
          </ThemedText>
          <ThemedText style={[styles.unitsText, { color: textColor }]}>
            {property.units} Units, {property.occupied} Occupied
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { borderBottomColor: borderColor, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="menu" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={[styles.headerTitle, { color: textColor }]}>
          My Properties
        </ThemedText>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="bell" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor,
            },
          ]}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={secondaryTextColor}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search properties..."
            placeholderTextColor={secondaryTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Properties List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#135bec' }]}
        onPress={() => router.push('/property-detail')}>
        <MaterialCommunityIcons name="plus" size={28} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  propertyCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e0e0e0',
  },
  propertyContent: {
    padding: 12,
    gap: 6,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cityText: {
    fontSize: 12,
    fontWeight: '400',
  },
  unitsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#135bec',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
