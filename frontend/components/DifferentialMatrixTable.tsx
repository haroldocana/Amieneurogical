import React, { useState } from 'react';
import { DifferentialDisorderComparison } from '../types';
import { GitCompare, CheckCircle2, XCircle, AlertCircle, HelpCircle, Activity, Brain, Smartphone, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface DifferentialMatrixTableProps {
  matrix: DifferentialDisorderComparison[];
}

export const DifferentialMatrixTable: React.FC<DifferentialMatrixTableProps> = ({ matrix }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!matrix || matrix.length === 0) {
    return (
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400">
        Matriz de descarte de sesgos en generación...
      </div>
    );
  }

  const getStatusBadge = (status: DifferentialDisorderComparison['status']) => {
    switch (status) {
      case 'Confirmado Principal':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Confirmado
          </span>
        );
      case 'Descartado':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-slate-400" /> Descartado
          </span>
        );
      case 'Comórbido':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-400" /> Comórbido
          </span>
        );
      case 'Posible / A Investigar':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-400" /> A Investigar
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Matriz de Diagnósticos Diferenciales & Descarte de Sesgos (7 Trastornos)
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
              <th className="p-3">Estado & Certeza</th>
              <th className="p-3 hidden md:table-cell">Perfil qEEG (θ/β, High-β, α)</th>
              <th className="p-3 hidden sm:table-cell">Psicometría (DSM-5)</th>
              <th className="p-3 hidden lg:table-cell">APK Centinela</th>
              <th className="p-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {matrix.map((row, idx) => {
              const isExpanded = expandedRow === row.disorderKey || expandedRow === String(idx);
              const isMain = row.status === 'Confirmado Principal';

              return (
                <React.Fragment key={row.disorderKey || idx}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : row.disorderKey || String(idx))}
                    className={`cursor-pointer transition hover:bg-slate-800/40 ${
                      isMain ? 'bg-sky-950/20' : ''
                    }`}
                  >
                    <td className="p-3 font-medium text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">{row.disorderName}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1 rounded border border-slate-800">
                          {row.codeCIE10}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                        Regla: {row.morrisonPrincipleApplied}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(row.status)}
                        <span className="text-[11px] font-mono font-bold text-slate-300">
                          {row.certaintyPct}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3 hidden md:table-cell text-slate-300 text-[11px]">
                      <div className="truncate max-w-xs">{row.qeegProfile.thetaBetaRatioEvaluation}</div>
                    </td>

                    <td className="p-3 hidden sm:table-cell text-slate-300 text-[11px]">
                      <div className="font-semibold text-sky-300 truncate max-w-xs">{row.psychometricsProfile.scaleMatched}</div>
                      <div className="text-slate-400 truncate max-w-xs">{row.psychometricsProfile.scoreSummary}</div>
                    </td>

                    <td className="p-3 hidden lg:table-cell text-slate-400 text-[11px]">
                      <div className="truncate max-w-xs">{row.apkPassiveMarker}</div>
                    </td>

                    <td className="p-3 text-right">
                      <button className="p-1 rounded text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row Detail */}
                  {isExpanded && (
                    <tr className="bg-slate-950/90">
                      <td colSpan={6} className="p-4 space-y-3 text-xs border-b border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="font-bold text-sky-400 mb-1 flex items-center gap-1">
                              <Brain className="w-3.5 h-3.5" /> Detalle qEEG & Electrofisiología:
                            </div>
                            <ul className="text-slate-300 space-y-1 text-[11px]">
                              <li>• Ratio Theta/Beta: {row.qeegProfile.thetaBetaRatioEvaluation}</li>
                              <li>• High-Beta: {row.qeegProfile.highBetaEvaluation}</li>
                              <li>• Asimetría Alfa: {row.qeegProfile.alphaAsymmetryEvaluation}</li>
                              <li>• Coherencia: {row.qeegProfile.coherenceEvaluation}</li>
                            </ul>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" /> Psicometría & Carga DSM-5:
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              <strong>{row.psychometricsProfile.scaleMatched}:</strong> {row.psychometricsProfile.scoreSummary}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5" /> Medición Pasiva APK Centinela:
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {row.apkPassiveMarker}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-900/60 border border-cyan-500/30 text-slate-200">
                          <strong className="text-cyan-300 font-semibold">Fundamento del Descarte / Confirmación de Sesgo: </strong>
                          <span>{row.biasDiscardRationale}</span>
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
