import React, { useState, useEffect } from 'react';
import { PatientRecord } from '../types';
import { telemetryService, PrecisionTelemetryPacket, TelemetryProtocol } from '../services/telemetryService';
import { 
  Activity, 
  Usb, 
  Bluetooth, 
  Wifi, 
  Radio, 
  CheckCircle2, 
  Sliders, 
  Cpu, 
  Heart, 
  Target, 
  AlertCircle,
  Gauge
} from 'lucide-react';

interface ScientificNeuroEvaluatorProps {
  patient: PatientRecord;
  onUpdatePatientData?: (updated: Partial<PatientRecord>) => void;
}

export const ScientificNeuroEvaluator: React.FC<ScientificNeuroEvaluatorProps> = ({ 
  patient,
  onUpdatePatientData 
}) => {
  const [telemetry, setTelemetry] = useState<PrecisionTelemetryPacket>(telemetryService.getCurrentPacket());
  const [connectionStatus, setConnectionStatus] = useState({
    protocol: 'SIMULATED' as TelemetryProtocol,
    connected: false,
    deviceName: 'Sin Hardware Físico'
  });

  const [wifiIp, setWifiIp] = useState('192.168.1.105');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Animación continua de la gráfica ECG
  const [ecgPoints, setEcgPoints] = useState<number[]>([
    20, 20, 20, 25, 10, 60, -10, 20, 20, 20, 22, 20, 20, 20, 25, 10, 60, -10, 20, 20
  ]);

  useEffect(() => {
    const unsubData = telemetryService.subscribeData((packet) => {
      setTelemetry(packet);
    });

    const unsubStatus = telemetryService.subscribeStatus((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubData();
      unsubStatus();
    };
  }, []);

  // Animación del trazado ECG
  useEffect(() => {
    const interval = setInterval(() => {
      setEcgPoints(prev => {
        const next = [...prev.slice(1)];
        const step = Date.now() % 1000;
        let val = 20;
        if (step < 100) val = 20 + Math.sin(step / 30) * 8;
        else if (step > 200 && step < 240) val = 10;
        else if (step >= 240 && step <= 280) val = 65; // QRS Peak
        else if (step > 280 && step < 320) val = -5;
        else if (step > 400 && step < 500) val = 25;
        else val = 20 + (Math.random() * 2 - 1);

        next.push(val);
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Handlers para conectar Hardware Real
  const handleConnectUsb = async () => {
    const success = await telemetryService.connectUsb();
    if (success) {
      setNotificationMsg('¡Puerto USB Serial conectado exitosamente a 115200 baudios!');
    } else {
      setNotificationMsg('No se seleccionó dispositivo USB o el navegador denegó el acceso.');
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleConnectBluetooth = async () => {
    const success = await telemetryService.connectBluetooth();
    if (success) {
      setNotificationMsg('Dispositivo Bluetooth BLE vinculado y recibiendo datos.');
    } else {
      setNotificationMsg('No se completó la vinculación Bluetooth BLE.');
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleConnectWifi = () => {
    telemetryService.connectWifi(wifiIp);
    setNotificationMsg(`Intentando conexión Socket a ws://${wifiIp}:8080...`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleZeroTareCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      const offset = telemetryService.executeZeroTare();
      setIsCalibrating(false);
      setNotificationMsg(`Calibración completada. Offset de tara aplicado: ${offset} kg`);
      setTimeout(() => setNotificationMsg(null), 4000);
    }, 500);
  };

  const handleTransferToGlobalRecord = () => {
    if (onUpdatePatientData) {
      onUpdatePatientData({
        multisensoryHardware: {
          vagalToneHrvIndex: telemetry.hrvRmssdMs,
          handGripPressureKg: telemetry.handGripPressureKg,
          camouflagingIndexPct: patient.multisensoryHardware?.camouflagingIndexPct || 25,
          ocularFixationDurationMs: patient.multisensoryHardware?.ocularFixationDurationMs || 350,
          touchTapLatencyCompensatedMs: telemetry.touchTapLatencyMs,
          microExpressionState: patient.multisensoryHardware?.microExpressionState || 'Normorreactivo'
        },
        neuromotorBiomarkers: {
          reactionTimeMs: telemetry.reactionTimeMs,
          omissionErrors: patient.neuromotorBiomarkers?.omissionErrors || 2,
          commissionErrors: patient.neuromotorBiomarkers?.commissionErrors || 1,
          motorStabilityScore: Math.min(100, Math.max(0, 100 - Math.round(telemetry.handGripPressureKg)))
        }
      });
    }
    setNotificationMsg('Métricas de hardware transferidas al expediente general del paciente.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const svgPathD = ecgPoints.map((val, idx) => {
    const x = (idx / (ecgPoints.length - 1)) * 800;
    const y = 80 - val;
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const isRealHardwareConnected = connectionStatus.connected && connectionStatus.protocol !== 'SIMULATED';

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. ENCABEZADO CON VERIFICACIÓN REAL DE ENLACE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl text-white shadow-lg ${
              isRealHardwareConnected 
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20' 
                : 'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-amber-500/20'
            }`}>
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">ScientificNeuroEvaluator • Evaluación Bioclínica</h2>
                
                {/* INDICADOR DE ESTADO REAL */}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isRealHardwareConnected
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRealHardwareConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {isRealHardwareConnected ? `ENLACE REAL ACTIVO (${connectionStatus.protocol})` : 'MODO SIMULACIÓN (SIN HARDWARE)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Dispositivo: <strong className="text-slate-200">{connectionStatus.deviceName}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleZeroTareCalibration}
              disabled={isCalibrating}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCalibrating ? 'Calibrando...' : 'Calibrar Cero / Baseline'}</span>
            </button>

            <button
              onClick={handleTransferToGlobalRecord}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferir a Triangulación Global</span>
            </button>
          </div>
        </div>

        {/* CONTROLES DIRECTOS DE CONEXIÓN */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" /> Seleccionar Fuente Físicas de Entrada:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleConnectUsb}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                connectionStatus.protocol === 'USB' && connectionStatus.connected
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                  : 'bg-slate-950 text-cyan-300 border-cyan-500/40 hover:bg-slate-800'
              }`}
            >
              <Usb className="w-3.5 h-3.5 text-cyan-400" /> Conectar Cable USB (ESP32)
            </button>

            <button
              onClick={handleConnectBluetooth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                connectionStatus.protocol === 'BLUETOOTH' && connectionStatus.connected
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-indigo-300 border-indigo-500/40 hover:bg-slate-800'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5 text-indigo-400" /> Vincular BLE (Geoid)
            </button>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <input
                type="text"
                value={wifiIp}
                onChange={(e) => setWifiIp(e.target.value)}
                className="bg-transparent text-xs text-slate-200 px-2 py-1 w-28 focus:outline-none font-mono"
                placeholder="192.168.1.105"
              />
              <button
                onClick={handleConnectWifi}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                <Wifi className="w-3 h-3 text-emerald-400" /> Wi-Fi
              </button>
            </div>

            <button
              onClick={() => telemetryService.enableSimulation()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                connectionStatus.protocol === 'SIMULATED'
                  ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Forzar Simulación
            </button>
          </div>
        </div>

        {notificationMsg && (
          <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-xl text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}
      </div>

      {/* 2. VISOR ECG EN VIVO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" /> Trazado Fisiológico Continuo
          </span>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
              {telemetry.heartRateBpm} BPM
            </span>
            <span className="px-3 py-1 bg-cyan-950 border border-cyan-500/40 rounded-lg text-cyan-300 text-xs font-mono font-bold">
              HRV: {telemetry.hrvRmssdMs} ms
            </span>
            <span className="px-3 py-1 bg-indigo-950 border border-indigo-500/40 rounded-lg text-indigo-300 text-xs font-mono font-bold">
              GSR: {telemetry.gsrMicroSiemens} µS
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 h-32 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />
          <svg className="w-full h-full relative z-10" viewBox="0 0 800 120" preserveAspectRatio="none">
            <path d={svgPathD} fill="none" stroke={isRealHardwareConnected ? '#10b981' : '#f59e0b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 3. MÉTRICAS BIOMECÁNICAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-400" /> Métricas Cuantitativas Capturadas
          </span>
          <span className="text-xs text-slate-400 font-bold bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
            Origen: {connectionStatus.protocol}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Latencia Biomotora / Respuesta</span>
            <div className="text-2xl font-black text-white font-mono">{telemetry.reactionTimeMs} ms</div>
            <span className="text-[10px] text-amber-400 font-bold mt-1 block">Impulsividad Motor Fin.</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Presión Isométrica (Grip Kg)</span>
            <div className="text-2xl font-black text-cyan-400 font-mono">{telemetry.handGripPressureKg} kg</div>
            <span className="text-[10px] text-teal-400 font-bold mt-1 block">Tensión Neuromuscular</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Latencia de Toque Compensada</span>
            <div className="text-2xl font-black text-indigo-400 font-mono">{telemetry.touchTapLatencyMs} ms</div>
            <span className="text-[10px] text-indigo-300 mt-1 block">Control Inhibitorio Go/No-Go</span>
          </div>
        </div>
      </div>

    </div>
  );
};
