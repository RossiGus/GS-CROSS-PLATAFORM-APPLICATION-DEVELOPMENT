import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { getColors, FONT } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';

export interface StatusIndicatorProps {
  /** Cor da bolinha de status. */
  color: string;
  /** Texto exibido ao lado. */
  label: string;
  /** Se true, a bolinha pulsa continuamente. */
  pulse?: boolean;
  /** Tamanho da bolinha. */
  size?: number;
}

/**
 * Bolinha colorida de status com rotulo opcional e animacao de pulso.
 * Reutilizada em varios dashboards para indicar estados.
 */
export default function StatusIndicator({
  color,
  label,
  pulse = false,
  size = 10,
}: StatusIndicatorProps): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, scale]);

  return (
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ scale }] },
        ]}
      />
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { marginRight: 8 },
  label: { fontSize: 13, fontFamily: FONT.mono },
});
