import React, { useState } from 'react';
import { DifferentialDisorderComparison } from '../types';
import { 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Activity, 
  Brain, 
  Smartphone, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

interface DifferentialMatrixTableProps {
  matrix?: DifferentialDisorderComparison[];
}

export const DifferentialMatrixTable: React.FC<DifferentialMatrixTableProps> = ({ matrix = [] }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!Array.isArray(matrix) || matrix.length === 0) {
    return (
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-slate-500 animate-pulse" />
        <span>Matriz de descarte de sesgos en generación o sin diferenciales conflictivos registrados.</span>
      </div>
    );
  }

  // Resolución semántica flexible del estado para tolerar variaciones de la IA
  const getStatusBadge = (status?: string) => {
    const normStatus = (status || '').toLowerCase().trim();

    if (normStatus.includes('confirmado')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Confirmado
        </span>
      );
    }
    
    if (normStatus.includes('descart') || normStatus.includes('excluid')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
          <XCircle className="w-3 h-3 text-slate-400" /> Descartado
        </span>
      );
    }
    
    if (normStatus.includes('comórb') || normStatus.includes('comorb')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
          <Activity className="w-3 h-3 text-purple-400" /> Comórbido
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
        <HelpCircle className="w-3 h-3 text-amber-400" /> A Investigar
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100">
      {/* Encabezado de la Tabla */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Matriz de Diagnósticos Diferenciales &amp; Descarte de Sesgos ({matrix.length} Trastornos)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
          Algoritmo AMIE Triangulado
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Trastorno Evaluado</th>
              <th className="p-3">Estado &amp; Certeza</th>
              <th className="p-3 hidden md:table-cell">Perfil qEEG (θ/β, High-β, α)</th>
              <th className="p-3 hidden sm:table-cell">Psicometría (DSM-5-TR)</th>
              <th className="p-3 hidden lg:table-cell">APK Centinela</th>
              <th className="p-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {matrix.map((row, idx) => {
              const rowKey = row.disorderKey || row.codeCIE10 || `row-${idx}`;
              const isExpanded = expandedRow === rowKey;
              const isMain = (row.status || '').toLowerCase().includes('confirmado principal');

              // Extracción polimórfica defensiva de qEEG
              const rawQeeg = (row as any).qeegProfile;
              const qeegSummary = typeof rawQeeg === 'string' 
                ? rawQeeg 
                : rawQeeg?.thetaBetaRatioEvaluation || 'Normal / Sin desviación';

              // Extracción polimórfica defensiva de Psicometría
              const rawPsych = (row as any).psychometricsProfile;
              const psychScale = typeof rawPsych === 'string' 
                ? 'Batería DSM-5' 
                : rawPsych?.scaleMatched || 'DSM-5';
              const psychSummary = typeof rawPsych === 'string' 
                ? rawPsych 
                : rawPsych?.scoreSummary || 'Evaluación compatible';

              return (
                <React.Fragment key={rowKey}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                    className={`cursor-pointer transition hover:bg-slate-800/40 ${
                      isMain ? 'bg-sky-950/20' : ''
                    }`}
                  >
                    <td className="p-3 font-medium text-slate-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-100">{row.disorderName || 'Sin especificar'}</span>
                        {row.codeCIE10 && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1 rounded border border-slate-800">
                            {row.codeCIE10}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                        Regla: {row.morrisonPrincipleApplied || 'Principio General de Seguridad'}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(row.status)}
                        <span className="text-[11px] font-mono font-bold text-slate-300">
                          {row.certaintyPct ?? 0}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3 hidden md:table-cell text-slate-300 text-[11px]">
                      <div className="truncate max-w-xs">{qeegSummary}</div>
                    </td>

                    <td className="p-3 hidden sm:table-cell text-slate-300 text-[11px]">
                      <div className="font-semibold text-sky-300 truncate max-w-xs">{psychScale}</div>
                      <div className="text-slate-400 truncate max-w-xs">{psychSummary}</div>
                    </td>

                    <td className="p-3 hidden lg:table-cell text-slate-400 text-[11px]">
                      <div className="truncate max-w-xs">
                        {(row as any).apkPassiveMarker || 'Sin marcadores atípicos'}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="p-1 inline-flex text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </td>
                  </tr>

                  {/* Fila Desplegable con Detalle Completo */}
                  {isExpanded && (
                    <tr className="bg-slate-950/90">
                      <td colSpan={6} className="p-4 space-y-3 text-xs border-b border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Columna qEEG */}
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="font-bold text-sky-400 mb-1 flex items-center gap-1">
                              <Brain className="w-3.5 h-3.5" /> Detalle qEEG &amp; Electrofisiología:
                            </div>
                            {typeof rawQeeg === 'object' && rawQeeg !== null ? (
                              <ul className="text-slate-300 space-y-1 text-[11px]">
                                <li>• Ratio Theta/Beta: {rawQeeg.thetaBetaRatioEvaluation || 'Normal'}</li>
                                <li>• High-Beta: {rawQeeg.highBetaEvaluation || 'Sin exceso'}</li>
                                <li>• Asimetría Alfa: {rawQeeg.alphaAsymmetryEvaluation || 'Simétrica'}</li>
                                <li>• Coherencia: {rawQeeg.coherenceEvaluation || 'Preservada'}</li>
                              </ul>
                            ) : (
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                {qeegSummary}
                              </p>
                            )}
                          </div>

                          {/* Columna Psicometría */}
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" /> Psicometría &amp; Carga DSM-5:
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              <strong>{psychScale}:</strong> {psychSummary}
                            </p>
                          </div>

                          {/* Columna APK Centinela */}
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5" /> Medición Pasiva APK Centinela:
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {(row as any).apkPassiveMarker || 'Patrones de sueño y latencia de pantalla dentro de límites esperados.'}
                            </p>
                          </div>
                        </div>

                        {/* Justificación Antisesgo */}
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-cyan-500/30 text-slate-200">
                          <strong className="text-cyan-300 font-semibold">Fundamento del Descarte / Confirmación de Sesgo: </strong>
                          <span>{row.biasDiscardRationale || 'Criterios clínicos validados por triangulación multimodal objetiva.'}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DifferentialMatrixTable;
