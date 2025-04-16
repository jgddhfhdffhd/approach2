import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

const isRemoteUrl = (url: string) =>
  url.startsWith('http://') || url.startsWith('https://');

const extractRemoteUrl = (url: string): string => {
  const match = url.match(/&riu=(http[^&]+)/);
  return match ? decodeURIComponent(match[1]) : url;
};

const getExtension = (url: string) => {
  if (url.includes('.png')) return '.png';
  if (url.includes('.jpg') || url.includes('.jpeg')) return '.jpg';
  return '.jpg';
};

export const downloadImage = async (originalUrl: string) => {
  if (!originalUrl) {
    Alert.alert('下载失败', '图片地址为空');
    return;
  }

  try {
    // 请求权限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '请允许访问相册以保存图片');
      return;
    }

    // 安卓额外申请写权限（兼容旧设备）
    if (Platform.OS === 'android') {
      const perms = await MediaLibrary.getPermissionsAsync();
      if (!perms.granted) {
        Alert.alert('权限不足', '安卓设备需要写入权限');
        return;
      }
    }

    // 提取远程地址
    const url = extractRemoteUrl(originalUrl);
    const ext = getExtension(url);
    const filename = `downloaded_${Date.now()}${ext}`;
    const fileUri = FileSystem.documentDirectory + filename;

    // 下载远程图片
    const downloadRes = await FileSystem.downloadAsync(url, fileUri);

    if (!downloadRes || !downloadRes.uri) {
      throw new Error('图片下载失败');
    }

    // 保存图片到媒体库
    const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
    await MediaLibrary.createAlbumAsync('APPROACH', asset, false);

    Alert.alert('✅ 下载成功', '图片已保存到手机相册 APPROACH');
  } catch (error) {
    console.error('❌ 安卓保存失败:', error);
    Alert.alert('❌ 下载失败', '安卓保存失败，请检查权限或存储路径');
  }
};
