import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, Modal, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const airports = [
  { id: '1', name: 'John F. Kennedy International Airport', lat: 40.6413, lon: -73.7781, city: 'New York, USA' },
  { id: '2', name: 'Los Angeles International Airport', lat: 33.9416, lon: -118.4085, city: 'Los Angeles, USA' },
  { id: '3', name: 'London Heathrow Airport', lat: 51.4700, lon: -0.4543, city: 'London, UK' },
  { id: '4', name: 'Dubai International Airport', lat: 25.276987, lon: 55.396713, city: 'Dubai, UAE' },
];

const MapScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      // 请求位置权限
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // 获取当前位置
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleMarkerPress = (airport: any) => {
    setSelectedAirport(airport);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location?.coords.latitude || 40.7128, // 如果没有定位信息则使用默认位置（New York）
          longitude: location?.coords.longitude || -74.0060,
          latitudeDelta: 20,
          longitudeDelta: 20,
        }}
      >
        {airports.map((airport) => (
          <Marker
            key={airport.id}
            coordinate={{ latitude: airport.lat, longitude: airport.lon }}
            title={airport.name}
            description={airport.city}
            onPress={() => handleMarkerPress(airport)}
          />
        ))}
      </MapView>

      {selectedAirport && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View style={{ backgroundColor: 'white', padding: 20 }}>
              <Text>{selectedAirport.name}</Text>
              <Text>{selectedAirport.city}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {errorMsg ? <Text>{errorMsg}</Text> : null}
    </SafeAreaView>
  );
};

export default MapScreen;
