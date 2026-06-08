import { useEffect, useRef } from 'react';
import { useMission, type LinkStatus } from '@/context/MissionContext';
import { clamp, estimateAutonomyHours } from '@/utils/predictions';

/** Intervalo de atualizacao da telemetria simulada (ms). */
const TICK_MS = 2000;

/** Aplica um passeio aleatorio limitado a um valor (random walk). */
function walk(value: number, step: number, min: number, max: number): number {
  const next = value + (Math.random() - 0.5) * step * 2;
  return clamp(next, min, max);
}

/** Estado interno da simulacao mantido entre ticks. */
interface SimState {
  temperature: number;
  pressure: number;
  radiation: number;
  propulsion: number;
  communication: number;
  lifeSupport: number;
  computing: number;
  solarCharge: number;
  totalEnergy: number;
  latency: number;
  signalStrength: number;
  packetsSent: number;
  packetsReceived: number;
}

const seed: SimState = {
  temperature: 68,
  pressure: 101,
  radiation: 3.2,
  propulsion: 820,
  communication: 240,
  lifeSupport: 380,
  computing: 160,
  solarCharge: 78,
  totalEnergy: 82,
  latency: 540,
  signalStrength: -62,
  packetsSent: 0,
  packetsReceived: 0,
};

/**
 * Hook que gera telemetria espacial simulada a cada 2 segundos e despacha
 * as leituras (sensores, energia e comunicacao) para o estado global.
 * Deve ser montado uma unica vez (no layout raiz, dentro do Provider).
 */
export function useSimulatedData(): void {
  const { dispatch } = useMission();
  const ref = useRef<SimState>({ ...seed });

  useEffect(() => {
    const id = setInterval(() => {
      const s = ref.current;
      const now = Date.now();

      // --- Sensores ---
      s.temperature = walk(s.temperature, 2.5, 55, 105);
      s.pressure = walk(s.pressure, 1.2, 88, 110);
      s.radiation = walk(s.radiation, 0.6, 0.5, 12);
      dispatch({
        type: 'UPDATE_SENSOR',
        payload: {
          timestamp: now,
          temperature: round(s.temperature),
          pressure: round(s.pressure),
          radiation: round(s.radiation),
        },
      });

      // --- Energia ---
      s.propulsion = walk(s.propulsion, 40, 400, 1200);
      s.communication = walk(s.communication, 20, 120, 400);
      s.lifeSupport = walk(s.lifeSupport, 15, 280, 460);
      s.computing = walk(s.computing, 12, 90, 280);
      s.solarCharge = walk(s.solarCharge, 3, 20, 100);
      s.totalEnergy = walk(s.totalEnergy, 2.5, 8, 100);
      const totalConsumption = s.propulsion + s.communication + s.lifeSupport + s.computing;
      dispatch({
        type: 'UPDATE_ENERGY',
        payload: {
          timestamp: now,
          propulsion: round(s.propulsion),
          communication: round(s.communication),
          lifeSupport: round(s.lifeSupport),
          computing: round(s.computing),
          solarCharge: round(s.solarCharge),
          totalEnergy: round(s.totalEnergy),
          autonomyHours: estimateAutonomyHours(s.solarCharge, totalConsumption),
        },
      });

      // --- Comunicacao ---
      s.latency = walk(s.latency, 60, 120, 1400);
      s.signalStrength = walk(s.signalStrength, 4, -110, -45);
      const sent = Math.round(walk(140, 40, 60, 220));
      const errorRate = round(clamp((-s.signalStrength - 55) * 0.4 + Math.random() * 2, 0, 35));
      const received = Math.max(0, Math.round(sent * (1 - errorRate / 100)));
      const linkStatus: LinkStatus =
        s.signalStrength < -95 ? 'lost' : s.signalStrength < -80 ? 'degraded' : 'active';
      dispatch({
        type: 'UPDATE_COMM',
        payload: {
          timestamp: now,
          latency: round(s.latency),
          signalStrength: round(s.signalStrength),
          linkStatus,
          packetsSent: sent,
          packetsReceived: received,
          errorRate,
        },
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [dispatch]);
}

/** Arredonda para uma casa decimal. */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}
