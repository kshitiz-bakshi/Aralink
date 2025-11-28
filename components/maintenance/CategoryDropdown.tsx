import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Text, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Option {
  label: string;
  value: string;
  icon?: string;
}

interface CategoryDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export function CategoryDropdown({ value, onSelect, options, placeholder = 'Select category' }: CategoryDropdownProps) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((opt) => opt.value === value);

  const handleSelect = (option: Option) => {
    onSelect(option.value);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setVisible(true)}>
        <View style={styles.fieldInner}>
          {selected?.icon ? (
            <MaterialCommunityIcons name={selected.icon as any} size={18} color="#2563eb" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={[styles.valueText, { color: selected ? '#111827' : '#9ca3af' }]}>
            {selected ? selected.label : placeholder}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalCard}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionRow} onPress={() => handleSelect(item)}>
                  <View style={styles.optionLeft}>
                    {item.icon ? (
                      <MaterialCommunityIcons name={item.icon as any} size={20} color="#2563eb" style={{ marginRight: 12 }} />
                    ) : null}
                    <Text style={styles.optionLabel}>{item.label}</Text>
                  </View>
                  {item.value === value ? (
                    <MaterialCommunityIcons name="check" size={18} color="#22c55e" />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    maxHeight: '70%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
});

export default CategoryDropdown;

