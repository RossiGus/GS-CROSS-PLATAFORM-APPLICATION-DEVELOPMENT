import { Platform } from 'react-native';

/**
 * Paleta de cores do OrbitWatch.
 * O tema padrao e o "dark espacial" exigido pela rubrica.
 * Tambem expomos uma paleta "light" para o diferencial de alternancia de tema.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  accent: string;
  warning: string;
  danger: string;
  success: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

/** Tema escuro (padrao) inspirado em interfaces NASA/SpaceX. */
export const darkColors: ThemeColors = {
  background: '#0A0E1A',
  surface: '#111827',
  surfaceAlt: '#1C2333',
  primary: '#4F8EF7',
  accent: '#00D4AA',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#1E293B',
};

/** Tema claro (diferencial: alternancia de tema). */
export const lightColors: ThemeColors = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#E2E8F0',
  primary: '#2563EB',
  accent: '#0F9D8B',
  warning: '#D97706',
  danger: '#DC2626',
  success: '#059669',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#CBD5E1',
};

export type ThemeMode = 'dark' | 'light';

/** Retorna a paleta de cores ativa de acordo com o modo. */
export function getColors(mode: ThemeMode): ThemeColors {
  return mode === 'light' ? lightColors : darkColors;
}

/** Compatibilidade: a paleta usada por padrao continua sendo a escura. */
export const colors = darkColors;

/** Fonte monoespacada (SpaceMono) com fallback do sistema. */
export const FONT = {
  mono: 'SpaceMono_400Regular',
  monoFallback: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,
};

/** Espacamentos padrao do app. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Raios de borda padrao. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;
