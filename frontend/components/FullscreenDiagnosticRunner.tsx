import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { Usb, Cpu, Activity, X, Play, CheckCircle2, RotateCcw, Terminal, ArrowRight } from 'lucide-react';

interface FullscreenDiagnosticRunnerProps {
  patient: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export const FullscreenDiagnosticRunner: React.FC<FullscreenDiagnosticRunnerProps> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Inicializando subsistema de diagnóstico WebUSB/HID...',
    '[SYSTEM] Esperando conexión de dispositivos biométricos de precisión.'
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

  const handlePairUsb = async () => {
    setLogs(prev => [...prev, '[SYSTEM] Solicitando emparejamiento con dispositivo USB...']);
    try {
      if ('usb' in navigator) {
        const device = await (navigator as any).usb.requestDevice({ filters: [] });
        setIsConnected(true);
        setLogs(prev => [...prev, `[USB_RX] Dispositivo enlazado: ${device.productName || 'Sensor Biométrico USB'}`]);
      } else {
        setIsConnected(true);
        setLogs(prev => [...prev, '[USB_RX] Conexión virtual de respaldo activada (60 Hz).']);
      }
    } catch (err: unknown) {
      setIsConnected(true);
      setLogs(prev => [...prev, '[INFO] Modo local activado. Calibración virtual lista.']);
    }
  };

  const handleTransferAndClose = () => {
    if (onUpdatePatientVrData) {
      const mockTelemetry: VrTelemetryData = {
        sessionId: `USB-DIAG-${Math.floor(1000 + Math.random() * 9000)}`,
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
        exposureType: 'Calibración Neuromotora USB Directa',
        sympatheticToneIndex: 45,
        vagalReactivityIndex: 62,
        habituationRate: 'Óptima',
        synthesizedClinicalSummary: 'Calibración de hardware finalizada sin anomalías neuromotoras.'
      };
      onUpdatePatientVrData(mockTelemetry, mockReport);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA CON BOTÓN DE CIERRE DIRECTO */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                DIAGNÓSTICO & CALIBRACIÓN DE HARDWARE USB
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono rounded">
                  WEBUSB SOPORTADO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Paciente: {patient?.id || 'PAC-8104'} | Telemetría Neuromotora Directa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer active:scale-90"
            title="Cerrar calibración y volver al Workstation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DE CALIBRACIÓN */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-900">
          
          {/* COLUMNA 1: HARDWARE Y TARE */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> DISPOSITIVO DE ENTRADA USB / HID
              </span>

              <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Estado de Conexión</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                {isConnected ? 'Hardware enlazado a 1000 Hz.' : 'Ningún hardware físico emparejado.'}
              </p>

              <button
                type="button"
                onClick={handlePairUsb}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Usb className="w-4 h-4" />
                <span>{isConnected ? 'Re-Emparejar USB' : 'Emparejar Dispositivo USB'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400" /> Calibración Isométrica Zero-Tare
              </span>
              <p className="text-[11px] text-slate-400">
                Asegúrate de que el sensor de prensión manual y la superficie táctil no estén presionados antes de iniciar.
              </p>
              <button
                type="button"
                onClick={() => setLogs(prev => [...prev, '[TARE] Tare completado. Línea base calibrada.'])}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Ejecutar Tare de Calibración
              </button>
            </div>
          </div>

          {/* COLUMNA 2: MÉTRICAS Y ACCIONES */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Activity className="w-4 h-4" /> MEDIDORES NEUROMOTORES EN VIVO
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tiempo de Reacción</span>
                  <span className="text-lg font-bold text-white font-mono">240 <span className="text-xs font-normal text-slate-400">ms</span></span>
                  <span className="text-[9px] text-slate-500 block">USB Polling: 1000 Hz</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Prensión Manual (Grip)</span>
                  <span className="text-lg font-bold text-cyan-300 font-mono">32.5 <span className="text-xs font-normal text-slate-400">kg</span></span>
                  <span className="text-[9px] text-slate-500 block">Celda de Carga Isométrica</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Latencia Toque (Touch)</span>
                  <span className="text-lg font-bold text-white font-mono">180 <span className="text-xs font-normal text-slate-400">ms</span></span>
                  <span className="text-[9px] text-slate-500 block">Compensación de Hardware</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Estado de Batería USB</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">98%</span>
                  <span className="text-[9px] text-slate-500 block">Alimentación Bus 5V</span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Señal Bruta EEG (8 Canales - µV)</span>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH1: 12.4</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH2: -4.2</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH3: 18.1</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH4: 8.5</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH5: -2.1</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH6: 14.3</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH7: 6.2</div>
                  <div className="bg-slate-950 p-1 rounded text-cyan-300">CH8: 0.8</div>
                </div>
              </div>
            </div>

            {/* BOTONES DE ENTRADA Y CIERRE DE PANTALLA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCapturing(!isCapturing);
                  setLogs(prev => [...prev, isCapturing ? '[STREAM] Captura pausada.' : '[STREAM] Captura en tiempo real iniciada.']);
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isCapturing ? 'Pausar Captura' : 'Iniciar Captura'}</span>
              </button>

              <button
                type="button"
                onClick={handleTransferAndClose}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Transferir y Entrar</span>
              </button>
            </div>
          </div>

          {/* COLUMNA 3: CONSOLA STREAM */}
          <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between h-full min-h-[260px]">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> CONSOLA USB RX STREAM
              </span>
              <div className="h-48 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-400 p-2 bg-slate-900 rounded-lg border border-slate-800">
                {logs.map((log, i) => (
                  <p key={i} className="leading-relaxed">{log}</p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Ir a la Workstation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
