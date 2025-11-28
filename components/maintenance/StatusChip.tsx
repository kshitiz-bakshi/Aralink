import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const statusColors: Record<string, string> = {
  new: '#0ea5e9',
  under_review: '#8b5cf6',
  in_progress: '#f59e0b',
  waiting_vendor: '#14b8a6',
  resolved: '#22c55e',
  cancelled: '#ef4444',
};

interface StatusChipProps {
  status: string;
}

export function StatusChip({ status }: StatusChipProps) {
  const color = statusColors[status] || '#6b7280';
  const label = status.replace('_', ' ');

  return (
    <View style={[styles.chip, { backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default StatusChip;

