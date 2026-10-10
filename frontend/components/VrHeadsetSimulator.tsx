import React, { useEffect, useRef } from 'react';
import { Glasses, Monitor, Radio } from 'lucide-react';
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

  // -------------------------------------------------------------------------
  // CONEXIÓN PUENTE VR (RECEPTOR EN LA CONSOLA DEL MÉDICO)
  // -------------------------------------------------------------------------
  const { liveData, isStreaming } = useVrTelemetryBridge('receiver', patientId, protocolType);

  // Determinar parámetros activos (vienen del Visor real en vivo O de las props locales)
  const activeStatus = isStreaming ? true : isActive;
  const activeProtocol = liveData?.moduleName || protocolType;
  
  // Cálculo de Hz o respuesta dinámica según telemetría recibida
  const activeBinauralHz = liveData?.metrics?.reactionTimeMs 
    ? (1000 / liveData.metrics.reactionTimeMs) 
    : binauralHz;

  // Extracción robusta de biomarcadores con fallbacks de nombres de propiedades
  const currentReactionTime = liveData?.metrics?.reactionTimeMs ?? 0;
  const currentGsr = liveData?.metrics?.gsr ?? liveData?.metrics?.gsrValue ?? 3.5;
  const currentHrv = liveData?.metrics?.hrv ?? liveData?.metrics?.hrvBpm ?? 70;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Fondo según la intensidad de luz proyectada en el visor
      const bgBrightness = Math.floor((lightIntensity / 100) * 40);
      ctx.fillStyle = `rgb(${bgBrightness}, ${bgBrightness}, ${bgBrightness + 10})`;
      ctx.fillRect(0, 0, width, height);

      if (activeStatus) {
        // 2. Simulación Visual según el Protocolo Seleccionado
        if (
          activeProtocol.includes('EMDR') || 
          activeProtocol.includes('TRAUMA') || 
          activeProtocol.includes('PTSD') ||
          activeProtocol.includes('DEV_TRAUMA')
        ) {
          // Esfera de Barrido Bilateral 3D (EMDR)
          const xPos = width / 2 + Math.sin(time * (activeBinauralHz * 0.2)) * (width * 0.35);
          ctx.beginPath();
          ctx.arc(xPos, height / 2, 20, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8'; // Cyan luminoso
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#0284c7';
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (activeProtocol.includes('GAMMA') || activeBinauralHz >= 30) {
          // Pulso Fótico de Alta Frecuencia Gamma (40Hz)
          const flicker = Math.sin(time * activeBinauralHz) > 0 ? 0.8 : 0.1;
          ctx.fillStyle = `rgba(251, 191, 36, ${flicker})`; // Amarillo ámbar
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Entorno de Inducción Alfa/Theta (Ondas concéntricas de relajación / Narcisismo / TDAH)
          const radius = (time * 20) % (width / 2);
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)'; // Púrpura hipnótico
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else {
        // Pantalla de Espera en la Consola
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STANDBY - Esperando transmisión desde visor Pico 3...', width / 2, height / 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeStatus, activeProtocol, activeBinauralHz, lightIntensity]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
        <span className="font-bold text-slate-300 flex items-center gap-2">
          <Glasses className="w-4 h-4 text-cyan-400" />
          Simulador Digital Twin (POV Pico Neo 3 / Meta Quest)
        </span>
        
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <Radio className="w-3 h-3 text-emerald-400" /> STREAMING VR EN VIVO
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Monitor className="w-3 h-3" /> WebGL 60 FPS
            </span>
          )}
        </div>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-inner">
        <canvas ref={canvasRef} width={480} height={270} className="w-full h-full object-cover" />
        
        {/* Overlay de Telemetría Biométrica en Tiempo Real */}
        {isStreaming && liveData?.metrics && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-2 rounded-lg flex justify-between text-[10px] font-mono text-slate-300">
            <span>Latencia TR: <strong className="text-cyan-300">{currentReactionTime} ms</strong></span>
            <span>GSR: <strong className="text-purple-300">{currentGsr} µS</strong></span>
            <span>HRV: <strong className="text-emerald-300">{currentHrv} BPM</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
