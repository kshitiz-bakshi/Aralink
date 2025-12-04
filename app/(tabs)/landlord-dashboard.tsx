import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import RentChart from '@/components/RentChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PortfolioOverview {
  activeLeases: number;
  occupancyRate: number;
}

interface RentCollection {
  collected: number;
  pending: number;
  notPaid: number;
  total: number;
  month: string;
  year: number;
}

interface Activity {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  type: 'payment' | 'maintenance' | 'message';
}

interface DashboardTile {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

export default function LandlordDashboardScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const isDark = colorScheme === 'dark';
  const primaryColor = '#4A90E2';
  const bgColor = isDark ? '#101c22' : '#F2F2F7';
  const cardBgColor = isDark ? '#1A2831' : '#ffffff';
  const textPrimaryColor = isDark ? '#F2F2F7' : '#101c22';
  const textSecondaryColor = isDark ? '#a0aec0' : '#8E8E93';
  const borderColor = isDark ? '#394a57' : '#E5E7EB';

  const portfolio: PortfolioOverview = {
    activeLeases: 10,
    occupancyRate: 83,
  };

  const rentCollection: RentCollection = {
    collected: 16250,
    pending: 6250,
    notPaid: 2500,
    total: 25000,
    month: 'July',
    year: 2024,
  };

  const activities: Activity[] = [
    {
      id: '1',
      icon: 'cash-multiple',
      title: 'Rent paid for Unit 5B',
      description: 'John Smith - $1,500',
      time: '1h ago',
      type: 'payment',
    },
    {
      id: '2',
      icon: 'toolbox',
      title: 'New maintenance request',
      description: 'Unit 3A - Leaky Faucet',
      time: '3h ago',
      type: 'maintenance',
    },
  ];

  const dashboardTiles: DashboardTile[] = [
    { id: '1', title: 'My Properties', subtitle: '12 units', icon: 'office-building', route: '/properties' },
    { id: '2', title: 'My Tenants', subtitle: '10 active', icon: 'account-group', route: '/tenants' },
    { id: '3', title: 'Leases', subtitle: 'Manage all', icon: 'gavel', route: '/leases' },
    { id: '4', title: 'Accounting', subtitle: 'Review finances', icon: 'file-document-outline', route: '/accounting' },
    { id: '5', title: 'Maintenance', subtitle: '2 open requests', icon: 'toolbox', route: '/landlord-maintenance-overview' },
    { id: '6', title: 'New Applicants', subtitle: '4 new', icon: 'file-document', route: '/landlord-applications' },
  ];

  const handleAddProperty = () => {
    setShowAddMenu(false);
    router.push('/property-detail');
  };

  const handleAddTenant = () => {
    setShowAddMenu(false);
    router.push('/tenant-detail');
  };

  const renderTile: ListRenderItem<DashboardTile> = ({ item }) => {
    const handleNavigation = () => {
      console.log('Navigating to:', item.route);
      // Use href format for Expo Router
      const href = item.route as Href;
      router.push(href);
    };

    return (
      <TouchableOpacity
        style={[styles.dashboardTile, { backgroundColor: cardBgColor }]}
        onPress={handleNavigation}>
        <MaterialCommunityIcons name={item.icon as any} size={24} color={primaryColor} />
        <ThemedText style={[styles.tileName, { color: textPrimaryColor }]}>{item.title}</ThemedText>
        <ThemedText style={[styles.tileSubtitle, { color: textSecondaryColor }]}>{item.subtitle}</ThemedText>
      </TouchableOpacity>
    );
  };

  const renderActivity: ListRenderItem<Activity> = ({ item }) => {
    const iconBgColor = item.type === 'payment' 
      ? (isDark ? '#065f46' : '#d1fae5') 
      : item.type === 'maintenance' 
      ? (isDark ? '#78350f' : '#fef3c7') 
      : `${primaryColor}20`;
    const iconColor = item.type === 'payment' 
      ? (isDark ? '#10b981' : '#059669') 
      : item.type === 'maintenance' 
      ? (isDark ? '#f59e0b' : '#d97706') 
      : primaryColor;
    
    return (
      <View style={[styles.activityItem, { backgroundColor: cardBgColor }]}>
        <View style={[styles.activityIconContainer, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons name={item.icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.activityContent}>
          <ThemedText style={[styles.activityTitle, { color: textPrimaryColor }]}>{item.title}</ThemedText>
          <ThemedText style={[styles.activityDescription, { color: textSecondaryColor }]}>
            {item.description}
          </ThemedText>
        </View>
        <ThemedText style={[styles.activityTime, { color: textSecondaryColor }]}>
          {item.time}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <TouchableOpacity
          style={[styles.headerCard, { backgroundColor: cardBgColor, marginTop: insets.top + 16 }]}
          onPress={() => router.push('/profile')}>
          <View style={styles.headerTop}>
            <View style={styles.profileSection}>
              <View style={[styles.profilePicture, { backgroundColor: isDark ? '#475569' : '#e2e8f0' }]}>
                <MaterialCommunityIcons name="account" size={24} color={textPrimaryColor} />
              </View>
              <View>
                <ThemedText style={[styles.greeting, { color: textPrimaryColor }]}>Hello, Taylor</ThemedText>
                <ThemedText style={[styles.portfolioLabel, { color: textSecondaryColor }]}>PORTFOLIO OVERVIEW</ThemedText>
              </View>
            </View>
          </View>
          <ThemedText style={[styles.statsText, { color: textPrimaryColor }]}>
            {portfolio.activeLeases} Active Leases • {portfolio.occupancyRate}% Occupancy
          </ThemedText>
        </TouchableOpacity>

        {/* Rent Collection Card */}
        <View style={[styles.rentCard, { backgroundColor: cardBgColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textPrimaryColor }]}>Rent Collection</ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: textSecondaryColor }]}>
            For {rentCollection.month} {rentCollection.year}
          </ThemedText>

          <RentChart 
            collected={rentCollection.collected} 
            pending={rentCollection.pending}
            notPaid={rentCollection.notPaid}
            total={rentCollection.total} 
          />

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <ThemedText style={[styles.legendText, { color: textPrimaryColor }]}>Paid</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <ThemedText style={[styles.legendText, { color: textPrimaryColor }]}>Pending</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#1e3a8a' : '#bfdbfe' }]} />
              <ThemedText style={[styles.legendText, { color: textPrimaryColor }]}>Overdue</ThemedText>
            </View>
          </View>
        </View>

        {/* Dashboard Tiles */}
        <FlatList
          data={dashboardTiles}
          keyExtractor={(item) => item.id}
          renderItem={renderTile}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.tilesRow}
        />

        {/* Recent Activity */}
        <ThemedText style={[styles.activitySectionTitle, { color: textPrimaryColor }]}>Recent Activity</ThemedText>
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB Button */}
      <View style={styles.fabContainer}>
        {showAddMenu && (
          <View style={[styles.addMenu, { backgroundColor: cardBgColor }]}>
            <TouchableOpacity style={styles.addMenuItem} onPress={handleAddTenant}>
              <MaterialCommunityIcons name="account-plus" size={24} color={primaryColor} />
              <ThemedText style={[styles.addMenuText, { color: textPrimaryColor }]}>Add Tenant</ThemedText>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.addMenuItem} onPress={handleAddProperty}>
              <MaterialCommunityIcons name="home-plus" size={24} color={primaryColor} />
              <ThemedText style={[styles.addMenuText, { color: textPrimaryColor }]}>Add Property</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: primaryColor }]}
          onPress={() => setShowAddMenu(!showAddMenu)}>
          <MaterialCommunityIcons name={showAddMenu ? 'close' : 'plus'} size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </ThemedView>
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
  headerCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  portfolioLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  rentCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  tilesRow: {
    gap: 16,
    marginBottom: 16,
  },
  dashboardTile: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tileName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 12,
  },
  activitySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
  },
  activityTime: {
    fontSize: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  addMenu: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuDivider: {
    height: 1,
  },
  addMenuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});