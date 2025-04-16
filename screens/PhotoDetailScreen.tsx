import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Button,
  Alert,
  ScrollView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { getDocs, collection } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// Type definition
type AlbumPhoto = {
  id: string;
  imageUrl: string;
  description: string;
};

const PhotoDetailScreen = ({ route }) => {
  const { photoId } = route.params;
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;

      const snap = await getDocs(collection(db, `albums/${uid}/photos`));
      const allPhotos = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          imageUrl: data.imageUrl,
          description: data.description,
        } as AlbumPhoto;
      });

      setPhotos(allPhotos);

      // Display the photo corresponding to the passed-in photoId by default
      const target = allPhotos.find((p) => p.id === photoId);
      setSelectedPhoto(target || allPhotos[0]);
    };

    fetchPhotos();
  }, []);

  const handleDownload = async () => {
    if (!selectedPhoto) return;

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Unable to access media library');
      return;
    }

    const fileUri = FileSystem.documentDirectory + selectedPhoto.id + '.jpg';
    const download = await FileSystem.downloadAsync(
      selectedPhoto.imageUrl,
      fileUri
    );

    await MediaLibrary.saveToLibraryAsync(download.uri);
    Alert.alert('✅ Download Successful', 'Photo has been saved to your gallery');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Photo Details</Text>

      {selectedPhoto ? (
        <>
          <Image
            source={{ uri: selectedPhoto.imageUrl }}
            style={styles.bigImage}
            resizeMode="cover"
          />
          <Text style={styles.desc}>{selectedPhoto.description}</Text>
          <Button title="Download this Photo" onPress={handleDownload} />
        </>
      ) : (
        <Text>Photo not found</Text>
      )}

      <Text style={styles.galleryTitle}>📸 My Album</Text>
      <FlatList
        data={photos}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedPhoto(item)}
            style={[
              styles.thumbnailWrapper,
              item.id === selectedPhoto?.id && styles.selectedThumbnail,
            ]}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  bigImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  galleryTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  thumbnailWrapper: {
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: '#007bff',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});

export default PhotoDetailScreen;