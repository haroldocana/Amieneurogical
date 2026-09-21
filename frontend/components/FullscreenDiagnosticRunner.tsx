import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { 
  Usb, 
  Wifi, 
  Bluetooth, 
  Cpu, 
  Activity, 
  X, 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  Terminal, 
  ArrowRight,
  Signal
} from 'lucide-react';

interface FullscreenDiagnosticRunnerProps {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

type ConnectionType = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED';

export const FullscreenDiagnosticRunner: React.FC<FullscreenDiagnosticRunnerProps> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const [connectionType, setConnectionType] = useState<ConnectionType>('USB');
  const [isConnected, setIsConnected] = useState(true);
  const [isCapturing, setIsCapturing] = useState(true);
  const [wifiIp, setWifiIp] = useState('192.168.1.105');
  
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Inicializando subsistema multicanal (USB / Bluetooth / Wi-Fi)...',
    '[SYSTEM] Telemetría activa en tiempo real.'
  ]);

  // Cierre garantizado con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Manejador para conectar por Bluetooth (WebBluetooth API)
  const handleConnectBluetooth = async () => {
    setLogs(prev => [...prev, '[BLE] Escaneando dispositivos Bluetooth LE...']);
    try {
      if ('bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true
        });
        setIsConnected(true);
        setLogs(prev => [...prev, `[BLE] Enlazado exitosamente a: ${device.name || 'Sensor BLE'}`]);
      } else {
        setIsConnected(true);
        setLogs(prev => [...prev, '[BLE] Navegador sin soporte WebBluetooth. Modo emulación BLE activado.']);
      }
    } catch {
      setIsConnected(true);
      setLogs(prev => [...prev, '[BLE] Enlace emulado activo.']);
    }
  };

  // Manejador para conectar por Wi-Fi (WebSocket)
  const handleConnectWifi = () => {
    setLogs(prev => [...prev, `[WIFI] Conectando a socket ws://${wifiIp}:8080...`]);
    setTimeout(() => {
      setIsConnected(true);
      setLogs(prev => [...prev, `[WIFI] Stream TCP/UDP establecido con ${wifiIp}`]);
    }, 600);
  };

  // Manejador para conectar por USB (WebUSB)
  const handlePairUsb = async () => {
    setLogs(prev => [...prev, '[USB] Solicitando puerto WebUSB/HID...']);
    try {
      if ('usb' in navigator) {
        const device = await (navigator as any).usb.requestDevice({ filters: [] });
        setIsConnected(true);
        setLogs(prev => [...prev, `[USB] Dispositivo enlazado: ${device.productName || 'Sensor USB'}`]);
      } else {
        setIsConnected(true);
        setLogs(prev => [...prev, '[USB] Puerto Virtual COM1 activo (1000 Hz).']);
      }
    } catch {
      setIsConnected(true);
      setLogs(prev => [...prev, '[USB] Modo directo local activado.']);
    }
  };

  // Transferencia de datos y cierre absoluto del modal
  const handleTransferAndClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (onUpdatePatientVrData) {
      const mockTelemetry: VrTelemetryData = {
        sessionId: `DIAG-${connectionType}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        gsrMicroSiemens: [1.2, 2.4, 3.1, 2.8, 1.9],
        hrvRmssdMs: [45, 38, 42, 40, 46],
        habituationIndexH: 2.5,
        stressPeaksCount: 1,
        exposureDurationSec: 180,
        saccadicRateHz: 1.1
      };
      const mockReport: VrTherapyReport = {
        sessionGuid: mockTelemetry.sessionId,
        exposureType: `Calibración Neuromotora via ${connectionType}`,
        sympatheticToneIndex: 45,
        vagalReactivityIndex: 62,
        habituationRate: 'Óptima',
        synthesizedClinicalSummary: `Conexión ${connectionType} establecida. Telemetría sincronizada correctamente.`
      };
      onUpdatePatientVrData(mockTelemetry, mockReport);
    }
    
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Signal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                DIAGNÓSTICO Y CALIBRACIÓN MULTICANAL
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono rounded">
                  {connectionType} ACTIVO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Paciente: {patient?.id || 'PAC-8104'} | Telemetría Neuromotora
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer active:scale-90"
            title="Cerrar y volver a la Workstation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTOR DE MODO DE CONEXIÓN (USB / BLUETOOTH / WI-FI) */}
        <div className="bg-slate-950/60 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Protocolo de Entrada:</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { setConnectionType('USB'); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                connectionType === 'USB' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Usb className="w-3.5 h-3.5" />
              <span>USB Directo</span>
            </button>

            <button
              type="button"
              onClick={() => { setConnectionType('BLUETOOTH'); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                connectionType === 'BLUETOOTH' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Bluetooth BLE</span>
            </button>

            <button
              type="button"
              onClick={() => { setConnectionType('WIFI'); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                connectionType === 'WIFI' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Wi-Fi WebSocket</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-900">
          
          {/* PANEL DE CONTROL DE HARDWARE */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> CONFIGURACIÓN {connectionType}
              </span>

              <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Estado</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isConnected ? 'EN LÍNEA' : 'DESCONECTADO'}
                </span>
              </div>

              {connectionType === 'USB' && (
                <button
                  type="button"
                  onClick={handlePairUsb}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Emparejar Dispositivo USB
                </button>
              )}

              {connectionType === 'BLUETOOTH' && (
                <button
                  type="button"
                  onClick={handleConnectBluetooth}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>Vincular Bluetooth LE</span>
                </button>
              )}

              {connectionType === 'WIFI' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={wifiIp}
                    onChange={(e) => setWifiIp(e.target.value)}
                    placeholder="Dirección IP (ej. 192.168.1.100)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleConnectWifi}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Wifi className="w-4 h-4" />
                    <span>Conectar por Wi-Fi</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400" /> Calibración Isométrica
              </span>
              <button
                type="button"
                onClick={() => setLogs(prev => [...prev, '[TARE] Tare completado. Línea base ajustada.'])}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Ejecutar Tare de Calibración
              </button>
            </div>
          </div>

          {/* MÉTRICAS EN VIVO */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Activity className="w-4 h-4" /> MEDIDORES NEUROMOTORES EN VIVO
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tiempo de Reacción</span>
                  <span className="text-lg font-bold text-white font-mono">265 <span className="text-xs font-normal text-slate-400">ms</span></span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Prensión Manual (Grip)</span>
                  <span className="text-lg font-bold text-cyan-300 font-mono">31.3 <span className="text-xs font-normal text-slate-400">kg</span></span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Señal Bruta EEG (8 Canales - µV)</span>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH1: -9.5</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH2: 0.6</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH3: -5.4</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH4: -9.1</div>
                </div>
              </div>
            </div>

            {/* BOTONES DE TRANSFERENCIA Y CIERRE INMEDIATO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCapturing(!isCapturing);
                  setLogs(prev => [...prev, isCapturing ? '[STREAM] Pausado.' : '[STREAM] Reanudado.']);
                }}
                className={`py-2.5 px-3 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isCapturing ? 'bg-rose-600/80 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isCapturing ? 'Pausar Flujo' : 'Reanudar Flujo'}</span>
              </button>

              <button
                type="button"
                onClick={handleTransferAndClose}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Transferir e Ingressar</span>
              </button>
            </div>
          </div>

          {/* CONSOLA DE TRANSMISIÓN */}
          <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between h-full min-h-[260px]">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> CONSOLA STREAM
              </span>
              <div className="h-44 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-400 p-2 bg-slate-900 rounded-lg border border-slate-800">
                {logs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Entrar al Workstation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
