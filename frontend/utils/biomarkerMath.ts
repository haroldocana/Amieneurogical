/**
 * Calcula el Índice de Habituación H a partir de una serie de picos de GSR
 * H = (Pico Inicial - Pico Final) / Tiempo de Exposición
 */
export const calculateHabituationIndex = (gsrSeries: number[], durationSec: number): number => {
  if (gsrSeries.length < 2 || durationSec <= 0) return 0;
  const initialPeak = Math.max(...gsrSeries.slice(0, Math.floor(gsrSeries.length / 3)));
  const finalLevel = gsrSeries[gsrSeries.length - 1];
  const h = (initialPeak - finalLevel) / (durationSec / 60);
  return Number(Math.max(0, h).toFixed(2));
};

/**
 * Clasifica la respuesta autonómica según la Variabilidad Cardíaca (RMSSD)
 */
export const classifyVagalTone = (rmssdMs: number): { label: string; color: string } => {
  if (rmssdMs < 20) return { label: 'Rigidez Parasimpática / Alto Estrés', color: 'text-rose-400' };
  if (rmssdMs <= 45) return { label: 'Tono Vagal Moderado', color: 'text-amber-400' };
  return { label: 'Alta Regulación Parasimpática', color: 'text-emerald-400' };
};
