// Shared types for YAML Validator AI
export type ValidationResult = {
  status: 'VALID' | 'INVALID' | string;
  message: string;
};

export type Output = string | ValidationResult | null;
