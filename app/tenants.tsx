import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Tenant {
  id: string;
  name: string;
  unit: string;
  status: 'active' | 'inactive';
  image: string;
}

const MOCK_TENANTS: Tenant[] = [
  {
    id: '1',
    name: 'Eleanor Vance',
    unit: 'Unit 12B, 456 Maple St',
    status: 'active',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBimC0DGZ9eLx_JiDG8qtkl4_7Dx9YxYYCLJAT-di2VJ5Xg7KWygPlq6_JcJUDg_hiUAaGJIuaLAid6zA5NxT9Y-LKbakem7YGEp4YkicGUDquJPbUgaeHfzPck4vZp109rwX_Pgv6t7AfMScu2hEarvhQWV5U4dL9kWXnKlpoUegQIPjTLUC6dR-Fxbxu4Gf2DioBmb6k2BM5wGyyqWL4THX4_ZTMaEiflIlCcTaJjvw03AvQ9-JmlQoaQwThdsP4QQkni4nrt38b1',
  },
  {
    id: '2',
    name: 'Marcus Holloway',
    unit: 'Apt 3, 789 Oak Ave',
    status: 'active',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5tDcABIratjNifjgW0pdkdJ2_vLNBek_0fkXIb9oLefg698eDGKwbXq_6F9mKtoxo8f3KQNwrAUc5jaD6WU-xOQaUfSZKsDLpKjyCpcxXNOv42k-5fOh4ShULx_oGKaYHKV8NxzoHDLRYnINpQR2G4ztCAr-Fhjnk7C7e8cabIdfsTc6uI2-2RydqAnEs_qCSzsBrXyt1eVUa_9OBcqLRSDi5sf-VW-jni_auEiLpSJJq26odJh89ksP0OZQ_A2df0mbUXR6X6wDi',
  },
  {
    id: '3',
    name: 'Clara Oswald',
    unit: 'Unit 5, 101 Pine Ln',
    status: 'inactive',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdx3bgQ18SIagIbQFmcJwJOoawA4am_im631qWybxw3tGTiUsrQ-IRxoLue3t1sCyyA6Nc1Irly3pFlJHoeHAcMz_GveFXto8HwjMD264MKyP8MKZcMQRQtnfM0tZ-uq9sMY1g40dLimIMsV1DZn4v37DbqoaZD2b5mz0KjHBQBORoFpy-iWW-dtecsIONatIaDCPOzYqLuHhYUlf8dIMF1_Qm7J-AsZ7jgga8HV0KXrvYmlpG0v1AbiP3xrq4Uh1OdhjPfCtlWbSn',
  },
];

export default function TenantsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101622' : '#f4f6f8';
  const cardBgColor = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e0e0e0';
  const textColor = isDark ? '#e0e0e0' : '#212529';
  const secondaryTextColor = isDark ? '#9ca3af' : '#6c757d';
  const primaryColor = '#005a9c';
  const successColor = '#28a745';

  const filteredTenants = MOCK_TENANTS.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const TenantCard = ({ tenant }: { tenant: Tenant }) => {
    return (
      <TouchableOpacity
        style={[styles.tenantCard, { backgroundColor: cardBgColor }]}
        onPress={() => router.push('/tenant-detail')}>
        <View style={styles.tenantHeader}>
          <View style={styles.tenantLeft}>
            <Image source={{ uri: tenant.image }} style={styles.tenantAvatar} />
            <View style={styles.tenantInfo}>
              <ThemedText style={[styles.tenantName, { color: textColor }]}>
                {tenant.name}
              </ThemedText>
              <ThemedText style={[styles.tenantUnit, { color: secondaryTextColor }]}>
                {tenant.unit}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity>
            <MaterialCommunityIcons name="dots-vertical" size={20} color={secondaryTextColor} />
          </TouchableOpacity>
        </View>
        <View style={[styles.divider, { borderTopColor: borderColor }]} />
        <View style={styles.statusRow}>
          <ThemedText style={[styles.statusLabel, { color: secondaryTextColor }]}>Status</ThemedText>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: tenant.status === 'active' ? `${successColor}19` : '#f0f0f0',
              },
            ]}>
            <ThemedText
              style={[
                styles.statusBadgeText,
                { color: tenant.status === 'active' ? successColor : secondaryTextColor },
              ]}>
              {tenant.status === 'active' ? 'Active' : 'Inactive'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { borderBottomColor: borderColor, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={[styles.headerTitle, { color: textColor }]}>
          Manage Tenants
        </ThemedText>
        <View style={styles.iconButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: cardBgColor, borderColor }]}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={secondaryTextColor}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search tenants"
            placeholderTextColor={secondaryTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: isDark ? '#1a2332' : '#f4f6f8' }]}>
        {(['all', 'active', 'inactive'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && [styles.filterButtonActive, { backgroundColor: cardBgColor }],
              filterStatus !== status && { backgroundColor: cardBgColor },
            ]}
            onPress={() => setFilterStatus(status)}>
            <ThemedText
              style={[
                styles.filterButtonText,
                filterStatus === status && { color: primaryColor, fontWeight: '600' },
              ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tenants List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredTenants.map((tenant) => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: primaryColor }]} onPress={() => router.push('/tenant-detail')}>
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
  },
  iconButton: {
    width: 48,
    height: 48,
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
    borderRadius: 10,
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
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tenantCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tenantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  tenantUnit: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
