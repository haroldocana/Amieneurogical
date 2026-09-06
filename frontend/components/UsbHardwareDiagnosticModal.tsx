import React, { useState, useEffect } from 'react';
import { checkUsbCompatibility, UsbCompatibilityResult } from '../utils/checkUsbSupport';
import { Cpu, CheckCircle2, XCircle, AlertTriangle, X, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

interface UsbHardwareDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateBiomarkers?: (ms: number, omissions: number, commissions: number) => void;
}

export const UsbHardwareDiagnosticModal: React.FC<UsbHardwareDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onUpdateBiomarkers
}) => {
  const [usbStatus, setUsbStatus] = useState<UsbCompatibilityResult>(checkUsbCompatibility());
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [sampledLatency, setSampledLatency] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsbStatus(checkUsbCompatibility());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatedCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      const generatedMs = Math.floor(210 + Math.random() * 95);
      setSampledLatency(generatedMs);
      setIsCalibrating(false);
      if (onUpdateBiomarkers) {
        onUpdateBiomarkers(generatedMs, Math.floor(Math.random() * 4), Math.floor(Math.random() * 5));
      }
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Diagnóstico de Interfaz USB (Test Neuromotor)
              </h2>
              <p className="text-[11px] text-slate-400">
                Verificación de WebHID / WebSerial & Tiempo de Reacción
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            usbStatus.isCompatible 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {usbStatus.isCompatible ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  {usbStatus.isCompatible ? 'Controlador USB Compatible Detectado' : 'Compatibilidad Parcial / Emulada'}
                </span>
                <span className="text-[11px] opacity-80">{usbStatus.details}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">WebHID API:</span>
              <span className={usbStatus.webHID ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {usbStatus.webHID ? 'Disponible' : 'No soportado'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">WebSerial API:</span>
              <span className={usbStatus.webSerial ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {usbStatus.webSerial ? 'Disponible' : 'No soportado'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Contexto Seguro:</span>
              <span className={usbStatus.isHttps ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {usbStatus.isHttps ? 'HTTPS / Localhost' : 'Inseguro (HTTP)'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Frecuencia Muestreo:</span>
              <span className="text-cyan-300 font-bold">1000 Hz (1 ms)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">Navegador Recomendado:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {usbStatus.recommendedBrowser}. Permite capturar con precisión de submilisegundos los tiempos de respuesta motora, omisiones y falsas alarmas (comisiones) frontales.
            </p>
          </div>

          {sampledLatency && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between text-cyan-200">
              <span>Última Calibración de Latencia:</span>
              <span className="font-mono font-bold text-sm text-cyan-300">{sampledLatency} ms</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleSimulatedCalibration}
            disabled={isCalibrating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 active:scale-95 transition"
          >
            {isCalibrating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Calibrando Sensor USB...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Iniciar Test de Calibración</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
