// components/CommentInputBox.tsx
import React, { useState } from 'react';
import {
  View, TextInput, Button, Image, StyleSheet, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToFirebase } from '../uploadCommentPhoto';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';
import uuid from 'react-native-uuid';

interface Props {
  airportId: string;
  onCommentSent: () => void; // Refresh comment list after submitting
}

const CommentInputBox: React.FC<Props> = ({ airportId, onCommentSent }) => {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !text.trim()) {
      Alert.alert('Please enter a comment');
      return;
    }

    setUploading(true);
    let imageUrl: string | null = null;

    try {
      if (imageUri) {
        imageUrl = await uploadImageToFirebase(imageUri, uid, uuid.v4().toString());
      }

      await addDoc(collection(db, 'comments'), {
        text: text.trim(),
        userId: uid,
        airportId,
        timestamp: new Date().toISOString(),
        imageUrl: imageUrl || null,
      });

      setText('');
      setImageUri(null);
      onCommentSent(); // Notify parent to refresh
    } catch (err) {
      Alert.alert('Submit Failed', String(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.box}>
      <TextInput
        placeholder="Write a comment..."
        value={text}
        onChangeText={setText}
        style={styles.input}
      />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      <View style={styles.buttons}>
        <Button title="📷 Take Photo" onPress={handleTakePhoto} />
        <Button title="🖼️ Choose from Gallery" onPress={handlePickImage} />
        <Button title="Submit Comment" onPress={handleSubmit} disabled={uploading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { marginBottom: 20 },
  input: {
    height: 40, borderColor: 'gray', borderWidth: 1, paddingHorizontal: 10, marginBottom: 10,
  },
  preview: {
    width: 100, height: 100, marginBottom: 10, borderRadius: 10,
  },
  buttons: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 10,
  },
});

export default CommentInputBox;
