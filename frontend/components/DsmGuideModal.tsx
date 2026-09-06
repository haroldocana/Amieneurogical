import React, { useState } from 'react';
import { MORRISON_CLINICAL_PRINCIPLES } from '../constants';
import { BookOpen, X, Stethoscope, Search, ShieldCheck } from 'lucide-react';

interface DsmGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'guide' | 'principles';
}

export const DsmGuideModal: React.FC<DsmGuideModalProps> = ({
  isOpen,
  onClose,
  defaultView = 'principles',
}) => {
  const [view, setView] = useState<'guide' | 'principles'>(defaultView);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredPrinciples = MORRISON_CLINICAL_PRINCIPLES.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.text.toLowerCase().includes(search.toLowerCase()) ||
      p.letter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                Compendio Diagnóstico Clínico (James Morrison - DSM-5®)
              </h2>
              <p className="text-xs text-slate-400">
                Reglas diagnósticas, principios de jerarquía y seguridad para el clínico
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation & Search */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setView('principles')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                view === 'principles' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              16 Principios Diagnósticos
            </button>
            <button
              onClick={() => setView('guide')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                view === 'guide' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Guía de Capítulos DSM-5
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Buscar principio o término..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {view === 'principles' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {filteredPrinciples.map((principle) => (
                <div
                  key={principle.letter}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/40 transition"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center font-mono border border-sky-500/30">
                      {principle.letter}
                    </span>
                    <h3 className="font-bold text-slate-200">{principle.title}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-8">{principle.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="font-bold text-sky-400 text-sm mb-1">Estructura de la Guía Morrison (19 Capítulos)</h3>
                <p className="text-slate-300 leading-relaxed mb-3">
                  La Guía DSM-5 de Morrison unifica capítulos clave y enfatiza prototipos y reglas de seguridad (las "D": Duración, Discapacidad, Diagnóstico diferencial, Datos demográficos).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="font-bold text-cyan-300">Capítulo 1-2: Neurodesarrollo & Psicosis</span>
                    <p className="text-slate-400">TDAH, TEA, Esquizofrenia (F20.9), Catatonia (F06.1), Trastorno Esquizofreniforme (F20.81).</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="font-bold text-cyan-300">Capítulo 3-4: Ánimo & Ansiedad</span>
                    <p className="text-slate-400">TDM (F32/F33), Bipolar I/II (F31), Distimia (F34.1), Pánico (F41.0), Agorafobia (F40.0), TAG (F41.1).</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="font-bold text-cyan-300">Capítulo 5-8: TOC, Trauma & Somáticos</span>
                    <p className="text-slate-400">TOC (F42), TEPT (F43.10), Estrés Agudo (F43.3), Síntomas Somáticos (F45.1), Conversión (F44.4).</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="font-bold text-cyan-300">Capítulo 15-17: Sustancias, Cognitivos & Personalidad</span>
                    <p className="text-slate-400">Intoxicación/Abstinencia F10-F19, Delirium (F05), TNC Mayor/Leve (G30/G31/F02), TLP (F60.3), TPA (F60.2).</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
