import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '../constants/design';

interface LegalFooterProps {
  style?: any;
  textColor?: string;
  linkColor?: string;
  compact?: boolean;
}

export default function LegalFooter({ 
  style, 
  textColor = Colors.text.secondary, 
  linkColor = Colors.primary[600],
  compact = false 
}: LegalFooterProps) {
  const navigateToTerms = () => {
    router.push('/terms');
  };

  const navigateToPrivacy = () => {
    router.push('/privacy');
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <TouchableOpacity onPress={navigateToTerms} style={styles.compactLink}>
          <Text style={[styles.compactLinkText, { color: linkColor }]}>
            Terms
          </Text>
        </TouchableOpacity>
        <Text style={[styles.compactSeparator, { color: textColor }]}>•</Text>
        <TouchableOpacity onPress={navigateToPrivacy} style={styles.compactLink}>
          <Text style={[styles.compactLinkText, { color: linkColor }]}>
            Privacy
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, { color: textColor }]}>
        By using VoteWithYourWallet, you agree to our{' '}
        <Text
          style={[styles.link, { color: linkColor }]}
          onPress={navigateToTerms}
        >
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text
          style={[styles.link, { color: linkColor }]}
          onPress={navigateToPrivacy}
        >
          Privacy Policy
        </Text>
        .
      </Text>
      
      <Text style={[styles.copyright, { color: textColor }]}>
        © {new Date().getFullYear()} VoteWithYourWallet. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
  },
  text: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[2],
  },
  link: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textDecorationLine: 'underline',
  },
  copyright: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    opacity: 0.7,
  },
  compactLink: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
  },
  compactLinkText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textDecorationLine: 'underline',
  },
  compactSeparator: {
    fontSize: Typography.sizes.sm,
    marginHorizontal: Spacing[1],
  },
});
