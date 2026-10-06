import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge'; // <-- IMPORTACIÓN DEL PUENTE
import { 
  Usb, Wifi, Bluetooth, Cpu, Activity, X, Play, CheckCircle2, RotateCcw, 
  Terminal, ArrowRight, Signal, FastForward, Radio, Heart
} from 'lucide-react';

interface FullscreenDiagnosticRunnerProps {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
  onOpenModules?: () => void; // <-- Nuevo prop para saltar al Master Selector
}

type ConnectionType = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED';

export const FullscreenDiagnosticRunner: React.FC<FullscreenDiagnosticRunnerProps> = ({
  patient,
  onClose,
  onUpdatePatientVrData,
  onOpenModules
}) => {
  const patientId = patient?.id || 'PAC-8104';
  const [connectionType, setConnectionType] = useState<ConnectionType>('WIFI');
  const [isCapturing, setIsCapturing] = useState(true);
  const [wifiIp, setWifiIp] = useState('192.168.1.105');
  
  // 🔌 CONEXIÓN REAL AL VISOR (Canal de Calibración)
  const { isConnected: wsConnected, liveData, syncSession } = useVrTelemetryBridge('receiver', patientId, 'CALIBRATION');

  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Inicializando subsistema multicanal (USB / Bluetooth / Wi-Fi)...',
    '[SYSTEM] Telemetría activa en tiempo real.'
  ]);

  // Extraemos datos reales o usamos fallbacks si no hay visor
  const realHrv = liveData?.metrics?.hrvRmssdMs || 45;
  const realGsr = liveData?.metrics?.gsrMicroSiemens || 2.4;
  const realRt = liveData?.metrics?.reactionTimeMs || 240;

  useEffect(() => {
    if (wsConnected) {
      setLogs(prev => [...prev, '[WSS] Enlace WebSocket con el visor Meta Quest ESTABLECIDO.']);
    }
  }, [wsConnected]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConnectWifi = () => {
    setLogs(prev => [...prev, `[WIFI] Conectando a ws://${wifiIp}:8080...`]);
    syncSession(); // Fuerza la reconexión de nuestro puente
  };

  const handleTareZero = () => {
    setLogs(prev => [...prev, '[TARE] Calibrando línea base isométrica y autonómica...']);
    setTimeout(() => {
      setLogs(prev => [...prev, `[TARE] Línea base fijada: HRV=${realHrv}ms | GSR=${realGsr}µS`]);
    }, 800);
  };

  const handleGoToModules = () => {
    if (onOpenModules) onOpenModules();
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-6 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative text-slate-100 flex flex-col max-h-[95vh]">
        
        {/* CABECERA */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${wsConnected ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30' : 'bg-rose-600/20 text-rose-400 border-rose-500/30'}`}>
              <Signal className={`w-5 h-5 ${wsConnected ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                DIAGNÓSTICO Y CALIBRACIÓN MULTICANAL
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono rounded">
                  {connectionType}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Paciente: {patientId} | Telemetría Neuromotora</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleGoToModules} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer">
              <FastForward className="w-3.5 h-3.5" />
              <span>SALTAR E IR A MÓDULOS</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELECTOR PROTOCOLO */}
        <div className="bg-slate-950/80 px-5 py-2 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Protocolo de Entrada:</span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setConnectionType('USB')} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${connectionType === 'USB' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <Usb className="w-3.5 h-3.5" /> <span>USB Directo</span>
            </button>
            <button onClick={() => setConnectionType('BLUETOOTH')} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${connectionType === 'BLUETOOTH' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <Bluetooth className="w-3.5 h-3.5" /> <span>Bluetooth BLE</span>
            </button>
            <button onClick={() => setConnectionType('WIFI')} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${connectionType === 'WIFI' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <Wifi className="w-3.5 h-3.5" /> <span>Wi-Fi (VR Bridge)</span>
            </button>
          </div>
        </div>

        {/* CUERPO DEL PANEL */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto bg-slate-900">
          
          {/* PANEL DE CONTROL DE CONEXIÓN */}
          <div className="md:col-span-4 space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> HARDWARE {connectionType}
              </span>

              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">Estado de Red WSS:</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${wsConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'}`}>
                  {wsConnected ? 'EN LÍNEA' : 'DESCONECTADO'}
                </span>
              </div>

              {connectionType === 'WIFI' && (
                <div className="space-y-2">
                  <input type="text" value={wifiIp} onChange={(e) => setWifiIp(e.target.value)} placeholder="192.168.1.105" className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none" />
                  <button onClick={handleConnectWifi} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5">
                    <Wifi className="w-4 h-4" /> <span>Sincronizar Telemetría VR</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400" /> Calibración Basal
              </span>
              <button onClick={handleTareZero} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer">
                Ejecutar Tare Zero
              </button>
            </div>
          </div>

          {/* MÉTRICAS EN VIVO */}
          <div className="md:col-span-5 space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Activity className="w-4 h-4" /> MEDIDORES EN VIVO
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400"/> Tono Vagal (HRV)</span>
                  <span className="text-base font-bold text-white font-mono">{realHrv} ms</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Conductancia (GSR)</span>
                  <span className="text-base font-bold text-amber-300 font-mono">{realGsr} µS</span>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tiempo de Reacción (Latencia)</span>
                  <span className="text-base font-bold text-cyan-300 font-mono">{realRt} ms</span>
              </div>
            </div>
          </div>

          {/* CONSOLA & BOTÓN DE SALIDA DIRECTA */}
          <div className="md:col-span-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between h-full min-h-[220px]">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> STREAM LOGS
              </span>
              <div className="h-36 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-400 p-2 bg-slate-900 rounded-lg border border-slate-800 flex flex-col-reverse">
                {[...logs].reverse().map((log, i) => (
                  <p key={i} className="pb-1">{log}</p>
                ))}
              </div>
            </div>

            <button onClick={handleGoToModules} className="mt-3 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95">
              <span>VER TODOS LOS MÓDULOS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
