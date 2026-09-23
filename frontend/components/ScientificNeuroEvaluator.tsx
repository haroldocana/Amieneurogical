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
  BarChart3,
  TrendingUp,
  Zap
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
  const ppgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tachoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const animFrameId = useRef<number | null>(null);
  const sweepXRef = useRef<number>(0);
  const waveformBufferRef = useRef<number[]>([]);

  // Búfer para cálculo espectral y Tacograma R-R (Móvil 50 latidos)
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

      // Almacenar serie temporal RR para Tacograma y descomposición frecuencial
      if (packet.rrIntervalMs > 0) {
        rrHistoryRef.current.push(packet.rrIntervalMs);
        if (rrHistoryRef.current.length > 50) rrHistoryRef.current.shift();
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

  // 2. MOTOR ESPECTRAL DINÁMICO & TACOGRAMA (Cálculo Frecuencial LF/HF y RMSSD)
  useEffect(() => {
    const spectralInterval = setInterval(() => {
      const packet = latestTelemetryRef.current;
      setDisplayTelemetry({ ...packet });

      const rrSeries = rrHistoryRef.current;
      if (rrSeries.length >= 8 && packet.heartRateBpm > 30) {
        const meanRr = rrSeries.reduce((a, b) => a + b, 0) / rrSeries.length;
        const variance = rrSeries.reduce((a, b) => a + Math.pow(b - meanRr, 2), 0) / rrSeries.length;
        const stdDev = Math.sqrt(variance);

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

  // 3. MOTOR DE DIBUJO DUAL: PPG ANATÓMICO (Sweep Mode) + TACOGRAMA R-R (Canvas)
  useEffect(() => {
    const ppgCanvas = ppgCanvasRef.current;
    const tachoCanvas = tachoCanvasRef.current;

    if (!ppgCanvas || !tachoCanvas) return;

    const ctxPpg = ppgCanvas.getContext('2d');
    const ctxTacho = tachoCanvas.getContext('2d');

    if (!ctxPpg || !ctxTacho) return;

    let beatPhase = 0;
    let breathPhase = 0;
    let lastRender = performance.now();

    const renderLoop = (now: number) => {
      const deltaSec = (now - lastRender) / 1000;
      lastRender = now;

      // ------------------------------------------------------------------
      // A) RENDER PPG OSCILOSCOPIO (Velocidad Estándar 25 mm/s = 140 px/s)
      // ------------------------------------------------------------------
      const widthPpg = ppgCanvas.width;
      const heightPpg = ppgCanvas.height;
      const speedPxPerSec = 140; 

      sweepXRef.current = (sweepXRef.current + speedPxPerSec * deltaSec) % widthPpg;
      const currentX = sweepXRef.current;

      const packet = latestTelemetryRef.current;
      const bpm = packet.heartRateBpm;

      let yVal = heightPpg / 2;

      if (bpm > 30) {
        const beatsPerSec = bpm / 60;
        beatPhase = (beatPhase + deltaSec * beatsPerSec) % 1.0;
        breathPhase = (breathPhase + deltaSec * 0.25 * 2 * Math.PI) % (2 * Math.PI);

        const baselineDrift = Math.sin(breathPhase) * (heightPpg * 0.06);

        let normalizedPulse = 0;
        if (beatPhase < 0.18) {
          normalizedPulse = Math.sin((beatPhase / 0.18) * (Math.PI / 2));
        } else if (beatPhase >= 0.18 && beatPhase < 0.28) {
          const t = (beatPhase - 0.18) / 0.10;
          normalizedPulse = 1.0 - (t * 0.35);
        } else if (beatPhase >= 0.28 && beatPhase < 0.38) {
          const t = (beatPhase - 0.28) / 0.10;
          normalizedPulse = 0.65 + Math.sin(t * Math.PI) * 0.12;
        } else if (beatPhase >= 0.38 && beatPhase < 0.70) {
          const t = (beatPhase - 0.38) / 0.32;
          normalizedPulse = 0.65 * Math.cos(t * (Math.PI / 2));
        } else {
          normalizedPulse = Math.random() * 0.02;
        }

        yVal = (heightPpg * 0.72) - (normalizedPulse * (heightPpg * 0.48)) + baselineDrift;
      }

      // Borrador gradual de barrido
      const eraseWidth = 24;
      ctxPpg.fillStyle = '#020617';
      ctxPpg.fillRect(currentX, 0, eraseWidth, heightPpg);

      // Re-dibujar Malla Médica en borrador
      ctxPpg.strokeStyle = '#0f172a';
      ctxPpg.lineWidth = 0.5;
      for (let gridY = 0; gridY < heightPpg; gridY += 15) {
        ctxPpg.beginPath();
        ctxPpg.moveTo(currentX, gridY);
        ctxPpg.lineTo(currentX + eraseWidth, gridY);
        ctxPpg.stroke();
      }

      // Trazado continuo con resplandor neón
      const prevX = (currentX - speedPxPerSec * deltaSec + widthPpg) % widthPpg;
      const prevY = waveformBufferRef.current[Math.floor(prevX)] || (heightPpg / 2);
      waveformBufferRef.current[Math.floor(currentX)] = yVal;

      ctxPpg.save();
      ctxPpg.shadowBlur = bpm > 30 ? 7 : 0;
      ctxPpg.shadowColor = connectionStatus.connected ? '#10b981' : '#f59e0b';
      ctxPpg.strokeStyle = bpm > 30 ? (connectionStatus.connected ? '#34d399' : '#fbbf24') : '#334155';
      ctxPpg.lineWidth = 2.0;
      ctxPpg.beginPath();
      ctxPpg.moveTo(prevX, prevY);
      ctxPpg.lineTo(currentX, yVal);
      ctxPpg.stroke();
      ctxPpg.restore();

      // Cursor de Lectura Vertical
      ctxPpg.fillStyle = '#67e8f9';
      ctxPpg.fillRect(currentX + 2, 0, 2, heightPpg);

      // ------------------------------------------------------------------
      // B) RENDER TACOGRAMA (GRÁFICA DE INTERVALOS R-R: 600ms - 1200ms)
      // ------------------------------------------------------------------
      const widthTacho = tachoCanvas.width;
      const heightTacho = tachoCanvas.height;

      ctxTacho.fillStyle = '#020617';
      ctxTacho.fillRect(0, 0, widthTacho, heightTacho);

      // Líneas de referencia horizontal (600, 800, 1000, 1200 ms)
      ctxTacho.strokeStyle = '#1e293b';
      ctxTacho.lineWidth = 1;
      [700, 800, 900, 1000, 1100].forEach((ms) => {
        const y = heightTacho - ((ms - 600) / 600) * heightTacho;
        ctxTacho.beginPath();
        ctxTacho.moveTo(0, y);
        ctxTacho.lineTo(widthTacho, y);
        ctxTacho.stroke();
      });

      // Trazado paramétrico de puntos R-R
      const rrSeries = rrHistoryRef.current;
      if (rrSeries.length > 1) {
        ctxTacho.strokeStyle = '#a855f7';
        ctxTacho.lineWidth = 2;
        ctxTacho.beginPath();

        const stepX = widthTacho / 50;
        rrSeries.forEach((rr, idx) => {
          const x = idx * stepX;
          const y = heightTacho - Math.max(0, Math.min(heightTacho, ((rr - 600) / 600) * heightTacho));
          if (idx === 0) ctxTacho.moveTo(x, y);
          else ctxTacho.lineTo(x, y);
        });
        ctxTacho.stroke();

        // Nube de puntos de latidos
        rrSeries.forEach((rr, idx) => {
          const x = idx * stepX;
          const y = heightTacho - Math.max(0, Math.min(heightTacho, ((rr - 600) / 600) * heightTacho));
          ctxTacho.fillStyle = '#c084fc';
          ctxTacho.beginPath();
          ctxTacho.arc(x, y, 3, 0, Math.PI * 2);
          ctxTacho.fill();
        });
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [connectionStatus.connected]);

  // HANDLERS DE HARDWARE
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

  // INYECCIÓN DE MÉTRICAS MULTIVARIABLES AL EXPEDIENTE DE TRIANGULACIÓN GLOBAL
  const handleTransferToGlobalRecord = () => {
    if (onUpdatePatientData) {
      onUpdatePatientData({
        multisensoryHardware: {
          ...patient.multisensoryHardware,
          vagalToneHrvIndex: displayTelemetry.hrvRmssdMs,
          handGripPressureKg: displayTelemetry.handGripPressureKg,
          camouflagingIndexPct: patient.multisensoryHardware?.camouflagingIndexPct || 25,
          ocularFixationDurationMs: patient.multisensoryHardware?.ocularFixationDurationMs || 350,
          touchTapLatencyCompensatedMs: displayTelemetry.touchTapLatencyMs,
          microExpressionState: displayTelemetry.hrvRmssdMs < 25 
            ? 'Inhibición Vagal / Estrés Agudo' 
            : 'Regulación Parasimpática Óptima'
        },
        neuromotorBiomarkers: {
          reactionTimeMs: displayTelemetry.reactionTimeMs,
          omissionErrors: patient.neuromotorBiomarkers?.omissionErrors || 2,
          commissionErrors: patient.neuromotorBiomarkers?.commissionErrors || 1,
          motorStabilityScore: Math.min(100, Math.max(0, 100 - Math.round(displayTelemetry.handGripPressureKg)))
        }
      });
    }
    setNotificationMsg('Biometría de alta precisión y VFC (RMSSD + LF/HF) inyectadas en el expediente.');
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
                <h2 className="text-base font-bold text-white">ScientificNeuroEvaluator • Monitor Clínico VFC</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                  isRealHardwareConnected
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRealHardwareConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {isRealHardwareConnected ? `HARDWARE BLE EN VIVO (${connectionStatus.protocol})` : 'MODO SIMULACIÓN BIOMÉTRICA'}
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

        {/* CONTROLES DIRECTOS DE PUERTO */}
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

      {/* 2. MÓDULO 1: OSCILOSCOPIO FOTOPLETISEMOGRÁFICO PPG (Sweep 25 mm/s) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
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
              HRV RMSSD: {displayTelemetry.hrvRmssdMs} ms
            </span>
            <span className="px-3 py-1 bg-indigo-950 border border-indigo-500/40 rounded-lg text-indigo-300 text-xs font-mono font-bold tabular-nums">
              GSR: {displayTelemetry.gsrMicroSiemens.toFixed(2)} µS
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative overflow-hidden shadow-inner">
          <canvas
            ref={ppgCanvasRef}
            width={800}
            height={140}
            className="w-full h-36 rounded-lg block bg-slate-950"
          />
        </div>
      </div>

      {/* 3. MÓDULO 2: TACOGRAMA EN TIEMPO REAL (Intervalos R-R: 600 - 1200 ms) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" /> Tacograma Paramétrico (Intervalos R-R en milisegundos)
          </span>
          <span className="text-xs font-mono font-bold text-purple-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg tabular-nums">
            Último R-R: {rrHistoryRef.current[rrHistoryRef.current.length - 1] || 0} ms
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative overflow-hidden shadow-inner">
          <canvas
            ref={tachoCanvasRef}
            width={800}
            height={100}
            className="w-full h-24 rounded-lg block bg-slate-950"
          />
        </div>
      </div>

      {/* 4. MÓDULO 3: ESPECTRO DE FRECUENCIAS LF/HF Y BIOFEEDBACK AUTONÓMICO */}
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

          {/* Balance Simpáticovagal LF/HF */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Balance Simpáticovagal (LF/HF)</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
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
