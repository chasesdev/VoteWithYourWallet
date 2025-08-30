import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { ButtonStyles } from '../../utils/styles';
import { Colors } from '../../constants/design';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = ButtonStyles[variant];
    const disabledStyle = disabled ? { opacity: 0.6 } : {};
    const sizeStyle = getSizeStyle();
    
    return [baseStyle, sizeStyle, disabledStyle, style];
  };
  
  const getTextStyle = () => {
    const baseTextStyle = ButtonStyles[`${variant}Text` as keyof typeof ButtonStyles];
    const sizeTextStyle = getSizeTextStyle();
    
    return [baseTextStyle, sizeTextStyle, textStyle];
  };
  
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          minHeight: 32,
        };
      case 'lg':
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          minHeight: 48,
        };
      default: // md
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 40,
        };
    }
  };
  
  const getSizeTextStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 14 };
      case 'lg':
        return { fontSize: 18 };
      default: // md
        return { fontSize: 16 };
    }
  };
  
  const getLoadingColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return Colors.white;
      default:
        return Colors.gray[600];
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getLoadingColor()} 
        />
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}