import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  DocumentData
} from 'firebase/firestore';
import { format } from 'date-fns';

const db = getFirestore();
const defaultAvatar = 'https://i.pravatar.cc/150?img=3';

interface Message extends DocumentData {
  id: string;
  senderId: string;
  text: string;
  timestamp?: any;
  avatarUrl?: string;
}

const ChatScreen = ({ route }) => {
  const { friendId } = route.params;
  const currentUserId = getAuth().currentUser?.uid;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList<Message>>(null);

  const chatId = [currentUserId, friendId].sort().join('_');

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      const senderIds = [...new Set(msgs.map((m) => m.senderId))];
      const avatarMap: Record<string, string> = {};
      await Promise.all(
        senderIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          avatarMap[uid] = userDoc.exists()
            ? userDoc.data()?.avatarUrl || defaultAvatar
            : defaultAvatar;
        })
      );

      const enrichedMsgs = msgs.map((msg) => ({
        ...msg,
        avatarUrl: avatarMap[msg.senderId],
      }));

      setMessages(enrichedMsgs);
    });

    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUserId,
        text: trimmed,
        timestamp: serverTimestamp(),
      });

      await setDoc(
        doc(db, 'chats', chatId),
        {
          participants: [currentUserId, friendId],
          lastMessage: trimmed,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage('');
    } catch (err) {
      console.error('Send failure:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No chat history</Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.senderId === currentUserId
                  ? styles.myRow
                  : styles.friendRow,
              ]}
            >
              {item.senderId !== currentUserId && (
                <Image
                  source={{ uri: item.avatarUrl || defaultAvatar }}
                  style={styles.avatar}
                />
              )}

              <View
                style={[
                  styles.messageContainer,
                  item.senderId === currentUserId
                    ? styles.myMessage
                    : styles.friendMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
                {item.timestamp?.toDate && (
                  <Text style={styles.timestampText}>
                    {format(item.timestamp.toDate(), 'yyyy-MM-dd HH:mm')}
                  </Text>
                )}
              </View>

              {item.senderId === currentUserId && (
                <Image
                  source={{ uri: item.avatarUrl || defaultAvatar }}
                  style={styles.avatar}
                />
              )}
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter a message..."
            value={message}
            onChangeText={setMessage}
          />
          <Button title="Send" onPress={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  friendRow: {
    justifyContent: 'flex-start',
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    maxWidth: '70%',
  },
  myMessage: {
    backgroundColor: '#daf8cb',
    marginLeft: 8,
  },
  friendMessage: {
    backgroundColor: '#e5e5e5',
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
  },
  timestampText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

export default ChatScreen;