import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { db } from '../firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const defaultAvatar = 'https://i.pravatar.cc/150?img=1';

const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userId } = route.params;
  const currentUserId = getAuth().currentUser?.uid;
  const isMe = userId === currentUserId;

  const [userData, setUserData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;

      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        const meSnap = await getDoc(doc(db, 'users', currentUserId));

        if (!userSnap.exists()) return;

        const data = userSnap.data();
        const meData = meSnap.exists() ? meSnap.data() : {};

        setUserData(data);
        setIsFriend((meData.friends || []).includes(userId));

        // Fetch flight album
        const snap = await getDocs(collection(db, `albums/${userId}/photos`));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPhotos(list);

        // Check if friend request was already sent
        const reqSnap = await getDocs(
          query(
            collection(db, 'friendRequests'),
            where('from', '==', currentUserId),
            where('to', '==', userId),
            where('status', '==', 'pending')
          )
        );
        if (!reqSnap.empty) setRequestSent(true);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    fetchData();
  }, [userId]);

  const handleSendRequest = async () => {
    if (!currentUserId || !userId) return;

    try {
      await addDoc(collection(db, 'friendRequests'), {
        from: currentUserId,
        to: userId,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      setRequestSent(true);
      Alert.alert('✅ Friend request sent');
    } catch (error) {
      Alert.alert('❌ Failed', 'Please try again later');
    }
  };

  const handleMessage = () => {
    navigation.navigate('Chat', { friendId: userId });
  };

  if (!userData) return <Text style={{ padding: 20 }}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: userData.avatarUrl || defaultAvatar }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{userData.displayName || 'User'}</Text>

      {isMe ? (
        <Button
          title="✏️ Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
      ) : isFriend ? (
        <Button title="💬 Message" onPress={handleMessage} />
      ) : requestSent ? (
        <Text style={{ color: '#888', marginVertical: 10 }}>
          📬 Friend request sent
        </Text>
      ) : (
        <Button title="➕ Add Friend" onPress={handleSendRequest} />
      )}

      <Text style={styles.sectionTitle}>✈️ Flight Album</Text>
      <FlatList
        data={photos}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <Image source={{ uri: item.imageUrl }} style={styles.photo} />
            <Text style={{ textAlign: 'center' }}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F4F9FF' },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  photo: {
    width: 100,
    height: 100,
    margin: 10,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
});

export default UserProfileScreen;
