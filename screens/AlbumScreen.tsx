import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';

// Define photo type
type AlbumPhoto = {
  id: string;
  imageUrl: string;
  description: string;
};

const AlbumScreen = () => {
  const [albumData, setAlbumData] = useState<AlbumPhoto[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!uid) return;
      try {
        const snapshot = await getDocs(collection(db, `albums/${uid}/photos`));
        const photos: AlbumPhoto[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawTime = data.description?.replace('Saved at ', '');
          const timestamp = new Date(rawTime);

          return {
            id: docSnap.id,
            imageUrl: data.imageUrl,
            description: !isNaN(timestamp.getTime())
              ? timestamp.toLocaleString()
              : data.description || '',
          };
        });
        setAlbumData(photos);

        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setAvatarUrl(userDoc.data().avatarUrl || null);
        }
      } catch (err) {
        console.error('Failed to fetch photo album:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, []);

  const handleSetAsAvatar = async (imageUrl: string) => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        avatarUrl: imageUrl,
      });
      setAvatarUrl(imageUrl);
      Alert.alert('✅ Success', 'The image has been set as your avatar');
    } catch (err) {
      console.error('Failed to set avatar:', err);
      Alert.alert('❌ Failed', 'Unable to set avatar. Please try again');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, `albums/${uid}/photos`, photoId));
      setAlbumData(prev => prev.filter(photo => photo.id !== photoId));
      Alert.alert('✅ Deleted', 'The photo has been removed from your album');
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('❌ Delete failed', 'Please try again later');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 My Aviation Photo Album</Text>
      {albumData.length === 0 ? (
        <Text style={styles.empty}>No flight photos uploaded yet ✈️</Text>
      ) : (
        <FlatList
          data={albumData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.albumItem}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Set as Avatar', 'Do you want to set this image as your avatar?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Set as Avatar',
                      onPress: () => handleSetAsAvatar(item.imageUrl),
                    },
                  ])
                }
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={[
                    styles.albumImage,
                    item.imageUrl === avatarUrl && styles.currentAvatarBorder,
                  ]}
                />
              </TouchableOpacity>
              <Text style={styles.description}>{item.description}</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => handleDeletePhoto(item.id),
                    },
                  ])
                }
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  empty: { fontSize: 16, textAlign: 'center', marginTop: 20 },
  albumItem: { marginBottom: 24, alignItems: 'center' },
  albumImage: {
    width: 250,
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  currentAvatarBorder: {
    borderColor: '#28a745',
    borderWidth: 3,
  },
  description: { fontSize: 14, color: '#444' },
  deleteIcon: { color: 'red', fontSize: 20, marginTop: 4 },
});

export default AlbumScreen;