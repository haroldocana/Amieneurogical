import React from 'react';
import { AvatarEmotionState } from '../types';
import { User, Activity, Mic, ShieldAlert, Heart, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface SimulatedPatientAvatarProps {
  avatarUrl: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F';
  emotionState: AvatarEmotionState;
  speechRateWpm: number;
  empathyScore: number; // 0-100
  isSpeaking: boolean;
}

export const SimulatedPatientAvatar: React.FC<SimulatedPatientAvatarProps> = ({
  avatarUrl,
  patientName,
  age,
  gender,
  emotionState,
  speechRateWpm,
  empathyScore,
  isSpeaking,
}) => {
  const getEmotionConfig = (emotion: AvatarEmotionState) => {
    switch (emotion) {
      case 'Defensivo':
        return {
          glow: 'ring-rose-500/70 shadow-rose-500/30',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          desc: 'Brazos cruzados, mirada evasiva, tensión mandibular',
          prosody: 'Tono seco, tajante y reactivo',
        };
      case 'Ansioso':
        return {
          glow: 'ring-amber-500/70 shadow-amber-500/30',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          desc: 'Inquietud oculomotora, respiración acelerada superficial',
          prosody: 'Voz temblorosa, entrecortada y acelerada',
        };
      case 'Afligido':
        return {
          glow: 'ring-indigo-500/70 shadow-indigo-500/30',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          desc: 'Mirada baja, aplanamiento afectivo, hombros caídos',
          prosody: 'Bradilalia marcada, volumen bajo y monocorde',
        };
      case 'Aliviado':
        return {
          glow: 'ring-emerald-500/70 shadow-emerald-500/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          desc: 'Contacto visual sostenido, postura relajada, suspiro de descompresión',
          prosody: 'Entonación fluida y modulada',
        };
      case 'Neutral':
      default:
        return {
          glow: 'ring-cyan-500/50 shadow-cyan-500/20',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          desc: 'Atento al clínico, expresión receptiva basal',
          prosody: 'Ritmo fónico normofonatorio',
        };
    }
  };

  const config = getEmotionConfig(emotionState);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Background Holographic Scan Line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none animate-pulse" />

      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 font-mono">
            Feed Fotorrealista • Paciente Simulado IA
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {age} años • {gender === 'M' ? 'Masculino' : 'Femenino'}
        </span>
      </div>

      {/* Avatar Viewport */}
      <div className="relative mx-auto my-1 flex flex-col items-center">
        <div className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-full ring-4 ${config.glow} shadow-2xl overflow-hidden transition-all duration-500 group bg-slate-900`}>
          <img
            src={avatarUrl}
            alt={patientName}
            className={`w-full h-full object-cover object-center transition-transform duration-700 ${
              isSpeaking ? 'scale-105 filter brightness-105' : 'scale-100'
            }`}
            onError={(e) => {
              // Graceful fallback to SVG avatar
              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(patientName)}`;
            }}
          />

          {/* Speaking Audio Wave Pulse Overlay */}
          {isSpeaking && (
            <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-10 bg-cyan-300 rounded-full animate-bounce delay-150" />
                <span className="w-1.5 h-7 bg-cyan-400 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          )}

          {/* Hologram Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
        </div>

        {/* Patient Label */}
        <div className="mt-3 text-center">
          <h3 className="font-bold text-sm text-white">{patientName}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${config.badgeBg}`}>
              Estado Emocional: {emotionState}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Acoustic & Empathy Telemetry HUD */}
      <div className="mt-3 space-y-2 relative z-10 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Prosodia & Voz:</span>
          </div>
          <span className="text-[11px] text-cyan-200 font-semibold">{config.prosody}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Velocidad Fónica:</span>
            <span className="text-slate-200 font-bold">{speechRateWpm} WPM</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> Rapport Empático:
            </span>
            <span className={`font-bold ${empathyScore >= 70 ? 'text-emerald-400' : empathyScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
              {empathyScore}%
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 italic text-center pt-1 border-t border-slate-800/60">
          {config.desc}
        </div>
      </div>
    </div>
  );
};
