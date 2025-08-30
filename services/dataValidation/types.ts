// Types for data validation service
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  normalizedData?: any;
}

export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'email' | 'url' | 'phone' | 'coordinate';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface ValidationProfile {
  name: string;
  rules: ValidationRule[];
  strictMode: boolean;
}

export interface BusinessValidationProfile extends ValidationProfile {
  name: 'business';
  rules: ValidationRule[];
  strictMode: boolean;
}