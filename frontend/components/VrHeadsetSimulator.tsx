import React, { useEffect, useRef } from 'react';
import { Glasses, Activity, Eye, Monitor } from 'lucide-react';

interface Props {
  isActive: boolean;
  protocolType: string;
  binauralHz: number;
  lightIntensity: number; // 0 - 100
}

export const VrHeadsetSimulator: React.FC<Props> = ({
  isActive,
  protocolType,
  binauralHz,
  lightIntensity
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      // 1. Fondo según la intensidad de luz del visor
      const bgBrightness = Math.floor((lightIntensity / 100) * 40);
      ctx.fillStyle = `rgb(${bgBrightness}, ${bgBrightness}, ${bgBrightness + 10})`;
      ctx.fillRect(0, 0, width, height);

      if (isActive) {
        // 2. Simulación Visual según el Protocolo Seleccionado
        if (protocolType.includes('EMDR') || protocolType.includes('TRAUMA')) {
          // Esfera de Barrido Bilateral 3D
          const xPos = width / 2 + Math.sin(time * (binauralHz * 0.2)) * (width * 0.35);
          ctx.beginPath();
          ctx.arc(xPos, height / 2, 20, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8'; // Cyan luminoso
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#0284c7';
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (protocolType.includes('GAMMA') || binauralHz >= 30) {
          // Pulso Fótico de Alta Frecuencia Gamma (40Hz)
          const flicker = Math.sin(time * binauralHz) > 0 ? 0.8 : 0.1;
          ctx.fillStyle = `rgba(251, 191, 36, ${flicker})`; // Amarillo ámbar
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Entorno de Inducción Alfa/Theta (Ondas concéntricas de relajación)
          const radius = (time * 20) % (width / 2);
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)'; // Púrpura hipnótico
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else {
        // Pantalla de Espera en el Visor
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STANDBY - Visor Pico Neo 3 en Espera', width / 2, height / 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, protocolType, binauralHz, lightIntensity]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
        <span className="font-bold text-slate-300 flex items-center gap-2">
          <Glasses className="w-4 h-4 text-cyan-400" />
          Simulador Digital Twin (Pico Neo 3 POV)
        </span>
        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <Monitor className="w-3 h-3" /> Renderizado WebGL 60 FPS
        </span>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
        <canvas ref={canvasRef} width={480} height={270} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};
