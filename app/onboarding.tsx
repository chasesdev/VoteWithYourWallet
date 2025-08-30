import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Colors, Typography, Spacing } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import AlignmentSelector from '../components/AlignmentSelector';
import { setUserAlignment } from '../utils/api';

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAlignment, setSelectedAlignment] = useState<string[]>([]);
  const [customAlignment, setCustomAlignment] = useState<UserAlignment>({
    liberal: 0,
    conservative: 0,
    libertarian: 0,
    green: 0,
    centrist: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  const slides = [
    {
      id: 1,
      title: "Welcome to VoteWithYourWallet",
      subtitle: "Your shopping choices shape the world. Make them count.",
      icon: "wallet" as const,
      color: Colors.primary[600],
    },
    {
      id: 2,
      title: "Shop Your Values",
      subtitle: "Discover businesses that align with your political beliefs and values.",
      icon: "search" as const,
      color: Colors.secondary[600],
    },
    {
      id: 3,
      title: "Vote With Your Wallet",
      subtitle: "Every purchase is a vote for the kind of world you want to live in.",
      icon: "checkmark-circle" as const,
      color: Colors.accent[600],
    },
    {
      id: 4,
      title: "Set Your Political Alignment",
      subtitle: "Tell us what matters to you so we can find your perfect matches.",
      icon: "compass" as const,
      color: Colors.success[600],
    },
  ];

  useEffect(() => {
    // Check if user has already completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    if (hasCompletedOnboarding) {
      router.replace('/');
    }
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(currentSlide + 1);
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(currentSlide - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    router.replace('/');
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      let alignment: UserAlignment = {
        liberal: 0,
        conservative: 0,
        libertarian: 0,
        green: 0,
        centrist: 0,
      };
      
      // If specific alignments were selected, use those
      if (selectedAlignment.length > 0) {
        const alignmentOptions = [
          { id: 'liberal' },
          { id: 'conservative' },
          { id: 'libertarian' },
          { id: 'green' },
          { id: 'centrist' },
        ];
        
        alignmentOptions.forEach(option => {
          alignment[option.id as keyof UserAlignment] = selectedAlignment.includes(option.id) ? 100 : 0;
        });
      } else {
        // Otherwise use the custom alignment values
        alignment = { ...customAlignment };
      }
      
      // Generate a simple user ID (in a real app, this would come from authentication)
      const userId = Math.floor(Math.random() * 1000000);
      
      // Save to API
      const response = await setUserAlignment(userId, alignment);
      
      if (response.success) {
        // Save to localStorage for persistence
        localStorage.setItem('userAlignment', JSON.stringify(alignment));
        localStorage.setItem('hasCompletedOnboarding', 'true');
        
        // Navigate to home
        router.replace('/');
      } else {
        setError(response.error || 'Failed to save alignment');
      }
    } catch (error) {
      console.error('Error saving alignment:', error);
      setError('Failed to save alignment');
    } finally {
      setLoading(false);
    }
  };

  const renderSlide = () => {
    const slide = slides[currentSlide];
    
    if (currentSlide === 3) {
      // Political alignment slide
      return (
        <Animated.View style={[styles.slideContent as any, { opacity: fadeAnim }]}>
          <View style={styles.alignmentSlide as any}>
            <View style={styles.alignmentHeader as any}>
              <Ionicons name={slide.icon} size={48} color={slide.color} />
              <Text style={styles.slideTitle as any}>{slide.title}</Text>
              <Text style={styles.slideSubtitle as any}>{slide.subtitle}</Text>
            </View>
            
            <Card style={styles.alignmentCard as any}>
              <AlignmentSelector
                selectedAlignment={selectedAlignment}
                setSelectedAlignment={setSelectedAlignment}
                customAlignment={customAlignment}
                setCustomAlignment={setCustomAlignment}
              />
            </Card>
            
            {error && (
              <View style={styles.errorContainer as any}>
                <Ionicons name="alert-circle" size={24} color={Colors.error[500]} />
                <Text style={styles.errorText as any}>{error}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      );
    }
    
    // Regular welcome slides
    return (
      <Animated.View style={[styles.slideContent as any, { opacity: fadeAnim }]}>
        <View style={styles.iconContainer as any}>
          <Ionicons name={slide.icon} size={80} color={slide.color} />
        </View>
        <Text style={styles.slideTitle as any}>{slide.title}</Text>
        <Text style={styles.slideSubtitle as any}>{slide.subtitle}</Text>
      </Animated.View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer as any}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot as any,
              { backgroundColor: index === currentSlide ? Colors.primary[600] : Colors.gray[300] }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container as any}>
      <ScrollView style={styles.scrollView as any} contentContainerStyle={styles.scrollContent as any}>
        {/* Skip button */}
        {currentSlide < slides.length - 1 && (
          <TouchableOpacity style={styles.skipButton as any} onPress={handleSkip}>
            <Text style={styles.skipText as any}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slide content */}
        {renderSlide()}

        {/* Pagination */}
        {renderPagination()}

        {/* Navigation buttons */}
        <View style={styles.buttonContainer as any}>
          {currentSlide > 0 && (
            <Button
              variant="ghost"
              size="lg"
              onPress={handlePrevious}
              disabled={loading}
            >
              Back
            </Button>
          )}
          
          <View style={styles.primaryButtonContainer as any}>
            {currentSlide < slides.length - 1 ? (
              <Button
                variant="primary"
                size="lg"
                onPress={handleNext}
                style={styles.primaryButton as any}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={handleComplete}
                loading={loading}
                style={styles.primaryButton as any}
              >
                Get Started
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  } as const,
  scrollView: {
    flex: 1,
  } as const,
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing[8],
  } as const,
  skipButton: {
    position: 'absolute' as const,
    top: Spacing[4],
    right: Spacing[4],
    zIndex: 1,
  } as const,
  skipText: {
    ...StyleMixins.body,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  } as const,
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[16],
  } as const,
  iconContainer: {
    marginBottom: Spacing[8],
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.gray[100],
    ...StyleMixins.flexCenter,
  } as const,
  slideTitle: {
    ...StyleMixins.heading2,
    textAlign: 'center' as const,
    marginBottom: Spacing[4],
    color: Colors.gray[900],
  } as const,
  slideSubtitle: {
    ...StyleMixins.bodyLarge,
    textAlign: 'center' as const,
    color: Colors.gray[600],
    lineHeight: Typography.lineHeight.normal,
    maxWidth: 320,
  } as const,
  alignmentSlide: {
    width: '100%',
    alignItems: 'center',
  } as const,
  alignmentHeader: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  } as const,
  alignmentCard: {
    width: '100%',
    padding: 0,
    marginBottom: Spacing[4],
  } as const,
  errorContainer: {
    ...StyleMixins.flexStart,
    backgroundColor: Colors.error[50],
    padding: Spacing[4],
    borderRadius: 8,
    marginTop: Spacing[4],
  } as const,
  errorText: {
    ...StyleMixins.body,
    color: Colors.error[600],
    marginLeft: Spacing[2],
  } as const,
  paginationContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center',
    marginVertical: Spacing[6],
  } as const,
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: Spacing[1],
  } as const,
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
  } as const,
  primaryButtonContainer: {
    flex: 1,
    alignItems: 'flex-end',
  } as const,
  primaryButton: {
    minWidth: 120,
  } as const,
});