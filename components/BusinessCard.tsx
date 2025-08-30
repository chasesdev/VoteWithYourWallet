import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  address?: string;
  imageUrl?: string;
  alignment?: {
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

interface BusinessCardProps {
  business: Business;
  userAlignment?: UserAlignment;
  onPress: () => void;
}

export default function BusinessCard({ business, userAlignment, onPress }: BusinessCardProps) {
  const getAlignmentPercentage = () => {
    if (!userAlignment || !business.alignment) return 0;
    
    let score = 0;
    let totalWeight = 0;

    Object.keys(userAlignment).forEach(key => {
      if (business.alignment && business.alignment[key as keyof typeof business.alignment] !== undefined && userAlignment[key as keyof typeof userAlignment] > 0) {
        score += business.alignment[key as keyof typeof business.alignment] * userAlignment[key as keyof typeof userAlignment];
        totalWeight += userAlignment[key as keyof typeof userAlignment];
      }
    });

    return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
  };

  const getAlignmentColor = (percentage: number) => {
    if (percentage >= 75) return '#2ecc71'; // Green - high alignment
    if (percentage >= 50) return '#f1c40f'; // Yellow - medium alignment
    if (percentage >= 25) return '#e67e22'; // Orange - low alignment
    return '#e74c3c'; // Red - very low alignment
  };

  const alignmentPercentage = getAlignmentPercentage();
  const alignmentColor = getAlignmentColor(alignmentPercentage);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image 
        source={{ uri: business.imageUrl || 'https://via.placeholder.com/100' }} 
        style={styles.image} 
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{business.name}</Text>
          {userAlignment && business.alignment && (
            <View style={[styles.alignmentBadge, { backgroundColor: alignmentColor }]}>
              <Text style={styles.alignmentText}>{alignmentPercentage}%</Text>
            </View>
          )}
        </View>
        <Text style={styles.category}>{business.category}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {business.description}
        </Text>
        {business.address && (
          <View style={styles.footer}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.address}>{business.address}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  alignmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alignmentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
});