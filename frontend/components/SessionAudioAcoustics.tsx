import React, { useState } from 'react';
import { SessionAudioRecording } from '../types';
import { 
  Mic, Play, Pause, Volume2, Activity, FileText, Sparkles, Gauge, FastForward 
} from 'lucide-react';

interface SessionAudioAcousticsProps {
  audioRecordings?: SessionAudioRecording[];
}

export const SessionAudioAcoustics: React.FC<SessionAudioAcousticsProps> = ({ audioRecordings }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!audioRecordings || audioRecordings.length === 0) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
        <Mic className="w-4 h-4 text-slate-500" />
        <span>No hay grabaciones de audio o biometría acústica adjuntas a este expediente.</span>
      </div>
    );
  }

  const recording = audioRecordings[activeIdx] || audioRecordings[0];
  const bio = recording.acousticBiometrics;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextRecording = () => {
    setIsPlaying(false);
    setActiveIdx((prev) => (prev + 1) % audioRecordings.length);
  };

  const getMarkerColor = (marker: string) => {
    switch (marker) {
      case 'Inhibición Severa':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Presión del Habla (Taquilalia)':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Aplanamiento Afectivo':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Labilidad Emocional':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              Audio de Sesión & Biometría Acústica
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </h3>
            <span className="text-[10px] text-slate-400">
              Análisis prosódico, velocidad fonatoria y latencia de respuesta
            </span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getMarkerColor(bio.acousticStressMarker)}`}>
          {bio.acousticStressMarker}
        </span>
      </div>

      {/* Selector de Múltiples Muestras de Audio */}
      {audioRecordings.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {audioRecordings.map((rec, idx) => (
            <button
              key={rec.id || idx}
              onClick={() => {
                setActiveIdx(idx);
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition shrink-0 ${
                activeIdx === idx
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Muestra #{rec.sessionNumber || idx + 1} ({rec.durationSeconds}s)
            </button>
          ))}
        </div>
      )}

      {/* Audio Player Strip */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            {recording.audioTitle}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Sesión #{recording.sessionNumber} • {recording.durationSeconds}s
          </span>
        </div>

        {/* Audio Waveform Visualization */}
        <div className="flex items-center gap-1.5 h-9 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0 shadow-md shadow-indigo-600/30"
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {audioRecordings.length > 1 && (
            <button
              onClick={handleNextRecording}
              className="p-1 rounded text-slate-400 hover:text-white transition shrink-0"
              title="Siguiente grabación"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex-1 flex items-center gap-1 h-full px-2">
            {(recording.audioWaveformData || [20, 35, 60, 45, 80, 50, 65, 40, 75, 90, 55, 30, 45, 60, 70]).map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-all ${
                  isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono text-cyan-300">
            {isPlaying ? '00:18' : '00:00'} / {Math.floor(recording.durationSeconds / 60)}:{(recording.durationSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Acoustic Biometrics Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-400" /> Velocidad Habla
          </span>
          <div className="text-base font-bold font-mono text-cyan-300">
            {bio.speechRateWpm} <span className="text-[10px] font-normal text-slate-400">WPM</span>
          </div>
          <span className="text-[9px] text-slate-500 block truncate">
            {bio.speechRateWpm < 90 ? 'Bradilalia severa' : bio.speechRateWpm > 180 ? 'Taquilalia franca' : 'Normofonatorio (120-160)'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" /> Latencia Respuesta
          </span>
          <div className="text-base font-bold font-mono text-amber-300">
            {bio.responseLatencyMs} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
          <span className="text-[9px] text-slate-500 block truncate">
            {bio.responseLatencyMs > 1800 ? 'Inhibición / Retardo' : bio.responseLatencyMs < 150 ? 'Impulsividad verbal' : 'Pausa normal (<500ms)'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Aplanamiento Afectivo</span>
          <div className="text-base font-bold font-mono text-purple-300">
            {bio.affectiveFlatteningScore}%
          </div>
          <span className="text-[9px] text-slate-500 block truncate">
            {bio.affectiveFlatteningScore > 70 ? 'Monotonía severa' : 'Modulación conservada'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Variabilidad Prosódica</span>
          <div className="text-base font-bold font-mono text-emerald-300">
            {bio.prosodyVariabilityPct}%
          </div>
          <span className="text-[9px] text-slate-500 block truncate">
            {bio.prosodyVariabilityPct < 20 ? 'Falta de inflexión' : 'Rango dinámico sano'}
          </span>
        </div>
      </div>

      {/* Transcript Viewer */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
        <div className="font-semibold text-sky-400 flex items-center gap-1.5 text-[11px]">
          <FileText className="w-3.5 h-3.5" /> Transcripción Fonética Automática (Speech-to-Text):
        </div>
        <p className="text-slate-300 leading-relaxed italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
          "{recording.transcriptText}"
        </p>
      </div>
    </div>
  );
};
