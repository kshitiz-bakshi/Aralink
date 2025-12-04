import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormInputProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  error?: string;
}

export function FormInput({ label, description, children, error }: FormInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 8,
  },
  labelRow: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
  },
});

export default FormInput;

