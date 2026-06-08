import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getColors, FONT, radius } from '@/constants/theme';
import { useMission, type AlertLevel } from '@/context/MissionContext';

export interface AlertBadgeProps {
  /** Nivel de criticidade do alerta. */
  level: AlertLevel;
}

/** Mapeia o nivel para rotulo legivel. */
const LABELS: Record<AlertLevel, string> = {
  low: 'BAIXO',
  medium: 'MEDIO',
  high: 'ALTO',
  critical: 'CRITICO',
};

/**
 * Badge colorido por nivel de criticidade.
 * verde (low) / amarelo (medium) / laranja (high) / vermelho (critical).
 */
export default function AlertBadge({ level }: AlertBadgeProps): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);

  const color: Record<AlertLevel, string> = {
    low: c.success,
    medium: c.warning,
    high: '#FB923C',
    critical: c.danger,
  };

  const bg = color[level];

  return (
    <View style={[styles.badge, { backgroundColor: bg + '22', borderColor: bg }]}>
      <Text style={[styles.text, { color: bg }]}>{LABELS[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: FONT.mono,
  },
});
