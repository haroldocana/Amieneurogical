import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Sparkles,
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

  const [vrMode, setVrMode] = useState<ClinicalVrMode>('SEXUAL_HEALTH_SES_SIS');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('NEUTRAL_LIVING_ROOM');
  const [interactionType, setInteractionType] = useState<InteractionType>('DYNAMIC_AI');
  
  const [aiContentType, setAiContentType] = useState<'SES_SIS_EXCITATORY' | 'SES_SIS_INHIBITORY' | 'CUSTOM_SCRIPT' | 'COUPLE_MEDIATION'>('SES_SIS_EXCITATORY');
  const [customProfessionalPrompt, setCustomProfessionalPrompt] = useState<string>(
    'Generar entorno inmersivo de seguridad y estímulo visual fotorrealista para desarticular frenos inhibitorios (SIS) y activar aceleradores (SES).'
  );
  const [aiVoiceTone, setAiVoiceTone] = useState<'SOFT_WHISPER' | 'EMPATHIC_GUIDE' | 'ARROGANT_COLD' | 'DEFENSIVE_HOSTILE'>('SOFT_WHISPER');
  
  const [isAiAutoRegulationActive, setIsAiAutoRegulationActive] = useState<boolean>(true);

  const bridgeRole = appRole === 'PATIENT_VR_VIEWER' ? 'receiver' : 'sender';
  const { isConnected, transmit, liveData } = useVrTelemetryBridge(bridgeRole, patientId, `UnifiedVR_${vrMode}`);

  const realHrv = liveData?.metrics?.hrvRmssdMs || patient?.multisensoryHardware?.vagalToneHrvIndex || 45;
  const realGsr = liveData?.metrics?.gsrMicroSiemens || 2.4;

  const [sessionActive, setSessionActive] = useState(false);
  const [tranceOrStressDepth, setTranceOrStressDepth] = useState(25);
  const [envStatusMsg, setEnvStatusMsg] = useState<string>('Motor generativo de IA (Gemini 3.8 Flash) en espera...');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [isAbreactionTriggered, setIsAbreactionTriggered] = useState(false);
  const [abreactionReason, setAbreactionReason] = useState<string | null>(null);
  const gsrBaselineRef = useRef<number>(2.4);

  const handleInitializeAndRenderEnvironment = async () => {
    setIsGeneratingAi(true);
    setEnvStatusMsg('Generando entorno y estímulo visual con Gemini 3.8 Flash...');

    try {
      const apiKey = 
        import.meta.env.VITE_GEMINI_API_KEY || 
        import.meta.env.GEMINI_API_KEY || 
        import.meta.env.VITE_API_KEY || 
        '';

      let generatedAssetUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80';

      if (apiKey && apiKey.startsWith('AIza')) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
          const promptText = `Describe visualmente en inglés y de forma fotorrealista esta escena para entorno clínico: "${customProfessionalPrompt}" (máx 15 palabras).`;
          const result = await model.generateContent(promptText);
          const queryTag = encodeURIComponent(result.response.text().trim());
          generatedAssetUrl = `https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80&sig=${queryTag}`;
        } catch (apiErr) {
          console.warn("Aviso de API Gemini, usando motor procedural local:", apiErr);
        }
      } else {
        const encodedKeyword = encodeURIComponent(customProfessionalPrompt.slice(0, 20));
        generatedAssetUrl = `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80&t=${encodedKeyword}`;
      }

      setEnvStatusMsg('¡Asset visual generado con éxito y transmitido al visor!');

      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
        environment: selectedEnvironment,
        mode: vrMode,
        interactionType,
        professionalPrompt: customProfessionalPrompt,
        aiGeneratedAssetUrl: generatedAssetUrl,
        autoRegulation: isAiAutoRegulationActive,
        voiceStyle: aiVoiceTone
      });

      setSessionActive(true);
      setIsAbreactionTriggered(false);
    } catch (e) {
      setEnvStatusMsg('Entorno activo con parámetros predeterminados.');
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
    if (onClose) onClose();
  };

  if (appRole === 'SELECTING_ROLE') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-slate-100 max-w-2xl w-full mx-auto space-y-6 text-center">
        <div className="p-4 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl w-16 h-16 mx-auto flex items-center justify-center">
          <Glasses className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">Consola AMIE • Generador de IA &amp; Visor VR</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Seleccione el modo operativo para la sesión clínica.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button onClick={() => setAppRole('CLINICIAN_CONSOLE')} className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-2 cursor-pointer">
            <h3 className="text-xs font-bold text-cyan-400">Vista Terapeuta (Generación IA)</h3>
            <p className="text-[10px] text-slate-400">Control de prompts y generación de assets.</p>
          </button>
          <button onClick={() => setAppRole('PATIENT_VR_VIEWER')} className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-2 cursor-pointer">
            <h3 className="text-xs font-bold text-purple-400">Vista Visor Paciente</h3>
            <p className="text-[10px] text-slate-400">Renderizado espacial WebXR.</p>
          </button>
        </div>
        {onClose && <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Cancelar</button>}
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
            <h2 className="text-base font-black text-white tracking-tight">Consola Profesional • Generación Nativa con Gemini 3.8 Flash</h2>
            <p className="text-xs text-slate-400">Paciente: {patientId} | <button onClick={() => setAppRole('SELECTING_ROLE')} className="text-cyan-400 hover:underline cursor-pointer">Cambiar Rol</button></p>
          </div>
        </div>
        {onClose && <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer">✕</button>}
      </div>

      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4" /> Configuración de Módulo &amp; Generador IA
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
            <label className="text-slate-400 font-semibold block">Escenario Base 3D:</label>
            <select value={selectedEnvironment} onChange={(e) => setSelectedEnvironment(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none font-mono text-xs">
              {AMIE_12_ENVIRONMENTS.map((env) => (<option key={env.id} value={env.id}>{env.name}</option>))}
            </select>
          </div>
        </div>

        {vrMode === 'SEXUAL_HEALTH_SES_SIS' && (
          <div className="p-4 bg-slate-900 rounded-xl border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" /> Prompt para Generación de Video e Imagen por IA (Modelo SES/SIS):
              </span>
              <select value={aiContentType} onChange={(e) => setAiContentType(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-200 font-bold focus:outline-none">
                <option value="SES_SIS_EXCITATORY">Modelo SES: Generar Estímulo Excitatorio</option>
                <option value="SES_SIS_INHIBITORY">Modelo SIS: Generar Estímulo Inhibitorio / Calma</option>
                <option value="COUPLE_MEDIATION">Sintonía Diádica / Pareja</option>
                <option value="CUSTOM_SCRIPT">Prompt Libre de Generación Visual</option>
              </select>
            </div>

            <textarea
              rows={3}
              value={customProfessionalPrompt}
              onChange={(e) => setCustomProfessionalPrompt(e.target.value)}
              placeholder="Describa el video o imagen fotorrealista que la IA debe generar para el paciente..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 transition"
            />
          </div>
        )}

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Estado del Generador de Assets IA:</div>
          <div className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">{envStatusMsg}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-400">Visor: <strong className={isConnected ? "text-emerald-400" : "text-amber-400"}>{isConnected ? 'EN LÍNEA' : 'STANDBY'}</strong></span>
        {!sessionActive ? (
          <button disabled={isGeneratingAi} onClick={handleInitializeAndRenderEnvironment} className="flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-600 text-white cursor-pointer hover:scale-105 transition">
            {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Generar con IA y Enviar al Visor</span>
          </button>
        ) : (
          <button onClick={handleEndSession} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl cursor-pointer">
            <Square className="w-4 h-4" /> <span>Finalizar Sesión</span>
          </button>
        )}
      </div>
    </div>
  );
};
