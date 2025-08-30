import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { setUserAlignment } from '../utils/api';

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

const alignmentOptions = [
  { id: 'liberal', label: 'Liberal', color: '#3498db', icon: 'people' as const },
  { id: 'conservative', label: 'Conservative', color: '#e74c3c', icon: 'flag' as const },
  { id: 'libertarian', label: 'Libertarian', color: '#f39c12', icon: 'walk' as const },
  { id: 'green', label: 'Green', color: '#2ecc71', icon: 'leaf' as const },
  { id: 'centrist', label: 'Centrist', color: '#95a5a6', icon: 'git-branch' as const },
];

export default function PoliticalAlignmentScreen() {
  const router = useRouter();
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

  useEffect(() => {
    // Load existing alignment from localStorage
    const loadAlignment = () => {
      try {
        const storedAlignment = localStorage.getItem('userAlignment');
        if (storedAlignment) {
          const alignment = JSON.parse(storedAlignment);
          setSelectedAlignment(
            Object.entries(alignment)
              .filter(([_, value]) => value === 100)
              .map(([key, _]) => key)
          );
          setCustomAlignment(alignment);
        }
      } catch (error) {
        console.error('Error loading alignment:', error);
      }
    };

    loadAlignment();
  }, []);

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

  const handleContinue = async () => {
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
        
        // Navigate back to home
        router.back();
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

  const handleReset = () => {
    setSelectedAlignment([]);
    setCustomAlignment({
      liberal: 0,
      conservative: 0,
      libertarian: 0,
      green: 0,
      centrist: 0,
    });
    setError(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Political Alignment</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.alignmentContainer}>
        <Text style={styles.sectionTitle}>Quick Select</Text>
        <Text style={styles.subtitle}>
          Select the political values that matter most to you.
        </Text>
        <View style={styles.alignmentOptions}>
          {alignmentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.alignmentOption,
                { backgroundColor: selectedAlignment.includes(option.id) ? option.color : '#f0f0f0' },
              ]}
              onPress={() => handleAlignmentSelect(option.id)}
            >
              <Ionicons name={option.icon} size={24} color={selectedAlignment.includes(option.id) ? 'white' : option.color} />
              <Text style={[
                styles.alignmentOptionText,
                { color: selectedAlignment.includes(option.id) ? 'white' : '#333' }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.alignmentContainer}>
        <Text style={styles.sectionTitle}>Custom Alignment</Text>
        <Text style={styles.subtitle}>
          Adjust the slider to reflect your position on each political spectrum.
        </Text>
        
        {alignmentOptions.map((option) => (
          <View key={option.id} style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>{option.label}</Text>
            <View style={styles.slider}>
              <input
                type="range"
                min="0"
                max="100"
                value={customAlignment[option.id as keyof typeof customAlignment]}
                onChange={(e) => handleCustomAlignmentChange(option.id as keyof typeof customAlignment, parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </View>
            <Text style={styles.sliderValue}>{Math.round(customAlignment[option.id as keyof typeof customAlignment])}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Reset"
          onPress={handleReset}
          color="#95a5a6"
          disabled={loading}
        />
        <Button
          title={loading ? "Saving..." : "Continue"}
          onPress={handleContinue}
          color="#f4511e"
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 15,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 10,
  },
  alignmentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
    color: '#666',
  },
  alignmentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  alignmentOption: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
  },
  alignmentOptionText: {
    marginTop: 5,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  slider: {
    marginBottom: 5,
  },
  sliderValue: {
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 10,
  },
});