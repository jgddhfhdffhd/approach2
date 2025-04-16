import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ActivityIndicator, Alert, Image, Vibration,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import polyline from '@mapbox/polyline';
import { RootStackParamList } from '../navigation/AppNavigator';
import useRealNetworkStatus from '../useRealNetworkStatus';

const { height } = Dimensions.get('window');

type NavigationDetailRouteProp = RouteProp<RootStackParamList, 'AirportNavigationDetail'>;

type Posture = 'flat' | 'upright' | 'unknown';

export default function AirportNavigationDetail() {
  const route = useRoute<NavigationDetailRouteProp>();
  const { name, latitude, longitude } = route.params;

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapHtml, setMapHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [heading, setHeading] = useState<number>(0);
  const [devicePosture, setDevicePosture] = useState<Posture>('unknown');
  const [lastPosture, setLastPosture] = useState<Posture>('unknown');

  const isConnected = useRealNetworkStatus();

  useEffect(() => {
    const fetchIPLocation = async () => {
      const fallback = async () => {
        try {
          const res = await fetch('https://ipwho.is/');
          const data = await res.json();
          if (!data.success || !data.latitude || !data.longitude) throw new Error('备用接口定位失败');
          setUserLocation({ lat: data.latitude, lon: data.longitude });
        } catch (error) {
          console.error('备用 IP 定位失败:', error);
          Alert.alert('Error', 'IP 定位失败，请检查网络');
        }
      };

      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (!data.latitude || !data.longitude) throw new Error('主接口无效位置');
        setUserLocation({ lat: data.latitude, lon: data.longitude });
      } catch (err) {
        console.warn('主 IP 定位失败，2 秒后重试备用接口');
        setTimeout(fallback, 2000);
      }
    };

    if (isConnected) {
      fetchIPLocation();
    }
  }, [isConnected]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        if (!userLocation) return;
        const fromLat = userLocation.lat;
        const fromLon = userLocation.lon;
        const toLat = Number(latitude);
        const toLon = Number(longitude);

        const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=polyline`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.routes || data.routes.length === 0) {
          throw new Error('No route found');
        }

        const points = polyline.decode(data.routes[0].geometry);
        const pathJsArray = points.map(([lat, lon]) => `[${lat}, ${lon}]`).join(',');

        const leafletHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
              <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
              <style>
                html, body, #map { height: 100%; margin: 0; padding: 0; }
              </style>
            </head>
            <body>
              <div id="map"></div>
              <script>
                const map = L.map('map').setView([${fromLat}, ${fromLon}], 10);
                L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                L.marker([${fromLat}, ${fromLon}]).addTo(map).bindPopup("Your Location").openPopup();
                L.marker([${toLat}, ${toLon}]).addTo(map).bindPopup(${JSON.stringify(name)});

                const routeLine = L.polyline([${pathJsArray}], { color: '#007bff', weight: 4 }).addTo(map);
                map.fitBounds(routeLine.getBounds());
              </script>
            </body>
          </html>
        `;

        setMapHtml(leafletHtml);
      } catch (error) {
        console.error('Failed to fetch route:', error);
        Alert.alert('Route Error', 'Could not load navigation path.');
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && userLocation) {
      fetchRoute();
    }
  }, [isConnected, userLocation]);

  useEffect(() => {
    const sub = Magnetometer.addListener((data) => {
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      angle = angle >= 0 ? angle : angle + 360;
      setHeading(angle);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      let posture: Posture = 'unknown';
      if (Math.abs(z) > 0.7 && Math.abs(x) < 0.5 && Math.abs(y) < 0.5) {
        posture = 'flat';
      } else if (Math.abs(y) > 0.7 && Math.abs(z) < 0.7) {
        posture = 'upright';
      }
      setDevicePosture(posture);

      if (posture !== lastPosture && (posture === 'flat' || posture === 'upright')) {
        setLastPosture(posture);
        Vibration.vibrate(100);
      }
    });
    Accelerometer.setUpdateInterval(500);
    return () => sub.remove();
  }, [lastPosture]);

  if (!isConnected) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, color: 'red' }}>❌ No internet connection</Text>
      </View>
    );
  }

  if (loading || !mapHtml) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          style={styles.map}
        />
        <View style={styles.instructionOverlay}>
          <Text style={styles.instructionText}>🚗 Navigating to: {name}</Text>
        </View>
      </View>

      <View style={styles.floatingCompass}>
        <Image
          source={require('../assets/images/compass.png')}
          style={{ width: 50, height: 50, transform: [{ rotate: `${heading}deg` }] }}
        />
      </View>

      <View style={styles.postureBox}>
        <Text style={{ fontSize: 14 }}>
          📱 Posture: {devicePosture === 'flat' ? 'Flat' : devicePosture === 'upright' ? 'Upright' : 'Unknown'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F9FF' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  instructionOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: '#ffffffcc',
    paddingVertical: 10,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCompass: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffffdd',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  postureBox: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -75 }],
    width: 150,
    backgroundColor: '#ffffffdd',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 8,
  },
});
