/**
 * Limiares de alerta configuraveis pelo usuario.
 * Os campos abaixo sao os 4 editaveis no formulario de Configuracoes.
 * Os niveis "critical/high" sao derivados desses valores na logica de alertas.
 */
export interface Thresholds {
  /** Temperatura maxima aceitavel do reator em graus Celsius. */
  tempMax: number;
  /** Pressao minima aceitavel em kPa. */
  pressureMin: number;
  /** Energia total minima aceitavel em %. */
  energyMin: number;
  /** Sinal minimo aceitavel em dBm. */
  signalMin: number;
}

/** Valores padrao usados na primeira inicializacao do app. */
export const DEFAULT_THRESHOLDS: Thresholds = {
  tempMax: 85,
  pressureMin: 95,
  energyMin: 30,
  signalMin: -80,
};

/** Limites de validacao para os campos do formulario de configuracoes. */
export const THRESHOLD_LIMITS = {
  tempMax: { min: 40, max: 150, label: 'Temperatura maxima (C)' },
  pressureMin: { min: 50, max: 120, label: 'Pressao minima (kPa)' },
  energyMin: { min: 5, max: 90, label: 'Energia minima (%)' },
  signalMin: { min: -120, max: -40, label: 'Sinal minimo (dBm)' },
} as const;
