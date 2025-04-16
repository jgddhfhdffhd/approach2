import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/approach.jpg')}
        style={styles.background}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
  },
});
