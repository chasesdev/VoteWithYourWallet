import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { AlignmentStyles } from '../../utils/styles';
import { Colors, Typography, AlignmentColors } from '../../constants/design';

interface AlignmentBadgeProps {
  percentage: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  showLabel?: boolean;
  variant?: 'percentage' | 'match' | 'score';
}

export default function AlignmentBadge({
  percentage,
  label,
  size = 'md',
  style,
  showLabel = true,
  variant = 'percentage',
}: AlignmentBadgeProps) {
  const getBadgeStyle = (): ViewStyle => {
    const backgroundColor = AlignmentStyles.getAlignmentColor(percentage);
    const sizeStyles = getSizeStyles();
    
    return {
      backgroundColor,
      borderRadius: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
      ...sizeStyles,
      alignItems: 'center',
      justifyContent: 'center',
      ...(style as ViewStyle),
    };
  };
  
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          minWidth: 32,
          minHeight: 20,
        };
      case 'lg':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          minWidth: 60,
          minHeight: 32,
        };
      default: // md
        return {
          paddingHorizontal: 10,
          paddingVertical: 4,
          minWidth: 44,
          minHeight: 24,
        };
    }
  };
  
  const getTextStyle = (): TextStyle => {
    const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;
    
    return {
      color: Colors.white,
      fontSize,
      fontWeight: Typography.fontWeight.bold,
      fontFamily: Typography.fontFamily.primary,
      textAlign: 'center',
    };
  };
  
  const getDisplayText = () => {
    switch (variant) {
      case 'match':
        if (percentage >= 80) return 'Perfect';
        if (percentage >= 60) return 'Great';
        if (percentage >= 40) return 'Good';
        if (percentage >= 20) return 'Fair';
        return 'Poor';
      case 'score':
        return `${Math.round(percentage)}/100`;
      default: // percentage
        return `${Math.round(percentage)}%`;
    }
  };
  
  const getMatchDescription = () => {
    if (percentage >= 80) return 'Perfect Match';
    if (percentage >= 60) return 'Great Match';
    if (percentage >= 40) return 'Good Match';
    if (percentage >= 20) return 'Fair Match';
    return 'Poor Match';
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={getBadgeStyle()}>
        <Text style={getTextStyle()}>
          {getDisplayText()}
        </Text>
      </View>
      
      {showLabel && label && (
        <Text style={{
          fontSize: 10,
          color: Colors.gray[600],
          marginTop: 2,
          textAlign: 'center',
          fontFamily: Typography.fontFamily.primary,
        }}>
          {label}
        </Text>
      )}
      
      {showLabel && !label && variant === 'percentage' && (
        <Text style={{
          fontSize: 10,
          color: Colors.gray[600],
          marginTop: 2,
          textAlign: 'center',
          fontFamily: Typography.fontFamily.primary,
        }}>
          {getMatchDescription()}
        </Text>
      )}
    </View>
  );
}

// Political alignment spectrum component
interface AlignmentSpectrumProps {
  alignments: {
    liberal: number;
    conservative: number;
    libertarian: number;
    green: number;
    centrist: number;
  };
  userAlignments?: {
    liberal: number;
    conservative: number;
    libertarian: number;
    green: number;
    centrist: number;
  };
  style?: ViewStyle;
  compact?: boolean;
}

export function AlignmentSpectrum({
  alignments,
  userAlignments,
  style,
  compact = false,
}: AlignmentSpectrumProps) {
  const alignmentLabels = {
    liberal: 'Liberal',
    conservative: 'Conservative',
    libertarian: 'Libertarian',
    green: 'Green',
    centrist: 'Centrist',
  };
  
  const alignmentIcons = {
    liberal: '🏛️',
    conservative: '🇺🇸',
    libertarian: '🗽',
    green: '🌱',
    centrist: '⚖️',
  };
  
  return (
    <View style={[{ gap: compact ? 4 : 8 }, style]}>
      {Object.entries(alignments).map(([key, value]) => {
        const alignmentKey = key as keyof typeof alignments;
        const userValue = userAlignments?.[alignmentKey] || 0;
        const matchPercentage = userValue > 0 ? Math.min(100, (value / 10) * (userValue / 100) * 100) : value * 10;
        
        return (
          <View 
            key={key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 14, marginRight: 8 }}>
                {alignmentIcons[alignmentKey]}
              </Text>
              <Text style={{
                fontSize: compact ? 12 : 14,
                fontFamily: Typography.fontFamily.primary,
                color: Colors.gray[700],
                flex: 1,
              }}>
                {alignmentLabels[alignmentKey]}
              </Text>
            </View>
            
            <AlignmentBadge
              percentage={matchPercentage}
              size={compact ? 'sm' : 'md'}
              showLabel={false}
              variant="percentage"
            />
          </View>
        );
      })}
    </View>
  );
}