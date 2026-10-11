import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Wifi, WifiOff, X, CheckCircle2 } from 'lucide-react';

interface Props {
  patientId?: string;
  moduleId?: string;
  onClose?: () => void;
}

export const VrPatientExperience: React.FC<Props> = ({ 
  patientId = 'PAC-8104', 
  moduleId = 'NARCISSISM_CLUSTER_B',
  onClose 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Estados de la aplicación
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState('NEUTRAL_LIVING_ROOM');
  const [isVideo, setIsVideo] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Iniciando entorno...');

  // Referencias Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  // =====================================================================
  // 1. WEBSOCKET - CONEXIÓN CON BACKEND EN RENDER (TUNEL RÍGIDO)
  // =====================================================================
  useEffect(() => {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//amieneurogical.onrender.com`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          setStatusMessage('Conectado al Servidor');
          ws?.send(JSON.stringify({ 
            type: 'HANDSHAKE', 
            role: 'receiver', 
            patientId,
            moduleId 
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA' || data.aiGeneratedAssetUrl) {
              if (data.aiGeneratedAssetUrl) {
                setCustomImageUrl(data.aiGeneratedAssetUrl);
                setStatusMessage('Cargando recurso de IA...');
              }
              if (data.environment || data.ecosystem) setActiveEcosystem(data.environment || data.ecosystem);
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
            } else if (data.environment || data.ecosystem) {
              setCustomImageUrl(null);
              setActiveEcosystem(data.environment || data.ecosystem);
              if (data.isVideo !== undefined) setIsVideo(!!data.isVideo);
              setStatusMessage(`Entorno: ${data.environment || data.ecosystem}`);
            }

            if (data.type === 'STOP_TEST') {
              setActiveEcosystem('NEUTRAL_LIVING_ROOM');
              setCustomImageUrl(null);
              setIsVideo(false);
              setStatusMessage('Evaluación detenida.');
            }
          } catch (error) {
            console.error('Error parseando paquete WS:', error);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          setStatusMessage('Error de Red WebSocket');
        };

        ws.onclose = () => {
          setIsConnected(false);
          setStatusMessage('Reconectando...');
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn('Error iniciando WebSocket:', e);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [patientId, moduleId]);

  // =====================================================================
  // 2. MOTOR GRAPHIC WEBXR PROTEGIDO (RECONSTRUCCIÓN DE ESCENA)
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Slate oscuro permanente de fondo

    // Iluminación para asegurar visibilidad dentro de la gafa
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Rejilla de Suelo 3D (Garantiza que SIEMPRE haya una referencia espacial en VR)
    const gridHelper = new THREE.GridHelper(60, 60, 0x38bdf8, 0x334155);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Esfera 360 Inmersiva
    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

    // Botón VR WebXR Nativo
    let vrBtn: HTMLElement | null = null;
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = 'absolute';
      vrBtn.style.bottom = '40px';
      vrBtn.style.left = '50%';
      vrBtn.style.transform = 'translateX(-50%)';
      vrBtn.style.padding = '14px 28px';
      vrBtn.style.borderRadius = '16px';
      vrBtn.style.background = 'linear-gradient(to right, #2563eb, #4f46e5)';
      vrBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
      vrBtn.style.color = '#ffffff';
      vrBtn.style.fontFamily = 'sans-serif';
      vrBtn.style.fontSize = '12px';
      vrBtn.style.fontWeight = 'bold';
      vrBtn.style.textTransform = 'uppercase';
      vrBtn.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)';
      vrBtn.style.cursor = 'pointer';
      vrBtn.style.
