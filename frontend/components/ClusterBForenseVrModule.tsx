import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Flame,
  Video,
  Sparkles,
  Square,
  RefreshCw,
  Compass,
  Activity,
  Send,
  Zap,
  Heart,
  SlidersHorizontal,
  Film,
  FolderOpen,
  Scale
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { 
  AMIE_CLINICAL_ENVIRONMENTS, 
  AMIE_CLINICAL_VIDEOS,
  getEnvironmentAssetById,
  getVideoAssetById
} from '../constants/vrAssetRegistry';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

type SimulationMediaType = 'IMAGE_360' | 'VIDEO_CLINICAL';

export const ClusterBForenseVrModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  const [sessionState, setSessionState] = useState<'STANDBY' | 'INTERROGATION'>('STANDBY');
  const [clusterBProfile, setClusterBProfile] = useState<
    'OVERT_NARCISSISM' | 'COVERT_NARCISSISM' | 'MALIGNANT_NARCISSISM' | 'BPD_SPLITTING'
  >('OVERT_NARCISSISM');

  const [mediaType, setMediaType] = useState<SimulationMediaType>('IMAGE_360');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('CLUSTER_B_COURTROOM');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('OVERT_PROVOCATION_VIDEO');

  const [isGeneratingEnv, setIsGeneratingEnv] = useState(false);
  const [envPromptStatus, setEnvPromptStatus] = useState<string>('Motor forense listo para transmisión a Pico 3.');

  const [avatarVoiceTone, setAvatarVoiceTone] = useState<'ARROGANT_COLD' | 'DEFENSIVE_HOSTILE' | 'SMARM_CHARM'>('ARROGANT_COLD');
  const [doctorInterrogationText, setDoctorInterrogationText] = useState('');
  const [avatarResponseText, setAvatarResponseText] = useState(
    'Doctor, dudo mucho que alguien en esta sala tenga la competencia técnica para comprender la magnitud de mis decisiones...'
  );
  const [isAvatarThinking, setIsAvatarThinking] = useState(false);

  // Enlace WebSocket bidireccional con el visor Pico 3
  const { isConnected, transmit, liveData } = useVrTelemetryBridge('sender', patientId, 'CLUSTER_B_FORENSIC');

  const currentEnvAsset = getEnvironmentAssetById(selectedEnvironmentId);
  const currentVideoAsset = getVideoAssetById(selectedVideoId);

  const handleInitializeAndLaunchSession = async () => {
    setIsGeneratingEnv(true);
    setEnvPromptStatus('Parametrizando perfil reactivo y transmitiendo estímulo al visor...');

    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Actúa como perito forense de AMIE. Resume en 1 frase clínica el encuadre pericial para el perfil: ${clusterBProfile} en entorno ${selectedEnvironmentId}.`;
        const result = await model.generateContent(prompt);
        setEnvPromptStatus(result.response.text()?.trim() || 'Encuadre pericial procedural establecido.');
      } else {
        setEnvPromptStatus('Encuadre clínico cargado en modo local de alta fidelidad.');
      }

      // Transmisión estructurada al visor Pico 3
      if (mediaType === 'IMAGE_360') {
        transmit({
          type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
          mediaType: 'IMAGE_360',
          environment: currentEnvAsset.id,
          mode: 'CLUSTER_B_FORENSIC',
          aiGeneratedAssetUrl: currentEnvAsset.localAssetUrl,
          profile: clusterBProfile,
          tone: avatarVoiceTone,
          patientId,
          timestamp: Date.now()
        });
      } else {
        transmit({
          type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
          mediaType: 'VIDEO_CLINICAL',
          videoId: currentVideoAsset.id,
          videoUrl: currentVideoAsset.localAssetUrl,
          aiGeneratedAssetUrl: currentVideoAsset.localAssetUrl,
          mode: 'CLUSTER_B_FORENSIC',
          triggerType: currentVideoAsset.triggerType,
          profile: clusterBProfile,
          patientId,
          timestamp: Date.now()
        });
      }

      setSessionState('INTERROGATION');
    } catch (e: any) {
      console.warn('[AMIE Forensic] Error al inicializar entorno:', e.message);
      setEnvPromptStatus('Entorno activado con parámetros locales predeterminados.');
      setSessionState('INTERROGATION');
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

    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: { temperature: 0.3 }
        });

        const prompt = `Eres un simulador pericial forense entrenado en rasgos Cluster B (${clusterBProfile}). Intervención del perito/terapeuta: "${query}". Responde en primera persona, manteniendo un tono ${avatarVoiceTone}. Refleja defensas narcisistas (devaluación, gaslighting, grandiosidad o victimización reactiva). Máximo 35 palabras.`;
        const result = await model.generateContent(prompt);
        const reply = result.response.text()?.trim() || 'Sus cuestionamientos parten de premisas sesgadas y carentes de rigor...';
        setAvatarResponseText(reply);

        transmit({
          type: 'AVATAR_SPEAKING_STREAM',
          profile: clusterBProfile,
          tone: avatarVoiceTone,
          speechText: reply,
          facialExpression: 'SUPERIORITY_SMIRK',
          patientId,
          timestamp: Date.now()
        });
      } else {
        const fallbackReply = 'Esa interpretación es reduccionista, doctor. La realidad de los hechos no se ajusta a sus categorías.';
        setAvatarResponseText(fallbackReply);
        transmit({
          type: 'AVATAR_SPEAKING_STREAM',
          profile: clusterBProfile,
          tone: avatarVoiceTone,
          speechText: fallbackReply,
          facialExpression: 'SUPERIORITY_SMIRK',
          patientId,
          timestamp: Date.now()
        });
      }
    } catch (err: any) {
      console.warn('[AMIE Forensic] Error en respuesta del avatar:', err.message);
      setAvatarResponseText('No tengo interés en validar intervenciones formuladas desde el prejuicio.');
    } finally {
      setIsAvatarThinking(false);
    }
  };

  const handleEndSession = () => {
    setSessionState('STANDBY');
    transmit({ 
      type: 'STOP_TEST',
      patientId,
      timestamp: Date.now()
    });
    if (onClose) onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl w-full mx-auto space-y-6">
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-rose-600/30">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Consola Forense Cluster B • Provocación Inmersiva &amp; Avatar Reactivo
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                FORENSIC LAB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Expediente: <strong className="text-slate-200">{patientId}</strong> | Entrenamiento pericial en detección de defensas narcisistas y psicopáticas.
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Monitor de Telemetría Bioclínica en Vivo desde la Pico 3 */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Reactividad Autonómica del Sujeto (Pico 3)
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
            isConnected 
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isConnected ? 'VISOR EN LÍNEA' : 'VISOR EN ESPERA'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> GSR (Conductancia)
            </span>
            <span className="text-base font-black font-mono text-cyan-300">
              {liveData?.gsr ?? (liveData as any)?.gsrValue ?? 2.8} <span className="text-[10px] text-slate-400 font-normal">µS</span>
            </span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> HRV (Tono Vagal)
            </span>
            <span className="text-base font-black font-mono text-rose-300">
              {liveData?.hrv ?? (liveData as any)?.vagalTone ?? 42} <span className="text-[10px] text-slate-400 font-normal">RMSSD</span>
            </span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
              <Scale className="w-3 h-3 text-indigo-400" /> Desviación Z
            </span>
            <span className="text-base font-black font-mono text-indigo-300">
              {(liveData as any)?.thetaBetaRatio ?? 1.8}σ
            </span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-emerald-400" /> Carga de Arousal
            </span>
            <span className="text-base font-black font-mono text-emerald-300">
              {liveData?.stressLevel ? `${liveData.stressLevel}%` : 'Moderada (38%)'}
            </span>
          </div>
        </div>
      </div>

      {/* ESTADO 1: CONFIGURACIÓN DE ESCENARIOS Y ESTÍMULOS */}
      {sessionState === 'STANDBY' && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4" /> Configuración del Protocolo Pericial
            </h3>

            {/* Pestañas: Entorno 360° vs Video de Provocación */}
            <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMediaType('IMAGE_360')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mediaType === 'IMAGE_360' 
                    ? 'bg-sky-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entorno 360° (/ecosystems/)
              </button>
              <button
                type="button"
                onClick={() => setMediaType('VIDEO_CLINICAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mediaType === 'VIDEO_CLINICAL' 
                    ? 'bg-rose-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Video Provocación (/video/)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Perfil Clínico del Avatar:</label>
              <select
                value={clusterBProfile}
                onChange={(e) => setClusterBProfile(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="OVERT_NARCISSISM">Narcisismo Overt (Grandioso / Arrogante)</option>
                <option value="COVERT_NARCISSISM">Narcisismo Covert (Vulnerable / Hipersensible)</option>
                <option value="MALIGNANT_NARCISSISM">Narcisismo Maligno (Paranoide / Hostil)</option>
                <option value="BPD_SPLITTING">Trastorno Límite (Escisión / Splitting)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Tono Afectivo de Respuesta:</label>
              <select
                value={avatarVoiceTone}
                onChange={(e) => setAvatarVoiceTone(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="ARROGANT_COLD">Frío / Desapegado / Distante</option>
                <option value="DEFENSIVE_HOSTILE">Defensivo / Hostil / Desafiante</option>
                <option value="SMARM_CHARM">Seductor Superficial / Manipulador</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">
                {mediaType === 'IMAGE_360' ? 'Escenario 360 Asignado:' : 'Video de Provocación:'}
              </label>

              {mediaType === 'IMAGE_360' ? (
                <select
                  value={selectedEnvironmentId}
                  onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
                >
                  <option value="CLUSTER_B_COURTROOM">01. Tribunal Pericial (/ecosystems/cluster_b_forensic.jpg)</option>
                  <option value="STERILE_EXAMINATION_ROOM">02. Sala Neutra (/ecosystems/sterile_room.jpeg)</option>
                </select>
              ) : (
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full bg-slate-900 border border-rose-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none cursor-pointer"
                >
                  {AMIE_CLINICAL_VIDEOS.map((vid) => (
                    <option key={vid.id} value={vid.id}>
                      {vid.name} ({vid.localAssetUrl})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Vista Previa del Recurso Seleccionado */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 bg-slate-900 rounded-xl border border-slate-800 items-center">
            <div className="md:col-span-4 relative rounded-lg overflow-hidden border border-slate-700 h-28 bg-black flex items-center justify-center">
              {mediaType === 'IMAGE_360' ? (
                <img 
                  src={currentEnvAsset.localAssetUrl} 
                  alt={currentEnvAsset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={currentVideoAsset.localAssetUrl} 
                  controls
                  className="w-full h-full object-contain"
                />
              )}
              <span className="absolute bottom-1 left-1 bg-black/80 text-[9px] font-mono px-1.5 py-0.5 rounded text-cyan-300">
                {mediaType === 'IMAGE_360' ? currentEnvAsset.localAssetUrl : currentVideoAsset.localAssetUrl}
              </span>
            </div>

            <div className="md:col-span-8 space-y-1 text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                {mediaType === 'IMAGE_360' ? <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> : <Film className="w-3.5 h-3.5 text-rose-400" />}
                <span>{mediaType === 'IMAGE_360' ? currentEnvAsset.name : currentVideoAsset.name}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {mediaType === 'IMAGE_360' ? currentEnvAsset.description : currentVideoAsset.description}
              </p>
              <div className="text-[10px] text-amber-300 font-mono">
                Población diana: {mediaType === 'IMAGE_360' ? currentEnvAsset.targetCondition : currentVideoAsset.targetCondition}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            <strong>Estado del Motor:</strong> {envPromptStatus}
          </div>

          <button
            type="button"
            disabled={isGeneratingEnv}
            onClick={handleInitializeAndLaunchSession}
            className="w-full py-3 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white active:scale-98"
          >
            {isGeneratingEnv ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Transmitir Escenario a Pico 3 &amp; Iniciar Peritaje</span>
          </button>
        </div>
      )}

      {/* ESTADO 2: CONTRAINTERROGATORIO ACTIVO */}
      {sessionState === 'INTERROGATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Perfil Activo</span>
              <div className="text-xs font-bold text-rose-400">{clusterBProfile.replace(/_/g, ' ')}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Estímulo en Pico 3</span>
              <div className="text-xs font-bold text-cyan-400 font-mono truncate">
                {mediaType === 'IMAGE_360' ? currentEnvAsset.localAssetUrl : currentVideoAsset.localAssetUrl}
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Tono del Avatar</span>
              <div className="text-xs font-bold text-amber-400">{avatarVoiceTone}</div>
            </div>
          </div>

          {/* Área de Visualización y Respuesta del Avatar */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                Interacción Pericial en Tiempo Real (Respuesta Reactiva del Avatar)
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Audio &amp; Expresión Sincronizados
              </span>
            </div>

            <div className="min-h-40 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="z-10 space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] font-mono">
                  {isAvatarThinking ? 'Avatar formulando defensa narcisista...' : 'Respuesta del Sujeto Simulado:'}
                </div>
                <p className="text-sm font-serif italic text-slate-200 leading-relaxed">
                  "{avatarResponseText}"
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de Contrainterrogatorio */}
          <form onSubmit={handleSendInterrogation} className="flex gap-2">
            <input
              type="text"
              value={doctorInterrogationText}
              onChange={(e) => setDoctorInterrogationText(e.target.value)}
              placeholder="Formule una pregunta pericial o intervención de confrontación..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
            />
            <button
              type="submit"
              disabled={isAvatarThinking || !doctorInterrogationText.trim()}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {isAvatarThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Confrontar</span>
            </button>
          </form>

          {/* Barra de Control de Sesión */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button 
              type="button"
              onClick={() => setSessionState('STANDBY')} 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Cambiar Estímulo / Entorno
            </button>
            <button 
              type="button"
              onClick={handleEndSession} 
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <Square className="w-4 h-4" /> 
              <span>Finalizar Peritaje &amp; Guardar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterBForenseVrModule;
