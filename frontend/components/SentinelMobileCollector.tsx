import React, { useState, useRef } from 'react';
import { Smartphone, Zap, MapPin, Moon, Send, CheckCircle2, AlertTriangle, RefreshCw, ArrowUpRight } from 'lucide-react';

interface TelemetryPayload {
  patientId: string;
  doctorUsername: string;
  typingLatencyMs: number;
  touchTapLatencyMs: number;
  sleepHoursLastNight: number;
  nightAwakenings: number;
  isOutsideSafeZone: boolean;
  latitude?: number;
  longitude?: number;
  restingHeartRate: number;
  timestamp: string;
}

export const SentinelMobileCollector: React.FC = () => {
  const TARGET_URL = 'https://amieneurogical.onrender.com/api/sentinel/telemetry';

  const [pacId, setPacId] = useState('PAC-8104');
  const [doctorUsername, setDoctorUsername] = useState('2000');
  
  const [typingLatency, setTypingLatency] = useState<number>(140);
  const [tapLatency, setTapLatency] = useState<number>(180);
  const [sleepHours, setSleepHours] = useState<number>(6.5);
  const [nightAwakenings, setNightAwakenings] = useState<number>(2);
  const [restingHr, setRestingHr] = useState<number>(72);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOutsideSafeZone, setIsOutsideSafeZone] = useState<boolean>(false);

  const [typingTestText, setTypingTestText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastSentPayload, setLastSentPayload] = useState<any>(null);
  const [serverResponse, setServerResponse] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lastKeyTimeRef = useRef<number | null>(null);
  const keyIntervalsRef = useRef<number[]>([]);

  const handleTypingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = performance.now();
    const value = e.target.value;
    setTypingTestText(value);

    if (lastKeyTimeRef.current !== null) {
      const interval = now - lastKeyTimeRef.current;
      if (interval < 2000) {
        keyIntervalsRef.current.push(interval);
        const avg = Math.round(
          keyIntervalsRef.current.reduce((a, b) => a + b, 0) / keyIntervalsRef.current.length
        );
        setTypingLatency(avg);
      }
    }
    lastKeyTimeRef.current = now;
  };

  const handleGetLocation = () => {
    setErrorMsg(null);
    if (!navigator.geolocation) {
      setErrorMsg('Geolocalización no disponible.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        const homeLat = 14.634915;
        const homeLng = -90.506882;
        const dist = Math.sqrt(Math.pow(lat - homeLat, 2) + Math.pow(lng - homeLng, 2));
        setIsOutsideSafeZone(dist > 0.05);
      },
      (err) => {
        setErrorMsg(`GPS Omitido (${err.message}). Se enviará sin coordenadas.`);
      },
      { enableHighAccuracy: false, timeout: 4000 }
    );
  };

  // Envió mediante XMLHttpRequest blindado contra fallos de Safari/WebKit
  const sendTelemetryXHR = (url: string, payload: TelemetryPayload): Promise<{ status: number; data: any }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ status: xhr.status, data });
          } catch (e) {
            reject(new Error('La respuesta del servidor no es un JSON válido.'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || `Error servidor HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Error servidor HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = function () {
        reject(new Error('Error de red al conectar con Render (verifique conexión o adblockers).'));
      };

      xhr.send(JSON.stringify(payload));
    });
  };

  const handleSendTelemetry = async () => {
    setIsSending(true);
    setServerResponse(null);
    setErrorMsg(null);

    const payload: TelemetryPayload = {
      patientId: pacId.trim().toUpperCase(),
      doctorUsername: doctorUsername.trim().toLowerCase(),
      typingLatencyMs: typingLatency,
      touchTapLatencyMs: tapLatency,
      sleepHoursLastNight: sleepHours,
      nightAwakenings: nightAwakenings,
      isOutsideSafeZone: isOutsideSafeZone,
      latitude: location?.lat,
      longitude: location?.lng,
      restingHeartRate: restingHr,
      timestamp: new Date().toISOString()
    };

    setLastSentPayload(payload);

    try {
      const result = await sendTelemetryXHR(TARGET_URL, payload);
      setServerResponse({
        httpStatus: result.status,
        data: result.data
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 space-y-5 font-sans">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 bg-cyan-600 rounded-2xl text-white shadow-lg shadow-cyan-600/30">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            Capturador Móvil Centinela 24/7
            <span className="px-2 py-0.5 text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
              LIVE TESTER
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Envío de bioseñales pasivas móviles directo a Render.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-bold mb-1">Código PAC del Paciente:</label>
          <input
            type="text"
            value={pacId}
            onChange={(e) => setPacId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-bold mb-1">Usuario Médico:</label>
          <input
            type="text"
            value={doctorUsername}
            onChange={(e) => setDoctorUsername(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> Latencia de Tecleo
          </span>
          <span className="text-xs font-mono font-bold text-amber-400">{typingLatency} ms</span>
        </div>
        <input
          type="text"
          placeholder="Escribe aquí en tu iPhone para medir velocidad..."
          value={typingTestText}
          onChange={handleTypingInputChange}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-xs">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Moon className="w-3 h-3 text-indigo-400" /> Sueño (Hrs)
          </label>
          <input
            type="number"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-indigo-300 font-mono font-bold focus:outline-none"
          />
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <label className="text-[10px] font-bold text-slate-400">Despertares</label>
          <input
            type="number"
            value={nightAwakenings}
            onChange={(e) => setNightAwakenings(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-rose-400 font-mono font-bold focus:outline-none"
          />
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <label className="text-[10px] font-bold text-slate-400">FC Reposo</label>
          <input
            type="number"
            value={restingHr}
            onChange={(e) => setRestingHr(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-emerald-400 font-mono font-bold focus:outline-none"
          />
        </div>
      </div>

      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" /> GPS (Opcional)
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : 'Sin GPS'}
          </p>
        </div>
        <button
          onClick={handleGetLocation}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg border border-slate-700 transition"
        >
          Probar GPS
        </button>
      </div>

      <button
        onClick={handleSendTelemetry}
        disabled={isSending}
        className="w-full py-3.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-cyan-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSending ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Transmitiendo a Render...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Enviar Telemetría Móvil en Vivo</span>
          </>
        )}
      </button>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {serverResponse && (
        <div className="p-4 bg-slate-950 border border-emerald-500/50 rounded-2xl space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> TELEMETRÍA RECIBIDA
            </span>
            <span className="bg-emerald-950 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-800">
              HTTP {serverResponse.httpStatus} OK
            </span>
          </div>

          <div className="space-y-1 text-slate-300">
            <p>• <strong>Paciente:</strong> <span className="text-cyan-300 font-mono">{serverResponse.data.patientId}</span></p>
            <p>• <strong>Riesgo Evaluado:</strong> <span className="text-amber-400 font-mono font-bold">{serverResponse.data.evaluatedRiskScore}%</span></p>
            <p>• <strong>Respuesta Backend:</strong> <span className="text-emerald-300 font-mono">{serverResponse.data.status}</span></p>
          </div>

          <div className="pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
            <span className="block font-bold text-slate-400 mb-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-cyan-400" /> JSON transmitido:
            </span>
            <pre className="p-2 bg-slate-900 rounded-lg overflow-x-auto text-slate-400">
              {JSON.stringify(lastSentPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
