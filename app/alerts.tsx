import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Alert {
  id: string;
  type: 'financial' | 'maintenance' | 'lease' | 'application';
  icon: string;
  title: string;
  description: string;
  action?: string;
  actionType?: 'button' | 'time';
  timestamp?: string;
  bgColor: string;
  iconColor: string;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'financial',
    icon: 'alert-circle',
    title: 'Rent Overdue: Unit 101',
    description: 'John Doe - 3 days overdue',
    action: 'Send Reminder',
    actionType: 'button',
    bgColor: '#D0021B',
    iconColor: '#D0021B',
  },
  {
    id: '2',
    type: 'maintenance',
    icon: 'wrench',
    title: 'New Request: Leaky Faucet (Unit 101)',
    description: 'Received 5m ago',
    action: 'View Request',
    actionType: 'button',
    bgColor: '#6b7280',
    iconColor: '#6b7280',
  },
  {
    id: '3',
    type: 'lease',
    icon: 'hourglass-top',
    title: 'Lease Expiring in 30 Days: Unit 301',
    description: 'Mary Johnson',
    action: 'Renew Lease',
    actionType: 'button',
    bgColor: '#F5A623',
    iconColor: '#F5A623',
  },
  {
    id: '4',
    type: 'financial',
    icon: 'check-circle',
    title: 'Payment Received: Unit 204',
    description: 'Sam Lee - $1,500.00',
    timestamp: 'Yesterday',
    actionType: 'time',
    bgColor: '#7ED321',
    iconColor: '#7ED321',
  },
  {
    id: '5',
    type: 'application',
    icon: 'file-document',
    title: 'Application Received: Jane Smith',
    description: 'For 123 Main St',
    action: 'View App',
    actionType: 'button',
    bgColor: '#6b7280',
    iconColor: '#6b7280',
  },
];

export default function AlertsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<string>('all');
  const [smartReminders, setSmartReminders] = useState(true);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101622' : '#f6f6f8';
  const cardBgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#4b5563' : '#e5e7eb';
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const secondaryTextColor = isDark ? '#9ca3af' : '#4b5563';
  const primaryColor = '#135bec';

  const filteredAlerts = MOCK_ALERTS.filter((alert) => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const AlertCard = ({ alert }: { alert: Alert }) => (
    <View style={[styles.alertItem, { borderBottomColor: borderColor }]}>
      <View style={styles.alertLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: alert.bgColor + '15' },
          ]}>
          <MaterialCommunityIcons
            name={alert.icon as any}
            size={20}
            color={alert.iconColor}
          />
        </View>
        <View style={styles.alertContent}>
          <ThemedText style={[styles.alertTitle, { color: textColor }]}>
            {alert.title}
          </ThemedText>
          <ThemedText style={[styles.alertDescription, { color: secondaryTextColor }]}>
            {alert.description}
          </ThemedText>
        </View>
      </View>
      <View style={styles.alertAction}>
        {alert.actionType === 'button' && alert.action ? (
          <TouchableOpacity>
            <ThemedText style={[styles.actionButton, { color: primaryColor }]}>
              {alert.action}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <ThemedText style={[styles.timestamp, { color: secondaryTextColor }]}>
            {alert.timestamp}
          </ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { borderBottomColor: borderColor, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Alerts</ThemedText>
        <TouchableOpacity>
          <MaterialCommunityIcons name="cog" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Smart Reminders Panel */}
        <View style={styles.panelContainer}>
          <View
            style={[
              styles.smartPanel,
              { backgroundColor: cardBgColor, borderColor },
            ]}>
            <View style={styles.panelTextContent}>
              <ThemedText style={[styles.panelTitle, { color: textColor }]}>
                Automate with Smart Reminders
              </ThemedText>
              <ThemedText style={[styles.panelDescription, { color: secondaryTextColor }]}>
                Automatically notify tenants before rent due dates, lease expirations, and inspections.
              </ThemedText>
            </View>
            <Switch
              value={smartReminders}
              onValueChange={setSmartReminders}
              trackColor={{ false: '#d1d5db', true: primaryColor + '40' }}
              thumbColor={smartReminders ? primaryColor : '#d1d5db'}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={[styles.filterTabs, { backgroundColor: cardBgColor }]}>
            {['all', 'financial', 'maintenance', 'lease'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  filter === tab && [
                    styles.filterTabActive,
                    { backgroundColor: isDark ? '#374151' : '#f3f4f6' },
                  ],
                ]}
                onPress={() => setFilter(tab)}>
                <ThemedText
                  style={[
                    styles.filterTabText,
                    filter === tab && { color: textColor, fontWeight: '600' },
                    filter !== tab && { color: secondaryTextColor },
                  ]}>
                  {tab === 'all'
                    ? 'All'
                    : tab === 'financial'
                    ? 'Financial'
                    : tab === 'maintenance'
                    ? 'Maintenance'
                    : 'Leases'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  panelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  smartPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  panelTextContent: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  panelDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterTabActive: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  alertsList: {
    paddingHorizontal: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  alertLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 13,
    fontWeight: '400',
  },
  alertAction: {
    alignItems: 'flex-end',
  },
  actionButton: {
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
  },
});
