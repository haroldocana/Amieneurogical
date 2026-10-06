import React, { useState } from 'react';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';
import { Activity, Brain, Settings, PlayCircle, Zap, Cpu, RefreshCw, Send } from 'lucide-react';
import { PatientRecord } from '../types';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrExecutiveFunctionModule: React.FC<Props> = ({ patient, onClose }) => {
  const patientId = patient?.id || 'PAC-8104';
  const { isConnected, isPeerConnected, liveData, syncSession, sendRemoteStart } = useVrTelemetryBridge('receiver', patientId, 'ExecutiveControl');

  const [aiMode, setAiMode] = useState<boolean>(true);
  const [monitoringActive, setMonitoringActive] = useState<boolean>(false);

  const metrics = liveData?.metrics || { hits: 0, omissions: 0, commissions: 0, reactionTimeMs: 0 };
  const TR = metrics.reactionTimeMs || 0;
  const trColor = TR === 0 ? 'text-slate-500' : TR < 300 ? 'text-emerald-400' : TR < 450 ? 'text-amber-400' : 'text-rose-400';

  const handleStartMonitoring = () => {
    setMonitoringActive(true);
    syncSession();
    sendRemoteStart();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-200">
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-900/50 rounded-lg border border-sky-500/30">
            <Brain className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">CONSOLA DEL PROFESIONAL • TDAH (Executive Control)</h2>
            <p className="text-xs text-slate-400">Paciente ID: <strong className="text-sky-300">{patientId}</strong></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={syncSession} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /><span>Sincronizar Visor</span>
          </button>
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${isConnected || isPeerConnected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-rose-950/80 border-rose-500/50 text-rose-400'}`}>
            <Activity className="w-4 h-4" />{isConnected || isPeerConnected ? 'VR Enlazado (En Vivo)' : 'Sin Señal VR'}
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">Cerrar</button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-sky-400" /> Parámetros de la Prueba</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Modo de Administración</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button onClick={() => setAiMode(true)} className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${aiMode ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><Cpu className="w-3.5 h-3.5" /> Autogestión IA</button>
                  <button onClick={() => setAiMode(false)} className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${!aiMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><PlayCircle className="w-3.5 h-3.5" /> Manual</button>
                </div>
              </div>
              {!aiMode && (
                <div className="p-4 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-3">
                  <p className="text-xs text-indigo-300 text-center font-bold">Controles Manuales</p>
                  <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer">Forzar Estímulo GO (Verde)</button>
                  <button className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95 cursor-pointer">Forzar Estímulo NO-GO (Rojo)</button>
                </div>
              )}
              {aiMode && <div className="p-4 bg-sky-950/20 rounded-xl border border-sky-900/30 text-xs text-sky-200/70 text-center leading-relaxed">El Asistente AMIE gestionará la secuencia y adaptará los intervalos según el tiempo de reacción.</div>}
            </div>
          </div>
        </div>

        <div className="col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Flujo Biométrica</h3>
            <button onClick={handleStartMonitoring} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition flex items-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" /><span>{monitoringActive ? 'Re-sincronizar y Lanzar' : 'Iniciar Monitoreo Real'}</span>
            </button>
          </div>
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mb-6 relative overflow-hidden">
            {!monitoringActive ? <p className="text-slate-600 text-xs italic">Haz clic en "Iniciar Monitoreo Real" para sincronizar la sala...</p> : (!isConnected && !isPeerConnected) ? <p className="text-amber-500/80 text-xs animate-pulse">Buscando enlace con Meta Quest 3S...</p> : (
              <div className="w-full h-full p-6 flex flex-col justify-center items-center">
                <div className="text-emerald-400 text-xs font-mono font-bold mb-2">● Enlace WSS Activo — Canal Sincronizado</div>
                <div className="w-full h-24 border-b border-l border-slate-800 relative bg-slate-900/30 rounded-lg">
                  <div className="absolute right-3 top-3 text-[10px] font-mono text-slate-500">PAQUETES: {metrics.hits + metrics.commissions + metrics.omissions}</div>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center"><span className="text-[10px] text-slate-500 uppercase font-bold">Aciertos</span><div className="text-2xl font-black text-emerald-400 mt-1">{metrics.hits}</div></div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center"><span className="text-[10px] text-slate-500 uppercase font-bold">Omisiones</span><div className="text-2xl font-black text-amber-400 mt-1">{metrics.omissions}</div></div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center"><span className="text-[10px] text-slate-500 uppercase font-bold">Comisiones</span><div className="text-2xl font-black text-rose-500 mt-1">{metrics.commissions}</div></div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center"><span className="text-[10px] text-slate-500 uppercase font-bold">TR Último</span><div className={`text-2xl font-black mt-1 ${trColor}`}>{TR} <span className="text-xs text-slate-500">ms</span></div></div>
          </div>
        </div>

        <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-400" /> Registro</h3>
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-2">
            <p className="text-slate-500">[{new Date().toLocaleTimeString()}] Telemetría Lista.</p>
            {monitoringActive && <p className="text-sky-400">[{new Date().toLocaleTimeString()}] Handshake emitido para {patientId}.</p>}
            {(isConnected || isPeerConnected) && <p className="text-emerald-400">[{new Date().toLocaleTimeString()}] Visor VR Confirmado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
