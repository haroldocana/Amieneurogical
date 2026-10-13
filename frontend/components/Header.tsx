import React, { useState, useEffect } from 'react';
import { ClinicalHelpModal } from './ClinicalHelpModal';
import {
  Activity,
  Stethoscope,
  BookOpen,
  BrainCircuit,
  RefreshCw,
  UserCheck,
  HelpCircle,
  Search,
  DownloadCloud,
  User,
  LogOut,
  Glasses
} from 'lucide-react';

interface HeaderProps {
  onOpenDsmGuide: () => void;
  onOpenPrinciples: () => void;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  doctorName?: string;
  colegiadoNumber?: number | string;
  currentPatientId?: string;
  patientAge?: number;
  patientGender?: 'M' | 'F' | 'Other';
  onSyncPacient: (pacId: string) => Promise<void> | void;
  isSyncingPac?: boolean;
  onLogout?: () => void;
  onOpenVrModule?: () => void;
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
  onLogout,
  onOpenVrModule,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [searchPacId, setSearchPacId] = useState<string>(currentPatientId || 'PAC-8104');

  // Resincroniza el campo de búsqueda cuando el paciente activo cambia externamente
  useEffect(() => {
    if (currentPatientId) {
      setSearchPacId(currentPatientId);
    }
  }, [currentPatientId]);

  const safeAge = Number.isFinite(patientAge) ? patientAge : 55;
  const safeGender = patientGender === 'M' ? 'M' : patientGender === 'F' ? 'F' : 'Otro';
  const safeId = currentPatientId || 'PAC-8104';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchPacId.trim();
    if (!cleanId || isSyncingPac) return;
    try {
      await onSyncPacient(cleanId);
    } catch (err) {
      console.warn('[AMIE Header] Error al sincronizar paciente:', err);
    }
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-2.5 shadow-xl text-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Marca & Identificador de Paciente Anonimizado */}
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
                    title="DSM-5-TR Copilot v3.8"
                  >
                    DSM-5 Copilot v3.8
                  </span>
                </div>

                {/* Dato Anonimizado de Paciente */}
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-0.5">
                  <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold truncate max-w-[280px] sm:max-w-none">
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

          {/* Buscador PAC & Barra de Controles Médicos */}
          <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
            
            {/* Formulario de Sincronización de Expediente PAC */}
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
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-md shadow-cyan-600/20 active:scale-95 transition cursor-pointer"
                title="Sincronizar expediente del paciente desde MongoDB Atlas"
              >
                {isSyncingPac ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Sincronizar PAC</span>
                  </>
                )}
              </button>
            </form>

            {/* Colegiado Médico */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              title={`Credencial médica del facultativo: ${doctorName}`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-sky-300 font-bold">Col #{colegiadoNumber}</span>
            </div>

            {/* Guía Interactiva y Ayuda */}
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer active:scale-95"
              title="Abrir Guía Completa de Módulos AMIE"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Guía</span>
            </button>

            {/* Principios Morrison */}
            <button
              type="button"
              onClick={onOpenPrinciples}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer active:scale-95"
              title="Ver los 16 principios diagnósticos de James Morrison"
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
              <span>Morrison</span>
            </button>

            {/* Guía DSM-5 */}
            <button
              type="button"
              onClick={onOpenDsmGuide}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer active:scale-95"
              title="Explorar el compendio de capítulos DSM-5-TR"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>DSM-5</span>
            </button>

            {/* Lanzar Consola VR Pico 3 */}
            {onOpenVrModule && (
              <button
                type="button"
                onClick={onOpenVrModule}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-md shadow-purple-600/20 active:scale-95 transition cursor-pointer"
                title="Lanzar Consola VR Inmersiva (Visor Pico 3 Pro)"
              >
                <Glasses className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lanzar VR</span>
              </button>
            )}

            {/* Ejecutar Análisis Multimodal AMIE */}
            <button
              type="button"
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition ${
                isAnalyzing
                  ? 'bg-sky-700/50 text-sky-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-sky-500/20 active:scale-95 cursor-pointer'
              }`}
              title="Ejecutar análisis bioclínico multimodal AMIE"
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

            {/* Cierre de Sesión Médica */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition cursor-pointer active:scale-95"
                title="Cerrar Sesión Activa"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Documentación y Ayuda Médica */}
      <ClinicalHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  );
};

export default Header;
