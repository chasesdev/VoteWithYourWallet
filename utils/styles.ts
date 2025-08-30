// Style Utilities - Professional styling helpers
import { StyleSheet, ViewStyle, TextStyle, ImageStyle, Platform } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../constants/design';

// Common style mixins for consistent styling
export const StyleMixins = {
  // Flex utilities
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  flexBetween: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  
  flexStart: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  } as ViewStyle,
  
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing[6],
    ...Shadows.subtle,
  } as ViewStyle,
  
  cardHover: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing[6],
    ...Shadows.medium,
    transform: [{ translateY: -2 }],
  } as ViewStyle,
  
  // Text styles
  heading1: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize['4xl'],
    color: Colors.gray[900],
  } as TextStyle,
  
  heading2: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize['3xl'],
    color: Colors.gray[900],
  } as TextStyle,
  
  heading3: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.lineHeight.snug * Typography.fontSize['2xl'],
    color: Colors.gray[900],
  } as TextStyle,
  
  heading4: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.xl,
    color: Colors.gray[900],
  } as TextStyle,
  
  bodyLarge: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.lg,
    color: Colors.gray[700],
  } as TextStyle,
  
  body: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
    color: Colors.gray[700],
  } as TextStyle,
  
  bodySmall: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
    color: Colors.gray[600],
  } as TextStyle,
  
  caption: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.xs,
    color: Colors.gray[500],
  } as TextStyle,
};

// Button style variants
export const ButtonStyles = {
  // Primary button
  primary: {
    backgroundColor: Colors.primary[600],
    borderRadius: Components.button.borderRadius,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    ...StyleMixins.flexCenter,
    ...Shadows.subtle,
  } as ViewStyle,
  
  primaryText: {
    color: Colors.white,
    fontSize: Components.button.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
  
  primaryPressed: {
    backgroundColor: Colors.primary[700],
    transform: [{ translateY: 1 }],
  } as ViewStyle,
  
  // Secondary button
  secondary: {
    backgroundColor: Colors.white,
    borderRadius: Components.button.borderRadius,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    ...StyleMixins.flexCenter,
  } as ViewStyle,
  
  secondaryText: {
    color: Colors.gray[700],
    fontSize: Components.button.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
  
  secondaryPressed: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[400],
  } as ViewStyle,
  
  // Ghost button
  ghost: {
    backgroundColor: Colors.transparent,
    borderRadius: Components.button.borderRadius,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    ...StyleMixins.flexCenter,
  } as ViewStyle,
  
  ghostText: {
    color: Colors.primary[600],
    fontSize: Components.button.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
  
  ghostPressed: {
    backgroundColor: Colors.primary[50],
  } as ViewStyle,
  
  // Danger button
  danger: {
    backgroundColor: Colors.error[500],
    borderRadius: Components.button.borderRadius,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    ...StyleMixins.flexCenter,
    ...Shadows.subtle,
  } as ViewStyle,
  
  dangerText: {
    color: Colors.white,
    fontSize: Components.button.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
};

// Input style variants
export const InputStyles = {
  container: {
    marginBottom: Spacing[4],
  } as ViewStyle,
  
  label: {
    ...StyleMixins.bodySmall,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.gray[700],
    marginBottom: Spacing[2],
  } as TextStyle,
  
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: Components.input.borderRadius,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Components.input.fontSize,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.gray[900],
    minHeight: Components.input.height,
  } as ViewStyle,
  
  inputFocused: {
    borderColor: Colors.primary[500],
    borderWidth: 2,
    ...Shadows.medium,
    // Better web focus treatment
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific CSS properties
      boxShadow: `0 0 0 3px ${Colors.primary[100]}`,
      transform: 'none', // Prevent any transforms on focus
    }),
  } as ViewStyle,
  
  inputError: {
    borderColor: Colors.error[500],
  } as ViewStyle,
  
  errorText: {
    ...StyleMixins.caption,
    color: Colors.error[600],
    marginTop: Spacing[1],
  } as TextStyle,
  
  helperText: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
    marginTop: Spacing[1],
  } as TextStyle,
};

// Badge/Chip styles
export const BadgeStyles = {
  // Primary badge
  primary: {
    backgroundColor: Colors.primary[100],
    borderRadius: Components.badge.borderRadius,
    paddingHorizontal: Components.badge.paddingHorizontal,
    paddingVertical: Components.badge.paddingVertical,
    ...StyleMixins.flexCenter,
  } as ViewStyle,
  
  primaryText: {
    color: Colors.primary[700],
    fontSize: Components.badge.fontSize,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
  
  // Success badge
  success: {
    backgroundColor: Colors.success[100],
    borderRadius: Components.badge.borderRadius,
    paddingHorizontal: Components.badge.paddingHorizontal,
    paddingVertical: Components.badge.paddingVertical,
    ...StyleMixins.flexCenter,
  } as ViewStyle,
  
  successText: {
    color: Colors.success[700],
    fontSize: Components.badge.fontSize,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
  
  // Warning badge
  warning: {
    backgroundColor: Colors.warning[100],
    borderRadius: Components.badge.borderRadius,
    paddingHorizontal: Components.badge.paddingHorizontal,
    paddingVertical: Components.badge.paddingVertical,
    ...StyleMixins.flexCenter,
  } as ViewStyle,
  
  warningText: {
    color: Colors.warning[700],
    fontSize: Components.badge.fontSize,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
  
  // Error badge
  error: {
    backgroundColor: Colors.error[100],
    borderRadius: Components.badge.borderRadius,
    paddingHorizontal: Components.badge.paddingHorizontal,
    paddingVertical: Components.badge.paddingVertical,
    ...StyleMixins.flexCenter,
  } as ViewStyle,
  
  errorText: {
    color: Colors.error[700],
    fontSize: Components.badge.fontSize,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
  
  // Gray badge
  gray: {
    backgroundColor: Colors.gray[100],
    borderRadius: Components.badge.borderRadius,
    paddingHorizontal: Components.badge.paddingHorizontal,
    paddingVertical: Components.badge.paddingVertical,
    ...StyleMixins.flexCenter,
  } as ViewStyle,
  
  grayText: {
    color: Colors.gray[700],
    fontSize: Components.badge.fontSize,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
};

// Alignment-specific styling
export const AlignmentStyles = {
  getAlignmentColor: (percentage: number) => {
    if (percentage >= 80) return Colors.success[500];
    if (percentage >= 60) return Colors.success[400];
    if (percentage >= 40) return Colors.warning[500];
    if (percentage >= 20) return Colors.error[400];
    return Colors.error[500];
  },
  
  getAlignmentBadgeStyle: (percentage: number) => {
    const color = AlignmentStyles.getAlignmentColor(percentage);
    return {
      backgroundColor: color,
      borderRadius: Components.badge.borderRadius,
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[1],
      ...StyleMixins.flexCenter,
    } as ViewStyle;
  },
  
  alignmentText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
  } as TextStyle,
};

// Export commonly used styles
export const CommonStyles = StyleSheet.create({
  // Layout
  container: StyleMixins.container,
  card: StyleMixins.card,
  flexCenter: StyleMixins.flexCenter,
  flexBetween: StyleMixins.flexBetween,
  flexStart: StyleMixins.flexStart,
  
  // Typography
  h1: StyleMixins.heading1,
  h2: StyleMixins.heading2,
  h3: StyleMixins.heading3,
  h4: StyleMixins.heading4,
  bodyLarge: StyleMixins.bodyLarge,
  body: StyleMixins.body,
  bodySmall: StyleMixins.bodySmall,
  caption: StyleMixins.caption,
  
  // Spacing
  mt1: { marginTop: Spacing[1] },
  mt2: { marginTop: Spacing[2] },
  mt3: { marginTop: Spacing[3] },
  mt4: { marginTop: Spacing[4] },
  mb1: { marginBottom: Spacing[1] },
  mb2: { marginBottom: Spacing[2] },
  mb3: { marginBottom: Spacing[3] },
  mb4: { marginBottom: Spacing[4] },
  mx4: { marginHorizontal: Spacing[4] },
  my4: { marginVertical: Spacing[4] },
  p4: { padding: Spacing[4] },
  px4: { paddingHorizontal: Spacing[4] },
  py4: { paddingVertical: Spacing[4] },
});