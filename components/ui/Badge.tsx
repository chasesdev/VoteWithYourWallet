import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { BadgeStyles } from '../../utils/styles';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  variant = 'primary',
  size = 'md',
  children,
  style,
  textStyle,
}: BadgeProps) {
  const getBadgeStyle = () => {
    const baseStyle = BadgeStyles[variant];
    const sizeStyle = getSizeStyle();
    
    return [baseStyle, sizeStyle, style];
  };
  
  const getTextStyle = () => {
    const baseTextStyle = BadgeStyles[`${variant}Text` as keyof typeof BadgeStyles];
    const sizeTextStyle = getSizeTextStyle();
    
    return [baseTextStyle, sizeTextStyle, textStyle];
  };
  
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
        };
      case 'lg':
        return {
          paddingHorizontal: 16,
          paddingVertical: 6,
        };
      default: // md
        return {
          paddingHorizontal: 12,
          paddingVertical: 4,
        };
    }
  };
  
  const getSizeTextStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 10 };
      case 'lg':
        return { fontSize: 14 };
      default: // md
        return { fontSize: 12 };
    }
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{children}</Text>
    </View>
  );
}