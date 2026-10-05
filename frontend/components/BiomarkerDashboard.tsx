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
import { Cpu, Zap, HeartPulse, Usb, Activity } from 'lucide-react';

interface BiomarkerDashboardProps {
  patient?: PatientRecord;
}

export const BiomarkerDashboard: React.FC<BiomarkerDashboardProps> = ({ patient }) => {
  const [isUsbModalOpen, setIsUsbModalOpen] = useState(false);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (RECEPTOR EN PC DEL MÉDICO)
  // -------------------------------------------------------------------------
  const { liveData, isStreaming } = useVrTelemetryBridge('receiver', patient?.id || 'PAC-8104', 'ExecutiveControl');

  // 🛡️ Extraer con valores de respaldo seguros (Fallback defensivo)
  const functionalAreas = patient?.functionalAreas || {
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

  // QEEG Z-scores
  const qeegZ = patient?.qeegZScores;
  const qeegData = qeegZ
    ? [
        { metric: 'Theta/Beta Frontal', z: qeegZ.frontalThetaBetaRatio ?? 0 },
        { metric: 'Asimetría Temp.', z: qeegZ.temporalAsymmetry ?? 0 },
        { metric: 'Actividad Delta (Z)', z: qeegZ.deltaSlowActivityZ ?? 0 },
        { metric: 'Frec. Pico Alfa', z: ((qeegZ.alphaPeakFrequencyHz ?? 10) - 10) / 1.5 }
      ]
    : [];

  const sadScore = patient?.psychometricScores?.sadPersons ?? 0;
  const isHighRisk = sadScore >= 6;

  // Neuromotor Biomarkers (Mezclados con Telemetría VR en Tiempo Real si hay streaming activo)
  const neuromotor = patient?.neuromotorBiomarkers;

  const currentReactionTime = (isStreaming && liveData?.metrics?.reactionTimeMs !== undefined)
    ? liveData.metrics.reactionTimeMs
    : (neuromotor?.reactionTimeMs ?? 240);

  const currentCommissions = (isStreaming && liveData?.metrics?.commissions !== undefined)
    ? liveData.metrics.commissions
    : (neuromotor?.commissionErrors ?? 0);

  const currentOmissions = (isStreaming && liveData?.metrics?.omissions !== undefined)
    ? liveData.metrics.omissions
    : (neuromotor?.omissionErrors ?? 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Telemetría Bioclínica & Neurovegetativa
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUsbModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition"
            title="Verificar compatibilidad del Hardware USB"
          >
            <Usb className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hardware USB</span>
          </button>

          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono border ${
            isStreaming 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 animate-pulse' 
              : 'bg-slate-800 text-sky-300 border-slate-700'
          }`}>
            {isStreaming ? '● STREAMING VR EN VIVO' : 'Triangulación Activa'}
          </span>
        </div>
      </div>

      {/* 🔴 BANNER DE TRANSMISIÓN EN VIVO DESDE VR */}
      {isStreaming && liveData && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
            <Activity className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>RECEPTOR ACTIVADO — Telemetría en Vivo desde Visor Meta Quest 3 ({liveData.moduleName})</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-200">
            Latencia: <strong className="text-white">{liveData.metrics.reactionTimeMs} ms</strong> | Omisiones: <strong className="text-white">{liveData.metrics.omissions}</strong> | Comisiones: <strong className="text-white">{liveData.metrics.commissions}</strong>
          </div>
        </div>
      )}

      {/* Grid of metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart: Functional Areas */}
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

        {/* QEEG & Neuromotor Bar chart */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" /> Desviaciones Z-Score QEEG (σ)
            </span>
            <span className="text-[10px] text-slate-400">Norma = 0.0 ± 1.5</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qeegData} layout="vertical" margin={{ top: 5, right: 15, left: 25, bottom: 5 }}>
                <XAxis type="number" domain={[-3, 4]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="metric" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={85} />
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

      {/* Hardware Telemetry Strip (Sincronizado en tiempo real con el Visor VR) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Latencia TR ({isStreaming ? 'VR Stream' : 'USB'})</div>
          <div className="text-base font-bold text-cyan-300 font-mono">
            {currentReactionTime} <span className="text-[10px] font-normal">ms</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {currentReactionTime > 400 ? '⚠️ Enlentecimiento psicomotor' : currentReactionTime < 210 ? '⚡ Taquipsiquia/Impulsividad' : 'Rango Normal (220-350ms)'}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Control Inhibitorio (Falsas Alarmas)</div>
          <div className={`text-base font-bold font-mono ${currentCommissions > 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentCommissions} <span className="text-[10px] font-normal">comisiones</span>
          </div>
          <div className="text-[10px] text-slate-500">Frenado orbitofrontal</div>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Lapsos Atencionales (Omisiones)</div>
          <div className={`text-base font-bold font-mono ${currentOmissions > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentOmissions} <span className="text-[10px] font-normal">omisiones</span>
          </div>
          <div className="text-[10px] text-slate-500">Foco sostenido dorsolateral</div>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400">Riesgo SAD PERSONS</div>
          <div className={`text-base font-bold font-mono ${isHighRisk ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {sadScore} / 10
          </div>
          <div className="text-[10px] text-slate-500">
            {isHighRisk ? '🚨 Protocolo de Contención' : 'Riesgo Controlado'}
          </div>
        </div>
      </div>

      {/* USB Hardware Diagnostic Modal */}
      <UsbHardwareDiagnosticModal
        isOpen={isUsbModalOpen}
        onClose={() => setIsUsbModalOpen(false)}
      />
    </div>
  );
};
