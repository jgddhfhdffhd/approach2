import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  getDoc,
  getDocs,
  doc,
  collection,
  updateDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

const defaultAvatar = 'https://i.pravatar.cc/150?img=1';

const FriendsScreen = ({ navigation }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);

  const uid = getAuth().currentUser?.uid;

  const fetchFriends = async () => {
    if (!uid) return;
    const userSnap = await getDoc(doc(db, 'users', uid));
    const userData = userSnap.data();
    const friendIds = userData?.friends || [];

    const list = await Promise.all(
      friendIds.map(async (fid: string) => {
        const snap = await getDoc(doc(db, 'users', fid));
        if (snap.exists()) {
          const data = snap.data();
          return {
            id: fid,
            name: data.displayName || '未知用户',
            avatar: data.avatarUrl || defaultAvatar,
          };
        }
        return null;
      })
    );
    setFriends(list.filter(f => f !== null));
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;

    const q = query(collection(db, 'users'), where('email', '==', searchEmail.trim()));
    const snap = await getDocs(q);
    if (snap.empty) {
      Alert.alert('User not found');
      setSearchResult(null);
      return;
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();

    if (docSnap.id === uid) {
      Alert.alert('You cannot add yourself');
      return;
    }

    setSearchResult({
      id: docSnap.id,
      name: data.displayName || '未知用户',
      avatar: data.avatarUrl || defaultAvatar,
    });
  };

  const handleAddFriend = async () => {
    if (!uid || !searchResult) return;

    try {
      await addDoc(collection(db, 'friendRequests'), {
        from: uid,
        to: searchResult.id,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      Alert.alert('Friend request sent');
      setSearchResult(null);
      setSearchEmail('');
    } catch {
      Alert.alert('Request failed');
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    if (!uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      const friendRef = doc(db, 'users', friendId);

      const userSnap = await getDoc(userRef);
      const friendSnap = await getDoc(friendRef);

      const userFriends = userSnap.data()?.friends || [];
      const friendFriends = friendSnap.data()?.friends || [];

      await updateDoc(userRef, {
        friends: userFriends.filter((id: string) => id !== friendId),
      });
      await updateDoc(friendRef, {
        friends: friendFriends.filter((id: string) => id !== uid),
      });

      Alert.alert('Friend has been deleted');
      fetchFriends();
    } catch (err) {
      Alert.alert('Deletion failed', 'Please try again later');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Friends</Text>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Enter the email"
          style={styles.input}
          value={searchEmail}
          onChangeText={setSearchEmail}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchText}>Search</Text>
        </TouchableOpacity>
      </View>

      {searchResult && (
        <View style={styles.resultCard}>
          <Image source={{ uri: searchResult.avatar }} style={styles.avatar} />
          <Text style={styles.resultName}>{searchResult.name}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddFriend}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.addText}>Add Friend</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.title}>My Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
            <Text style={styles.friendName}>{item.name}</Text>
            <View style={styles.btnGroup}>
              <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { friendId: item.id })}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteFriend(item.id)}>
                <Ionicons name="trash" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F2F8FC' },
  title: { fontSize: 22, fontWeight: '600', marginVertical: 12, color: '#007BFF' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchBtn: {
    flexDirection: 'row',
    backgroundColor: '#00A1E4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  resultCard: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  resultName: { fontSize: 16, fontWeight: '500', marginBottom: 10 },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addText: { color: '#fff', marginLeft: 6 },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  friendAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  friendName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },
  btnGroup: { flexDirection: 'row', gap: 10 },
  chatBtn: {
    backgroundColor: '#00A1E4',
    padding: 8,
    borderRadius: 8,
  },
  deleteBtn: {
    backgroundColor: '#FF5252',
    padding: 8,
    borderRadius: 8,
  },
});

export default FriendsScreen;