import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { 
  Layers, 
  Activity, 
  Zap, 
  RotateCcw,
  ShieldAlert,
  Target
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
}

type FrequencyBand = 'delta' | 'theta' | 'alfa' | 'beta' | 'highBeta';
type ViewAngle = 'top' | 'front' | 'side' | 'isometric';

export const HolographicNeuroViewer3D: React.FC<Props> = ({ patient }) => {
  const [activeBand, setActiveBand] = useState<FrequencyBand>('theta');
  const [viewAngle, setViewAngle] = useState<ViewAngle>('isometric');
  const [isRotating, setIsRotating] = useState(true);

  const p = patient as any;
  const qeegZ = p?.qeegZScores;
  const regionalZ = p?.qeegBiomarkers?.regionalZScores;

  // Generador de región por defecto con soporte para fallback de qeegZScores
  const buildRegion = (
    name: string,
    deltaDef = 0,
    thetaDef = 0,
    alfaDef = 0,
    betaDef = 0,
    highBetaDef = 0
  ) => ({
    region: name,
    deltaZ: deltaDef,
    thetaZ: thetaDef,
    alfaZ: alfaDef,
    betaZ: betaDef,
    highBetaZ: highBetaDef
  });

  // Normalización defensiva de las 4 regiones principales
  const qeegData = {
    frontal: regionalZ?.frontal || buildRegion(
      'Frontal',
      qeegZ?.deltaSlowActivityZ ?? 0.8,
      qeegZ?.frontalThetaBetaRatio ? (qeegZ.frontalThetaBetaRatio - 1.8) * 1.5 : 1.8,
      0.1,
      0.4,
      0.2
    ),
    parietal: regionalZ?.parietal || buildRegion('Parietal', 0.2, 0.4, 0.1, 0.3, 0.1),
    temporal: regionalZ?.temporal || buildRegion(
      'Temporal',
      0.3,
      0.5,
      qeegZ?.temporalAsymmetry ?? 0.4,
      0.2,
      0.1
    ),
    occipital: regionalZ?.occipital || buildRegion(
      'Occipital',
      0.1,
      0.2,
      qeegZ?.alphaPeakFrequencyHz ? (qeegZ.alphaPeakFrequencyHz - 10) / 1.5 : 0.0,
      0.1,
      0.0
    )
  };

  // Extraer el Z-Score específico tolerando tanto "alfaZ" como "alphaZ"
  const getZScoreForBand = (region: keyof typeof qeegData) => {
    const regionObj = qeegData[region] as Record<string, any>;
    if (!regionObj) return 0;

    let key = `${activeBand}Z`;
    if (activeBand === 'alfa') {
      if (regionObj['alphaZ'] !== undefined) {
        key = 'alphaZ';
      } else if (regionObj['alfaZ'] !== undefined) {
        key = 'alfaZ';
      }
    }
    return typeof regionObj[key] === 'number' ? regionObj[key] : 0;
  };

  // Mapear Z-Score a color
  const getHeatmapColor = (zScore: number) => {
    if (zScore >= 2.0) return 'rgba(225, 29, 72, 0.8)';   // Rose-600 (Muy alto)
    if (zScore >= 1.0) return 'rgba(245, 158, 11, 0.8)';  // Amber-500 (Alto)
    if (zScore <= -2.0) return 'rgba(37, 99, 235, 0.8)';  // Blue-600 (Muy bajo)
    if (zScore <= -1.0) return 'rgba(14, 165, 233, 0.8)'; // Sky-500 (Bajo)
    return 'rgba(16, 185, 129, 0.6)';                     // Emerald-500 (Normal)
  };

  const bandDetails = {
    delta: { name: 'Delta (1-4 Hz)', desc: 'Asociado a sueño profundo, patología de sustancia blanca o deterioro cognitivo agudo.' },
    theta: { name: 'Theta (4-8 Hz)', desc: 'Asociado a somnolencia, TDAH (ratio Theta/Beta alto) o estados hipnagógicos.' },
    alfa: { name: 'Alfa (8-12 Hz)', desc: 'Ritmo de reposo occipital. Su déficit indica hiperalerta; su exceso frontal, depresión.' },
    beta: { name: 'Beta (12-30 Hz)', desc: 'Atención activa y procesamiento cognitivo. Su exceso asimétrico indica ansiedad.' },
    highBeta: { name: 'High Beta (30+ Hz)', desc: 'Sobrecarga cognitiva, rumiación, hiperactivación de la amígdala y crisis de pánico.' }
  };

  const getTransformStyle = () => {
    const base = isRotating ? 'animate-[spin_20s_linear_infinite] ' : '';
    switch (viewAngle) {
      case 'top': return base + 'rotate-x-0 rotate-y-0';
      case 'front': return base + 'rotate-x-[70deg] rotate-z-[0deg]';
      case 'side': return base + 'rotate-x-[60deg] rotate-z-[90deg]';
      case 'isometric': return base + 'rotate-x-[60deg] rotate-z-[45deg]';
      default: return base;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-slate-100">
      
      {/* Header del Módulo */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-cyan-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Neuro-Holografía Topográfica 3D
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] rounded-full font-bold">
                QEEG Z-SCORE ENGINE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Mapeo de densidad espectral de potencia y asimetrías de fase por banda de frecuencia.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['top', 'front', 'side', 'isometric'] as ViewAngle[]).map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => setViewAngle(angle)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition cursor-pointer ${
                viewAngle === angle ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {angle === 'top' ? 'Superior' : angle === 'front' ? 'Frontal' : angle === 'side' ? 'Lateral' : 'Iso 3D'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 border-l border-slate-800 ml-1 cursor-pointer ${
              isRotating ? 'text-indigo-400 bg-indigo-950/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <RotateCcw className={`w-3.5 h-
