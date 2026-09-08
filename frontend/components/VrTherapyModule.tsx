import React, { useState } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { Glasses, Activity, HeartPulse, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface VrTherapyModuleProps {
  patient: PatientRecord;
  onUpdatePatientVrData: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export const VrTherapyModule: React.FC<VrTherapyModuleProps> = ({ patient, onUpdatePatientVrData }) => {
  const [telemetry] = useState<VrTelemetryData>({
    sessionId: `VR-QUEST3S-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    gsrMicroSiemens: [1.2, 2.4, 4.8, 3.1, 1.9, 1.3],
    hrvRmssdMs: [45, 38, 22, 31, 42, 48],
    habituationIndexH: 2.84,
    stressPeaksCount: 2,
    exposureDurationSec: 300,
  });

  const [individualReport] = useState<VrTherapyReport>({
    sessionGuid: telemetry.sessionId,
    exposureType: 'Exposición inmersiva a estresor social/auditivo en VR',
    sympatheticToneIndex: 68,
    vagalReactivityIndex: 42,
    habituationRate: 'Óptima',
    synthesizedClinicalSummary: `[Prueba Individual VR Quest 3S] Paciente ID: ${patient.id || 'PAC-8104'}. Presenta respuesta simpática inicial a los 120s de exposición (GSR pico 4.8 µS). Se observa posterior recuperación vagal (HRV sube a 48ms) evidenciando un índice de habituación H = 2.84. Tasa de extinción del distrés clasificada como ÓPTIMA.`,
  });

  return (
    <div className="space-y-5">
      {/* Encabezado Módulo Independiente */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-600/20">
            <Glasses className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Módulo Terapéutico VR Meta Quest 3S
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] rounded-full font-semibold">
                PRUEBA AUTÓNOMA
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Inhibición de respuesta, habituación progresiva y biofeedback neurofisiológico inmersivo.
            </p>
          </div>
        </div>

        <button
          onClick={() => onUpdatePatientVrData(telemetry, individualReport)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Transferir Data a Triangulación Global</span>
        </button>
      </div>

      {/* Grid de Biometría Terapéutica en Vivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Conductancia Cutánea (GSR)</span>
          </div>
          <div className="text-xl font-bold text-white">4.8 µS <span className="text-xs text-rose-400 font-normal">(Pico Excitación)</span></div>
          <p className="text-[10px] text-slate-500 mt-1">Medición de tono simpático inmersivo</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Tono Vagal (HRV RMSSD)</span>
          </div>
          <div className="text-xl font-bold text-white">48 ms <span className="text-xs text-emerald-400 font-normal">(Modulación)</span></div>
          <p className="text-[10px] text-slate-500 mt-1">Capacidad de autorregulación parasimpática</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Índice de Habituación ($H$)</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">{telemetry.habituationIndexH}</div>
          <p className="text-[10px] text-emerald-400 mt-1">Extinción de distrés: Óptima</p>
        </div>
      </div>

      {/* Informe Clínico Sintetizado (Especifico de esta Prueba VR) */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Informe Clínico Sintetizado — Prueba Individual VR</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">GUID: {telemetry.sessionId}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono">
          {individualReport.synthesizedClinicalSummary}
        </p>
      </div>
    </div>
  );
};
