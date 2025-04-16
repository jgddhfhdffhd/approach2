import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

// 类型定义导航
type SplashScreenNavProp = StackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavProp>();
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev === 1) {
          clearInterval(timer);
          Speech.speak('Welcome aboard! Your journey is about to begin!');
          setTimeout(() => {
            navigation.navigate('Login');
          }, 1500);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splash.jpg')}
        style={styles.background}
        resizeMode="cover"
      />
      <Text style={styles.counter}>{count > 0 ? count : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    position: 'absolute',
    width,
    height,
  },
  counter: {
    position: 'absolute',
    top: height * 0.75,
    width: '100%',
    textAlign: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007aff',
  },
});
