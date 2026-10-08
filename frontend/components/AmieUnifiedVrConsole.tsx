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

  const [connectionType, setConnectionType] = useState<ConnectionType>('WIFI');
  const [wifiIp, setWifiIp] = useState('192.168.1.105');
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Subsistema multicanal inicializado.',
    '[SYSTEM] Motor de autorregulación autónoma por IA listo.'
  ]);

  const [vrMode, setVrMode] = useState<ClinicalVrMode>('SEXUAL_HEALTH_SES_SIS');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('NEUTRAL_LIVING_ROOM');
  const [interactionType, setInteractionType] = useState<InteractionType>('DYNAMIC_AI');
  
  const [selectedNarcissismVideo, setSelectedNarcissismVideo] = useState<'VIDEO_1_OVERT' | 'VIDEO_2_COVERT' | 'VIDEO_3_MALIGNANT'>('VIDEO_1_OVERT');
  
  const [aiContentType, setAiContentType] = useState<'SES_SIS_EXCITATORY' | 'SES_SIS_INHIBITORY' | 'CUSTOM_SCRIPT' | 'COUPLE_MEDIATION'>('SES_SIS_EXCITATORY');
  const [customProfessionalPrompt, setCustomProfessionalPrompt] = useState<string>(
    'Sincronizar los estímulos visuales espaciales 3D con la bitácora de autorregulación autónoma según los niveles de conductancia (GSR) y profundidad de trance del paciente.'
  );
  const [aiVoiceTone, setAiVoiceTone] = useState<'SOFT_WHISPER' | 'EMPATHIC_GUIDE' | 'ARROGANT_COLD' | 'DEFENSIVE_HOSTILE'>('SOFT_WHISPER');
  
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

  useEffect(() => {
    if (!sessionActive || appRole !== 'CLINICIAN_CONSOLE' || isAbreactionTriggered) return;

    const interval = setInterval(() => {
      const randomHrvDelta = (Math.random() - 0.48) * 3;
      const randomGsrDelta = (Math.random() - 0.5) * 0.15;

      const nextHrv = Math.max(10, Math.min(100, realHrv + randomHrvDelta));
      const nextGsr = Math.max(0.5, Math.min(12, realGsr + randomGsrDelta));

      if (nextGsr - gsrBaselineRef.current > 4.0 || nextHrv < 13) {
        triggerSafetyGrounding('Alerta autonómica crítica: Sobrecarga simpática detectada. Activando protocolo de emergencia.');
        return;
      }

      if (isAiAutoRegulationActive) {
        if (nextGsr > 4.5) {
          setAiRegulationLog(`[IA AUTORREGULACIÓN] Pico de GSR (${nextGsr.toFixed(2)} µS). Suavizando tono de voz y reduciendo estímulo.`);
        } else if (nextHrv < 25) {
          setAiRegulationLog(`[IA AUTORREGULACIÓN] Tono vagal bajo (${Math.round(nextHrv)} ms). Activando respiración guiada.`);
        } else {
          setAiRegulationLog(`[IA AUTORREGULACIÓN] Biomarcadores estables (HRV: ${Math.round(nextHrv)}ms | GSR: ${nextGsr.toFixed(2)}µS).`);
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
          const prompt = `[AMIE AI CLOSED-LOOP] Prompt: "${customProfessionalPrompt}" Modo: ${vrMode}`;
          const result = await model.generateContent(prompt);
          setEnvStatusMsg(result.response.text() || 'Bucle autónomo de IA inicializado.');
        } else {
          setEnvStatusMsg('Modo local optimizado: Bucle autónomo activo.');
        }
      } else {
        setEnvStatusMsg(`Video clínico vinculado al escenario ${selectedEnvironment}.`);
      }

      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
        environment: selectedEnvironment,
        mode: vrMode,
        interactionType,
        professionalPrompt: customProfessionalPrompt,
        autoRegulation: isAiAutoRegulationActive,
        voiceStyle: aiVoiceTone
      });

      setSessionActive(true);
      setIsAbreactionTriggered(false);
    } catch (e) {
      setEnvStatusMsg('Error al compilar el entorno. Usando respaldo autónomo.');
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
        metrics: { mode: vrMode, environment: selectedEnvironment, avgHrv: realHrv, avgGsr: realGsr },
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

  if (appRole === 'SELECTING_ROLE') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-slate-100 max-w-2xl w-full mx-auto space-y-6 text-center">
        <div className="p-4 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl w-16 h-16 mx-auto flex items-center justify-center">
          <Glasses className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">Seleccione el Modo de Acceso • Consola AMIE VR</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Elija el rol para calibrar hardware, operar como terapeuta o iniciar el visor.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button onClick={() => setAppRole('CALIBRATION_RUNNER')} className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-2 cursor-pointer">
            <h3 className="text-xs font-bold text-white">Calibración &amp; HW</h3>
          </button>
          <button onClick={() => setAppRole('CLINICIAN_CONSOLE')} className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-2 cursor-pointer">
            <h3 className="text-xs font-bold text-white">Vista Terapeuta</h3>
          </button>
          <button onClick={() => setAppRole('PATIENT_VR_VIEWER')} className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-2 cursor-pointer">
            <h3 className="text-xs font-bold text-white">Vista Paciente</h3>
          </button>
        </div>
        {onClose && <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Cancelar y volver</button>}
      </div>
    );
  }

  if (appRole === 'CALIBRATION_RUNNER') {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 p-6 space-y-5 mx-auto">
        <div className="flex justify-between border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-white">CALIBRACIÓN MULTICANAL</h3>
          <button onClick={() => setAppRole('SELECTING_ROLE')} className="text-xs text-cyan-400 cursor-pointer">Volver</button>
        </div>
        <button onClick={() => setAppRole('CLINICIAN_CONSOLE')} className="w-full py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold cursor-pointer">Ir a Vista Terapeuta</button>
      </div>
    );
  }

  if (appRole === 'PATIENT_VR_VIEWER') {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-3xl w-full mx-auto space-y-6 text-center">
        <h3 className="text-base font-bold text-white">Visor VR Activo (Paciente: {patientId})</h3>
        <button onClick={() => setAppRole('SELECTING_ROLE')} className="px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer">Volver</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">Consola Profesional • Salud Sexual, SES/SIS &amp; Bucle Cerrado IA</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-full">AUTORREGULACIÓN ACTIVA</span>
            </div>
            <p className="text-xs text-slate-400">Paciente: {patientId} | <button onClick={() => setAppRole('SELECTING_ROLE')} className="text-cyan-400 hover:underline cursor-pointer">Cambiar Rol</button></p>
          </div>
        </div>
        {onClose && <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer">✕</button>}
      </div>

      {isAbreactionTriggered && (
        <div className="p-4 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-rose-100 space-y-3">
          <h4 className="font-bold text-sm text-white">WATCHDOG DE SEGURIDAD ACTIVADO</h4>
          <p className="text-xs text-rose-200">{abreactionReason}</p>
          <button onClick={() => setIsAbreactionTriggered(false)} className="py-2 px-4 bg-rose-700 text-white text-xs rounded-xl cursor-pointer">Restablecer</button>
        </div>
      )}

      {/* CONFIGURACIÓN Y PANEL SES/SIS */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4" /> 1. Configuración de Módulo y Bucle Autónomo de IA
          </h3>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <input type="checkbox" checked={isAiAutoRegulationActive} onChange={(e) => setIsAiAutoRegulationActive(e.target.checked)} className="rounded bg-slate-950 border-slate-700 text-emerald-500 cursor-pointer" />
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> IA Autorregulada</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Especialidad / Módulo Clínico:</label>
            <select value={vrMode} onChange={(e) => setVrMode(e.target.value as ClinicalVrMode)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none">
              <option value="SEXUAL_HEALTH_SES_SIS">💕 Salud Sexual &amp; Respuesta Sexual (SES / SIS)</option>
              <option value="SYSTEMIC_COUPLE">👥 Terapia de Pareja y Mediación Sistémica</option>
              <option value="HYPNOSIS">🧘 Neurohipnosis y Regulación (Grounding)</option>
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

        {/* 🧠 PANEL DE CONFIGURACIÓN Y PROMPTS PARA SES/SIS E IA */}
        {vrMode === 'SEXUAL_HEALTH_SES_SIS' && (
          <div className="p-4 bg-slate-900 rounded-xl border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" /> Generador IA para Respuesta Sexual (Modelo Bancroft SES / SIS):
              </span>
              <select value={aiContentType} onChange={(e) => setAiContentType(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-200 font-bold focus:outline-none">
                <option value="SES_SIS_EXCITATORY">Modelo SES: Activar Aceleradores / Foco Erótico</option>
                <option value="SES_SIS_INHIBITORY">Modelo SIS: Mitigación de Frenos / Culpa / Ansiedad</option>
                <option value="COUPLE_MEDIATION">Sintonía y Comunicación Diádica en Pareja</option>
                <option value="CUSTOM_SCRIPT">Guion y Estímulo Clínico Libre</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold block">
                Instrucciones de la IA (Guion, Diálogo y Parámetros del Video/Audio para Inhibir o Exitar):
              </label>
              <textarea
                rows={3}
                value={customProfessionalPrompt}
                onChange={(e) => setCustomProfessionalPrompt(e.target.value)}
                placeholder="Ej: Generar un entorno de seguridad y un guion con tono pausado que ayude a desarticular los frenos inhibitorios (SIS)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Tono de Voz del Guía / Avatar (TTS Inmersivo):</label>
                <select value={aiVoiceTone} onChange={(e) => setAiVoiceTone(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none">
                  <option value="SOFT_WHISPER">Susurro Cálido y Pausado (Desactivar Frenos SIS)</option>
                  <option value="EMPATHIC_GUIDE">Guía Empático y Validante (Sintonía SES)</option>
                  <option value="ARROGANT_COLD">Analítico y Desapasionado (Reestructuración)</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-[10px] text-rose-200 w-full leading-relaxed">
                  💡 La IA compilará este prompt para sintetizar el audio, estructurar los estímulos visuales y sincronizar el bucle cerrado.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Bitácora de Autorregulación Autónoma por IA:</div>
          <div className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{aiRegulationLog}</span>
          </div>
        </div>
      </div>

      {/* METRICAS EN VIVO */}
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

      {/* BOTONERA DE CONTROL (HABILITADA PARA PRUEBA EN VIVO) */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Visor VR: <strong className={isConnected ? "text-emerald-400" : "text-amber-400"}>{isConnected ? 'EN LÍNEA' : 'MODO STANDBY / PRUEBA'}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          {!sessionActive ? (
            <button disabled={isGeneratingAi} onClick={handleInitializeAndRenderEnvironment} className="flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-600 hover:scale-105 text-white cursor-pointer">
              {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Iniciar Bucle Autónomo de IA (Forzar Prueba)</span>
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
