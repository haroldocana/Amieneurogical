// ============================================================================
// AMIE CLINICAL COPILOT - BARRA DE CONTROL DE VOZ GUIADA TERAPÉUTICA
// frontend/components/ClinicalAudioGuidanceBar.tsx
// ============================================================================

import React from 'react';
import { 
  useClinicalAudioGuidance 
} from '../hooks/useClinicalAudioGuidance';
import { ClinicalProtocolId, CLINICAL_PROTOCOLS } from '../services/clinicalAudioGuidanceService';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  SkipForward, 
  SkipBack, 
  ShieldAlert, 
  Sparkles,
  Radio,
  Sliders
} from 'lucide-react';

interface ClinicalAudioGuidanceBarProps {
  initialProtocolId?: ClinicalProtocolId;
  onGroundingTriggered?: () => void;
  className?: string;
}

export const ClinicalAudioGuidanceBar: React.FC<ClinicalAudioGuidanceBarProps> = ({
  initialProtocolId = 'VRET_EXPOSURE',
  onGroundingTriggered,
  className = ''
}) => {
  const {
    isSpeaking,
    isMuted,
    volume,
    activeProtocol,
    currentPhaseIndex,
    currentPhase,
    loadProtocol,
    playCurrentPhase,
    nextPhase,
    prevPhase,
    stopVoice,
    toggleMute,
    setVolume,
    triggerEmergencyGroundingVoice
  } = useClinicalAudioGuidance(initialProtocolId);

  const handleGrounding = () => {
    triggerEmergencyGroundingVoice();
    onGroundingTriggered?.();
  };

  return (
    <div className={`bg-slate-900/95 border border-sky-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-slate-100 ${className}`}>
      
      {/* 1. Cabecera y Selector de Protocolo Clínico */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl text-white ${isSpeaking ? 'bg-sky-500 animate-pulse shadow-lg shadow-sky-500/30' : 'bg-slate-800'}`}>
            <Radio className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
                Audio Guía Terapéutico (TTS CDSS)
              </span>
              {isSpeaking && (
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded text-[9.5px] font-bold animate-pulse">
                  LOCUCIÓN ACTIVA
                </span>
              )}
            </div>
            <h4 className="text-sm font-extrabold text-white">
              {activeProtocol.title}
            </h4>
          </div>
        </div>

        {/* Selector de Protocolo */}
        <div className="flex items-center gap-2">
          <select
            value={activeProtocol.protocolId}
            onChange={(e) => loadProtocol(e.target.value as ClinicalProtocolId)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {Object.values(CLINICAL_PROTOCOLS).map(p => (
              <option key={p.protocolId} value={p.protocolId}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Botón de Emergencia Grounding Verbal */}
          <button
            onClick={handleGrounding}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/60 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer animate-pulse"
            title="Detiene la tarea e inicia las instrucciones verbales de respiración y orientación"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Grounding Verbal</span>
          </button>
        </div>
      </div>

      {/* 2. Cuerpo del Guion Actual y Meta Biológica */}
      <div className="my-3 p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-sky-300">
            Fase {currentPhase?.phaseNumber} de {activeProtocol.phases.length}: {currentPhase?.phaseTitle}
          </span>
          <span className="font-mono text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Objetivo: {currentPhase?.targetBiomarker}
          </span>
        </div>

        {/* Texto que el paciente está escuchando */}
        <p className="text-xs text-slate-200 leading-relaxed italic border-l-2 border-sky-500 pl-3 py-0.5">
          "{currentPhase?.spokenScript}"
        </p>
      </div>

      {/* 3. Barra de Transporte (Play, Pause, Fases, Volumen) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          
          {/* Fase Anterior */}
          <button
            onClick={prevPhase}
            disabled={currentPhaseIndex === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 rounded-lg text-xs transition cursor-pointer"
            title="Fase anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Stop */}
          {isSpeaking ? (
            <button
              onClick={stopVoice}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md shadow-amber-600/30 transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </button>
          ) : (
            <button
              onClick={playCurrentPhase}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/30 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Locutar Fase</span>
            </button>
          )}

          {/* Siguiente Fase */}
          <button
            onClick={nextPhase}
            disabled={currentPhaseIndex >= activeProtocol.phases.length - 1}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 rounded-lg text-xs transition cursor-pointer"
            title="Siguiente fase"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Control de Volumen y Mute */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-sky-500 cursor-pointer"
            />
          </div>

          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
              isMuted 
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Activar voz' : 'Silenciar voz'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalAudioGuidanceBar;
