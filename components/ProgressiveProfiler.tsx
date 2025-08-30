import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  location?: string;
  interests: string[];
  shoppingPreferences: {
    budget: 'low' | 'medium' | 'high';
    localPreference: 'local' | 'national' | 'international';
    sustainability: 'not-important' | 'somewhat-important' | 'very-important';
  };
  notificationSettings: {
    newBusinesses: boolean;
    alignmentMatches: boolean;
    promotions: boolean;
  };
  completedSteps: string[];
}

interface ProgressiveProfilerProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onComplete?: () => void;
}

const profilingSteps = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Help us personalize your experience',
    icon: 'person' as const,
    optional: true,
  },
  {
    id: 'interests',
    title: 'Your Interests',
    description: 'What categories interest you most?',
    icon: 'heart' as const,
    optional: false,
  },
  {
    id: 'shopping-preferences',
    title: 'Shopping Preferences',
    description: 'How do you like to shop?',
    icon: 'cart' as const,
    optional: false,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'What updates would you like to receive?',
    icon: 'notifications' as const,
    optional: true,
  },
];

const interestOptions = [
  { id: 'technology', label: 'Technology', icon: 'laptop' as const },
  { id: 'food', label: 'Food & Dining', icon: 'restaurant' as const },
  { id: 'retail', label: 'Retail & Shopping', icon: 'storefront' as const },
  { id: 'healthcare', label: 'Healthcare', icon: 'medical' as const },
  { id: 'finance', label: 'Finance', icon: 'card' as const },
  { id: 'entertainment', label: 'Entertainment', icon: 'musical-notes' as const },
  { id: 'education', label: 'Education', icon: 'school' as const },
  { id: 'travel', label: 'Travel', icon: 'airplane' as const },
];

export default function ProgressiveProfiler({ 
  userProfile, 
  onUpdateProfile, 
  onComplete 
}: ProgressiveProfilerProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);
  const [showLater, setShowLater] = useState(false);

  useEffect(() => {
    // Find the first incomplete step
    const firstIncompleteStep = profilingSteps.findIndex(step => 
      !userProfile.completedSteps.includes(step.id)
    );
    
    if (firstIncompleteStep !== -1) {
      setCurrentStep(firstIncompleteStep);
    }
  }, [userProfile.completedSteps]);

  const handleNext = () => {
    const currentStepId = profilingSteps[currentStep].id;
    
    // Mark current step as completed
    const updatedProfile = {
      ...tempProfile,
      completedSteps: [...tempProfile.completedSteps, currentStepId]
    };
    
    setTempProfile(updatedProfile);
    
    if (currentStep < profilingSteps.length - 1) {
      // Animate transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // All steps completed
      onUpdateProfile(updatedProfile);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    if (currentStep < profilingSteps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      onComplete?.();
    }
  };

  const handleDoLater = () => {
    setShowLater(true);
    setTimeout(() => {
      onUpdateProfile(tempProfile);
      onComplete?.();
    }, 2000);
  };

  const handleInterestToggle = (interestId: string) => {
    setTempProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleShoppingPreferenceChange = (key: keyof UserProfile['shoppingPreferences'], value: any) => {
    setTempProfile(prev => ({
      ...prev,
      shoppingPreferences: {
        ...prev.shoppingPreferences,
        [key]: value
      }
    }));
  };

  const handleNotificationToggle = (key: keyof UserProfile['notificationSettings']) => {
    setTempProfile(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: !prev.notificationSettings[key]
      }
    }));
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {profilingSteps.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            {
              backgroundColor: index <= currentStep ? Colors.primary[600] : Colors.gray[200],
            }
          ]}>
            {userProfile.completedSteps.includes(step.id) || index < currentStep ? (
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            ) : (
              <Text style={[
                styles.stepNumber,
                { color: index <= currentStep ? Colors.white : Colors.gray[500] }
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            { color: index <= currentStep ? Colors.primary[600] : Colors.gray[500] }
          ]}>
            {step.title}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Ionicons name={profilingSteps[currentStep].icon} size={48} color={Colors.primary[600]} />
        <Text style={styles.stepTitle}>{profilingSteps[currentStep].title}</Text>
        <Text style={styles.stepDescription}>{profilingSteps[currentStep].description}</Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name (Optional)</Text>
          <TouchableOpacity style={styles.input}>
            <Text style={styles.inputText}>
              {tempProfile.name || 'Enter your name'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email (Optional)</Text>
          <TouchableOpacity style={styles.input}>
            <Text style={styles.inputText}>
              {tempProfile.email || 'Enter your email'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location (Optional)</Text>
          <TouchableOpacity style={styles.input}>
            <Text style={styles.inputText}>
              {tempProfile.location || 'Enter your location'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );

  const renderInterests = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Ionicons name={profilingSteps[currentStep].icon} size={48} color={Colors.primary[600]} />
        <Text style={styles.stepTitle}>{profilingSteps[currentStep].title}</Text>
        <Text style={styles.stepDescription}>{profilingSteps[currentStep].description}</Text>
      </View>

      <View style={styles.interestsGrid}>
        {interestOptions.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestCard,
              {
                backgroundColor: tempProfile.interests.includes(interest.id)
                  ? Colors.primary[50]
                  : Colors.white,
                borderColor: tempProfile.interests.includes(interest.id)
                  ? Colors.primary[600]
                  : Colors.gray[200],
              }
            ]}
            onPress={() => handleInterestToggle(interest.id)}
          >
            <Ionicons 
              name={interest.icon} 
              size={24} 
              color={tempProfile.interests.includes(interest.id) 
                ? Colors.primary[600] 
                : Colors.gray[400] 
              } 
            />
            <Text style={[
              styles.interestLabel,
              { color: tempProfile.interests.includes(interest.id) 
                ? Colors.primary[700] 
                : Colors.gray[700] 
              }
            ]}>
              {interest.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderShoppingPreferences = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Ionicons name={profilingSteps[currentStep].icon} size={48} color={Colors.primary[600]} />
        <Text style={styles.stepTitle}>{profilingSteps[currentStep].title}</Text>
        <Text style={styles.stepDescription}>{profilingSteps[currentStep].description}</Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceLabel}>Budget Range</Text>
          <View style={styles.preferenceOptions}>
            {[
              { value: 'low', label: 'Budget-friendly' },
              { value: 'medium', label: 'Mid-range' },
              { value: 'high', label: 'Premium' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.preferenceOption,
                  {
                    backgroundColor: tempProfile.shoppingPreferences.budget === option.value
                      ? Colors.primary[600]
                      : Colors.gray[100],
                  }
                ]}
                onPress={() => handleShoppingPreferenceChange('budget', option.value)}
              >
                <Text style={[
                  styles.preferenceOptionText,
                  { color: tempProfile.shoppingPreferences.budget === option.value
                    ? Colors.white
                    : Colors.gray[700]
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceLabel}>Business Preference</Text>
          <View style={styles.preferenceOptions}>
            {[
              { value: 'local', label: 'Local Businesses' },
              { value: 'national', label: 'National Chains' },
              { value: 'international', label: 'International Brands' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.preferenceOption,
                  {
                    backgroundColor: tempProfile.shoppingPreferences.localPreference === option.value
                      ? Colors.primary[600]
                      : Colors.gray[100],
                  }
                ]}
                onPress={() => handleShoppingPreferenceChange('localPreference', option.value)}
              >
                <Text style={[
                  styles.preferenceOptionText,
                  { color: tempProfile.shoppingPreferences.localPreference === option.value
                    ? Colors.white
                    : Colors.gray[700]
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceLabel}>Sustainability Importance</Text>
          <View style={styles.preferenceOptions}>
            {[
              { value: 'not-important', label: 'Not Important' },
              { value: 'somewhat-important', label: 'Somewhat Important' },
              { value: 'very-important', label: 'Very Important' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.preferenceOption,
                  {
                    backgroundColor: tempProfile.shoppingPreferences.sustainability === option.value
                      ? Colors.primary[600]
                      : Colors.gray[100],
                  }
                ]}
                onPress={() => handleShoppingPreferenceChange('sustainability', option.value)}
              >
                <Text style={[
                  styles.preferenceOptionText,
                  { color: tempProfile.shoppingPreferences.sustainability === option.value
                    ? Colors.white
                    : Colors.gray[700]
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderNotifications = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Ionicons name={profilingSteps[currentStep].icon} size={48} color={Colors.primary[600]} />
        <Text style={styles.stepTitle}>{profilingSteps[currentStep].title}</Text>
        <Text style={styles.stepDescription}>{profilingSteps[currentStep].description}</Text>
      </View>

      <Card style={styles.formCard}>
        {[
          { 
            key: 'newBusinesses' as const, 
            title: 'New Businesses', 
            description: 'Get notified about new businesses in your area',
            icon: 'storefront' as const 
          },
          { 
            key: 'alignmentMatches' as const, 
            title: 'Alignment Matches', 
            description: 'Find businesses that match your political values',
            icon: 'checkmark-circle' as const 
          },
          { 
            key: 'promotions' as const, 
            title: 'Promotions & Deals', 
            description: 'Receive special offers from aligned businesses',
            icon: 'pricetag' as const 
          },
        ].map((notification) => (
          <TouchableOpacity
            key={notification.key}
            style={styles.notificationItem}
            onPress={() => handleNotificationToggle(notification.key)}
          >
            <View style={styles.notificationContent}>
              <Ionicons name={notification.icon} size={24} color={Colors.gray[600]} />
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationDescription}>{notification.description}</Text>
              </View>
            </View>
            <View style={[
              styles.toggle,
              {
                backgroundColor: tempProfile.notificationSettings[notification.key]
                  ? Colors.primary[600]
                  : Colors.gray[300],
              }
            ]}>
              <View style={[
                styles.toggleCircle,
                {
                  transform: [{
                    translateX: tempProfile.notificationSettings[notification.key] ? 20 : 0,
                  }],
                }
              ]} />
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </Animated.View>
  );

  const renderCompletionScreen = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <View style={styles.completionContainer}>
        <Ionicons name="checkmark-circle" size={80} color={Colors.success[500]} />
        <Text style={styles.completionTitle}>Profile Complete!</Text>
        <Text style={styles.completionDescription}>
          Thanks for setting up your profile. We'll use this information to provide you with personalized business recommendations.
        </Text>
        
        <View style={styles.completedSteps}>
          <Text style={styles.completedStepsTitle}>You've completed:</Text>
          <View style={styles.completedStepsList}>
            {profilingSteps.map((step) => (
              <View key={step.id} style={styles.completedStep}>
                <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                <Text style={styles.completedStepText}>{step.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );

  if (showLater) {
    return (
      <View style={styles.container}>
        <View style={styles.laterContainer}>
          <Ionicons name="time" size={64} color={Colors.primary[600]} />
          <Text style={styles.laterTitle}>We'll Ask Later</Text>
          <Text style={styles.laterDescription}>
            No problem! We'll ask you to complete your profile next time you open the app.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience by telling us more about yourself
          </Text>
        </View>

        {/* Step Indicator */}
        {currentStep < profilingSteps.length && renderStepIndicator()}

        {/* Step Content */}
        <View style={styles.content}>
          {currentStep === 0 && renderBasicInfo()}
          {currentStep === 1 && renderInterests()}
          {currentStep === 2 && renderShoppingPreferences()}
          {currentStep === 3 && renderNotifications()}
          {currentStep >= profilingSteps.length && renderCompletionScreen()}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {currentStep < profilingSteps.length && (
            <>
              {profilingSteps[currentStep].optional && (
                <Button
                  variant="ghost"
                  size="lg"
                  onPress={handleDoLater}
                  style={styles.skipButton}
                >
                  Do This Later
                </Button>
              )}
              
              <View style={styles.primaryActions}>
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onPress={handleSkip}
                    style={styles.backButton}
                  >
                    Skip
                  </Button>
                )}
                
                <Button
                  variant="primary"
                  size="lg"
                  onPress={handleNext}
                  style={styles.nextButton}
                >
                  {currentStep === profilingSteps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </View>
            </>
          )}
          
          {currentStep >= profilingSteps.length && (
            <Button
              variant="primary"
              size="lg"
              onPress={onComplete}
              style={styles.completeButton}
            >
              Get Started
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing[6],
    alignItems: 'center',
  },
  title: {
    ...StyleMixins.heading2,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  subtitle: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.snug * Typography.fontSize.base,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    ...StyleMixins.flexCenter,
    marginBottom: Spacing[1],
  },
  stepNumber: {
    ...StyleMixins.caption,
    fontWeight: '600' as const,
  },
  stepLabel: {
    ...StyleMixins.caption,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  content: {
    paddingHorizontal: Spacing[6],
  },
  stepContent: {
    marginBottom: Spacing[6],
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  stepTitle: {
    ...StyleMixins.heading3,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  stepDescription: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.snug * Typography.fontSize.base,
  },
  formCard: {
    padding: Spacing[6],
    marginBottom: Spacing[4],
  },
  inputGroup: {
    marginBottom: Spacing[5],
  },
  inputLabel: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
    color: Colors.gray[700],
    marginBottom: Spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    padding: Spacing[3],
    backgroundColor: Colors.white,
  },
  inputText: {
    ...StyleMixins.body,
    color: Colors.gray[900],
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  interestCard: {
    width: '48%',
    borderWidth: 2,
    borderRadius: 12,
    padding: Spacing[4],
    alignItems: 'center',
    marginBottom: Spacing[3],
    ...Shadows.subtle,
  },
  interestLabel: {
    ...StyleMixins.bodySmall,
    fontWeight: '500' as const,
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  preferenceGroup: {
    marginBottom: Spacing[6],
  },
  preferenceLabel: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
  },
  preferenceOptions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  preferenceOption: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: 8,
    alignItems: 'center',
  },
  preferenceOptionText: {
    ...StyleMixins.bodySmall,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: Spacing[3],
    flex: 1,
  },
  notificationTitle: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[1],
  },
  notificationDescription: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  completionContainer: {
    alignItems: 'center',
    padding: Spacing[6],
  },
  completionTitle: {
    ...StyleMixins.heading2,
    textAlign: 'center',
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  completionDescription: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.snug * Typography.fontSize.base,
    marginBottom: Spacing[6],
  },
  completedSteps: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing[6],
    ...Shadows.subtle,
  },
  completedStepsTitle: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
  },
  completedStepsList: {
    gap: Spacing[2],
  },
  completedStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  completedStepText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
  },
  actions: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    gap: Spacing[3],
  },
  skipButton: {
    alignSelf: 'center',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  completeButton: {
    width: '100%',
  },
  laterContainer: {
    flex: 1,
    ...StyleMixins.flexCenter,
    padding: Spacing[8],
  },
  laterTitle: {
    ...StyleMixins.heading2,
    textAlign: 'center',
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  laterDescription: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.snug * Typography.fontSize.base,
  },
});