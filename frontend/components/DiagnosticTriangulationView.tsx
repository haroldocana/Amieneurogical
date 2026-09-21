import React from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { GitCompare, Brain, Activity, Target, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis | null;
}

export const DiagnosticTriangulationView: React.FC<Props> = ({ patient, analysis }) => {
  if (!analysis) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <GitCompare className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="text-base font-bold text-white mb-2">Esperando Inferencia AMIE</h3>
        <p className="text-xs text-slate-400 max-w-md">
          Ejecuta el Motor Clínico AMIE desde la barra superior para visualizar la matriz de triangulación de biomarcadores y la resolución de diagnósticos diferenciales.
        </p>
      </div>
    );
  }

  const { differentialMatrix, bioclinicalTriangulation } = analysis;

  return (
    <div className="space-y-6">
      {/* Resumen de Triangulación Bioclínica */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          Convergencia Bioclínica Multimodal (Score: {bioclinicalTriangulation?.convergenceScore || 0}/100)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" /> qEEG & Topografía
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bioclinicalTriangulation?.regionalLobeBreakdown?.frontal || 'Lentificación frontal identificada.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Biometría VR
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bioclinicalTriangulation?.vrHabituationAssessment || 'Tono vagal y respuesta galvánica consistentes.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Psicometría
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bioclinicalTriangulation?.psychometricsSummary || 'Puntuaciones en umbral clínico.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-sky-400" /> Funcionalidad
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bioclinicalTriangulation?.functionalAreasAssessment || 'Colapso en áreas primarias.'}
            </p>
          </div>
        </div>
      </div>

      {/* Matriz de Diagnósticos Diferenciales Descartados */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-purple-400" />
          Matriz de Diagnósticos Diferenciales y Antisesgo
        </h2>

        <div className="space-y-4">
          {differentialMatrix?.map((diff: any, idx: number) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
              <div className="md:w-1/3 border-r border-slate-800 pr-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{diff.disorderName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">
                    {diff.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mb-2">
                  CIE-10: {diff.codeCIE10} | Certeza: {diff.certaintyPct}%
                </div>
                <div className="text-[11px] text-purple-300 bg-purple-950/30 p-2 rounded border border-purple-500/20 italic">
                  Regla de Morrison: {diff.morrisonPrincipleApplied}
                </div>
              </div>
              
              <div className="md:w-2/3 flex flex-col justify-center space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Razón de Descarte (Antisesgo):</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{diff.biasDiscardRationale}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-slate-500" /> {diff.qeegProfile?.thetaBetaRatioEvaluation || 'qEEG no concluyente'}
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-slate-500" /> {diff.psychometricsProfile?.scaleMatched || 'Escalas'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {(!differentialMatrix || differentialMatrix.length === 0) && (
            <div className="text-center text-xs text-slate-500 italic py-4">
              El motor no arrojó matriz de diagnósticos diferenciales.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
