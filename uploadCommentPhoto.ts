// utils/uploadImageToFirebase.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase'; // Firebase Storage 配置
import uuid from 'react-native-uuid';

/**
 * 上传图片到 Firebase Storage
 * @param uri 图片本地 URI
 * @param userId 用户 ID
 * @param folder 路径用来区分不同类型的图片，例如 "avatars" 或 "commentPhotos"
 * @returns 图片的下载 URL
 */
export const uploadImageToFirebase = async (
  uri: string,
  userId: string,
  folder: string
): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = uuid.v4();
    const filename = `${timestamp}_${randomId}.jpg`;

    // 如果是上传头像，就直接存储在 avatars 文件夹中
    const path = folder === 'avatars'
      ? `avatars/${userId}/profile.jpg`
      : `${folder}/${userId}/${filename}`;

    const imageRef = ref(storage, path);

    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    console.log('✅ 图片上传成功:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ 图片上传失败:', error);
    throw error;
  }
};
