import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Platform, PermissionsAndroid, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import BusinessCard from './BusinessCard';

// Conditional imports for react-native-maps (mobile only)
let MapView: any, Marker: any, PROVIDER_DEFAULT: any, PROVIDER_GOOGLE: any, Callout: any;
let Region: any;

if (Platform.OS !== 'web') {
  try {
    const mapModule = require('react-native-maps');
    MapView = mapModule.default;
    Marker = mapModule.Marker;
    PROVIDER_DEFAULT = mapModule.PROVIDER_DEFAULT;
    PROVIDER_GOOGLE = mapModule.PROVIDER_GOOGLE;
    Callout = mapModule.Callout;
    Region = mapModule.Region;
  } catch (error) {
    console.log('react-native-maps not available');
  }
} else {
  // Fallback Region type for web
  Region = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
}

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

interface Cluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  businessIds: number[];
}

interface BusinessMapProps {
  businesses: Business[];
  userLocation?: { latitude: number; longitude: number };
  selectedBusiness?: Business | null;
  onBusinessSelect: (business: Business) => void;
  onMapPress?: () => void;
  userAlignment?: any;
}

const { width, height } = Dimensions.get('window');

export default function BusinessMap({ 
  businesses, 
  userLocation, 
  selectedBusiness, 
  onBusinessSelect,
  onMapPress,
  userAlignment
}: BusinessMapProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [mapRegion, setMapRegion] = useState<any>({
    latitude: userLocation?.latitude || 37.7749,
    longitude: userLocation?.longitude || -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [showMapControls, setShowMapControls] = useState(true);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [userLocationPermission, setUserLocationPermission] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestLocationPermission();
    }
    generateClusters();
  }, [businesses, mapRegion]);

  // Web fallback - show business list instead of map
  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.webFallbackContainer}>
          <View style={styles.webFallbackHeader}>
            <Ionicons name="map-outline" size={48} color={Colors.gray[400]} />
            <Text style={styles.webFallbackTitle}>Map View</Text>
            <Text style={styles.webFallbackSubtitle}>
              Interactive map is available on mobile devices
            </Text>
          </View>
          
          <ScrollView style={styles.webBusinessList}>
            <Text style={styles.webBusinessListTitle}>
              {businesses.length} Businesses Found
            </Text>
            {businesses.map(business => (
              <TouchableOpacity
                key={business.id}
                style={styles.webBusinessItem}
                onPress={() => onBusinessSelect(business)}
              >
                <View style={styles.webBusinessItemContent}>
                  <View style={styles.webBusinessIcon}>
                    <Ionicons name="storefront" size={24} color={Colors.primary[600]} />
                  </View>
                  <View style={styles.webBusinessInfo}>
                    <Text style={styles.webBusinessName}>{business.name}</Text>
                    <Text style={styles.webBusinessCategory}>{business.category}</Text>
                    {business.address && (
                      <Text style={styles.webBusinessAddress}>{business.address}</Text>
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

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'VoteWithYourWallet needs access to your location to show nearby businesses',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        setUserLocationPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
      }
    } else {
      // iOS permissions are handled by Info.plist
      setUserLocationPermission(true);
    }
  };

  const generateClusters = () => {
    // Simple clustering algorithm - groups businesses within a certain radius
    const clusterRadius = 0.01; // degrees
    const newClusters: Cluster[] = [];
    const processedBusinesses = new Set<number>();

    businesses.forEach(business => {
      if (processedBusinesses.has(business.id) || !business.latitude || !business.longitude) {
        return;
      }

      const nearbyBusinesses = businesses.filter(other => {
        if (processedBusinesses.has(other.id) || !other.latitude || !other.longitude) {
          return false;
        }

        const distance = calculateDistance(
          business.latitude!,
          business.longitude!,
          other.latitude,
          other.longitude
        );

        return distance <= clusterRadius;
      });

      if (nearbyBusinesses.length > 0) {
        const cluster: Cluster = {
          id: `cluster-${business.id}`,
          latitude: business.latitude,
          longitude: business.longitude,
          count: nearbyBusinesses.length + 1,
          businessIds: [business.id, ...nearbyBusinesses.map(b => b.id)],
        };

        newClusters.push(cluster);
        nearbyBusinesses.forEach(b => processedBusinesses.add(b.id));
        processedBusinesses.add(business.id);
      }
    });

    // Add individual businesses as single-item clusters
    businesses.forEach(business => {
      if (!processedBusinesses.has(business.id) && business.latitude && business.longitude) {
        newClusters.push({
          id: `single-${business.id}`,
          latitude: business.latitude,
          longitude: business.longitude,
          count: 1,
          businessIds: [business.id],
        });
      }
    });

    setClusters(newClusters);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleClusterPress = (cluster: Cluster) => {
    if (cluster.count === 1) {
      const business = businesses.find(b => b.id === cluster.businessIds[0]);
      if (business) {
        onBusinessSelect(business);
      }
    } else {
      setSelectedCluster(cluster);
      const clusterBusinesses = businesses.filter(b => cluster.businessIds.includes(b.id));
      setFilteredBusinesses(clusterBusinesses);
      setShowClusterModal(true);
    }
  };

  const handleMapPress = (event: any) => {
    onMapPress?.();
  };

  const handleZoomIn = () => {
    mapRef.current?.animateToRegion({
      ...mapRegion,
      latitudeDelta: mapRegion.latitudeDelta * 0.5,
      longitudeDelta: mapRegion.longitudeDelta * 0.5,
    }, 500);
  };

  const handleZoomOut = () => {
    mapRef.current?.animateToRegion({
      ...mapRegion,
      latitudeDelta: mapRegion.latitudeDelta * 2,
      longitudeDelta: mapRegion.longitudeDelta * 2,
    }, 500);
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        ...mapRegion,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }, 500);
    }
  };

  const handleRegionChange = (region: any) => {
    setMapRegion(region);
  };

  const renderMap = () => {
    return (
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.mapContainer}
        region={mapRegion}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        mapType={mapType === 'standard' ? 'standard' : mapType}
        showsUserLocation={userLocationPermission}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        loadingEnabled={true}
        loadingBackgroundColor={Colors.gray[100]}
        loadingIndicatorColor={Colors.primary[600]}
      >
        {/* User location marker (custom) */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        )}

        {/* Cluster markers */}
        {clusters.map(cluster => (
          <Marker
            key={cluster.id}
            coordinate={{
              latitude: cluster.latitude,
              longitude: cluster.longitude,
            }}
            onPress={() => handleClusterPress(cluster)}
          >
            <View style={[
              styles.clusterMarker,
              {
                backgroundColor: cluster.count === 1 ? Colors.primary[600] : Colors.error[600],
                width: cluster.count === 1 ? 24 : Math.min(48, 24 + cluster.count * 4),
                height: cluster.count === 1 ? 24 : Math.min(48, 24 + cluster.count * 4),
              }
            ]}>
              {cluster.count > 1 && (
                <Text style={styles.clusterCount}>{cluster.count}</Text>
              )}
            </View>
          </Marker>
        ))}

        {/* Individual business markers */}
        {businesses
          .filter(business => business.latitude && business.longitude)
          .map(business => (
            <Marker
              key={business.id}
              coordinate={{
                latitude: business.latitude!,
                longitude: business.longitude!,
              }}
              title={business.name}
              description={business.description}
              onPress={() => onBusinessSelect(business)}
            >
              <View style={[
                styles.businessMarker,
                selectedBusiness?.id === business.id && styles.selectedBusinessMarker
              ]}>
                <Ionicons name="storefront" size={16} color={Colors.white} />
              </View>
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{business.name}</Text>
                  <Text style={styles.calloutCategory}>{business.category}</Text>
                  {business.distance && (
                    <Text style={styles.calloutDistance}>
                      {business.distance.toFixed(1)} miles away
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
      </MapView>
    );
  };

  const renderMapControls = () => (
    <View style={styles.mapControls}>
      <TouchableOpacity
        style={styles.mapControlButton}
        onPress={handleZoomIn}
      >
        <Ionicons name="add" size={20} color={Colors.gray[700]} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.mapControlButton}
        onPress={handleZoomOut}
      >
        <Ionicons name="remove" size={20} color={Colors.gray[700]} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.mapControlButton}
        onPress={handleCenterOnUser}
      >
        <Ionicons name="locate" size={20} color={Colors.primary[600]} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.mapControlButton}
        onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
      >
        <Ionicons 
          name={mapType === 'standard' ? "layers" : "map"} 
          size={20} 
          color={Colors.gray[700]} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderClusterModal = () => (
    <Modal
      visible={showClusterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowClusterModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedCluster?.count} Businesses
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowClusterModal(false)}
          >
            <Ionicons name="close" size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>
            Businesses in this area
          </Text>

          <ScrollView style={styles.businessList}>
            {filteredBusinesses.map(business => (
              <TouchableOpacity
                key={business.id}
                style={styles.businessListItem}
                onPress={() => {
                  onBusinessSelect(business);
                  setShowClusterModal(false);
                }}
              >
                <View style={styles.businessListItemContent}>
                  <View style={styles.businessListItemIcon}>
                    <Ionicons name="storefront" size={20} color={Colors.primary[600]} />
                  </View>
                  <View style={styles.businessListItemText}>
                    <Text style={styles.businessListItemName}>{business.name}</Text>
                    <Text style={styles.businessListItemCategory}>{business.category}</Text>
                    {business.distance && (
                      <Text style={styles.businessListItemDistance}>
                        {business.distance.toFixed(1)} miles away
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Map */}
      {renderMap()}

      {/* Map Controls */}
      {showMapControls && renderMapControls()}

      {/* Map Type Indicator */}
      <View style={styles.mapTypeIndicator}>
        <Badge variant="gray" size="sm">
          {mapType === 'standard' ? 'Standard' : 'Satellite'}
        </Badge>
      </View>

      {/* Cluster Modal */}
      {renderClusterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  mapContainer: {
    flex: 1,
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  userLocationPulse: {
    position: 'absolute' as const,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[200],
    opacity: 0.5,
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[600],
  },
  businessMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[600],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.medium,
  },
  selectedBusinessMarker: {
    backgroundColor: Colors.accent[600],
    transform: [{ scale: 1.2 }],
  },
  clusterMarker: {
    borderRadius: 12,
    ...StyleMixins.flexCenter,
    ...Shadows.medium,
  },
  clusterCount: {
    ...StyleMixins.caption,
    color: Colors.white,
    fontWeight: 'bold' as const,
  },
  calloutContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing[3],
    minWidth: 150,
    ...Shadows.medium,
  },
  calloutTitle: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[1],
  },
  calloutCategory: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
    marginBottom: Spacing[1],
  },
  calloutDistance: {
    ...StyleMixins.caption,
    color: Colors.primary[600],
  },
  mapControls: {
    position: 'absolute' as const,
    right: Spacing[4],
    top: Spacing[16],
    gap: Spacing[2],
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing[1],
    ...Shadows.medium,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    ...StyleMixins.flexCenter,
  },
  mapTypeIndicator: {
    position: 'absolute' as const,
    left: Spacing[4],
    top: Spacing[16],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
  },
  closeButton: {
    padding: Spacing[2],
  },
  modalContent: {
    flex: 1,
    padding: Spacing[4],
  },
  modalSubtitle: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    marginBottom: Spacing[4],
  },
  businessList: {
    flex: 1,
  },
  businessListItem: {
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  businessListItemContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  businessListItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    ...StyleMixins.flexCenter,
    marginRight: Spacing[3],
  },
  businessListItemText: {
    flex: 1,
  },
  businessListItemName: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[1],
  },
  businessListItemCategory: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
    marginBottom: Spacing[1],
  },
  businessListItemDistance: {
    ...StyleMixins.caption,
    color: Colors.primary[600],
  },
  // Web fallback styles
  webFallbackContainer: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  webFallbackHeader: {
    alignItems: 'center' as const,
    padding: Spacing[8],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  webFallbackTitle: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
    marginTop: Spacing[4],
  },
  webFallbackSubtitle: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center' as const,
    marginTop: Spacing[2],
  },
  webBusinessList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  webBusinessListTitle: {
    ...StyleMixins.bodySmall,
    fontWeight: '600' as const,
    color: Colors.gray[700],
    padding: Spacing[4],
    backgroundColor: Colors.gray[50],
  },
  webBusinessItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  webBusinessItemContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing[4],
  },
  webBusinessIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary[50],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing[4],
  },
  webBusinessInfo: {
    flex: 1,
  },
  webBusinessName: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[1],
  },
  webBusinessCategory: {
    ...StyleMixins.caption,
    color: Colors.primary[600],
    marginBottom: Spacing[1],
  },
  webBusinessAddress: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
  },
});