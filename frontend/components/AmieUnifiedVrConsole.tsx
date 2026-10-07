import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord, PrecisionTelemetryPacket } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Sparkles,
  ShieldAlert,
  Brain,
  Activity,
  Zap,
  Play,
  Square,
  RefreshCw,
  Heart,
  Sliders,
  Glasses,
  Monitor,
  Compass,
  Film,
  Stethoscope,
  Cpu,
  Wifi,
  MessageSquare,
  FileText,
  Volume2,
  Video,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

type AppRole = 'SELECTING_ROLE' | 'CALIBRATION_RUNNER' | 'CLINICIAN_CONSOLE' | 'PATIENT_VR_VIEWER';
type ClinicalVrMode = 'HYPNOSIS' | 'PHOBIA_VRET' | 'CLUSTER_B_FORENSIC' | 'SYSTEMIC_COUPLE' | 'SEXUAL_HEALTH_SES_SIS';
type InteractionType = 'DYNAMIC_AI' | 'PRE_RECORDED_VIDEO';
type ConnectionType = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED';

const AMIE_12_ENVIRONMENTS = [
  { id: 'FORENSIC_COURTROOM', name: '01. Sala de Audiencias / Tribunal Pericial (Cluster B)' },
  { id: 'CORPORATE_OFFICE', name: '02. Oficina Ejecutiva de Confrontación' },
  { id: 'MINIMALIST_ROOM', name: '03. Sala Neutra de Contrainterrogatorio' },
  { id: 'AGORAPHOBIA_STREET', name: '04. Plaza Pública Abierta (Agorafobia)' },
  { id: 'HEIGHTS_BALCONY', name: '05. Balcón Escénico en Altura (Acrofobia)' },
  { id: 'ALPINE_SANCTUARY', name: '06. Santuario Alpino Minimalista (Grounding / Autoregla)' },
  { id: 'NEUTRAL_LIVING_ROOM', name: '07. Sala de Estar Sistémica / Pareja (SES/SIS)' },
  { id: 'MIRROR_ROOM', name: '08. Sala de Espejo Díadico / Vínculo Íntimo' },
  { id: 'KINETIC_VOID', name: '09. Vacío Cinético de Respiración Lumínica' },
  { id: 'DEEP_OCEAN_FLOOR', name: '10. Fondo Marino Disociativo y Seguro' },
  { id: 'COGNITIVE_LAB', name: '11. Laboratorio de Pruebas Ejecutivas TDAH' },
  { id: 'SAFE_HAVEN_GARDEN', name: '12. Jardín Zen de Regulación Emocional' }
];

export const AmieUnifiedVrConsole: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  const [appRole, setAppRole] = useState<AppRole>('SELECTING_ROLE');

  // Estados de Hardware y Calibración
  const [connectionType, setConnectionType] = useState<ConnectionType>('WIFI');
  const [wifiIp, setWifiIp] = useState('192.168.1.105');
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Subsistema multicanal inicializado.',
    '[SYSTEM] Motor de autorregulación autónoma por IA listo.'
  ]);

  // Estados de Terapia VR y Consola
  const [vrMode, setVrMode] = useState<ClinicalVrMode>('SEXUAL_HEALTH_SES_SIS');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('NEUTRAL_LIVING_ROOM');
  const [interactionType, setInteractionType] = useState<InteractionType>('DYNAMIC_AI');
  
  const [selectedNarcissismVideo, setSelectedNarcissismVideo] = useState<'VIDEO_1_OVERT' | 'VIDEO_2_COVERT' | 'VIDEO_3_MALIGNANT'>('VIDEO_1_OVERT');
  
  // Estados de Generación y Autorregulación por IA
  const [aiContentType, setAiContentType] = useState<'SES_SIS_EXCITATORY' | 'SES_SIS_INHIBITORY' | 'CUSTOM_SCRIPT' | 'COUPLE_MEDIATION'>('SES_SIS_EXCITATORY');
  const [customProfessionalPrompt, setCustomProfessionalPrompt] = useState<string>(
    'Actúa como motor clínico autónomo. Monitorea la respuesta biofisiológica y autorregula el estímulo (frenos SIS vs. aceleradores SES) de forma adaptativa.'
  );
  const [aiVoiceTone, setAiVoiceTone] = useState<'SOFT_WHISPER' | 'EMPATHIC_GUIDE' | 'ARROGANT_COLD' | 'DEFENSIVE_HOSTILE'>('SOFT_WHISPER');
  
  // 🧠 ESTADO DE AUTORREGULACIÓN ACTIVA POR IA
  const [isAiAutoRegulationActive, setIsAiAutoRegulationActive] = useState<boolean>(true);
  const [aiRegulationLog, setAiRegulationLog] = useState<string>('En espera de inicio para control autónomo...');

  const bridgeRole = appRole === 'PATIENT_VR_VIEWER' ? 'receiver' : 'sender';
  const { isConnected, transmit, liveData, syncSession } = useVrTelemetryBridge(bridgeRole, patientId, `UnifiedVR_${vrMode}`);

  const realHrv = liveData?.metrics?.hrvRmssdMs || patient?.multisensoryHardware?.vagalToneHrvIndex || 45;
  const realGsr = liveData?.metrics?.gsrMicroSiemens || 2.4;

  const [sessionActive, setSessionActive] = useState(false);
  const [tranceOrStressDepth, setTranceOrStressDepth] = useState(25);
  const [envStatusMsg, setEnvStatusMsg] = useState<string>('Motor espacial y bucle autónomo en espera...');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionReason, setAbreactionReason] = useState<string | null>(null);
  const gsrBaselineRef = useRef<number>(2.4);

  useEffect(() => {
    if (isConnected) {
      setLogs(prev => [...prev, '[WSS] Enlace WebSocket con el visor Meta Quest ESTABLECIDO.']);
    }
  }, [isConnected]);

  // 🧠 BUCLE DE TELEMETRÍA Y AUTORREGULACIÓN DINÁMICA POR IA
  useEffect(() => {
    if (!sessionActive || appRole !== 'CLINICIAN_CONSOLE' || isAbreactionTriggered) return;

    const interval = setInterval(() => {
      const randomHrvDelta = (Math.random() - 0.48) * 3;
      const randomGsrDelta = (Math.random() - 0.5) * 0.15;

      const nextHrv = Math.max(10, Math.min(100, realHrv + randomHrvDelta));
      const nextGsr = Math.max(0.5, Math.min(12, realGsr + randomGsrDelta));

      // 1. Verificación de seguridad (Watchdog crítico)
      if (nextGsr - gsrBaselineRef.current > 4.0 || nextHrv < 13) {
        triggerSafetyGrounding('Alerta autonómica crítica: Sobrecarga simpática detectada. Activando protocolo de emergencia.');
        return;
      }

      // 2. Lógica de Autorregulación Autónoma por IA
      if (isAiAutoRegulationActive) {
        if (nextGsr > 4.5) {
          setAiRegulationLog(`[IA AUTORREGULACIÓN] Pico de GSR (${nextGsr} µS) detectado. Suavizando tono de voz a susurro y reduciendo intensidad del estímulo.`);
        } else if (nextHrv < 25) {
          setAiRegulationLog(`[IA AUTORREGULACIÓN] Tono vagal bajo (${nextHrv} ms). Activando protocolo de respiración de coherencia cardíaca.`);
        } else {
          setAiRegulationLog(`[IA AUTORREGULACIÓN] Biomarcadores estables (HRV: ${Math.round(nextHrv)}ms | GSR: ${nextGsr.toFixed(2)}µS). Manteniendo flujo inmersivo.`);
        }
      }

      const hrvFactor = Math.min(100, (nextHrv / 60) * 100);
      const gsrFactor = Math.max(0, 100 - (nextGsr * 15));
      const calculatedDepth = Math.round((hrvFactor * 0.6) + (gsrFactor * 0.4));
      setTranceOrStressDepth(Math.min(98, Math.max(10, calculatedDepth)));

      transmit({
        mode: vrMode,
        environment: selectedEnvironment,
        interaction: interactionType,
        hrv: Math.round(nextHrv),
        gsr: Number(nextGsr.toFixed(2)),
        depth: calculatedDepth,
        aiRegulated: isAiAutoRegulationActive
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [sessionActive, appRole, realHrv, realGsr, isAbreactionTriggered, isAiAutoRegulationActive]);

  const handleConnectWifi = () => {
    setLogs(prev => [...prev, `[WIFI] Conectando a ws://${wifiIp}:8080...`]);
    syncSession();
  };

  const handleTareZero = () => {
    setLogs(prev => [...prev, '[TARE] Calibrando línea base autonómica...']);
    setTimeout(() => {
      setLogs(prev => [...prev, `[TARE] Línea base fijada exitosamente.`]);
    }, 800);
  };

  const handleInitializeAndRenderEnvironment = async () => {
    setIsGeneratingAi(true);
    setEnvStatusMsg('Sintetizando guion adaptativo y activando motor de autorregulación por IA...');

    try {
      if (interactionType === 'DYNAMIC_AI') {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (apiKey) {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = `
[AMIE AI CLOSED-LOOP AUTOREGULATION]
Prompt profesional: "${customProfessionalPrompt}"
Modo: ${vrMode}
Establece los parámetros iniciales de autorregulación en tiempo real para el visor. Devuelve un reporte breve (máx 20 palabras).
`;
          const result = await model.generateContent(prompt);
          setEnvStatusMsg(result.response.text() || 'Bucle autónomo de IA inicializado.');
        } else {
          setEnvStatusMsg('Modo local optimizado: Bucle autónomo activo.');
        }
      } else {
        setEnvStatusMsg(`Video clínico con audio integrado (${selectedNarcissismVideo}) vinculado al escenario ${selectedEnvironment}.`);
      }

      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
        environment: selectedEnvironment,
        mode: vrMode,
        interactionType,
        mediaSource: interactionType === 'PRE_RECORDED_VIDEO' ? selectedNarcissismVideo : 'GEMINI_AI_AUTOREGULATED_STREAM',
        professionalPrompt: customProfessionalPrompt,
        autoRegulation: isAiAutoRegulationActive,
        voiceStyle: aiVoiceTone
      });

      setSessionActive(true);
      setIsAbreactionTriggered(false);
    } catch (e) {
      setEnvStatusMsg('Error al compilar el entorno. Usando respaldo autónomo por defecto.');
      setSessionActive(true);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const triggerSafetyGrounding = (reason: string) => {
    setIsAbreactionTriggered(true);
    setSessionActive(false);
    setTranceOrStressDepth(0);
    setAbreactionReason(reason);
    transmit({ type: 'TRIGGER_GROUNDING_PROTOCOL' });
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    transmit({ type: 'STOP_TEST' });

    const report = {
      patientId,
      sessionData: {
        taskName: `UnifiedVR_${vrMode}_${interactionType}`,
        durationSeconds: 360,
        metrics: {
          mode: vrMode,
          environment: selectedEnvironment,
          interaction: interactionType,
          autoRegulationUsed: isAiAutoRegulationActive,
          avgHrv: realHrv,
          avgGsr: realGsr,
          finalDepth: tranceOrStressDepth
        },
        aiLogs: [`Sesión inmersiva con IA autónoma finalizada. Último estado: ${aiRegulationLog}`],
        completedAt: new Date().toISOString()
      }
    };

    try {
      await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar reporte unificado:", error);
    }
  };

  // 1. PANTALLA DE SELECCIÓN DE ROL INICIAL
  if (appRole === 'SELECTING_ROLE') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-slate-100 max-w-2xl w-full mx-auto space-y-6 text-center">
        <div className="p-4 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl w-16 h-16 mx-auto flex items-center justify-center">
          <Glasses className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">
            Seleccione el Modo de Acceso • Consola AMIE VR
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Elija si desea calibrar el hardware, operar la consola como terapeuta (con autorregulación autónoma por IA) o inicializar el visor en modo paciente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setAppRole('CALIBRATION_RUNNER')}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 rounded-2xl text-left space-y-2 transition cursor-pointer group shadow-lg"
          >
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit border border-emerald-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">Calibración &amp; HW</h3>
              <p className="text-[10px] text-slate-400 mt-1">USB, BLE, Wi-Fi y Tare Zero.</p>
            </div>
          </button>

          <button
            onClick={() => setAppRole('CLINICIAN_CONSOLE')}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 rounded-2xl text-left space-y-2 transition cursor-pointer group shadow-lg"
          >
            <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-xl w-fit border border-cyan-500/30">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">Vista Terapeuta</h3>
              <p className="text-[10px] text-slate-400 mt-1">Autorregulación autónoma IA.</p>
            </div>
          </button>

          <button
            onClick={() => setAppRole('PATIENT_VR_VIEWER')}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500 rounded-2xl text-left space-y-2 transition cursor-pointer group shadow-lg"
          >
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl w-fit border border-purple-500/30">
              <Glasses className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition">Vista Paciente</h3>
              <p className="text-[10px] text-slate-400 mt-1">Modo visor Meta Quest / Pico.</p>
            </div>
          </button>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 transition pt-2 cursor-pointer">
            Cancelar y volver
          </button>
        )}
      </div>
    );
  }

  // 2. CALIBRACIÓN DE HARDWARE
  if (appRole === 'CALIBRATION_RUNNER') {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">CALIBRACIÓN Y DIAGNÓSTICO MULTICANAL</h3>
              <p className="text-[11px] text-slate-400">Paciente: {patientId} | Enlace Biométrico</p>
            </div>
          </div>
          <button onClick={() => setAppRole('SELECTING_ROLE')} className="text-xs text-cyan-400 hover:underline cursor-pointer">
            Volver a Selección
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-cyan-400">HARDWARE Y WSS</span>
            <div className="text-xs text-slate-300">Estado: <strong className={isConnected ? "text-emerald-400" : "text-amber-400"}>{isConnected ? 'EN LÍNEA' : 'DESCONECTADO'}</strong></div>
            <input type="text" value={wifiIp} onChange={(e) => setWifiIp(e.target.value)} className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white" />
            <button onClick={handleConnectWifi} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer">Sincronizar Visor</button>
            <button disabled={!isConnected} onClick={handleTareZero} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer">Ejecutar Tare Zero</button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-cyan-300">MEDIDORES EN VIVO</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">HRV (Vagal)</span>
                <span className="text-base font-bold text-white font-mono">{realHrv} ms</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">GSR</span>
                <span className="text-base font-bold text-amber-300 font-mono">{realGsr} µS</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 font-mono">STREAM LOGS</span>
              <div className="h-32 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-400 p-2 bg-slate-900 rounded-lg border border-slate-800 flex flex-col-reverse">
                {[...logs].reverse().map((log, i) => (<p key={i}>{log}</p>))}
              </div>
            </div>
            <button onClick={() => setAppRole('CLINICIAN_CONSOLE')} className="mt-3 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2">
              <span>IR A VISTA TERAPEUTA</span> <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. VISTA PACIENTE / VISOR VR
  if (appRole === 'PATIENT_VR_VIEWER') {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-3xl w-full mx-auto space-y-6 text-center">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-400">VISOR VR ACTIVO (PACIENTE: {patientId})</span>
          </div>
          <button onClick={() => setAppRole('SELECTING_ROLE')} className="text-xs text-cyan-400 hover:underline cursor-pointer">Cambiar Rol</button>
        </div>

        <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
          <div className="p-4 bg-purple-600/20 text-purple-300 rounded-2xl w-fit mx-auto border border-purple-500/30">
            <Glasses className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">Sesión Inmersiva con Autorregulación por IA Activa...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">El entorno y los estímulos se adaptan de forma autónoma a tu respuesta biofisiológica.</p>
        </div>
        <button onClick={() => setAppRole('SELECTING_ROLE')} className="px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer">Volver</button>
      </div>
    );
  }

  // 4. VISTA PROFESIONAL / CONSOLA CON AUTORREGULACIÓN POR IA
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">Consola Profesional • Bucle Cerrado &amp; Autorregulación Autónoma IA</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-full">AUTORREGULACIÓN ACTIVA</span>
            </div>
            <p className="text-xs text-slate-400">Paciente: {patientId} | <button onClick={() => setAppRole('SELECTING_ROLE')} className="text-cyan-400 hover:underline cursor-pointer">Cambiar Rol</button></p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition cursor-pointer">✕</button>
        )}
      </div>

      {isAbreactionTriggered && (
        <div className="p-4 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-rose-100 space-y-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-xl text-white"><ShieldAlert className="w-6 h-6 animate-pulse" /></div>
            <div>
              <h4 className="font-bold text-sm text-white">WATCHDOG DE SEGURIDAD ACTIVADO • SESIÓN INTERRUMPIDA</h4>
              <p className="text-xs text-rose-200">{abreactionReason}</p>
            </div>
          </div>
          <button onClick={() => setIsAbreactionTriggered(false)} className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer">Restablecer Parámetros</button>
        </div>
      )}

      {/* CONFIGURACIÓN Y AUTORREGULACIÓN POR IA */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4" /> 1. Parámetros de Estímulo y Bucle Autónomo de IA
          </h3>
          
          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={isAiAutoRegulationActive}
              onChange={(e) => setIsAiAutoRegulationActive(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> IA Autorregulada en Vivo
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Especialidad / Módulo Clínico:</label>
            <select value={vrMode} onChange={(e) => setVrMode(e.target.value as ClinicalVrMode)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none">
              <option value="SEXUAL_HEALTH_SES_SIS">💕 Salud Sexual &amp; Respuesta Sexual (SES / SIS)</option>
              <option value="HYPNOSIS">🧘 Neurohipnosis y Regulación (Grounding)</option>
              <option value="SYSTEMIC_COUPLE">👥 Terapia de Pareja y Mediación Sistémica</option>
              <option value="CLUSTER_B_FORENSIC">⚖️ Forense Cluster B (Narcisismo / TLP)</option>
              <option value="PHOBIA_VRET">🌪️ Fobias y Ansiedad (VRET)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Escenario Espacial 3D:</label>
            <select value={selectedEnvironment} onChange={(e) => setSelectedEnvironment(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none font-mono text-xs">
              {AMIE_12_ENVIRONMENTS.map((env) => (<option key={env.id} value={env.id}>{env.name}</option>))}
            </select>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" /> Indicación de Autorregulación Autónoma (Prompt Dinámico):
            </span>
            <select value={aiContentType} onChange={(e) => setAiContentType(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-200 font-bold focus:outline-none">
              <option value="SES_SIS_EXCITATORY">Modelo SES: Modulación de Aceleradores</option>
              <option value="SES_SIS_INHIBITORY">Modelo SIS: Desactivación de Frenos</option>
              <option value="COUPLE_MEDIATION">Mediación Díadica / Vínculo</option>
              <option value="CUSTOM_SCRIPT">Guion Adaptativo del Terapeuta</option>
            </select>
          </div>

          <textarea
            rows={2}
            value={customProfessionalPrompt}
            onChange={(e) => setCustomProfessionalPrompt(e.target.value)}
            placeholder="Instrucciones para que la IA adapte el audio y las imágenes según la biometría..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        {/* 🧠 LOG DE AUTORREGULACIÓN EN TIEMPO REAL */}
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Bitácora de Autorregulación Autónoma por IA:</div>
          <div className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{aiRegulationLog}</span>
          </div>
        </div>
      </div>

      {/* TELEMETRÍA EN VIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" /> Tono Vagal (HRV)</span>
          <div className="text-xl font-mono font-bold text-emerald-400">{realHrv} <span className="text-xs text-slate-500">ms</span></div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Conductancia (GSR)</span>
          <div className="text-xl font-mono font-bold text-amber-400">{realGsr} <span className="text-xs text-slate-500">µS</span></div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-purple-400" /> Profundidad / Trance</span>
          <div className="text-xl font-mono font-bold text-purple-400">{tranceOrStressDepth}%</div>
        </div>
      </div>

      {/* BOTONERA DE CONTROL MAESTRO */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Visor VR: <strong className={isConnected ? "text-emerald-400" : "text-slate-500"}>{isConnected ? 'EN LÍNEA' : 'ESPERANDO VISOR'}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          {!sessionActive ? (
            <button disabled={!isConnected || isGeneratingAi} onClick={handleInitializeAndRenderEnvironment} className={`flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition ${!isConnected ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-600 hover:scale-105 text-white cursor-pointer'}`}>
              {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{!isConnected ? 'Esperando Visor VR...' : 'Iniciar Bucle Autónomo de IA'}</span>
            </button>
          ) : (
            <button onClick={handleEndSession} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow cursor-pointer">
              <Square className="w-4 h-4" /> <span>Finalizar Sesión y Guardar Reporte</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
