import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import AirportDetail from '../screens/AirportDetail';
import FriendsScreen from '../screens/FriendsScreen';
import AlbumScreen from '../screens/AlbumScreen';
import ChatScreen from '../screens/ChatScreen';
import PhotoDetailScreen from '../screens/PhotoDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AlbumSelectScreen from '../screens/AlbumSelectScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';
import NearestAirportScreen from '../screens/NearestAirportScreen';
import AirportNavigationDetailScreen from '../screens/AirportNavigationDetailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'; // ✅ 新增导入

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined; // ✅ 添加到类型定义
  Home: undefined;
  Map: undefined;
  NavigationMap: undefined;
  AirportDetail: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    uploadedImageUrl?: string;
    selectedImageUrl?: string;
  };
  UserProfile: { userId: string };
  Friends: undefined;
  Album: undefined;
  Chat: { friendId: string };
  UploadImageScreen: { id: string };
  PhotoDetail: { photoId: string };
  EditProfile: undefined;
  AlbumSelect: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    selectedImageUrl?: string;
    source?: 'profile' | 'comment';
  };
  FriendRequests: undefined;
  AirportNavigationDetail: {
    name: string;
    latitude: number;
    longitude: number;
    userLatitude: number;
    userLongitude: number;
  };
  NearestAirport: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: '注册' }}
      />
      <Stack.Screen
        name="ForgotPassword" // ✅ 注册“忘记密码”页面
        component={ForgotPasswordScreen}
        options={{ title: '找回密码' }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '个人主页' }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AirportDetail"
        component={AirportDetail}
        options={{ title: '机场详情' }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: '好友列表' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: '用户主页' }}
      />
      <Stack.Screen
        name="Album"
        component={AlbumScreen}
        options={{ title: '飞行相册' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: '聊天' }}
      />
      <Stack.Screen
        name="PhotoDetail"
        component={PhotoDetailScreen}
        options={{ title: '照片详情' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: '编辑资料' }}
      />
      <Stack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{ title: '好友请求' }}
      />
      <Stack.Screen
        name="AlbumSelect"
        component={AlbumSelectScreen}
        options={{ title: '选择头像' }}
      />
      <Stack.Screen
        name="NearestAirport"
        component={NearestAirportScreen}
        options={{ title: '最近机场导航' }}
      />
      <Stack.Screen
        name="AirportNavigationDetail"
        component={AirportNavigationDetailScreen}
        options={{ title: '导航详情' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
