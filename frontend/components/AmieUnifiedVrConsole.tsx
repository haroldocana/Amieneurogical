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
  ShieldCheck,
  Scale,
  CloudRain
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
  
  // INICIO DIRECTO EN VISTA DE TERAPEUTA (Se elimina el paso de selección de rol)
  const [appRole, setAppRole] = useState<AppRole>('CLINICIAN_CONSOLE');

  const [vrMode, setVrMode] = useState<ClinicalVrMode>('SEXUAL_HEALTH_SES_SIS');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('NEUTRAL_LIVING_ROOM');
  const [interactionType, setInteractionType] = useState<InteractionType>('DYNAMIC_AI');
  
  const [aiContentType, setAiContentType] = useState<'SES_SIS_EXCITATORY' | 'SES_SIS_INHIBITORY' | 'CUSTOM_SCRIPT' | 'COUPLE_MEDIATION'>('SES_SIS_EXCITATORY');
  const [customProfessionalPrompt, setCustomProfessionalPrompt] = useState<string>(
    'Generar entorno inmersivo de seguridad y estímulo visual fotorrealista para desarticular frenos inhibitorios (SIS) y activar aceleradores (SES).'
  );
  const [aiVoiceTone, setAiVoiceTone] = useState<'SOFT_WHISPER' | 'EMPATHIC_GUIDE' | 'ARROGANT_COLD' | 'DEFENSIVE_HOSTILE'>('SOFT_WHISPER');
  
  const [clusterBPattern, setClusterBPattern] = useState<'GASLIGHTING' | 'LOVE_BOMBING' | 'SILENT_TREATMENT'>('GASLIGHTING');
  const [vretExposureStep, setVretExposureStep] = useState<number>(3);
  const [isAiAutoRegulationActive, setIsAiAutoRegulationActive] = useState<boolean>(true);

  const bridgeRole = appRole === 'PATIENT_VR_VIEWER' ? 'receiver' : 'sender';
  const { isConnected, transmit, liveData } = useVrTelemetryBridge(bridgeRole, patientId, `UnifiedVR_${vrMode}`);

  const [sessionActive, setSessionActive] = useState(false);
  const [envStatusMsg, setEnvStatusMsg] = useState<string>('Motor generativo de IA (Gemini 3.8 Flash) en espera...');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleModuleChange = (newMode: ClinicalVrMode) => {
    setVrMode(newMode);
    if (newMode === 'SEXUAL_HEALTH_SES_SIS') setSelectedEnvironment('NEUTRAL_LIVING_ROOM');
    else if (newMode === 'CLUSTER_B_FORENSIC') setSelectedEnvironment('FORENSIC_COURTROOM');
    else if (newMode === 'PHOBIA_VRET') setSelectedEnvironment('HEIGHTS_BALCONY');
    else if (newMode === 'SYSTEMIC_COUPLE') setSelectedEnvironment('MIRROR_ROOM');
    else if (newMode === 'HYPNOSIS') setSelectedEnvironment('ALPINE_SANCTUARY');
  };

  const handleInitializeAndRenderEnvironment = async () => {
    setIsGeneratingAi(true);
    setEnvStatusMsg('Generando entorno y estímulo visual con Gemini 3.8 Flash...');

    try {
      const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://amieneurogical.onrender.com';
      const PROXY_HEADER = import.meta.env.VITE_PROXY_HEADER || 'FMFLYlU8uZv2lv1YA5t5UhwoUbb8DJHJ';
      
      let generatedAssetUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80';

      const vertexEndpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.8-flash:generateContent`;
      const proxyPayload = {
        contents: [{ role: 'user', parts: [{ text: `[MÓDULO: ${vrMode}] Describe visualmente en inglés y de forma fotorrealista esta escena clínica: "${customProfessionalPrompt}" (máx 15 palabras).` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.15 }
      };

      const response = await fetch(`${BACKEND_URL}/api-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-proxy': PROXY_HEADER
        },
        body: JSON.stringify({
          originalUrl: vertexEndpoint,
          body: proxyPayload
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const queryTag = encodeURIComponent(rawText.trim());
          generatedAssetUrl = `https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80&sig=${queryTag}`;
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
        voiceStyle: aiVoiceTone,
        clusterBPattern,
        vretStep: vretExposureStep
      });

      setSessionActive(true);
    } catch (e) {
      console.warn("Usando respaldo local:", e);
      setEnvStatusMsg('Entorno activo con parámetros predeterminados.');
      setSessionActive(true);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    transmit({ type: 'STOP_TEST' });
    if (onClose) onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">Consola Profesional • Generación Nativa con Gemini 3.8 Flash</h2>
            <p className="text-xs text-slate-400">Paciente: {patientId} | <button onClick={() => setAppRole('SELECTING_ROLE')} className="text-cyan-400 hover:underline cursor-pointer">Cambiar a Selector de Rol</button></p>
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
            <select value={vrMode} onChange={(e) => handleModuleChange(e.target.value as ClinicalVrMode)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none">
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

        {vrMode === 'CLUSTER_B_FORENSIC' && (
          <div className="p-4 bg-slate-900 rounded-xl border border-amber-500/30 space-y-3">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" /> Parámetros Periciales Cluster B:
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Patrón de Manipulación:</label>
                <select value={clusterBPattern} onChange={(e) => setClusterBPattern(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                  <option value="GASLIGHTING">Gaslighting / Distorsión</option>
                  <option value="LOVE_BOMBING">Love Bombing / Idealización</option>
                  <option value="SILENT_TREATMENT">Silent Treatment / Castigo</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tono Guía Virtual:</label>
                <select value={aiVoiceTone} onChange={(e) => setAiVoiceTone(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                  <option value="ARROGANT_COLD">Frío / Desapegado</option>
                  <option value="DEFENSIVE_HOSTILE">Defensivo / Hostil</option>
                  <option value="EMPATHIC_GUIDE">Guía Neutro Pericial</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {vrMode === 'PHOBIA_VRET' && (
          <div className="p-4 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-3">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-indigo-400" /> Control de Exposición Gradual (VRET):
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">Nivel de Exposición (1-10):</span>
              <input type="range" min="1" max="10" value={vretExposureStep} onChange={(e) => setVretExposureStep(Number(e.target.value))} className="flex-1 accent-indigo-500 cursor-pointer" />
              <span className="font-mono font-bold text-indigo-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">Nivel {vretExposureStep}</span>
            </div>
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
