import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BusinessCard from '../components/BusinessCard';
import SearchBar from '../components/SearchBar';
import FilterSection from '../components/FilterSection';
import { fetchBusinesses, setUserAlignment } from '../utils/api';

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

  useEffect(() => {
    fetchBusinessesData();
    loadUserAlignment();
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
        setUserAlignmentState(JSON.parse(storedAlignment));
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Loading political business data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText}>Retrying in 3 seconds...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/political-alignment')}>
          <Ionicons name="settings" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>VoteWithYourWallet</Text>
        <View style={styles.placeholder} />
      </View>

      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={handleSearchChange} 
      />

      <FilterSection 
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        sortBy={sortBy}
        setSortBy={handleSortChange}
      />

      {Object.keys(userAlignment).length === 0 && (
        <View style={styles.alignmentPrompt}>
          <Text style={styles.alignmentPromptText}>
            Set your political alignment to see which businesses match your values!
          </Text>
          <TouchableOpacity 
            style={styles.setAlignmentButton}
            onPress={() => router.push('/political-alignment')}
          >
            <Text style={styles.setAlignmentButtonText}>Set Alignment</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </Text>
      </View>

      <FlatList
        data={filteredBusinesses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BusinessCard 
            business={item}
            userAlignment={userAlignment}
            onPress={() => handleBusinessPress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color="#ddd" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory !== 'All' 
                ? "No businesses match your filters" 
                : "No businesses available"}
            </Text>
            {(searchQuery || selectedCategory !== 'All') && (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          // Load more results when reaching the end
          // In a real app, this would trigger pagination
        }}
      />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  retryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  alignmentPrompt: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alignmentPromptText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  setAlignmentButton: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  setAlignmentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultsInfo: {
    backgroundColor: '#fff',
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 20,
    backgroundColor: '#f4511e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});