import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface DashboardTile {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const tiles: DashboardTile[] = [
    { id: '1', title: 'My Properties', icon: 'building.2.fill', route: '/(tabs)/properties', color: '#FF6B6B' },
    { id: '2', title: 'My Tenants', icon: 'person.2.fill', route: '/(tabs)/tenants', color: '#4ECDC4' },
    { id: '3', title: 'Maintenance', icon: 'wrench.fill', route: '/(tabs)/maintenance', color: '#FFE66D' },
    { id: '4', title: 'Applicants', icon: 'person.crop.circle.badge.plus', route: '/(tabs)/applicants', color: '#A8E6CF' },
    { id: '5', title: 'Accounting', icon: 'doc.plaintext.fill', route: '/(tabs)/accounting', color: '#C7CEEA' },
  ];

  const renderTile: ListRenderItem<DashboardTile> = ({ item }) => (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: item.color }]}
      onPress={() => router.push(item.route as any)}>
      <IconSymbol size={36} name={item.icon as any} color="#fff" />
      <ThemedText style={styles.tileText}>{item.title}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.welcome}>
          <ThemedText type="title">Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>Welcome back, Landlord!</ThemedText>
        </ThemedView>

        <FlatList
          data={tiles}
          keyExtractor={(item) => item.id}
          renderItem={renderTile}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  welcome: {
    marginBottom: 30,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  row: {
    gap: 16,
    marginBottom: 16,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  tileText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
