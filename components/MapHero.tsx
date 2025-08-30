import React from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import * as WebBrowser from 'expo-web-browser';

// Conditional imports following unified map practices
let Map: any, Marker: any, NavigationControl: any, MapView: any, PROVIDER_GOOGLE: any;
let isMapAvailable = false;

if (Platform.OS === 'web') {
  // Use react-map-gl/mapbox for web (same as BusinessMapUnified)
  try {
    const mapModule = require('react-map-gl/mapbox');
    Map = mapModule.Map;
    Marker = mapModule.Marker;
    NavigationControl = mapModule.NavigationControl;
    
    // Import mapbox styles for web
    require('mapbox-gl/dist/mapbox-gl.css');
    
    isMapAvailable = !!Map;
  } catch (error) {
    console.log('Failed to load react-map-gl:', error);
    isMapAvailable = false;
  }
} else {
  // Use react-native-maps for mobile (same as BusinessMap)
  try {
    const mapModule = require('react-native-maps');
    MapView = mapModule.default;
    Marker = mapModule.Marker;
    PROVIDER_GOOGLE = mapModule.PROVIDER_GOOGLE;
    isMapAvailable = !!MapView;
  } catch (error) {
    console.log('react-native-maps not available');
    isMapAvailable = false;
  }
}

interface MapHeroProps {
  latitude: number;
  longitude: number;
  businessName?: string;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function MapHero({ 
  latitude, 
  longitude, 
  businessName = 'Business Location',
  height = 150 // Fixed height as per requirements
}: MapHeroProps) {

  const openDirections = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    WebBrowser.openBrowserAsync(url);
  };

  // Web implementation using Mapbox (following BusinessMapUnified pattern)
  if (Platform.OS === 'web' && isMapAvailable && MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.demo.placeholder') {
    return (
      <View style={[styles.container, { height }]}>
        <Map
          initialViewState={{
            longitude,
            latitude,
            zoom: 15 // Focused view as per requirements
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          interactive={false} // Static focused view
          attributionControl={false}
          logoPosition="bottom-right"
        >
          {/* Business location marker */}
          <Marker longitude={longitude} latitude={latitude} anchor="bottom">
            <View style={styles.businessMarker}>
              <Ionicons name="location" size={20} color={Colors.white} />
            </View>
          </Marker>
        </Map>

        {/* Get Directions Button Overlay */}
        <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
          <Ionicons name="navigate" size={16} color={Colors.white} />
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Mobile implementation using react-native-maps (following BusinessMap pattern)
  if (Platform.OS !== 'web' && isMapAvailable) {
    return (
      <View style={[styles.container, { height }]}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          region={{
            latitude,
            longitude,
            latitudeDelta: 0.008, // Focused view
            longitudeDelta: 0.008,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          scrollEnabled={false} // Static focused view
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {/* Business location marker */}
          <Marker
            coordinate={{ latitude, longitude }}
            title={businessName}
            description="Business Location"
          >
            <View style={styles.businessMarker}>
              <Ionicons name="location" size={20} color={Colors.white} />
            </View>
          </Marker>
        </MapView>

        {/* Get Directions Button Overlay */}
        <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
          <Ionicons name="navigate" size={16} color={Colors.white} />
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback for any platform without map support
  return (
    <View style={[styles.container, styles.fallbackContainer, { height }]}>
      <View style={styles.fallbackContent}>
        <Ionicons name="location" size={32} color={Colors.gray[400]} />
        <Text style={styles.fallbackText}>{businessName}</Text>
        <TouchableOpacity style={styles.fallbackDirectionsButton} onPress={openDirections}>
          <Ionicons name="navigate" size={16} color={Colors.primary[600]} />
          <Text style={styles.fallbackDirectionsText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container - hero section proportions
  container: {
    width: screenWidth,
    backgroundColor: Colors.gray[100],
    overflow: 'hidden',
    position: 'relative',
  },
  
  // Map styles
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  // Business location marker (following BusinessMapUnified pattern)
  businessMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[600],
    ...StyleMixins.flexCenter,
    ...Shadows.medium,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  
  // Get Directions button overlay
  directionsButton: {
    position: 'absolute',
    bottom: Spacing[4],
    right: Spacing[4],
    backgroundColor: Colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: 24,
    ...Shadows.medium,
  },
  
  directionsText: {
    ...StyleMixins.bodySmall,
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing[2],
  },
  
  // Fallback container (when maps unavailable)
  fallbackContainer: {
    backgroundColor: Colors.gray[50],
  },
  
  fallbackContent: {
    flex: 1,
    ...StyleMixins.flexCenter,
    paddingHorizontal: Spacing[6],
  },
  
  fallbackText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
  },
  
  fallbackDirectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  
  fallbackDirectionsText: {
    ...StyleMixins.bodySmall,
    color: Colors.primary[600],
    fontWeight: '600',
    marginLeft: Spacing[2],
  },
});