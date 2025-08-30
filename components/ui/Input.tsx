import React, { useState } from 'react';
import { View, Text, TextInput, ViewStyle, TextStyle, TextInputProps, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputStyles, StyleMixins } from '../../utils/styles';
import { Colors } from '../../constants/design';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export default function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const getInputContainerStyle = () => {
    const baseStyle = InputStyles.input;
    const focusedStyle = isFocused ? InputStyles.inputFocused : {};
    const errorStyle = error ? InputStyles.inputError : {};
    
    return [baseStyle, focusedStyle, errorStyle, inputStyle];
  };
  
  const getInputStyle = () => {
    const paddingLeft = leftIcon ? 40 : 16;
    const paddingRight = rightIcon ? 40 : 16;
    
    return {
      flex: 1,
      paddingLeft,
      paddingRight,
      color: Colors.gray[900],
      fontSize: 16,
    };
  };

  return (
    <View style={[InputStyles.container, containerStyle]}>
      {label && (
        <Text style={[InputStyles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon}
            size={20}
            color={Colors.gray[400]}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              marginTop: -10,
              zIndex: 1,
            }}
          />
        )}
        
        <TextInput
          style={[
            getInputStyle(),
            // Web-specific styles to remove default browser styling
            Platform.OS === 'web' && {
              outline: 'none',
              // @ts-ignore - Web-specific CSS properties
              boxShadow: 'none',
              WebkitAppearance: 'none',
            }
          ]}
          placeholderTextColor={Colors.gray[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              marginTop: -10,
              zIndex: 1,
            }}
          >
            <Ionicons 
              name={rightIcon}
              size={20}
              color={Colors.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={InputStyles.errorText}>
          {error}
        </Text>
      )}
      
      {helper && !error && (
        <Text style={InputStyles.helperText}>
          {helper}
        </Text>
      )}
    </View>
  );
}