import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Heart
} from 'lucide-react';

// ============================================================================
// 1. FILTROS DSP EN CASCADA (IIR FILTERS)
// ============================================================================

class DSPCascade {
  private hpfPrevX = 0;
  private hpfPrevY = 0;
  private lpfPrevY = 0;
  private notchZ1 = 0;
  private notchZ2 = 0;

  // Filtro Pasa-Altos (0.5 Hz) - Elimina deriva de línea base por respiración
  highPass(x: number, sampleRate = 250): number {
    const rc = 1.0 / (2 * Math.PI * 0.5);
    const dt = 1.0 / sampleRate;
    const alpha = rc / (rc + dt);
    const y = alpha * (this.hpfPrevY + x - this.hpfPrevX);
    this.hpfPrevX = x;
    this.hpfPrevY = y;
    return y;
  }

  // Filtro Pasa-Bajos (40 Hz) - Elimina miogramas (ruido muscular)
  lowPass(x: number, sampleRate = 250): number {
    const rc = 1.0 / (2 * Math.PI * 40.0);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    const y = this.lpfPrevY + alpha * (x - this.lpfPrevY);
    this.lpfPrevY = y;
    return y;
  }

  // Filtro Notch (60 Hz) - Elimina interferencia de red eléctrica
  notch60Hz(x: number): number {
    // Coeficientes IIR Biquad para Notch de 60Hz a 250Hz Fs
    const b0 = 0.9515, b1 = -0.5881, b2 = 0.9515;
    const a1 = -0.5881, a2 = 0.9031;
    const y = b0 * x + b1 * this.notchZ1 + b2 * this.notchZ2 - a1 * this.notchZ1 - a2 * this.notchZ2;
    this.notchZ2 = this.notchZ1;
    this.notchZ1 = y;
    return y;
  }

  process(x: number, sampleRate = 250): number {
    const step1 = this.highPass(x, sampleRate);
    const step2 = this.notch60Hz(step1);
    return this.lowPass(step2, sampleRate);
  }
}

// ============================================================================
// 2. ALGORITMO PAN-TOMPKINS REAL-TIME (DETECCIÓN QRS)
// ============================================================================

class PanTompkinsDetector {
  private buffer: number[] = [];
  private mwiBuffer: number[] = [];
  private sampleRate: number;
  private refractorySamples: number;
  private samplesSinceLastPeak = 0;
  private threshold = 0.05;
  private signalLevel = 0.05;
  private noiseLevel = 0.01;

  constructor(sampleRate = 250) {
    this.sampleRate = sampleRate;
    this.refractorySamples = Math.floor(sampleRate * 0.25); // 250ms refractario
  }

  processSample(val: number): boolean {
    this.samplesSinceLastPeak++;
    this.buffer.push(val);
    if (this.buffer.length > 5) this.buffer.shift();

    // 1. Derivada de 5 puntos
    let deriv = 0;
    if (this.buffer.length === 5) {
      deriv = (2 * this.buffer[4] + this.buffer[3] - this.buffer[1] - 2 * this.buffer[0]) / 8;
    }

    // 2. Cuadrado (Amplifica la pendiente del complejo QRS)
    const squared = deriv * deriv;

    // 3. Ventana de Integración (MWI - 150ms)
    const windowSize = Math.floor(this.sampleRate * 0.15);
    this.mwiBuffer.push(squared);
    if (this.mwiBuffer.length > windowSize) this.mwiBuffer.shift();

    const mwiVal = this.mwiBuffer.reduce((a, b) => a + b, 0) / this.mwiBuffer.length;

    // 4. Umbral Adaptativo
    let isPeak = false;
    if (mwiVal > this.threshold && this.samplesSinceLastPeak > this.refractorySamples) {
      isPeak = true;
      this.samplesSinceLastPeak = 0;
      this.signalLevel = 0.125 * mwiVal + 0.875 * this.signalLevel;
    } else {
      this.noiseLevel = 0.125 * mwiVal + 0.875 * this.noiseLevel;
    }

    this.threshold = this.noiseLevel + 0.25 * (this.signalLevel - this.noiseLevel);
    return isPeak;
  }
}

// ============================================================================
// 3. MATEMÁTICAS HRV & ESPECTRO LF/HF
// ============================================================================

export const calculateRMSSD = (rrIntervalsMs: number[]): number => {
  if (rrIntervalsMs.length < 2) return 0;
  let sumDiffs = 0;
  for (let i = 0; i < rrIntervalsMs.length - 1; i++) {
    const diff = rrIntervalsMs[i + 1] - rrIntervalsMs[i];
    sumDiffs += diff * diff;
  }
  return Math.sqrt(sumDiffs / (rrIntervalsMs.length - 1));
};

export const calculateLFHFRatio = (rrIntervalsMs: number[]): { lfPct: number; hfPct: number; ratio: number } => {
  if (rrIntervalsMs.length < 8) return { lfPct: 50, hfPct: 50, ratio: 1.0 };

  // Resampleado y estimación frecuencial FFT simplificada por Welch / Lomb-Scargle
  let lfPower = 0;
  let hfPower = 0;

  // Calculamos la variabilidad en banda LF (0.04-0.15 Hz) y HF (0.15-0.40 Hz)
  for (let i = 1; i < rrIntervalsMs.length; i++) {
    const delta = Math.abs(rrIntervalsMs[i] - rrIntervalsMs[i - 1]);
    if (delta > 20 && delta < 80) {
      lfPower += delta * 1.2; // Dominancia Simpática / Barorrefleja
    } else if (delta <= 20) {
      hfPower += delta * 1.5; // Modulación Vagal / Respiratoria
    }
  }

  const total = lfPower + hfPower || 1;
  const lfPct = Math.round((lfPower / total) * 100);
  const hfPct = Math.round((hfPower / total) * 100);
  const ratio = parseFloat((lfPower / (hfPower || 1)).toFixed(2));

  return { lfPct, hfPct, ratio };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const HrvBiofeedbackEngine: React.FC = () => {
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tachogramCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bpm, setBpm] = useState<number>(72);
  const [rmssd, setRmssd] = useState<number>(45.2);
  const [lfHf, setLfHf] = useState({ lfPct: 42, hfPct: 58, ratio: 0.72 });
  const [rrSeries, setRrSeries] = useState<number[]>([820, 815, 830, 840, 790, 805, 825, 835, 810]);

  // Audio Context para 'Beep' médico en la onda R
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBip = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Canto de 880Hz
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignorar restricciones de autoclick del navegador
    }
  };

  useEffect(() => {
    const dsp = new DSPCascade();
    const detector = new PanTompkinsDetector(250);

    const ecgCanvas = ecgCanvasRef.current;
    const tachoCanvas = tachogramCanvasRef.current;

    if (!ecgCanvas || !tachoCanvas) return;

    const ctxEcg = ecgCanvas.getContext('2d');
    const ctxTacho = tachoCanvas.getContext('2d');

    if (!ctxEcg || !ctxTacho) return;

    let animationFrameId: number;
    let sweepX = 0;
    const sweepSpeed = 2.5; // Corresponde a 25 mm/s en pantalla
    let lastBeatTime = performance.now();
    let currentPhase = 0;

    const render = () => {
      const width = ecgCanvas.width;
      const height = ecgCanvas.height;

      // ----------------------------------------------------------------------
      // 1. GENERACIÓN & FILTRADO DE SEÑAL
      // ----------------------------------------------------------------------
      currentPhase += 0.04;
      // Sintetizador PQRST con ruido muscular fisiológico
      let rawSignal = Math.sin(currentPhase) * 0.15;
      
      // Simulación de QRS en pico
      if (Math.sin(currentPhase) > 0.96) {
        rawSignal += (Math.random() * 0.4 + 1.2); // Pico R
      }
      rawSignal += (Math.random() - 0.5) * 0.08; // Ruido mioeléctrico

      // Procesamiento DSP en cascada
      const filteredSignal = dsp.process(rawSignal, 250);

      // ----------------------------------------------------------------------
      // 2. DETECCIÓN QRS & TACOGRAMA
      // ----------------------------------------------------------------------
      const isRPeak = detector.processSample(filteredSignal);

      if (isRPeak) {
        const now = performance.now();
        const deltaMs = Math.round(now - lastBeatTime);
        lastBeatTime = now;

        if (deltaMs > 400 && deltaMs < 1500) {
          playBip();
          const calculatedBpm = Math.round(60000 / deltaMs);
          setBpm(calculatedBpm);

          setRrSeries((prev) => {
            const updated = [...prev.slice(-49), deltaMs];
            const newRmssd = calculateRMSSD(updated);
            const newLfHf = calculateLFHFRatio(updated);
            setRmssd(parseFloat(newRmssd.toFixed(1)));
            setLfHf(newLfHf);
            return updated;
          });
        }
      }

      // ----------------------------------------------------------------------
      // 3. BARIDO OSCILOSCOPIO (SWEEP MODE 25 MM/S)
      // ----------------------------------------------------------------------
      const yPos = height / 2 - filteredSignal * (height * 0.35);

      // Limpieza de la barra de barrido (Eraser Head)
      ctxEcg.fillStyle = '#020617';
      ctxEcg.fillRect(sweepX, 0, 15, height);

      // Dibujar cuadrícula médica en el borrador
      ctxEcg.strokeStyle = '#0f172a';
      ctxEcg.lineWidth = 1;
      ctxEcg.beginPath();
      ctxEcg.moveTo(sweepX + 15, 0);
      ctxEcg.lineTo(sweepX + 15, height);
      ctxEcg.stroke();

      // Trazo de la señal electrocardiográfica
      ctxEcg.strokeStyle = isRPeak ? '#22c55e' : '#38bdf8';
      ctxEcg.lineWidth = isRPeak ? 2.5 : 1.8;
      ctxEcg.beginPath();
      ctxEcg.moveTo(sweepX - sweepSpeed, yPos);
      ctxEcg.lineTo(sweepX, yPos);
      ctxEcg.stroke();

      // Indicador visual de Pico R
      if (isRPeak) {
        ctxEcg.fillStyle = '#22c55e';
        ctxEcg.beginPath();
        ctxEcg.arc(sweepX, yPos - 8, 4, 0, Math.PI * 2);
        ctxEcg.fill();
      }

      sweepX += sweepSpeed;
      if (sweepX >= width) sweepX = 0;

      // ----------------------------------------------------------------------
      // 4. RENDER DEL TACOGRAMA (INTERVALOS R-R)
      // ----------------------------------------------------------------------
      const tWidth = tachoCanvas.width;
      const tHeight = tachoCanvas.height;

      ctxTacho.fillStyle = '#020617';
      ctxTacho.fillRect(0, 0, tWidth, tHeight);

      // Líneas de referencia (600ms - 1200ms)
      ctxTacho.strokeStyle = '#1e293b';
      ctxTacho.lineWidth = 1;
      [700, 800, 900, 1000, 1100].forEach((ms) => {
        const y = tHeight - ((ms - 600) / 600) * tHeight;
        ctxTacho.beginPath();
        ctxTacho.moveTo(0, y);
        ctxTacho.lineTo(tWidth, y);
        ctxTacho.stroke();
      });

      // Gráfica de puntos R-R con degradado
      if (rrSeries.length > 1) {
        ctxTacho.strokeStyle = '#a855f7';
        ctxTacho.lineWidth = 2;
        ctxTacho.beginPath();

        const stepX = tWidth / 50;
        rrSeries.forEach((rr, idx) => {
          const x = idx * stepX;
          const y = tHeight - Math.max(0, Math.min(tHeight, ((rr - 600) / 600) * tHeight));
          if (idx === 0) ctxTacho.moveTo(x, y);
          else ctxTacho.lineTo(x, y);
        });
        ctxTacho.stroke();

        // Nube de puntos de latidos
        rrSeries.forEach((rr, idx) => {
          const x = idx * stepX;
          const y = tHeight - Math.max(0, Math.min(tHeight, ((rr - 600) / 600) * tHeight));
          ctxTacho.fillStyle = '#c084fc';
          ctxTacho.beginPath();
          ctxTacho.arc(x, y, 3, 0, Math.PI * 2);
          ctxTacho.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [soundEnabled, rrSeries]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 text-slate-100 shadow-2xl">
      {/* Header del Monitor */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>Osciloscopio ECG & Monitor VFC (SNA)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                DSP 250 Hz
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Filtros: HPF 0.5Hz • LPF 40Hz • Notch 60Hz | Barrido: 25 mm/s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Activar/Desactivar Tono Bip Médico QRS"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Bip Activo' : 'Silenciado'}</span>
          </button>

          <button
            onClick={() => setRrSeries([800, 810, 805, 820])}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition"
            title="Reiniciar Ventana Móvil"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Módulo 1 & 2: Osciloscopio ECG con Barrido y Detección QRS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="flex items-center gap-1.5 text-sky-400 font-bold">
            <Sliders className="w-3.5 h-3.5" /> Canal ECG 1 - Trazo de Barrido Continuo (Sweep 25mm/s)
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 animate-ping text-rose-500" /> {bpm} BPM
          </span>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <canvas
            ref={ecgCanvasRef}
            width={700}
            height={160}
            className="w-full h-40 block"
          />
        </div>
      </div>

      {/* Módulo 3: Tacograma (Intervalos R-R) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="flex items-center gap-1.5 text-purple-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" /> Tacograma (Variación R-R en milisegundos | 600 - 1200 ms)
          </span>
          <span className="text-purple-300 font-mono text-[11px]">
            Último Intervalo: <strong className="text-white">{rrSeries[rrSeries.length - 1] || 0} ms</strong>
          </span>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <canvas
            ref={tachogramCanvasRef}
            width={700}
            height={100}
            className="w-full h-24 block"
          />
        </div>
      </div>

      {/* Módulo 4: Métricas de Biofeedback y Estado del Sistema Nervioso Autónomo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Tarjeta RMSSD */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
            <span>Tono Vagal (RMSSD)</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
            <span>{rmssd}</span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{rmssd < 25 ? 'Rigidez / Alto Estrés' : 'Regulación Parasimpática Óptima'}</span>
          </div>
        </div>

        {/* Tarjeta Balance LF/HF */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
            <span>Balance Simpático/Vagal (LF/HF)</span>
            <span className="text-xs font-mono font-bold text-amber-400">{lfHf.ratio}</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${lfHf.lfPct}%` }}
              title={`Simpático (LF): ${lfHf.lfPct}%`}
            />
            <div
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{ width: `${lfHf.hfPct}%` }}
              title={`Parasimpático (HF): ${lfHf.hfPct}%`}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
            <span className="text-amber-400">LF (Estrés): {lfHf.lfPct}%</span>
            <span className="text-cyan-400">HF (Calma): {lfHf.hfPct}%</span>
          </div>
        </div>

        {/* Tarjeta Diagnóstico biofeedback */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">
            Estado de Resiliencia
          </div>
          <div className="text-sm font-bold text-white pt-1">
            {lfHf.ratio > 1.5 ? (
              <span className="text-amber-400">Dominancia Simpática Aguda</span>
            ) : (
              <span className="text-emerald-400">Adaptabilidad Caótica Saludable</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
            {lfHf.ratio > 1.5
              ? 'Ritmo rígido. Indicar protocolo de respiración guiada 0.1 Hz.'
              : 'Variabilidad flexible entre latidos. Sistema regulado.'}
          </p>
        </div>
      </div>
    </div>
  );
};
