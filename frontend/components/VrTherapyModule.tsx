import React, { useState } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { 
  Glasses, Activity, HeartPulse, FileText, CheckCircle2, ShieldAlert, 
  Wifi, Settings, Edit3, Download, RefreshCw, BarChart2 
} from 'lucide-react';

interface VrTherapyModuleProps {
  patient: PatientRecord;
  onUpdatePatientVrData: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export const VrTherapyModule: React.FC<VrTherapyModuleProps> = ({ patient, onUpdatePatientVrData }) => {
  const [connectionType, setConnectionType] = useState<'websocket' | 'render_proxy' | 'simulation'>('simulation');
  const [ipAddress, setIpAddress] = useState('192.168.1.105');
  const [isConnected, setIsConnected] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [telemetry] = useState<VrTelemetryData>({
    sessionId: `VR-QUEST3S-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    gsrMicroSiemens: [1.2, 1.8, 3.2, 4.8, 3.9, 2.8, 2.1, 1.6, 1.3],
    hrvRmssdMs: [45, 42, 31, 22, 28, 35, 40, 46, 48],
    habituationIndexH: 2.84,
    stressPeaksCount: 2,
    exposureDurationSec: 300,
  });

  const [isEditingReport, setIsEditingReport] = useState(false);
  const [reportText, setReportText] = useState(
    `EVALUACIÓN MÉDICO-EJECUTIVA DE RESPUESTA VEGETATIVA EN ENTORNO VR\n` +
    `-------------------------------------------------------------------\n` +
    `PACIENTE ID: ${patient.id || 'PAC-8104'} | EDAD: ${patient.age} años | GÉNERO: ${patient.gender}\n` +
    `DISPOSITIVO: Meta Quest 3S (Frecuencia de Muestreo Bio-VR: 60Hz)\n\n` +
    `1. HALLAZGOS BIOMÉTRICOS PRINCIPALES:\n` +
    `- Tono Simpático (GSR): Presenta reactividad inicial pico de 4.8 µS a los 120s de exposición inmersiva frente a estresor auditivo/visual.\n` +
    `- Modulación Parasimpática (HRV RMSSD): Caída inicial compensatoria a 22ms con posterior recuperación vagal sostenida hasta 48ms.\n` +
    `- Extinción de Distrés (H): Índice de Habituación Terapéutica H = 2.84 (Rango Óptimo: > 2.0).\n\n` +
    `2. JUICIO DIAGNÓSTICO E IMPACTO TERAPÉUTICO:\n` +
    `El paciente demuestra plasticidad autonómica adaptativa. No se observa hiperreactividad simpática bloqueante ni disociación afectiva grave. La curva de respuesta confirma tolerancia adecuada a protocolos de exposición inmersiva.`
  );

  const handleExportWord = () => {
    const header = "data:application/vnd.ms-word;charset=utf-8,";
    const content = encodeURIComponent(
      `<html><head><meta charset='utf-8'></head><body style='font-family:Arial,sans-serif;padding:20px;'>` +
      `<h2 style='color:#0284c7;'>AMIE CLINICAL ENGINE — INFORME EJECUTIVO VR QUEST 3S</h2>` +
      `<pre style='font-family:Arial,sans-serif;white-space:pre-wrap;'>${reportText}</pre>` +
      `</body></html>`
    );
    const link = document.createElement("a");
    link.href = header + content;
    link.download = `Informe_Ejecutivo_VR_${patient.id || 'PAC-8104'}.doc`;
    link.click();
  };

  const handleTransferData = () => {
    const updatedReport: VrTherapyReport = {
      sessionGuid: telemetry.sessionId,
      exposureType: 'Exposición inmersiva VR Quest 3S con Biofeedback',
      sympatheticToneIndex: 68,
      vagalReactivityIndex: 42,
      habituationRate: 'Óptima',
      synthesizedClinicalSummary: reportText
    };
    onUpdatePatientVrData(telemetry, updatedReport);
  };

  return (
    <div className="space-y-5">
      {/* Encabezado Módulo Independiente + Ajustes de Conexión */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-600/20">
              <Glasses className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Módulo Terapéutico VR Meta Quest 3S
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] rounded-full font-semibold">
                  PRUEBA AUTÓNOMA
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Inhibición de respuesta, habituación progresiva y biofeedback neurofisiológico inmersivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Conexión Quest 3S</span>
            </button>

            <button
              onClick={handleTransferData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferir a Triangulación Global</span>
            </button>
          </div>
        </div>

        {/* Panel Configuración Método de Conexión */}
        {isConfigOpen && (
          <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Wifi className="w-4 h-4" /> Método de Comunicación y Sincronización Meta Quest 3S
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Modo de Enlace</label>
                <select 
                  value={connectionType} 
                  onChange={(e: any) => setConnectionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="websocket">Direct WebSocket (Local LAN Quest 3S)</option>
                  <option value="render_proxy">Render Backend Server Proxy</option>
                  <option value="simulation">Simulación de Telemetría Bioclínica</option>
                </select>
              </div>

              {connectionType !== 'simulation' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Dirección IP Visor Quest 3S</label>
                  <input 
                    type="text" 
                    value={ipAddress} 
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-white font-mono"
                  />
                </div>
              )}

              <div className="flex items-end">
                <button 
                  onClick={() => setIsConnected(!isConnected)}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isConnected ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' : 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isConnected ? 'Estado: Enlace Activo (60 FPS)' : 'Desconectado - Reconectar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Biometría Terapéutica en Vivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Conductancia Cutánea (GSR)</span>
          </div>
          <div className="text-xl font-bold text-white">4.8 µS <span className="text-xs text-rose-400 font-normal">(Pico Excitación)</span></div>
          <p className="text-[10px] text-slate-500 mt-1">Medición de tono simpático inmersivo</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Tono Vagal (HRV RMSSD)</span>
          </div>
          <div className="text-xl font-bold text-white">48 ms <span className="text-xs text-emerald-400 font-normal">(Modulación)</span></div>
          <p className="text-[10px] text-slate-500 mt-1">Capacidad de autorregulación parasimpática</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Índice de Habituación ($H$)</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">{telemetry.habituationIndexH}</div>
          <p className="text-[10px] text-emerald-400 mt-1">Extinción de distrés: Óptima</p>
        </div>
      </div>

      {/* Gráfica de Estudio Biométrico */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" /> Curva de Respuesta Fisiológica (GSR vs HRV durante Exposición)
          </h3>
          <span className="text-[10px] text-slate-400">Duración: 300 segundos</span>
        </div>

        <div className="h-44 w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-end gap-2 relative">
          {telemetry.gsrMicroSiemens.map((val, idx) => {
            const hrvVal = telemetry.hrvRmssdMs[idx] || 30;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                <div 
                  style={{ height: `${(val / 5) * 100}%` }} 
                  className="w-full bg-gradient-to-t from-cyan-600 to-rose-500 rounded-t opacity-80 group-hover:opacity-100 transition"
                />
                <span className="text-[9px] text-slate-500 font-mono">t+{idx * 30}s</span>

                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 p-2 rounded text-[10px] text-white z-20 shadow-xl whitespace-nowrap">
                  <span>GSR: {val} µS</span>
                  <span>HRV: {hrvVal} ms</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 px-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full inline-block"></span> Reactividad GSR (µS)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-500 rounded-full inline-block"></span> Recuperación Vagal HRV (ms)</span>
        </div>
      </div>

      {/* Editor del Informe Clínico Ejecutivo */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Informe Clínico Ejecutivo — VR Quest 3S</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingReport(!isEditingReport)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isEditingReport ? 'Finalizar Edición' : 'Editar Informe'}</span>
            </button>

            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Word (.docx)</span>
            </button>
          </div>
        </div>

        {isEditingReport ? (
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-xl border border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
          />
        ) : (
          <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
            {reportText}
          </div>
        )}
      </div>
    </div>
  );
};
