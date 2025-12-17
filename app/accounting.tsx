import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TransactionType = 'income' | 'expense';
type TransactionCategory = 'all' | 'rent' | 'garage' | 'parking' | 'utility' | 'maintenance' | 'other';
type TransactionStatus = 'paid' | 'pending' | 'overdue';

interface Transaction {
  id: string;
  title: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  date: string;
  time: string;
  status: TransactionStatus;
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

// Group transactions by date section
interface TransactionSection {
  title: string;
  data: Transaction[];
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Unit 4B Rent',
    category: 'rent',
    type: 'income',
    amount: 1200.00,
    date: '2023-10-24',
    time: '10:42 AM',
    status: 'paid',
    icon: 'office-building',
    iconBgColor: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: '2',
    title: 'Garage Space A2',
    category: 'garage',
    type: 'income',
    amount: 150.00,
    date: '2023-10-24',
    time: '09:15 AM',
    status: 'paid',
    icon: 'car',
    iconBgColor: '#F3E8FF',
    iconColor: '#9333EA',
  },
  {
    id: '3',
    title: 'Guest Parking',
    category: 'parking',
    type: 'income',
    amount: 25.00,
    date: '2023-10-23',
    time: '4:20 PM',
    status: 'paid',
    icon: 'parking',
    iconBgColor: '#FFF7ED',
    iconColor: '#EA580C',
  },
  {
    id: '4',
    title: 'Unit 2A Rent',
    category: 'rent',
    type: 'income',
    amount: 1100.00,
    date: '2023-10-23',
    time: '',
    status: 'pending',
    icon: 'clock-outline',
    iconBgColor: '#F3F4F6',
    iconColor: '#6B7280',
  },
  {
    id: '5',
    title: 'Plumbing Repair',
    category: 'maintenance',
    type: 'expense',
    amount: 350.00,
    date: '2023-10-22',
    time: '2:00 PM',
    status: 'paid',
    icon: 'wrench',
    iconBgColor: '#FEF2F2',
    iconColor: '#DC2626',
  },
  {
    id: '6',
    title: 'Electricity Bill',
    category: 'utility',
    type: 'expense',
    amount: 180.00,
    date: '2023-10-21',
    time: '11:30 AM',
    status: 'paid',
    icon: 'flash',
    iconBgColor: '#FEF9C3',
    iconColor: '#CA8A04',
  },
];

const CATEGORIES: { key: TransactionCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'rent', label: 'Rent' },
  { key: 'garage', label: 'Garage' },
  { key: 'parking', label: 'Parking' },
  { key: 'utility', label: 'Utility' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'other', label: 'Other' },
];

export default function AccountingScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('all');

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#f6f7f8';
  const cardBgColor = isDark ? '#1a2632' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#e0e6ed' : '#0d141b';
  const secondaryTextColor = isDark ? '#94a3b8' : '#4c739a';
  const primaryColor = '#137fec';

  // Filter transactions by type and category
  const filteredTransactions = MOCK_TRANSACTIONS.filter(t => {
    const typeMatch = t.type === transactionType;
    const categoryMatch = selectedCategory === 'all' || t.category === selectedCategory;
    return typeMatch && categoryMatch;
  });

  // Group by date
  const groupedTransactions = filteredTransactions.reduce((acc, transaction) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let dateLabel: string;
    if (transaction.date === today) {
      dateLabel = 'Today';
    } else if (transaction.date === yesterday) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = new Date(transaction.date).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    const existing = acc.find(s => s.title === dateLabel);
    if (existing) {
      existing.data.push(transaction);
    } else {
      acc.push({ title: dateLabel, data: [transaction] });
    }
    return acc;
  }, [] as TransactionSection[]);

  // Calculate total
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const renderTransaction = (transaction: Transaction) => {
    const isPending = transaction.status === 'pending';
    
    return (
      <TouchableOpacity
        key={transaction.id}
        style={[
          styles.transactionCard,
          { 
            backgroundColor: cardBgColor,
            opacity: isPending ? 0.6 : 1,
          },
        ]}
        onPress={() => {/* Navigate to transaction detail */}}
      >
        <View 
          style={[
            styles.transactionIcon,
            { backgroundColor: isDark ? `${transaction.iconColor}20` : transaction.iconBgColor },
          ]}
        >
          <MaterialCommunityIcons 
            name={transaction.icon as any} 
            size={24} 
            color={transaction.iconColor} 
          />
        </View>
        
        <View style={styles.transactionInfo}>
          <ThemedText style={[styles.transactionTitle, { color: textColor }]}>
            {transaction.title}
          </ThemedText>
          <ThemedText style={[styles.transactionMeta, { color: secondaryTextColor }]}>
            {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
            {transaction.time && ` • ${transaction.time}`}
            {isPending && ' • Pending'}
          </ThemedText>
        </View>
        
        <View style={styles.transactionAmountContainer}>
          <ThemedText 
            style={[
              styles.transactionAmount,
              { 
                color: isPending 
                  ? secondaryTextColor 
                  : transactionType === 'income' 
                    ? '#16A34A' 
                    : '#DC2626',
              },
            ]}
          >
            {transactionType === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </ThemedText>
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusDot,
                { 
                  backgroundColor: isPending ? '#EAB308' : '#22C55E',
                },
              ]} 
            />
            <ThemedText style={[styles.statusText, { color: secondaryTextColor }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Accounts</ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: `${primaryColor}15` }]}
            onPress={() => router.push('/add-transaction')}
          >
            <MaterialCommunityIcons name="plus" size={24} color={primaryColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Income/Expense Toggle */}
        <View style={styles.toggleContainer}>
          <View style={[styles.toggleWrapper, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                transactionType === 'income' && [styles.toggleActive, { backgroundColor: cardBgColor }],
              ]}
              onPress={() => setTransactionType('income')}
            >
              <ThemedText 
                style={[
                  styles.toggleText,
                  { 
                    color: transactionType === 'income' ? primaryColor : secondaryTextColor,
                    fontWeight: transactionType === 'income' ? '700' : '500',
                  },
                ]}
              >
                Income
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                transactionType === 'expense' && [styles.toggleActive, { backgroundColor: cardBgColor }],
              ]}
              onPress={() => setTransactionType('expense')}
            >
              <ThemedText 
                style={[
                  styles.toggleText,
                  { 
                    color: transactionType === 'expense' ? primaryColor : secondaryTextColor,
                    fontWeight: transactionType === 'expense' ? '700' : '500',
                  },
                ]}
              >
                Expense
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: cardBgColor, borderColor }]}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryInfo}>
                <ThemedText style={[styles.summaryMonth, { color: secondaryTextColor }]}>
                  October 2023
                </ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: textColor }]}>
                  Total {transactionType === 'income' ? 'Income' : 'Expenses'}
                </ThemedText>
                <ThemedText style={[styles.summaryAmount, { color: primaryColor }]}>
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </ThemedText>
              </View>
              <View 
                style={[
                  styles.summaryIconWrapper,
                  { backgroundColor: transactionType === 'income' ? '#DCFCE7' : '#FEE2E2' },
                ]}
              >
                <MaterialCommunityIcons 
                  name={transactionType === 'income' ? 'trending-up' : 'trending-down'} 
                  size={24} 
                  color={transactionType === 'income' ? '#16A34A' : '#DC2626'} 
                />
              </View>
            </View>
            
            {/* Mini Chart */}
            <View style={[styles.chartContainer, { backgroundColor: `${primaryColor}08` }]}>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { flex: 0.4, backgroundColor: `${primaryColor}30` }]} />
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { flex: 0.6, backgroundColor: `${primaryColor}40` }]} />
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { flex: 0.8, backgroundColor: `${primaryColor}60` }]} />
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { flex: 0.5, backgroundColor: primaryColor }]} />
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { flex: 0.7, backgroundColor: `${primaryColor}50` }]} />
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { flex: 0.45, backgroundColor: `${primaryColor}30` }]} />
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { flex: 0.3, backgroundColor: `${primaryColor}20` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryPill,
                selectedCategory === cat.key
                  ? { backgroundColor: primaryColor }
                  : { backgroundColor: cardBgColor, borderColor, borderWidth: 1 },
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <ThemedText 
                style={[
                  styles.categoryText,
                  { 
                    color: selectedCategory === cat.key ? '#ffffff' : textColor,
                    fontWeight: selectedCategory === cat.key ? '700' : '500',
                  },
                ]}
              >
                {cat.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transaction List */}
        <View style={styles.transactionsContainer}>
          {groupedTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="receipt-text-outline" 
                size={48} 
                color={secondaryTextColor} 
              />
              <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
                No transactions found
              </ThemedText>
            </View>
          ) : (
            groupedTransactions.map((section) => (
              <View key={section.title} style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: secondaryTextColor }]}>
                  {section.title}
                </ThemedText>
                <View style={styles.sectionTransactions}>
                  {section.data.map(renderTransaction)}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  toggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  summaryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryInfo: {
    gap: 4,
  },
  summaryMonth: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 4,
  },
  summaryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
    paddingBottom: 4,
    overflow: 'hidden',
  },
  chartBarWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 4,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
  },
  transactionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionTransactions: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
