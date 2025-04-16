import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, Alert, ScrollView, SafeAreaView,
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

const defaultAvatar = 'https://i.pravatar.cc/150?img=1';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState({ name: '', avatar: '' });
  const [friendsData, setFriendsData] = useState<Array<{ id: string; displayName: string; avatarUrl: string }>>([]);
  const [albumData, setAlbumData] = useState<Array<{ id: string; imageUrl: string }>>([]);

  const fetchAll = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const userData = userSnap.exists() ? userSnap.data() : null;

      setUser({
        name: userData?.displayName || '未知用户',
        avatar: userData?.avatarUrl || defaultAvatar,
      });

      const friendIds = userData?.friends || [];
      const friends = await Promise.all(
        friendIds.map(async (fid) => {
          const fSnap = await getDoc(doc(db, 'users', fid));
          if (fSnap.exists()) {
            const fData = fSnap.data();
            return {
              id: fid,
              displayName: fData?.displayName || '未命名',
              avatarUrl: fData?.avatarUrl || defaultAvatar,
            };
          }
          return null;
        })
      );
      setFriendsData(friends.filter((f) => f !== null));

      const photoSnap = await getDocs(collection(db, `albums/${uid}/photos`));
      const photos = photoSnap.docs
        .map((doc) => {
          const data = doc.data();
          return data?.imageUrl ? { id: doc.id, imageUrl: data.imageUrl } : null;
        })
        .filter((p) => p !== null);
      setAlbumData(photos);
    } catch (err) {
      console.error('数据加载失败:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      console.error('退出失败:', err);
      Alert.alert('❌ 退出失败', '请稍后再试');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Flight Home</Text>
        <Ionicons name="person-circle-outline" size={26} style={styles.topBarIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <Text style={styles.title}>Welcome，{user.name}！✈</Text>

          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* 好友列表 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friend List</Text>
              <View style={styles.inlineActions}>
                <TouchableOpacity onPress={() => navigation.navigate('FriendRequests')}>
                  <Text style={styles.viewLink}>📬 Request</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Friends')}>
                  <Text style={styles.viewLink}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
            {friendsData.length === 0 ? (
              <Text style={styles.emptyText}>No Friends Yet</Text>
            ) : (
              <FlatList
                data={friendsData}
                horizontal
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendItem}
                    onPress={() => navigation.navigate('Chat', { friendId: item.id })}
                  >
                    <Image source={{ uri: item.avatarUrl }} style={styles.friendAvatar} />
                    <Text style={styles.friendName}>{item.displayName}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          {/* 飞行相册 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aviation Photo Album</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Album')}>
                <Text style={styles.viewLink}>View</Text>
              </TouchableOpacity>
            </View>
            {albumData.length === 0 ? (
              <Text style={styles.emptyText}>No Photos Yet</Text>
            ) : (
              <FlatList
                data={albumData}
                horizontal
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => navigation.navigate('PhotoDetail', { photoId: item.id })}>
                    <Image source={{ uri: item.imageUrl }} style={styles.albumImage} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          {/* 页面按钮 */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Map')}>
              <Ionicons name="map" size={18} color="#fff" />
              <Text style={styles.actionText}>Airport Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('NearestAirport')}>
              <Ionicons name="airplane" size={18} color="#fff" />
              <Text style={styles.actionText}>Nearest Airport</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F8FC',
  },
  topBar: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#00A1E4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  topBarIcon: {
    color: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00A1E4',
    marginVertical: 12,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderColor: '#e0e0e0',
    borderWidth: 2,
  },
  editButton: {
    backgroundColor: '#00A1E4',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    width: '100%',
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  inlineActions: {
    flexDirection: 'row',
  },
  viewLink: {
    color: '#00A1E4',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  friendAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 6,
  },
  friendName: {
    fontSize: 14,
    textAlign: 'center',
    color: '#444',
  },
  albumImage: {
    width: 110,
    height: 110,
    marginRight: 16,
    borderRadius: 10,
  },
  actions: {
    flexDirection: 'column',
    marginTop: 16,
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#00A1E4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#FF5252',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default HomeScreen;
