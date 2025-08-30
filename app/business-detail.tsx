import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getBusinessAlignment } from '../utils/api';

interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  website?: string;
  address?: string;
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
  donations?: Array<{
    organization: string;
    amount: number;
    politicalLean: string;
  }>;
}

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

interface AlignmentScore {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
  overallAlignment: number;
}

export default function BusinessDetailScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [userAlignment, setUserAlignment] = useState<UserAlignment>({
    liberal: 0,
    conservative: 0,
    libertarian: 0,
    green: 0,
    centrist: 0,
  });
  const [alignmentScore, setAlignmentScore] = useState<AlignmentScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const businessData = localParams.business as string;
        if (businessData) {
          const parsedBusiness = JSON.parse(businessData);
          setBusiness(parsedBusiness);
          
          // Load user alignment from localStorage
          const storedAlignment = localStorage.getItem('userAlignment');
          if (storedAlignment) {
            const alignment = JSON.parse(storedAlignment);
            setUserAlignment(alignment);
            
            // Calculate alignment score if we have both business and user alignment
            if (parsedBusiness && Object.keys(alignment).length > 0) {
              calculateAlignmentScore(parsedBusiness, alignment);
            }
          }
        }
      } catch (error) {
        console.error('Error loading business data:', error);
        setError('Failed to load business data');
      } finally {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, []);

  const calculateAlignmentScore = async (businessData: Business, alignment: UserAlignment) => {
    try {
      // Generate a simple user ID (in a real app, this would come from authentication)
      const userId = Math.floor(Math.random() * 1000000);
      
      const response = await getBusinessAlignment(userId, businessData.id);
      
      if (response.success && response.data) {
        setAlignmentScore(response.data as AlignmentScore);
      } else {
        // Fallback to local calculation
        const localScore = calculateLocalAlignmentScore(businessData, alignment);
        setAlignmentScore(localScore);
      }
    } catch (error) {
      console.error('Error fetching alignment score:', error);
      // Fallback to local calculation
      const localScore = calculateLocalAlignmentScore(businessData, alignment);
      setAlignmentScore(localScore);
    }
  };

  const calculateLocalAlignmentScore = (businessData: Business, alignment: UserAlignment): AlignmentScore => {
    let totalAlignment = 0;
    let totalWeight = 0;
    
    const alignmentScores = {
      liberal: calculateIndividualAlignment(alignment.liberal, businessData.alignment.liberal),
      conservative: calculateIndividualAlignment(alignment.conservative, businessData.alignment.conservative),
      libertarian: calculateIndividualAlignment(alignment.libertarian, businessData.alignment.libertarian),
      green: calculateIndividualAlignment(alignment.green, businessData.alignment.green),
      centrist: calculateIndividualAlignment(alignment.centrist, businessData.alignment.centrist),
    };
    
    Object.keys(alignmentScores).forEach(key => {
      const weight = alignment[key as keyof typeof alignment] || 0;
      totalAlignment += alignmentScores[key as keyof typeof alignmentScores] * weight;
      totalWeight += weight;
    });
    
    const overallAlignment = totalWeight > 0 ? totalAlignment / totalWeight : 0;
    
    return {
      ...alignmentScores,
      overallAlignment: Math.round(overallAlignment * 100),
    };
  };

  const calculateIndividualAlignment = (userValue: number, businessValue: number): number => {
    if (userValue === 0) return 0; // User doesn't care about this alignment
    
    // Normalize both values to 0-1 range
    const normalizedUser = Math.min(userValue, 100) / 100;
    const normalizedBusiness = Math.min(businessValue, 100) / 100;
    
    // Calculate the absolute difference
    const difference = Math.abs(normalizedUser - normalizedBusiness);
    
    // Return a score that is 1 when they match exactly and 0 when they are opposite
    return 1 - difference;
  };

  const getAlignmentColor = (percentage: number): string => {
    if (percentage >= 75) return '#2ecc71'; // Green - high alignment
    if (percentage >= 50) return '#f1c40f'; // Yellow - medium alignment
    if (percentage >= 25) return '#e67e22'; // Orange - low alignment
    return '#e74c3c'; // Red - very low alignment
  };

  const getAlignmentLabel = (percentage: number): string => {
    if (percentage >= 75) return 'High Alignment';
    if (percentage >= 50) return 'Medium Alignment';
    if (percentage >= 25) return 'Low Alignment';
    return 'Very Low Alignment';
  };

  const openWebsite = () => {
    if (business?.website) {
      Linking.openURL(business.website);
    }
  };

  const openMaps = () => {
    if (business?.latitude && business?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Loading business details...</Text>
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error || 'Business not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: business.imageUrl || 'https://via.placeholder.com/400x200' }} 
        style={styles.businessImage} 
      />
      
      <View style={styles.content}>
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessCategory}>{business.category}</Text>
        </View>

        <Text style={styles.businessDescription}>{business.description}</Text>

        <View style={styles.businessInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.infoText}>{business.address || 'Address not available'}</Text>
          </View>
          {business.website && (
            <View style={styles.infoItem}>
              <Ionicons name="globe" size={20} color="#666" />
              <Text style={styles.infoText}>{business.website}</Text>
            </View>
          )}
        </View>

        {/* Political Alignment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Political Alignment</Text>
          <View style={styles.alignmentContainer}>
            {Object.entries(business.alignment).map(([key, value]) => (
              <View key={key} style={styles.alignmentItem}>
                <Text style={styles.alignmentLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <View style={styles.alignmentBarContainer}>
                  <View 
                    style={[
                      styles.alignmentBar, 
                      { width: `${value * 100}%`, backgroundColor: getAlignmentColor(value * 100) }
                    ]} 
                  />
                </View>
                <Text style={styles.alignmentValue}>{Math.round(value * 100)}%</Text>
              </View>
            ))}
          </View>
          
          {/* User Alignment Comparison */}
          {Object.keys(userAlignment).length > 0 && (
            <View style={styles.userAlignmentContainer}>
              <Text style={styles.userAlignmentLabel}>Alignment with your values:</Text>
              {alignmentScore && (
                <>
                  <View style={styles.userAlignmentBarContainer}>
                    <View 
                      style={[
                        styles.userAlignmentBar, 
                        { width: `${alignmentScore.overallAlignment}%`, backgroundColor: getAlignmentColor(alignmentScore.overallAlignment) }
                      ]} 
                    />
                  </View>
                  <View style={styles.userAlignmentInfo}>
                    <Text style={styles.userAlignmentValue}>{alignmentScore.overallAlignment}%</Text>
                    <Text style={styles.userAlignmentLabel}>{getAlignmentLabel(alignmentScore.overallAlignment)}</Text>
                  </View>
                  
                  {/* Individual alignment breakdown */}
                  <View style={styles.individualAlignments}>
                    {Object.entries(alignmentScore).filter(([key]) => key !== 'overallAlignment').map(([key, value]) => (
                      <View key={key} style={styles.individualAlignmentItem}>
                        <Text style={styles.individualAlignmentLabel}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                        <View style={styles.individualAlignmentBarContainer}>
                          <View 
                            style={[
                              styles.individualAlignmentBar, 
                              { width: `${value * 100}%`, backgroundColor: getAlignmentColor(value * 100) }
                            ]} 
                          />
                        </View>
                        <Text style={styles.individualAlignmentValue}>{Math.round(value * 100)}%</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Donations Section */}
        {business.donations && business.donations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Political Donations</Text>
            <View style={styles.donationsContainer}>
              {business.donations.map((donation, index) => (
                <View key={index} style={styles.donationItem}>
                  <Text style={styles.donationOrganization}>{donation.organization}</Text>
                  <View style={styles.donationInfo}>
                    <Text style={styles.donationAmount}>${donation.amount.toLocaleString()}</Text>
                    <Text style={styles.donationPoliticalLean}>{donation.politicalLean}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: business.website ? '#f4511e' : '#95a5a6' }]} 
            onPress={openWebsite}
            disabled={!business.website}
          >
            <Ionicons name="earth" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Visit Website</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: business.latitude && business.longitude ? '#f4511e' : '#95a5a6' }]} 
            onPress={openMaps}
            disabled={!business.latitude || !business.longitude}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#f4511e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  businessImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 15,
  },
  businessHeader: {
    marginBottom: 10,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  businessCategory: {
    fontSize: 16,
    color: '#666',
  },
  businessDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: '#333',
  },
  businessInfo: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alignmentContainer: {
    marginBottom: 15,
  },
  alignmentItem: {
    marginBottom: 10,
  },
  alignmentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  alignmentBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  alignmentBar: {
    height: '100%',
  },
  alignmentValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
    textAlign: 'right',
  },
  userAlignmentContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  userAlignmentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userAlignmentBarContainer: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  userAlignmentBar: {
    height: '100%',
  },
  userAlignmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  userAlignmentValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  individualAlignments: {
    marginTop: 15,
  },
  individualAlignmentItem: {
    marginBottom: 8,
  },
  individualAlignmentLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  individualAlignmentBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  individualAlignmentBar: {
    height: '100%',
  },
  individualAlignmentValue: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  donationsContainer: {
    marginBottom: 10,
  },
  donationItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  donationOrganization: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  donationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  donationAmount: {
    fontSize: 14,
  },
  donationPoliticalLean: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});