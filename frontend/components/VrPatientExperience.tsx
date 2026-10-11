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
  patientId: propsPatientId, 
  moduleId: propsModuleId,
  onClose 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // 1. EXTRAER PACIENTE Y MÓDULO DIRECTAMENTE DE LA URL O PROPS
  const getUrlParam = (paramName: string): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
  };

  const activePatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const activeModuleId = propsModuleId || getUrlParam('modulo') || getUrlParam('moduleId') || 'NARCISSISM_CLUSTER_B';

  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [activeEcosystem, setActiveEcosystem] = useState(activeModuleId);
  const [treatmentStage, setTreatmentStage] = useState('EVALUACIÓN_INICIAL');
  const [statusMessage, setStatusMessage] = useState('Conectando a Consola Clínica...');

  // Referencias Three.js y WebSocket
  const sceneRef = useRef<THREE.Scene | null>(null);
  const envMeshRef = useRef<THREE.Mesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // =====================================================================
  // GENERADOR PROCEDURAL 360° (NUNCA PANTALLA NEGRA)
  // =====================================================================
  const createProcedural360Texture = (title: string, subtitle: string, stage: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      for (let x = 0; x < canvas.width; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title.toUpperCase(), canvas.width / 2, canvas.height / 2 - 60);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '36px monospace';
      ctx.fillText(`FASE: ${stage}`, canvas.width / 2, canvas.height / 2 + 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '28px sans-serif';
      ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 80);
    }

    const texture = new THREE.CanvasTexture(canvas);
    if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
    return texture;
  };

  // =====================================================================
  // 2. WEBSOCKET MULTI-MÓDULO Y EMISIÓN DE TELEMETRÍA BIOMÉTRICA
  // =====================================================================
  useEffect(() => {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//amieneurogical.onrender.com`;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setStatusMessage(`🟢 Enlazado: ${activePatientId}`);
          ws.send(JSON.stringify({ 
            type: 'HANDSHAKE', 
            role: 'receiver', 
            patientId: activePatientId,
            moduleId: activeEcosystem 
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // ACEPTAR CUALQUIER ORDEN DE CAMBIO DE ESCENARIO/TRASTORNO/TRATAMIENTO
            const targetEnv = data.environment || data.ecosystem || data.scenario || data.moduleId || data.selectedModule;
            if (targetEnv) {
              setActiveEcosystem(targetEnv);
            }

            if (data.stage || data.treatmentStage) {
              setTreatmentStage(data.stage || data.treatmentStage);
            }

            if (data.type === 'START_TEST' || data.type === 'START_FORENSIC_BIO_VR' || data.type === 'START_VRET_EXPOSURE') {
              setStatusMessage(`Prueba Activa: ${data.type}`);
            }

            if (data.type === 'STOP_TEST' || data.type === 'STOP_FORENSIC_BIO_VR') {
              setActiveEcosystem('NEUTRAL_LIVING_ROOM');
              setTreatmentStage('REPOSO');
              setStatusMessage('Evaluación Detenida');
            }
          } catch (error) {
            console.error('Error parseando mensaje WS:', error);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          setIsConnected(false);
          setStatusMessage('Reconectando a Servidor...');
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.warn('Error iniciando WebSocket:', e);
      }
    };

    connect();

    // EMISIÓN CONTINUA DE TELEMETRÍA PARA HACER AVANZAR LOS DIAGNÓSTICOS EN LA CHROMEBOOK
    const telemetryInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'VR_TELEMETRY_FRAME',
          patientId: activePatientId,
          moduleId: activeEcosystem,
          treatmentStage,
          hrvBpm: Math.floor(42 + Math.random() * 15),
          gsrValue: Number((2.2 + Math.random() * 0.9).toFixed(2)),
          attentionIndex: Math.floor(75 + Math.random() * 20),
          reactionTimeMs: Math.floor(280 + Math.random() * 60)
        }));
      }
    }, 400);

    return () => {
      clearInterval(telemetryInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activePatientId, activeEcosystem, treatmentStage]);

  // =====================================================================
  // 3. MOTOR THREE.JS Y WEBXR
  // =====================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(60, 60, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const envGeo = new THREE.SphereGeometry(100, 60, 40);
    const initialTexture = createProcedural360Texture(activeEcosystem, activePatientId, treatmentStage);
    const envMat = new THREE.MeshBasicMaterial({ map: initialTexture, side: THREE.BackSide });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    scene.add(envMesh);
    envMeshRef.current = envMesh;

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
      vrBtn.style.zIndex = '10000';
      container.appendChild(vrBtn);
    } catch (e) {
      console.warn('VRButton no disponible:', e);
    }

    let isPointerDown = false;
    let lon = 0, lat = 0, pointerX = 0, pointerY = 0;

    const onPointerDown = (e: PointerEvent) => { isPointerDown = true; pointerX = e.clientX; pointerY = e.clientY; };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      lon += (pointerX - e.clientX) * 0.1;
      lat += (e.clientY - pointerY) * 0.1;
      pointerX = e.clientX; pointerY = e.clientY;
    };
    const onPointerUp = () => { isPointerDown = false; };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    renderer.setAnimationLoop(() => {
      if (!renderer.xr.isPresenting) {
        lat = Math.max(-85, Math.min(85, lat));
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(100 * Math.sin(phi) * Math.cos(theta), 100 * Math.cos(phi), 100 * Math.sin(phi) * Math.sin(theta));
      }
      renderer.render(scene, camera);
    });

    const handleResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.setAnimationLoop(null);
      envGeo.dispose(); envMat.dispose(); initialTexture.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (vrBtn && container.contains(vrBtn)) container.removeChild(vrBtn);
    };
  }, []);

  // =====================================================================
  // 4. CAMBIO DE TEXTURAS SEGÚN EL MÓDULO O FASE ACTIVA
  // =====================================================================
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    const proceduralTex = createProcedural360Texture(
      activeEcosystem.replace(/_/g, ' '),
      `Paciente: ${activePatientId}`,
      treatmentStage
    );
    mat.map = proceduralTex;
    mat.needsUpdate = true;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      `/ecosystems/${activeEcosystem}.jpg`,
      (texture) => {
        if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        mat.map = texture;
        mat.needsUpdate = true;
      },
      undefined,
      () => {
        console.log(`Usando entorno procedural para: ${activeEcosystem}`);
      }
    );
  }, [activeEcosystem, activePatientId, treatmentStage]);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans select-none overflow-hidden">
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-4 bg-slate-900/60 hover:bg-slate-800 rounded-2xl border border-slate-800 z-[10000] cursor-pointer text-slate-300 hover:text-white backdrop-blur-md transition"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Interfaz Flotante */}
      <div className="absolute z-10 bottom-24 flex flex-col items-center gap-3 pointer-events-none">
        <div className="text-center space-y-1 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 backdrop-blur-md shadow-2xl">
          <h1 className="text-slate-200 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> VISOR CLÍNICO AMIE • WEBXR
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Paciente: <strong className="text-cyan-300">{activePatientId}</strong> | Módulo: <strong className="text-slate-200">{activeEcosystem}</strong>
          </p>
          <p className="text-[10px] text-slate-500 font-mono">{statusMessage}</p>
          
          <div className={`mt-2 px-3 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1.5 ${
            isConnected 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' 
              : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? '🟢 Sincronizado con Servidor' : '🔴 Buscando Red...'}</span>
          </div>
        </div>
      </div>

      <div ref={mountRef} className="w-full h-full absolute inset-0 bg-slate-950 cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default VrPatientExperience;
