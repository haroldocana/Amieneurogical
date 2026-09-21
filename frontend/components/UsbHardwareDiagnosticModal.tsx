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
  // SI IS_OPEN ES FALSE, EL MODAL NO SE RENDERIZA Y LIBERA LA PANTALLA TOTALMENTE
  if (!isOpen) return null;

  const [connectionType, setConnectionType] = useState<ConnectionType>('SIMULATED');
  const [isWebUsbSupported, setIsWebUsbSupported] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>('Sensor Virtual AMIE');
  const [isStreaming, setIsStreaming] = useState(true);
  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'calibrating' | 'calibrated'>('idle');
  const [wifiIp, setWifiIp] = useState('192.168.1.105');

  const [liveSample, setLiveSample] = useState<NeuromotorTelemetrySample>({
    reactionTimeMs: patient?.neuromotorBiomarkers?.reactionTimeMs || 240,
    handGripPressureKg: patient?.multisensoryHardware?.handGripPressureKg || 32.5,
    touchTapLatencyMs: patient?.multisensoryHardware?.touchTapLatencyCompensatedMs || 180,
    eegChannelsRaw: [12.4, -4.2, 18.1, 8.5, -2.1, 14.3, 6.2, 0.8],
    timestamp: Date.now()
  });

  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Subsistema de calibración USB pausado temporalmente.'
  ]);

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isStreaming && isOpen) {
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
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, isOpen]);

  const handleConnectUsbDevice = async () => {
    try {
      const deviceName = await requestUsbDevicePermission();
      if (deviceName) {
        setConnectedDeviceName(deviceName);
        setIsStreaming(true);
      }
    } catch (err: unknown) {
      console.warn('Conexión omitida:', err);
    }
  };

  const handleTransferToPatient = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onUpdateHardwareData) onUpdateHardwareData(liveSample);
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
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-emerald-950 text-emerald-300 border-emerald-500/30">
                  {connectionType}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paciente: <span className="text-white font-semibold">{patientDisplayName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>INGRESAR A MÓDULOS</span>
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

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Modo Diagnóstico Pausado</h3>
              <p className="text-xs text-slate-400">Puedes continuar evaluando el resto de la suite de AMIE.</p>
            </div>
            <button
              type="button"
              onClick={handleTransferToPatient}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cerrar e Ir a la Estación de Trabajo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
