import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Colors, Typography, Spacing } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import { validateEmail } from '../utils/validation';

interface LoginForm {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirect = params.redirect as string || '/';
  
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Login failed' });
        return;
      }

      // Store session token (will be handled by httpOnly cookie from server)
      Alert.alert('Success', 'Logged in successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to redirect URL or home
            router.replace(redirect as any);
          },
        },
      ]);

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
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

        {/* Login Form */}
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your personalized business matches
            </Text>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.error[500]} />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.formBody}>
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
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon="lock-closed"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            >
              Sign In
            </Button>
          </View>
        </Card>

        {/* Sign Up Link */}
        <View style={styles.signupLink}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push(`/signup?redirect=${redirect}`)}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Mode */}
        <TouchableOpacity 
          style={styles.demoButton}
          onPress={() => {
            // Navigate directly to the main app as guest
            router.replace(redirect === '/login' ? '/' : (redirect as any));
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
  forgotPassword: {
    alignSelf: 'flex-end' as const,
    marginTop: -Spacing[2],
  },
  forgotPasswordText: {
    ...StyleMixins.bodySmall,
    color: Colors.primary[600],
    fontWeight: '500' as const,
  },
  loginButton: {
    marginTop: Spacing[2],
  },
  signupLink: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: Spacing[8],
    paddingHorizontal: Spacing[6],
  },
  signupText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
  },
  signupButtonText: {
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