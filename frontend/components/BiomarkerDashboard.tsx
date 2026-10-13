import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { UsbHardwareDiagnosticModal } from './UsbHardwareDiagnosticModal';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { Cpu, Zap, HeartPulse, Usb, Activity, Radio } from 'lucide-react';

interface BiomarkerDashboardProps {
  patient?: PatientRecord;
}

export const BiomarkerDashboard: React.FC<BiomarkerDashboardProps> = ({ patient }) => {
  const [isUsbModalOpen, setIsUsbModalOpen] = useState(false);

  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  // Conexión puente VR (Receptor en estación Chromebook / PC)
  const { liveData, isStreaming, isConnected } = useVrTelemetryBridge('receiver', patientId, 'ExecutiveControl');

  const streamingActive = Boolean(isStreaming || (isConnected && liveData));

  // Extracción con valores de respaldo defensivos
  const p = patient as any;
  const functionalAreas = p?.functionalAreas || {
    sleep: 50,
    appetite: 50,
    energy: 50,
    social: 50,
    attention: 50
  };

  const functionalData = [
    { subject: 'Sueño', score: functionalAreas.sleep ?? 50, fullMark: 100 },
    { subject: 'Apetito', score: functionalAreas.appetite ?? 50, fullMark: 100 },
    { subject: 'Energía', score: functionalAreas.energy ?? 50, fullMark: 100 },
    { subject: 'Social', score: functionalAreas.social ?? 50, fullMark: 100 },
    { subject: 'Atención', score: functionalAreas.attention ?? 50, fullMark: 100 },
  ];

  // QEEG Z-scores (con valores normativos baseline en caso de evaluación inicial)
  const qeegZ = p?.qeegZScores;
  const qeegData = qeegZ
    ? [
        { metric: 'Theta/Beta Frontal', z: qeegZ.frontalThetaBetaRatio ?? 1.8 },
        { metric: 'Asimetría Temp.', z: qeegZ.temporalAsymmetry ?? 0.4 },
        { metric: 'Actividad Delta (Z)', z: qeegZ.deltaSlowActivityZ ?? 0.8 },
        { metric: 'Frec. Pico Alfa', z: Number((((qeegZ.alphaPeakFrequencyHz ?? 10) - 10) / 1.5).toFixed(2)) }
      ]
    : [
        { metric: 'Theta/Beta Frontal', z: 1.8 },
        { metric: 'Asimetría Temp.', z: 0.2 },
        { metric: 'Actividad Delta (Z)', z: 0.5 },
        { metric: 'Frec. Pico Alfa', z: 0.0 }
      ];

  const sadScore = p?.psychometricScores?.sadPersons ?? 0;
  const isHighRisk = sadScore >= 6;

  // Extracción polimórfica y segura de telemetría sin riesgo de crash
  const neuromotor = p?.neuromotorBiomarkers;
  const liveMetrics = (liveData as any)?.metrics || (liveData as any);

  const currentReactionTime = (streamingActive && liveMetrics?.reactionTimeMs !== undefined)
    ? liveMetrics.reactionTimeMs
    : (neuromotor?.reactionTimeMs ?? 240);

  const currentCommissions = (streamingActive && liveMetrics?.commissions !== undefined)
    ? liveMetrics.commissions
    : (neuromotor?.commissionErrors ?? 2);

  const currentOmissions = (streamingActive && liveMetrics?.omissions !== undefined)
    ? liveMetrics.omissions
    : (neuromotor?.omissionErrors ?? 1);

  const moduleName = (liveData as any)?.moduleName || (liveData as any)?.mode || 'ExecutiveControl';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4 text-slate-100">
      {/* Encabezado del Módulo */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Telemetría Bioclínica &amp; Neurovegetativa
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUsbModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition cursor-pointer"
            title="Verificar compatibilidad del Hardware USB"
          >
            <Usb className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hardware USB</span>
          </button>

          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono border flex items-center gap-1.5 ${
            streamingActive 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 animate-pulse' 
              : 'bg-slate-800 text-sky-300 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${streamingActive ? 'bg-emerald-400 animate-ping' : 'bg-sky-400'}`} />
            {streamingActive ? 'STREAMING VR EN VIVO' : 'Triangulación Activa'}
          </span>
        </div>
      </div>

      {/* Banner de Transmisión en Vivo desde Pico 3 */}
      {streamingActive && liveData && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>ENLACE ACTIVO — Telemetría en Vivo desde Visor Pico 3 ({moduleName})</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-200">
            Latencia: <strong className="text-white">{currentReactionTime} ms</strong> | 
            Omisiones: <strong className="text-white">{currentOmissions}</strong> | 
            Comisiones: <strong className="text-white">{currentCommissions}</strong>
          </div>
        </div>
      )}

      {/* Rejilla de Gráficas: Radar Neurovegetativo + Z-Scores QEEG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar: Dominios Neurovegetativos */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Dominios Neurovegetativos
            </span>
            <span className="text-[10px] text-slate-400">Escala 0-100%</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={functionalData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar
                  name="Paciente"
                  dataKey="score"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras: Desviaciones Z-Score QEEG */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" /> Desviaciones Z-Score QEEG (σ)
            </span>
            <span className="text-[10px] text-slate-400">Norma = 0.0 ± 1.5σ</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qeegData} layout="vertical" margin={{ top: 5, right: 15, left: 25, bottom: 5 }}>
                <XAxis type="number" domain={[-4, 4]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="metric" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <ReferenceLine x={0} stroke="#475569" />
                <ReferenceLine x={2} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine x={-2} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar dataKey="z" radius={[0, 4, 4, 0]}>
                  {qeegData.map((entry, index) => {
                    const absZ = Math.abs(entry.z);
                    const color = absZ > 2 ? '#ef4444' : absZ > 1.5 ? '#f59e0b' : '#38bdf8';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tira de Telemetría Neuromotora y Psicométrica */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
        {/* Latencia TR */}
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Latencia TR ({streamingActive ? 'VR Stream' : 'USB'})</div>
          <div className="text-base font-bold text-cyan-300 font-mono">
            {currentReactionTime} <span className="text-[10px] font-normal">ms</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {currentReactionTime > 400 
              ? '⚠️ Enlentecimiento psicomotor' 
              : currentReactionTime < 210 
                ? '⚡ Taquipsiquia/Impulsividad' 
                : 'Rango Normal (220-350ms)'}
          </div>
        </div>

        {/* Control Inhibitorio */}
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Control Inhibitorio (Comisiones)</div>
          <div className={`text-base font-bold font-mono ${currentCommissions > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentCommissions} <span className="text-[10px] font-normal">comisiones</span>
          </div>
          <div className="text-[10px] text-slate-500">Frenado orbitofrontal</div>
        </div>

        {/* Lapsos Atencionales */}
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Lapsos Atencionales (Omisiones)</div>
          <div className={`text-base font-bold font-mono ${currentOmissions > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentOmissions} <span className="text-[10px] font-normal">omisiones</span>
          </div>
          <div className="text-[10px] text-slate-500">Foco sostenido dorsolateral</div>
        </div>

        {/* Riesgo SAD PERSONS */}
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Riesgo SAD PERSONS</div>
          <div className={`text-base font-bold font-mono ${isHighRisk ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            {sadScore} / 10
          </div>
          <div className="text-[10px] text-slate-500">
            {isHighRisk ? '🚨 Protocolo de Contención' : 'Riesgo Controlado'}
          </div>
        </div>
      </div>

      {/* Modal de Diagnóstico de Hardware USB */}
      <UsbHardwareDiagnosticModal
        isOpen={isUsbModalOpen}
        onClose={() => setIsUsbModalOpen(false)}
      />
    </div>
  );
};

export default BiomarkerDashboard;
