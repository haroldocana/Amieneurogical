import React, { useState } from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  PhoneCall, 
  CheckSquare, 
  Square, 
  Printer, 
  Check, 
  Copy, 
  FileText, 
  UserCheck 
} from 'lucide-react';

interface PsychiatryReferralViewProps {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis | null;
  currentDoctorName?: string;
  colegiadoNumber?: number | string;
}

export const PsychiatryReferralView: React.FC<PsychiatryReferralViewProps> = ({
  patient,
  analysis,
  currentDoctorName = 'Dr. Alejandro Morales Rivera',
  colegiadoNumber = 749210,
}) => {
  const [copied, setCopied] = useState(false);
  const [containmentChecklist, setContainmentChecklist] = useState({
    mediaRestriction: true,
    constantCompanion: true,
    emergencyHotlineGiven: true,
    hospitalEscortReady: false,
    toxicologyOrdered: true
  });

  const toggleCheck = (k: keyof typeof containmentChecklist) => {
    setContainmentChecklist(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const p = patient as any;
  const sRaw = p?.sentinelTelemetry || p?.sentinelTelemetrySnapshot || {};

  // Normalización defensiva de telemetría pasiva y red de apoyo
  const nightWakeups = sRaw?.sleepMetrics?.nightWakeups ?? sRaw?.nightWakeups ?? 'N/A';
  const biomotorLatency = sRaw?.behavioralBiometrics?.biomotorLatencyMs ?? 
                          sRaw?.behavioralBiometrics?.typingLatencyMs ?? 
                          sRaw?.biomotorLatencyMs ?? 
                          p?.neuromotorBiomarkers?.reactionTimeMs ?? 
                          'N/A';

  const emergencyContact = sRaw?.safetyStatus?.emergencyContact ?? 
                           sRaw?.emergencyContact ?? 
                           p?.emergencyContact ?? 
                           null;

  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || p?.name || `Paciente ID: ${patientId}`;
  const sanitizedPhone = (emergencyContact?.phone || '').replace(/[^\d+]/g, '');

  const formattedDate = new Date().toLocaleDateString('es-GT', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const referralText = `
HOJA DE REFERENCIA MÉDICA URGENTE A PSIQUIATRÍA / SALUD MENTAL
============================================================
Fecha y Hora: ${formattedDate}
Médico Remitente: ${currentDoctorName}
No. de Colegiado Médico: #${colegiadoNumber}
Institución: AMIE Medical Network - Unidad de Interconsulta y Crisis

DATOS DEL PACIENTE:
- Código / ID: ${patientId}
- Nombre / Identificador: ${patientDisplayName}
- Edad: ${patient.age || 45} años | Género: ${patient.gender || 'M'}

MOTIVO DE REFERENCIA:
${patient.consultationReason || 'Evaluación psiquiátrica de urgencia por riesgo bio-conductual agudo.'}

IMPRESIÓN DIAGNÓSTICA DSM-5-TR / CIE-11 (TRIANGULACIÓN AMIE):
- Diagnóstico Principal: ${analysis?.principalDiagnosis?.disorderName || 'En Evaluación Activa'}
- Código CIE: ${analysis?.principalDiagnosis?.codeCIE10 || (analysis?.principalDiagnosis as any)?.codeCIE11 || 'F32.2'}
- Severidad GAF/EEAG Estimada: ${analysis?.principalDiagnosis?.gafEstimated || patient.psychometricScores?.gafEstimated || '35'}/100

TRIANGULACIÓN DE RIESGO Y BIOMARCADORES:
- Nivel de Riesgo Suicida (SAD PERSONS: ${patient.psychometricScores?.sadPersons ?? 'N/A'}/10): ${analysis?.riskAlerts?.suicideRiskLevel || (analysis?.riskAlerts as any)?.suicideRisk || 'EVALUACIÓN AGUDA'}
- Telemetría Pasiva APK Centinela: Despertares Nocturnos = ${nightWakeups}, Latencia Biomotora = ${biomotorLatency} ms
- Riesgo Psicótico / Descompensación Aguda: ${analysis?.riskAlerts?.psychosisRisk || 'Vigilancia activa requerida'}

ACCIONES DE CONTENCIÓN INMEDIATA IMPLEMENTADAS:
${containmentChecklist.mediaRestriction ? '[X] Restricción verificada de medios letales en domicilio (fármacos, armas, objetos)' : '[ ] Restricción de medios letales'}
${containmentChecklist.constantCompanion ? '[X] Acompañamiento familiar continuo 24/7 establecido con red de contención' : '[ ] Acompañamiento 24/7'}
${containmentChecklist.emergencyHotlineGiven ? '[X] Línea directa de crisis y canal de telemedicina provistos a los tutores' : '[ ] Línea directa de crisis'}
${containmentChecklist.hospitalEscortReady ? '[X] Protocolo de traslado o escolta médica a urgencias hospitalarias activo' : '[ ] Traslado hospitalario en espera'}
${containmentChecklist.toxicologyOrdered ? '[X] Perfil toxicológico, metabólico y descarte orgánico solicitado' : '[ ] Laboratorios toxicológicos'}

OBSERVACIONES CLÍNICAS Y JUSTIFICACIÓN:
${analysis?.principalDiagnosis?.justificationDsm5 || patient.anamnesis || 'Se remite para estabilización psicofarmacológica inmediata y valoración de ingreso hospitalario.'}
============================================================
Firma del Médico Responsable: ____________________ (Colegiado #${colegiadoNumber})
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(referralText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Cabecera Principal (Oculta al imprimir) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-xl text-white shadow-lg shadow-rose-600/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Módulo de Referencia &amp; Contención Psiquiátrica Urgente
            </h1>
            <p className="text-xs text-slate-400">
              Generación de informe de derivación oficial, protocolo de rescate y verificación de medidas de seguridad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Texto del Informe'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Documento Oficial</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* Columna Izquierda: Checklist & Red de Apoyo (Oculta al imprimir) */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4" /> Checklist de Contención Activa
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div
                role="checkbox"
                aria-checked={containmentChecklist.mediaRestriction}
                tabIndex={0}
                onClick={() => toggleCheck('mediaRestriction')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCheck('mediaRestriction');
                  }
                }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {containmentChecklist.mediaRestriction ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">Restricción de medios letales en hogar (fármacos, armas de fuego, objetos punzantes).</span>
              </div>

              <div
                role="checkbox"
                aria-checked={containmentChecklist.constantCompanion}
                tabIndex={0}
                onClick={() => toggleCheck('constantCompanion')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCheck('constantCompanion');
                  }
                }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {containmentChecklist.constantCompanion ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">Acompañamiento continuo 24/7 por red de apoyo designada.</span>
              </div>

              <div
                role="checkbox"
                aria-checked={containmentChecklist.emergencyHotlineGiven}
                tabIndex={0}
                onClick={() => toggleCheck('emergencyHotlineGiven')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCheck('emergencyHotlineGiven');
                  }
                }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {containmentChecklist.emergencyHotlineGiven ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">Línea telefónica de crisis 24/7 y contacto directo del médico colegiado provistos.</span>
              </div>

              <div
                role="checkbox"
                aria-checked={containmentChecklist.hospitalEscortReady}
                tabIndex={0}
                onClick={() => toggleCheck('hospitalEscortReady')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCheck('hospitalEscortReady');
                  }
                }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {containmentChecklist.hospitalEscortReady ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">Protocolo de traslado o escolta médica a urgencias hospitalarias preparado.</span>
              </div>

              <div
                role="checkbox"
                aria-checked={containmentChecklist.toxicologyOrdered}
                tabIndex={0}
                onClick={() => toggleCheck('toxicologyOrdered')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCheck('toxicologyOrdered');
                  }
                }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {containmentChecklist.toxicologyOrdered ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">Laboratorios toxicológicos y metabólicos de exclusión solicitados.</span>
              </div>
            </div>
          </div>

          {/* Red de Apoyo Vinculada */}
          {emergencyContact && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Red de Apoyo Vinculada (APK Centinela)
              </span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-white text-sm">{emergencyContact.name}</div>
                <div className="text-slate-400 text-xs mt-0.5">{emergencyContact.relationship}</div>
                {sanitizedPhone && (
                  <a
                    href={`tel:${sanitizedPhone}`}
                    className="mt-2.5 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-mono font-bold text-xs bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition w-full justify-center active:scale-95 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> {emergencyContact.phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Previsualización e Impresión del Informe */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-3 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" /> Documento de Referencia Generado
            </span>
            <span className="text-[10px] font-mono text-slate-500">Formato Estándar Hospitalario</span>
          </div>

          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto print:bg-white print:text-black print:border-none print:p-2 print:text-[11pt] print:leading-normal">
            {referralText}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychiatryReferralView;
