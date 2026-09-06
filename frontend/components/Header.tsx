import React, { useState } from 'react';
import { ClinicalHelpModal } from './ClinicalHelpModal';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  BookOpen,
  BrainCircuit,
  RefreshCw,
  UserCheck,
  HelpCircle,
  Search,
  CloudDownload,
  User
} from 'lucide-react';

interface HeaderProps {
  onOpenDsmGuide: () => void;
  onOpenPrinciples: () => void;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  doctorName?: string;
  colegiadoNumber?: number;
  currentPatientId?: string;
  patientAge?: number;
  patientGender?: 'M' | 'F' | 'Other';
  onSyncPacient: (pacId: string) => Promise<void>;
  isSyncingPac?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDsmGuide,
  onOpenPrinciples,
  isAnalyzing,
  onRunAnalysis,
  doctorName = 'Dr. Alejandro Morales Rivera',
  colegiadoNumber = 749210,
  currentPatientId = 'PAC-8104',
  patientAge = 55,
  patientGender = 'M',
  onSyncPacient,
  isSyncingPac = false,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [searchPacId, setSearchPacId] = useState<string>(currentPatientId || 'PAC-8104');

  const safeAge = Number.isFinite(patientAge) ? patientAge : 55;
  const safeGender = patientGender || 'M';
  const safeId = currentPatientId || 'PAC-8104';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPacId.trim() || isSyncingPac) return;
    await onSyncPacient(searchPacId.trim());
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand & Anonimized Patient Status Header */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-xl cursor-pointer shrink-0"
                title="Motor Clínico AMIE (Articulate Medical Intelligence Explorer)"
              >
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-sky-200 to-cyan-300 bg-clip-text text-transparent">
                    AMIE Clinical Engine
                  </span>
                  <span
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    title="DSM-5 Copilot v3.7"
                  >
                    DSM-5 Copilot
                  </span>
                </div>

                {/* DATO ANONIMIZADO OBLIGATORIO: Paciente ID: [searchPacId] | Edad: [age] | Sexo: [sex] */}
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-0.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    Paciente ID: {safeId} | Edad: {safeAge} | Sexo: {safeGender}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:hidden">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono"
                title={`Médico Colegiado: #${colegiadoNumber}`}
              >
                Col: #{colegiadoNumber}
              </span>
            </div>
          </div>

          {/* Dynamic PAC Search Form & Controls */}
          <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
            
            {/* Formulario de Sincronización Dinámica con Cloud Function */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchPacId}
                  onChange={(e) => setSearchPacId(e.target.value)}
                  placeholder="Ej. PAC-001, PAC-8104"
                  className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2 py-1 text-xs text-cyan-300 font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-36 sm:w-44"
                />
              </div>

              <button
                type="submit"
                disabled={isSyncingPac || !searchPacId.trim()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-md shadow-cyan-600/20 active:scale-95 transition"
                title="Hacer petición HTTP POST a la Cloud Function con { patientId: searchPacId }"
              >
                {isSyncingPac ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Sincronizar PAC</span>
                  </>
                )}
              </button>
            </form>

            {/* Collegial Number Badge */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              title={`Credencial médica del facultativo: ${doctorName}`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-sky-300 font-bold">Col #{colegiadoNumber}</span>
            </div>

            {/* Guía de Módulos (Botón de Ayuda) */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
              title="Abrir la Guía Completa de Módulos y Funciones AMIE"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Guía</span>
            </button>

            {/* Principios Morrison */}
            <button
              onClick={onOpenPrinciples}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Ver los 16 principios diagnósticos de James Morrison"
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
              <span>Morrison</span>
            </button>

            {/* Guía DSM-5 */}
            <button
              onClick={onOpenDsmGuide}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Explorar el compendio completo de capítulos DSM-5"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>DSM-5</span>
            </button>

            {/* Ejecutar Análisis AMIE */}
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition ${
                isAnalyzing
                  ? 'bg-sky-700/50 text-sky-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-sky-500/20 active:scale-95'
              }`}
              title="Ejecutar análisis bioclínico multimodal AMIE en 5 bloques"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analizando...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Ejecutar AMIE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Clinical Help Modal */}
      <ClinicalHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  );
};
