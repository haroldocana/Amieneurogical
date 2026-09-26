import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { 
  getTheoreticalInterpretation, 
  calculateRCI, 
  calculateDyadicSynchrony,
  TheoreticalInterpretation 
} from '../utils/apaEngine';
import { 
  BookOpen, 
  GitMerge, 
  TrendingUp, 
  Users, 
  Download, 
  Award, 
  CheckCircle2, 
  Zap
} from 'lucide-react';

interface ApaTherapeuticModuleProps {
  patient: PatientRecord;
}

export const ApaTherapeuticModule: React.FC<ApaTherapeuticModuleProps> = ({ patient }) => {
  const [selectedCurrent, setSelectedCurrent] = useState<'tcc' | 'psychodynamic' | 'humanist' | 'systemic' | 'neuropsych'>('tcc');
  const [preScore, setPreScore] = useState<number>(patient.psychometricScores?.phq9 || 16);
  const [postScore, setPostScore] = useState<number>(8);

  const interpretation: TheoreticalInterpretation = getTheoreticalInterpretation(patient, selectedCurrent);
  const rci = calculateRCI(preScore, postScore);
  const synchrony = calculateDyadicSynchrony([1.2, 1.5, 2.1, 1.8], [1.1, 1.4, 2.0, 1.9]);

  const handleExportApaCase = () => {
    const reportContent = `
===================================================================
REPORTE DE CASO CLÍNICO ESTÁNDAR APA (N=1) - AMIE NEUROLOGICAL
===================================================================
ID PACIENTE: ${patient.id || 'PAC-8104'}
EDAD: ${patient.age || 55} | GÉNERO: ${patient.gender || 'M'}
MARCO TEÓRICO SELECCIONADO: ${interpretation.currentName}

--- TRIANGULACIÓN BIOMÉTRICA DE BASE ---
Motivo de Consulta: ${patient.consultationReason || 'Evaluación General'}
Correlato Biométrico: ${interpretation.biometricCorrelate}

--- FORMULACIÓN CLÍNICA (${interpretation.currentName}) ---
Hipótesis: ${interpretation.clinicalHypothesis}
Técnica Recomendada: ${interpretation.recommendedTechnique}

--- ANÁLISIS DE EFECTIVIDAD CIENTÍFICA (RCI JACOBSON & TRUAX) ---
Puntuación Pre-Tratamiento: ${rci.preScore}
Puntuación Post-Tratamiento: ${rci.postScore}
Valor RCI: ${rci.rciValue}
Estatus Clínico: ${rci.clinicalStatus} (Estadísticamente Significativo: ${rci.isStatisticallySignificant ? 'SÍ' : 'NO'})

--- ALIANZA TERAPÉUTICA (SINCRONÍA DÍADICA) ---
Porcentaje de Acoplamiento Fisiológico: ${synchrony.couplingPercentage}%
Nivel de Co-regulación: ${synchrony.allianceLevel}
===================================================================
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Caso_Clinico_APA_${patient.id || 'PAC-8104'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-2xl">
      
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Traducción por Corrientes Clínicas & Validación Científica APA
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Integración epistemológica de biometría objetiva para investigación, ateneos y práctica asistencial.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportApaCase}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Caso APA (N=1)</span>
        </button>
      </div>

      {/* Selector de Corriente Teórica */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <GitMerge className="w-4 h-4 text-sky-400" />
          Selecciona el Marco Teórico de Trabajo:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'tcc', name: 'Cognitivo-Conductual / ACT' },
            { id: 'psychodynamic', name: 'Psicodinámica' },
            { id: 'humanist', name: 'Humanista / Gestalt' },
            { id: 'systemic', name: 'Sistémica / Relacional' },
            { id: 'neuropsych', name: 'Neuropsicología' }
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCurrent(c.id as any)}
              className={`p-2.5 rounded-xl text-xs font-bold transition text-center border cursor-pointer ${
                selectedCurrent === c.id
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Ficha de Interpretación Epistemológica */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wide">
            {interpretation.currentName}
          </h3>
          <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800/60 px-2 py-0.5 rounded font-mono">
            Interpretación Biométrica Activa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Conceptos Clave</span>
            <div className="flex flex-wrap gap-1">
              {interpretation.keyConcepts.map((kc, idx) => (
                <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded">
                  {kc}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Hipótesis Clínica</span>
            <p className="text-slate-200 text-[11px] leading-relaxed">{interpretation.clinicalHypothesis}</p>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Técnica Recomendada</span>
            <p className="text-emerald-300 font-semibold text-[11px] leading-relaxed">{interpretation.recommendedTechnique}</p>
          </div>
        </div>
      </div>

      {/* Grid de Validación Científica: RCI + Sincronía Díadica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Calculadora RCI de Jacobson & Truax */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Índice de Cambio Confiable (RCI - Jacobson & Truax)
            </h4>
            <span className="text-[10px] text-amber-400 font-mono">$p &lt; 0.05$</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Puntuación Pre-Tratamiento</label>
              <input
                type="number"
                value={preScore}
                onChange={(e) => setPreScore(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Puntuación Post-Tratamiento</label>
              <input
                type="number"
                value={postScore}
                onChange={(e) => setPostScore(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Valor RCI Calculado</span>
              <span className="text-base font-bold font-mono text-amber-400">{rci.rciValue}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Estatus de Efectividad</span>
              <span className={`text-xs font-bold ${rci.isStatisticallySignificant ? 'text-emerald-400' : 'text-slate-400'}`}>
                {rci.clinicalStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Co-regulación y Sincronía Fisiológica Díadica */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              Sincronía Fisiológica Díadica (Alianza Terapéutica)
            </h4>
            <span className="text-[10px] text-purple-300 font-mono">HRV Coupling</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Acoplamiento Autonómico Terapeuta-Paciente:</span>
              <span className="font-bold text-purple-300 font-mono">{synchrony.couplingPercentage}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-600 to-indigo-400 h-full transition-all duration-500" 
                style={{ width: `${synchrony.couplingPercentage}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">Nivel de Co-regulación:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {synchrony.allianceLevel}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
