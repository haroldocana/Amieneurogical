import React from 'react';
import { AvatarEmotionState } from '../types';
import { Volume2, Heart, Mic, Activity, Sparkles } from 'lucide-react';

interface SimulatedPatientAvatarProps {
  avatarUrl: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F' | 'Other' | string;
  emotionState: AvatarEmotionState | string;
  speechRateWpm?: number;
  empathyScore?: number; // 0-100
  isSpeaking?: boolean;
}

// Fallback visual local autónomo en caso de desconexión WAN o red clínica cerrada
const LOCAL_FALLBACK_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="%20%230284c7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

export const SimulatedPatientAvatar: React.FC<SimulatedPatientAvatarProps> = ({
  avatarUrl,
  patientName = 'Paciente Simulado',
  age = 45,
  gender = 'M',
  emotionState = 'Neutral',
  speechRateWpm = 130,
  empathyScore = 50,
  isSpeaking = false,
}) => {
  // Normalización para tolerar respuestas polimórficas de modelos de IA
  const normalizedEmotion = String(emotionState || 'neutral')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const getEmotionConfig = (emotionKey: string) => {
    switch (emotionKey) {
      case 'defensivo':
      case 'defensive':
        return {
          label: 'Defensivo',
          glow: 'ring-rose-500/70 shadow-rose-500/30',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          desc: 'Brazos cruzados, mirada evasiva, tensión mandibular',
          prosody: 'Tono seco, tajante y reactivo',
        };
      case 'ansioso':
      case 'anxious':
        return {
          label: 'Ansioso',
          glow: 'ring-amber-500/70 shadow-amber-500/30',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          desc: 'Inquietud oculomotora, respiración acelerada superficial',
          prosody: 'Voz temblorosa, entrecortada y acelerada',
        };
      case 'afligido':
      case 'distressed':
      case 'depressed':
        return {
          label: 'Afligido',
          glow: 'ring-indigo-500/70 shadow-indigo-500/30',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          desc: 'Mirada baja, aplanamiento afectivo, hombros caídos',
          prosody: 'Bradilalia marcada, volumen bajo y monocorde',
        };
      case 'aliviado':
      case 'relieved':
        return {
          label: 'Aliviado',
          glow: 'ring-emerald-500/70 shadow-emerald-500/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          desc: 'Contacto visual sostenido, postura relajada, descompresión somática',
          prosody: 'Entonación fluida y modulada',
        };
      case 'neutral':
      default:
        return {
          label: 'Neutral',
          glow: 'ring-cyan-500/50 shadow-cyan-500/20',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          desc: 'Atento al clínico, expresión receptiva basal',
          prosody: 'Ritmo fónico normofonatorio',
        };
    }
  };

  const config = getEmotionConfig(normalizedEmotion);

  const safeAge = Number.isFinite(age) ? age : 45;
  const safeGenderLabel = gender === 'M' ? 'Masculino' : gender === 'F' ? 'Femenino' : 'No binario / Otro';
  const safeEmpathy = Math.min(100, Math.max(0, Number.isFinite(empathyScore) ? empathyScore : 50));
  const safeSpeechRate = Math.max(0, Number.isFinite(speechRateWpm) ? speechRateWpm : 130);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between font-sans text-slate-100">
      {/* Línea de Escaneo Holográfico */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none animate-pulse" />

      {/* Cabecera Telemétrica Superior */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Feed Fotorrealista • Paciente Simulado IA
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {safeAge} años • {safeGenderLabel}
        </span>
      </div>

      {/* Visor Central del Avatar */}
      <div className="relative mx-auto my-1 flex flex-col items-center">
        <div className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-full ring-4 ${config.glow} shadow-2xl overflow-hidden transition-all duration-500 group bg-slate-900`}>
          <img
            src={avatarUrl || LOCAL_FALLBACK_AVATAR}
            alt={`Avatar simulado del paciente ${patientName}`}
            className={`w-full h-full object-cover object-center transition-transform duration-700 ${
              isSpeaking ? 'scale-105 filter brightness-105' : 'scale-100'
            }`}
            onError={(e) => {
              // Corta el ciclo recursivo de error de inmediato
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = LOCAL_FALLBACK_AVATAR;
            }}
          />

          {/* Animación de Modulación Acústica al Hablar */}
          {isSpeaking && (
            <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-10 bg-cyan-300 rounded-full animate-bounce delay-150" />
                <span className="w-1.5 h-7 bg-cyan-400 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          )}

          {/* Indicador de Micrófono Activo */}
          {isSpeaking && (
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-cyan-500/80 text-white shadow-lg animate-pulse z-20">
              <Mic className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Trama de Red Holográfica */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
        </div>

        {/* Identificación y Estado Emocional */}
        <div className="mt-3 text-center">
          <h3 className="font-bold text-sm text-white tracking-wide">{patientName}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${config.badgeBg}`}>
              Estado Emocional: {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Panel Telemétrico de Prosodia y Alianza Terapéutica */}
      <div className="mt-3 space-y-2 relative z-10 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Prosodia &amp; Voz:</span>
          </div>
          <span className="text-[11px] text-cyan-200 font-semibold truncate max-w-[210px] sm:max-w-none text-right">
            {config.prosody}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              Fónica:
            </span>
            <span className="text-slate-200 font-bold tabular-nums">{safeSpeechRate} WPM</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> Rapport:
            </span>
            <span className={`font-bold tabular-nums ${
              safeEmpathy >= 70 ? 'text-emerald-400' : safeEmpathy >= 40 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {safeEmpathy}%
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 italic text-center pt-1 border-t border-slate-800/60 font-sans">
          {config.desc}
        </div>
      </div>
    </div>
  );
};

export default SimulatedPatientAvatar;
