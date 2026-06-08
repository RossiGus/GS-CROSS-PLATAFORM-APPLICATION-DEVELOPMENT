import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { DEFAULT_THRESHOLDS, type Thresholds } from '@/constants/thresholds';
import { type ThemeMode } from '@/constants/theme';
import { loadPersistedState, persistState } from '@/utils/storage';

/* -------------------------------------------------------------------------- */
/*                              Tipos de dominio                              */
/* -------------------------------------------------------------------------- */

/** Status geral da missao, derivado dos alertas ativos. */
export type MissionStatus = 'nominal' | 'warning' | 'critical';

/** Nivel de criticidade de um alerta. */
export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

/** Estado de um link de telemetria. */
export type LinkStatus = 'active' | 'degraded' | 'lost';

/** Leitura instantanea dos sensores. */
export interface SensorReading {
  timestamp: number;
  /** Temperatura do reator em C. */
  temperature: number;
  /** Pressao interna em kPa. */
  pressure: number;
  /** Radiacao em mSv/h. */
  radiation: number;
}

/** Leitura instantanea do subsistema de energia. */
export interface EnergyReading {
  timestamp: number;
  /** Consumo da propulsao em W. */
  propulsion: number;
  /** Consumo da comunicacao em W. */
  communication: number;
  /** Consumo do suporte de vida em W. */
  lifeSupport: number;
  /** Consumo da computacao em W. */
  computing: number;
  /** Carga dos paineis solares em %. */
  solarCharge: number;
  /** Energia total disponivel em %. */
  totalEnergy: number;
  /** Autonomia estimada em horas. */
  autonomyHours: number;
}

/** Leitura instantanea do subsistema de comunicacao. */
export interface CommReading {
  timestamp: number;
  /** Latencia em ms. */
  latency: number;
  /** Forca do sinal em dBm. */
  signalStrength: number;
  /** Estado do link de telemetria. */
  linkStatus: LinkStatus;
  /** Pacotes enviados no ciclo. */
  packetsSent: number;
  /** Pacotes recebidos no ciclo. */
  packetsReceived: number;
  /** Taxa de erro em %. */
  errorRate: number;
}

/** Alerta gerado pelo monitoramento. */
export interface Alert {
  id: string;
  type: string;
  message: string;
  level: AlertLevel;
  timestamp: number;
  read: boolean;
}

/** Estado global da missao. */
export interface MissionState {
  missionName: string;
  status: MissionStatus;
  sensorData: SensorReading[];
  energyData: EnergyReading[];
  commData: CommReading[];
  alerts: Alert[];
  thresholds: Thresholds;
  /** Preferencia de notificacoes (diferencial). */
  notificationsEnabled: boolean;
  /** Modo de tema (diferencial dark/light). */
  themeMode: ThemeMode;
  /** Chave de API para a analise por IA (diferencial). */
  apiKey: string;
  /** Indica se o estado persistido ja foi carregado. */
  hydrated: boolean;
}

/** Acoes suportadas pelo reducer. */
export type MissionAction =
  | { type: 'UPDATE_SENSOR'; payload: SensorReading }
  | { type: 'UPDATE_ENERGY'; payload: EnergyReading }
  | { type: 'UPDATE_COMM'; payload: CommReading }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'MARK_ALERTS_READ' }
  | { type: 'UPDATE_THRESHOLDS'; payload: Partial<Thresholds> }
  | { type: 'SET_MISSION_NAME'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'HYDRATE'; payload: Partial<MissionState> };

/* -------------------------------------------------------------------------- */
/*                                  Constantes                                */
/* -------------------------------------------------------------------------- */

/** Numero maximo de leituras mantidas por serie (janela deslizante). */
export const MAX_READINGS = 30;
/** Numero maximo de alertas persistidos. */
export const MAX_ALERTS = 50;

const initialState: MissionState = {
  missionName: 'Artemis Orbital',
  status: 'nominal',
  sensorData: [],
  energyData: [],
  commData: [],
  alerts: [],
  thresholds: DEFAULT_THRESHOLDS,
  notificationsEnabled: true,
  themeMode: 'dark',
  apiKey: '',
  hydrated: false,
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Mantem apenas os ultimos `max` itens de um array. */
function trim<T>(arr: T[], max: number): T[] {
  return arr.length > max ? arr.slice(arr.length - max) : arr;
}

/** Deriva o status geral a partir dos alertas ativos (nao lidos/nao dispensados). */
function deriveStatus(alerts: Alert[]): MissionStatus {
  const hasCritical = alerts.some((a) => a.level === 'critical' || a.level === 'high');
  if (hasCritical) return 'critical';
  const hasWarning = alerts.some((a) => a.level === 'medium' || a.level === 'low');
  return hasWarning ? 'warning' : 'nominal';
}

/* -------------------------------------------------------------------------- */
/*                                   Reducer                                  */
/* -------------------------------------------------------------------------- */

/** Reducer puro que controla todas as transicoes do estado da missao. */
export function missionReducer(state: MissionState, action: MissionAction): MissionState {
  switch (action.type) {
    case 'UPDATE_SENSOR':
      return { ...state, sensorData: trim([...state.sensorData, action.payload], MAX_READINGS) };

    case 'UPDATE_ENERGY':
      return { ...state, energyData: trim([...state.energyData, action.payload], MAX_READINGS) };

    case 'UPDATE_COMM':
      return { ...state, commData: trim([...state.commData, action.payload], MAX_READINGS) };

    case 'ADD_ALERT': {
      const alerts = trim([action.payload, ...state.alerts], MAX_ALERTS);
      return { ...state, alerts, status: deriveStatus(alerts) };
    }

    case 'DISMISS_ALERT': {
      const alerts = state.alerts.filter((a) => a.id !== action.payload);
      return { ...state, alerts, status: deriveStatus(alerts) };
    }

    case 'MARK_ALERTS_READ':
      return { ...state, alerts: state.alerts.map((a) => ({ ...a, read: true })) };

    case 'UPDATE_THRESHOLDS':
      return { ...state, thresholds: { ...state.thresholds, ...action.payload } };

    case 'SET_MISSION_NAME':
      return { ...state, missionName: action.payload };

    case 'SET_NOTIFICATIONS':
      return { ...state, notificationsEnabled: action.payload };

    case 'SET_THEME':
      return { ...state, themeMode: action.payload };

    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };

    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };

    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

interface MissionContextValue {
  state: MissionState;
  dispatch: React.Dispatch<MissionAction>;
}

const MissionContext = createContext<MissionContextValue | undefined>(undefined);

/**
 * Provider do estado global da missao.
 * Carrega o estado persistido na inicializacao e salva automaticamente
 * as informacoes relevantes (thresholds, nome, alertas e preferencias).
 */
export function MissionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(missionReducer, initialState);
  const hydratedRef = useRef(false);

  // Carrega o estado persistido uma unica vez.
  useEffect(() => {
    let active = true;
    (async () => {
      const persisted = await loadPersistedState();
      if (active) {
        dispatch({ type: 'HYDRATE', payload: persisted });
        hydratedRef.current = true;
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persiste os campos relevantes sempre que mudarem (apos hidratacao).
  useEffect(() => {
    if (!state.hydrated) return;
    void persistState({
      missionName: state.missionName,
      thresholds: state.thresholds,
      alerts: state.alerts,
      notificationsEnabled: state.notificationsEnabled,
      themeMode: state.themeMode,
      apiKey: state.apiKey,
    });
  }, [
    state.hydrated,
    state.missionName,
    state.thresholds,
    state.alerts,
    state.notificationsEnabled,
    state.themeMode,
    state.apiKey,
  ]);

  return <MissionContext.Provider value={{ state, dispatch }}>{children}</MissionContext.Provider>;
}

/** Hook de acesso ao contexto da missao. Lanca erro se usado fora do Provider. */
export function useMission(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) {
    throw new Error('useMission deve ser usado dentro de um MissionProvider');
  }
  return ctx;
}
