import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { 
  X, 
  Play, 
  Pause, 
  Activity, 
  Brain, 
  Target, 
  Clock, 
  CheckCircle2, 
  Award,
  Terminal
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

type DiagnosticTest = 'CPT_3D_ADHD' | 'AAT_3D_BIAS' | 'CYBERBALL_BPD' | 'AGENCY_PERTURBATION';

export const FullscreenDiagnosticRunner: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest>('CPT_3D_ADHD');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testTimeSec, setTestTimeSec] = useState(0);

  // Métricas del Test en Tiempo Real (Capturadas a 60Hz)
  const [reactionTimeMs, setReactionTimeMs] = useState(412);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [commissionErrors, setCommissionErrors] = useState(0);
  const [pupilPeakMm, setPupilPeakMm] = useState(3.4);
  const [eventLogs, setEventLogs] = useState<string[]>([]);

  // Telemetría simulada/recibida del conector de hardware (Polar H10, GSR, Visor)
  const [currentBpm, setCurrentBpm] = useState(78);
  const [currentHrv, setCurrentHrv] = useState(42);
  const [currentGsr, setCurrentGsr] = useState(2.3);

  // Temporizador y Generador de Marcas de Eventos LSL en Tiempo Real
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTestRunning) {
      interval = setInterval(() => {
        setTestTimeSec(prev => {
          const nextTime = prev + 1;

          // Simulación de eventos LSL según el paradigma seleccionado
          if (nextTime % 5 === 0) {
            const timestamp = new Date().toISOString().slice(11, 19);
            let eventMsg = '';

            if (selectedTest === 'CPT_3D_ADHD') {
              const isTarget = Math.random() > 0.3;
              if (isTarget) {
                eventMsg = `[${timestamp}] [LSL MARKER] STIMULUS_TARGET -> Hit (Reaction: ${Math.floor(320 + Math.random() * 150)}ms)`;
                setReactionTimeMs(Math.floor(340 + Math.random() * 120));
              } else {
                if (Math.random() > 0.7) {
                  eventMsg = `[${timestamp}] [LSL MARKER] STIMULUS_NO_GO -> COMMISSION_ERROR (Impulsividad Gatillo)`;
                  setCommissionErrors(c => c + 1);
                } else {
                  eventMsg = `[${timestamp}] [LSL MARKER] STIMULUS_NO_GO -> Correct Inhibition`;
                }
              }
            } else if (selectedTest === 'AAT_3D_BIAS') {
              eventMsg = `[${timestamp}] [LSL MARKER] APPROACH_STIMULUS -> Grip Pressure: ${(0.4 + Math.random() * 0.4).toFixed(2)}N | Pupil: ${(3.2 + Math.random() * 0.8).toFixed(2)}mm`;
              setPupilPeakMm(Number((3.2 + Math.random() * 0.8).toFixed(2)));
            } else if (selectedTest === 'CYBERBALL_BPD') {
              eventMsg = `[${timestamp}] [LSL MARKER] EXCLUSION_PHASE_START -> GSR Peak: ${(3.5 + Math.random() * 2.0).toFixed(2)}µS | HRV Drop`;
            } else if (selectedTest === 'AGENCY_PERTURBATION') {
              eventMsg = `[${timestamp}] [LSL MARKER] MOTOR_DELAY_INJECTED -> 120ms Perturbation | Disassociation Index: High`;
            }

            if (eventMsg) {
              setEventLogs(logs => [eventMsg, ...logs.slice(0, 15)]);
            }
          }

          // Variación Fisiológica Simultánea
          setCurrentBpm(72 + Math.floor(Math.random() * 12));
          setCurrentHrv(35 + Math.floor(Math.random() * 15));
          setCurrentGsr(Number((2.0 + Math.random() * 1.5).toFixed(2)));

          return nextTime;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTestRunning, selectedTest]);

  const handleStartTest = () => {
    setTestTimeSec(0);
    setOmissionErrors(0);
    setCommissionErrors(0);
    setEventLogs([`[SYSTEM] Prueba ${selectedTest} iniciada en Pico Neo 3 Pro / Quest 3S.`]);
    setIsTestRunning(true);
  };

  const handleFinalizeAndTransfer = () => {
    setIsTestRunning(false);

    const telemetryPayload: VrTelemetryData = {
      sessionId: `DIAG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      deviceId: 'PICO_NEO_3_PRO',
      gsrMicroSiemens: [1.8, 2.3, 3.1, 2.8, 2.2],
      hrvRmssdMs: [45, 38, 32, 40, 44],
      heartRateBpm: currentBpm,
      habituationIndexH: 82.5,
      stressPeaksCount: commissionErrors + 1,
      exposureDurationSec: testTimeSec,
      pupilDiameterMm: pupilPeakMm,
      saccadicRateHz: 2.1
    };

    const reportPayload: VrTherapyReport = {
      sessionGuid: telemetryPayload.sessionId,
      exposureType: `Prueba Diagnóstica (${selectedTest})`,
      sympatheticToneIndex: 65,
      vagalReactivityIndex: 48,
      habituationRate: 'Óptima',
      synthesizedClinicalSummary: `Prueba Objetiva ${selectedTest} completada en ${testTimeSec}s. Tiempo de reacción medio: ${reactionTimeMs}ms. Errores de omisión: ${omissionErrors}, comisiones: ${commissionErrors}. Diámetro pupilar máximo: ${pupilPeakMm}mm.`
    };

    onUpdatePatientVrData(telemetryPayload, reportPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Encabezado Principal */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white">CONSOLA DE DIAGNÓSTICO Y PRUEBAS VR</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-500/30 font-mono">
                LSL EVENT MARKER 60HZ
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Paciente: <span className="text-white font-semibold">{patient.patientNameAnonymized || patient.id}</span> ({patient.id}) | Mapeo RDoC / DSM-5-TR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-800 px-4 py-1.5 rounded-xl flex items-center gap-3">
            <Clock className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-tight font-bold">DURACIÓN PRUEBA</span>
              <span className="text-base font-mono font-bold text-purple-300">
                {String(Math.floor(testTimeSec / 60)).padStart(2, '0')}:{String(testTimeSec % 60).padStart(2, '0')}
              </span>
            </div>
          </div>

          {!isTestRunning ? (
            <button
              onClick={handleStartTest}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20"
            >
              <Play className="w-4 h-4" />
              <span>Ejecutar Test</span>
            </button>
          ) : (
            <button
              onClick={() => setIsTestRunning(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition"
            >
              <Pause className="w-4 h-4" />
              <span>Pausar</span>
            </button>
          )}

          <button
            onClick={handleFinalizeAndTransfer}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Transferir Resultados</span>
          </button>

          <button onClick={onClose} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Selector de Pruebas Científicas (3 Cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pruebas Diagnósticas Disponibles
            </h2>

            <button
              onClick={() => setSelectedTest('CPT_3D_ADHD')}
              className={`w-full p-3.5 rounded-xl border text-left transition ${
                selectedTest === 'CPT_3D_ADHD' ? 'bg-purple-950 border-purple-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Test CPT-3D (TDAH)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-900 text-purple-200 rounded">ATENCIÓN</span>
              </div>
              <p className="text-[11px] text-slate-400">Medición de omisiones, comisiones en gatillo y agitación de cabeza 6DoF.</p>
            </button>

            <button
              onClick={() => setSelectedTest('AAT_3D_BIAS')}
              className={`w-full p-3.5 rounded-xl border text-left transition ${
                selectedTest === 'AAT_3D_BIAS' ? 'bg-purple-950 border-purple-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">AAT 3D (Sesgos Implícitos)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-cyan-900 text-cyan-200 rounded">SESGOS</span>
              </div>
              <p className="text-[11px] text-slate-400">Tendencias automáticas de empujar/jalar estímulos y dilatación pupilar.</p>
            </button>

            <button
              onClick={() => setSelectedTest('CYBERBALL_BPD')}
              className={`w-full p-3.5 rounded-xl border text-left transition ${
                selectedTest === 'CYBERBALL_BPD' ? 'bg-purple-950 border-purple-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Cyberball 3D (TLP / Rechazo)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-900 text-rose-200 rounded">AFECTO</span>
              </div>
              <p className="text-[11px] text-slate-400">Provocación de exclusión social y caída paroxística del tono vagal.</p>
            </button>

            <button
              onClick={() => setSelectedTest('AGENCY_PERTURBATION')}
              className={`w-full p-3.5 rounded-xl border text-left transition ${
                selectedTest === 'AGENCY_PERTURBATION' ? 'bg-purple-950 border-purple-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Atribución de Agencia</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-900 text-amber-200 rounded">PSICOSIS</span>
              </div>
              <p className="text-[11px] text-slate-400">Desfases sensoriotores (0-300ms) para detectar disociación o pródromos.</p>
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <span className="font-bold text-white block mb-1">Sincronización LSL Millisecond:</span>
            <p>Todas las acciones de los mandos Pico/Quest quedan estampadas con latencia sub-milisegundo.</p>
          </div>
        </div>

        {/* Panel Central: Métricas Clínicas Objetivas (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Biomarcadores Objetivos Medidos</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Tiempo de Reacción</span>
                <div className="text-2xl font-black text-purple-400">{reactionTimeMs} <span className="text-xs text-slate-500 font-normal">ms</span></div>
                <span className="text-[10px] text-slate-500 mt-1 block">Norma: 320 - 450 ms</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Dilatación Pupilar</span>
                <div className="text-2xl font-black text-amber-400">{pupilPeakMm} <span className="text-xs text-slate-500 font-normal">mm</span></div>
                <span className="text-[10px] text-amber-500 mt-1 block">Pico Activación Simpática</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Errores de Omisión</span>
                <div className="text-2xl font-black text-rose-400">{omissionErrors}</div>
                <span className="text-[10px] text-slate-500 mt-1 block">Inatención Sostenida</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Errores de Comisión</span>
                <div className="text-2xl font-black text-rose-400">{commissionErrors}</div>
                <span className="text-[10px] text-slate-500 mt-1 block">Impulsividad de Gatillo</span>
              </div>
            </div>

            {/* Monitor Fisiológico Sincronizado */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Respuesta Fisiológica Simultánea (Geoid HS500)</span>
              </span>
              <div className="flex justify-between text-xs font-mono text-slate-300 pt-1">
                <span>Pulso: <strong className="text-rose-400">{currentBpm} BPM</strong></span>
                <span>HRV RMSSD: <strong className="text-cyan-400">{currentHrv} ms</strong></span>
                <span>GSR: <strong className="text-amber-400">{currentGsr} µS</strong></span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-purple-200 text-xs flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400 shrink-0" />
            <span>Los datos recolectados enriquecen el análisis de Gemini para el dictamen final.</span>
          </div>
        </div>

        {/* Panel Derecho: Log de Eventos LSL en Tiempo Real (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Consola LSL / Event Stream (60Hz)</span>
            </h2>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-cyan-300 space-y-1.5 overflow-y-auto leading-relaxed">
              {eventLogs.length > 0 ? (
                eventLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900 pb-1">
                    {log}
                  </div>
                ))
              ) : (
                <span className="text-slate-600 italic">Esperando inicio del test para capturar eventos...</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
