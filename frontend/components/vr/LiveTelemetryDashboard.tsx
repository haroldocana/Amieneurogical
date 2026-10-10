import React, { useState, useEffect } from 'react';
import { useVrTelemetryBridge } from '../../hooks/useVrTelemetryBridge';
import { Activity, Heart, Eye, Target, Database, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  patientId: string;
  moduleId: string;
}

export const LiveTelemetryDashboard: React.FC<Props> = ({ patientId, moduleId }) => {
  const { liveData, isConnected } = useVrTelemetryBridge('sender', patientId, moduleId);
  
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [isSavedToMongo, setIsSavedToMongo] = useState(false);
  const [currentKPIs, setCurrentKPIs] = useState({
    hits: 0,
    omissions: 0,
    commissions: 0,
    meanReactionTime: 0,
    attentionIndex: 0,
    gsr: 3.5,
    hrv: 70
  });

  useEffect(() => {
    if (liveData?.type === 'TELEMETRY_TICK') {
      const { metrics, kpis, timestamp } = liveData;

      setCurrentKPIs({
        hits: kpis?.totalHits || 0,
        omissions: kpis?.totalOmissions || 0,
        commissions: kpis?.totalCommissions || 0,
        meanReactionTime: kpis?.meanReactionTime || 0,
        attentionIndex: metrics?.attentionIndex || 0,
        gsr: metrics?.gsrValue || 3.5,
        hrv: metrics?.hrvBpm || 70
      });

      setSeriesData((prev) => [
        ...prev.slice(-35), // Mantener los últimos 35 puntos para la gráfica SVG dinámica
        {
          time: new Date(timestamp || Date.now()).toLocaleTimeString(),
          reactionTime: metrics?.reactionTimeMs || 200,
          attention: metrics?.attentionIndex || 85,
          gsr: metrics?.gsrValue || 3.5
        }
      ]);
    }
  }, [liveData]);

  const handleManualSaveToMongo = async () => {
    try {
      const response = await fetch('/api/vr/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          moduleId,
          kpis: {
            totalHits: currentKPIs.hits,
            totalOmissions: currentKPIs.omissions,
            totalCommissions: currentKPIs.commissions,
            avgReactionTimeMs: currentKPIs.meanReactionTime
          },
          telemetryLog: seriesData
        })
      });

      if (response.ok) {
        setIsSavedToMongo(true);
        setTimeout(() => setIsSavedToMongo(false), 4000);
      }
    } catch (e) {
      console.error('Error al forzar guardado en MongoDB:', e);
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
          <h2 className="text-lg font-black text-white tracking-wider uppercase flex items-center gap-2">
            Telemetría VR en Tiempo Real <span className="text-purple-400 font-mono text-xs bg-purple-950/60 border border-purple-800 px-2.5 py-0.5 rounded-full">[{moduleId}]</span>
          </h2>
        </div>
        <button 
          onClick={handleManualSaveToMongo}
          className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-bold rounded-xl flex items-center gap-2 transition active:scale-95 cursor-pointer"
        >
          {isSavedToMongo ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Database className="w-4 h-4 text-purple-400" />}
          <span>{isSavedToMongo ? 'Sincronizado con MongoDB' : 'Guardar en MongoDB'}</span>
        </button>
      </div>

      {/* TARJETAS DE KPIS Y BIOMARCADORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Target className="w-4 h-4 text-emerald-400" /> <span>Aciertos / TR Medio</span>
          </div>
          <div className="text-2xl font-black text-white">{currentKPIs.hits} <span className="text-xs text-slate-400">({currentKPIs.meanReactionTime}ms)</span></div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Eye className="w-4 h-4 text-purple-400" /> <span>Índice Atención</span>
          </div>
          <div className="text-2xl font-black text-purple-300">{currentKPIs.attentionIndex}%</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Activity className="w-4 h-4 text-amber-400" /> <span>Conductancia GSR</span>
          </div>
          <div className="text-2xl font-black text-amber-300">{currentKPIs.gsr} <span className="text-xs text-slate-400">uS</span></div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Heart className="w-4 h-4 text-rose-400" /> <span>Cardiaco HRV</span>
          </div>
          <div className="text-2xl font-black text-rose-300">{currentKPIs.hrv} <span className="text-xs text-slate-400">BPM</span></div>
        </div>
      </div>

      {/* CURVA DINÁMICA DE TIEMPO DE REACCIÓN EN TIEMPO REAL */}
      <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Curva de Respuesta en Vivo (ms)</h3>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Frecuencia: 10 Hz (WebSocket WSS)
          </span>
        </div>
        <div className="h-32 w-full flex items-end gap-1.5 pt-4">
          {seriesData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 font-mono">
              Aguardando transmisión de datos desde las gafas Pico...
            </div>
          ) : (
            seriesData.map((pt, idx) => {
              const heightPct = Math.min(100, Math.max(10, (pt.reactionTime / 500) * 100));
              return (
                <div key={idx} className="flex-1 bg-slate-800/60 rounded-t h-full flex items-end group relative">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-sky-400 rounded-t transition-all duration-150"
                    style={{ height: `${heightPct}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-sky-300 px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                    {pt.reactionTime}ms
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
