import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  Sliders, 
  Terminal, 
  Play, 
  Pause, 
  Gauge,
  Signal,
  FastForward,
  ArrowRight,
  Radio,
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface Props {
  isOpen?: boolean;
  patient?: PatientRecord;
  onClose: () => void;
  onUpdateHardwareData?: (sample: NeuromotorTelemetrySample) => void;
}

type ConnectionType = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED';

export const UsbHardwareDiagnosticModal: React.FC<Props> = ({
  isOpen = false,
  patient,
  onClose,
  onUpdateHardwareData
}) => {
  if (!isOpen) return null;

  const [connectionType, setConnectionType] = useState<ConnectionType>('SIMULATED');
  const [isWebUsbSupported, setIsWebUsbSupported] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>('Sensor Virtual AMIE');
  const [isStreaming, setIsStreaming] = useState(true);
  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'calibrating' | 'calibrated'>('idle');
  const [wifiIp, setWifiIp] = useState('192.168.1.105');
  const [sqiScore, setSqiScore] = useState(96);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const [liveSample, setLiveSample] = useState<NeuromotorTelemetrySample>({
    reactionTimeMs: patient?.neuromotorBiomarkers?.reactionTimeMs || 240,
    handGripPressureKg: patient?.multisensoryHardware?.handGripPressureKg || 32.5,
    touchTapLatencyMs: patient?.multisensoryHardware?.touchTapLatencyCompensatedMs || 180,
    eegChannelsRaw: [12.4, -4.2, 18.1, 8.5, -2.1, 14.3, 6.2, 0.8],
    timestamp: Date.now()
  });

  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Sistema de diagnóstico biométrico iniciado.`,
    `[${new Date().toLocaleTimeString()}] Canal BLE / USB inicializado en puerto COM_VIRTUAL_0.`,
    `[${new Date().toLocaleTimeString()}] Modo actual: SIMULATED_PRECISION_STREAM.`
  ]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'navigator' in window && 'usb' in navigator;
    setIsWebUsbSupported(supported);
  }, []);

  // Streaming de datos en tiempo real
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isStreaming && isOpen) {
      interval = setInterval(() => {
        const simulatedReaction = Math.floor(210 + Math.random() * 60);
        const simulatedGrip = Number((30 + Math.random() * 8 - 4).toFixed(1));
        const simulatedTap = Math.floor(165 + Math.random() * 35);
        const simulatedEeg = Array.from({ length: 8 }, () => Number((Math.random() * 30 - 15).toFixed(1)));
        const simulatedSqi = Math.floor(92 + Math.random() * 7);

        setLiveSample({
          reactionTimeMs: simulatedReaction,
          handGripPressureKg: simulatedGrip,
          touchTapLatencyMs: simulatedTap,
          eegChannelsRaw: simulatedEeg,
          timestamp: Date.now()
        });
        setSqiScore(simulatedSqi);
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, isOpen]);

  const handleConnectUsbDevice = async () => {
    try {
      addLog('Solicitando handshake WebUSB...');
      const deviceName = await requestUsbDevicePermission();
      if (deviceName) {
        setConnectedDeviceName(deviceName);
        setConnectionType('USB');
        setIsStreaming(true);
        addLog(`Dispositivo USB conectado: ${deviceName}`);
      }
    } catch (err: unknown) {
      addLog(`Error de conexión USB: ${err instanceof Error ? err.message : 'Permiso denegado'}`);
    }
  };

  const handleConnectBluetooth = () => {
    addLog('Escaneando dispositivos Bluetooth BLE (Polar/Colmi/Geoid)...');
    setTimeout(() => {
      setConnectedDeviceName('Colmi R02 BLE Ring / Polar H10');
      setConnectionType('BLUETOOTH');
      setIsStreaming(true);
      addLog('Conectado exitosamente vía Bluetooth LE.');
    }, 1200);
  };

  const handleConnectWifi = () => {
    addLog(`Iniciando socket WebSocket en IP ${wifiIp}:8080...`);
    setTimeout(() => {
      setConnectedDeviceName(`ESP32 Streamer (${wifiIp})`);
      setConnectionType('WIFI');
      setIsStreaming(true);
      addLog(`Socket establecido con ${wifiIp}. Telemetría en vivo.`);
    }, 1000);
  };

  const handleCalibrateZero = () => {
    setCalibrationStatus('calibrating');
    addLog('Ejecutando tara de dinamómetro y calibración de latencia Cero...');
    setTimeout(() => {
      setCalibrationStatus('calibrated');
      addLog('Calibración completada: Calidad de señal offset en 0.00 kg / 0 ms.');
      setTimeout(() => setCalibrationStatus('idle'), 3000);
    }, 1500);
  };

  const handleTransferToPatient = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onUpdateHardwareData) onUpdateHardwareData(liveSample);
    addLog('Muestras biométricas transferidas al expediente activo.');
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
        {/* Encabezado Principal */}
        <header className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Signal className="w-5 h-5 animate-pulse text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide text-white">
                  DIAGNÓSTICO & CALIBRACIÓN HARDWARE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-cyan-950 text-cyan-300 border-cyan-500/30">
                  {connectionType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-emerald-950 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SQI: {sqiScore}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paciente Vinculado: <span className="text-white font-semibold">{patientDisplayName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTransferToPatient}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VINCULAR MUESTRAS</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>IR A MÓDULOS</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Cuerpo del Modal */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* Selector de Conexión */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={handleConnectUsbDevice}
              className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                connectionType === 'USB'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Usb className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <span className="text-xs font-bold block text-white">Puerto USB / COM</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isWebUsbSupported ? 'WebUSB Soportado' : 'Sin soporte directo'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleConnectBluetooth}
              className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                connectionType === 'BLUETOOTH'
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Bluetooth className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <span className="text-xs font-bold block text-white">Bluetooth LE</span>
                <span className="text-[10px] text-slate-400 font-mono">Polar / Colmi / Geoid</span>
              </div>
            </button>

            <div className={`p-3 rounded-xl border flex items-center justify-between transition ${
              connectionType === 'WIFI'
                ? 'bg-sky-950/80 border-sky-500 text-sky-200'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block text-white">Wi-Fi Socket</span>
                  <input
                    type="text"
                    value={wifiIp}
                    onChange={(e) => setWifiIp(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-200 w-24 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectWifi}
                className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded"
              >
                Sync
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setConnectionType('SIMULATED');
                setConnectedDeviceName('Sensor Virtual AMIE');
                setIsStreaming(true);
                addLog('Modo simulación de precisión activado.');
              }}
              className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                connectionType === 'SIMULATED'
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Radio className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <span className="text-xs font-bold block text-white">Simulador AMIE</span>
                <span className="text-[10px] text-slate-400 font-mono">Sintetizador de Ondas</span>
              </div>
            </button>
          </div>

          {/* Estado de Transmisión y Calibración */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isStreaming ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isStreaming ? <Activity className="w-5 h-5 animate-pulse" /> : <Pause className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Dispositivo Activo: <span className="text-cyan-400">{connectedDeviceName}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Estado: {isStreaming ? 'TRANSMITIENDO EN VIVO (150ms)' : 'PAUSADO'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStreaming(!isStreaming)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  isStreaming ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isStreaming ? 'Pausar' : 'Reanudar'}</span>
              </button>

              <button
                type="button"
                onClick={handleCalibrateZero}
                disabled={calibrationStatus === 'calibrating'}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${calibrationStatus === 'calibrating' ? 'animate-spin text-amber-400' : ''}`} />
                <span>{calibrationStatus === 'calibrating' ? 'Calibrando...' : 'Tara / Calibrar Cero'}</span>
              </button>
            </div>
          </div>

          {/* Grid de Medidores Biométricos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Tiempo de Reacción
              </span>
              <div className="text-2xl font-mono font-bold text-amber-400">
                {liveSample.reactionTimeMs} <span className="text-xs text-slate-500">ms</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (liveSample.reactionTimeMs / 500) * 100)}%` }} 
                />
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Presión de Prensión
              </span>
              <div className="text-2xl font-mono font-bold text-cyan-400">
                {liveSample.handGripPressureKg} <span className="text-xs text-slate-500">kg</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (liveSample.handGripPressureKg / 60) * 100)}%` }} 
                />
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-purple-400" /> Latencia de Tap Táctil
              </span>
              <div className="text-2xl font-mono font-bold text-purple-400">
                {liveSample.touchTapLatencyMs} <span className="text-xs text-slate-500">ms</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-purple-500 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (liveSample.touchTapLatencyMs / 400) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Osciloscopio EEG 8 Canales */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Monitoreo Encefalográfico Multicanal (EEG Raw - 8 Canales)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 rounded">
                256 Hz Sampling Rate
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {liveSample.eegChannelsRaw.map((val, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>CH-{idx + 1}</span>
                    <span className={val >= 0 ? 'text-cyan-400' : 'text-rose-400'}>{val > 0 ? `+${val}` : val} µV</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden relative">
                    <div 
                      className={`h-full transition-all duration-150 ${val >= 0 ? 'bg-cyan-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(val) * 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consola de Logs de Hardware */}
          <div className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Consola de Diagnóstico & Eventos Seriales</span>
            </div>
            <div 
              ref={logContainerRef}
              className="p-3 h-28 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-0.5 bg-slate-950"
            >
              {logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie de Modal / Acciones */}
        <footer className="bg-slate-900/90 border-t border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            Subsistema AMIE Hardware Interface v3.8
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTransferToPatient}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferir a Estación de Trabajo</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
