import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';

/** Tendencia opcional exibida no card. */
export type CardTrend = 'up' | 'down' | 'stable';

export interface MetricCardProps {
  /** Rotulo da metrica. */
  label: string;
  /** Valor principal (ja formatado em string ou numero). */
  value: string | number;
  /** Unidade exibida ao lado do valor. */
  unit?: string;
  /** Nome do icone Ionicons. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Cor de destaque do icone/valor. */
  accentColor?: string;
  /** Tendencia opcional (seta colorida). */
  trend?: CardTrend;
  /** Atraso da animacao de entrada em ms (para efeito cascata). */
  delay?: number;
}

/**
 * Card reutilizavel de metrica com animacao de entrada (fade + slide up).
 * Usado nos dashboards Home, Sensores, Energia e Comunicacao.
 */
export default function MetricCard({
  label,
  value,
  unit,
  icon,
  accentColor,
  trend,
  delay = 0,
}: MetricCardProps): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const accent = accentColor ?? c.primary;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  const trendIcon: keyof typeof Ionicons.glyphMap | null =
    trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : trend ? 'remove' : null;
  const trendColor =
    trend === 'up' ? c.danger : trend === 'down' ? c.accent : c.textSecondary;

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        {trendIcon && <Ionicons name={trendIcon} size={16} color={trendColor} />}
      </View>
      <Text style={[styles.label, { color: c.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: c.textPrimary }]}>{value}</Text>
        {unit ? <Text style={[styles.unit, { color: c.textSecondary }]}>{unit}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: spacing.sm,
    fontFamily: FONT.mono,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT.mono,
  },
  unit: {
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 4,
    fontFamily: FONT.mono,
  },
});
