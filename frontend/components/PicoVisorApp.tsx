import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// Pantalla flotante 3D con el video y audio generado por IA en tiempo real
const AiVideoScreen = ({ prompt, mediaSource, audioTone }: { prompt: string; mediaSource: string; audioTone: string }) => {
  return (
    <Html position={[0, 1.6, -2.5]} center transform distanceFactor={1.5}>
      <div className="w-[450px] p-6 bg-slate-950/90 backdrop-blur-2xl border border-rose-500/40 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.3)] text-slate-100 space-y-4 select-none">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] font-mono font-bold text-rose-300 uppercase tracking-wider">Streaming IA • SES/SIS Bucle Cerrado</span>
          </div>
          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full font-mono">{audioTone}</span>
        </div>

        <div className="w-full h-36 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/40 via-transparent to-indigo-950/40 pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mb-2 text-rose-400 animate-pulse">
            ▶
          </div>
          <p className="text-xs text-rose-200 font-mono italic text-center leading-relaxed">
            "{prompt}"
          </p>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
          <span>Fuente: {mediaSource}</span>
          <span className="text-emerald-400">Sincronización WebSocket Activa</span>
        </div>
      </div>
    </Html>
  );
};

// Componente para la estimulación EMDR
const EmdrTarget = ({ hz }: { hz: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      meshRef.current.position.x = Math.sin(time * Math.PI * hz) * 3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[0.15, 32, 32]} position={[0, 1.5, -4]}>
      <meshBasicMaterial color="#a855f7" />
    </Sphere>
  );
};

export const PicoVisorApp = () => {
  const [activeEcosystem, setActiveEcosystem] = useState('NEUTRAL_LIVING_ROOM');
  const [isEmdrActive, setIsEmdrActive] = useState(false);
  const [emdrHz, setEmdrHz] = useState(1.5);
  const [isConnected, setIsConnected] = useState(false);

  const [isAiSessionActive, setIsAiSessionActive] = useState(false);
  const [activePrompt, setActivePrompt] = useState('Esperando directriz del terapeuta para inhibir/exitar (SES/SIS)...');
  const [activeMediaSource, setActiveMediaSource] = useState('GEMINI_AI_STREAM');
  const [activeVoiceTone, setActiveVoiceTone] = useState('Susurro Cálido');

  useEffect(() => {
    const wsUrl = 'wss://amieneurogical.onrender.com';
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Visor VR conectado a la Torre de Control AMIE');
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
            if (data.mediaSource) setActiveMediaSource(data.mediaSource);
            if (data.voiceStyle) setActiveVoiceTone(data.voiceStyle);
          }

          if (data.type === 'TRIGGER_GROUNDING_PROTOCOL') {
            setActiveEcosystem('ALPINE_SANCTUARY');
            setIsAiSessionActive(false);
          }

          if (data.type === 'STOP_TEST') {
            setIsAiSessionActive(false);
            setIsEmdrActive(false);
            setActiveEcosystem('NEUTRAL_LIVING_ROOM');
          }
        } catch (error) {
          console.error('Error procesando telemetría en el visor:', error);
        }
      };

      ws.onclose = () => setIsConnected(false);
    } catch (e) {
      console.warn('WebSocket no disponible, operando en modo local:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleEnterVR = async () => {
    if (navigator.xr) {
      try {
        const session = await navigator.xr.requestSession('immersive-vr');
        console.log('Sesión WebXR iniciada con éxito', session);
      } catch (err) {
        console.warn('No se pudo iniciar la sesión WebXR inmersiva:', err);
        setIsAiSessionActive(true); // Activar vista simulada en pantalla si el visor no soporta XR directo
      }
    } else {
      setIsAiSessionActive(true);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none">
      
      {/* Panel HTML frontal para el visor */}
      <div className="absolute z-10 bottom-12 flex flex-col items-center gap-4">
        <div className="text-center space-y-1">
          <h1 className="text-slate-200 font-black text-lg uppercase tracking-widest">
            Visor Clínico AMIE • Realidad Virtual
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">Paciente: PAC-8104 | Bucle Cerrado SES/SIS</p>
          <div className={`px-3 py-1 rounded-full border text-[10px] font-bold inline-block ${isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'}`}>
            {isConnected ? '🟢 Sincronizado con el Doctor' : '🔴 Modo Local / Standby'}
          </div>
        </div>
        
        <button 
          onClick={handleEnterVR}
          className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition uppercase tracking-wider text-xs cursor-pointer"
        >
          Entrar a Realidad Virtual (WebXR)
        </button>
      </div>

      {/* Canvas 3D */}
      <Canvas>
        <Environment 
          background={true} 
          files={`/ecosystems/${activeEcosystem}.jpg`} 
        />

        {isAiSessionActive && (
          <AiVideoScreen 
            prompt={activePrompt} 
            mediaSource={activeMediaSource} 
            audioTone={activeVoiceTone} 
          />
        )}

        {isEmdrActive && <EmdrTarget hz={emdrHz} />}
      </Canvas>
    </div>
  );
};

export default PicoVisorApp;
