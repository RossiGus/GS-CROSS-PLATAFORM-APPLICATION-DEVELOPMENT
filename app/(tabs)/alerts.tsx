import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AlertBadge from '@/components/AlertBadge';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission, type Alert, type AlertLevel } from '@/context/MissionContext';

/** Peso de ordenacao por nivel de criticidade. */
const LEVEL_WEIGHT: Record<AlertLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

/** Formata um timestamp como HH:MM:SS. */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR');
}

/** Icone por tipo de alerta. */
function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'temperature':
      return 'thermometer';
    case 'pressure':
      return 'speedometer';
    case 'radiation':
      return 'radio-outline';
    case 'energy':
      return 'battery-dead';
    case 'signal':
      return 'cellular';
    default:
      return 'warning';
  }
}

/**
 * Tela de Alertas.
 * Lista os alertas ordenados por criticidade e tempo, com badge colorido,
 * botao de dispensar e marcacao automatica como lidos ao abrir a tela.
 */
export default function AlertsScreen(): React.JSX.Element {
  const { state, dispatch } = useMission();
  const c = getColors(state.themeMode);

  // Marca alertas como lidos ao focar a tela (zera o contador da aba).
  useFocusEffect(
    useCallback(() => {
      dispatch({ type: 'MARK_ALERTS_READ' });
    }, [dispatch]),
  );

  const sorted: Alert[] = [...state.alerts].sort((a, b) => {
    const w = LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level];
    return w !== 0 ? w : b.timestamp - a.timestamp;
  });

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={c.success} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              Nenhum alerta ativo. Todos os sistemas nominais.
            </Text>
          </View>
        ) : (
          sorted.map((alert) => (
            <View key={alert.id} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: c.surfaceAlt }]}>
                <Ionicons name={iconFor(alert.type)} size={20} color={c.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeader}>
                  <AlertBadge level={alert.level} />
                  <Text style={[styles.time, { color: c.textSecondary }]}>{formatTime(alert.timestamp)}</Text>
                </View>
                <Text style={[styles.message, { color: c.textPrimary }]}>{alert.message}</Text>
              </View>
              <TouchableOpacity
                onPress={() => dispatch({ type: 'DISMISS_ALERT', payload: alert.id })}
                hitSlop={8}
                style={styles.dismiss}
              >
                <Ionicons name="close-circle" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xxl * 2 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: spacing.xl, fontFamily: FONT.mono },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  time: { fontSize: 11, fontFamily: FONT.mono },
  message: { fontSize: 14, fontFamily: FONT.mono },
  dismiss: { padding: 2 },
});
