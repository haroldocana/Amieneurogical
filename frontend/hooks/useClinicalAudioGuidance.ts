// ============================================================================
// AMIE CLINICAL COPILOT - HOOK REACTIVO DE CONTROL DE AUDIO GUIADO (CLOSED-LOOP VR)
// frontend/hooks/useClinicalAudioGuidance.ts
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ClinicalAudioGuidanceEngine, 
  CLINICAL_PROTOCOLS, 
  ClinicalProtocolId, 
  AudioGuidanceProtocol, 
  AudioGuidancePhase 
} from '../services/clinicalAudioGuidanceService';
import { VrControlService } from '../services/vrControlService';

export interface UseClinicalAudioGuidanceReturn {
  isSpeaking: boolean;
  isMuted: boolean;
  volume: number;
  speechRate: number;
  activeProtocol: AudioGuidanceProtocol;
  currentPhaseIndex: number;
  currentPhase: AudioGuidancePhase | null;
  loadProtocol: (protocolId: ClinicalProtocolId) => void;
  playCurrentPhase: () => void;
  playPhaseByIndex: (index: number) => void;
  nextPhase: () => void;
  prevPhase: () => void;
  stopVoice: () => void;
  toggleMute: () => void;
  setVolume: (val: number) => void;
  setSpeechRate: (val: number) => void;
  triggerEmergencyGroundingVoice: () => void;
  speakCustomScript: (script: string) => void;
}

export const useClinicalAudioGuidance = (
  initialProtocolId: ClinicalProtocolId = 'VRET_EXPOSURE',
  autoPlayFirstPhase: boolean = false
): UseClinicalAudioGuidanceReturn => {
  const [activeProtocol, setActiveProtocol] = useState<AudioGuidanceProtocol>(
    CLINICAL_PROTOCOLS[initialProtocolId] || CLINICAL_PROTOCOLS.VRET_EXPOSURE
  );
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [speechRate, setSpeechRateState] = useState<number>(0.85);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const currentPhase: AudioGuidancePhase | null = 
    activeProtocol.phases[currentPhaseIndex] || null;

  // Detención segura al desmontar el componente
  useEffect(() => {
    return () => {
      ClinicalAudioGuidanceEngine.stop();
      VrControlService.sendCommand({
        type: 'STOP_AUDIO_GUIDANCE',
        timestamp: Date.now()
      });
    };
  }, []);

  const stopVoice = useCallback(() => {
    ClinicalAudioGuidanceEngine.stop();
    setIsSpeaking(false);

    // Notificar al visor Pico 3 que detenga la locución
    VrControlService.sendCommand({
      type: 'STOP_AUDIO_GUIDANCE',
      timestamp: Date.now()
    });
  }, []);

  const playPhaseByIndex = useCallback((index: number) => {
    const phase = activeProtocol.phases[index];
    if (!phase || isMutedRef.current) return;

    setCurrentPhaseIndex(index);
    setIsSpeaking(true);

    // 1. TRANSMISIÓN INMEDIATA AL VISOR PICO 3 VIA WEBSOCKET
    const phaseTypes = ['PHASE_1_BASELINE', 'PHASE_2_ACTIVE', 'PHASE_3_RECOVERY'];
    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: phaseTypes[index] || 'PHASE_2_ACTIVE',
      speechScript: phase.spokenScript,
      durationSec: (phase as any).durationSeconds || 60,
      ecosystem: (activeProtocol as any).ecosystem || 'safe_place_forest',
      category: (activeProtocol as any).category || 'TREATMENT',
      frequencyHz: (phase as any).recommendedHz || 0,
      timestamp: Date.now()
    });

    // 2. REPRODUCCIÓN EN ALTAVOCES LOCALES DE LA LAPTOP
    ClinicalAudioGuidanceEngine.speak(phase.spokenScript, {
      rate: phase.recommendedCadenceRate || speechRate,
      pitch: phase.recommendedPitch || 0.95,
      volume: volume,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  }, [activeProtocol, speechRate, volume]);

  const playCurrentPhase = useCallback(() => {
    playPhaseByIndex(currentPhaseIndex);
  }, [playPhaseByIndex, currentPhaseIndex]);

  const loadProtocol = useCallback((protocolId: ClinicalProtocolId) => {
    stopVoice();
    const proto = CLINICAL_PROTOCOLS[protocolId] || CLINICAL_PROTOCOLS.VRET_EXPOSURE;
    setActiveProtocol(proto);
    setCurrentPhaseIndex(0);

    // Informar al visor del cambio de protocolo
    VrControlService.syncClinicalContext({
      moduleId: proto.id || protocolId,
      category: (proto as any).category || 'TREATMENT',
      disorderId: proto.id || protocolId,
      disorderName: proto.title || protocolId,
      ecosystem: (proto as any).ecosystem || 'clinical_office',
      audioGuidance: {
        baselineScript: proto.phases[0]?.spokenScript || '',
        activeScript: proto.phases[1]?.spokenScript || '',
        recoveryScript: proto.phases[2]?.spokenScript || ''
      }
    });
  }, [stopVoice]);

  const nextPhase = useCallback(() => {
    if (currentPhaseIndex < activeProtocol.phases.length - 1) {
      const nextIdx = currentPhaseIndex + 1;
      playPhaseByIndex(nextIdx);
    }
  }, [currentPhaseIndex, activeProtocol.phases.length, playPhaseByIndex]);

  const prevPhase = useCallback(() => {
    if (currentPhaseIndex > 0) {
      const prevIdx = currentPhaseIndex - 1;
      playPhaseByIndex(prevIdx);
    }
  }, [currentPhaseIndex, playPhaseByIndex]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      if (nextMuted) {
        stopVoice();
      }
      return nextMuted;
    });
  }, [stopVoice]);

  const setVolume = useCallback((val: number) => {
    const safeVal = Math.max(0, Math.min(1, val));
    setVolumeState(safeVal);
  }, []);

  const setSpeechRate = useCallback((val: number) => {
    const safeVal = Math.max(0.6, Math.min(1.4, val));
    setSpeechRateState(safeVal);
  }, []);

  const triggerEmergencyGroundingVoice = useCallback(() => {
    setIsSpeaking(true);

    // Activar Grounding en el visor Pico 3
    VrControlService.triggerGroundingProtocol();

    ClinicalAudioGuidanceEngine.triggerEmergencyGroundingVoice(() => {
      setIsSpeaking(false);
    });
  }, []);

  const speakCustomScript = useCallback((script: string) => {
    if (isMutedRef.current || !script.trim()) return;
    setIsSpeaking(true);

    // Transmitir guion personalizado al casco
    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: 'PHASE_2_ACTIVE',
      speechScript: script,
      timestamp: Date.now()
    });

    ClinicalAudioGuidanceEngine.speak(script, {
      rate: speechRate,
      pitch: 0.95,
      volume: volume,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  }, [speechRate, volume]);

  // Reproducción automática inicial si fue solicitada
  useEffect(() => {
    if (autoPlayFirstPhase && activeProtocol.phases.length > 0) {
      playPhaseByIndex(0);
    }
  }, [autoPlayFirstPhase, activeProtocol, playPhaseByIndex]);

  return {
    isSpeaking,
    isMuted,
    volume,
    speechRate,
    activeProtocol,
    currentPhaseIndex,
    currentPhase,
    loadProtocol,
    playCurrentPhase,
    playPhaseByIndex,
    nextPhase,
    prevPhase,
    stopVoice,
    toggleMute,
    setVolume,
    setSpeechRate,
    triggerEmergencyGroundingVoice,
    speakCustomScript
  };
};

export default useClinicalAudioGuidance;
