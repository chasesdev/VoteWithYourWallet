import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import Card from './ui/Card';
import Badge from './ui/Badge';
import AlignmentBadge, { AlignmentSpectrum } from './ui/AlignmentBadge';

interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  address?: string;
  website?: string;
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
  variant?: 'default' | 'compact' | 'featured';
}

export default function BusinessCard({ 
  business, 
  userAlignment, 
  onPress, 
  variant = 'default' 
}: BusinessCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getAlignmentPercentage = () => {
    if (!userAlignment || !business.alignment) return 0;
    
    let score = 0;
    let totalWeight = 0;

    Object.keys(userAlignment).forEach(key => {
      const businessValue = business.alignment?.[key as keyof typeof business.alignment];
      const userValue = userAlignment[key as keyof typeof userAlignment];
      
      if (businessValue !== undefined && userValue > 0) {
        score += businessValue * userValue;
        totalWeight += userValue;
      }
    });

    return totalWeight > 0 ? Math.round((score / totalWeight) * 10) : 0;
  };
  
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      'Retail': 'storefront',
      'Food': 'restaurant',
      'Technology': 'laptop',
      'Healthcare': 'medical',
      'Finance': 'card',
      'Manufacturing': 'construct',
      'Energy': 'flash',
      'Transportation': 'car',
      'Entertainment': 'musical-notes',
      'Education': 'school',
    };
    return icons[category] || 'business';
  };
  
  const getBusinessLogo = () => {
    // In production, these would be real business logos
    const logoUrls: Record<string, string> = {
      'Patagonia': 'https://logos-world.net/wp-content/uploads/2020/04/Patagonia-Logo.png',
      'Chick-fil-A': 'https://logos-world.net/wp-content/uploads/2020/04/Chick-fil-A-Logo.png',
      'Ben & Jerry\'s': 'https://logos-world.net/wp-content/uploads/2020/04/Ben-Jerrys-Logo.png',
      'Tesla': 'https://logos-world.net/wp-content/uploads/2020/04/Tesla-Logo.png',
      'Walmart': 'https://logos-world.net/wp-content/uploads/2020/04/Walmart-Logo.png',
    };
    
    return logoUrls[business.name] || business.imageUrl || 'https://via.placeholder.com/120x80/f3f4f6/9ca3af?text=' + business.name.charAt(0);
  };
  
  const alignmentPercentage = getAlignmentPercentage();
  const categoryIcon = getCategoryIcon(business.category);

  if (variant === 'compact') {
    return (
      <Card
        onPress={onPress}
        hover={isHovered}
        style={compactCardStyle}
      >
        <View style={compactContentStyle}>
          <View style={compactHeaderStyle}>
            <View style={compactBusinessInfoStyle}>
              <Image 
                source={{ uri: getBusinessLogo() }}
                style={compactLogoStyle}
                resizeMode="contain"
              />
              <View style={{ flex: 1, marginLeft: Spacing[3] }}>
                <Text style={compactNameStyle} numberOfLines={1}>
                  {business.name}
                </Text>
                <View style={compactCategoryContainerStyle}>
                  <Ionicons name={categoryIcon} size={12} color={Colors.gray[500]} />
                  <Text style={compactCategoryStyle}>
                    {business.category}
                  </Text>
                </View>
              </View>
            </View>
            
            {userAlignment && business.alignment && (
              <AlignmentBadge
                percentage={alignmentPercentage}
                size="sm"
                showLabel={false}
                variant="match"
              />
            )}
          </View>
        </View>
      </Card>
    );
  }
  
  if (variant === 'featured') {
    return (
      <Card
        onPress={onPress}
        hover={isHovered}
        variant="elevated"
        style={featuredCardStyle}
      >
        <View style={featuredImageContainerStyle}>
          <Image 
            source={{ uri: getBusinessLogo() }}
            style={featuredImageStyle}
            resizeMode="cover"
          />
          <View style={featuredOverlayStyle}>
            {userAlignment && business.alignment && (
              <AlignmentBadge
                percentage={alignmentPercentage}
                size="lg"
                variant="match"
                style={{ position: 'absolute', top: Spacing[4], right: Spacing[4] }}
              />
            )}
          </View>
        </View>
        
        <View style={featuredContentStyle}>
          <View style={featuredHeaderStyle}>
            <View style={featuredTitleContainerStyle}>
              <Text style={featuredNameStyle} numberOfLines={2}>
                {business.name}
              </Text>
              <View style={featuredCategoryContainerStyle}>
                <Ionicons name={categoryIcon} size={16} color={Colors.primary[500]} />
                <Badge variant="primary" size="sm">
                  {business.category}
                </Badge>
              </View>
            </View>
          </View>
          
          <Text style={featuredDescriptionStyle} numberOfLines={3}>
            {business.description}
          </Text>
          
          {business.alignment && (
            <View style={featuredAlignmentContainerStyle}>
              <Text style={featuredAlignmentLabelStyle}>
                Political Alignment
              </Text>
              <AlignmentSpectrum
                alignments={business.alignment}
                userAlignments={userAlignment}
                compact={true}
              />
            </View>
          )}
          
          {business.address && (
            <View style={featuredFooterStyle}>
              <Ionicons name="location" size={14} color={Colors.gray[500]} />
              <Text style={featuredAddressStyle}>{business.address}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      onPress={onPress}
      hover={isHovered}
      style={defaultCardStyle}
    >
      <View style={defaultContentStyle}>
        <View style={defaultHeaderStyle}>
          <Image 
            source={{ uri: getBusinessLogo() }}
            style={defaultLogoStyle}
            resizeMode="contain"
          />
          
          <View style={defaultBusinessInfoStyle}>
            <View style={defaultTitleRowStyle}>
              <Text style={defaultNameStyle} numberOfLines={1}>
                {business.name}
              </Text>
              {userAlignment && business.alignment && (
                <AlignmentBadge
                  percentage={alignmentPercentage}
                  size="md"
                  showLabel={false}
                />
              )}
            </View>
            
            <View style={defaultCategoryRowStyle}>
              <Ionicons name={categoryIcon} size={14} color={Colors.primary[500]} />
              <Badge variant="gray" size="sm">
                {business.category}
              </Badge>
            </View>
            
            <Text style={defaultDescriptionStyle} numberOfLines={2}>
              {business.description}
            </Text>
          </View>
        </View>
        
        {business.address && (
          <View style={defaultFooterStyle}>
            <Ionicons name="location" size={12} color={Colors.gray[500]} />
            <Text style={defaultAddressStyle} numberOfLines={1}>
              {business.address}
            </Text>
          </View>
        )}
        
        {business.website && (
          <View style={defaultActionRowStyle}>
            <TouchableOpacity style={defaultWebsiteButtonStyle}>
              <Ionicons name="globe" size={14} color={Colors.primary[600]} />
              <Text style={defaultWebsiteTextStyle}>Visit Website</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
}

// Compact Card Styles
const compactCardStyle = {
  margin: Spacing[2],
  padding: Spacing[4],
};

const compactContentStyle = {
  ...StyleMixins.flexBetween,
};

const compactHeaderStyle = {
  ...StyleMixins.flexBetween,
  width: '100%' as const,
};

const compactBusinessInfoStyle = {
  ...StyleMixins.flexStart,
  flex: 1,
};

const compactLogoStyle = {
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundColor: Colors.gray[100],
};

const compactNameStyle = {
  ...StyleMixins.body,
  fontWeight: '600' as const,
  color: Colors.gray[900],
};

const compactCategoryContainerStyle = {
  ...StyleMixins.flexStart,
  marginTop: Spacing[1],
};

const compactCategoryStyle = {
  ...StyleMixins.caption,
  marginLeft: Spacing[1],
  color: Colors.gray[500],
};

// Featured Card Styles
const featuredCardStyle = {
  margin: Spacing[4],
  padding: 0,
  overflow: 'hidden' as const,
};

const featuredImageContainerStyle = {
  position: 'relative' as const,
  height: 180,
};

const featuredImageStyle = {
  width: '100%' as const,
  height: 180,
  backgroundColor: Colors.gray[100],
};

const featuredOverlayStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.1)',
};

const featuredContentStyle = {
  padding: Spacing[6],
};

const featuredHeaderStyle = {
  marginBottom: Spacing[4],
};

const featuredTitleContainerStyle = {
  marginBottom: Spacing[3],
};

const featuredNameStyle = {
  ...StyleMixins.heading3,
  marginBottom: Spacing[2],
};

const featuredCategoryContainerStyle = {
  ...StyleMixins.flexStart,
  gap: Spacing[2],
};

const featuredDescriptionStyle = {
  ...StyleMixins.body,
  lineHeight: 24,
  marginBottom: Spacing[4],
};

const featuredAlignmentContainerStyle = {
  marginBottom: Spacing[4],
};

const featuredAlignmentLabelStyle = {
  ...StyleMixins.bodySmall,
  fontWeight: '600' as const,
  color: Colors.gray[700],
  marginBottom: Spacing[3],
};

const featuredFooterStyle = {
  ...StyleMixins.flexStart,
};

const featuredAddressStyle = {
  ...StyleMixins.caption,
  marginLeft: Spacing[2],
};

// Default Card Styles
const defaultCardStyle = {
  margin: Spacing[3],
  padding: Spacing[5],
};

const defaultContentStyle = {
  gap: Spacing[4],
};

const defaultHeaderStyle = {
  ...StyleMixins.flexStart,
  alignItems: 'flex-start' as const,
};

const defaultLogoStyle = {
  width: 80,
  height: 60,
  borderRadius: 12,
  backgroundColor: Colors.gray[100],
  marginRight: Spacing[4],
};

const defaultBusinessInfoStyle = {
  flex: 1,
  gap: Spacing[2],
};

const defaultTitleRowStyle = {
  ...StyleMixins.flexBetween,
  alignItems: 'flex-start' as const,
};

const defaultNameStyle = {
  ...StyleMixins.heading4,
  flex: 1,
  marginRight: Spacing[2],
};

const defaultCategoryRowStyle = {
  ...StyleMixins.flexStart,
  gap: Spacing[2],
};

const defaultDescriptionStyle = {
  ...StyleMixins.body,
  lineHeight: 22,
  color: Colors.gray[600],
};

const defaultFooterStyle = {
  ...StyleMixins.flexStart,
  paddingTop: Spacing[2],
  borderTopWidth: 1,
  borderTopColor: Colors.gray[100],
};

const defaultAddressStyle = {
  ...StyleMixins.caption,
  marginLeft: Spacing[2],
  flex: 1,
};

const defaultActionRowStyle = {
  ...StyleMixins.flexStart,
  paddingTop: Spacing[3],
};

const defaultWebsiteButtonStyle = {
  ...StyleMixins.flexStart,
  paddingHorizontal: Spacing[3],
  paddingVertical: Spacing[2],
  backgroundColor: Colors.primary[50],
  borderRadius: 20,
  gap: Spacing[1],
};

const defaultWebsiteTextStyle = {
  ...StyleMixins.caption,
  color: Colors.primary[700],
  fontWeight: '500' as const,
};