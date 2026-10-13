import React, { useState } from 'react';
import { PatientRecord } from '../types';
import {
  Monitor,
  Compass,
  ShieldCheck,
  Scale,
  CloudRain,
  Activity,
  Heart,
  Zap,
  Play,
  Square,
  Eye,
  SlidersHorizontal,
  FolderOpen,
  Film,
  Video
} from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import {
  AMIE_CLINICAL_ENVIRONMENTS,
  AMIE_CLINICAL_VIDEOS,
  getEnvironmentAssetById,
  getVideoAssetById,
  VrEnvironmentAsset,
  VrVideoAsset
} from '../constants/vrAssetRegistry';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

type ModeType = 'ENVIRONMENT_360' | 'CLINICAL_VIDEO';
type ClinicalVrModule = 
  | 'CLUSTER_B_FORENSIC' 
  | 'PHOBIA_VRET' 
  | 'HYPNOSIS' 
  | 'SEXUAL_HEALTH_SES_SIS' 
  | 'SYSTEMIC_COUPLE' 
  | 'NEURO_TRAUMA' 
  | 'TDAH';

export const AmieUnifiedVrConsole: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  const [mediaMode, setMediaMode] = useState<ModeType>('ENVIRONMENT_360');
  const [vrModule, setVrModule] = useState<ClinicalVrModule>('CLUSTER_B_FORENSIC');

  // Identificadores de activo seleccionado
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('CLUSTER_B_COURTROOM');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('OVERT_PROVOCATION_VIDEO');

  // Parámetros clínicos
  const [clusterBPattern, setClusterBPattern] = useState<'GASLIGHTING' | 'LOVE_BOMBING' | 'SILENT_TREATMENT' | 'EGO_THREAT'>('EGO_THREAT');
  const [vretExposureStep, setVretExposureStep] = useState<number>(3);
  const [isAiAutoRegulationActive, setIsAiAutoRegulationActive] = useState<boolean>(true);

  // Enlace WebSocket bidireccional (Chromebook <-> Pico 3)
  const { isConnected, transmit, liveData } = useVrTelemetryBridge('sender', patientId, `UnifiedVR_${vrModule}`);
  const [sessionActive, setSessionActive] = useState<boolean>(false);

  // Activos actuales resueltos
  const currentEnvironment: VrEnvironmentAsset = getEnvironmentAssetById(selectedEnvironmentId);
  const currentVideo: VrVideoAsset = getVideoAssetById(selectedVideoId);

  // Cambio de módulo con asignación automática de escenario local
  const handleModuleChange = (newModule: ClinicalVrModule) => {
    setVrModule(newModule);

    let defaultEnvId = 'CLUSTER_B_COURTROOM';
    if (newModule === 'CLUSTER_B_FORENSIC') defaultEnvId = 'CLUSTER_B_COURTROOM';
    else if (newModule === 'SEXUAL_HEALTH_SES_SIS') defaultEnvId = 'DUAL_CONTROL_SES_SIS';
    else if (newModule === 'SYSTEMIC_COUPLE') defaultEnvId = 'CLINICAL_OFFICE_CONSULT';
    else if (newModule === 'PHOBIA_VRET') defaultEnvId = 'ACROPHOBIA_HIGH_ROOF';
    else if (newModule === 'HYPNOSIS') defaultEnvId = 'NEURO_HYPNOSIS_TRANCE';
    else if (newModule === 'NEURO_TRAUMA') defaultEnvId = 'EMDR_MEMORY_REPROCESS';
    else if (newModule === 'TDAH') defaultEnvId = 'TDAH_EXECUTIVE_LAB';

    setSelectedEnvironmentId(defaultEnvId);
  };

  const handleStartSession = () => {
    if (mediaMode === 'ENVIRONMENT_360') {
      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
        mediaType: 'IMAGE_360',
        environment: currentEnvironment.id,
        mode: vrModule,
        aiGeneratedAssetUrl: currentEnvironment.localAssetUrl,
        autoRegulation: isAiAutoRegulationActive,
        clusterBPattern,
        vretStep: vretExposureStep,
        patientId,
        timestamp: Date.now()
      });
    } else {
      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
        mediaType: 'VIDEO_CLINICAL',
        videoId: currentVideo.id,
        videoUrl: currentVideo.localAssetUrl,
        aiGeneratedAssetUrl: currentVideo.localAssetUrl,
        mode: 'CLUSTER_B_FORENSIC',
        triggerType: currentVideo.triggerType,
        patientId,
        timestamp: Date.now()
      });
    }

    setSessionActive(true);
  };

  const handleEndSession = () => {
    setSessionActive(false);
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
          <div className="p-3 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-cyan-600/20">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">
              Consola Profesional AMIE • 19 Entornos 360° &amp; Videos de Provocación
            </h2>
            <p className="text-xs text-slate-400">
              Expediente: <strong className="text-slate-200">{patientId}</strong> | Enlace Local Directo (Pico 3)
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

      {/* Monitor de Telemetría Bioclínica en Tiempo Real */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Telemetría del Visor en Vivo (Pico 3)
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
            isConnected 
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isConnected ? 'PICO 3 EN LÍNEA' : 'PICO 3 EN ESPERA'}
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
              <Eye className="w-3 h-3 text-indigo-400" /> Ratio Theta/Beta
            </span>
            <span className="text-base font-black font-mono text-indigo-300">
              {(liveData as any)?.thetaBetaRatio ?? 1.8}σ
            </span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-emerald-400" /> Índice de Estrés
            </span>
            <span className="text-base font-black font-mono text-emerald-300">
              {liveData?.stressLevel ? `${liveData.stressLevel}%` : 'Normal (32%)'}
            </span>
          </div>
        </div>
      </div>

      {/* Pestañas de Selección: Entornos 360° vs Videos Clínicos */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setMediaMode('ENVIRONMENT_360')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            mediaMode === 'ENVIRONMENT_360'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" /> 19 Entornos 360° (/ecosystems/)
        </button>
        <button
          type="button"
          onClick={() => {
            setMediaMode('CLINICAL_VIDEO');
            setVrModule('CLUSTER_B_FORENSIC');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            mediaMode === 'CLINICAL_VIDEO'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" /> Videos de Provocación Narcisismo (/video/)
        </button>
      </div>

      {/* Panel de Configuración según Modo */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        {mediaMode === 'ENVIRONMENT_360' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Especialidad Clínica:</label>
                <select
                  value={vrModule}
                  onChange={(e) => handleModuleChange(e.target.value as ClinicalVrModule)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="CLUSTER_B_FORENSIC">⚖️ Peritaje Forense Cluster B (Narcisismo)</option>
                  <option value="SEXUAL_HEALTH_SES_SIS">💕 Control Sexual Dual (SES / SIS)</option>
                  <option value="PHOBIA_VRET">🌪️ VRET Fobias (Acrofobia / Aerofobia)</option>
                  <option value="HYPNOSIS">🧘 Neurohipnosis &amp; Grounding</option>
                  <option value="NEURO_TRAUMA">🧠 Trauma, EMDR &amp; Apego</option>
                  <option value="TDAH">🎯 Laboratorio Ejecutivo TDAH</option>
                  <option value="SYSTEMIC_COUPLE">👥 Terapia Sistémica de Pareja</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Escenario 360 Asignado:</label>
                <select
                  value={selectedEnvironmentId}
                  onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
                >
                  {AMIE_CLINICAL_ENVIRONMENTS.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vista Previa de la Imagen Local */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 bg-slate-900 rounded-xl border border-slate-800 items-center">
              <div className="md:col-span-4 relative rounded-lg overflow-hidden border border-slate-700 h-28 bg-black">
                <img
                  src={currentEnvironment.localAssetUrl}
                  alt={currentEnvironment.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 bg-black/80 text-[9px] font-mono px-1.5 py-0.5 rounded text-cyan-300">
                  {currentEnvironment.localAssetUrl}
                </span>
              </div>
              <div className="md:col-span-8 space-y-1 text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentEnvironment.name}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentEnvironment.description}</p>
                <div className="text-[10px] text-amber-300 font-mono">Indicación: {currentEnvironment.targetCondition}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Modo Video de Provocación Clínica */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-rose-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" /> Seleccionar Video de Provocación Narcisista / Pericial:
              </label>

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

              {/* Vista Previa del Video */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 bg-slate-900 rounded-xl border border-slate-800 items-center">
                <div className="md:col-span-5 relative rounded-lg overflow-hidden border border-rose-500/30 h-32 bg-black flex items-center justify-center">
                  <video
                    src={currentVideo.localAssetUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="md:col-span-7 space-y-1 text-xs">
                  <div className="font-bold text-rose-200 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-rose-400" />
                    <span>{currentVideo.name}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{currentVideo.description}</p>
                  <div className="text-[10px] text-amber-300 font-mono">Población diana: {currentVideo.targetCondition}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Controles para Cluster B / Narcisismo */}
        {vrModule === 'CLUSTER_B_FORENSIC' && (
          <div className="p-4 bg-slate-900 rounded-xl border border-amber-500/30 space-y-3">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" /> Protocolo de Provocación al Ego / Peritaje Forense:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Patrón de Provocación:</label>
                <select 
                  value={clusterBPattern} 
                  onChange={(e) => setClusterBPattern(e.target.value as any)} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 cursor-pointer"
                >
                  <option value="EGO_THREAT">Amenaza Directa al Ego (Overt Ego Threat)</option>
                  <option value="GASLIGHTING">Gaslighting / Confrontación de Realidad</option>
                  <option value="LOVE_BOMBING">Love Bombing / Quiebre de Idealización</option>
                  <option value="SILENT_TREATMENT">Silent Treatment / Abandono Repentino</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800 w-full">
                  <input 
                    type="checkbox" 
                    checked={isAiAutoRegulationActive} 
                    onChange={(e) => setIsAiAutoRegulationActive(e.target.checked)} 
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 cursor-pointer" 
                  />
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Freno Autonómico Activo (GSR &gt; 8 µS)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Controles para VRET (Fobias) */}
        {vrModule === 'PHOBIA_VRET' && (
          <div className="p-4 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-3">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-indigo-400" /> Control de Exposición Jerarquizada (VRET):
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">Nivel de Exposición (1-10):</span>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={vretExposureStep} 
                onChange={(e) => setVretExposureStep(Number(e.target.value))} 
                className="flex-1 accent-indigo-500 cursor-pointer" 
              />
              <span className="font-mono font-bold text-indigo-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                Nivel {vretExposureStep}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botón de Transmisión */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-400">
          Activo Listo: <strong className="text-cyan-400 font-mono">
            {mediaMode === 'ENVIRONMENT_360' ? currentEnvironment.localAssetUrl : currentVideo.localAssetUrl}
          </strong>
        </span>

        {!sessionActive ? (
          <button
            type="button"
            onClick={handleStartSession}
            className="flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-600 hover:from-cyan-400 hover:to-rose-500 text-white cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <Play className="w-4 h-4" />
            <span>Transmitir {mediaMode === 'ENVIRONMENT_360' ? 'Entorno 360°' : 'Video'} a Pico 3</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEndSession}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95 transition"
          >
            <Square className="w-4 h-4" />
            <span>Detener y Guardar Telemetría</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AmieUnifiedVrConsole;
