import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, WifiOff, X } from 'lucide-react';

interface Props {
  onClose?: () => void;
}

export const PicoVisorApp: React.FC<Props> = ({ onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Estados de conexión y lógica de la interfaz
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState('NEUTRAL_LIVING_ROOM');
  const [isAiSessionActive, setIsAiSessionActive] = useState(false);
  const [activePrompt, setActivePrompt] = useState('Esperando directriz del terapeuta...');
  const [generatedAssetUrl, setGeneratedAssetUrl] = useState('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80');
  const [activeVoiceTone, setActiveVoiceTone] = useState('Susurro Cálido');

  // Referencias para manipular objetos 3D fuera del ciclo de renderizado de React
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const cardMeshRef = useRef<THREE.Mesh | null>(null);
  const cardTextureRef = useRef<THREE.Texture | null>(null);

  // ==========================================================================
  // 1. GESTIÓN DEL WEBSOCKET (CONEXIÓN SEGURA WSS)
  // ==========================================================================
  useEffect(() => {
    // Detectar dinámicamente el host (Render) o usar localhost si estás en desarrollo
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'amieneurogical.onrender.com';
    const wsUrl = `${protocol}//${host}`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
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
            console.error('Error parseando JSON del WebSocket:', error);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000); // Reconexión automática
        };
      } catch (e) {
        console.warn('Error inicializando WebSocket:', e);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  // ==========================================================================
  // 2. MOTOR GRÁFICO THREE.JS NATIVO (ELIMINA REACT THREE FIBER Y EL CRASH)
  // ==========================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // A. Inicialización Básica
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true; // Habilita WebXR en las Pico 3
    container.appendChild(renderer.domElement);

    // B. Creación del Botón de Entrada a VR
    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '40px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.padding = '14px 28px';
      vrBtn.style.borderRadius = '16px';
      vrBtn.style.background = 'linear-gradient(to right, #9333ea, #4f46e5)'; // purple-600 to indigo-600
      vrBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      vrBtn.style.color = '#ffffff';
      vrBtn.style.fontFamily = 'system-ui, sans-serif';
      vrBtn.style.fontSize = '12px';
      vrBtn.style.fontWeight = 'bold';
      vrBtn.style.letterSpacing = '0.05em';
      vrBtn.style.textTransform = 'uppercase';
      vrBtn.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.4)';
      vrBtn.style.cursor = 'pointer';
      vrBtn.style.zIndex = '10000';
      container.appendChild(vrBtn);
    } catch (e) {
      console.warn('VRButton nativo no disponible:', e);
    }

    // C. Esfera de Entorno 360° (Fondo Inmersivo)
    const envGeo = new THREE.SphereGeometry(500, 60, 40);
    envGeo.scale(-1, 1, 1); // Invierte para ver por dentro
    const envMat = new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // D. Panel Plano Flotante para mostrar imágenes de la IA (Reemplaza <Html>)
    const cardGeo = new THREE.PlaneGeometry(2.4, 1.4);
    // Iniciamos transparente (opacity: 0) hasta que haya una sesión activa
    const cardMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardMesh.position.set(0, 1.6, -2.5); // Posicionado frente a los ojos del paciente
    scene.add(cardMesh);
    cardMeshRef.current = cardMesh;

    // E. Lógica de arrastre de cámara para vista en PC/Chromebook sin entrar a VR
    let isPointerDown = false;
    let lon = 0, lat = 0;
    let pointerX = 0, pointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerX = e.clientX;
      pointerY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      lon += (pointerX - e.clientX) * 0.1;
      lat += (e.clientY - pointerY) * 0.1;
      pointerX = e.clientX;
      pointerY = e.clientY;
    };
    const onPointerUp = () => { isPointerDown = false; };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // F. Bucle de Animación / Renderizado (90 FPS en Pico 3)
    renderer.setAnimationLoop(() => {
      // Rotar cámara manualmente si NO estamos dentro de las gafas VR
      if (!renderer.xr.isPresenting) {
        lat = Math.max(-85, Math.min(85, lat));
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
      }
      renderer.render(scene, camera);
    });

    // Manejo de redimensionado de ventana
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Limpieza de memoria al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      
      renderer.setAnimationLoop(null);
      envGeo.dispose();
      envMat.dispose();
      cardGeo.dispose();
      cardMat.dispose();
      if (cardTextureRef.current) cardTextureRef.current.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, []);

  // ==========================================================================
  // 3. ACTUALIZACIÓN REACTIVA DE TEXTURAS (SIN RE-RENDERIZAR REACT)
  // ==========================================================================
  
  // Actualizar imagen 360 del entorno cuando cambie 'activeEcosystem'
  useEffect(() => {
    if (!envMeshRef.current || !activeEcosystem) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;
    const loader = new THREE.TextureLoader();
    
    loader.load(
      `/ecosystems/${activeEcosystem}.jpg`,
      (texture) => {
        if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        mat.map = texture;
        mat.color.setHex(0xffffff); // Quitar tinte negro
        mat.needsUpdate = true;
      },
      undefined,
      () => {
        // Textura por defecto si falla
        loader.load('/ecosystems/SAFE_PLACE_FOREST.jpg', (fallbackTex) => {
          mat.map = fallbackTex;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
        });
      }
    );
  }, [activeEcosystem]);

  // Actualizar imagen generada por IA en el panel flotante
  useEffect(() => {
    if (!cardMeshRef.current) return;
    const mat = cardMeshRef.current.material as THREE.MeshBasicMaterial;

    if (isAiSessionActive && generatedAssetUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(generatedAssetUrl, (texture) => {
        if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        
        // Limpiar textura anterior de memoria
        if (cardTextureRef.current) cardTextureRef.current.dispose();
        
        cardTextureRef.current = texture;
        mat.map = texture;
        mat.opacity = 1; // Hacer visible el panel
        mat.needsUpdate = true;
      });
    } else {
      mat.opacity = 0; // Ocultar panel si no hay sesión IA
      mat.needsUpdate = true;
    }
  }, [isAiSessionActive, generatedAssetUrl]);

  // ==========================================================================
  // 4. INTERFAZ 2D (HTML SUPERPUESTO PARA LA CHROMEBOOK/PC)
  // ==========================================================================
  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      
      {/* Botón Salir */}
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-4 bg-slate-900/60 hover:bg-slate-800 rounded-2xl border border-slate-800 z-[10000] cursor-pointer text-slate-300 hover:text-white backdrop-blur-md transition shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Interfaz Superior / Estado de Red */}
      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-xl">
          <h1 className="text-slate-200 font-black text-sm uppercase tracking-widest">
            Visor Clínico AMIE • WebXR
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">Paciente: PAC-8104 | Bucle Cerrado</p>
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${isConnected ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'}`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? 'Sincronizado con Consola' : 'Buscando Red...'}</span>
          </div>
        </div>
      </div>

      {/* Previsualización del Promt de IA en la pantalla 2D (Solo para el monitor de PC) */}
      {isAiSessionActive && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 w-[420px] p-5 bg-slate-950/90 backdrop-blur-xl border border-rose-500/50 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.3)] text-slate-100 space-y-3 pointer-events-none hidden md:block">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider">Generación IA en Vivo</span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full font-mono">Tono: {activeVoiceTone}</span>
          </div>
          <div className="w-full h-36 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative">
            <img src={generatedAssetUrl} alt="Asset Generado" className="w-full h-full object-cover opacity-80" />
            <div className="absolute bottom-2 left-2 right-2 text-center bg-slate-950/80 p-1.5 rounded-lg border border-rose-500/30">
              <p className="text-[10px] text-rose-100 font-mono italic">"{activePrompt}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor DOM para el motor gráfico nativo */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 bg-slate-950 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default PicoVisorApp;
