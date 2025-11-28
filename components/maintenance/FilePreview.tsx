import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UploadedFile } from './UploadButton';

interface FilePreviewProps {
  files: UploadedFile[];
  onRemove?: (uri: string) => void;
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  if (!files.length) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {files.map((file) => (
        <View key={file.uri} style={styles.card}>
          {file.mimeType?.startsWith('image') ? (
            <Image source={{ uri: file.uri }} style={styles.image} />
          ) : (
            <View style={styles.file}>
              <MaterialCommunityIcons name="file-video" size={28} color="#1d4ed8" />
              <Text numberOfLines={1} style={styles.fileName}>
                {file.name}
              </Text>
            </View>
          )}
          {onRemove ? (
            <TouchableOpacity style={styles.closeButton} onPress={() => onRemove(file.uri)}>
              <MaterialCommunityIcons name='close' size={16} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  file: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 8,
    gap: 4,
  },
  fileName: {
    fontSize: 11,
    color: '#1f2937',
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 2,
  },
});

export default FilePreview;

