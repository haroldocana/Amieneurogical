import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord } from '../types';
import { CLINICAL_CASE_PRESETS } from '../constants';
import { 
  FileCode, 
  Sparkles, 
  AlertTriangle, 
  Glasses, 
  Mic, 
  Copy, 
  Check, 
  RotateCcw,
  Activity,
  Heart,
  Moon
} from 'lucide-react';

interface PatientJsonEditorProps {
  patient?: PatientRecord;
  onChange: (updated: PatientRecord) => void;
  onSelectPreset: (presetRecord: PatientRecord) => void;
}

export const PatientJsonEditor: React.FC<PatientJsonEditorProps> = ({
  patient,
  onChange,
  onSelectPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [jsonString, setJsonString] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Bandera para evitar que la escritura en el textarea sea sobrescrita por el useEffect
  const isInternalJsonEditRef = useRef<boolean>(false);

  useEffect(() => {
    if (isInternalJsonEditRef.current) {
      isInternalJsonEditRef.current = false;
      return;
    }
    setJsonString(JSON.stringify(patient || {}, null, 2));
    setJsonError(null);
  }, [patient]);

  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonString(text);

    try {
      const parsed = JSON.parse(text) as PatientRecord;
      setJsonError(null);
      isInternalJsonEditRef.current = true;
      onChange(parsed);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setJsonError(err.message);
      } else {
        setJsonError('Sintaxis JSON inválida');
      }
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback silencioso si el portapapeles está bloqueado
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setJsonError(null);
    } catch (err: unknown) {
      if (err instanceof Error) setJsonError(err.message);
    }
  };

  const handlePresetClick = (idx: number) => {
    const presetItem = CLINICAL_CASE_PRESETS[idx] as any;
    const selected = (presetItem?.record || presetItem?.patient || presetItem) as PatientRecord;
    
    if (selected) {
      isInternalJsonEditRef.current = false;
      onSelectPreset(selected);
      onChange(selected);
      setJsonString(JSON.stringify(selected, null, 2));
      setJsonError(null);
    }
  };

  const p = patient as any;

  const safePatient: PatientRecord = patient || {
    id: 'PAC-8104',
    patientNameAnonymized: 'Paciente Anonimizado',
    age: 55,
    gender: 'M',
    consultationReason: '',
    anamnesis: '',
    psychometricScores: {
      phq9: 0,
      gad7: 0,
      sadPersons: 0,
      mmse: 30
    },
    neuromotorBiomarkers: {
      reactionTimeMs: 240,
      omissionErrors: 0,
      commissionErrors: 0,
      motorStabilityScore: 85
    }
  } as any;

  const patientId = safePatient.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = safePatient.patientNameAnonymized || (safePatient as any).name || 'Paciente Anonimizado';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full text-slate-100 font-sans">
      
      {/* Cabecera Superior */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4" /> Expediente Clínico Digital Multimodal
            </h2>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono font-bold">
              ID: {patientId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Datos estructurados con triangulación bioclínica, telemetría y VR integrada.
          </p>
        </div>

        {/* Conmutador de Vistas */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('form');
              setJsonString(JSON.stringify(safePatient, null, 2));
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === 'form' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Formulario Clínico
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('json');
              setJsonString(JSON.stringify(safePatient, null, 2));
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === 'json' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Editor JSON Raw
          </button>
        </div>
      </div>

      {/* Selector de Presets de Casos Clínicos Prototípicos */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
        <label className="text-[11px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Casos Clínicos Prototípicos (DSM-5-TR):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {CLINICAL_CASE_PRESETS.map((presetItem: any, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(idx)}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-slate-800 hover:border-sky-500/50 border border-slate-700/60 text-xs transition group cursor-pointer"
            >
              <div className="font-semibold text-slate-200 group-hover:text-sky-300 truncate">
                {presetItem.name || presetItem.title}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {presetItem.description || presetItem.summary}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área de Contenido */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
        {activeTab === 'json' ? (
          <div className="h-full flex flex-col space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Edición directa de payload clínico en tiempo real:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-3 h-3" /> Formatear
                </button>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer border border-slate-700"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {jsonError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Error de sintaxis: {jsonError}</span>
              </div>
            )}

            <textarea
              value={jsonString}
              onChange={handleJsonTextChange}
              rows={22}
              className="w-full flex-1 min-h-[380px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500 leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Datos Generales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Paciente (Anonimizado)</label>
                <input
                  type="text"
                  value={patientDisplayName}
                  onChange={(e) =>
                    onChange({ ...safePatient, patientNameAnonymized: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Edad</label>
                <input
                  type="number"
                  value={safePatient.age ?? ''}
                  onChange={(e) =>
                    onChange({ 
                      ...safePatient, 
                      age: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0 
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Género</label>
                <select
                  value={safePatient.gender || 'M'}
                  onChange={(e) =>
                    onChange({ ...safePatient, gender: e.target.value as 'M' | 'F' | 'Other' })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                  <option value="Other">Otro / No binario</option>
                </select>
              </div>
            </div>

            {/* Motivo & Anamnesis */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Motivo de Consulta Cardinal</label>
              <input
                type="text"
                value={safePatient.consultationReason || ''}
                onChange={(e) =>
                  onChange({ ...safePatient, consultationReason: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Anamnesis &amp; Evolución Longitudinal</label>
              <textarea
                rows={3}
                value={safePatient.anamnesis || ''}
                onChange={(e) => onChange({ ...safePatient, anamnesis: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Escalas Psicométricas */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <h3 className="font-semibold text-slate-300 text-xs mb-2.5 flex items-center justify-between">
                <span>Escalas Psicométricas Estandarizadas</span>
                <span className="text-[10px] text-sky-400 font-mono">DSM-5-TR / OMS</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">PHQ-9 (Depresión)</span>
                  <input
                    type="number"
                    value={safePatient.psychometricScores?.phq9 ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        psychometricScores: {
                          ...safePatient.psychometricScores,
                          phq9: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">GAD-7 (Ansiedad)</span>
                  <input
                    type="number"
                    value={safePatient.psychometricScores?.gad7 ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        psychometricScores: {
                          ...safePatient.psychometricScores,
                          gad7: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">SAD PERSONS (Autólisis)</span>
                  <input
                    type="number"
                    value={safePatient.psychometricScores?.sadPersons ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        psychometricScores: {
                          ...safePatient.psychometricScores,
                          sadPersons: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-rose-300 font-bold focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">MMSE Cognición</span>
                  <input
                    type="number"
                    value={safePatient.psychometricScores?.mmse ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        psychometricScores: {
                          ...safePatient.psychometricScores,
                          mmse: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Biomarcadores de Hardware y qEEG */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <h3 className="font-semibold text-slate-300 text-xs mb-2.5 flex items-center justify-between">
                <span>Biomarcadores de Hardware (Neuromotor &amp; QEEG)</span>
                <span className="text-[10px] text-cyan-400 font-mono">Milisegundos &amp; Z-Scores</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Latencia TR (ms)</span>
                  <input
                    type="number"
                    value={safePatient.neuromotorBiomarkers?.reactionTimeMs ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        neuromotorBiomarkers: {
                          ...(safePatient.neuromotorBiomarkers || {
                            reactionTimeMs: 240,
                            omissionErrors: 0,
                            commissionErrors: 0,
                            motorStabilityScore: 85
                          }),
                          reactionTimeMs: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-cyan-300 focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Errores Omisión</span>
                  <input
                    type="number"
                    value={safePatient.neuromotorBiomarkers?.omissionErrors ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        neuromotorBiomarkers: {
                          ...(safePatient.neuromotorBiomarkers || {
                            reactionTimeMs: 240,
                            omissionErrors: 0,
                            commissionErrors: 0,
                            motorStabilityScore: 85
                          }),
                          omissionErrors: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Comisión (Falsas Alarmas)</span>
                  <input
                    type="number"
                    value={safePatient.neuromotorBiomarkers?.commissionErrors ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        neuromotorBiomarkers: {
                          ...(safePatient.neuromotorBiomarkers || {
                            reactionTimeMs: 240,
                            omissionErrors: 0,
                            commissionErrors: 0,
                            motorStabilityScore: 85
                          }),
                          commissionErrors: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">QEEG Theta/Beta (Z)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={safePatient.qeegZScores?.frontalThetaBetaRatio ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        qeegZScores: {
                          ...(safePatient.qeegZScores || {
                            frontalThetaBetaRatio: 1.8,
                            temporalAsymmetry: 0.2,
                            deltaSlowActivityZ: 0.4,
                            alphaPeakFrequencyHz: 10.2
                          }),
                          frontalThetaBetaRatio: e.target.value === '' ? (undefined as any) : parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-purple-300 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Telemetría Multimodal (VR Pico 3, Vagal HRV & Centinela) */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <h3 className="font-semibold text-slate-300 text-xs mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Glasses className="w-4 h-4 text-indigo-400" /> VR Pico 3 Pro &amp; <Mic className="w-4 h-4 text-emerald-400" /> Biometría Acústica
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">Telemetría SaMD</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Escenario VR Activo</span>
                  <input
                    type="text"
                    placeholder="Ej. ACROPHOBIA_HIGH_ROOF"
                    value={p?.immersionMetrics?.vrScenario || p?.vrTelemetryData?.deviceModel || ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        immersionMetrics: {
                          ...(p?.immersionMetrics || {}),
                          vrScenario: e.target.value,
                        },
                      } as any)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-indigo-300 focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" /> Tono Vagal (HRV ms)
                  </span>
                  <input
                    type="number"
                    placeholder="42"
                    value={p?.multisensoryHardware?.vagalToneHrvIndex ?? p?.vrTelemetryData?.hrv ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        multisensoryHardware: {
                          ...(p?.multisensoryHardware || {}),
                          vagalToneHrvIndex: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      } as any)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-rose-300 focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-amber-400" /> GSR (µS)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.4"
                    value={p?.vrTelemetryData?.gsr ?? (Array.isArray(p?.vrTelemetryData?.gsrMicroSiemens) ? p.vrTelemetryData.gsrMicroSiemens[0] : '')}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        vrTelemetryData: {
                          ...(p?.vrTelemetryData || {}),
                          gsr: e.target.value === '' ? (undefined as any) : parseFloat(e.target.value) || 0,
                        },
                      } as any)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" /> Despertares (APK)
                  </span>
                  <input
                    type="number"
                    placeholder="1"
                    value={p?.sentinelTelemetry?.sleepMetrics?.nightWakeups ?? p?.sentinelTelemetry?.nightWakeups ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...safePatient,
                        sentinelTelemetry: {
                          ...(p?.sentinelTelemetry || {}),
                          nightWakeups: e.target.value === '' ? (undefined as any) : parseInt(e.target.value, 10) || 0,
                        },
                      } as any)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-indigo-300 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default PatientJsonEditor;
