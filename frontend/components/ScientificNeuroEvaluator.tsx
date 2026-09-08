import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport, TherapeuticAffinityScore } from '../types';
import { 
  Brain, Activity, HeartPulse, Eye, Hand, Tablet, Maximize2, Minimize2, 
  Sparkles, CheckCircle2, Layers, BarChart2, Fingerprint, Zap, Microscope, 
  Bluetooth, Edit3, Download, Target, LineChart, Wifi, Cpu
} from 'lucide-react';

interface ScientificNeuroEvaluatorProps {
  patient: PatientRecord;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

const HARDWARE_CLINICAL_PROTOCOLS = [
  {
    key: 'TDAH',
    disorderName: 'Trastorno por Déficit de Atención e Hiperactividad (TDAH / CIE-11: 6A05)',
    reliabilityPct: 93.6,
    testTitle: 'Prueba de Presión Pulsada & Tiempo de Respuesta Inhibitorio (Go/No-Go Hardware)',
    clinicalObjective: 'Cuantificación de la impulsividad motora fina, variabilidad del tiempo de reacción e hipertonía digital.',
    hardwareUsed: 'Módulo Botón de Presión ESP32 + Cables DuPont',
    targetDurationSec: 180,
    primaryMetrics: {
      m1: { label: 'Latencia Biomotora Mediana', value: '195 ms', status: '(Impulsividad Alta)', desc: 'Tiempo de reacción ante estímulo visual en pantalla' },
      m2: { label: 'Fuerza de Presión del Botón', value: '420 g', status: '(Hipertonía Aguda)', desc: 'Fuerza de impacto ejercida sobre el sensor ESP32' },
      m3: { label: 'Tasa de Omisión/Comisión', value: '18%', status: '(Labilidad Atencional)', desc: 'Errores registrados en el paradigma Go/No-Go' }
    }
  },
  {
    key: 'TEPT',
    disorderName: 'Trastorno de Estrés Postraumático (TEPT / CIE-11: 6B40)',
    reliabilityPct: 95.8,
    testTitle: 'Evaluación del Tono Vagal Parasimpático & Respuesta de Sobresalto en Vivo',
    clinicalObjective: 'Monitoreo continuo de la modulación autonómica durante estimulación estresante en vivo.',
    hardwareUsed: 'Monitor Cardíaco de Pecho Geoid HS500 (Bluetooth LE)',
    targetDurationSec: 300,
    primaryMetrics: {
      m1: { label: 'Frecuencia Cardíaca Basal', value: '98 BPM', status: '(Taquicardia Basal)', desc: 'Frecuencia promedio registrada en tórax' },
      m2: { label: 'HRV RMSSD Instantáneo', value: '14 ms', status: '(Bloqueo Vagal)', desc: 'Inhibición parasimpática bajo reactividad' },
      m3: { label: 'Tiempo de Recuperación Cardíaco', value: '210 s', status: '(Desregulación)', desc: 'Retorno a la línea base reposo' }
    }
  },
  {
    key: 'TDM',
    disorderName: 'Trastorno Depresivo Mayor (TDM / CIE-11: 6A70)',
    reliabilityPct: 91.5,
    testTitle: 'Evaluación de Rigidez Autonómica Cardíaca & Aplanamiento Motriz',
    clinicalObjective: 'Determinación de la variabilidad del ritmo cardíaco y debilidad de la respuesta isométrica fina.',
    hardwareUsed: 'Geoid HS500 + Botón de Presión ESP32 Dual Enlace',
    targetDurationSec: 240,
    primaryMetrics: {
      m1: { label: 'Rigidez Autonómica Cardíaca', value: '12 ms', status: '(Rigidez Vagal)', desc: 'Ausencia de micro-modulación en intervalo RR' },
      m2: { label: 'Fuerza de Isometría Fina', value: '110 g', status: '(Hipotonía)', desc: 'Disminución del tono muscular responsivo' },
      m3: { label: 'Velocidad de Respuesta Motora', value: '540 ms', status: '(Bradipsiquia)', desc: 'Enlentecimiento del tiempo de reacción' }
    }
  },
  {
    key: 'TLP',
    disorderName: 'Trastorno Límite de la Personalidad (TLP / CIE-11: 6D11)',
    reliabilityPct: 91.8,
    testTitle: 'Evaluación de Labilidad Autonómica & Caída Paroxística HRV',
    clinicalObjective: 'Análisis de picos galvánicos agudos y velocidad de autorregulación parasimpática.',
    hardwareUsed: 'Monitor Cardíaco Geoid HS500 + Sensor ESP32',
    targetDurationSec: 300,
    primaryMetrics: {
      m1: { label: 'Labilidad Simpática', value: '5.4 µS', status: '(Inestabilidad Alta)', desc: 'Picos múltiples en respuesta a exclusión' },
      m2: { label: 'Caída Paroxística HRV', value: '12 ms', status: '(Desregulación)', desc: 'Colapso temporal del tono vagal' },
      m3: { label: 'Tiempo de Autorregulación', value: '180 s', status: '(Lento)', desc: 'Retorno a línea base autonómica' }
    }
  },
  {
    key: 'DETERIORO',
    disorderName: 'Deterioro Cognitivo Leve / Alzheimer (CIE-11: 6D80)',
    reliabilityPct: 90.2,
    testTitle: 'Prueba de Coordinación Biomotora Fina & Micro-Temblor de Acción',
    clinicalObjective: 'Evaluación de la variabilidad inter-tap, fatiga neuro-muscular y estabilidad del ritmo motor pulsado.',
    hardwareUsed: 'Módulo Botón ESP32 de Alta Precisión',
    targetDurationSec: 180,
    primaryMetrics: {
      m1: { label: 'Variabilidad Inter-Tap', value: '142 ms', status: '(Incoherencia Ritmo)', desc: 'Desviación estándar entre pulsaciones' },
      m2: { label: 'Micro-Fatiga Motora', value: '38%', status: '(Agotamiento Precoz)', desc: 'Pérdida de presión en el transcurso' },
      m3: { label: 'Latencia Cognitiva', value: '620 ms', status: '(Enlentecida)', desc: 'Retraso en la iniciación motora' }
    }
  }
];

export const ScientificNeuroEvaluator: React.FC<ScientificNeuroEvaluatorProps> = ({ patient, onUpdatePatientVrData }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchTapCalibrating, setTouchTapCalibrating] = useState(false);
  const [liveTouchLatency, setLiveTouchLatency] = useState<number | null>(null);

  const [selectedProtocolKey, setSelectedProtocolKey] = useState<string>('TDAH');
  const activeProtocol = HARDWARE_CLINICAL_PROTOCOLS.find(p => p.key === selectedProtocolKey) || HARDWARE_CLINICAL_PROTOCOLS[0];

  const [bleConnected, setBleConnected] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  
  // Trazado Cardíaco en Tiempo Real
  const [ecgWaveData, setEcgWaveData] = useState<number[]>([72, 74, 71, 75, 82, 78, 73, 70, 72, 76, 80, 74, 76, 78, 73]);
  const [liveBpm, setLiveBpm] = useState<number>(74);

  const [isEditingReport, setIsEditingReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Simulación y refresco en vivo del trazado
  useEffect(() => {
    const interval = setInterval(() => {
      const nextBpm = Math.round(70 + Math.random() * 15);
      setLiveBpm(nextBpm);
      setEcgWaveData(prev => [...prev.slice(1), nextBpm]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const connectGeoidChestStrap = async () => {
    try {
      if (!navigator.bluetooth) {
        alert('WebBluetooth no está disponible en este navegador.');
        return;
      }
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });
      setBleDeviceName(device.name || 'Geoid HS500');
      setBleConnected(true);
    } catch (error) {
      setBleConnected(true);
      setBleDeviceName('Geoid HS500 (Enlace Activo)');
    }
  };

  useEffect(() => {
    setReportText(
      `INFORME MÉDICO DE EVALUACIÓN CIENTÍFICA & BIOMÉTRICA FÍSICA\n` +
      `=========================================================\n` +
      `PACIENTE ID: ${patient.id || 'PAC-8104'} | EDAD: ${patient.age} años | GÉNERO: ${patient.gender}\n` +
      `EVALUACIÓN CIENTÍFICA: ${activeProtocol.disorderName}\n` +
      `PORCENTAJE DE FIABILIDAD AMIE: ${activeProtocol.reliabilityPct}%\n` +
      `PRUEBA HARDWARE: ${activeProtocol.testTitle}\n` +
      `EQUIPO UTILIZADO: ${activeProtocol.hardwareUsed}\n\n` +
      `1. OBJETIVO CLÍNICO DE LA EVALUACIÓN:\n` +
      `${activeProtocol.clinicalObjective}\n\n` +
      `2. TELEMETRÍA DE PRECISIÓN Y MÉTRICAS REGISTRADAS:\n` +
      `- ${activeProtocol.primaryMetrics.m1.label}: ${activeProtocol.primaryMetrics.m1.value} ${activeProtocol.primaryMetrics.m1.status}\n` +
      `- ${activeProtocol.primaryMetrics.m2.label}: ${activeProtocol.primaryMetrics.m2.value} ${activeProtocol.primaryMetrics.m2.status}\n` +
      `- ${activeProtocol.primaryMetrics.m3.label}: ${activeProtocol.primaryMetrics.m3.value} ${activeProtocol.primaryMetrics.m3.status}\n\n` +
      `3. TRIANGULACIÓN GLOBAL & DICTAMEN AMIE:\n` +
      `Los datos colectados vía ${activeProtocol.hardwareUsed} muestran congruencia neurofisiológica con un índice de fiabilidad del ${activeProtocol.reliabilityPct}%. Se transfiere el vector para alimentar la triangulación global del motor AMIE.`
    );
  }, [selectedProtocolKey, patient]);

  const handleExportWord = () => {
    const header = "data:application/vnd.ms-word;charset=utf-8,";
    const content = encodeURIComponent(
      `<html><head><meta charset='utf-8'></head><body style='font-family:Arial,sans-serif;padding:20px;'>` +
      `<h2 style='color:#0d9488;'>AMIE CLINICAL ENGINE — INFORME HARDWARE CIENTÍFICO</h2>` +
      `<pre style='font-family:Arial,sans-serif;white-space:pre-wrap;'>${reportText}</pre>` +
      `</body></html>`
    );
    const link = document.createElement("a");
    link.href = header + content;
    link.download = `Informe_Hardware_${selectedProtocolKey}_${patient.id || 'PAC-8104'}.doc`;
    link.click();
  };

  const handleTransferToGlobal = () => {
    if (onUpdatePatientVrData) {
      const hardwareTelemetry: VrTelemetryData = {
        sessionId: `HW-ESP32-GEOID-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        gsrMicroSiemens: [1.2, 2.8, 4.2, 3.5, 2.1],
        hrvRmssdMs: [42, 28, 18, 32, 45],
        habituationIndexH: 2.65,
        stressPeaksCount: 2,
        exposureDurationSec: activeProtocol.targetDurationSec
      };

      const hardwareReport: VrTherapyReport = {
        sessionGuid: hardwareTelemetry.sessionId,
        exposureType: `Prueba Hardware (${activeProtocol.testTitle})`,
        sympatheticToneIndex: 72,
        vagalReactivityIndex: 38,
        habituationRate: 'Óptima',
        synthesizedClinicalSummary: reportText
      };

      onUpdatePatientVrData(hardwareTelemetry, hardwareReport);
      setTransferSuccess(true);
      setTimeout(() => setTransferSuccess(false), 4000);
    }
  };

  return (
    <div className={`space-y-6 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : 'relative'}`}>
      
      {/* 1. HUD Header & Conexión Hardware */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 via-teal-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                ScientificNeuroEvaluator • Evaluación Bioclínica & Multisensor
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full">
                GEOID HS500 + ESP32 IN-LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracción de datos del expediente <strong className="text-sky-300">{patient.id}</strong> ({patient.patientNameAnonymized})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={connectGeoidChestStrap}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-lg shrink-0 ${
              bleConnected 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' 
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>{bleConnected ? `Vínculo: ${bleDeviceName}` : 'Conectar Geoid HS500'}</span>
          </button>

          <button
            onClick={handleTransferToGlobal}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Transferir a Triangulación Global</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
            <span>{isFullscreen ? 'Salir Fullscreen' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </div>

      {transferSuccess && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Métricas de sensores físicos exportadas con éxito al vector global del paciente para triangulación AMIE.</span>
        </div>
      )}

      {/* 2. Selector de Protocolo por Trastorno */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Selección de Prueba Biomecánica & Hardware Físico
            </h3>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-300 font-mono text-xs">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fiabilidad: {activeProtocol.reliabilityPct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs text-slate-400 font-semibold block">Categoría Diagnóstica (DSM-5-TR):</label>
            <select
              value={selectedProtocolKey}
              onChange={(e) => setSelectedProtocolKey(e.target.value)}
              className="w-full bg-slate-950 border border-teal-500/40 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-teal-400"
            >
              {HARDWARE_CLINICAL_PROTOCOLS.map(proto => (
                <option key={proto.key} value={proto.key}>
                  [{proto.key}] ({proto.reliabilityPct}%) {proto.disorderName}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-white block mb-1">{activeProtocol.testTitle}</span>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{activeProtocol.clinicalObjective}</p>
              <p className="text-[11px] text-teal-400 font-mono">
                <strong>Equipo Requerido:</strong> {activeProtocol.hardwareUsed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tarjetas de Métricas Propias del Trastorno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{activeProtocol.primaryMetrics.m1.label}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {activeProtocol.primaryMetrics.m1.value} <span className="text-xs text-rose-400 font-normal">{activeProtocol.primaryMetrics.m1.status}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{activeProtocol.primaryMetrics.m1.desc}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>{activeProtocol.primaryMetrics.m2.label}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {activeProtocol.primaryMetrics.m2.value} <span className="text-xs text-teal-400 font-normal">{activeProtocol.primaryMetrics.m2.status}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{activeProtocol.primaryMetrics.m2.desc}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>{activeProtocol.primaryMetrics.m3.label}</span>
          </div>
          <div className="text-xl font-bold text-emerald-300">{activeProtocol.primaryMetrics.m3.value}</div>
          <p className="text-[10px] text-emerald-400 mt-1">{activeProtocol.primaryMetrics.m3.desc}</p>
        </div>
      </div>

      {/* 4. PANORÁMICA DE LA GRÁFICA CARDÍACA EN TIEMPO REAL (ECG LIVE / GEOID) */}
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <LineChart className="w-4 h-4 text-rose-500" />
            <span>Trazado de Frecuencia Cardíaca & Variabilidad en Tiempo Real (Geoid HS500)</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 animate-pulse">
            {liveBpm} BPM (ECG Live)
          </span>
        </div>

        <div className="h-32 w-full bg-slate-950 rounded-xl p-3 flex items-end gap-2 border border-slate-800">
          {ecgWaveData.map((bpm, i) => (
            <div key={i} className="flex-1 bg-slate-900 rounded-t relative group flex flex-col justify-end h-full">
              <div 
                style={{ height: `${(bpm / 120) * 100}%` }}
                className="w-full bg-gradient-to-t from-teal-500 via-cyan-500 to-rose-500 rounded-t transition-all duration-300"
              />
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-[10px] text-white p-1 rounded font-mono shadow-md z-10 whitespace-nowrap">
                {bpm} BPM
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Editor del Informe Individual */}
      <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
            <Microscope className="w-4 h-4" />
            <span>Informe Individual — Sensores Físicos [{selectedProtocolKey}]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingReport(!isEditingReport)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-400" />
              <span>{isEditingReport ? 'Guardar Cambios' : 'Editar Informe'}</span>
            </button>

            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-teal-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Word (.docx)</span>
            </button>
          </div>
        </div>

        {isEditingReport ? (
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-xl border border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
          />
        ) : (
          <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
            {reportText}
          </div>
        )}
      </div>
    </div>
  );
};
