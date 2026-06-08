import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';

/** Serie de dados do grafico. */
export interface ChartSeries {
  data: number[];
  /** Cor da linha (hex). */
  color: string;
  /** Rotulo da legenda. */
  legend?: string;
}

export interface SensorChartProps {
  /** Titulo opcional acima do grafico. */
  title?: string;
  /** Rotulos do eixo X. */
  labels: string[];
  /** Uma ou mais series de linha. */
  series: ChartSeries[];
  /** Altura do grafico. */
  height?: number;
  /** Sufixo do eixo Y (ex.: C, %, ms). */
  yAxisSuffix?: string;
  /** Usa curvas suaves (bezier). */
  bezier?: boolean;
}

/**
 * Wrapper tipado do grafico de linha (react-native-chart-kit).
 * Suporta multiplas series e adapta a largura via Dimensions.
 */
export default function SensorChart({
  title,
  labels,
  series,
  height = 220,
  yAxisSuffix = '',
  bezier = true,
}: SensorChartProps): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const width = Dimensions.get('window').width - spacing.lg * 2 - spacing.lg * 2;

  const hasData = series.some((s) => s.data.length > 0);

  if (!hasData) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
        <Text style={{ color: c.textSecondary, fontFamily: FONT.mono }}>Coletando telemetria...</Text>
      </View>
    );
  }

  const chartData = {
    labels,
    datasets: series.map((s) => ({
      data: s.data.length ? s.data : [0],
      color: (opacity = 1) => hexToRgba(s.color, opacity),
      strokeWidth: 2,
    })),
    legend: series.every((s) => s.legend) ? series.map((s) => s.legend as string) : undefined,
  };

  return (
    <View>
      {title ? <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text> : null}
      <LineChart
        data={chartData}
        width={Math.max(width, 280)}
        height={height}
        yAxisSuffix={yAxisSuffix}
        withInnerLines
        withOuterLines={false}
        bezier={bezier}
        chartConfig={{
          backgroundColor: c.surface,
          backgroundGradientFrom: c.surface,
          backgroundGradientTo: c.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => hexToRgba(c.primary, opacity),
          labelColor: (opacity = 1) => hexToRgba(c.textSecondary, opacity),
          propsForDots: { r: '3', strokeWidth: '1', stroke: c.background },
          propsForBackgroundLines: { stroke: c.border },
        }}
        style={styles.chart}
      />
    </View>
  );
}

/** Converte cor hexadecimal (#RRGGBB) em rgba com opacidade. */
function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontFamily: FONT.mono,
  },
  chart: {
    borderRadius: radius.md,
    marginVertical: spacing.sm,
  },
  placeholder: {
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
});
