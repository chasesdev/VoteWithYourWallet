import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { StyleMixins, CommonStyles } from '../../utils/styles';
import { Colors, Shadows } from '../../constants/design';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
}

export default function Card({
  children,
  onPress,
  hover = false,
  variant = 'default',
  style,
}: CardProps) {
  const getCardStyle = () => {
    let baseStyle: ViewStyle = {
      ...CommonStyles.card,
      backgroundColor: Colors.white,
    };
    
    // Apply variant styles
    switch (variant) {
      case 'elevated':
        baseStyle = {
          ...baseStyle,
          ...Shadows.medium,
        };
        break;
      case 'outlined':
        baseStyle = {
          ...baseStyle,
          borderWidth: 1,
          borderColor: Colors.gray[200],
          ...{}, // Remove shadow for outlined variant
        };
        break;
      default:
        baseStyle = {
          ...baseStyle,
          ...Shadows.subtle,
        };
    }
    
    // Apply hover effects
    if (hover && onPress) {
      baseStyle = {
        ...baseStyle,
        ...Shadows.medium,
        transform: [{ translateY: -2 }],
      };
    }
    
    return [baseStyle, style];
  };
  
  if (onPress) {
    return (
      <TouchableOpacity 
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={getCardStyle()}>
      {children}
    </View>
  );
}