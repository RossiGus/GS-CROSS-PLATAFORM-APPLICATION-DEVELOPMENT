import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import SensorChart from '@/components/SensorChart';
import StatusIndicator from '@/components/StatusIndicator';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission, type LinkStatus } from '@/context/MissionContext';
import { clamp } from '@/utils/predictions';

/** Mapeia o status do link para rotulo e cor. */
function linkInfo(status: LinkStatus | undefined, c: ReturnType<typeof getColors>) {
  switch (status) {
    case 'lost':
      return { label: 'LOST', color: c.danger };
    case 'degraded':
      return { label: 'DEGRADED', color: c.warning };
    default:
      return { label: 'ACTIVE', color: c.success };
  }
}

/** Gauge circular (SVG) de qualidade de sinal de 0 a 100%. */
function SignalGauge({ quality, c }: { quality: number; c: ReturnType<typeof getColors> }): React.JSX.Element {
  const size = 150;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - quality / 100);
  const color = quality > 60 ? c.accent : quality > 30 ? c.warning : c.danger;

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.gaugeCenter}>
        <Text style={[styles.gaugeValue, { color: c.textPrimary }]}>{quality.toFixed(0)}%</Text>
        <Text style={[styles.gaugeLabel, { color: c.textSecondary }]}>QUALIDADE</Text>
      </View>
    </View>
  );
}

/**
 * Dashboard de Comunicacao.
 * Latencia atual + historico, gauge de qualidade de sinal, status do link
 * de telemetria e contadores de pacotes com taxa de erro.
 */
export default function CommunicationScreen(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);

  const data = state.commData.slice(-12);
  const latest = data[data.length - 1];
  const latencies = data.map((r) => r.latency);
  const quality = latest ? clamp(((latest.signalStrength + 110) / 65) * 100, 0, 100) : 0;
  const link = linkInfo(latest?.linkStatus, c);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status do link */}
        <View style={[styles.card, styles.linkCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View>
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>LINK DE TELEMETRIA</Text>
            <StatusIndicator color={link.color} label={link.label} pulse={latest?.linkStatus !== 'active'} size={12} />
          </View>
          <View style={styles.latencyBox}>
            <Text style={[styles.latencyValue, { color: c.primary }]}>{latest?.latency ?? '--'}</Text>
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>ms latencia</Text>
          </View>
        </View>

        {/* Gauge de sinal */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, alignItems: 'center' }]}>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Qualidade do sinal</Text>
          <SignalGauge quality={quality} c={c} />
          <Text style={[styles.signalDbm, { color: c.textSecondary }]}>{latest?.signalStrength ?? '--'} dBm</Text>
        </View>

        {/* Historico de latencia */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SensorChart
            title="Historico de latencia (ms)"
            labels={data.map(() => '')}
            series={[{ data: latencies, color: c.primary, legend: 'Latencia' }]}
            yAxisSuffix="ms"
            height={200}
          />
        </View>

        {/* Pacotes */}
        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statValue, { color: c.accent }]}>{latest?.packetsSent ?? '--'}</Text>
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>Enviados</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statValue, { color: c.primary }]}>{latest?.packetsReceived ?? '--'}</Text>
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>Recebidos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statValue, { color: (latest?.errorRate ?? 0) > 10 ? c.danger : c.success }]}>
              {latest?.errorRate ?? '--'}%
            </Text>
            <Text style={[styles.cardLabel, { color: c.textSecondary }]}>Taxa de erro</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  linkCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 11, letterSpacing: 1, fontFamily: FONT.mono, marginTop: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: spacing.md, fontFamily: FONT.mono },
  latencyBox: { alignItems: 'flex-end' },
  latencyValue: { fontSize: 28, fontWeight: '700', fontFamily: FONT.mono },
  gaugeWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  gaugeCenter: { position: 'absolute', alignItems: 'center' },
  gaugeValue: { fontSize: 28, fontWeight: '700', fontFamily: FONT.mono },
  gaugeLabel: { fontSize: 10, letterSpacing: 1, fontFamily: FONT.mono },
  signalDbm: { fontSize: 14, marginTop: spacing.sm, fontFamily: FONT.mono },
  grid: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', fontFamily: FONT.mono },
});
