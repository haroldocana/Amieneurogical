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

  // Extraer datos qEEG del paciente de forma 100% segura
  const qeegData = patient?.qeegBiomarkers?.regionalZScores || {
    frontal: { region: 'Frontal', deltaZ: 0, thetaZ: 0, alfaZ: 0, betaZ: 0, highBetaZ: 0 },
    parietal: { region: 'Parietal', deltaZ: 0, thetaZ: 0, alfaZ: 0, betaZ: 0, highBetaZ: 0 },
    temporal: { region: 'Temporal', deltaZ: 0, thetaZ: 0, alfaZ: 0, betaZ: 0, highBetaZ: 0 },
    occipital: { region: 'Occipital', deltaZ: 0, thetaZ: 0, alfaZ: 0, betaZ: 0, highBetaZ: 0 }
  };

  // Extraer el Z-Score específico tolerando tanto "alfaZ" como "alphaZ"
  const getZScoreForBand = (region: keyof typeof qeegData) => {
    const regionObj = qeegData[region] as Record<string, any>;
    if (!regionObj) return 0;

    let key = `${activeBand}Z`;
    if (activeBand === 'alfa' && regionObj['alphaZ'] !== undefined) {
      key = 'alphaZ';
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
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
              onClick={() => setViewAngle(angle)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition ${
                viewAngle === angle ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {angle === 'top' ? 'Superior' : angle === 'front' ? 'Frontal' : angle === 'side' ? 'Lateral' : 'Iso 3D'}
            </button>
          ))}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 border-l border-slate-800 ml-1 ${
              isRotating ? 'text-indigo-400 bg-indigo-950/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            Girar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4" /> Selector de Banda Espectral
            </h3>
            <div className="flex flex-col gap-2">
              {(Object.keys(bandDetails) as FrequencyBand[]).map((band) => (
                <button
                  key={band}
                  onClick={() => setActiveBand(band)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition border ${
                    activeBand === band 
                      ? 'bg-gradient-to-r from-cyan-900/50 to-indigo-900/50 border-cyan-500/50 text-white shadow-lg shadow-cyan-900/20' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {bandDetails[band].name}
                </button>
              ))}
            </div>
            
            <div className="pt-3 mt-3 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-cyan-300">Relevancia Clínica:</strong> {bandDetails[activeBand].desc}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2">
              <Target className="w-4 h-4" /> Desviación Z-Score Regional
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(qeegData) as Array<keyof typeof qeegData>).map((region) => {
                const zScore = getZScoreForBand(region);
                return (
                  <div key={region} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{region}</span>
                    <span className={`text-lg font-black font-mono ${
                      zScore >= 1.5 ? 'text-rose-400' : zScore <= -1.5 ? 'text-blue-400' : 'text-emerald-400'
                    }`}>
                      {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}σ
                    </span>
                  </div>
                );
              })}
            </div>
            {patient?.qeegBiomarkers?.regionalZScores?.frontal?.interpretation && (
              <div className="mt-2 p-2 bg-rose-950/30 border border-rose-500/20 rounded text-[10px] text-rose-200 flex gap-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{patient.qeegBiomarkers.regionalZScores.frontal.interpretation}</span>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center min-h-[400px]">
          
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(6,182,212,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none z-10" />

          <div className="relative w-64 h-80 perspective-1000">
            <div className={`w-full h-full relative transition-transform duration-1000 transform-style-3d ${getTransformStyle()}`}>
              
              <div className="absolute inset-0 border-2 border-cyan-900/30 rounded-full shadow-[0_0_50px_rgba(6,182,212,0.1)_inset]" />

              {/* Lóbulo Frontal */}
              <div 
                className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-20 rounded-[50%] blur-md transition-colors duration-500"
                style={{ backgroundColor: getHeatmapColor(getZScoreForBand('frontal')), transform: 'translateZ(40px)' }}
              />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-white bg-black/50 px-1 rounded transform translate-z-[60px]">
                FRONTAL
              </div>

              {/* Lóbulo Parietal */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-24 rounded-[50%] blur-md transition-colors duration-500"
                style={{ backgroundColor: getHeatmapColor(getZScoreForBand('parietal')), transform: 'translateZ(30px)' }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white bg-black/50 px-1 rounded transform translate-z-[50px]">
                PARIETAL
              </div>

              {/* Lóbulo Temporal Izquierdo */}
              <div 
                className="absolute top-1/3 -left-4 w-16 h-28 rounded-[50%] blur-md transition-colors duration-500"
                style={{ backgroundColor: getHeatmapColor(getZScoreForBand('temporal')), transform: 'translateZ(20px)' }}
              />

              {/* Lóbulo Temporal Derecho */}
              <div 
                className="absolute top-1/3 -right-4 w-16 h-28 rounded-[50%] blur-md transition-colors duration-500"
                style={{ backgroundColor: getHeatmapColor(getZScoreForBand('temporal')), transform: 'translateZ(20px)' }}
              />

              {/* Lóbulo Occipital */}
              <div 
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-24 h-20 rounded-[50%] blur-md transition-colors duration-500"
                style={{ backgroundColor: getHeatmapColor(getZScoreForBand('occipital')), transform: 'translateZ(10px)' }}
              />
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-white bg-black/50 px-1 rounded transform translate-z-[40px]">
                OCCIPITAL
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-1 h-3/4 bg-cyan-400 blur-sm transform translate-z-[25px]" />
                <div className="w-3/4 h-1 bg-cyan-400 blur-sm absolute transform translate-z-[25px]" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-700 p-2 rounded-lg backdrop-blur-sm">
            <span className="text-[9px] text-slate-400 font-bold block mb-1">LEYENDA (Z-SCORE)</span>
            <div className="flex items-center gap-1 text-[9px] font-mono">
              <div className="w-3 h-3 bg-rose-500 rounded-sm" /> <span>&gt; +2σ (Hiper)</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono mt-1">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm" /> <span>Normal</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono mt-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" /> <span>&lt; -2σ (Hipo)</span>
            </div>
          </div>

          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div className="text-cyan-300 font-mono font-bold text-sm tracking-wider uppercase">
              BANDA: {activeBand}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
