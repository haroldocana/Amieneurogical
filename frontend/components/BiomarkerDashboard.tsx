import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { UsbHardwareDiagnosticModal } from './UsbHardwareDiagnosticModal';
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
import { Gauge, Activity, Cpu, Moon, Zap, Users, Brain, HeartPulse, Usb } from 'lucide-react';

interface BiomarkerDashboardProps {
  patient: PatientRecord;
}

export const BiomarkerDashboard: React.FC<BiomarkerDashboardProps> = ({ patient }) => {
  const [isUsbModalOpen, setIsUsbModalOpen] = useState(false);

  // Functional Areas data for Radar
  const functionalData = [
    { subject: 'Sueño', score: patient.functionalAreas.sleep, fullMark: 100 },
    { subject: 'Apetito', score: patient.functionalAreas.appetite, fullMark: 100 },
    { subject: 'Energía', score: patient.functionalAreas.energy, fullMark: 100 },
    { subject: 'Social', score: patient.functionalAreas.social, fullMark: 100 },
    { subject: 'Atención', score: patient.functionalAreas.attention, fullMark: 100 },
  ];

  // QEEG Z-scores
  const qeegData = patient.qeegZScores
    ? [
        { metric: 'Theta/Beta Frontal', z: patient.qeegZScores.frontalThetaBetaRatio },
        { metric: 'Asimetría Temp.', z: patient.qeegZScores.temporalAsymmetry },
        { metric: 'Actividad Delta (Z)', z: patient.qeegZScores.deltaSlowActivityZ },
        { metric: 'Frec. Pico Alfa', z: (patient.qeegZScores.alphaPeakFrequencyHz - 10) / 1.5 }
      ]
    : [];

  const sadScore = patient.psychometricScores.sadPersons ?? 0;
  const isHighRisk = sadScore >= 6;

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

          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-sky-300 border border-slate-700">
            Triangulación Activa
          </span>
        </div>
      </div>

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

      {/* Hardware Telemetry Strip */}
      {patient.neuromotorBiomarkers && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400">Latencia TR (USB)</div>
            <div className="text-base font-bold text-cyan-300 font-mono">
              {patient.neuromotorBiomarkers.reactionTimeMs} <span className="text-[10px] font-normal">ms</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {patient.neuromotorBiomarkers.reactionTimeMs > 400 ? '⚠️ Enlentecimiento psicomotor' : patient.neuromotorBiomarkers.reactionTimeMs < 210 ? '⚡ Taquipsiquia/Impulsividad' : 'Rango Normal (220-350ms)'}
            </div>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400">Control Inhibitorio (Falsas Alarmas)</div>
            <div className={`text-base font-bold font-mono ${patient.neuromotorBiomarkers.commissionErrors > 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {patient.neuromotorBiomarkers.commissionErrors} <span className="text-[10px] font-normal">comisiones</span>
            </div>
            <div className="text-[10px] text-slate-500">Frenado orbitofrontal</div>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400">Lapsos Atencionales (Omisiones)</div>
            <div className={`text-base font-bold font-mono ${patient.neuromotorBiomarkers.omissionErrors > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {patient.neuromotorBiomarkers.omissionErrors} <span className="text-[10px] font-normal">omisiones</span>
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
      )}

      {/* USB Hardware Diagnostic Modal */}
      <UsbHardwareDiagnosticModal
        isOpen={isUsbModalOpen}
        onClose={() => setIsUsbModalOpen(false)}
      />
    </div>
  );
};
