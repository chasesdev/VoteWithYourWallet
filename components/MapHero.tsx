import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

// Conditional imports based on platform
let Map: any, Marker: any, MapView: any, PROVIDER_GOOGLE: any;

if (Platform.OS === 'web') {
  // Use react-map-gl for web
  try {
    const mapGl = require('react-map-gl');
    Map = mapGl.default || mapGl.Map;
    Marker = mapGl.Marker;
  } catch (e) {
    console.warn('react-map-gl not available for web');
  }
} else {
  // Use react-native-maps for mobile
  try {
    const rnMaps = require('react-native-maps');
    MapView = rnMaps.default;
    Marker = rnMaps.Marker;
    PROVIDER_GOOGLE = rnMaps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available');
  }
}

interface MapHeroProps {
  latitude: number;
  longitude: number;
  businessName?: string;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function MapHero({ 
  latitude, 
  longitude, 
  businessName = 'Business Location',
  height = 200 
}: MapHeroProps) {
  // Render for web using Mapbox
  if (Platform.OS === 'web' && Map) {
    return (
      <View style={[styles.container, { height }]}>
        <Map
          initialViewState={{
            longitude,
            latitude,
            zoom: 14
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}
        >
          <Marker longitude={longitude} latitude={latitude}>
            <View style={styles.markerPin}>
              <View style={styles.markerDot} />
            </View>
          </Marker>
        </Map>
      </View>
    );
  }

  // Fallback for web if Mapbox fails - use Google Maps embed
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3048.4037990!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1640000000000!5m2!1sen!2sus`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map showing location of ${businessName}`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={{
            latitude,
            longitude,
          }}
          title={businessName}
          description="Business Location"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    backgroundColor: '#f0f0f0',
    borderRadius: 0,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  markerPin: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});