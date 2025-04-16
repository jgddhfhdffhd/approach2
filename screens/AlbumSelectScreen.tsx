import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getAvatarCallback, getUploadedImageCallback } from '../AvatarCallback';

type AlbumSelectRouteProp = RouteProp<RootStackParamList, 'AlbumSelect'>;

const AlbumSelectScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<AlbumSelectRouteProp>();
  const {
    source = 'comment',
  } = route.params || {};

  const [photos, setPhotos] = useState<{ id: string; imageUrl: string; description: string }[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      const snapshot = await getDocs(collection(db, `albums/${uid}/photos`));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl,
        description: doc.data().description,
      }));
      setPhotos(list);
    };

    fetchPhotos();
  }, []);

  const handleSelect = (imageUrl: string) => {
    if (source === 'profile') {
      getAvatarCallback()?.(imageUrl);
    } else {
      getUploadedImageCallback()?.(imageUrl);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item.imageUrl)} style={styles.item}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { flex: 1, margin: 10, alignItems: 'center' },
  image: { width: 150, height: 150, borderRadius: 8 },
});

export default AlbumSelectScreen;
