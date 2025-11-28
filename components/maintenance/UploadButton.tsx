import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export interface UploadedFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface UploadButtonProps {
  label?: string;
  onUpload: (file: UploadedFile) => void;
  maxSizeBytes?: number;
}

export function UploadButton({ label = 'Add Photos/Video', onUpload, maxSizeBytes = 1024 * 1024 }: UploadButtonProps) {
  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ['image/*', 'video/*'],
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      if (asset.size && asset.size > maxSizeBytes) {
        Alert.alert('File Too Large', 'Please upload files smaller than 1MB.');
        return;
      }
      onUpload({
        uri: asset.uri,
        name: asset.name ?? 'attachment',
        size: asset.size,
        mimeType: asset.mimeType,
      });
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePick}>
      <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#2563eb" />
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>Max 1MB each</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5f5',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default UploadButton;

