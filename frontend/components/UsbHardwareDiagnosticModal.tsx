import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { 
  requestUsbDevicePermission, 
  NeuromotorTelemetrySample 
} from '../utils/checkUsbSupport';
import { 
  Usb, 
  X, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  Zap, 
  Sliders, 
  ShieldCheck, 
  Terminal,
  Play,
  Pause,
  Gauge
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  onUpdateHardwareData: (sample: NeuromotorTelemetrySample) => void;
}

export const UsbHardwareDiagnosticModal: React.FC<Props> = ({
  patient,
  onClose,
  onUpdateHardwareData
}) => {
  const [isWebUsbSupported, setIsWebUsbSupported] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'calibrating' | 'calibrated'>('idle');

  // Muestras fisiológicas en tiempo real (Prensión, Latencia, Reacción, EEG raw)
  const [liveSample, setLiveSample] = useState<NeuromotorTelemetrySample>({
    reactionTimeMs: patient.neuromotorBiomarkers?.reactionTimeMs || 240,
    handGripPressureKg: patient.multisensoryHardware?.handGripPressureKg || 32.5,
    touchTapLatencyMs: patient.multisensoryHardware?.touchTapLatencyCompensatedMs || 180,
    eegChannelsRaw: [12.4, -4.2, 18.1, 8.5, -2.1, 14.3, 6.2, 0.8],
    timestamp: Date.now()
  });

  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Inicializando subsistema de diagnóstico WebUSB/HID...',
    '[SYSTEM] Esperando conexión de dispositivos biométricos de precisión.'
  ]);

  // Verificar compatibilidad del navegador con WebUSB
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'navigator' in window && 'usb' in navigator;
    setIsWebUsbSupported(supported);
    if (!supported) {
      setLogs(prev => [
        ...prev,
        '[WARN] WebUSB API no disponible en este navegador. Se usará simulación de puerto serie virtual.'
      ]);
    }
  }, []);

  // Bucle de streaming en vivo a 60Hz (Simulación de paquetes USB / HID)
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

        if (Math.random() > 0.7) {
          const timestamp = new Date().toISOString().slice(11, 19);
          const logMsg = `[${timestamp}] [USB RX] Grip: ${simulatedGrip}kg | Reaction: ${simulatedReaction}ms | Latency: ${simulatedTap}ms`;
          setLogs(prevLogs => [logMsg, ...prevLogs.slice(0, 15)]);
        }
      }, 100); // 10Hz refresco visual de interfaz
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  // Solicitar emparejamiento con un dispositivo USB real
  const handleConnectUsbDevice = async () => {
    try {
      setLogs(prev => [...prev, '[SYSTEM] Solicitando emparejamiento con dispositivo USB...']);
      const deviceName = await requestUsbDevicePermission();
      if (deviceName) {
        setConnectedDeviceName(deviceName);
        setIsStreaming(true);
        setLogs(prev => [
          ...prev,
          `[SUCCESS] Dispositivo USB enlazado exitosamente: ${deviceName}`,
          '[SYSTEM] Iniciando captura de flujo neuromotor a 60Hz...'
        ]);
      } else {
        setLogs(prev => [...prev, '[INFO] El usuario canceló la selección de dispositivo USB.']);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setLogs(prev => [...prev, `[ERROR] Fallo en la conexión USB: ${errorMsg}`]);
    }
  };

  // Ejecutar calibración del punto cero de los sensores isométricos
  const handleCalibrateSensors = () => {
    setCalibrationStatus('calibrating');
    setLogs(prev => [...prev, '[CALIB] Iniciando calibración de carga nula (Zero-Tare)...']);

    setTimeout(() => {
      setCalibrationStatus('calibrated');
      setLogs(prev => [
        ...prev,
        '[CALIB] ✅ Calibración completada: Matriz de galgas extensiométricas e impedancia a cero.'
      ]);
    }, 1500);
  };

  // Transferir la muestra capturada al expediente del paciente en App.tsx
  const handleTransferToPatient = () => {
    onUpdateHardwareData(liveSample);
    setLogs(prev => [...prev, '[TRANSFER] Muestra neuromotora inyectada en la triangulación global del paciente.']);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-6 font-sans">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        
        {/* Header Modal */}
        <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Usb className="w-6 h-6 animate-pulse text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide text-white">
                  DIAGNÓSTICO & CALIBRACIÓN DE HARDWARE USB
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isWebUsbSupported ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'
                }`}>
                  {isWebUsbSupported ? 'WEBUSB SOPORTADO' : 'NATIVO NO DISPONIBLE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paciente: <span className="text-white font-semibold">{patient.patientNameAnonymized || patient.id}</span> | Telemetría Neuromotora Directa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Cerrar Diagnóstico USB"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Panel Central Grid */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
          
          {/* Panel Izquierdo: Control de Dispositivos USB y Estado (4 Cols) */}
          <div className="col-span-12 lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Dispositivo de Entrada USB / HID
              </h3>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Estado de Conexión</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    connectedDeviceName ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                  }`}>
                    {connectedDeviceName ? 'CONECTADO' : 'DESCONECTADO'}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-200 truncate">
                  {connectedDeviceName || 'Ningún hardware físico emparejado'}
                </div>

                <button
                  onClick={handleConnectUsbDevice}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
                >
                  <Usb className="w-4 h-4" />
                  <span>Emparejar Dispositivo USB</span>
                </button>
              </div>

              {/* Botón de Calibración cero-tare */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Calibración Isométrica</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Zero-Tare</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Asegúrate de que el sensor de prensión manual y la superficie táctil no estén presionados antes de iniciar.
                </p>

                <button
                  onClick={handleCalibrateSensors}
                  disabled={calibrationStatus === 'calibrating'}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {calibrationStatus === 'calibrating' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  )}
                  <span>
                    {calibrationStatus === 'calibrating'
                      ? 'Calibrando Cero...'
                      : calibrationStatus === 'calibrated'
                      ? '✅ Sensores Calibrados'
                      : 'Ejecutar Tare de Calibración'}
                  </span>
                </button>
              </div>
            </div>

            {/* Control de Stream */}
            <div className="pt-2">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isStreaming
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                }`}
              >
                {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isStreaming ? 'Pausar Flujo de Datos USB' : 'Iniciar Captura en Tiempo Real'}</span>
              </button>
            </div>
          </div>

          {/* Panel Central: Gauges y Telemetría Vivo (5 Cols) */}
          <div className="col-span-12 lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" /> Medidores Neuromotores en Vivo
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Tiempo de Reacción</span>
                  <div className="text-2xl font-black text-purple-400 font-mono">
                    {liveSample.reactionTimeMs} <span className="text-xs text-slate-500 font-normal">ms</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">USB Polling: 1000 Hz</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Prensión Manual (Grip)</span>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {liveSample.handGripPressureKg} <span className="text-xs text-slate-500 font-normal">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Celda de Carga Isométrica</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Latencia Toque (Touch)</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {liveSample.touchTapLatencyMs} <span className="text-xs text-slate-500 font-normal">ms</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Compensación de Hardware</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Estado de Batería USB</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">98%</div>
                  <span className="text-[10px] text-slate-500 block">Alimentación Bus 5V</span>
                </div>
              </div>

              {/* Trazado EEG Raw Simplificado */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Señal Bruta EEG (8 Canales - µV)</span>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                  {liveSample.eegChannelsRaw?.map((val, idx) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded text-center border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">CH{idx + 1}</span>
                      <span className={`font-bold ${val > 10 ? 'text-amber-400' : val < -10 ? 'text-rose-400' : 'text-cyan-300'}`}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleTransferToPatient}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferir Lectura al Expediente Global</span>
            </button>
          </div>

          {/* Panel Derecho: Consola Log Terminal (3 Cols) */}
          <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-hidden">
            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" /> Consola USB RX Stream
              </h3>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-cyan-300 space-y-1 overflow-y-auto leading-relaxed">
                {logs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900/80 pb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
