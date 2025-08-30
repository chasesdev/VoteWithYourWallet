import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

interface AlignmentSelectorProps {
  selectedAlignment: string[];
  setSelectedAlignment: (alignment: string[]) => void;
  customAlignment: UserAlignment;
  setCustomAlignment: (alignment: UserAlignment) => void;
}

const alignmentOptions = [
  { id: 'liberal', label: 'Liberal', color: '#3498db', icon: 'people' as const },
  { id: 'conservative', label: 'Conservative', color: '#e74c3c', icon: 'flag' as const },
  { id: 'libertarian', label: 'Libertarian', color: '#f39c12', icon: 'walk' as const },
  { id: 'green', label: 'Green', color: '#2ecc71', icon: 'leaf' as const },
  { id: 'centrist', label: 'Centrist', color: '#95a5a6', icon: 'git-branch' as const },
];

export default function AlignmentSelector({ 
  selectedAlignment, 
  setSelectedAlignment, 
  customAlignment, 
  setCustomAlignment 
}: AlignmentSelectorProps) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Political Alignment</Text>
      <Text style={styles.subtitle}>
        Select the political values that matter most to you, or customize your alignment.
      </Text>

      <View style={styles.quickSelectContainer}>
        <Text style={styles.sectionTitle}>Quick Select</Text>
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

      <View style={styles.customContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  quickSelectContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
  customContainer: {
    marginBottom: 20,
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
});