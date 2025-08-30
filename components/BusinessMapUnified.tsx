import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

// Import react-map-gl directly for web builds
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  address?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  alignment: {
    liberal: number;
    conservative: number;
    libertarian: number;
    green: number;
    centrist: number;
  };
  distance?: number;
}

interface BusinessMapProps {
  businesses: Business[];
  userLocation?: { latitude: number; longitude: number };
  selectedBusiness?: Business | null;
  onBusinessSelect: (business: Business) => void;
  onMapPress?: () => void;
  userAlignment?: any;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function BusinessMapUnified({ 
  businesses, 
  userLocation, 
  selectedBusiness, 
  onBusinessSelect,
  onMapPress,
  userAlignment
}: BusinessMapProps) {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: userLocation?.longitude || -122.4194,
    latitude: userLocation?.latitude || 37.7749,
    zoom: 12
  });
  
  const [showPopup, setShowPopup] = useState<Business | null>(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [clusteredBusinesses, setClusteredBusinesses] = useState<Business[]>([]);

  // Update view when user location changes
  useEffect(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
      }));
    }
  }, [userLocation]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      'Retail': 'storefront',
      'Food': 'restaurant',
      'Technology': 'laptop',
      'Healthcare': 'medical',
      'Finance': 'card',
      'Manufacturing': 'construct',
      'Energy': 'flash',
      'Transportation': 'car',
      'Entertainment': 'musical-notes',
      'Education': 'school',
    };
    return icons[category] || 'business';
  };

  const getAlignmentPercentage = (business: Business) => {
    if (!userAlignment || !business.alignment) return 0;
    
    let score = 0;
    let totalWeight = 0;

    Object.keys(userAlignment).forEach(key => {
      const businessValue = business.alignment?.[key as keyof typeof business.alignment];
      const userValue = userAlignment[key as keyof typeof userAlignment];
      
      if (businessValue !== undefined && userValue > 0) {
        score += businessValue * userValue;
        totalWeight += userValue;
      }
    });

    return totalWeight > 0 ? Math.round((score / totalWeight) * 10) : 0;
  };

  const handleMarkerClick = useCallback((business: Business) => {
    setShowPopup(business);
    onBusinessSelect(business);
  }, [onBusinessSelect]);

  const handleMapClick = useCallback(() => {
    setShowPopup(null);
    onMapPress?.();
  }, [onMapPress]);

  const toggleMapStyle = () => {
    setMapStyle(prev => 
      prev === 'mapbox://styles/mapbox/streets-v12' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12' 
        : 'mapbox://styles/mapbox/streets-v12'
    );
  };

  // Custom marker component
  const BusinessMarker = ({ business }: { business: Business }) => {
    const isSelected = selectedBusiness?.id === business.id;
    const alignmentScore = getAlignmentPercentage(business);
    
    return (
      <Marker
        longitude={business.longitude!}
        latitude={business.latitude!}
        anchor="bottom"
      >
        <TouchableOpacity
          style={[
            styles.markerContainer,
            isSelected && styles.selectedMarker
          ]}
          onPress={() => handleMarkerClick(business)}
        >
          <View style={[
            styles.marker,
            { backgroundColor: getMarkerColor(alignmentScore) }
          ]}>
            <Ionicons 
              name={getCategoryIcon(business.category)} 
              size={16} 
              color={Colors.white} 
            />
          </View>
          {userAlignment && alignmentScore > 0 && (
            <View style={styles.alignmentBadge}>
              <Text style={styles.alignmentText}>{alignmentScore}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </Marker>
    );
  };

  const getMarkerColor = (alignmentScore: number) => {
    if (alignmentScore >= 80) return Colors.success[600];
    if (alignmentScore >= 60) return Colors.warning[600];
    if (alignmentScore >= 40) return Colors.primary[600];
    return Colors.gray[600];
  };

  // Error handling for missing token or map components
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.demo.placeholder') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={Colors.warning[500]} />
          <Text style={styles.errorTitle}>Map Configuration Needed</Text>
          <Text style={styles.errorText}>
            To enable maps, please:
            {'\n'}1. Get a free Mapbox access token
            {'\n'}2. Add it to your environment variables
            {'\n'}3. Restart the application
          </Text>
          <Button
            variant="primary"
            onPress={() => {
              // Open Mapbox sign up page
              if (Platform.OS === 'web') {
                window.open('https://account.mapbox.com/auth/signup/', '_blank');
              }
            }}
            style={{ marginTop: Spacing[4] }}
          >
            Get Mapbox Token
          </Button>
        </View>
      </View>
    );
  }

  // Debug logging to see what's happening
  console.log('Platform.OS:', Platform.OS);
  console.log('Map available:', !!Map);
  console.log('MAPBOX_TOKEN available:', !!MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.demo.placeholder');

  // Mobile fallback - show business list with instructions  
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <View style={styles.fallbackHeader}>
            <Ionicons name="map-outline" size={48} color={Colors.gray[400]} />
            <Text style={styles.fallbackTitle}>
              {Platform.OS === 'web' ? 'Map Loading...' : 'Map View'}
            </Text>
            <Text style={styles.fallbackSubtitle}>
              {Platform.OS === 'web' 
                ? 'Loading interactive map experience...'
                : 'Interactive map is optimized for web browsers'
              }
            </Text>
          </View>
          
          <ScrollView style={styles.businessList}>
            <Text style={styles.businessListTitle}>
              {businesses.length} Businesses Found
            </Text>
            {businesses.map(business => (
              <TouchableOpacity
                key={business.id}
                style={styles.businessItem}
                onPress={() => onBusinessSelect(business)}
              >
                <View style={styles.businessItemContent}>
                  <View style={styles.businessIcon}>
                    <Ionicons name={getCategoryIcon(business.category)} size={24} color={Colors.primary[600]} />
                  </View>
                  <View style={styles.businessInfo}>
                    <Text style={styles.businessName}>{business.name}</Text>
                    <Text style={styles.businessCategory}>{business.category}</Text>
                    {business.address && (
                      <Text style={styles.businessAddress}>{business.address}</Text>
                    )}
                    {userAlignment && (
                      <Text style={styles.businessAlignment}>
                        {getAlignmentPercentage(business)}% match
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        style={styles.map}
        attributionControl={false}
        logoPosition="bottom-right"
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" showCompass showZoom />
        
        {/* Geolocation Control */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showAccuracyCircle
        />

        {/* Business Markers */}
        {businesses
          .filter(business => business.latitude && business.longitude)
          .map(business => (
            <BusinessMarker key={business.id} business={business} />
          ))}

        {/* Popup for selected business */}
        {showPopup && showPopup.latitude && showPopup.longitude && (
          <Popup
            longitude={showPopup.longitude}
            latitude={showPopup.latitude}
            anchor="bottom"
            onClose={() => setShowPopup(null)}
            closeOnClick={false}
            maxWidth="300px"
          >
            <View style={styles.popupContainer}>
              <Text style={styles.popupTitle}>{showPopup.name}</Text>
              <Text style={styles.popupCategory}>{showPopup.category}</Text>
              <Text style={styles.popupDescription} numberOfLines={3}>
                {showPopup.description}
              </Text>
              {showPopup.address && (
                <Text style={styles.popupAddress}>{showPopup.address}</Text>
              )}
              {userAlignment && (
                <View style={styles.popupAlignment}>
                  <Text style={styles.popupAlignmentText}>
                    {getAlignmentPercentage(showPopup)}% match with your values
                  </Text>
                </View>
              )}
            </View>
          </Popup>
        )}
      </Map>

      {/* Map Style Toggle */}
      <TouchableOpacity style={styles.styleToggle} onPress={toggleMapStyle}>
        <Ionicons 
          name={mapStyle.includes('satellite') ? 'map' : 'satellite'} 
          size={24} 
          color={Colors.white} 
        />
      </TouchableOpacity>

      {/* Business Count Badge */}
      <View style={styles.countBadge}>
        <Badge variant="primary" size="md">
          {businesses.length} businesses
        </Badge>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center' as const,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    ...StyleMixins.flexCenter,
    ...Shadows.medium,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
  },
  alignmentBadge: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    ...Shadows.small,
  },
  alignmentText: {
    ...StyleMixins.caption,
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.gray[900],
  },
  popupContainer: {
    padding: Spacing[3],
    minWidth: 200,
  },
  popupTitle: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[1],
  },
  popupCategory: {
    ...StyleMixins.caption,
    color: Colors.primary[600],
    marginBottom: Spacing[2],
  },
  popupDescription: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[700],
    marginBottom: Spacing[2],
    lineHeight: 18,
  },
  popupAddress: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
    marginBottom: Spacing[2],
  },
  popupAlignment: {
    backgroundColor: Colors.success[50],
    padding: Spacing[2],
    borderRadius: 6,
  },
  popupAlignmentText: {
    ...StyleMixins.caption,
    color: Colors.success[700],
    fontWeight: '500' as const,
  },
  styleToggle: {
    position: 'absolute' as const,
    bottom: Spacing[6],
    right: Spacing[4],
    backgroundColor: Colors.gray[800],
    borderRadius: 12,
    padding: Spacing[3],
    ...Shadows.medium,
  },
  countBadge: {
    position: 'absolute' as const,
    top: Spacing[4],
    left: Spacing[4],
  },
  errorContainer: {
    ...StyleMixins.flexCenter,
    flex: 1,
    padding: Spacing[8],
  },
  errorTitle: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    textAlign: 'center' as const,
  },
  errorText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  // Fallback styles
  fallbackContainer: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  fallbackHeader: {
    alignItems: 'center' as const,
    padding: Spacing[8],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  fallbackTitle: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
    marginTop: Spacing[4],
    textAlign: 'center' as const,
  },
  fallbackSubtitle: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center' as const,
    marginTop: Spacing[2],
  },
  businessList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  businessListTitle: {
    ...StyleMixins.bodySmall,
    fontWeight: '600' as const,
    color: Colors.gray[700],
    padding: Spacing[4],
    backgroundColor: Colors.gray[50],
  },
  businessItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  businessItemContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing[4],
  },
  businessIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary[50],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing[4],
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[1],
  },
  businessCategory: {
    ...StyleMixins.caption,
    color: Colors.primary[600],
    marginBottom: Spacing[1],
  },
  businessAddress: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
    marginBottom: Spacing[1],
  },
  businessAlignment: {
    ...StyleMixins.caption,
    color: Colors.success[600],
    fontWeight: '500' as const,
  },
};