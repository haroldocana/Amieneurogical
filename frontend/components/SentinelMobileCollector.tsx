import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Zap, 
  MapPin, 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  BrainCircuit, 
  Clock, 
  ShieldCheck, 
  Heart, 
  Keyboard, 
  BarChart3, 
  Wifi, 
  RefreshCw, 
  Layers,
  Activity
} from 'lucide-react';

interface PatientTelemetryData {
  patientId: string;
  typingLatencyMs: number;
  typingVariabilityMs: number;
  sleepHoursLastNight: number;
  nightAwakenings: number;
  restingHeartRate: number;
  isOutsideSafeZone: boolean;
  lastSyncTimestamp: string;
}

export const SentinelMobileCollector: React.FC = () => {
  const [patientId] = useState('PAC-8104');
  
  // 1. ESTADO DE TRAZABILIDAD DEL DISPOSITIVO DEL PACIENTE
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  const [pingMs, setPingMs] = useState<number>(28);
  const [packetsReceived, setPacketsReceived] = useState<number>(24);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 2. MÉTRICAS PASIVAS CAPTURADAS EN EL TELÉFONO DEL PACIENTE
  const [telemetry, setTelemetry] = useState<PatientTelemetryData>({
    patientId: 'PAC-8104',
    typingLatencyMs: 148,
    typingVariabilityMs: 22,
    sleepHoursLastNight: 6.5,
    nightAwakenings: 2,
    restingHeartRate: 72,
    isOutsideSafeZone: false,
    lastSyncTimestamp: new Date().toLocaleTimeString('es-ES')
  });

  // Polling continuo de comunicación pasiva con la APK
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('es-ES');
      setPingMs(Math.floor(20 + Math.random() * 15));
      setPacketsReceived(prev => prev + 1);
      
      // Simula ligeras variaciones en la telemetría enviada por el teléfono en background
      setTelemetry(prev => ({
        ...prev,
        typingLatencyMs: Math.min(Math.max(prev.typingLatencyMs + Math.floor(Math.random() * 7 - 3), 110), 260),
        lastSyncTimestamp: now
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTelemetry(prev => ({
        ...prev,
        lastSyncTimestamp: new Date().toLocaleTimeString('es-ES')
      }));
      setIsRefreshing(false);
    }, 600);
  };

  // 3. MOTOR DE DEDUCCIÓN CLÍNICA DERIVADO A TRASTORNOS (JITAI)
  const depressionRisk = Math.min(
    Math.max(
      (telemetry.typingLatencyMs > 180 ? 45 : 10) + 
      (telemetry.sleepHoursLastNight < 5 || telemetry.sleepHoursLastNight > 9 ? 25 : 0) + 
      (telemetry.nightAwakenings >= 3 ? 15 : 0), 
      5
    ), 
    98
  );

  const maniaRisk = Math.min(
    Math.max(
      (telemetry.typingLatencyMs < 120 ? 50 : 10) + 
      (telemetry.sleepHoursLastNight < 5 ? 35 : 0), 
      5
    ), 
    98
  );

  const anxietyRisk = Math.min(
    Math.max(
      (telemetry.restingHeartRate > 78 ? 40 : 15) + 
      (telemetry.nightAwakenings >= 3 ? 30 : 0), 
      5
    ), 
    98
  );

  const cognitiveRisk = Math.min(
    Math.max(
      (telemetry.typingVariabilityMs > 35 ? 45 : 10) + 
      (telemetry.typingLatencyMs > 210 ? 30 : 0), 
      5
    ), 
    98
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 space-y-6 font-sans">
      
      {/* SECCIÓN 1: CABECERA DE TRAZABILIDAD Y LINK CON EL DISPOSITIVO */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Trazabilidad de Comunicación JITAI</h2>
                <span className="px-2.5 py-0.5 text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-full font-bold">
                  APK TELEMETRY LINK OK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Monitoreo pasivo continuo enviado desde la APK Centinela en el dispositivo del paciente.
              </p>
            </div>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Estado</span>
          </button>
        </div>

        {/* METRICAS DE CONEXIÓN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Dispositivo Paciente</span>
            <span className="font-mono text-cyan-300 font-bold text-[11px] truncate block">Android / Sentinel APK</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Servicio Pasivo</span>
            <span className="font-mono text-emerald-400 font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              AccessibilityService
            </span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Última Recepción ($t$)</span>
            <span className="font-mono text-amber-300 font-bold text-[11px] block">{telemetry.lastSyncTimestamp}</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Paquetes Registrados</span>
            <span className="font-mono text-white font-bold text-[11px] block">{packetsReceived} paquetes</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: TELEMETRÍA BIOMÉTRICA CAPTURADA PASIVAMENTE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Telemetría Pasiva del Paciente (Solo Lectura)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">PAC: {patientId}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Latencia de Tecleo */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Latencia Tecleo Pasivo
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-mono font-black text-amber-400">
                {telemetry.typingLatencyMs} <span className="text-xs text-slate-400 font-sans">ms</span>
              </span>
              <span className="text-[9px] text-slate-500">Captura APK</span>
            </div>
          </div>

          {/* Variabilidad */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" /> Variabilidad Tecleo ($\sigma$)
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-mono font-black text-purple-300">
                {telemetry.typingVariabilityMs} <span className="text-xs text-slate-400 font-sans">ms</span>
              </span>
              <span className="text-[9px] text-slate-500">Intersigno</span>
            </div>
          </div>

          {/* Sueño */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Patrón de Sueño
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-mono font-black text-indigo-300">
                {telemetry.sleepHoursLastNight} <span className="text-xs text-slate-400 font-sans">hrs</span>
              </span>
              <span className="text-[10px] font-mono text-rose-400 font-bold">
                {telemetry.nightAwakenings} desp.
              </span>
            </div>
          </div>

          {/* Frecuencia Cardíaca Reposo */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" /> FC Reposo
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl font-mono font-black text-emerald-400">
                {telemetry.restingHeartRate} <span className="text-xs text-slate-400 font-sans">bpm</span>
              </span>
              <span className="text-[9px] text-emerald-400/80 font-bold">Normocardia</span>
            </div>
          </div>

        </div>
      </div>

      {/* SECCIÓN 3: MATRIZ DE ANÁLISIS DE RIESGO DERIVADO A TRASTORNOS CLÍNICOS */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white">Análisis Derivado a Trastornos Clínicos (Matriz JITAI)</h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">Algoritmo Basado en Evidencia</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Depresión */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Depresión / Inhibición</span>
              <span className={`font-mono font-black ${depressionRisk > 50 ? 'text-rose-400' : 'text-slate-400'}`}>
                {depressionRisk}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${depressionRisk}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {telemetry.typingLatencyMs > 180 ? 'Inhibición psicomotora detectada.' : 'Patrón psicomotor estable.'}
            </p>
          </div>

          {/* Manía */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Viraje Maníaco</span>
              <span className={`font-mono font-black ${maniaRisk > 50 ? 'text-amber-400' : 'text-slate-400'}`}>
                {maniaRisk}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${maniaRisk}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {telemetry.sleepHoursLastNight < 5 ? 'Reducción marcada de necesidad de sueño.' : 'Sin aceleración tecleo/sueño.'}
            </p>
          </div>

          {/* Ansiedad */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Ansiedad / Hiperarousal</span>
              <span className={`font-mono font-black ${anxietyRisk > 50 ? 'text-purple-400' : 'text-slate-400'}`}>
                {anxietyRisk}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${anxietyRisk}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {telemetry.restingHeartRate > 78 ? 'Hiperactividad autonómica simpática.' : 'Tono autonómico en norma.'}
            </p>
          </div>

          {/* Deterioro Cognitivo */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Disejecutivo / Cognitivo</span>
              <span className={`font-mono font-black ${cognitiveRisk > 50 ? 'text-cyan-400' : 'text-slate-400'}`}>
                {cognitiveRisk}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${cognitiveRisk}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {telemetry.typingVariabilityMs > 35 ? 'Inconsistencia motora fina.' : 'Ritmicidad visomotora adecuada.'}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
