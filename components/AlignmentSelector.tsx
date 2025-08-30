import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import BusinessCard from './BusinessCard';
import { fetchBusinesses } from '../utils/api';

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  address?: string;
  website?: string;
  imageUrl?: string;
  alignment: {
    liberal: number;
    conservative: number;
    libertarian: number;
    green: number;
    centrist: number;
  };
}

interface AlignmentSelectorProps {
  selectedAlignment: string[];
  setSelectedAlignment: (alignment: string[]) => void;
  customAlignment: UserAlignment;
  setCustomAlignment: (alignment: UserAlignment) => void;
}

const alignmentOptions = [
  { 
    id: 'liberal', 
    label: 'Liberal', 
    color: Colors.primary[500], 
    icon: 'people' as const,
    description: 'Progressive values, social equality, and government programs'
  },
  { 
    id: 'conservative', 
    label: 'Conservative', 
    color: Colors.error[500], 
    icon: 'flag' as const,
    description: 'Traditional values, limited government, and free markets'
  },
  { 
    id: 'libertarian', 
    label: 'Libertarian', 
    color: Colors.accent[500], 
    icon: 'walk' as const,
    description: 'Individual liberty, minimal government intervention'
  },
  { 
    id: 'green', 
    label: 'Green', 
    color: Colors.secondary[500], 
    icon: 'leaf' as const,
    description: 'Environmental protection, sustainability, climate action'
  },
  { 
    id: 'centrist', 
    label: 'Centrist', 
    color: Colors.gray[500], 
    icon: 'git-branch' as const,
    description: 'Moderate approach, balance between left and right'
  },
];

const quizQuestions = [
  {
    id: 1,
    question: "How important is environmental protection to you?",
    options: [
      { text: "Extremely important", alignment: { green: 100, liberal: 50 } },
      { text: "Somewhat important", alignment: { green: 60, centrist: 50 } },
      { text: "Not very important", alignment: { conservative: 50, libertarian: 30 } },
    ]
  },
  {
    id: 2,
    question: "What's your view on government regulation?",
    options: [
      { text: "More regulation needed", alignment: { liberal: 80, green: 60 } },
      { text: "Balance is key", alignment: { centrist: 80 } },
      { text: "Less regulation better", alignment: { conservative: 80, libertarian: 90 } },
    ]
  },
  {
    id: 3,
    question: "How do you view social programs?",
    options: [
      { text: "Essential for society", alignment: { liberal: 90, green: 70 } },
      { text: "Helpful but needs reform", alignment: { centrist: 70 } },
      { text: "Private sector is better", alignment: { conservative: 80, libertarian: 90 } },
    ]
  }
];

export default function AlignmentSelector({ 
  selectedAlignment, 
  setSelectedAlignment, 
  customAlignment, 
  setCustomAlignment 
}: AlignmentSelectorProps) {
  const [mode, setMode] = useState<'quick' | 'quiz' | 'custom'>('quick');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [previewBusinesses, setPreviewBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    updateBusinessPreview();
  }, [selectedAlignment, customAlignment]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetchBusinesses();
      if (response.success && response.data) {
        const businessesData = Array.isArray(response.data) ? response.data : response.data.businesses || [];
        setBusinesses(businessesData);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessPreview = () => {
    if (businesses.length === 0) return;

    let currentAlignment: UserAlignment;
    
    if (selectedAlignment.length > 0) {
      currentAlignment = {
        liberal: selectedAlignment.includes('liberal') ? 100 : 0,
        conservative: selectedAlignment.includes('conservative') ? 100 : 0,
        libertarian: selectedAlignment.includes('libertarian') ? 100 : 0,
        green: selectedAlignment.includes('green') ? 100 : 0,
        centrist: selectedAlignment.includes('centrist') ? 100 : 0,
      };
    } else if (quizAnswers.length > 0) {
      // Calculate alignment from quiz answers
      currentAlignment = {
        liberal: 0,
        conservative: 0,
        libertarian: 0,
        green: 0,
        centrist: 0,
      };
      
      quizAnswers.forEach((answerIndex, questionIndex) => {
        const question = quizQuestions[questionIndex];
        const selectedOption = question.options[answerIndex];
        Object.entries(selectedOption.alignment).forEach(([key, value]) => {
          currentAlignment[key as keyof UserAlignment] += value;
        });
      });
      
      // Normalize to 100
      const total = Object.values(currentAlignment).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        Object.keys(currentAlignment).forEach(key => {
          currentAlignment[key as keyof typeof currentAlignment] = Math.round((currentAlignment[key as keyof typeof currentAlignment] / total) * 100);
        });
      }
    } else {
      currentAlignment = customAlignment;
    }

    // Find best matching businesses
    const businessesWithScores = businesses.map(business => {
      let score = 0;
      let totalWeight = 0;

      Object.keys(currentAlignment).forEach(key => {
        const businessValue = business.alignment[key as keyof typeof business.alignment];
        const userValue = currentAlignment[key as keyof typeof currentAlignment];
        
        if (businessValue !== undefined && userValue > 0) {
          score += businessValue * userValue;
          totalWeight += userValue;
        }
      });

      return {
        ...business,
        matchScore: totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0
      };
    });

    // Sort by match score and take top 3
    const topMatches = businessesWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    setPreviewBusinesses(topMatches);
  };

  const handleAlignmentSelect = (alignmentId: string) => {
    if (selectedAlignment.includes(alignmentId)) {
      setSelectedAlignment(selectedAlignment.filter(id => id !== alignmentId));
    } else {
      setSelectedAlignment([...selectedAlignment, alignmentId]);
    }
  };

  const handleCustomAlignmentChange = (alignment: keyof UserAlignment, value: number) => {
    setCustomAlignment({
      ...customAlignment,
      [alignment]: value,
    });
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers, answerIndex];
    setQuizAnswers(newAnswers);
    
    if (currentQuestion < quizQuestions.length - 1) {
      // Animate transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestion(currentQuestion + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setQuizAnswers([]);
  };

  const renderQuickSelect = () => (
    <View style={styles.quickSelectContainer}>
      <Text style={styles.sectionTitle}>Quick Select</Text>
      <Text style={styles.subtitle}>
        Choose the political values that resonate most with you.
      </Text>
      <View style={styles.alignmentOptions}>
        {alignmentOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.alignmentOption,
              { 
                backgroundColor: selectedAlignment.includes(option.id) 
                  ? option.color 
                  : Colors.gray[100],
                borderColor: selectedAlignment.includes(option.id) 
                  ? option.color 
                  : Colors.gray[300],
              }
            ]}
            onPress={() => handleAlignmentSelect(option.id)}
          >
            <Ionicons 
              name={option.icon} 
              size={32} 
              color={selectedAlignment.includes(option.id) ? Colors.white : option.color} 
            />
            <Text style={[
              styles.alignmentOptionText,
              { color: selectedAlignment.includes(option.id) ? Colors.white : Colors.gray[900] }
            ]}>
              {option.label}
            </Text>
            <Text style={[
              styles.alignmentOptionDesc,
              { color: selectedAlignment.includes(option.id) ? Colors.white + 'CC' : Colors.gray[600] }
            ]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderQuiz = () => (
    <View style={styles.quizContainer}>
      <Text style={styles.sectionTitle}>Political Values Quiz</Text>
      <Text style={styles.subtitle}>
        Answer a few questions to discover your political alignment.
      </Text>
      
      {quizAnswers.length === quizQuestions.length ? (
        <View style={styles.quizComplete}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success[500]} />
          <Text style={styles.quizCompleteTitle}>Quiz Complete!</Text>
          <Text style={styles.quizCompleteText}>
            Your political alignment has been calculated based on your answers.
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetQuiz}>
            <Text style={styles.resetButtonText}>Retake Quiz</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
          <Text style={styles.questionNumber}>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </Text>
          <Text style={styles.questionText}>
            {quizQuestions[currentQuestion].question}
          </Text>
          <View style={styles.optionsContainer}>
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleQuizAnswer(index)}
              >
                <Text style={styles.optionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );

  const renderCustom = () => (
    <View style={styles.customContainer}>
      <Text style={styles.sectionTitle}>Fine-tune Your Alignment</Text>
      <Text style={styles.subtitle}>
        Adjust the sliders to precisely set your political values.
      </Text>
      
      {alignmentOptions.map((option) => (
        <View key={option.id} style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderLabelContainer}>
              <Ionicons name={option.icon} size={20} color={option.color} />
              <Text style={styles.sliderLabel}>{option.label}</Text>
            </View>
            <Text style={styles.sliderValue}>
              {Math.round(customAlignment[option.id as keyof typeof customAlignment])}%
            </Text>
          </View>
          <View style={styles.sliderTrack}>
            <View 
              style={[
                styles.sliderProgress,
                { 
                  width: `${customAlignment[option.id as keyof typeof customAlignment]}%`,
                  backgroundColor: option.color 
                }
              ]} 
            />
          </View>
          <TouchableOpacity
            style={styles.sliderButton}
            onPressIn={() => {
              const increment = 10;
              const newValue = Math.min(100, customAlignment[option.id as keyof typeof customAlignment] + increment);
              handleCustomAlignmentChange(option.id as keyof typeof customAlignment, newValue);
            }}
          >
            <Ionicons name="add" size={16} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sliderButton, styles.sliderButtonMinus]}
            onPressIn={() => {
              const decrement = 10;
              const newValue = Math.max(0, customAlignment[option.id as keyof typeof customAlignment] - decrement);
              handleCustomAlignmentChange(option.id as keyof typeof customAlignment, newValue);
            }}
          >
            <Ionicons name="remove" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderBusinessPreview = () => (
    <View style={styles.previewContainer}>
      <Text style={styles.sectionTitle}>Your Business Matches</Text>
      <Text style={styles.subtitle}>
        Here are businesses that align with your political values:
      </Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="reload" size={24} color={Colors.gray[400]} />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      ) : previewBusinesses.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.previewScroll}>
            {previewBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                userAlignment={
                  selectedAlignment.length > 0 
                    ? {
                        liberal: selectedAlignment.includes('liberal') ? 100 : 0,
                        conservative: selectedAlignment.includes('conservative') ? 100 : 0,
                        libertarian: selectedAlignment.includes('libertarian') ? 100 : 0,
                        green: selectedAlignment.includes('green') ? 100 : 0,
                        centrist: selectedAlignment.includes('centrist') ? 100 : 0,
                      }
                    : quizAnswers.length > 0
                    ? (() => {
                        const alignment = {
                          liberal: 0,
                          conservative: 0,
                          libertarian: 0,
                          green: 0,
                          centrist: 0,
                        };
                        
                        quizAnswers.forEach((answerIndex, questionIndex) => {
                          const question = quizQuestions[questionIndex];
                          const selectedOption = question.options[answerIndex];
                          Object.entries(selectedOption.alignment).forEach(([key, value]) => {
                            alignment[key as keyof typeof alignment] += value;
                          });
                        });
                        
                        // Normalize to 100
                        const total = Object.values(alignment).reduce((sum, val) => sum + val, 0);
                        if (total > 0) {
                          Object.keys(alignment).forEach(key => {
                            alignment[key as keyof typeof alignment] = Math.round((alignment[key as keyof typeof alignment] / total) * 100);
                          });
                        }
                        
                        return alignment;
                      })()
                    : customAlignment
                }
                onPress={() => {}}
                variant="compact"
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyPreview}>
          <Ionicons name="search" size={48} color={Colors.gray[300]} />
          <Text style={styles.emptyPreviewText}>
            Set your political alignment to see business matches
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'quick' && styles.modeButtonActive
          ]}
          onPress={() => setMode('quick')}
        >
          <Text style={[
            styles.modeButtonText,
            mode === 'quick' && styles.modeButtonTextActive
          ]}>Quick</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'quiz' && styles.modeButtonActive
          ]}
          onPress={() => {
            setMode('quiz');
            resetQuiz();
          }}
        >
          <Text style={[
            styles.modeButtonText,
            mode === 'quiz' && styles.modeButtonTextActive
          ]}>Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'custom' && styles.modeButtonActive
          ]}
          onPress={() => setMode('custom')}
        >
          <Text style={[
            styles.modeButtonText,
            mode === 'custom' && styles.modeButtonTextActive
          ]}>Custom</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'quick' && renderQuickSelect()}
        {mode === 'quiz' && renderQuiz()}
        {mode === 'custom' && renderCustom()}
        
        {/* Business Preview - shown in all modes */}
        {renderBusinessPreview()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing[6],
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.white,
    ...Shadows.subtle,
  },
  modeButtonText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    fontWeight: '500' as const,
  },
  modeButtonTextActive: {
    color: Colors.primary[600],
  },
  content: {
    flex: 1,
  },
  subtitle: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: Typography.lineHeight.snug * Typography.fontSize.base,
  },
  quickSelectContainer: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    ...StyleMixins.heading4,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  alignmentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  alignmentOption: {
    width: '48%',
    borderRadius: 12,
    padding: Spacing[4],
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  alignmentOptionText: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  alignmentOptionDesc: {
    ...StyleMixins.caption,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.xs,
  },
  quizContainer: {
    marginBottom: Spacing[6],
  },
  questionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing[6],
    ...Shadows.subtle,
  },
  questionNumber: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  questionText: {
    ...StyleMixins.heading4,
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.xl,
  },
  optionsContainer: {
    gap: Spacing[3],
  },
  optionButton: {
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    padding: Spacing[4],
    alignItems: 'center',
  },
  optionText: {
    ...StyleMixins.body,
    color: Colors.primary[700],
    textAlign: 'center',
  },
  quizComplete: {
    alignItems: 'center',
    padding: Spacing[6],
  },
  quizCompleteTitle: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  quizCompleteText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  resetButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: 8,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
  },
  resetButtonText: {
    ...StyleMixins.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  customContainer: {
    marginBottom: Spacing[6],
  },
  sliderContainer: {
    marginBottom: Spacing[6],
    position: 'relative' as const,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sliderLabelContainer: {
    ...StyleMixins.flexStart,
    gap: Spacing[2],
  },
  sliderLabel: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
    color: Colors.gray[900],
  },
  sliderValue: {
    ...StyleMixins.bodySmall,
    fontWeight: '600' as const,
    color: Colors.gray[700],
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    position: 'relative' as const,
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 4,
  },
  sliderButton: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary[600],
    ...StyleMixins.flexCenter,
  },
  sliderButtonMinus: {
    right: 'auto',
    left: -6,
  },
  previewContainer: {
    marginTop: Spacing[6],
  },
  loadingContainer: {
    ...StyleMixins.flexCenter,
    padding: Spacing[8],
  },
  loadingText: {
    ...StyleMixins.body,
    color: Colors.gray[500],
    marginTop: Spacing[2],
  },
  previewScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[2],
    gap: Spacing[3],
  },
  emptyPreview: {
    ...StyleMixins.flexCenter,
    padding: Spacing[8],
  },
  emptyPreviewText: {
    ...StyleMixins.body,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing[2],
  },
});