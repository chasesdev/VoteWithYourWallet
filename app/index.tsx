import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
import BusinessCard from '../components/BusinessCard';
import BusinessMap from '../components/BusinessMap';
import SearchBar from '../components/SearchBar';
import FilterSection from '../components/FilterSection';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { fetchBusinesses, setUserAlignment } from '../utils/api';
import { Colors, Typography, Spacing } from '../constants/design';
import { StyleMixins, CommonStyles } from '../utils/styles';

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
}

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('alignment');
  const [userAlignment, setUserAlignmentState] = useState<UserAlignment>({
    liberal: 0,
    conservative: 0,
    libertarian: 0,
    green: 0,
    centrist: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showHero, setShowHero] = useState(true);
  const [hasUserAlignment, setHasUserAlignment] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    fetchBusinessesData();
    loadUserAlignment();
    getUserLocation();
    
    // Check if user needs onboarding
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    const hasSeenApp = localStorage.getItem('hasSeenApp');
    
    if (!hasCompletedOnboarding && !hasSeenApp) {
      // First time user - show onboarding
      setTimeout(() => {
        router.replace('/onboarding' as any);
      }, 100);
    }
  }, []);

  useEffect(() => {
    // Debounced search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      filterAndSortBusinesses();
    }, 300); // 300ms delay

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, selectedCategory, sortBy, userAlignment, businesses]);

  const fetchBusinessesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchBusinesses(searchQuery, selectedCategory === 'All' ? undefined : selectedCategory);
      
      if (response.success && response.data) {
        // Handle the case where response.data might be a BusinessResponse object
        const businessesData = Array.isArray(response.data) ? response.data : response.data.businesses || [];
        setBusinesses(businessesData);
      } else {
        setError(response.error || 'Failed to fetch businesses');
        // Use sample data as fallback
        setBusinesses(getSampleBusinesses());
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Network error occurred');
      // Use sample data as fallback
      setBusinesses(getSampleBusinesses());
    } finally {
      setLoading(false);
    }
  };

  const loadUserAlignment = async () => {
    try {
      const storedAlignment = localStorage.getItem('userAlignment');
      if (storedAlignment) {
        const alignment = JSON.parse(storedAlignment);
        setUserAlignmentState(alignment);
        
        // Check if user has meaningful alignment set
        const hasAlignment = Object.values(alignment).some((value: any) => value > 0);
        setHasUserAlignment(hasAlignment);
        
        // Hide hero if user has alignment and has seen the app before
        const hasSeenApp = localStorage.getItem('hasSeenApp');
        if (hasAlignment && hasSeenApp) {
          setShowHero(false);
        }
      }
    } catch (error) {
      console.error('Error loading user alignment:', error);
    }
  };

  const filterAndSortBusinesses = useCallback(() => {
    let result = [...businesses];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(business => 
        business.name.toLowerCase().includes(query) || 
        business.description.toLowerCase().includes(query) ||
        business.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      result = result.filter(business => business.category === selectedCategory);
    }

    // Sort businesses based on user alignment
    if (Object.keys(userAlignment).length > 0) {
      result.sort((a, b) => {
        const aAlignmentScore = calculateAlignmentScore(a, userAlignment);
        const bAlignmentScore = calculateAlignmentScore(b, userAlignment);
        
        if (sortBy === 'alignment') {
          return bAlignmentScore - aAlignmentScore;
        } else if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'category') {
          return a.category.localeCompare(b.category);
        }
        return 0;
      });
    } else {
      // Sort by name if no alignment is set
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredBusinesses(result);
  }, [businesses, searchQuery, selectedCategory, sortBy, userAlignment]);

  const calculateAlignmentScore = (business: Business, alignment: UserAlignment) => {
    let score = 0;
    let totalWeight = 0;

    Object.keys(alignment).forEach(key => {
      if (business.alignment[key as keyof typeof business.alignment] !== undefined && alignment[key as keyof typeof alignment] > 0) {
        score += business.alignment[key as keyof typeof business.alignment] * alignment[key as keyof typeof alignment];
        totalWeight += alignment[key as keyof typeof alignment];
      }
    });

    return totalWeight > 0 ? score / totalWeight : 0;
  };

  const categories = ['All', ...new Set(businesses.map(business => business.category))];

  const handleBusinessPress = (business: Business) => {
    router.push({
      pathname: '/business-detail',
      params: { business: JSON.stringify(business) }
    });
  };

  const handleSetAlignment = async () => {
    try {
      // Generate a simple user ID (in a real app, this would come from authentication)
      const userId = Math.floor(Math.random() * 1000000);
      
      const response = await setUserAlignment(userId, userAlignment);
      
      if (response.success) {
        localStorage.setItem('userAlignment', JSON.stringify(userAlignment));
        router.back();
      } else {
        setError(response.error || 'Failed to save alignment');
      }
    } catch (error) {
      console.error('Error setting alignment:', error);
      setError('Failed to save alignment');
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const renderHeroSection = () => {
    if (!showHero) return null;
    
    return (
      <View
        style={[heroContainerStyle, { backgroundColor: Colors.primary[600] }]}
      >
        <View style={heroContentStyle}>
          <View style={heroHeaderStyle}>
            <Text style={heroTitleStyle}>
              Shop Your Values.{'\n'}Vote With Your Wallet.
            </Text>
            <Text style={heroSubtitleStyle}>
              Discover businesses that align with your political values and make purchases that reflect your beliefs.
            </Text>
          </View>
          
          <View style={heroStatsStyle}>
            <View style={heroStatItemStyle}>
              <Text style={heroStatNumberStyle}>10,000+</Text>
              <Text style={heroStatLabelStyle}>Businesses</Text>
            </View>
            <View style={heroStatItemStyle}>
              <Text style={heroStatNumberStyle}>50k+</Text>
              <Text style={heroStatLabelStyle}>Users</Text>
            </View>
            <View style={heroStatItemStyle}>
              <Text style={heroStatNumberStyle}>95%</Text>
              <Text style={heroStatLabelStyle}>Accuracy</Text>
            </View>
          </View>
          
          <View style={heroActionsStyle}>
            <Button
              variant="secondary"
              size="lg"
              onPress={() => {
                setShowHero(false);
                localStorage.setItem('hasSeenApp', 'true');
                router.push('/political-alignment');
              }}
              style={heroButtonStyle}
            >
              Set My Values
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onPress={() => {
                setShowHero(false);
                localStorage.setItem('hasSeenApp', 'true');
              }}
              textStyle={{ color: Colors.white }}
            >
              Browse Without Setup
            </Button>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={loadingContainerStyle}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={loadingTextStyle}>
          Loading political business data...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={errorContainerStyle}>
        <Ionicons name="alert-circle" size={64} color={Colors.error[500]} />
        <Text style={errorTextStyle}>{error}</Text>
        <Button
          variant="primary"
          onPress={fetchBusinessesData}
          style={{ marginTop: Spacing[4] }}
        >
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={containerStyle}>
      {/* Premium Header */}
      <View style={headerStyle}>
        <TouchableOpacity 
          onPress={() => router.push('/political-alignment')}
          style={settingsButtonStyle}
        >
          <Ionicons name="settings" size={24} color={Colors.gray[600]} />
        </TouchableOpacity>
        
        <View style={logoContainerStyle}>
          <View style={logoIconContainerStyle}>
            <Ionicons name="wallet" size={32} color={Colors.primary[600]} />
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={Colors.success[500]} 
              style={logoCheckmarkStyle} 
            />
          </View>
          <Text style={titleStyle}>VoteWithYourWallet</Text>
        </View>
        
        <TouchableOpacity style={notificationButtonStyle}>
          <Ionicons name="notifications" size={24} color={Colors.gray[600]} />
          <View style={notificationBadgeStyle}>
            <Text style={notificationBadgeTextStyle}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      {renderHeroSection()}

      {/* Search & Filters */}
      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={handleSearchChange} 
      />

      {/* View Toggle */}
      <View style={viewToggleContainerStyle}>
        <View style={viewToggleStyle}>
          <TouchableOpacity
            style={[viewToggleButtonStyle, viewMode === 'list' && viewToggleButtonActiveStyle]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? Colors.white : Colors.gray[600]} 
            />
            <Text style={[viewToggleTextStyle, viewMode === 'list' && viewToggleTextActiveStyle]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[viewToggleButtonStyle, viewMode === 'map' && viewToggleButtonActiveStyle]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons 
              name="map" 
              size={20} 
              color={viewMode === 'map' ? Colors.white : Colors.gray[600]} 
            />
            <Text style={[viewToggleTextStyle, viewMode === 'map' && viewToggleTextActiveStyle]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FilterSection 
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        sortBy={sortBy}
        setSortBy={handleSortChange}
      />

      {/* Featured Businesses Section */}
      {!hasUserAlignment && filteredBusinesses.length > 0 && (
        <View style={featuredSectionStyle}>
          <Text style={featuredSectionTitleStyle}>
            ✨ Featured Businesses
          </Text>
          <Text style={featuredSectionSubtitleStyle}>
            Popular businesses with strong political positions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={featuredScrollContainerStyle}>
              {filteredBusinesses.slice(0, 3).map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  userAlignment={userAlignment}
                  onPress={() => handleBusinessPress(business)}
                  variant="featured"
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Quick Setup Prompt */}
      {!hasUserAlignment && (
        <Card style={alignmentPromptStyle}>
          <View style={alignmentPromptContentStyle}>
            <View style={alignmentPromptHeaderStyle}>
              <Ionicons name="compass" size={32} color={Colors.primary[600]} />
              <View style={alignmentPromptTextContainerStyle}>
                <Text style={alignmentPromptTitleStyle}>
                  Get Personalized Matches
                </Text>
                <Text style={alignmentPromptDescriptionStyle}>
                  Set your political alignment to see which businesses match your values!
                </Text>
              </View>
            </View>
            <Button
              variant="primary"
              size="lg"
              onPress={() => router.push('/political-alignment')}
            >
              Set My Values
            </Button>
          </View>
        </Card>
      )}

      {/* Results Info */}
      <View style={resultsInfoStyle}>
        <Text style={resultsTextStyle}>
          {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </Text>
        
        {hasUserAlignment && (
          <View style={alignmentIndicatorStyle}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
            <Text style={alignmentIndicatorTextStyle}>
              Personalized for your values
            </Text>
          </View>
        )}
      </View>

      {/* Business List or Map View */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredBusinesses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <BusinessCard 
              business={item}
              userAlignment={hasUserAlignment ? userAlignment : undefined}
              onPress={() => handleBusinessPress(item)}
              variant="default"
            />
          )}
          ListEmptyComponent={
            <Card style={emptyContainerStyle}>
              <View style={emptyContentStyle}>
                <Ionicons name="search" size={64} color={Colors.gray[300]} />
                <Text style={emptyTitleStyle}>
                  {searchQuery || selectedCategory !== 'All' 
                    ? "No businesses match your filters" 
                    : "No businesses available"}
                </Text>
                <Text style={emptyDescriptionStyle}>
                  {searchQuery || selectedCategory !== 'All' 
                    ? "Try adjusting your search terms or filters" 
                    : "We're working on adding more businesses to the platform"}
                </Text>
                {(searchQuery || selectedCategory !== 'All') && (
                  <Button
                    variant="primary"
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    style={{ marginTop: Spacing[4] }}
                  >
                    Clear Filters
                  </Button>
                )}
              </View>
            </Card>
          }
          contentContainerStyle={listContainerStyle}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            // Load more results when reaching the end
            // In a real app, this would trigger pagination
          }}
        />
      ) : (
        <View style={mapContainerStyle}>
          <BusinessMap
            businesses={filteredBusinesses}
            userLocation={userLocation}
            selectedBusiness={selectedBusiness}
            onBusinessSelect={(business) => {
              setSelectedBusiness(business);
              handleBusinessPress(business);
            }}
            onMapPress={() => setSelectedBusiness(null)}
            userAlignment={hasUserAlignment ? userAlignment : undefined}
          />
        </View>
      )}
    </ScrollView>
  );
}

// Sample data for testing
function getSampleBusinesses(): Business[] {
  return [
    {
      id: 1,
      name: "EcoFriendly Store",
      description: "Sustainable products for environmentally conscious consumers",
      category: "Retail",
      address: "123 Green St, Eco City",
      imageUrl: "https://via.placeholder.com/100",
      alignment: {
        liberal: 0.9,
        conservative: 0.1,
        libertarian: 0.3,
        green: 0.95,
        centrist: 0.5,
      },
    },
    {
      id: 2,
      name: "American Made Co.",
      description: "Proudly manufacturing products in the USA since 1950",
      category: "Manufacturing",
      address: "456 Factory Ave, Industry Town",
      imageUrl: "https://via.placeholder.com/100",
      alignment: {
        liberal: 0.2,
        conservative: 0.9,
        libertarian: 0.7,
        green: 0.1,
        centrist: 0.4,
      },
    },
    {
      id: 3,
      name: "Green Energy Solutions",
      description: "Renewable energy products and services for homes and businesses",
      category: "Energy",
      address: "789 Solar Ave, Clean City",
      imageUrl: "https://via.placeholder.com/100",
      alignment: {
        liberal: 0.8,
        conservative: 0.2,
        libertarian: 0.4,
        green: 0.9,
        centrist: 0.6,
      },
    },
    {
      id: 4,
      name: "Traditional Values Market",
      description: "Family-owned business focusing on traditional American values",
      category: "Retail",
      address: "321 Heritage St, Traditional Town",
      imageUrl: "https://via.placeholder.com/100",
      alignment: {
        liberal: 0.1,
        conservative: 0.95,
        libertarian: 0.8,
        green: 0.2,
        centrist: 0.3,
      },
    },
  ];
}

// Premium Style Definitions
const containerStyle = {
  flex: 1,
  backgroundColor: Colors.gray[50],
};

// Loading States
const loadingContainerStyle = {
  ...StyleMixins.flexCenter,
  flex: 1,
  backgroundColor: Colors.white,
};

const loadingTextStyle = {
  ...StyleMixins.body,
  color: Colors.gray[600],
  marginTop: Spacing[5],
};

const errorContainerStyle = {
  ...StyleMixins.flexCenter,
  flex: 1,
  padding: Spacing[5],
};

const errorTextStyle = {
  ...StyleMixins.heading4,
  color: Colors.error[600],
  textAlign: 'center' as const,
  marginTop: Spacing[4],
};

// Header Styles
const headerStyle = {
  ...StyleMixins.flexBetween,
  paddingHorizontal: Spacing[4],
  paddingVertical: Spacing[4],
  backgroundColor: Colors.white,
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray[200],
};

const settingsButtonStyle = {
  padding: Spacing[2],
  borderRadius: 8,
};

const logoContainerStyle = {
  ...StyleMixins.flexStart,
};

const logoIconContainerStyle = {
  position: 'relative' as const,
  marginRight: Spacing[2],
};

const logoCheckmarkStyle = {
  position: 'absolute' as const,
  top: -4,
  right: -4,
};

const titleStyle = {
  ...StyleMixins.heading3,
  color: Colors.gray[900],
};

const notificationButtonStyle = {
  position: 'relative' as const,
  padding: Spacing[2],
};

const notificationBadgeStyle = {
  position: 'absolute' as const,
  top: 2,
  right: 2,
  backgroundColor: Colors.error[500],
  borderRadius: 8,
  minWidth: 16,
  height: 16,
  ...StyleMixins.flexCenter,
};

const notificationBadgeTextStyle = {
  fontSize: 10,
  color: Colors.white,
  fontWeight: 'bold' as const,
};

// Hero Section Styles
const heroContainerStyle = {
  paddingHorizontal: Spacing[6],
  paddingVertical: Spacing[12],
};

const heroContentStyle = {
  alignItems: 'center' as const,
  textAlign: 'center' as const,
};

const heroHeaderStyle = {
  alignItems: 'center' as const,
  marginBottom: Spacing[10],
  paddingHorizontal: Spacing[4],
};

const heroTitleStyle = {
  ...StyleMixins.heading1,
  color: Colors.white,
  textAlign: 'center' as const,
  marginBottom: Spacing[6],
  lineHeight: 48,
};

const heroSubtitleStyle = {
  ...StyleMixins.bodyLarge,
  color: Colors.primary[100],
  textAlign: 'center' as const,
  maxWidth: 360,
  lineHeight: 24,
  paddingHorizontal: Spacing[2],
};

const heroStatsStyle = {
  ...StyleMixins.flexBetween,
  width: '100%' as const,
  marginBottom: Spacing[8],
};

const heroStatItemStyle = {
  alignItems: 'center' as const,
};

const heroStatNumberStyle = {
  ...StyleMixins.heading2,
  color: Colors.white,
  fontWeight: 'bold' as const,
};

const heroStatLabelStyle = {
  ...StyleMixins.bodySmall,
  color: Colors.primary[200],
  marginTop: Spacing[1],
};

const heroActionsStyle = {
  gap: Spacing[3],
  width: '100%' as const,
  alignItems: 'center' as const,
};

const heroButtonStyle = {
  backgroundColor: Colors.white,
  minWidth: 200,
};

// Featured Section Styles
const featuredSectionStyle = {
  padding: Spacing[6],
  backgroundColor: Colors.white,
  marginBottom: Spacing[2],
};

const featuredSectionTitleStyle = {
  ...StyleMixins.heading3,
  marginBottom: Spacing[2],
};

const featuredSectionSubtitleStyle = {
  ...StyleMixins.body,
  color: Colors.gray[600],
  marginBottom: Spacing[6],
};

const featuredScrollContainerStyle = {
  flexDirection: 'row' as const,
  paddingHorizontal: Spacing[4],
  gap: Spacing[4],
};

// Alignment Prompt Styles
const alignmentPromptStyle = {
  margin: Spacing[4],
  padding: Spacing[6],
};

const alignmentPromptContentStyle = {
  gap: Spacing[6],
};

const alignmentPromptHeaderStyle = {
  ...StyleMixins.flexStart,
  gap: Spacing[4],
};

const alignmentPromptTextContainerStyle = {
  flex: 1,
};

const alignmentPromptTitleStyle = {
  ...StyleMixins.heading4,
  marginBottom: Spacing[2],
};

const alignmentPromptDescriptionStyle = {
  ...StyleMixins.body,
  color: Colors.gray[600],
};

// Results Info Styles
const resultsInfoStyle = {
  backgroundColor: Colors.white,
  padding: Spacing[4],
  marginHorizontal: Spacing[4],
  marginBottom: Spacing[2],
  borderRadius: 8,
  gap: Spacing[2],
};

const resultsTextStyle = {
  ...StyleMixins.body,
  color: Colors.gray[700],
  textAlign: 'center' as const,
};

const alignmentIndicatorStyle = {
  ...StyleMixins.flexCenter,
  gap: Spacing[1],
};

const alignmentIndicatorTextStyle = {
  ...StyleMixins.caption,
  color: Colors.success[600],
  fontWeight: '500' as const,
};

// Empty State Styles
const emptyContainerStyle = {
  margin: Spacing[6],
  padding: Spacing[8],
};

const emptyContentStyle = {
  alignItems: 'center' as const,
  textAlign: 'center' as const,
};

const emptyTitleStyle = {
  ...StyleMixins.heading4,
  color: Colors.gray[700],
  marginTop: Spacing[4],
  marginBottom: Spacing[2],
};

const emptyDescriptionStyle = {
  ...StyleMixins.body,
  color: Colors.gray[500],
  textAlign: 'center' as const,
};

// List Container Style
const listContainerStyle = {
  paddingBottom: Spacing[8],
};

// View Toggle Styles
const viewToggleContainerStyle = {
  paddingHorizontal: Spacing[6],
  paddingVertical: Spacing[3],
};

const viewToggleStyle = {
  backgroundColor: Colors.gray[100],
  borderRadius: 12,
  padding: Spacing[1],
  flexDirection: 'row' as const,
};

const viewToggleButtonStyle = {
  flex: 1,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingVertical: Spacing[3],
  paddingHorizontal: Spacing[4],
  borderRadius: 10,
  gap: Spacing[2],
};

const viewToggleButtonActiveStyle = {
  backgroundColor: Colors.primary[600],
  shadowColor: Colors.primary[600],
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
};

const viewToggleTextStyle = {
  ...StyleMixins.bodySmall,
  fontWeight: '500' as const,
  color: Colors.gray[600],
};

const viewToggleTextActiveStyle = {
  color: Colors.white,
};

// Map Container Style
const mapContainerStyle = {
  height: 500,
  marginHorizontal: Spacing[6],
  marginVertical: Spacing[4],
  borderRadius: 12,
  overflow: 'hidden' as const,
};
