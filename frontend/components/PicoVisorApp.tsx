import React, { useState, useEffect, useRef } from 'react';
import { VRButton, XR, Controllers } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Componente para la estimulación EMDR
const EmdrTarget = ({ hz }: { hz: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Movimiento sacádico usando la función Seno
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
  const [activeEcosystem, setActiveEcosystem] = useState('NEUTRAL_VOID');
  const [isEmdrActive, setIsEmdrActive] = useState(false);
  const [emdrHz, setEmdrHz] = useState(1.5);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Detecta la URL correcta para Render (producción) o Localhost
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    // Reemplaza esto con la URL de tu backend si está alojado por separado en Render
    const wsUrl = process.env.REACT_APP_WS_URL || `${protocol}${window.location.host}`; 
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Visor Pico 3 conectado a la Torre de Control AMIE');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'LOAD_MODULE':
          case 'START_AIMA_PROTOCOL':
            if (data.ecosystem) {
              setActiveEcosystem(data.ecosystem);
              setIsEmdrActive(false);
            }
            break;
            
          case 'START_BILATERAL_STIMULATION':
            if (data.ecosystem) setActiveEcosystem(data.ecosystem);
            setIsEmdrActive(true);
            if (data.initialHz) setEmdrHz(data.initialHz);
            break;

          case 'STOP_TEST':
            setIsEmdrActive(false);
            setActiveEcosystem('NEUTRAL_VOID');
            break;
        }
      } catch (error) {
        console.error('Error procesando telemetría en el visor:', error);
      }
    };

    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, []);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans">
      
      {/* Interfaz HTML superpuesta (Solo visible antes de entrar a VR) */}
      <div className="absolute z-10 bottom-12 flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-slate-300 font-bold text-xl uppercase tracking-widest mb-2">
            Visor Clínico AMIE
          </h1>
          <div className={`px-4 py-1.5 rounded-full border text-xs font-bold ${isConnected ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-rose-950 border-rose-500 text-rose-400'}`}>
            {isConnected ? '🟢 Sincronizado con el Doctor' : '🔴 Desconectado del Servidor'}
          </div>
        </div>
        
        {/* El botón VRButton es inyectado por @react-three/xr y detecta el hardware de Pico 3 */}
        <VRButton className="px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition uppercase tracking-wider" />
      </div>

      {/* Renderizador WebXR */}
      <Canvas>
        <XR>
          <Controllers />
          
          <Environment 
            background={true} 
            files={`/ecosystems/${activeEcosystem}.jpg`} 
          />

          {isEmdrActive && <EmdrTarget hz={emdrHz} />}
        </XR>
      </Canvas>
    </div>
  );
};
