import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Input from './ui/Input';

interface FilterOptions {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  alignmentFilter: {
    liberal: boolean;
    conservative: boolean;
    libertarian: boolean;
    green: boolean;
    centrist: boolean;
  };
  setAlignmentFilter: (filter: any) => void;
  priceRange: {
    min: number;
    max: number;
  };
  setPriceRange: (range: { min: number; max: number }) => void;
  distance: number;
  setDistance: (distance: number) => void;
  rating: number;
  setRating: (rating: number) => void;
  userLocation?: { latitude: number; longitude: number };
}

interface FilterSectionProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onApplyFilters?: () => void;
  userLocation?: { latitude: number; longitude: number };
}

const alignmentOptions = [
  { id: 'liberal', label: 'Liberal', color: Colors.primary[500] },
  { id: 'conservative', label: 'Conservative', color: Colors.error[500] },
  { id: 'libertarian', label: 'Libertarian', color: Colors.accent[500] },
  { id: 'green', label: 'Green', color: Colors.secondary[500] },
  { id: 'centrist', label: 'Centrist', color: Colors.gray[500] },
];

const sortOptions = [
  { id: 'alignment', label: 'Best Match', icon: 'checkmark-circle' as const },
  { id: 'name', label: 'Name', icon: 'text' as const },
  { id: 'category', label: 'Category', icon: 'grid' as const },
  { id: 'rating', label: 'Rating', icon: 'star' as const },
  { id: 'distance', label: 'Distance', icon: 'location' as const },
  { id: 'price', label: 'Price', icon: 'pricetag' as const },
];

const priceRanges = [
  { id: 'budget', label: '$', min: 0, max: 25 },
  { id: 'moderate', label: '$$', min: 25, max: 50 },
  { id: 'upscale', label: '$$$', min: 50, max: 100 },
  { id: 'luxury', label: '$$$$', min: 100, max: 1000 },
];

export default function FilterSection({ 
  categories, 
  selectedCategory, 
  setSelectedCategory, 
  sortBy, 
  setSortBy,
  onApplyFilters,
  userLocation
}: FilterSectionProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [alignmentFilter, setAlignmentFilter] = useState({
    liberal: false,
    conservative: false,
    libertarian: false,
    green: false,
    centrist: false,
  });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [distance, setDistance] = useState(10);
  const [rating, setRating] = useState(0);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (Object.values(alignmentFilter).some(v => v)) count++;
    if (priceRange.min > 0 || priceRange.max < 1000) count++;
    if (distance < 10) count++;
    if (rating > 0) count++;
    setActiveFiltersCount(count);
  }, [selectedCategory, alignmentFilter, priceRange, distance, rating]);

  const toggleAdvancedFilters = () => {
    if (showAdvancedFilters) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowAdvancedFilters(false));
    } else {
      setShowAdvancedFilters(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleAlignmentToggle = (alignment: string) => {
    setAlignmentFilter(prev => ({
      ...prev,
      [alignment]: !prev[alignment as keyof typeof prev],
    }));
  };

  const handlePriceRangeSelect = (range: { min: number; max: number }) => {
    setPriceRange(range);
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setAlignmentFilter({
      liberal: false,
      conservative: false,
      libertarian: false,
      green: false,
      centrist: false,
    });
    setPriceRange({ min: 0, max: 1000 });
    setDistance(10);
    setRating(0);
  };

  const renderCategoryPills = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.selectedCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sort By</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.sortButton,
              sortBy === option.id && styles.selectedSortButton
            ]}
            onPress={() => setSortBy(option.id)}
          >
            <Ionicons 
              name={option.icon} 
              size={16} 
              color={sortBy === option.id ? Colors.white : Colors.gray[600]} 
            />
            <Text style={[
              styles.sortText,
              sortBy === option.id && styles.selectedSortText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAdvancedFilters = () => {
    if (!showAdvancedFilters) return null;

    return (
      <Animated.View style={[
        styles.advancedFilters,
        {
          opacity: slideAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}>
        <Card style={styles.advancedFiltersCard}>
          {/* Alignment Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Political Alignment</Text>
            <View style={styles.alignmentGrid}>
              {alignmentOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.alignmentButton,
                    {
                      backgroundColor: alignmentFilter[option.id as keyof typeof alignmentFilter]
                        ? option.color
                        : Colors.gray[100],
                    }
                  ]}
                  onPress={() => handleAlignmentToggle(option.id)}
                >
                  <Text style={[
                    styles.alignmentButtonText,
                    {
                      color: alignmentFilter[option.id as keyof typeof alignmentFilter]
                        ? Colors.white
                        : Colors.gray[700],
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.priceRangeGrid}>
              {priceRanges.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    styles.priceRangeButton,
                    {
                      backgroundColor: priceRange.min === range.min && priceRange.max === range.max
                        ? Colors.primary[600]
                        : Colors.gray[100],
                    }
                  ]}
                  onPress={() => handlePriceRangeSelect(range)}
                >
                  <Text style={[
                    styles.priceRangeText,
                    {
                      color: priceRange.min === range.min && priceRange.max === range.max
                        ? Colors.white
                        : Colors.gray[700],
                    }
                  ]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Distance Filter */}
          {userLocation && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Distance</Text>
              <View style={styles.distanceContainer}>
                <Text style={styles.distanceValue}>{distance} miles</Text>
                <View style={styles.distanceSlider}>
                  <TouchableOpacity
                    style={styles.distanceButton}
                    onPress={() => setDistance(Math.max(1, distance - 1))}
                  >
                    <Ionicons name="remove" size={20} color={Colors.primary[600]} />
                  </TouchableOpacity>
                  <View style={styles.distanceTrack}>
                    <View style={[
                      styles.distanceProgress,
                      { width: `${(distance / 50) * 100}%` }
                    ]} />
                  </View>
                  <TouchableOpacity
                    style={styles.distanceButton}
                    onPress={() => setDistance(Math.min(50, distance + 1))}
                  >
                    <Ionicons name="add" size={20} color={Colors.primary[600]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Rating Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={24}
                    color={star <= rating ? Colors.accent[500] : Colors.gray[300]}
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.ratingText}>
                {rating > 0 ? `${rating}+ stars` : 'Any rating'}
              </Text>
            </View>
          </View>

          {/* Filter Actions */}
          <View style={styles.filterActions}>
            <Button
              variant="ghost"
              size="md"
              onPress={clearAllFilters}
              style={styles.clearButton}
            >
              Clear All
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={() => {
                onApplyFilters?.();
                toggleAdvancedFilters();
              }}
              style={styles.applyButton}
            >
              Apply Filters
            </Button>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Basic Filters */}
      {renderCategoryPills()}
      {renderSortOptions()}

      {/* Advanced Filters Toggle */}
      <View style={styles.advancedToggleContainer}>
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={toggleAdvancedFilters}
        >
          <View style={styles.advancedToggleContent}>
            <Ionicons 
              name={showAdvancedFilters ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.primary[600]} 
            />
            <Text style={styles.advancedToggleText}>Advanced Filters</Text>
            {activeFiltersCount > 0 && (
              <Badge variant="primary" size="sm">
                {activeFiltersCount}
              </Badge>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Advanced Filters */}
      {renderAdvancedFilters()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  section: {
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  sectionTitle: {
    ...StyleMixins.bodySmall,
    fontWeight: '600' as const,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
    textTransform: 'uppercase' as const,
  },
  categoryScroll: {
    marginBottom: 0,
  },
  categoryButton: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 20,
    marginRight: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  categoryText: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[700],
    fontWeight: '500' as const,
  },
  selectedCategoryText: {
    color: Colors.white,
  },
  sortScroll: {
    marginBottom: 0,
  },
  sortButton: {
    backgroundColor: Colors.gray[100],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 8,
    marginRight: Spacing[2],
    gap: Spacing[1],
  },
  selectedSortButton: {
    backgroundColor: Colors.primary[600],
  },
  sortText: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[700],
    fontWeight: '500' as const,
  },
  selectedSortText: {
    color: Colors.white,
  },
  advancedToggleContainer: {
    padding: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  advancedToggle: {
    width: '100%',
  },
  advancedToggleContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing[2],
  },
  advancedToggleText: {
    ...StyleMixins.body,
    color: Colors.primary[600],
    fontWeight: '500' as const,
  },
  advancedFilters: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  advancedFiltersCard: {
    padding: Spacing[4],
    ...Shadows.medium,
  },
  filterSection: {
    marginBottom: Spacing[5],
  },
  filterSectionTitle: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[3],
  },
  alignmentGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  alignmentButton: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  alignmentButtonText: {
    ...StyleMixins.bodySmall,
    fontWeight: '500' as const,
  },
  priceRangeGrid: {
    flexDirection: 'row' as const,
    gap: Spacing[2],
  },
  priceRangeButton: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  priceRangeText: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
  },
  distanceContainer: {
    gap: Spacing[3],
  },
  distanceValue: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    color: Colors.primary[600],
    textAlign: 'center',
  },
  distanceSlider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing[2],
  },
  distanceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[100],
    ...StyleMixins.flexCenter,
  },
  distanceTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    position: 'relative' as const,
  },
  distanceProgress: {
    height: '100%',
    backgroundColor: Colors.primary[600],
    borderRadius: 4,
    position: 'absolute' as const,
    left: 0,
    top: 0,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing[2],
  },
  ratingText: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[600],
    marginLeft: Spacing[2],
  },
  filterActions: {
    flexDirection: 'row' as const,
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
