// utils/saveToFlightAlbum.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { storage } from './firebase';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';
import uuid from 'react-native-uuid';

/**
 * 保存任意图片（本地或远程）到 Firebase Storage + Firestore 飞行相册
 * @param uri 本地或远程图片 URI
 */
export const saveToFlightAlbum = async (uri: string) => {
  const uid = getAuth().currentUser?.uid;
  if (!uid || !uri) return;

  let downloadURL = uri;

  if (!uri.startsWith('http')) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}_${uuid.v4()}.jpg`;
    const path = `albums/${uid}/photos/${filename}`;
    const imageRef = ref(storage, path);
    await uploadBytes(imageRef, blob);
    downloadURL = await getDownloadURL(imageRef);
  }

  await addDoc(collection(db, `albums/${uid}/photos`), {
    imageUrl: downloadURL,
    description: `保存于 ${new Date().toISOString()}`,
  });

  return downloadURL;
};
