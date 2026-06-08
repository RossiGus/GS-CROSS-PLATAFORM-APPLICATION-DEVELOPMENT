import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StatusIndicator from '@/components/StatusIndicator';
import AlertBadge from '@/components/AlertBadge';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission, type MissionStatus } from '@/context/MissionContext';
import { average, computeOrbitalStability, estimateAutonomyHours } from '@/utils/predictions';

/** Mapeia o status para rotulo e cor. */
function statusInfo(status: MissionStatus, c: ReturnType<typeof getColors>) {
  switch (status) {
    case 'critical':
      return { label: 'CRITICAL', color: c.danger };
    case 'warning':
      return { label: 'WARNING', color: c.warning };
    default:
      return { label: 'NOMINAL', color: c.success };
  }
}

/** Linha de resumo (rotulo + valor). */
function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  return (
    <View style={[styles.row, { borderBottomColor: c.border }]}>
      <Text style={[styles.rowLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>{value}</Text>
    </View>
  );
}

/**
 * Detalhe da missao (rota Stack aninhada: /mission/[id]).
 * Mostra um resumo consolidado do estado atual: status, medias recentes,
 * autonomia estimada e os ultimos alertas registrados.
 */
export default function MissionDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const router = useRouter();

  const info = statusInfo(state.status, c);

  // Calcula medias e indicadores derivados a partir das ultimas leituras.
  const summary = useMemo(() => {
    const temps = state.sensorData.map((s) => s.temperature);
    const pressures = state.sensorData.map((s) => s.pressure);
    const radiations = state.sensorData.map((s) => s.radiation);
    const signals = state.commData.map((cm) => cm.signalStrength);
    const lastEnergy = state.energyData[state.energyData.length - 1];
    const lastSensor = state.sensorData[state.sensorData.length - 1];
    const lastComm = state.commData[state.commData.length - 1];

    const stability =
      lastSensor && lastComm ? computeOrbitalStability(lastSensor, lastComm) : 0;
    const autonomy = lastEnergy
      ? estimateAutonomyHours(
          lastEnergy.solarCharge,
          lastEnergy.propulsion +
            lastEnergy.communication +
            lastEnergy.lifeSupport +
            lastEnergy.computing,
        )
      : 0;

    return {
      avgTemp: average(temps),
      avgPressure: average(pressures),
      avgRadiation: average(radiations),
      avgSignal: average(signals),
      totalEnergy: lastEnergy?.totalEnergy ?? 0,
      stability,
      autonomy,
      readings: state.sensorData.length,
    };
  }, [state.sensorData, state.energyData, state.commData]);

  const recentAlerts = useMemo(
    () => [...state.alerts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
    [state.alerts],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: state.missionName || 'Missao',
          headerStyle: { backgroundColor: c.surface },
          headerTintColor: c.textPrimary,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cabecalho de status */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.missionName, { color: c.textPrimary }]}>
                {state.missionName || 'Missao sem nome'}
              </Text>
              <Text style={[styles.missionId, { color: c.textSecondary }]}>
                ID: {id ?? 'main'}
              </Text>
            </View>
            <StatusIndicator color={info.color} label={info.label} pulse={state.status !== 'nominal'} />
          </View>
        </View>

        {/* Indicadores consolidados */}
        <Text style={[styles.section, { color: c.textPrimary }]}>Resumo Telemetrico</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SummaryRow
            label="Temperatura media"
            value={`${summary.avgTemp.toFixed(1)} C`}
            color={c.textPrimary}
          />
          <SummaryRow
            label="Pressao media"
            value={`${summary.avgPressure.toFixed(1)} kPa`}
            color={c.textPrimary}
          />
          <SummaryRow
            label="Radiacao media"
            value={`${summary.avgRadiation.toFixed(2)} mSv/h`}
            color={c.textPrimary}
          />
          <SummaryRow
            label="Sinal medio"
            value={`${summary.avgSignal.toFixed(1)} dBm`}
            color={c.textPrimary}
          />
          <SummaryRow
            label="Energia total"
            value={`${summary.totalEnergy.toFixed(0)} %`}
            color={c.accent}
          />
          <SummaryRow
            label="Estabilidade orbital"
            value={`${summary.stability.toFixed(0)} %`}
            color={c.primary}
          />
          <SummaryRow
            label="Autonomia estimada"
            value={`${summary.autonomy.toFixed(1)} h`}
            color={c.success}
          />
          <View style={[styles.row, styles.rowLast]}>
            <Text style={[styles.rowLabel, { color: c.textSecondary }]}>Leituras coletadas</Text>
            <Text style={[styles.rowValue, { color: c.textSecondary }]}>{summary.readings}</Text>
          </View>
        </View>

        {/* Ultimos alertas */}
        <Text style={[styles.section, { color: c.textPrimary }]}>Ultimos Alertas</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {recentAlerts.length === 0 ? (
            <Text style={[styles.empty, { color: c.textSecondary }]}>
              Nenhum alerta registrado ate o momento.
            </Text>
          ) : (
            recentAlerts.map((alert) => (
              <View key={alert.id} style={[styles.alertRow, { borderBottomColor: c.border }]}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={[styles.alertMsg, { color: c.textPrimary }]}>{alert.message}</Text>
                  <Text style={[styles.alertTime, { color: c.textSecondary }]}>
                    {new Date(alert.timestamp).toLocaleTimeString('pt-BR')}
                  </Text>
                </View>
                <AlertBadge level={alert.level} />
              </View>
            ))
          )}
        </View>

        {/* Acao: abrir analise por IA */}
        <TouchableOpacity
          style={[styles.aiButton, { backgroundColor: c.primary }]}
          onPress={() => router.push('/ai')}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          <Text style={styles.aiButtonText}>Analisar com IA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  missionName: { fontSize: 18, fontFamily: FONT.mono, fontWeight: '700' },
  missionId: { fontSize: 12, fontFamily: FONT.mono, marginTop: 2 },
  section: {
    fontSize: 13,
    fontFamily: FONT.mono,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 13, fontFamily: FONT.mono },
  rowValue: { fontSize: 14, fontFamily: FONT.mono, fontWeight: '700' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  alertMsg: { fontSize: 13, fontFamily: FONT.mono },
  alertTime: { fontSize: 11, fontFamily: FONT.mono, marginTop: 2 },
  empty: { fontSize: 13, fontFamily: FONT.mono, textAlign: 'center', paddingVertical: spacing.md },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  aiButtonText: { color: '#FFFFFF', fontSize: 15, fontFamily: FONT.mono, fontWeight: '700' },
});
