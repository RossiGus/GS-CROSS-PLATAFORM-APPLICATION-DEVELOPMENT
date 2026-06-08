import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THRESHOLDS, type Thresholds } from '@/constants/thresholds';
import type { Alert, MissionState } from '@/context/MissionContext';
import type { ThemeMode } from '@/constants/theme';

/** Chave unica usada para persistir o estado relevante do app. */
const STORAGE_KEY = '@orbitwatch/state/v1';

/** Subconjunto do estado que e efetivamente persistido em disco. */
export interface PersistedState {
  missionName: string;
  thresholds: Thresholds;
  alerts: Alert[];
  notificationsEnabled: boolean;
  themeMode: ThemeMode;
  apiKey: string;
}

/** Wrapper generico de leitura tipada do AsyncStorage. */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[storage] falha ao ler', key, error);
    }
    return null;
  }
}

/** Wrapper generico de escrita tipada no AsyncStorage. */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (__DEV__) {
      console.warn('[storage] falha ao gravar', key, error);
    }
  }
}

/** Remove uma chave do AsyncStorage. */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    if (__DEV__) {
      console.warn('[storage] falha ao remover', key, error);
    }
  }
}

/**
 * Carrega o estado persistido e devolve um objeto parcial pronto para
 * hidratar o reducer. Valores ausentes caem nos defaults.
 */
export async function loadPersistedState(): Promise<Partial<MissionState>> {
  const data = await getItem<PersistedState>(STORAGE_KEY);
  if (!data) {
    return {};
  }
  return {
    missionName: data.missionName ?? 'Artemis Orbital',
    thresholds: { ...DEFAULT_THRESHOLDS, ...(data.thresholds ?? {}) },
    alerts: Array.isArray(data.alerts) ? data.alerts : [],
    notificationsEnabled: data.notificationsEnabled ?? true,
    themeMode: data.themeMode ?? 'dark',
    apiKey: data.apiKey ?? '',
  };
}

/** Persiste o subconjunto relevante do estado. */
export async function persistState(state: PersistedState): Promise<void> {
  await setItem<PersistedState>(STORAGE_KEY, state);
}

/** Limpa completamente o estado persistido (uso em reset/debug). */
export async function clearPersistedState(): Promise<void> {
  await removeItem(STORAGE_KEY);
}
