import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { CLINICAL_CASE_PRESETS } from '../constants';
import { FileCode, FileText, Sparkles, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';

interface PatientJsonEditorProps {
  patient: PatientRecord;
  onChange: (updated: PatientRecord) => void;
  onSelectPreset: (presetRecord: PatientRecord) => void;
}

export const PatientJsonEditor: React.FC<PatientJsonEditorProps> = ({
  patient,
  onChange,
  onSelectPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [jsonString, setJsonString] = useState<string>(JSON.stringify(patient, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonString(text);
    try {
      const parsed = JSON.parse(text) as PatientRecord;
      setJsonError(null);
      onChange(parsed);
    } catch (err: any) {
      setJsonError(err.message || 'JSON inválido');
    }
  };

  const handlePresetClick = (idx: number) => {
    const selected = CLINICAL_CASE_PRESETS[idx].record;
    onChange(selected);
    setJsonString(JSON.stringify(selected, null, 2));
    setJsonError(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Top bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4" /> Expediente Clínico Digital
            </h2>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              ID: {patient.id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Datos estructurados para triangulación bioclínica y psicométrica
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('form');
              setJsonString(JSON.stringify(patient, null, 2));
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'form' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Formulario
          </button>
          <button
            onClick={() => {
              setActiveTab('json');
              setJsonString(JSON.stringify(patient, null, 2));
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'json' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Editor JSON
          </button>
        </div>
      </div>

      {/* Case Presets Selector */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
        <label className="text-[11px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Casos Clínicos Prototípicos (DSM-5):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {CLINICAL_CASE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(idx)}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-slate-800 hover:border-sky-500/50 border border-slate-700/60 text-xs transition group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-sky-300 truncate">
                {p.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[580px]">
        {activeTab === 'json' ? (
          <div className="h-full flex flex-col">
            {jsonError && (
              <div className="mb-2 p-2 bg-red-950/50 border border-red-500/40 rounded text-red-300 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Error sintáctico: {jsonError}</span>
              </div>
            )}
            <textarea
              value={jsonString}
              onChange={handleJsonTextChange}
              rows={22}
              className="w-full h-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500 leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* General Data */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Paciente (Anonimizado)</label>
                <input
                  type="text"
                  value={patient.patientNameAnonymized}
                  onChange={(e) =>
                    onChange({ ...patient, patientNameAnonymized: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Edad</label>
                <input
                  type="number"
                  value={patient.age}
                  onChange={(e) =>
                    onChange({ ...patient, age: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Género</label>
                <select
                  value={patient.gender}
                  onChange={(e) =>
                    onChange({ ...patient, gender: e.target.value as any })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                  <option value="Other">Otro / No binario</option>
                </select>
              </div>
            </div>

            {/* Motivo & Anamnesis */}
            <div>
              <label className="block text-slate-400 mb-1">Motivo de Consulta Cardinal</label>
              <input
                type="text"
                value={patient.consultationReason}
                onChange={(e) =>
                  onChange({ ...patient, consultationReason: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Anamnesis & Evolución Longitudinal</label>
              <textarea
                rows={3}
                value={patient.anamnesis}
                onChange={(e) => onChange({ ...patient, anamnesis: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Psychometrics Grid */}
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <h3 className="font-semibold text-slate-300 text-xs mb-2 flex items-center justify-between">
                <span>Escalas Psicométricas Estandarizadas</span>
                <span className="text-[10px] text-sky-400 font-normal">DSM-5 / OMS</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-400">PHQ-9 (Depresión 0-27)</span>
                  <input
                    type="number"
                    value={patient.psychometricScores.phq9 ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...patient,
                        psychometricScores: {
                          ...patient.psychometricScores,
                          phq9: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-sky-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">GAD-7 (Ansiedad 0-21)</span>
                  <input
                    type="number"
                    value={patient.psychometricScores.gad7 ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...patient,
                        psychometricScores: {
                          ...patient.psychometricScores,
                          gad7: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-sky-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">SAD PERSONS (0-10)</span>
                  <input
                    type="number"
                    value={patient.psychometricScores.sadPersons ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...patient,
                        psychometricScores: {
                          ...patient.psychometricScores,
                          sadPersons: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-red-300 font-bold focus:border-red-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">MMSE Cognición (0-30)</span>
                  <input
                    type="number"
                    value={patient.psychometricScores.mmse ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...patient,
                        psychometricScores: {
                          ...patient.psychometricScores,
                          mmse: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Hardware Biomarkers */}
            {patient.neuromotorBiomarkers && (
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <h3 className="font-semibold text-slate-300 text-xs mb-2 flex items-center justify-between">
                  <span>Biomarcadores de Hardware (Test Neuromotor USB & QEEG)</span>
                  <span className="text-[10px] text-cyan-400 font-normal">Milisegundos & Z-Scores</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <span className="text-[11px] text-slate-400">Latencia TR (ms)</span>
                    <input
                      type="number"
                      value={patient.neuromotorBiomarkers.reactionTimeMs}
                      onChange={(e) =>
                        onChange({
                          ...patient,
                          neuromotorBiomarkers: {
                            ...patient.neuromotorBiomarkers!,
                            reactionTimeMs: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Errores Omisión</span>
                    <input
                      type="number"
                      value={patient.neuromotorBiomarkers.omissionErrors}
                      onChange={(e) =>
                        onChange({
                          ...patient,
                          neuromotorBiomarkers: {
                            ...patient.neuromotorBiomarkers!,
                            omissionErrors: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Falsas Alarmas (Comisión)</span>
                    <input
                      type="number"
                      value={patient.neuromotorBiomarkers.commissionErrors}
                      onChange={(e) =>
                        onChange({
                          ...patient,
                          neuromotorBiomarkers: {
                            ...patient.neuromotorBiomarkers!,
                            commissionErrors: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">QEEG Theta/Beta (Z)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={patient.qeegZScores?.frontalThetaBetaRatio ?? 0}
                      onChange={(e) =>
                        onChange({
                          ...patient,
                          qeegZScores: {
                            ...patient.qeegZScores!,
                            frontalThetaBetaRatio: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-purple-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
