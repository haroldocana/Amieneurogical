// ============================================================================
// AMIE CLINICAL COPILOT - MÓDULO FORENSE & PERFILADO CLUSTER B
// frontend/components/PsychopathyNarcissismModule.tsx
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  ShieldAlert, 
  Wifi, 
  RefreshCw, 
  X, 
  Play, 
  Square, 
  FileText, 
  AlertTriangle,
  Video,
  Send,
  CheckCircle2,
  Eye,
  Sliders
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose?: () => void;
}

interface SubtypeStudy {
  id: string;
  videoKey: string;
  videoPath: string;
  protocolKey: string;
  title: string;
  dsmCode: string;
  affinity: number;
  icdCode: string;
  personalityTrait: string;
  description: string;
  paradoxDetails: string;
  bioResponse: string;
}

const STUDY_SUBTYPES: SubtypeStudy[] = [
  {
    id: 'OVERT',
    videoKey: 'overt_provocation',
    videoPath: '/video/overt_provocation.mp4',
    protocolKey: 'OVERT_EGO_THREAT',
    title: 'Perfilado Narcisista Grandioso / Exhibicionista (Overt)',
    dsmCode: 'Cluster B / F60.81',
    affinity: 94,
    icdCode: '301.81 (NPD)',
    personalityTrait: '6D11 (Dominancia)',
    description: 'Autoestima hipertrofiada, dominancia interpersonal, búsqueda de admiración y baja reactividad al rechazo social en reposo, con picos adrenérgicos reactivos ante la amenaza percibida al ego.',
    paradoxDetails: 'Paradoja 3D de Devaluación Pública y Crítica Directa al Estatus en Entorno Virtual.',
    bioResponse: 'GSR Basal Normal + Pico Adrenérgico Severo ante Afrenta al Ego + Supresión Vagal Inmediata.'
  },
  {
    id: 'COVERT',
    videoKey: 'covert_rejection',
    videoPath: '/video/covert_rejection.mp4',
    protocolKey: 'COVERT_SHAME_REJECTION',
    title: 'Perfilado Narcisista Vulnerable / Encubierto (Covert)',
    dsmCode: 'Cluster B / F60.81',
    affinity: 92,
    icdCode: '301.81 (NPD-V)',
    personalityTrait: '6D10 (Hipersensibilidad)',
    description: 'Fragilidad interna, reactividad ansiosa ante juicios sociales sutiles, hipervigilancia interpersonal y sentimientos de vergüenza compensados con rumiación defensiva.',
    paradoxDetails: 'Paradoja 3D de Murmullo Grupal, Descalificación Silenciosa y Aislamiento Interpersonal.',
    bioResponse: 'Desregulación Autonómica Marcada + Caída de HRV por Tensión Inhibitoria + GSR Elevado Progresivo.'
  },
  {
    id: 'ANTISOCIAL',
    videoKey: 'antisocial_distress',
    videoPath: '/video/antisocial_distress.mp4',
    protocolKey: 'ANTISOCIAL_EMPATHY_FLAT',
    title: 'Rasgos Antisociales con Aplanamiento Empático (Factor 1 PCL-R)',
    dsmCode: 'Cluster B / F60.2',
    affinity: 96,
    icdCode: '301.7 (ASPD)',
    personalityTrait: 'Factor 1 (Insensibilidad)',
    description: 'Insensibilidad emocional, ausencia de resonancia empática somática ante el sufrimiento ajeno, alta audacia y modulación vagal rígida indiferente al contexto de dolor.',
    paradoxDetails: 'Exposición Inmersiva a Sufrimiento Agudo, Llanto Desesperado y Súplica de Ayuda Directa.',
    bioResponse: 'GSR y HRV en Línea Plana Sin Modulación Reactiva ante el Dolor Ajeno (Aplanamiento Afectivo).'
  }
];

export const PsychopathyNarcissismModule: React.FC<Props> = ({ patient, onClose }) => {
  const activePatientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';
  const [selectedSubtype, setSelectedSubtype] = useState<SubtypeStudy>(STUDY_SUBTYPES[0]);
  const [hasConsent, setHasConsent] = useState(false);
  const [isAssayRunning, setIsAssayRunning] = useState(false);
  const [assayTime, setAssayTime] = useState(0);
  const [isVrConnected, setIsVrConnected] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Estados de Telemetría Biológica en Vivo
  const [hrvBpm, setHrvBpm] = useState<number | null>(null);
  const [gsrValue, setGsrValue] = useState<number | null>(null);
  const [totalHits, setTotalHits] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const buildFullVideoUrl = (path: string): string => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${cleanPath}`;
  };

  // Función esencial: despacha el video 360 al visor Pico 3 mediante WebSocket
  const broadcastVideoToVisor = (subtype: SubtypeStudy) => {
    const fullVideoUrl = buildFullVideoUrl(subtype.videoPath);

    // 1. Comando principal de carga de video para VrPatientExperience
    const loadMediaPayload = {
      type: 'LOAD_CUSTOM_MEDIA',
      mediaUrl: fullVideoUrl,
      mediaType: 'video',
      scenarioName: subtype.title,
      patientId: activePatientId,
      timestamp: Date.now()
    };

    // 2. Comando complementario de contexto clínico
    const syncContextPayload = {
      type: 'SYNC_CLINICAL_CONTEXT',
      moduleId: subtype.id,
      category: 'DIAGNOSTIC',
      disorderId: subtype.id,
      disorderName: subtype.title,
      ecosystem: subtype.videoKey,
      patientId: activePatientId,
      timestamp: Date.now()
    };

    // Despacho vía VrControlService
    try {
      VrControlService.sendCommand(loadMediaPayload);
      VrControlService.sendCommand(syncContextPayload);
    } catch (e) {
      console.warn('[AMIE Cluster B] VrControlService send error:', e);
    }

    // Despacho directo vía WebSocket local si está abierto
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(loadMediaPayload));
        wsRef.current.send(JSON.stringify(syncContextPayload));
        wsRef.current.send(JSON.stringify({
          type: 'CHANGE_ENVIRONMENT',
          environment: subtype.videoKey,
          moduleId: subtype.videoKey,
          protocol: subtype.protocolKey,
          patientId: activePatientId,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }

    setStatusMsg(`🟢 Video 360 despachado al visor: ${subtype.title}`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Conexión WebSocket Bidireccional
  useEffect(() => {
    const rawWsUrl = (import.meta as any).env?.VITE_WS_URL || (import.meta as any).env?.VITE_API_URL;
    let wsUrl: string;

    if (rawWsUrl) {
      wsUrl = rawWsUrl.replace(/^http/, 'ws');
    } else {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const protocol = isHttps ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' && window.location.host 
        ? window.location.host 
        : 'amieneurogical.onrender.com';
      wsUrl = `${protocol}//${host}/ws/vr`;
    }

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsVrConnected(true);
          ws.send(JSON.stringify({ 
            type: 'HANDSHAKE', 
            role: 'doctor', 
            patientId: activePatientId,
            timestamp: Date.now()
          }));

          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ 
                type: 'HEARTBEAT_PING', 
                role: 'doctor', 
                patientId: activePatientId,
                timestamp: Date.now() 
              }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'CLUSTER_B_TELEMETRY' || data.type === 'VR_TELEMETRY_FRAME') {
              setIsVrConnected(true);
              
              const extractedHrv = data.hrvBpm ?? data.hrvRmssdMs ?? data.hrv;
              if (extractedHrv !== undefined && extractedHrv !== null) {
                setHrvBpm(Math.round(Number(extractedHrv)));
              }

              const extractedGsr = data.gsrValue ?? data.gsrMicroSiemens ?? data.gsr;
              if (extractedGsr !== undefined && extractedGsr !== null) {
                setGsrValue(Number(Number(extractedGsr).toFixed(2)));
              }

              if (data.hits !== undefined) {
                setTotalHits(Number(data.hits));
              }
            }

            if (data.type === 'CLINICAL_TEST_INTERACTION') {
              if (data.hits !== undefined) setTotalHits(Number(data.hits));
            }

            if (data.type === 'VISOR_ACK_READY' || data.type === 'PONG') {
              setIsVrConnected(true);
            }
          } catch (e) {
            console.warn('[AMIE Cluster B] Error telemetría:', e);
          }
        };

        ws.onclose = () => {
          setIsVrConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setIsVrConnected(false);
        };
      } catch (err) {
        setIsVrConnected(false);
      }
    };

    connectWebSocket();

    const unsubVrService = VrControlService.subscribeStatus((status) => {
      if (status === 'CONNECTED') setIsVrConnected(true);
    });

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (unsubVrService) unsubVrService();
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [activePatientId]);

  // Cronómetro del Ensayo Clínico
  useEffect(() => {
    if (isAssayRunning) {
      timerRef.current = setInterval(() => {
        setAssayTime((prev) => {
          if (prev >= 300) {
            setIsAssayRunning(false);
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAssayRunning]);

  // Al seleccionar subtipo, proyectar inmediatamente al visor y sincronizar preview
  const handleSelectSubtype = (subtype: SubtypeStudy) => {
    setSelectedSubtype(subtype);
    setAssayTime(0);
    setIsAssayRunning(false);
    broadcastVideoToVisor(subtype);

    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = subtype.videoPath;
      videoPreviewRef.current.currentTime = 0;
      videoPreviewRef.current.play().catch(() => {});
    }
  };

  // Iniciar / Detener Ensayo Bio-VR
  const toggleAssay = () => {
    if (!hasConsent && !isAssayRunning) return;

    const nextState = !isAssayRunning;
    setIsAssayRunning(nextState);

    if (nextState) {
      // Iniciar: asegurar que el video esté proyectado y mandar fase activa
      broadcastVideoToVisor(selectedSubtype);

      const startPayload = {
        type: 'START_PIPELINE_PHASE',
        phase: 'PHASE_2_ACTIVE',
        durationSec: 300,
        speechScript: selectedSubtype.paradoxDetails,
        category: 'DIAGNOSTIC',
        patientId: activePatientId,
        timestamp: Date.now()
      };

      VrControlService.sendCommand(startPayload);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(startPayload));
        wsRef.current.send(JSON.stringify({
          type: 'START_ASSAY',
          environment: selectedSubtype.videoKey,
          moduleId: selectedSubtype.videoKey,
          protocol: selectedSubtype.protocolKey,
          patientId: activePatientId,
          timestamp: Date.now()
        }));
      }

      if (videoPreviewRef.current) {
        videoPreviewRef.current.play().catch(() => {});
      }
    } else {
      // Detener
      const stopPayload = {
        type: 'START_PIPELINE_PHASE',
        phase: 'PHASE_3_RECOVERY',
        durationSec: 30,
        speechScript: 'Ensayo concluido. Normalizando registro neurovegetativo.',
        category: 'DIAGNOSTIC',
        patientId: activePatientId,
        timestamp: Date.now()
      };

      VrControlService.sendCommand(stopPayload);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(stopPayload));
        wsRef.current.send(JSON.stringify({
          type: 'STOP_ASSAY',
          patientId: activePatientId,
          timestamp: Date.now()
        }));
      }

      if (videoPreviewRef.current) {
        videoPreviewRef.current.pause();
      }

      persistCurrentAssay();
    }
  };

  // Persistencia de Telemetría Forense en MongoDB Atlas
  const persistCurrentAssay = async () => {
    const backendBaseUrl = (import.meta as any).env?.VITE_API_URL || 'https://amieneurogical.onrender.com';
    const payload = {
      patientId: activePatientId,
      moduleId: selectedSubtype.videoKey,
      protocol: selectedSubtype.protocolKey,
      category: 'FORENSIC_CLUSTER_B',
      durationSeconds: assayTime,
      finalHrv: hrvBpm,
      finalGsr: gsrValue,
      totalHits: totalHits,
      tripm: { boldness: 88, meanness: 62, disinhibition: 28 },
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(`${backendBaseUrl}/api/telemetry/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('[AMIE Cluster B] Almacenamiento local:', e);
    }
  };

  // Exportar Dictamen Oficial Seguro
  const handleExportReport = () => {
    const reportData = {
      titulo: 'DICTAMEN PERICIAL FORENSE - CLUSTER B (AMIE ENGINE)',
      pacienteId: activePatientId,
      estudioSeleccionado: selectedSubtype.title,
      clasificacionCie: selectedSubtype.icdCode,
      rasgoPersonalidad: selectedSubtype.personalityTrait,
      duracionPruebaSegundos: assayTime,
      biometriaRegistrada: {
        tonoVagalHrv: hrvBpm !== null ? `${hrvBpm} ms` : 'Sin registro',
        estresGsr: gsrValue !== null ? `${gsrValue} µS` : 'Sin registro',
        totalInteraccionesGatillo: totalHits
      },
      dimensionesTripm: {
        audacia: '88% (Elevada)',
        durezaAfectiva: '62% (Moderada)',
        desinhibicion: '28% (Baja)'
      },
      conclusionDiagnostica: selectedSubtype.bioResponse,
      fechaDictamen: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dictamen_Forense_${activePatientId}_${selectedSubtype.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 font-sans">
      {/* Barra Superior */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/40 text-pink-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide uppercase">
              MÓDULO FORENSE • Perfilado Cluster B (Psicopatía/Narcisismo)
            </h1>
            <p className="text-xs text-slate-400">
              Paciente ID: <span className="font-mono text-cyan-400 font-bold">{activePatientId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            isVrConnected 
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-500/60 text-rose-300'
          }`}>
            <Wifi className="w-4 h-4" />
            <span>{isVrConnected ? 'Pico 3 Conectado' : 'Visor Desconectado'}</span>
          </div>

          <button 
            type="button"
            onClick={() => broadcastVideoToVisor(selectedSubtype)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-500/60 text-xs font-bold text-white transition cursor-pointer active:scale-95 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Proyectar Video al Visor</span>
          </button>

          <button 
            type="button"
            onClick={() => handleSelectSubtype(selectedSubtype)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar VR</span>
          </button>

          {onClose && (
            <button 
              type="button"
              onClick={onClose} 
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Cerrar Módulo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 mb-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Alerta de Protocolo y Consentimiento */}
      <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 mb-6 text-xs text-amber-200/90 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wide">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Protocolo de Investigación &amp; Peritaje Forense — Cluster B</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] border border-amber-500/40">
            CDSS / Consentimiento Requerido
          </span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Las pruebas inmersivas de provocación estresante deben realizarse únicamente bajo Consentimiento Informado explícito, en contexto de peritaje o consulta forense especializada.
        </p>
        <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer pt-1">
          <input 
            type="checkbox" 
            checked={hasConsent} 
            onChange={(e) => setHasConsent(e.target.checked)} 
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer" 
          />
          <span>Confirmo que el paciente cuenta con Consentimiento Informado para protocolos de provocación y peritaje.</span>
        </label>
      </div>

      {/* Panel Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Selector de Subtipo Izquierdo */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            SELECCIONAR SUBTIPO DE ESTUDIO:
          </h2>
          {STUDY_SUBTYPES.map((sub) => {
            const isSelected = selectedSubtype.id === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSelectSubtype(sub)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-950/50' 
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xs font-bold text-slate-100">{sub.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-900/50 border border-purple-500/40 text-purple-300">
                    Afinidad: {sub.affinity}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mb-1">{sub.dsmCode}</p>
                <p className="text-[10px] text-rose-300 font-mono truncate">{sub.videoPath}</p>
              </button>
            );
          })}
        </div>

        {/* Detalles de la Prueba Activa y Preview de Video */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">{selectedSubtype.title}</h3>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedSubtype.icdCode}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-500/40 text-purple-300">
                  {selectedSubtype.personalityTrait}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedSubtype.description}
            </p>

            {/* Reproductor de Vista Previa Local del Video 360 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 relative flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  src={selectedSubtype.videoPath}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    ⚡ Estímulo 360° Asociado:
                  </span>
                  <p className="font-mono text-cyan-300 text-[11px] mb-1">{selectedSubtype.videoPath}</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{selectedSubtype.paradoxDetails}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firma Esperada:</span>
                  <p className="text-slate-400 font-mono text-[10.5px] leading-relaxed">{selectedSubtype.bioResponse}</p>
                </div>

                <button
                  type="button"
                  onClick={() => broadcastVideoToVisor(selectedSubtype)}
                  className="w-full py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>FORZAR CARGA DE VIDEO EN PICO 3</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarjetas de Telemetría Biológica en Tiempo Real */}
          <div className="pt-6 border-t border-slate-800/80 mt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  TONO VAGAL (HRV)
                </span>
                <span className="text-2xl font-black font-mono text-cyan-400">
                  {hrvBpm !== null ? `${hrvBpm} ms` : '-- ms'}
                </span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  ESTRÉS FÁSICO (GSR)
                </span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  {gsrValue !== null ? `${gsrValue} µS` : '-- µS'}
                </span>
              </div>
            </div>

            {/* Controles del Ensayo */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-mono">
                Tiempo Ensayo VR: <strong className="text-slate-100">{assayTime}s</strong> / 300s
                {totalHits > 0 && <span className="ml-3 text-cyan-400">Impactos Gatillo: {totalHits}</span>}
              </div>

              <button
                type="button"
                onClick={toggleAssay}
                disabled={!hasConsent && !isAssayRunning}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  isAssayRunning 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 animate-pulse' 
                    : hasConsent 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isAssayRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Detener Ensayo Bio-VR</span>
                  </>
                ) : hasConsent ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Ensayo Bio-VR</span>
                  </>
                ) : (
                  <span>Requiere Consentimiento</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensiones TRIPM */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>⚖️ DIMENSIONES DE LA MEDIDA PSICOPÁTICA TRIÁRQUICA (TRIPM)</span>
          </h3>
          <button 
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar Dictamen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="font-bold text-slate-300">Audacia (Boldness)</span>
              <span className="font-mono text-purple-400 font-bold">88% (Audacia Elevada)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '88%' }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Tolerancia al estrés e inmunidad al miedo.</span>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="font-bold text-slate-300">Dureza Afectiva (Meanness)</span>
              <span className="font-mono text-rose-400 font-bold">62% (Dureza Moderada)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '62%' }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Reducción de empatía y frialdad interpersonal.</span>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="font-bold text-slate-300">Desinhibición (Disinhibition)</span>
              <span className="font-mono text-amber-400 font-bold">28% (Baja Desinhibición)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '28%' }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Dificultad de control de impulsos y labilidad.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychopathyNarcissismModule;
