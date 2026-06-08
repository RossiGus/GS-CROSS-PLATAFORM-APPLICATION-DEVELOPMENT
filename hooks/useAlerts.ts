import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  useMission,
  type Alert,
  type AlertLevel,
  type CommReading,
  type EnergyReading,
  type SensorReading,
} from '@/context/MissionContext';
import type { Thresholds } from '@/constants/thresholds';

/** Tempo minimo (ms) entre alertas repetidos do mesmo tipo, evita flood. */
const COOLDOWN_MS = 12000;

/** Gera um identificador unico no formato uuid-v4 simplificado. */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Avalia as leituras mais recentes e devolve os alertas que devem existir. */
function evaluate(
  sensor: SensorReading | undefined,
  energy: EnergyReading | undefined,
  comm: CommReading | undefined,
  t: Thresholds,
): Array<{ type: string; level: AlertLevel; message: string }> {
  const out: Array<{ type: string; level: AlertLevel; message: string }> = [];

  if (sensor) {
    if (sensor.temperature > t.tempMax + 10) {
      out.push({
        type: 'temperature',
        level: 'critical',
        message: `Temperatura critica do reator: ${sensor.temperature}C`,
      });
    } else if (sensor.temperature > t.tempMax) {
      out.push({
        type: 'temperature',
        level: 'high',
        message: `Temperatura elevada do reator: ${sensor.temperature}C`,
      });
    }
    if (sensor.pressure < t.pressureMin) {
      out.push({
        type: 'pressure',
        level: 'medium',
        message: `Pressao abaixo do limite: ${sensor.pressure} kPa`,
      });
    }
    if (sensor.radiation > 9) {
      out.push({
        type: 'radiation',
        level: 'high',
        message: `Radiacao elevada detectada: ${sensor.radiation} mSv/h`,
      });
    }
  }

  if (energy) {
    if (energy.totalEnergy < t.energyMin / 2) {
      out.push({
        type: 'energy',
        level: 'high',
        message: `Energia critica: ${energy.totalEnergy}% restante`,
      });
    } else if (energy.totalEnergy < t.energyMin) {
      out.push({
        type: 'energy',
        level: 'medium',
        message: `Energia baixa: ${energy.totalEnergy}% restante`,
      });
    }
  }

  if (comm) {
    if (comm.signalStrength < t.signalMin - 15) {
      out.push({
        type: 'signal',
        level: 'critical',
        message: `Sinal perdido: ${comm.signalStrength} dBm`,
      });
    } else if (comm.signalStrength < t.signalMin) {
      out.push({
        type: 'signal',
        level: 'medium',
        message: `Sinal degradado: ${comm.signalStrength} dBm`,
      });
    }
  }

  return out;
}

/**
 * Hook que monitora os limiares a cada novo ciclo de dados, gera alertas e
 * dispara notificacao local quando um alerta CRITICAL e criado.
 * Deve ser montado uma unica vez (no layout raiz, dentro do Provider).
 */
export function useAlerts(): void {
  const { state, dispatch } = useMission();
  const lastFired = useRef<Record<string, number>>({});

  const latestSensor = state.sensorData[state.sensorData.length - 1];
  const latestEnergy = state.energyData[state.energyData.length - 1];
  const latestComm = state.commData[state.commData.length - 1];

  useEffect(() => {
    const findings = evaluate(latestSensor, latestEnergy, latestComm, state.thresholds);
    const now = Date.now();

    for (const finding of findings) {
      const key = `${finding.type}:${finding.level}`;
      const last = lastFired.current[key] ?? 0;
      if (now - last < COOLDOWN_MS) continue;
      lastFired.current[key] = now;

      const alert: Alert = {
        id: generateId(),
        type: finding.type,
        level: finding.level,
        message: finding.message,
        timestamp: now,
        read: false,
      };
      dispatch({ type: 'ADD_ALERT', payload: alert });

      if (finding.level === 'critical' && state.notificationsEnabled) {
        void Notifications.scheduleNotificationAsync({
          content: {
            title: 'OrbitWatch - Alerta CRITICO',
            body: finding.message,
            sound: true,
          },
          trigger: null,
        }).catch((error) => {
          if (__DEV__) {
            console.warn('[useAlerts] falha ao notificar', error);
          }
        });
      }
    }
    // Reavalia sempre que chegar uma nova leitura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSensor, latestEnergy, latestComm]);
}
