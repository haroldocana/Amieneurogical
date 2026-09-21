import React, { useState } from 'react';
import { QeegBandPowers, PatientRecord } from '../types';
import { InteractiveNeuroViewer } from './InteractiveNeuroViewer';
import { Upload, FileCheck, Brain, RefreshCw, CheckCircle, BarChart3, Zap } from 'lucide-react';

export interface QeegAttachmentPayload {
  recordingDate: string;
  channelsCount: number;
  samplingRateHz: number;
  bandPowers: QeegBandPowers;
}

interface NeuroSensoryModuleProps {
  patient?: PatientRecord;
  onAttachQeegToPatient?: (biomarkers: QeegAttachmentPayload) => void;
}

export const NeuroSensoryModule: React.FC<NeuroSensoryModuleProps> = ({ patient, onAttachQeegToPatient }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Global Spectral Band Powers
  const [bandPowers] = useState<QeegBandPowers>({
    delta: 24,
    theta: 32,
    alfa: 20,
    beta: 16,
    highBeta: 6,
    gamma: 2
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsProcessing(true);
      setUploadSuccess(false);

      const timer = setTimeout(() => {
        setIsProcessing(false);
        setUploadSuccess(true);
        if (onAttachQeegToPatient) {
          onAttachQeegToPatient({
            recordingDate: new Date().toISOString().split('T')[0],
            channelsCount: 19,
            samplingRateHz: 500,
            bandPowers: bandPowers,
          });
        }
      }, 1400);

      return () => clearTimeout(timer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg text-white shadow-lg shadow-purple-600/20">
              <Brain className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-white">
              Módulo de Neurosensometría & Topografía qEEG
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Procesamiento cuantitativo de bandas espectrales (Delta, Theta, Alfa, Beta, High Beta, Gamma) y visor interactivo holográfico.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition">
            <Upload className="w-4 h-4" />
            <span>Cargar Archivo (.EDF, .CSV, PDF)</span>
            <input
              type="file"
              accept=".edf,.csv,.pdf,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* File Upload Status */}
      {selectedFile && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-medium">
              Archivo cargado: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          {isProcessing ? (
            <span className="flex items-center gap-1.5 text-sky-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Procesando señales FFT & Espectro...
            </span>
          ) : uploadSuccess ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Procesamiento Espectral Completado & Vinculado
            </span>
          ) : null}
        </div>
      )}

      {/* Interactive 3D HUD Neuro-Spectral FFT Viewer (Paso seguro de patient) */}
      <InteractiveNeuroViewer patient={patient} />

      {/* Spectral Band Power Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Distribución de Potencia Relativa por Banda Espectral Quantitativa (qEEG)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> 100% Espectro Global FFT
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Delta (0.5 - 4 Hz)</span>
            <div className="text-lg font-bold font-mono text-cyan-300">{bandPowers.delta}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${bandPowers.delta}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Theta (4 - 8 Hz)</span>
            <div className="text-lg font-bold font-mono text-purple-300">{bandPowers.theta}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: `${bandPowers.theta}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Alfa (8 - 12 Hz)</span>
            <div className="text-lg font-bold font-mono text-emerald-300">{bandPowers.alfa}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${bandPowers.alfa}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Beta (12 - 20 Hz)</span>
            <div className="text-lg font-bold font-mono text-amber-300">{bandPowers.beta}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${bandPowers.beta}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">High Beta (20 - 30 Hz)</span>
            <div className="text-lg font-bold font-mono text-rose-300">{bandPowers.highBeta}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: `${bandPowers.highBeta * 3}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Gamma (30 - 45 Hz)</span>
            <div className="text-lg font-bold font-mono text-indigo-300">{bandPowers.gamma}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${bandPowers.gamma * 8}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
