/**
 * Design Tokens for KVS Teacher Diary & School Management System
 * Stage 3: Minimal Design System
 */

export interface ColorTokens {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  secondaryHover: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export const lightColors: ColorTokens = {
  primary: '#6366F1', // Indigo 500
  primaryHover: '#4F46E5', // Indigo 600
  primaryLight: '#EEF2FF', // Indigo 50
  secondary: '#8B5CF6', // Purple 500
  secondaryHover: '#7C3AED', // Purple 600
  success: '#10B981', // Emerald 500
  successLight: '#ECFDF5', // Emerald 50
  warning: '#F59E0B', // Amber 500
  warningLight: '#FFFBEB', // Amber 50
  danger: '#EF4444', // Red 500
  dangerLight: '#FEF2F2', // Red 50
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC', // Slate 50
  surfaceSubtle: '#F1F5F9', // Slate 100
  border: '#E2E8F0', // Slate 200
  borderSubtle: '#CBD5E1', // Slate 300
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8' // Slate 400
};

export const darkColors: ColorTokens = {
  primary: '#818CF8', // Indigo 400
  primaryHover: '#6366F1', // Indigo 500
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  secondary: '#A78BFA', // Purple 400
  secondaryHover: '#8B5CF6', // Purple 500
  success: '#34D399', // Emerald 400
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#FBBF24', // Amber 400
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#F87171', // Red 400
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  surface: '#0F111A', // Deep dark
  surfaceElevated: '#171B26', // Elevated card
  surfaceSubtle: '#1E2333', // Hover / chip
  border: 'rgba(255, 255, 255, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B'
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32
} as const;

export const typography = {
  caption: 11,
  bodySm: 12,
  bodyMd: 13,
  body: 14,
  subheading: 16,
  titleSm: 18,
  titleMd: 20,
  titleLg: 24
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '20px',
  full: '9999px'
} as const;

export const motion = {
  fast: '150ms',
  normal: '200ms',
  slow: '250ms',
  timingEase: 'cubic-bezier(0.16, 1, 0.3, 1)'
} as const;

/**
 * Helper to get colors based on theme
 */
export function getThemeTokens(theme: 'light' | 'dark'): ColorTokens {
  return theme === 'light' ? lightColors : darkColors;
}
