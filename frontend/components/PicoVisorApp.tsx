import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// Pantalla flotante 3D que renderiza el asset de IA de manera segura
const SafeAiVisualScreen = ({ prompt, assetUrl, audioTone }: { prompt: string; assetUrl: string; audioTone: string }) => {
  return (
    <Html position={[0, 1.6, -2.5]} center transform distanceFactor={1.5}>
      <div className="w-[480px] p-6 bg-slate-950/95 backdrop-blur-2xl border border-rose-500/50 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.4)] text-slate-100 space-y-4 select-none">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] font-mono font-bold text-rose-300 uppercase tracking-wider">Generación IA en Vivo • Visor Inmersivo</span>
          </div>
          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full font-mono">Tono: {audioTone}</span>
        </div>

        <div className="w-full h-44 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden shadow-inner flex items-center justify-center">
          <img 
            src={assetUrl} 
            alt="Asset Generado por IA" 
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
            onError={(e) => {
              // Respaldo visual automático si la imagen falla al cargar
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 text-center">
            <p className="text-[11px] text-rose-100 font-mono italic bg-slate-950/80 px-3 py-1.5 rounded-xl border border-rose-500/30 backdrop-blur-md">
              "{prompt}"
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
          <span className="text-emerald-400">● WebXR Multimodal Activo</span>
          <span>Bucle Cerrado SES/SIS</span>
        </div>
      </div>
    </Html>
  );
};

export const PicoVisorApp = () => {
  const [activeEcosystem, setActiveEcosystem] = useState('NEUTRAL_LIVING_ROOM');
  const [isConnected, setIsConnected] = useState(false);

  const [isAiSessionActive, setIsAiSessionActive] = useState(false);
  const [activePrompt, setActivePrompt] = useState('Esperando directriz del terapeuta...');
  const [generatedAssetUrl, setGeneratedAssetUrl] = useState('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80');
  const [activeVoiceTone, setActiveVoiceTone] = useState('Susurro Cálido');

  useEffect(() => {
    const wsUrl = 'wss://amieneurogical.onrender.com';
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        ws?.send(JSON.stringify({ type: 'HANDSHAKE', role: 'receiver', patientId: 'PAC-8104' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.environment) {
            setActiveEcosystem(data.environment);
          }

          if (data.type === 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA') {
            setIsAiSessionActive(true);
            if (data.professionalPrompt) setActivePrompt(data.professionalPrompt);
            if (data.aiGeneratedAssetUrl) setGeneratedAssetUrl(data.aiGeneratedAssetUrl);
            if (data.voiceStyle) setActiveVoiceTone(data.voiceStyle);
          }

          if (data.type === 'STOP_TEST') {
            setIsAiSessionActive(false);
            setActiveEcosystem('NEUTRAL_LIVING_ROOM');
          }
        } catch (error) {
          console.error('Error procesando telemetría en el visor:', error);
        }
      };

      ws.onclose = () => setIsConnected(false);
    } catch (e) {
      console.warn('WebSocket no disponible:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleEnterVR = async () => {
    if (navigator.xr) {
      try {
        await navigator.xr.requestSession('immersive-vr');
      } catch (err) {
        setIsAiSessionActive(true);
      }
    } else {
      setIsAiSessionActive(true);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none">
      
      <div className="absolute z-10 bottom-12 flex flex-col items-center gap-4">
        <div className="text-center space-y-1">
          <h1 className="text-slate-200 font-black text-lg uppercase tracking-widest">
            Visor Clínico AMIE • WebXR
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">Paciente: PAC-8104 | Bucle Cerrado</p>
          <div className={`px-3 py-1 rounded-full border text-[10px] font-bold inline-block ${isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'}`}>
            {isConnected ? '🟢 Sincronizado' : '🔴 Standby'}
          </div>
        </div>
        
        <button 
          onClick={handleEnterVR}
          className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition uppercase tracking-wider text-xs cursor-pointer"
        >
          Entrar a Realidad Virtual (WebXR)
        </button>
      </div>

      <Canvas camera={{ position: [0, 0, 0.1] }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <Environment 
          background={true} 
          files={`/ecosystems/${activeEcosystem}.jpg`} 
        />

        {isAiSessionActive && (
          <SafeAiVisualScreen 
            prompt={activePrompt} 
            assetUrl={generatedAssetUrl} 
            audioTone={activeVoiceTone} 
          />
        )}
      </Canvas>
    </div>
  );
};

export default PicoVisorApp;
