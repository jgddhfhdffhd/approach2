import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator, Pressable, Dimensions, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import airportData from '../assets/airports.json';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const { height } = Dimensions.get('window');

type Airport = {
  name: string;
  lat: number;
  lon: number;
};

type NavProp = StackNavigationProp<RootStackParamList, 'NearestAirport'>;

export default function NearestAirportScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearestAirport, setNearestAirport] = useState<(Airport & { dist: number }) | null>(null);
  const [mapHtml, setMapHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavProp>();

  const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    const fetchLocation = async () => {
      const fallback = async () => {
        try {
          const res = await fetch('https://ipwho.is/');
          const data = await res.json();
          if (!data.success || !data.latitude || !data.longitude) throw new Error('备用接口定位失败');
          setLocation({ latitude: data.latitude, longitude: data.longitude });
        } catch (error) {
          console.error('备用 IP 定位失败:', error);
          Alert.alert('Error', 'IP 定位失败，请检查网络');
        }
      };

      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (!data.latitude || !data.longitude) throw new Error('主接口无效位置');
        setLocation({ latitude: data.latitude, longitude: data.longitude });
      } catch (err) {
        console.warn('主 IP 定位失败，2 秒后重试备用接口');
        setTimeout(fallback, 2000);
      }
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    if (!location) return;

    const nearest = airportData.reduce(
      (closest: Airport & { dist: number }, airport: Airport) => {
        const d = haversineDistance(
          location.latitude,
          location.longitude,
          airport.lat,
          airport.lon
        );
        return d < closest.dist ? { ...airport, dist: d } : closest;
      },
      { name: '', lat: 0, lon: 0, dist: Infinity }
    );

    setNearestAirport(nearest);

    const escapedName = JSON.stringify(nearest.name || 'Unknown')
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e');

    const leafletHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body { margin: 0; padding: 0; height: 100%; }
            #map { height: 100%; width: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${location.latitude}, ${location.longitude}], 9);
            L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
              maxZoom: 18,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            L.marker([${location.latitude}, ${location.longitude}])
              .addTo(map)
              .bindPopup("Your Estimated Location")
              .openPopup();

            L.marker([${nearest.lat}, ${nearest.lon}])
              .addTo(map)
              .bindPopup(${escapedName});
          </script>
        </body>
      </html>
    `;

    setMapHtml(leafletHtml);
    setLoading(false);
  }, [location]);

  const handleNavigate = () => {
    if (!location || !nearestAirport) return;
    navigation.navigate('AirportNavigationDetail', {
      name: nearestAirport.name,
      latitude: nearestAirport.lat,
      longitude: nearestAirport.lon,
      userLatitude: location.latitude,
      userLongitude: location.longitude,
    });
  };

  if (loading || !location || !nearestAirport || !mapHtml) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={Platform.OS === 'android'}
        startInLoadingState
      />

      <View style={styles.infoBox}>
        <Text style={styles.title}>🛫 Nearest Airport</Text>
        <Text style={styles.airport}>{nearestAirport.name}</Text>
        <Pressable style={styles.button} onPress={handleNavigate}>
          <Text style={styles.buttonText}>Start Navigation</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F9FF' },
  map: {
    height: height * 0.6,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  airport: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
