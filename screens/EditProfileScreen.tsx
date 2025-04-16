import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Image, Button, Alert,
  StyleSheet, TouchableOpacity, ActivityIndicator,
  Platform, ToastAndroid,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { setAvatarCallback } from '../AvatarCallback';
import { uploadImageToFirebase } from '../uploadCommentPhoto';

const EditProfileScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDisplayName(data.displayName || '');
        setAvatarUrl(data.avatarUrl || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      let finalAvatarUrl = avatarUrl;

      if (localAvatar) {
        finalAvatarUrl = await uploadImageToFirebase(localAvatar, uid!, 'avatars');
      }

      await updateDoc(doc(db, 'users', uid!), {
        displayName,
        avatarUrl: finalAvatarUrl,
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show('Profile updated successfully', ToastAndroid.SHORT);
      } else {
        Alert.alert('✅ Saved', 'Your profile has been updated.');
      }

      navigation.goBack();
    } catch (err: any) {
      console.error('Save failed:', err);
      Alert.alert('❌ Save Failed', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Camera access required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) {
      setLocalAvatar(result.assets[0].uri);
    }
  };

  const selectFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Gallery access required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) {
      setLocalAvatar(result.assets[0].uri);
    }
  };

  const selectFromFlightAlbum = () => {
    setAvatarCallback((uri) => {
      if (uri) setLocalAvatar(uri);
    });
    navigation.navigate('AlbumSelect', { source: 'profile' });
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} color="#007AFF" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={selectFromFlightAlbum} style={styles.avatarWrapper}>
        <Image
          source={
            localAvatar
              ? { uri: localAvatar }
              : avatarUrl
              ? { uri: avatarUrl }
              : { uri: 'https://i.pravatar.cc/150?img=1' }
          }
          style={styles.avatar}
        />
        <Text style={styles.avatarHint}>Tap to choose from Flight Album</Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <Button title="📷 Camera" onPress={selectFromCamera} />
        <Button title="🖼 Gallery" onPress={selectFromGallery} />
    
      </View>

      <Text style={styles.label}>Nickname</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Enter your nickname"
      />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>💾 Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F4F9FF',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
  },
  avatarHint: {
    marginTop: 8,
    color: '#007AFF',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EditProfileScreen;
