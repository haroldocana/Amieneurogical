import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { X, Play, Pause, RotateCcw, Activity, Glasses } from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export const FullscreenTreatmentConsole: React.FC<Props> = ({ patient, onClose, onUpdatePatientVrData }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleFinish = () => {
    setIsRunning(false);
    const telemetry: VrTelemetryData = {
      sessionId: `VR-TRT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      gsrMicroSiemens: [1.5, 3.2, 2.8, 1.9, 1.4],
      hrvRmssdMs: [40, 32, 38, 45, 48],
      habituationIndexH: 2.5,
      exposureDurationSec: timer
    };
    const report: VrTherapyReport = {
      sessionGuid: telemetry.sessionId,
      exposureType: 'Exposición VR Inmersiva a Pantalla Completa',
      sympatheticToneIndex: 62,
      vagalReactivityIndex: 45,
      habituationRate: 'Óptima',
      synthesizedClinicalSummary: `Sesión de tratamiento completada en ${timer} segundos para el paciente ${patient.id || 'PAC-8104'}.`
    };
    onUpdatePatientVrData(telemetry, report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-600 rounded-xl text-white">
            <Glasses className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Consola de Tratamiento VR Inmersivo</h2>
            <p className="text-xs text-slate-400">Paciente ID: {patient.id || 'PAC-8104'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-2">Simulación de Escenario VR</span>
            <div className="h-64 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-2">
                <Activity className={`w-12 h-12 text-cyan-400 mx-auto ${isRunning ? 'animate-pulse' : ''}`} />
                <p className="text-sm font-semibold text-slate-300">
                  {isRunning ? 'Tratamiento en Ejecución en Visor VR...' : 'Consola en Espera'}
                </p>
                <p className="text-xs font-mono text-cyan-400 font-bold">Tiempo: {timer}s</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition ${
                isRunning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-cyan-600 hover:bg-cyan-500'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pausar' : 'Iniciar Sesión'}</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Finalizar y Guardar</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Tono Vagal / HRV</span>
            <span className="text-2xl font-bold text-emerald-400">42 ms</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Conductancia Cutánea (GSR)</span>
            <span className="text-2xl font-bold text-cyan-400">2.4 µS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
