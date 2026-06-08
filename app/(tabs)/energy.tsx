import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import MetricCard from '@/components/MetricCard';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';

/** Converte hex (#RRGGBB) em rgba. */
function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Dashboard de Energia.
 * Grafico de barras de consumo por subsistema, barra de carga dos paineis
 * solares e estimativa de autonomia em horas.
 */
export default function EnergyScreen(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const latest = state.energyData[state.energyData.length - 1];
  const width = Dimensions.get('window').width - spacing.lg * 4;

  const barData = {
    labels: ['Prop.', 'Com.', 'Vida', 'Comp.'],
    datasets: [
      {
        data: latest
          ? [latest.propulsion, latest.communication, latest.lifeSupport, latest.computing]
          : [0, 0, 0, 0],
      },
    ],
  };

  const solar = latest?.solarCharge ?? 0;

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          <MetricCard label="Energia Total" value={latest?.totalEnergy ?? '--'} unit="%" icon="battery-charging" accentColor={c.success} delay={0} />
          <MetricCard label="Autonomia" value={latest?.autonomyHours ?? '--'} unit="h" icon="time" accentColor={c.primary} delay={80} />
        </View>

        {/* Consumo por subsistema */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Consumo por subsistema (W)</Text>
          <BarChart
            data={barData}
            width={Math.max(width, 280)}
            height={230}
            yAxisLabel=""
            yAxisSuffix="W"
            fromZero
            showValuesOnTopOfBars
            chartConfig={{
              backgroundGradientFrom: c.surface,
              backgroundGradientTo: c.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => hexToRgba(c.primary, opacity),
              labelColor: (opacity = 1) => hexToRgba(c.textSecondary, opacity),
              propsForBackgroundLines: { stroke: c.border },
              barPercentage: 0.6,
            }}
            style={styles.chart}
          />
        </View>

        {/* Carga solar */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.solarHeader}>
            <View style={styles.solarLabel}>
              <Ionicons name="sunny" size={18} color={c.warning} />
              <Text style={[styles.cardTitle, { color: c.textPrimary, marginBottom: 0 }]}>
                Carga dos paineis solares
              </Text>
            </View>
            <Text style={[styles.solarPct, { color: c.accent }]}>{solar.toFixed(0)}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: c.surfaceAlt }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${solar}%`, backgroundColor: solar < 30 ? c.danger : c.accent },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.md },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.md, fontFamily: FONT.mono },
  chart: { borderRadius: radius.md, marginLeft: -spacing.sm },
  solarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  solarLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  solarPct: { fontSize: 16, fontWeight: '700', fontFamily: FONT.mono },
  progressTrack: { height: 14, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },
});
