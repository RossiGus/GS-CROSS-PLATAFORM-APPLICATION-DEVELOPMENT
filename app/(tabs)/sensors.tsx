import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SensorChart from '@/components/SensorChart';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';
import { detectTrend, type Trend } from '@/utils/predictions';

/** Linha de leitura com tendencia. */
function ReadingRow({
  icon,
  label,
  value,
  unit,
  trend,
  color,
  c,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  unit: string;
  trend: Trend;
  color: string;
  c: ReturnType<typeof getColors>;
}): React.JSX.Element {
  const trendIcon = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove';
  const trendColor = trend === 'up' ? c.danger : trend === 'down' ? c.accent : c.textSecondary;
  return (
    <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: c.textSecondary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: c.textPrimary }]}>
          {value} {unit}
        </Text>
      </View>
      <Ionicons name={trendIcon} size={20} color={trendColor} />
    </View>
  );
}

/**
 * Dashboard de Sensores.
 * Grafico de linha com 3 series (temperatura, pressao, radiacao),
 * leituras atuais em cards e indicador de tendencia por serie.
 */
export default function SensorsScreen(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);

  const data = state.sensorData.slice(-12);
  const temps = data.map((r) => r.temperature);
  const pressures = data.map((r) => r.pressure);
  const radiations = data.map((r) => r.radiation);
  const latest = data[data.length - 1];

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.chartCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SensorChart
            title="Telemetria de sensores"
            labels={data.map(() => '')}
            series={[
              { data: temps, color: c.danger, legend: 'Temp (C)' },
              { data: pressures, color: c.primary, legend: 'Pressao (kPa)' },
              { data: radiations, color: c.accent, legend: 'Radiacao' },
            ]}
            height={240}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Leituras atuais</Text>
        <ReadingRow icon="thermometer" label="Temperatura do reator" value={latest?.temperature ?? '--'} unit="C" trend={detectTrend(temps)} color={c.danger} c={c} />
        <ReadingRow icon="speedometer" label="Pressao interna" value={latest?.pressure ?? '--'} unit="kPa" trend={detectTrend(pressures)} color={c.primary} c={c} />
        <ReadingRow icon="radio-outline" label="Radiacao" value={latest?.radiation ?? '--'} unit="mSv/h" trend={detectTrend(radiations)} color={c.accent} c={c} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  chartCard: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: spacing.sm, fontFamily: FONT.mono },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 12, fontFamily: FONT.mono },
  rowValue: { fontSize: 18, fontWeight: '700', fontFamily: FONT.mono },
});
