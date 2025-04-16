import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

const defaultAvatar = 'https://i.pravatar.cc/150?img=1';

const FriendRequestsScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    const loadRequests = async () => {
      if (!uid) return;

      const q = query(
        collection(db, 'friendRequests'),
        where('to', '==', uid),
        where('status', '==', 'pending')
      );

      const snap = await getDocs(q);

      const list = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const fromSnap = await getDoc(doc(db, 'users', data.from));
          const fromData = fromSnap.exists() ? fromSnap.data() : {};
          return {
            id: docSnap.id,
            from: data.from,
            displayName: fromData.displayName || '未知用户',
            avatarUrl: fromData.avatarUrl || defaultAvatar,
          };
        })
      );

      setRequests(list);
    };

    loadRequests();
  }, []);

  const handleAccept = async (req: any) => {
    try {
      const fromRef = doc(db, 'users', req.from);
      const toRef = doc(db, 'users', uid!);

      const fromSnap = await getDoc(fromRef);
      const toSnap = await getDoc(toRef);

      const fromFriends = fromSnap.data()?.friends || [];
      const toFriends = toSnap.data()?.friends || [];

      await updateDoc(fromRef, { friends: [...fromFriends, uid] });
      await updateDoc(toRef, { friends: [...toFriends, req.from] });
      await updateDoc(doc(db, 'friendRequests', req.id), { status: 'accepted' });

      Alert.alert('✅ Friend added');
    } catch (err) {
      Alert.alert('❌ Failed to accept', (err as any).message || 'Please check your permission settings.');
    }
  };

  const handleReject = async (reqId: string) => {
    await updateDoc(doc(db, 'friendRequests', reqId), { status: 'rejected' });
    Alert.alert('Request denied');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friend request</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <View style={styles.row}>
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              <Text style={styles.displayName}>{item.displayName}</Text>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F9FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007BFF',
  },
  requestItem: {
    marginBottom: 15,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default FriendRequestsScreen;