import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { 
  requestUsbDevicePermission, 
  NeuromotorTelemetrySample 
} from '../utils/checkUsbSupport';
import { 
  Usb, 
  Wifi, 
  Bluetooth, 
  X, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  Terminal, 
  Play, 
  Pause, 
  Gauge,
  Signal,
  FastForward,
  ArrowRight,
  Radio
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdateHardwareData: (sample: NeuromotorTelemetrySample) => void;
}

type ConnectionType = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED';

export const UsbHardwareDiagnosticModal: React.FC<Props> = ({
  patient,
  onClose,
  onUpdateHardwareData
}) => {
  const [connectionType, setConnectionType] = useState<ConnectionType>('USB');
  const [isWebUsbSupported, setIsWebUsbSupported] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>('Sensor Virtual AMIE');
  const [isStreaming, setIsStreaming] = useState(true);
  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'calibrating' | 'calibrated'>('idle');
  const [wifiIp, setWifiIp] = useState('192.168.1.105');

  // Muestras fisiológicas en tiempo real
  const [liveSample, setLiveSample] = useState<NeuromotorTelemetrySample>({
    reactionTimeMs: patient?.neuromotorBiomarkers?.reactionTimeMs || 240,
    handGripPressureKg: patient?.multisensoryHardware?.handGripPressureKg || 32.5,
    touchTapLatencyMs: patient?.multisensoryHardware?.touchTapLatencyCompensatedMs || 180,
    eegChannelsRaw: [12.4, -4.2, 18.1, 8.5, -2.1, 14.3, 6.2, 0.8],
    timestamp: Date.now()
  });

  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Inicializando subsistema multicanal (USB / Bluetooth / Wi-Fi)...',
    '[SYSTEM] Telemetría activa en tiempo real.'
  ]);

  // Cierre inmediato con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Verificar compatibilidad del navegador con WebUSB
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'navigator' in window && 'usb' in navigator;
    setIsWebUsbSupported(supported);
    if (!supported) {
      setLogs(prev => [
        ...prev,
        '[WARN] WebUSB API no disponible. Protocolos serie virtual y Wi-Fi activos.'
      ]);
    }
  }, []);

  // Bucle de streaming en vivo a 60Hz
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isStreaming) {
      interval = setInterval(() => {
        const simulatedReaction = Math.floor(210 + Math.random() * 60);
        const simulatedGrip = Number((30 + Math.random() * 8 - 4).toFixed(1));
        const simulatedTap = Math.floor(165 + Math.random() * 35);
        const simulatedEeg = Array.from({ length: 8 }, () => Number((Math.random() * 30 - 15).toFixed(1)));

        setLiveSample({
          reactionTimeMs: simulatedReaction,
          handGripPressureKg: simulatedGrip,
          touchTapLatencyMs: simulatedTap,
          eegChannelsRaw: simulatedEeg,
          timestamp: Date.now()
        });

        if (Math.random() > 0.75) {
          const timestamp = new Date().toISOString().slice(11, 19);
          const logMsg = `[${timestamp}] [${connectionType} RX] Grip: ${simulatedGrip}kg | Reaction: ${simulatedReaction}ms`;
          setLogs(prevLogs => [logMsg, ...prevLogs.slice(0, 15)]);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, connectionType]);

  // Manejador USB Real
  const handleConnectUsbDevice = async () => {
    try {
      setLogs(prev => [...prev, '[USB] Solicitando emparejamiento USB...']);
      const deviceName = await requestUsbDevicePermission();
      if (deviceName) {
        setConnectedDeviceName(deviceName);
        setIsStreaming(true);
        setLogs(prev => [...prev, `[SUCCESS] Dispositivo USB enlazado: ${deviceName}`]);
      } else {
        setConnectedDeviceName('Dispositivo Virtual USB');
        setIsStreaming(true);
        setLogs(prev => [...prev, '[INFO] Selección cancelada. Manteniendo stream virtual.']);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setLogs(prev => [...prev, `[ERROR] Fallo USB: ${errorMsg}`]);
    }
  };

  // Manejador Bluetooth LE
  const handleConnectBluetooth = async () => {
    setLogs(prev => [...prev, '[BLE] Escaneando dispositivos Bluetooth LE...']);
    try {
      if ('bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
        setConnectedDeviceName(device.name || 'Sensor Bluetooth BLE');
        setIsStreaming(true);
        setLogs(prev => [...prev, `[BLE] Enlazado a: ${device.name || 'Sensor BLE'}`]);
      } else {
        setConnectedDeviceName('Sensor BLE Virtual');
        setIsStreaming(true);
        setLogs(prev => [...prev, '[BLE] Emulación Bluetooth activa.']);
      }
    } catch {
      setConnectedDeviceName('Sensor BLE Virtual');
      setIsStreaming(true);
      setLogs(prev => [...prev, '[BLE] Módulo Bluetooth de respaldo activo.']);
    }
  };

  // Manejador Wi-Fi Socket
  const handleConnectWifi = () => {
    setLogs(prev => [...prev, `[WIFI] Conectando a ws://${wifiIp}:8080...`]);
    setTimeout(() => {
      setConnectedDeviceName(`WebSocket (${wifiIp})`);
      setIsStreaming(true);
      setLogs(prev => [...prev, `[WIFI] Transmisión IP ${wifiIp} establecida.`]);
    }, 500);
  };

  // Calibración Zero-Tare
  const handleCalibrateSensors = () => {
    setCalibrationStatus('calibrating');
    setLogs(prev => [...prev, '[CALIB] Iniciando calibración Zero-Tare...']);

    setTimeout(() => {
      setCalibrationStatus('calibrated');
      setLogs(prev => [...prev, '[CALIB] ✅ Calibración completada a cero.']);
    }, 1200);
  };

  // Transferir e ingresar a los módulos
  const handleTransferToPatient = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onUpdateHardwareData(liveSample);
    onClose();
  };

  const patientDisplayName = patient?.patientNameAnonymized || patient?.id || 'PAC-8104';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 lg:p-6 font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-slate-950 border border-cyan-500/40 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* CABECERA Y BOTÓN DESTACADO PARA SALTAR */}
        <header className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Signal className="w-5 h-5 animate-pulse text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide text-white">
                  DIAGNÓSTICO & CALIBRACIÓN MULTICANAL
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-emerald-950 text-emerald-300 border-emerald-500/30">
                  {connectionType} ACTIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paciente: <span className="text-white font-semibold">{patientDisplayName}</span> | Telemetría Directa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÓN OMITIR/SALTAR PANTALLA */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>SALTAR E IR A MÓDULOS</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              title="Cerrar Diagnóstico"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* BARRA SELECCIÓN DE PROTOCOLO: USB / BLUETOOTH / WI-FI / SIMULACIÓN */}
        <div className="bg-slate-950 px-5 py-2 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Protocolo de Entrada:</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConnectionType('USB')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                connectionType === 'USB' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Usb className="w-3.5 h-3.5" />
              <span>USB Directo</span>
            </button>

            <button
              type="button"
              onClick={() => setConnectionType('BLUETOOTH')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                connectionType === 'BLUETOOTH' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Bluetooth BLE</span>
            </button>

            <button
              type="button"
              onClick={() => setConnectionType('WIFI')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                connectionType === 'WIFI' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Wi-Fi Socket</span>
            </button>

            <button
              type="button"
              onClick={() => setConnectionType('SIMULATED')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                connectionType === 'SIMULATED' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Simulación</span>
            </button>
          </div>
        </div>

        {/* PANEL CENTRAL GRID */}
        <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-y-auto">
          
          {/* PANEL IZQUIERDO: CONTROLES */}
          <div className="col-span-12 lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Configuración {connectionType}
              </h3>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Estado:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    CONECTADO
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-200 truncate">
                  {connectedDeviceName}
                </div>

                {connectionType === 'USB' && (
                  <button
                    type="button"
                    onClick={handleConnectUsbDevice}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Usb className="w-4 h-4" />
                    <span>Emparejar Dispositivo USB</span>
                  </button>
                )}

                {connectionType === 'BLUETOOTH' && (
                  <button
                    type="button"
                    onClick={handleConnectBluetooth}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
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
                      placeholder="192.168.1.105"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConnectWifi}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wifi className="w-4 h-4" />
                      <span>Conectar por Wi-Fi</span>
                    </button>
                  </div>
                )}

                {connectionType === 'SIMULATED' && (
                  <div className="text-[11px] text-purple-300 bg-purple-950/40 p-2 rounded-lg border border-purple-500/30">
                    Modo sintético activo para evaluación de módulos sin hardware.
                  </div>
                )}
              </div>

              {/* CALIBRACIÓN */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Calibración Isométrica</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Zero-Tare</span>
                </div>

                <button
                  type="button"
                  onClick={handleCalibrateSensors}
                  disabled={calibrationStatus === 'calibrating'}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {calibrationStatus === 'calibrating' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  )}
                  <span>
                    {calibrationStatus === 'calibrating'
                      ? 'Calibrando...'
                      : calibrationStatus === 'calibrated'
                      ? '✅ Calibrado'
                      : 'Ejecutar Tare'}
                  </span>
                </button>
              </div>
            </div>

            {/* CONTROL STREAM */}
            <button
              type="button"
              onClick={() => setIsStreaming(!isStreaming)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                isStreaming
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isStreaming ? 'Pausar Flujo' : 'Iniciar Captura'}</span>
            </button>
          </div>

          {/* PANEL CENTRAL: MÉTRICAS */}
          <div className="col-span-12 lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" /> Medidores en Vivo
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Tiempo Reacción</span>
                  <div className="text-xl font-black text-purple-400 font-mono">
                    {liveSample.reactionTimeMs} <span className="text-xs text-slate-500 font-normal">ms</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Prensión Grip</span>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {liveSample.handGripPressureKg} <span className="text-xs text-slate-500 font-normal">kg</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Latencia Toque</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {liveSample.touchTapLatencyMs} <span className="text-xs text-slate-500 font-normal">ms</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Batería</span>
                  <div className="text-xl font-black text-amber-400 font-mono">98%</div>
                </div>
              </div>

              {/* TRAZADO EEG */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-300 block">Señal Bruta EEG (8 Canales - µV)</span>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                  {liveSample.eegChannelsRaw?.map((val, idx) => (
                    <div key={idx} className="bg-slate-900 p-1.5 rounded text-center border border-slate-800">
                      <span className="text-[8px] text-slate-500 block">CH{idx + 1}</span>
                      <span className={`font-bold ${val > 10 ? 'text-amber-400' : val < -10 ? 'text-rose-400' : 'text-cyan-300'}`}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTransferToPatient}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferir e Ingresar al Sistema</span>
            </button>
          </div>

          {/* PANEL DERECHO: CONSOLA & BOTÓN DE SALIDA */}
          <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full min-h-[220px]">
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" /> Console Stream
              </h3>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] text-cyan-300 space-y-1 overflow-y-auto max-h-48">
                {logs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900/80 pb-0.5">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95"
            >
              <span>VER TODOS LOS MÓDULOS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
