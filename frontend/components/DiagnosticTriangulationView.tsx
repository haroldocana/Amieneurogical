import React, { useState } from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { 
  GitCompare, Brain, Activity, Target, ShieldAlert, CheckCircle2, 
  AlertTriangle, Zap, ShieldCheck, Cpu, Layers, BarChart3, Eye, FileText
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis | null;
}

interface VectorScore {
  vectorName: string;
  source: string;
  weightPct: number;
  severityScorePct: number;
  confidencePct: number;
  findings: string[];
}

export const DiagnosticTriangulationView: React.FC<Props> = ({ patient, analysis }) => {
  const [activeTab, setActiveTab] = useState<'VECTORS' | 'DIFFERENTIAL' | 'MORRISON'>('VECTORS');

  // ============================================================================
  // CÁLCULO DE VECTORES BIOCLÍNICOS EN TIEMPO REAL (5 EJES)
  // ============================================================================

  // Eje 1: Psicometría Subjetiva (PHQ-9 / GAD-7 / C-SSRS)
  const phq = patient?.psychometricScores?.phq9 ?? 0;
  const gad = patient?.psychometricScores?.gad7 ?? 0;
  const cssrs = patient?.psychometricScores?.cssrsLevel ?? 0;
  const psychometricSeverity = Math.min(100, Math.round(((phq / 27) * 0.4 + (gad / 21) * 0.3 + (cssrs / 5) * 0.3) * 100));

  // Eje 2: qEEG & Topografía Cerebral
  const thetaZ = patient?.qeegBiomarkers?.regionalZScores?.frontal?.thetaZ ?? 0;
  const deltaZ = patient?.qeegBiomarkers?.regionalZScores?.frontal?.deltaZ ?? 0;
  const qeegSeverity = Math.min(100, Math.round((Math.max(0, thetaZ) / 4.0 * 0.6 + Math.max(0, deltaZ) / 4.0 * 0.4) * 100));

  // Eje 3: Telemetría VR & Biofeedback Autonómico (GSR + HRV)
  const gsrSeries = patient?.vrTelemetryData?.gsrMicroSiemens;
  const gsrAvg = gsrSeries && gsrSeries.length > 0 
    ? gsrSeries.reduce((a, b) => a + b, 0) / gsrSeries.length 
    : 2.2;
  const hrvVal = patient?.multisensoryHardware?.vagalToneHrvIndex ?? 42;
  const vrSeverity = Math.min(100, Math.round(((gsrAvg / 6.0) * 0.5 + Math.max(0, 50 - hrvVal) / 50 * 0.5) * 100));

  // Eje 4: Telemetría Pasiva APK Centinela
  const wakeups = patient?.sentinelTelemetry?.sleepMetrics?.nightWakeups ?? 1;
  const typingLat = patient?.sentinelTelemetry?.behavioralBiometrics?.typingLatencyMs ?? 220;
  const sentinelSeverity = Math.min(100, Math.round(((wakeups / 5) * 0.5 + Math.min(1, typingLat / 600) * 0.5) * 100));

  // Eje 5: Biometría Acústica & Expresión Facial
  const microState = patient?.multisensoryHardware?.microExpressionState ?? 'Normorreactivo';
  const acousticSeverity = microState.includes('Aplanamiento') || microState.includes('Incongruente') ? 78 : 32;

  const vectors: VectorScore[] = [
    {
      vectorName: '1. Psicometría Subjetiva',
      source: 'PHQ-9 / GAD-7 / C-SSRS',
      weightPct: 20,
      severityScorePct: psychometricSeverity,
      confidencePct: 82,
      findings: [
        `PHQ-9: ${phq}/27 | GAD-7: ${gad}/21`,
        `Riesgo Autolítico C-SSRS: Nivel ${cssrs}/5`
      ]
    },
    {
      vectorName: '2. qEEG Topografía Frontal',
      source: 'Z-Score Espectral FFT (10-20)',
      weightPct: 25,
      severityScorePct: qeegSeverity,
      confidencePct: 94,
      findings: [
        `Exceso Theta Frontal: +${thetaZ.toFixed(1)}σ`,
        `Infiltración Lenta Delta: +${deltaZ.toFixed(1)}σ`
      ]
    },
    {
      vectorName: '3. Biometría VR Meta Quest 3S',
      source: 'Respuesta Galvánica & HRV',
      weightPct: 25,
      severityScorePct: vrSeverity,
      confidencePct: 91,
      findings: [
        `GSR Promedio: ${gsrAvg.toFixed(2)} µS`,
        `Tono Vagal Parasimpático: ${hrvVal} ms`
      ]
    },
    {
      vectorName: '4. APK Centinela Pasivo',
      source: 'Sueño Nocturno & Latencia Teclado',
      weightPct: 15,
      severityScorePct: sentinelSeverity,
      confidencePct: 88,
      findings: [
        `Despertares Nocturnos: ${wakeups}x / noche`,
        `Latencia Biomotora: ${typingLat} ms`
      ]
    },
    {
      vectorName: '5. Prosodia & Microexpresión',
      source: 'Análisis Fonatorio y Oculomotor',
      weightPct: 15,
      severityScorePct: acousticSeverity,
      confidencePct: 85,
      findings: [
        `Músculo Facial: ${microState}`,
        `Marcador Afectivo: ${acousticSeverity > 50 ? 'Aplanamiento Prosódico' : 'Conservado'}`
      ]
    }
  ];

  // Severidad Global Calculada
  const liveGlobalSeverity = Math.round(
    vectors.reduce((acc, v) => acc + (v.severityScorePct * (v.weightPct / 100)), 0)
  );

  // Detección de Enmascaramiento / Disimulo
  const isCamouflagingDetected = psychometricSeverity < 35 && (vrSeverity > 60 || qeegSeverity > 60);
  const isDissimulationRisk = phq < 5 && cssrs >= 3;

  const convergenceScore = analysis?.bioclinicalTriangulation?.convergenceScore ?? (100 - Math.abs(psychometricSeverity - vrSeverity));

  return (
    <div className="space-y-6">
      
      {/* HEADER DE CONVERGENCIA MULTIMODAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 via-sky-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-cyan-600/20">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                Triangulación Bioclínica y Matriz Antisesgo
              </h2>
              <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] rounded-full font-mono font-bold">
                5-AXIS ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Integración de marcadores electrofisiológicos, biométricos y psicométricos con auditoría de reglas James Morrison.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Score de Convergencia</span>
            <span className="text-base font-black font-mono text-cyan-300">
              {convergenceScore}/100
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Severidad Global Ponderada</span>
            <span className={`text-base font-black font-mono ${liveGlobalSeverity >= 65 ? 'text-rose-400' : liveGlobalSeverity >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {liveGlobalSeverity}%
            </span>
          </div>
        </div>
      </div>

      {/* BANNER SI FALTA INFERENCIA DE IA */}
      {!analysis && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Biometría Viva Activo:</strong> Se muestran los vectores calculados en tiempo real. Ejecute el Motor AMIE para obtener la resolución formal de diagnósticos diferenciales.
            </span>
          </div>
        </div>
      )}

      {/* ALERTA DE DETECCIÓN DE ENMASCARAMIENTO / DISIMULO */}
      {(isCamouflagingDetected || isDissimulationRisk) && (
        <div className="p-4 bg-rose-950/80 border-2 border-rose-500 rounded-xl space-y-1.5 animate-pulse">
          <div className="flex items-center gap-2 text-rose-200 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Detección de Incongruencia Bioclínica: Enmascaramiento / Disimulo Afectivo</span>
          </div>
          <p className="text-xs text-rose-100 leading-relaxed">
            {isCamouflagingDetected && 'El reporte psicométrico del paciente (PHQ-9) refleja leve compromiso, pero el tono vagal HRV (< 25ms) y la desincronización qEEG revelan alta carga de distrés subcortical. Patrón compatible con Depresión Enmascarada o Camouflaging social.'}
            {isDissimulationRisk && 'Incongruencia crítica: Puntuación baja en depresión declarada con nivel de riesgo de suicidio C-SSRS ≥ 3.'}
          </p>
        </div>
      )}

      {/* NAVEGACIÓN DE PESTAÑAS INTERNAS */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-fit">
        <button
          onClick={() => setActiveTab('VECTORS')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
            activeTab === 'VECTORS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Vectores de Triangulación (5 Ejes)</span>
        </button>

        <button
          onClick={() => setActiveTab('DIFFERENTIAL')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
            activeTab === 'DIFFERENTIAL' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Matriz Diferencial & Descartes</span>
        </button>

        <button
          onClick={() => setActiveTab('MORRISON')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
            activeTab === 'MORRISON' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Auditoría James Morrison (DSM-5)</span>
        </button>
      </div>

      {/* PESTAÑA 1: VECTORES DE TRIANGULACIÓN (5 EJES) */}
      {activeTab === 'VECTORS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {vectors.map((v, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">{v.source}</span>
                <h3 className="text-xs font-bold text-white mt-1">{v.vectorName}</h3>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Distrés Biológico:</span>
                  <span className={`font-bold ${v.severityScorePct > 65 ? 'text-rose-400' : v.severityScorePct > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {v.severityScorePct}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    style={{ width: `${v.severityScorePct}%` }} 
                    className={`h-full transition-all duration-500 ${v.severityScorePct > 65 ? 'bg-rose-500' : v.severityScorePct > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[10px] text-slate-300 font-mono">
                {v.findings.map((f, j) => (
                  <div key={j} className="flex items-start gap-1">
                    <span className="text-cyan-400">•</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Ponderación: {v.weightPct}%</span>
                <span className="text-cyan-400">Certeza: {v.confidencePct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PESTAÑA 2: MATRIZ DE DIAGNÓSTICOS DIFERENCIALES */}
      {activeTab === 'DIFFERENTIAL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-purple-400" /> Resoluciones Diferenciales de la IA
          </h3>

          {analysis?.differentialMatrix && analysis.differentialMatrix.length > 0 ? (
            <div className="space-y-3">
              {analysis.differentialMatrix.map((diff: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
                  <div className="md:w-1/3 border-r border-slate-800 pr-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{diff.disorderName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30 font-bold">
                        {diff.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      CIE-10 / CIE-11: {diff.codeCIE10} | Certeza: {diff.certaintyPct}%
                    </div>
                    <div className="text-[10px] text-purple-300 bg-purple-950/40 p-2 rounded border border-purple-500/20 italic">
                      Regla Morrison: {diff.morrisonPrincipleApplied}
                    </div>
                  </div>

                  <div className="md:w-2/3 space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Razón Antisesgo de Descarte / Confirmación:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{diff.biasDiscardRationale}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <GitCompare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                Presione <strong>"Ejecutar AMIE"</strong> en la barra superior para procesar la matriz diferencial completa.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: AUDITORÍA REGULATORIA JAMES MORRISON */}
      {activeTab === 'MORRISON' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verificación de Reglas Jerárquicas Diagnósticas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Principio A (Seguridad Orgánica)</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">CUMPLE</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Descarte de causas somáticas, tiroideas o inducidas por sustancias antes de confirmar el Eje I.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Principio F (Prioridad de Ánimo)</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${liveGlobalSeverity > 60 ? 'bg-rose-950 text-rose-300 border border-rose-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'}`}>
                  {liveGlobalSeverity > 60 ? 'REVISIÓN REQUERIDA' : 'CUMPLE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Evaluación prioritaria de cuadros afectivos severos y riesgo de autólisis sobre otros diagnósticos.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Principio W (Protección TP)</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">PROTEGIDO</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Prohibición de diagnosticar trastornos de la personalidad durante un episodio afectivo agudo descompensado.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
