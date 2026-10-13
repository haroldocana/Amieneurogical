import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, WifiOff, X, Glasses, Sparkles, ShieldCheck } from 'lucide-react';

interface Props {
  onClose?: () => void;
  patientId?: string;
}

export const PicoVisorApp: React.FC<Props> = ({ 
  onClose,
  patientId = 'PAC-8104'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Estados de conexión y lógica de la interfaz
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState('ACROPHOBIA_HIGH_ROOF');
  const [isAiSessionActive, setIsAiSessionActive] = useState(false);
  const [activePrompt, setActivePrompt] = useState('Esperando directriz del terapeuta...');
  const [generatedAssetUrl, setGeneratedAssetUrl] = useState('/ecosystems/acrophobia_roof.jpg');
  const [activeVoiceTone, setActiveVoiceTone] = useState('Susurro Cálido');

  // Referencias para manipular objetos 3D fuera del ciclo de renderizado de React
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const cardMeshRef = useRef<THREE.Mesh | null>(null);
  const cardTextureRef = useRef<THREE.Texture | null>(null);
  const envTextureRef = useRef<THREE.Texture | null>(null);

  // ==========================================================================
  // 1. GESTIÓN DEL WEBSOCKET (CONEXIÓN SEGURA WSS + HEARTBEAT ANTI-RENDER)
  // ==========================================================================
  useEffect(() => {
    // Resolución de URL del WebSocket (prioriza VITE_WS_URL o VITE_API_URL)
    const envApiUrl = (import.meta as any).env?.VITE_WS_URL || (import.meta as any).env?.VITE_API_URL;
    
    let wsUrl: string;
    if (envApiUrl) {
      wsUrl = envApiUrl.replace(/^http/, 'ws');
    } else {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const protocol = isHttps ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' && window.location.host 
        ? window.location.host 
        : 'amieneurogical.onrender.com';
      wsUrl = `${protocol}//${host}`;
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          ws?.send(JSON.stringify({ 
            type: 'HANDSHAKE', 
            role: 'receiver', 
            deviceType: 'PICO_3_PRO_WEBXR',
            patientId,
            timestamp: Date.now()
          }));

          // Heartbeat cada 25 segundos para evitar desconexión por inactividad en Render
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ 
                type: 'HEARTBEAT_PING', 
                role: 'receiver', 
                patientId,
                timestamp: Date.now() 
              }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            const receivedEnv = data.environment || data.ecosystem;
            if (receivedEnv) {
              setActiveEcosystem(receivedEnv);
            }

            if (data.type === 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA') {
              setIsAiSessionActive(true);
              if (data.professionalPrompt) setActivePrompt(data.professionalPrompt);
              if (data.aiGeneratedAssetUrl) setGeneratedAssetUrl(data.aiGeneratedAssetUrl);
              if (data.voiceStyle) setActiveVoiceTone(data.voiceStyle);
            }

            if (data.type === 'TRIGGER_GROUNDING_PROTOCOL') {
              setActiveEcosystem('ALPINE_SANCTUARY');
              setActivePrompt('Activando entorno de anclaje parasimpático y respiración.');
            }

            if (data.type === 'STOP_TEST') {
              setIsAiSessionActive(false);
              setActiveEcosystem('SAFE_PLACE_FOREST');
            }
          } catch (error) {
            console.error('[AMIE Visor] Error parseando JSON del WebSocket:', error);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          setIsConnected(false);
          if (pingInterval) clearInterval(pingInterval);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn('[AMIE Visor] Error inicializando WebSocket:', e);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, [patientId]);

  // ==========================================================================
  // 2. MOTOR GRÁFICO THREE.JS NATIVO WEBXR (PICO 3 PRO)
  // ==========================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    // A. Inicialización de Escena y Cámara
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / Math.max(1, height), 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true; // Activa pipeline WebXR para Pico 3
    container.appendChild(renderer.domElement);

    // B. Creación del Botón Nativo de WebXR
    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '40px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.padding = '14px 28px';
      vrBtn.style.borderRadius = '16px';
      vrBtn.style.background = 'linear-gradient(to right, #9333ea, #4f46e5)';
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
      console.warn('[AMIE Visor] VRButton no disponible en entorno actual:', e);
    }

    // C. Esfera de Entorno Inmersivo 360°
    const envGeo = new THREE.SphereGeometry(500, 60, 40);
    envGeo.scale(-1, 1, 1); // Invierte las caras para renderizar por dentro
    const envMat = new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // D. Panel Flotante para Proyección de Medios de IA
    const cardGeo = new THREE.PlaneGeometry(2.4, 1.4);
    const cardMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardMesh.position.set(0, 1.6, -2.5); // 2.5 metros al frente, a la altura de los ojos
    scene.add(cardMesh);
    cardMeshRef.current = cardMesh;

    // E. Control Táctil / Puntero para Inspección en Pantalla Plana (Chromebook/PC)
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

    // F. Bucle de Renderizado a Alta Frecuencia (72/90 Hz en visor Pico 3)
    renderer.setAnimationLoop(() => {
      if (!renderer.xr.isPresenting) {
        lat = Math.max(-85, Math.min(85, lat));
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
        );
      }
      renderer.render(scene, camera);
    });

    // Manejo de Redimensionado Seguro
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Limpieza Estricta de Recursos Gráficos
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
      
      if (cardTextureRef.current) {
        cardTextureRef.current.dispose();
        cardTextureRef.current = null;
      }
      if
