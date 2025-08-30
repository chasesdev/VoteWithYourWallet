import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Colors, Typography, Spacing } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import { validateEmail, validatePassword } from '../utils/auth';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirect = params.redirect as string || '/';
  
  const [form, setForm] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Signup failed' });
        return;
      }

      Alert.alert(
        'Account Created!', 
        'Welcome to VoteWithYourWallet! You can now personalize your business recommendations.',
        [
          {
            text: 'Get Started',
            onPress: () => {
              // Navigate to political alignment or redirect URL
              const nextUrl = redirect === '/' ? '/political-alignment' : redirect;
              router.replace(nextUrl as any);
            },
          },
        ]
      );

    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={48} color={Colors.primary[600]} />
            <Text style={styles.logoText}>VoteWithYourWallet</Text>
          </View>
        </View>

        {/* Signup Form */}
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Join thousands of conscious consumers making informed choices
            </Text>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.error[500]} />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.formBody}>
            {/* Name Input */}
            <Input
              label="Full Name"
              value={form.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoCorrect={false}
              error={errors.name}
              leftIcon="person"
            />

            {/* Email Input */}
            <Input
              label="Email Address"
              value={form.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              leftIcon="mail"
            />

            {/* Password Input */}
            <Input
              label="Password"
              value={form.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Create a strong password"
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon="lock-closed"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
              helper="Must be 8+ characters with uppercase, lowercase, number & symbol"
            />

            {/* Confirm Password Input */}
            <Input
              label="Confirm Password"
              value={form.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="Re-enter your password"
              secureTextEntry={!showConfirmPassword}
              error={errors.confirmPassword}
              leftIcon="lock-closed"
              rightIcon={showConfirmPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            {/* Terms & Privacy */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.linkText}>Terms of Service</Text>
                </TouchableOpacity>
                {' '}and{' '}
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </TouchableOpacity>
              </Text>
            </View>

            {/* Signup Button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleSignup}
              loading={loading}
              style={styles.signupButton}
            >
              Create Account
            </Button>
          </View>
        </Card>

        {/* Login Link */}
        <View style={styles.loginLink}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push(`/login?redirect=${redirect}`)}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Mode */}
        <TouchableOpacity 
          style={styles.demoButton}
          onPress={() => {
            // Navigate directly to the main app as guest
            router.replace(redirect === '/signup' ? '/' : (redirect as any));
          }}
        >
          <Text style={styles.demoText}>Continue as Guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Spacing[8],
  },
  header: {
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    position: 'relative' as const,
  },
  backButton: {
    position: 'absolute' as const,
    top: Spacing[12],
    left: Spacing[4],
    padding: Spacing[2],
  },
  logoContainer: {
    alignItems: 'center' as const,
    marginTop: Spacing[6],
  },
  logoText: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
    marginTop: Spacing[3],
  },
  formCard: {
    marginHorizontal: Spacing[6],
    padding: Spacing[8],
  },
  formHeader: {
    alignItems: 'center' as const,
    marginBottom: Spacing[8],
  },
  title: {
    ...StyleMixins.heading2,
    color: Colors.gray[900],
    marginBottom: Spacing[2],
  },
  subtitle: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    textAlign: 'center' as const,
    lineHeight: Typography.lineHeight.snug,
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[200],
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing[4],
    marginBottom: Spacing[6],
    gap: Spacing[2],
  },
  errorText: {
    ...StyleMixins.bodySmall,
    color: Colors.error[700],
    flex: 1,
  },
  formBody: {
    gap: Spacing[6],
  },
  termsContainer: {
    marginTop: -Spacing[2],
  },
  termsText: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
    lineHeight: Typography.lineHeight.tight,
    textAlign: 'center' as const,
  },
  linkText: {
    color: Colors.primary[600],
    fontWeight: '500' as const,
    textDecorationLine: 'underline' as const,
  },
  signupButton: {
    marginTop: Spacing[2],
  },
  loginLink: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: Spacing[8],
    paddingHorizontal: Spacing[6],
  },
  loginText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
  },
  loginButtonText: {
    ...StyleMixins.body,
    color: Colors.primary[600],
    fontWeight: '600' as const,
  },
  demoButton: {
    alignItems: 'center' as const,
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[6],
  },
  demoText: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[500],
    textDecorationLine: 'underline' as const,
  },
};