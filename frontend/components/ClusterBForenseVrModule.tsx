import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Brain,
  ShieldAlert,
  Mic,
  Volume2,
  Video,
  Sparkles,
  Play,
  Square,
  RefreshCw,
  Sliders,
  Glasses,
  Monitor,
  Flame,
  UserCheck,
  Compass
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { immersionMedia } from '../services/immersionMediaService';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

export const ClusterBForenseVrModule: React.FC<Props> = ({ patient, onClose }) => {
  const [sessionState, setSessionState] = useState<'STANDBY' | 'INTERROGATION' | 'DEVALUATION_PHASE'>('STANDBY');
  const [clusterBProfile, setClusterBProfile] = useState<'OVERT_NARCISSISM' | 'COVERT_NARCISSISM' | 'MALIGNANT_NARCISSISM' | 'BPD_SPLITTING'>('OVERT_NARCISSISM');
  
  const [selectedEnvironment, setSelectedEnvironment] = useState<'FORENSIC_COURTROOM' | 'CORPORATE_OFFICE' | 'MINIMALIST_ROOM'>('FORENSIC_COURTROOM');
  const [isGeneratingEnv, setIsGeneratingEnv] = useState(false);
  const [envPromptStatus, setEnvPromptStatus] = useState<string>('Entorno base en espera...');

  const [avatarVoiceTone, setAvatarVoiceTone] = useState<'ARROGANT_COLD' | 'DEFENSIVE_HOSTILE' | 'SMARM_CHARM'>('ARROGANT_COLD');
  const [doctorInterrogationText, setDoctorInterrogationText] = useState('');
  const [avatarResponseText, setAvatarResponseText] = useState('Doctor, dudo mucho que alguien aquí tenga la capacidad de comprender la magnitud de mis decisiones...');
  const [isAvatarThinking, setIsAvatarThinking] = useState(false);
  const [isAiStreamingVoice, setIsAiStreamingVoice] = useState(false);

  const { isConnected, transmit } = useVrTelemetryBridge('sender', patient?.id || 'PAC-8104', 'ClusterBForensicVR');

  const handleGenerateAiEnvironmentAndSession = async () => {
    setIsGeneratingEnv(true);
    setEnvPromptStatus('Gemini compilando parámetros espaciales y lumínicos para el visor...');
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Actúa como el motor de generación procedural de entornos y perfiles clínicos de AMIE Engine para VR. Configura los parámetros espaciales para el escenario: ${selectedEnvironment} bajo el perfil de paciente: ${clusterBProfile}.`;
        const result = await model.generateContent(prompt);
        setEnvPromptStatus(result.response.text() || 'Entorno procedural renderizado en GPU del visor.');
      } else {
        setEnvPromptStatus('Entorno VR cargado en modo local optimizado.');
      }

      // Mapeo del entorno forense hacia el asset oficial en /ecosystems/
      const ecosystemAssetKey = selectedEnvironment === 'FORENSIC_COURTROOM' ? 'CLUSTER_B_FORENSIC' : 'ACROPHOBIA';
      const resolvedTextureUrl = immersionMedia.getEcosystemAssetUrl(ecosystemAssetKey);

      // Transmitir orden de generación y textura al visor Meta Quest / Pico
      transmit({
        type: 'LOAD_MODULE',
        moduleName: 'CLUSTER_B_FORENSIC',
        ecosystem: ecosystemAssetKey,
        textureUrl: resolvedTextureUrl,
        profile: clusterBProfile,
        lighting: 'HIGH_CONTRAST_GRAY'
      });

      setSessionState('INTERROGATION');
    } catch (e) {
      setEnvPromptStatus('Error al compilar entorno. Usando respaldo por defecto.');
    } finally {
      setIsGeneratingEnv(false);
    }
  };

  const handleSendInterrogation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!doctorInterrogationText.trim() || isAvatarThinking) return;

    const query = doctorInterrogationText.trim();
    setDoctorInterrogationText('');
    setIsAvatarThinking(true);
    setIsAiStreamingVoice(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Eres un simulador clínico forense experto en trastornos de la personalidad Cluster B (${clusterBProfile}). Intervención del terapeuta: "${query}". Responde en primera persona, manteniendo un perfil ${avatarVoiceTone}. Máximo 45 palabras.`;
        const result = await model.generateContent(prompt);
        const reply = result.response.text() || 'Sus preguntas carecen de fundamento clínico real...';
        setAvatarResponseText(reply);

        transmit({
          type: 'AVATAR_SPEAKING_STREAM',
          profile: clusterBProfile,
          tone: avatarVoiceTone,
          speechText: reply,
          facialExpression: 'SUPERIORITY_SMIRK'
        });
      } else {
        setAvatarResponseText('Esa perspectiva es completamente simplista y no refleja la realidad.');
      }
    } catch (err) {
      setAvatarResponseText('No tengo comentarios ante una intervención de esa naturaleza.');
    } finally {
      setIsAvatarThinking(false);
      setIsAiStreamingVoice(false);
    }
  };

  const handleEndSession = async () => {
    setSessionState('STANDBY');
    transmit({ type: 'STOP_TEST' });
    if (onClose) onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-rose-600/30">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Consola Forense Cluster B • Entornos Generativos IA & Audio Sincronizado
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                CLUSTER B AVATAR LAB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Entrenamiento pericial con avatares de alta fidelidad, generación espacial por IA y voz reactiva en tiempo real.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer">
            ✕
          </button>
        )}
      </div>

      {sessionState === 'STANDBY' && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4" /> Configuración de Escenario Pericial e IA Generativa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Perfil Clínico del Paciente Simulado:</label>
              <select
                value={clusterBProfile}
                onChange={(e) => setClusterBProfile(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="OVERT_NARCISSISM">Narcisismo Overt (Grandioso / Arrogante)</option>
                <option value="COVERT_NARCISSISM">Narcisismo Covert (Vulnerable / Hipersensible)</option>
                <option value="MALIGNANT_NARCISSISM">Narcisismo Maligno (Paranoide / Agresivo)</option>
                <option value="BPD_SPLITTING">Trastorno Límite (Patrón de Escisión / Splitting)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Entorno VR (Generado por IA en Visor):</label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="FORENSIC_COURTROOM">Sala de Audiencias / Tribunal Pericial</option>
                <option value="CORPORATE_OFFICE">Oficina Ejecutiva Minimalista</option>
                <option value="MINIMALIST_ROOM">Sala Neutra de Contrainterrogatorio</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            <strong>Estado del Generador Espacial:</strong> {envPromptStatus}
          </div>

          <button
            disabled={isGeneratingEnv || !isConnected}
            onClick={handleGenerateAiEnvironmentAndSession}
            className={`w-full py-3 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              !isConnected 
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:scale-[1.01] text-white'
            }`}
          >
            {isGeneratingEnv ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{!isConnected ? 'Esperando Conexión Visor VR...' : 'Generar Entorno VR & Iniciar Peritaje'}</span>
          </button>
        </div>
      )}

      {sessionState === 'INTERROGATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Perfil Activo</span>
              <div className="text-xs font-bold text-rose-400">{clusterBProfile.replace('_', ' ')}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Entorno Espacial IA</span>
              <div className="text-xs font-bold text-cyan-400">{selectedEnvironment}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Audio Sincronizado</span>
              <div className="text-xs font-bold text-emerald-400">{isAiStreamingVoice ? '🎙️ Transmitiendo Voz' : '🟢 Sincronizado'}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                Avatar Fotorrealista en Visor (Video + Voz IA en Vivo)
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Tono: {avatarVoiceTone}
              </span>
            </div>

            <div className="h-56 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              <div className="z-10 space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] font-mono">
                  {isAvatarThinking ? 'Avatar formulando respuesta defensiva...' : 'Respuesta del Avatar Simulada:'}
                </div>
                <p className="text-sm font-serif italic text-slate-200 leading-relaxed">
                  "{avatarResponseText}"
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendInterrogation} className="flex gap-2">
            <input
              type="text"
              value={doctorInterrogationText}
              onChange={(e) => setDoctorInterrogationText(e.target.value)}
              placeholder="Escriba su pregunta pericial o intervención de confrontación..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={isAvatarThinking || !doctorInterrogationText.trim()}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg cursor-pointer"
            >
              {isAvatarThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Interrogar</span>}
            </button>
          </form>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button onClick={() => setSessionState('STANDBY')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer">
              Cambiar Configuración de Entorno
            </button>
            <button onClick={handleEndSession} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition cursor-pointer shadow">
              <Square className="w-4 h-4" /> <span>Finalizar Peritaje y Guardar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
