import type { CommReading, SensorReading } from '@/context/MissionContext';

/** Direcao de tendencia de uma serie temporal. */
export type Trend = 'up' | 'down' | 'stable';

/**
 * Calcula a regressao linear simples (metodo dos minimos quadrados) sobre
 * uma serie de valores e projeta o proximo ponto.
 * Retorna o valor previsto para o indice seguinte ao ultimo.
 */
export function predictNext(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return values[n - 1];

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return slope * n + intercept;
}

/**
 * Determina a tendencia comparando a media da primeira metade da serie
 * com a media da segunda metade.
 */
export function detectTrend(values: number[], epsilon = 0.5): Trend {
  if (values.length < 4) return 'stable';
  const mid = Math.floor(values.length / 2);
  const first = average(values.slice(0, mid));
  const second = average(values.slice(mid));
  const delta = second - first;
  if (delta > epsilon) return 'up';
  if (delta < -epsilon) return 'down';
  return 'stable';
}

/** Media aritmetica de uma serie de numeros. */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

/** Limita um valor ao intervalo [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Estima a estabilidade orbital (0-100%) combinando temperatura do reator
 * e qualidade do sinal. Quanto mais proximo do regime ideal (temp ~70C,
 * sinal ~-60dBm), maior a estabilidade. E um modelo preditivo heuristico.
 */
export function computeOrbitalStability(
  sensor: SensorReading | undefined,
  comm: CommReading | undefined,
): number {
  if (!sensor || !comm) return 100;
  const tempPenalty = Math.abs(sensor.temperature - 70) * 0.6;
  const signalPenalty = Math.max(0, -comm.signalStrength - 60) * 0.5;
  const radiationPenalty = Math.max(0, sensor.radiation - 5) * 2;
  const stability = 100 - tempPenalty - signalPenalty - radiationPenalty;
  return Math.round(clamp(stability, 0, 100));
}

/**
 * Projeta a autonomia (horas) com base na carga solar atual e no consumo
 * total dos subsistemas. Usado no dashboard de energia.
 */
export function estimateAutonomyHours(
  solarChargePct: number,
  totalConsumptionW: number,
): number {
  const capacityWh = 5000 * (solarChargePct / 100);
  const drawW = Math.max(totalConsumptionW, 1);
  return Math.round((capacityWh / drawW) * 10) / 10;
}
