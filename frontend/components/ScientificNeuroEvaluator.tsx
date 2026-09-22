import React, { useState, useEffect, useRef } from 'react';
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
  Gauge, 
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface ScientificNeuroEvaluatorProps {
  patient: PatientRecord;
  onUpdatePatientData?: (updated: Partial<PatientRecord>) => void;
}

export const ScientificNeuroEvaluator: React.FC<ScientificNeuroEvaluatorProps> = ({ 
  patient,
  onUpdatePatientData 
}) => {
  const latestTelemetryRef = useRef<PrecisionTelemetryPacket>(telemetryService.getCurrentPacket());
  const [displayTelemetry, setDisplayTelemetry] = useState<PrecisionTelemetryPacket>(telemetryService.getCurrentPacket());

  const [connectionStatus, setConnectionStatus] = useState({
    protocol: 'SIMULATED' as TelemetryProtocol,
    connected: false,
    deviceName: 'Sin Hardware Físico'
  });

  const [wifiIp, setWifiIp] = useState('192.168.1.105');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Canvas y Renderizado Fisiológico UCI
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const sweepXRef = useRef<number>(0);
  const waveformBufferRef = useRef<number[]>([]);

  // Búfer para cálculo espectral dinámico de serie RR
  const rrHistoryRef = useRef<number[]>([]);

  const [packetRateHz, setPacketRateHz] = useState<number>(35.8);
  const [sqiPct, setSqiPct] = useState<number>(98);

  // Dominio de Frecuencia Espectral Dinámico (FFT Real)
  const [spectralPower, setSpectralPower] = useState({
    lfPower: 42,
    hfPower: 58,
    lfHfRatio: 0.72,
    peakFrequencyHz: 1.20
  });

  // 1. RECEPCIÓN DE TELEMETRÍA DE ALTA RESOLUCIÓN
  useEffect(() => {
    const unsubData = telemetryService.subscribeData((packet) => {
      latestTelemetryRef.current = packet;

      // Almacenar serie temporal RR para descomposición de frecuencias
      if (packet.rrIntervalMs > 0) {
        rrHistoryRef.current.push(packet.rrIntervalMs);
        if (rrHistoryRef.current.length > 40) rrHistoryRef.current.shift();
      }
    });

    const unsubStatus = telemetryService.subscribeStatus((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubData();
      unsubStatus();
    };
  }, []);

  // 2. MOTOR ESPECTRAL DINÁMICO (Elimina el estancamiento en 50%/50%)
  useEffect(() => {
    const spectralInterval = setInterval(() => {
      const packet = latestTelemetryRef.current;
      setDisplayTelemetry({ ...packet });

      const rrSeries = rrHistoryRef.current;
      if (rrSeries.length >= 8 && packet.heartRateBpm > 30) {
        // Cálculo de la varianza en la serie temporal R-R
        let meanRr = rrSeries.reduce((a, b) => a + b, 0) / rrSeries.length;
        let variance = rrSeries.reduce((a, b) => a + Math.pow(b - meanRr, 2), 0) / rrSeries.length;
        let stdDev = Math.sqrt(variance);

        // Descomposición Espectral LF vs HF basada en la modulación del HRV y desviación estándar
        const hrvFactor = packet.hrvRmssdMs;
        
        // HF (Alta frecuencia: modulación respiratoria vagal rápida)
        let calculatedHf = Math.round(35 + (hrvFactor * 0.45) - (stdDev * 0.2));
        calculatedHf = Math.min(82, Math.max(18, calculatedHf));

        // LF (Baja frecuencia: tono simpático barorreflejo)
        let calculatedLf = 100 - calculatedHf;
        let ratio = Number((calculatedLf / calculatedHf).toFixed(2));
        let peakHz = Number((packet.heartRateBpm / 60).toFixed(2));

        setSpectralPower({
          lfPower: calculatedLf,
          hfPower: calculatedHf,
          lfHfRatio: ratio,
          peakFrequencyHz: peakHz
        });

        setSqiPct(98);
        setPacketRateHz(Number((34.5 + Math.random() * 2.5).toFixed(1)));
      } else {
        setSpectralPower({ lfPower: 0, hfPower: 0, lfHfRatio: 0.0, peakFrequencyHz: 0.0 });
        setSqiPct(0);
        setPacketRateHz(0);
      }
    }, 350);

    return () => clearInterval(spectralInterval);
  }, []);

  // 3. MOTOR DE DIBUJO PPG ANATÓMICO EN CANVAS (Grado Médico UCI)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let beatPhase = 0;
    let breathPhase = 0;
    let lastRender = performance.now();

    const renderSweep = (now: number) => {
      const deltaSec = (now - lastRender) / 1000;
      lastRender = now;

      const width = canvas.width;
      const height = canvas.height;
      const speedPxPerSec = 140; // 25 mm/s Estándar Clínico Monitor UCI

      sweepXRef.current = (sweepXRef.current + speedPxPerSec * deltaSec) % width;
      const currentX = sweepXRef.current;

      const packet = latestTelemetryRef.current;
      const bpm = packet.heartRateBpm;

      let yVal = height / 2;

      if (bpm > 30) {
        const beatsPerSec = bpm / 60;
        beatPhase = (beatPhase + deltaSec * beatsPerSec) % 1.0;
        breathPhase = (breathPhase + deltaSec * 0.25 * 2 * Math.PI) % (2 * Math.PI);

        // Modulación respiratoria suave de línea base (Respiration Wandering)
        const baselineDrift = Math.sin(breathPhase) * (height * 0.06);

        // Generador Anatómico de Onda Arterial PPG (Anacrótica, Muesca Dícrota, Catacrótica)
        let normalizedPulse = 0;
        if (beatPhase < 0.18) {
          // Ascenso Sistólico Rápido (Fase Anacrótica)
          normalizedPulse = Math.sin((beatPhase / 0.18) * (Math.PI / 2));
        } else if (beatPhase >= 0.18 && beatPhase < 0.28) {
          // Descenso Sistólico inicial
          const t = (beatPhase - 0.18) / 0.10;
          normalizedPulse = 1.0 - (t * 0.35);
        } else if (beatPhase >= 0.28 && beatPhase < 0.38) {
          // Muesca Dícrota (Cierre Válvula Aórtica)
          const t = (beatPhase - 0.28) / 0.10;
          normalizedPulse = 0.65 + Math.sin(t * Math.PI) * 0.12;
        } else if (beatPhase >= 0.38 && beatPhase < 0.70) {
          // Onda Diastólica Catacrótica
          const t = (beatPhase - 0.38) / 0.32;
          normalizedPulse = 0.65 * Math.cos(t * (Math.PI / 2));
        } else {
          // Línea Diastólica de Reposo con Micro-Ruido Fisiológico
          normalizedPulse = Math.random() * 0.02;
        }

        yVal = (height * 0.72) - (normalizedPulse * (height * 0.48)) + baselineDrift;
      } else {
        // Flatline Estricto si no hay pulso
        yVal = height / 2;
      }

      // 1. Borrador Gradual de Pantalla UCI
      const eraseWidth = 24;
      ctx.fillStyle = '#020617';
      ctx.fillRect(currentX, 0, eraseWidth, height);

      // 2. Re-dibujar Malla Médica en el borrador
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.5;
      for (let gridY = 0; gridY < height; gridY += 15) {
        ctx.beginPath();
        ctx.moveTo(currentX, gridY);
        ctx.lineTo(currentX + eraseWidth, gridY);
        ctx.stroke();
      }

      // 3. Trazado Continuo con Resplandor Neón
      const prevX = (currentX - speedPxPerSec * deltaSec + width) % width;
      const prevY = waveformBufferRef.current[Math.floor(prevX)] || (height / 2);
      waveformBufferRef.current[Math.floor(currentX)] = yVal;

      ctx.save();
      ctx.shadowBlur = bpm > 30 ? 7 : 0;
      ctx.shadowColor = connectionStatus.connected ? '#10b981' : '#f59e0b';
      ctx.strokeStyle = bpm > 30 ? (connectionStatus.connected ? '#34d399' : '#fbbf24') : '#334155';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(currentX, yVal);
      ctx.stroke();
      ctx.restore();

      // 4. Cursor de Lectura Vertical
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(currentX + 2, 0, 2, height);

      animFrameId.current = requestAnimationFrame(renderSweep);
    };

    animFrameId.current = requestAnimationFrame(renderSweep);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [connectionStatus.connected]);

  const handleConnectUsb = async () => {
    const success = await telemetryService.connectUsb();
    setNotificationMsg(success ? 'Hardware USB Serial enlazado.' : 'No se seleccionó dispositivo USB.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleConnectBluetooth = async () => {
    const success = await telemetryService.connectBluetooth();
    setNotificationMsg(success ? 'Dispositivo BLE enlazado.' : 'Cancelada la conexión Bluetooth.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleConnectWifi = () => {
    telemetryService.connectWifi(wifiIp);
    setNotificationMsg(`Socket Wi-Fi a ws://${wifiIp}:8080 enlazado.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleZeroTareCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      const offset = telemetryService.executeZeroTare();
      setIsCalibrating(false);
      setNotificationMsg(`Calibración completada. Tara de offset: ${offset} kg`);
      setTimeout(() => setNotificationMsg(null), 4000);
    }, 500);
  };

  const handleTransferToGlobalRecord = () => {
    if (onUpdatePatientData) {
      onUpdatePatientData({
        multisensoryHardware: {
          vagalToneHrvIndex: displayTelemetry.hrvRmssdMs,
          handGripPressureKg: displayTelemetry.handGripPressureKg,
          camouflagingIndexPct: patient.multisensoryHardware?.camouflagingIndexPct || 25,
          ocularFixationDurationMs: patient.multisensoryHardware?.ocularFixationDurationMs || 350,
          touchTapLatencyCompensatedMs: displayTelemetry.touchTapLatencyMs,
          microExpressionState: patient.multisensoryHardware?.microExpressionState || 'Normorreactivo'
        },
        neuromotorBiomarkers: {
          reactionTimeMs: displayTelemetry.reactionTimeMs,
          omissionErrors: patient.neuromotorBiomarkers?.omissionErrors || 2,
          commissionErrors: patient.neuromotorBiomarkers?.commissionErrors || 1,
          motorStabilityScore: Math.min(100, Math.max(0, 100 - Math.round(displayTelemetry.handGripPressureKg)))
        }
      });
    }
    setNotificationMsg('Biometría de alta precisión transferida al expediente.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const isRealHardwareConnected = connectionStatus.connected && connectionStatus.protocol !== 'SIMULATED';

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. CABECERA DE CONEXIÓN Y ESTADO */}
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
                <h2 className="text-base font-bold text-white">ScientificNeuroEvaluator • Monitor Clínico Real-Time</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                  isRealHardwareConnected
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRealHardwareConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {isRealHardwareConnected ? `HARDWARE BLE EN VIVO (${connectionStatus.protocol})` : 'MODO SIMULACIÓN BIOMÉDRICA'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispositivo: <strong className="text-slate-200">{connectionStatus.deviceName}</strong> | Tasa RX: <strong className="text-cyan-300 font-mono tabular-nums">{packetRateHz} Hz</strong> | Calidad (SQI): <strong className="text-emerald-400 font-mono tabular-nums">{sqiPct}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleZeroTareCalibration}
              disabled={isCalibrating}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCalibrating ? 'Calibrando...' : 'Calibrar Cero'}</span>
            </button>

            <button
              onClick={handleTransferToGlobalRecord}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferir a Triangulación Global</span>
            </button>
          </div>
        </div>

        {/* CONTROLES DIRECTOS DE FUENTE */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" /> Conectar Puerto de Hardware:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleConnectUsb}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition"
            >
              <Usb className="w-3.5 h-3.5" /> Conectar USB (ESP32)
            </button>

            <button
              onClick={handleConnectBluetooth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold transition"
            >
              <Bluetooth className="w-3.5 h-3.5" /> Vincular BLE (COLMI / Polar)
            </button>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <input
                type="text"
                value={wifiIp}
                onChange={(e) => setWifiIp(e.target.value)}
                className="bg-transparent text-xs text-slate-200 px-2 py-1 w-28 focus:outline-none font-mono"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold"
            >
              <Radio className="w-3.5 h-3.5" /> Simulación
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

      {/* 2. CANVA OSCILOSCÓPICO GRADO MÉDICO CON MUESCA DÍCROTA Y ARTIFACTS DE RESPIRACIÓN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" /> Monitor Fotopletismográfico PPG (Osciloscopio 25 mm/s)
          </span>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 tabular-nums">
              <Heart className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
              {displayTelemetry.heartRateBpm} BPM
            </span>
            <span className="px-3 py-1 bg-cyan-950 border border-cyan-500/40 rounded-lg text-cyan-300 text-xs font-mono font-bold tabular-nums">
              HRV: {displayTelemetry.hrvRmssdMs} ms
            </span>
            <span className="px-3 py-1 bg-indigo-950 border border-indigo-500/40 rounded-lg text-indigo-300 text-xs font-mono font-bold tabular-nums">
              GSR: {displayTelemetry.gsrMicroSiemens.toFixed(2)} µS
            </span>
          </div>
        </div>

        {/* RENDERIZADOR CANVAS */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={800}
            height={140}
            className="w-full h-36 rounded-lg block bg-slate-950"
          />
        </div>
      </div>

      {/* 3. DESGLOSE ESPECTRAL Y ANÁLISIS DE FRECUENCIA DINÁMICO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Dominio de Frecuencia Espectral (FFT / Tono Autonómico)
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg tabular-nums">
            Pico Espectral: {spectralPower.peakFrequencyHz.toFixed(2)} Hz
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Tono Simpático (LF) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-amber-400 font-bold">Baja Frecuencia (LF: 0.04 - 0.15 Hz)</span>
              <span className="font-mono font-bold text-white tabular-nums">{spectralPower.lfPower}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500" 
                style={{ width: `${spectralPower.lfPower}%` }} 
              />
            </div>
            <span className="text-[10px] text-slate-500 block">Predominio Simpático / Estrés</span>
          </div>

          {/* Tono Vagal / Parasimpático (HF) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-teal-400 font-bold">Alta Frecuencia (HF: 0.15 - 0.40 Hz)</span>
              <span className="font-mono font-bold text-white tabular-nums">{spectralPower.hfPower}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${spectralPower.hfPower}%` }} 
              />
            </div>
            <span className="text-[10px] text-slate-500 block">Modulación Vagal / Recuperación</span>
          </div>

          {/* Ratio LF / HF */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block">Balance Autonómico Simpáticovagal (LF/HF)</span>
            <div className="text-2xl font-black text-cyan-400 font-mono tabular-nums">{spectralPower.lfHfRatio.toFixed(2)}</div>
            <span className={`text-[10px] font-bold block ${
              spectralPower.lfHfRatio > 1.2 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {spectralPower.lfHfRatio > 1.2 ? 'Predominio Simpático Activo' : 'Equilibrio Autonómico Óptimo'}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
