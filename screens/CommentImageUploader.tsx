import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';

interface Props {
  onSelected: (uri: string) => void;
}

const CommentImageUploader: React.FC<Props> = ({ onSelected }) => {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  useEffect(() => {
    const image = route.params?.selectedImageUrl;
    if (isFocused && image) {
      setPreviewUri(image);
      onSelected(image);
    }
  }, [isFocused, route.params?.selectedImageUrl]);

  const pickImage = async (fromCamera: boolean) => {
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Denied', fromCamera ? 'Camera access is required' : 'Gallery access is required');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setPreviewUri(uri);
        onSelected(uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open camera or gallery');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="📷 Take Photo" onPress={() => pickImage(true)} />
      <Button title="🖼 Choose from Gallery" onPress={() => pickImage(false)} />
      <Button title="✈️ Choose from Flight Album" onPress={() => navigation.navigate('AlbumSelect')} />

      {previewUri && (
        <Image source={{ uri: previewUri }} style={styles.preview} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  preview: {
    width: 200,
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default CommentImageUploader;
