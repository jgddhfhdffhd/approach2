// Enhanced AirportDetail.tsx UI using FlatList (no ScrollView)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Button, TextInput, FlatList, Image,
  Alert, StyleSheet, BackHandler, TouchableOpacity
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import {
  getFirestore, getDoc, doc, collection, getDocs,
  addDoc, query, where, orderBy, deleteDoc
} from 'firebase/firestore';
import { downloadImage } from '../downloadImage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { setUploadedImageCallback } from '../AvatarCallback';
import { uploadImageToFirebase } from '../uploadCommentPhoto';

const db = getFirestore();

type Props = NativeStackScreenProps<RootStackParamList, 'AirportDetail'>;

const AirportDetail: React.FC<Props> = ({ route, navigation }) => {
  const { id, name, latitude, longitude, uploadedImageUrl } = route.params;
  const isFocused = useIsFocused();

  const [currentTime, setCurrentTime] = useState('Loading...');
  const [airportInfo, setAirportInfo] = useState('Loading...');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const currentUserId = getAuth().currentUser?.uid;

  useEffect(() => {
    setUploadedImageCallback((uri) => {
      if (uri) setSelectedImageUri(uri);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Map');
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  useEffect(() => {
    setAirportInfo(`Welcome to ${name}! Located at ${latitude}, ${longitude}.`);

    const fetchTime = async () => {
      try {
        const apiKey = 'YOUR_RAPIDAPI_KEY_HERE';
        const url = `https://timezone.abstractapi.com/v1/current_time/?api_key=${apiKey}&location=${latitude},${longitude}`;
        const response = await fetch(url);
        const data = await response.json();
        const time = new Date(data?.datetime || Date.now());
        setCurrentTime(time.toISOString());
      } catch {
        setCurrentTime(new Date().toISOString());
      }
    };

    fetchTime();
  }, [latitude, longitude, name]);

  useEffect(() => {
    if (uploadedImageUrl && isFocused) {
      setSelectedImageUri(uploadedImageUrl);
      navigation.setParams({ uploadedImageUrl: undefined });
    }
  }, [uploadedImageUrl, isFocused]);

  const fetchComments = async () => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('airportId', '==', id),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const list = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userSnap = await getDoc(doc(db, 'users', data.userId));
        const userData = userSnap.exists() ? userSnap.data() : {};

        return {
          id: docSnap.id,
          text: data.text,
          userId: data.userId,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp,
          displayName: userData.displayName || 'Unknown',
          avatarUrl: userData.avatarUrl || 'https://i.pravatar.cc/150?img=1',
        };
      }));
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleSubmit = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid || !comment.trim()) return;

    try {
      let imageUrl = selectedImageUri;

      if (selectedImageUri && !selectedImageUri.startsWith('http')) {
        imageUrl = await uploadImageToFirebase(selectedImageUri, uid, `albums/${uid}/photos`);
      }

      await addDoc(collection(db, 'comments'), {
        text: comment.trim(),
        userId: uid,
        airportId: id,
        timestamp: new Date(),
        imageUrl: imageUrl || null,
      });
      setComment('');
      setSelectedImageUri(null);
      fetchComments();
    } catch {
      Alert.alert('Submit Failed', 'Please check your network and try again.');
    }
  };

  const handleSelectFromAlbum = () => {
    navigation.navigate('AlbumSelect', {
      id, name, latitude, longitude, source: 'comment'
    });
  };

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleImageOptions = (url: string) => {
    Alert.alert('Image Options', 'Choose an action:', [
      { text: 'Download to Device', onPress: () => downloadImage(url) },
      {
        text: 'Save to Flight Album',
        onPress: async () => {
          const uid = getAuth().currentUser?.uid;
          if (!uid) return;
          try {
            await addDoc(collection(db, `albums/${uid}/photos`), {
              imageUrl: url,
              description: `Saved on ${new Date().toISOString()}`,
            });
            Alert.alert('✅ Success', 'Saved to Flight Album');
          } catch (err) {
            Alert.alert('Error', 'Could not save to album.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'comments', commentId));
            fetchComments();
          } catch (err) {
            Alert.alert('Delete Failed', 'Please try again.');
            console.error('Delete Error:', err);
          }
        }
      }
    ]);
  };

  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <Text style={styles.header}>{name}</Text>
          <Text style={styles.sub}>📍 {latitude}, {longitude}</Text>
          <Text style={styles.time}>🕒 {currentTime}</Text>
          <Text style={styles.info}>{airportInfo}</Text>

          <TextInput
            style={styles.input}
            placeholder="Leave a comment..."
            value={comment}
            onChangeText={setComment}
          />

          {selectedImageUri && (
            <Image source={{ uri: selectedImageUri }} style={styles.preview} />
          )}

          <View style={styles.buttonRow}>
            <Button title="📷 Camera" onPress={() => pickImage(true)} />
            <Button title="🖼 Gallery" onPress={() => pickImage(false)} />
            <Button title="✈️ Flight Album" onPress={handleSelectFromAlbum} />
            <Button title="✅ Submit" onPress={handleSubmit} />
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.commentBlock}>
          <TouchableOpacity
            style={styles.commentHeader}
            onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
          >
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            <Text style={styles.userName}>{item.displayName}</Text>
          </TouchableOpacity>

          <Text style={styles.commentText}>{item.text}</Text>
          <Text style={styles.timestamp}>
            🕒 {item.timestamp?.toDate?.().toLocaleString?.() || 'Unknown Time'}
          </Text>

          {item.imageUrl && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.imageUrl }} style={styles.preview} />
              <Button title="⬇️ Options" onPress={() => handleImageOptions(item.imageUrl)} />
            </View>
          )}

          {item.userId === currentUserId && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteComment(item.id)}
            >
              <Text style={styles.deleteText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F9FAFB' },
  header: { fontSize: 26, fontWeight: '700', color: '#007AFF' },
  sub: { fontSize: 16, color: '#333', marginBottom: 4 },
  time: { fontSize: 14, color: '#666', marginBottom: 12 },
  info: { fontSize: 17, color: '#444', marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10,
    borderRadius: 8, marginBottom: 10, backgroundColor: '#fff'
  },
  buttonRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    marginBottom: 20,
  },
  preview: {
    width: '100%', height: 220,
    borderRadius: 12, marginVertical: 10,
  },
  commentBlock: {
    borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 6,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, marginRight: 10,
  },
  userName: { fontWeight: '600', fontSize: 15, color: '#333' },
  commentText: { fontSize: 15, color: '#444' },
  timestamp: {
    fontSize: 12, color: '#999', marginTop: 4,
  },
  imageWrapper: {
    marginTop: 10, alignItems: 'center', gap: 8
  },
  deleteButton: {
    marginTop: 6, alignSelf: 'flex-end'
  },
  deleteText: {
    color: '#FF3B30', fontSize: 14,
  },
});

export default AirportDetail;