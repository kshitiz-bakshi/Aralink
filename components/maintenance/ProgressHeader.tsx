import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressHeaderProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
}

export function ProgressHeader({ title, subtitle, step, totalSteps }: ProgressHeaderProps) {
  const progress = step && totalSteps ? (step / totalSteps) * 100 : 0;

  return (
    <View style={styles.container}>
      {step && totalSteps ? (
        <View style={styles.stepRow}>
          <Text style={styles.stepText}>
            Step {step} of {totalSteps}
          </Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {step && totalSteps ? (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  stepRow: {
    marginBottom: 4,
  },
  stepText: {
    fontSize: 12,
    color: '#6b7280',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
});

export default ProgressHeader;

