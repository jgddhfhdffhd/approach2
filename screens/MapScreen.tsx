import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

type Airport = {
  airport_name: string;
  country_name: string;
  latitude: number;
  longitude: number;
  iata_code: string;
};

const TOP_COUNTRIES = [
  'China', 'United States', 'Brazil', 'Russia', 'India',
  'Australia', 'Germany', 'Canada', 'Mexico', 'France'
];

const MapScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('China');
  const [selectedAirport, setSelectedAirport] = useState('');
  const [mapHtml, setMapHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(selectedCountry)}`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
              'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY_HERE',
            },
          }
        );

        const json = await response.json();
        const items = json.items || [];

        const parsed: Airport[] = items
          .filter((item: any) => item.location?.lat && item.location?.lon)
          .map((item: any) => ({
            airport_name: item.name || 'Unnamed Airport',
            country_name: item.countryCode || 'Unknown',
            latitude: item.location.lat,
            longitude: item.location.lon,
            iata_code: item.iata || item.icao || Math.random().toString(36).slice(2, 7),
          }));

        setAirports(parsed);
        if (parsed.length > 0) {
          setSelectedAirport(parsed[0].airport_name);
        } else {
          setSelectedAirport('');
        }
      } catch (e: any) {
        console.error('AeroDataBox Fetch Error:', e.message);
        setAirports([]);
        setSelectedAirport('');
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, [selectedCountry]);

  useEffect(() => {
    const selected = airports.find(a => a.airport_name === selectedAirport);
    if (!selected) return;

    const leafletHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            #map { height: 100vh; width: 100vw; margin: 0; padding: 0; }
            body, html { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${selected.latitude}, ${selected.longitude}], 10);
            L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
              maxZoom: 18,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            const marker = L.marker([${selected.latitude}, ${selected.longitude}]).addTo(map);
            marker.on('click', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'marker_click',
                data: {
                  id: '${selected.iata_code}',
                  name: '${selected.airport_name}',
                  latitude: ${selected.latitude},
                  longitude: ${selected.longitude}
                }
              }));
            });
          </script>
        </body>
      </html>
    `;

    setMapHtml(leafletHTML);
  }, [selectedAirport]);

  const handleWebMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'marker_click') {
        const { id, name, latitude, longitude } = message.data;
        navigation.navigate('AirportDetail', {
          id,
          name,
          latitude,
          longitude,
        });
      }
    } catch (e) {
      console.warn('消息解析失败:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Select a Country</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCountry}
          onValueChange={setSelectedCountry}
        >
          {TOP_COUNTRIES.map((country) => (
            <Picker.Item key={country} label={country} value={country} />
          ))}
        </Picker>
      </View>

      <Text style={styles.title}>🛫 Select an Airport</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedAirport}
          onValueChange={setSelectedAirport}
        >
          {airports.map((a) => (
            <Picker.Item key={a.iata_code} label={a.airport_name} value={a.airport_name} />
          ))}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : mapHtml ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.map}
          javaScriptEnabled={true}
          onMessage={handleWebMessage}
        />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>暂无地图数据</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F9FF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default MapScreen;
