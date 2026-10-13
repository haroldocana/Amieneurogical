import React, { useEffect, useRef } from 'react';
import { Glasses, Monitor, Radio, Activity, Heart, Zap } from 'lucide-react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props {
  patientId?: string;
  isActive?: boolean;
  protocolType?: string;
  binauralHz?: number;
  lightIntensity?: number; // 0 - 100
}

export const VrHeadsetSimulator: React.FC<Props> = ({
  patientId = 'PAC-8104',
  isActive = false,
  protocolType = 'EMDR_TRAUMA',
  binauralHz = 4.5,
  lightIntensity = 80
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef<number>(0);

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (DIGITAL TWIN RECEPTOR EN CONSOLA)
  // -------------------------------------------------------------------------
  const { liveData, isStreaming, isPeerConnected } = useVrTelemetryBridge('receiver', patientId, protocolType);

  const activeStatus = isStreaming || isPeerConnected || isActive;
  const activeProtocol = String(liveData?.moduleName || protocolType || '').toUpperCase();

  // Cálculo seguro de Hz acotado matemáticamente para evitar Infinity/NaN
  const rawReactionTime = Number(liveData?.metrics?.reactionTimeMs ?? 0);
  const activeBinauralHz = rawReactionTime > 30
    ? Math.max(0.5, Math.min(60, Number((1000 / rawReactionTime).toFixed(1))))
    : (Number.isFinite(binauralHz) && binauralHz > 0 ? binauralHz : 4.5);

  // Extracción polimórfica estandarizada de biomarcadores
  const currentReactionTime = rawReactionTime > 0 ? rawReactionTime : 0;
  const currentGsr = Number(
    Number(liveData?.metrics?.gsr ?? liveData?.metrics?.gsrMicroSiemens ?? liveData?.metrics?.gsrValue ?? 2.4).toFixed(2)
  );
  const currentHrv = Math.round(
    Number(liveData?.metrics?.hrvRmssdMs ?? liveData?.metrics?.hrv ?? liveData?.metrics?.hrvMs ?? 55)
  );
  const currentHeartRate = Math.round(
    Number(liveData?.metrics?.heartRateBpm ?? liveData?.metrics?.hrvBpm ?? liveData?.metrics?.bpm ?? 72)
  );

  // Parámetros estabilizados en referencia para independizar el loop gráfico del flujo de red
  const renderParamsRef = useRef({
    activeStatus,
    activeProtocol,
    activeBinauralHz,
    lightIntensity: Math.min(100, Math.max(0, lightIntensity))
  });

  useEffect(() => {
    renderParamsRef.current = {
      activeStatus,
      activeProtocol,
      activeBinauralHz,
      lightIntensity: Math.min(100, Math.max(0, lightIntensity))
    };
  }, [activeStatus, activeProtocol, activeBinauralHz, lightIntensity]);

  // Bucle de renderizado continuo a 60 FPS sin reinicio de fase
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      const { 
        activeStatus: currentStatus, 
        activeProtocol: currentProto, 
        activeBinauralHz: currentHz, 
        lightIntensity: currentLight 
      } = renderParamsRef.current;

      timeRef.current += dt;
      const t = timeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Fondo según la intensidad lumínica proyectada en el casco
      const bgBrightness = Math.floor((currentLight / 100) * 35);
      ctx.fillStyle = `rgb(${bgBrightness}, ${bgBrightness}, ${bgBrightness + 12})`;
      ctx.fillRect(0, 0, width, height);

      // Cuadrícula sutil de perspectiva del visor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (currentStatus) {
        // 2. Simulación visual según el protocolo activo

        // A) EMDR / TEPT / TRAUMA: Barrido Bilateral Horizontal
        if (
          currentProto.includes('EMDR') || 
          currentProto.includes('TRAUMA') || 
          currentProto.includes('PTSD') ||
          currentProto.includes('ATTACHMENT')
        ) {
          const sweepFrequency = Math.max(0.2, currentHz * 0.25);
          const xPos = width / 2 + Math.sin(t * sweepFrequency * Math.PI * 2) * (width * 0.38);

          // Estela de persistencia retiniana
          ctx.beginPath();
          ctx.arc(xPos, height / 2, 22, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowBlur = 24;
          ctx.shadowColor = '#0284c7';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Marcadores laterales de anclaje visual
          ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.fillRect(width * 0.12 - 2, height / 2 - 14, 4, 28);
          ctx.fillRect(width * 0.88 - 2, height / 2 - 14, 4, 28);
        }

        // B) GAMMA / 40Hz / FOTOBIOMODULACIÓN: Estroboscopio Fótico
        else if (currentProto.includes('GAMMA') || currentProto.includes('ALZHEIMER') || currentHz >= 30) {
          const flicker = Math.sin(t * currentHz * Math.PI * 2) > 0 ? 0.85 : 0.08;
          ctx.fillStyle = `rgba(251, 191, 36, ${flicker})`;
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 65, 0, Math.PI * 2);
          ctx.shadowBlur = flicker > 0.5 ? 30 : 0;
          ctx.shadowColor = '#f59e0b';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Anillo concéntrico de frecuencia
          ctx.strokeStyle = `rgba(255, 255, 255, ${flicker * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 85, 0, Math.PI * 2);
          ctx.stroke();
        }

        // C) TDAH / EJECUTIVO / SMR: Diana de Fijación de Control Inhibitorio
        else if (currentProto.includes('TDAH') || currentProto.includes('EXECUTIVE') || currentProto.includes('SMR')) {
          const pulse = (Math.sin(t * 3) + 1) * 0.5;
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 35 + pulse * 8, 0, Math.PI * 2);
          ctx.stroke();

          // Retícula central
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
          ctx.beginPath();
          ctx.moveTo(width / 2 - 20, height / 2);
          ctx.lineTo(width / 2 + 20, height / 2);
          ctx.moveTo(width / 2, height / 2 - 20);
          ctx.lineTo(width / 2, height / 2 + 20);
          ctx.stroke();
        }

        // D) DELTA / INSOMNIO / SUEÑO: Onda de Expansión Somática Lenta
        else if (currentProto.includes('DELTA') || currentProto.includes('INSOMNIA') || currentHz <= 3) {
          const slowWave = (Math.sin(t * currentHz * Math.PI) + 1) * 0.5;
          ctx.fillStyle = `rgba(59, 130, 246, ${0.15 + slowWave * 0.25})`;
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 40 + slowWave * 70, 0, Math.PI * 2);
          ctx.fill();
        }

        // E) ALFA / THETA / HIPNO-VR / DEFAULT: Ondas Concéntricas de Relajación
        else {
          const maxRadius = width * 0.45;
          const r1 = ((t * 28) % maxRadius);
          const r2 = (((t * 28) + maxRadius / 2) % maxRadius);

          [r1, r2].forEach((radius) => {
            const alpha = Math.max(0, 1 - radius / maxRadius) * 0.5;
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
          });
        }
      } else {
        // Pantalla Standby con línea de rastreo
        const scanY = (t * 60) % height;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fillRect(0, scanY, width, 2);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STANDBY • ESPERANDO ENLACE CON VISOR PICO 3 PRO', width / 2, height / 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-slate-100">
      {/* Cabecera del Simulador */}
      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
        <span className="font-bold text-slate-300 flex items-center gap-2">
          <Glasses className="w-4 h-4 text-cyan-400" />
          Simulador Digital Twin (POV Pico Neo 3 Pro / WebXR)
        </span>
        
        <div className="flex items-center gap-2">
          {activeStatus ? (
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-500/50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse font-bold">
              <Radio className="w-3 h-3 text-emerald-400" /> STREAMING VR EN VIVO
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Monitor className="w-3 h-3" /> WebGL 60 FPS
            </span>
          )}
        </div>
      </div>

      {/* Viewport del Visor */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-inner">
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={360} 
          className="w-full h-full object-cover block" 
        />
        
        {/* Overlay Telemétrico Inferior */}
        {activeStatus && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-2 rounded-lg flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-300 gap-2">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> TR:{' '}
              <strong className="text-cyan-300">{currentReactionTime} ms</strong>
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-purple-400" /> GSR:{' '}
              <strong className="text-purple-300">{currentGsr} µS</strong>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> HRV:{' '}
              <strong className="text-emerald-300">{currentHrv} ms</strong>
            </span>
            <span className="text-slate-400">
              FC: <strong className="text-rose-300">{currentHeartRate} BPM</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VrHeadsetSimulator;
