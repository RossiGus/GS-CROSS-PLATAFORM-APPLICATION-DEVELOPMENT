import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MetricCard from '@/components/MetricCard';
import SensorChart from '@/components/SensorChart';
import StatusIndicator from '@/components/StatusIndicator';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission, type MissionStatus } from '@/context/MissionContext';
import { computeOrbitalStability, detectTrend } from '@/utils/predictions';

/** Posicao da ISS retornada pela API where-the-iss-at. */
interface IssPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
}

/** Mapeia o status da missao para rotulo e cor. */
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

/**
 * Dashboard principal (Home).
 * Exibe status geral, 4 metricas-chave, mini grafico de temperatura e a
 * posicao real da ISS (com fallback offline).
 */
export default function HomeScreen(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const router = useRouter();

  const [iss, setIss] = useState<IssPosition | null>(null);
  const [issError, setIssError] = useState<boolean>(false);

  // Busca a posicao da ISS a cada 10s, com fallback se estiver offline.
  useEffect(() => {
    let active = true;
    async function fetchIss(): Promise<void> {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!res.ok) throw new Error('resposta invalida');
        const data = (await res.json()) as IssPosition;
        if (active) {
          setIss(data);
          setIssError(false);
        }
      } catch {
        if (active) setIssError(true);
      }
    }
    void fetchIss();
    const id = setInterval(fetchIss, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const sensor = state.sensorData[state.sensorData.length - 1];
  const energy = state.energyData[state.energyData.length - 1];
  const comm = state.commData[state.commData.length - 1];
  const stability = computeOrbitalStability(sensor, comm);
  const tempSeries = state.sensorData.slice(-10).map((r) => r.temperature);
  const tempTrend = detectTrend(tempSeries);
  const status = statusInfo(state.status, c);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabecalho */}
        <View style={[styles.statusCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.missionLabel, { color: c.textSecondary }]}>MISSAO ATIVA</Text>
            <Text style={[styles.missionName, { color: c.textPrimary }]} numberOfLines={1}>
              {state.missionName}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.color + '22', borderColor: status.color }]}>
            <StatusIndicator color={status.color} label={status.label} pulse={state.status !== 'nominal'} />
          </View>
        </View>

        {/* Posicao da ISS */}
        <View style={[styles.issCard, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
          <View style={styles.issHeader}>
            <Ionicons name="globe-outline" size={18} color={c.accent} />
            <Text style={[styles.issTitle, { color: c.textPrimary }]}>Posicao da ISS (tempo real)</Text>
          </View>
          {iss ? (
            <View style={styles.issGrid}>
              <IssStat label="Latitude" value={iss.latitude.toFixed(2)} c={c} />
              <IssStat label="Longitude" value={iss.longitude.toFixed(2)} c={c} />
              <IssStat label="Altitude" value={`${iss.altitude.toFixed(0)} km`} c={c} />
              <IssStat label="Velocidade" value={`${iss.velocity.toFixed(0)} km/h`} c={c} />
            </View>
          ) : (
            <Text style={[styles.issFallback, { color: c.textSecondary }]}>
              {issError ? 'Offline - usando telemetria simulada' : 'Carregando posicao orbital...'}
            </Text>
          )}
        </View>

        {/* Metricas principais */}
        <View style={styles.grid}>
          <MetricCard label="Temp. Reator" value={sensor?.temperature ?? '--'} unit="C" icon="thermometer" accentColor={c.danger} trend={tempTrend} delay={0} />
          <MetricCard label="Energia Total" value={energy?.totalEnergy ?? '--'} unit="%" icon="battery-charging" accentColor={c.success} delay={80} />
        </View>
        <View style={styles.grid}>
          <MetricCard label="Sinal" value={comm?.signalStrength ?? '--'} unit="dBm" icon="cellular" accentColor={c.primary} delay={160} />
          <MetricCard label="Estab. Orbital" value={stability} unit="%" icon="planet" accentColor={c.accent} delay={240} />
        </View>

        {/* Mini grafico de temperatura */}
        <View style={[styles.chartCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SensorChart
            title="Temperatura do reator - ultimas leituras"
            labels={tempSeries.map(() => '')}
            series={[{ data: tempSeries, color: c.danger, legend: 'Temp (C)' }]}
            yAxisSuffix="C"
            height={200}
          />
        </View>

        {/* Acoes */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/ai')}
          style={[styles.actionBtn, { backgroundColor: c.primary }]}
        >
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.actionText}>Analise por IA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/mission/main')}
          style={[styles.actionBtnOutline, { borderColor: c.border }]}
        >
          <Ionicons name="information-circle-outline" size={18} color={c.textPrimary} />
          <Text style={[styles.actionTextOutline, { color: c.textPrimary }]}>Detalhes da missao</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Pequeno bloco de estatistica da ISS. */
function IssStat({ label, value, c }: { label: string; value: string; c: ReturnType<typeof getColors> }): React.JSX.Element {
  return (
    <View style={styles.issStat}>
      <Text style={[styles.issStatLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.issStatValue, { color: c.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  missionLabel: { fontSize: 11, letterSpacing: 1, fontFamily: FONT.mono },
  missionName: { fontSize: 20, fontWeight: '700', marginTop: 2, fontFamily: FONT.mono },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1 },
  issCard: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  issHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  issTitle: { fontSize: 14, fontWeight: '600', fontFamily: FONT.mono },
  issGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  issStat: { width: '50%', marginBottom: spacing.sm },
  issStatLabel: { fontSize: 11, fontFamily: FONT.mono },
  issStatValue: { fontSize: 16, fontWeight: '700', fontFamily: FONT.mono },
  issFallback: { fontSize: 13, fontFamily: FONT.mono },
  grid: { flexDirection: 'row', gap: spacing.md },
  chartCard: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: FONT.mono },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionTextOutline: { fontSize: 15, fontWeight: '600', fontFamily: FONT.mono },
});
