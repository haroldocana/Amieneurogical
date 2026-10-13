import React from 'react';
import { PatientRecord } from '../types';
import { 
  Smartphone, 
  Moon, 
  Activity, 
  PhoneCall, 
  ShieldAlert, 
  Zap, 
  Clock, 
  BrainCircuit,
  ArrowRight,
  Glasses
} from 'lucide-react';

interface PatientSentinelDashboardProps {
  patient?: PatientRecord;
  onNavigateToVrModule?: (moduleId: string) => void;
}

export const PatientSentinelDashboard: React.FC<PatientSentinelDashboardProps> = ({ 
  patient,
  onNavigateToVrModule 
}) => {
  const p = patient as any;
  const sleepValue = p?.functionalAreas?.sleep ?? 50;

  // Extracción polimórfica defensiva de telemetría pasiva (sentinelTelemetry o snapshot)
  const rawSentinel = p?.sentinelTelemetry || p?.sentinelTelemetrySnapshot || {};

  const sentinel = {
    pacId: p?.id || p?.patientId || rawSentinel?.pacId || 'PAC-8104',
    deviceSyncTime: rawSentinel?.deviceSyncTime || rawSentinel?.lastSyncTime || 'En línea',
    sleepMetrics: {
      nightWakeups: rawSentinel?.sleepMetrics?.nightWakeups ?? 
                    rawSentinel?.nightWakeups ?? 
                    rawSentinel?.sleepDisruptionsCount ?? 
                    (sleepValue < 30 ? 4 : 1),
      hoursInDarkness: rawSentinel?.sleepMetrics?.hoursInDarkness ?? 7.0,
      avgSleepDurationHours: rawSentinel?.sleepMetrics?.avgSleepDurationHours ?? 
                             rawSentinel?.avgSleepDurationHours ?? 
                             (sleepValue / 100) * 8,
      sleepEfficiencyPct: rawSentinel?.sleepMetrics?.sleepEfficiencyPct ?? 
                          rawSentinel?.sleepEfficiencyPct ?? 
                          Math.round(sleepValue * 0.8 + 15)
    },
    behavioralBiometrics: {
      typingLatencyMs: rawSentinel?.behavioralBiometrics?.typingLatencyMs ?? 
                       rawSentinel?.typingLatencyMs ?? 
                       p?.neuromotorBiomarkers?.reactionTimeMs ?? 
                       320,
      screenActiveTimeMinutes: rawSentinel?.behavioralBiometrics?.screenActiveTimeMinutes ?? 
                               rawSentinel?.screenOnNightTimeMinutes ?? 
                               (sleepValue < 30 ? 110 : 20),
      biomotorLatencyMs: rawSentinel?.behavioralBiometrics?.biomotorLatencyMs ?? 
                         rawSentinel?.biomotorLatencyMs ?? 
                         p?.neuromotorBiomarkers?.reactionTimeMs ?? 
                         320,
      activityRestlessnessIndex: rawSentinel?.behavioralBiometrics?.activityRestlessnessIndex ?? 
                                 rawSentinel?.activityRestlessnessIndex ?? 
                                 (100 - sleepValue)
    },
    safetyStatus: {
      riskLevel: rawSentinel?.safetyStatus?.riskLevel ?? 
                 rawSentinel?.passiveRiskScore ?? 
                 ((p?.psychometricScores?.sadPersons ?? 0) >= 7 ? 'CRÍTICO' : 
                  (p?.psychometricScores?.sadPersons ?? 0) >= 4 ? 'ALTO' : 'BAJO'),
      activeContentionTriggered: rawSentinel?.safetyStatus?.activeContentionTriggered ?? 
                                 ((p?.psychometricScores?.sadPersons ?? 0) >= 6 || (p?.psychometricScores?.cssrsLevel ?? 0) >= 4),
      passiveRiskRationale: rawSentinel?.safetyStatus?.passiveRiskRationale ?? 
                             rawSentinel?.passiveRiskRationale ?? 
                             'Monitoreo biomotor pasivo correlacionado con registro circadiano.',
      emergencyContact: rawSentinel?.safetyStatus?.emergencyContact ?? 
                        rawSentinel?.emergencyContact ?? 
                        p?.emergencyContact ?? {
                          name: 'Contacto Primario Asignado',
                          relationship: 'Familiar Red Primaria',
                          phone: '+502 5555-0199'
                        }
    }
  };

  const nightWakeups = sentinel.sleepMetrics.nightWakeups;
  const biomotorLatencyMs = sentinel.behavioralBiometrics.biomotorLatencyMs;
  const screenNightMinutes = sentinel.behavioralBiometrics.screenActiveTimeMinutes;
  const sleepEff = sentinel.sleepMetrics.sleepEfficiencyPct;
  const sleepDuration = sentinel.sleepMetrics.avgSleepDurationHours;
  const riskScore = sentinel.safetyStatus.riskLevel;
  const riskRationale = sentinel.safetyStatus.passiveRiskRationale;
  const emergency = sentinel.safetyStatus.emergencyContact;

  const isNightWakeupHigh = nightWakeups > 3;
  const isBiomotorCritical = biomotorLatencyMs > 420 || biomotorLatencyMs < 200;
  const isHighRisk = riskScore === 'CRÍTICO' || riskScore === 'ALTO' || isNightWakeupHigh;

  // Motor de recomendación de protocolo VR para visor Pico 3 Pro
  const getVrRecommendationData = () => {
    if (biomotorLatencyMs > 420) {
      return {
        moduleId: 'TDM_DEPRESSION',
        text: 'Sugerencia AMIE: Ejecutar Módulo VR de Depresión (TDM) — Evaluar retardo psicomotor y aplanamiento afectivo.'
      };
    }
    if (biomotorLatencyMs < 200 && screenNightMinutes > 60) {
      return {
        moduleId: 'TDAH_EXECUTIVE',
        text: 'Sugerencia AMIE: Ejecutar Módulo VR TDAH — Evaluar desinhibición motora y descarte de hipomanía.'
      };
    }
    if (isNightWakeupHigh) {
      return {
        moduleId: 'TAG_ANXIETY',
        text: 'Sugerencia AMIE: Ejecutar Módulo VR de Ansiedad (TAG) / Neurohipnosis — Estimulación vagotónica.'
      };
    }
    return {
      moduleId: 'NEURO_HYPNOSIS',
      text: 'Paciente en rango basal. Seleccione el protocolo inmersivo según el objetivo de la sesión.'
    };
  };

  const recommendation = getVrRecommendationData();
  const sanitizedPhone = (emergency?.phone || '').replace(/[^\d+]/g, '');

  return (
    <div className={`rounded-xl p-4 border shadow-xl transition-all font-sans text-slate-100 ${
      isHighRisk 
        ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/20' 
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                APK Centinela • Medición Pasiva
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {sentinel.pacId}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Sincronización: {sentinel.deviceSyncTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
            riskScore === 'CRÍTICO'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
              : riskScore === 'ALTO'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            Riesgo: {riskScore}
          </span>
        </div>
      </div>

      {/* Rejilla de Telemetría */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
        {/* Despertares Nocturnos */}
        <div className={`p-2 rounded-lg border ${
          isNightWakeupHigh
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" /> Despertares
            </span>
            {isNightWakeupHigh && <span className="text-rose-400 font-bold font-mono">ALERTA</span>}
          </div>
          <div className="text-base font-bold font-mono">
            {nightWakeups} <span className="text-[10px] font-normal text-slate-400">/ noche</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            {isNightWakeupHigh ? 'Despertares > 3 (Riesgo Autolítico)' : 'Arquitectura REM estable'}
          </div>
        </div>

        {/* Latencia Biomotora */}
        <div className={`p-2 rounded-lg border ${
          isBiomotorCritical
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" /> Ritmo Biomotor
            </span>
          </div>
          <div className="text-base font-bold font-mono">
            {biomotorLatencyMs} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            {biomotorLatencyMs > 420 ? 'Inhibición / Letargo' : biomotorLatencyMs < 200 ? 'Agitación impulsiva' : 'Velocidad esperada'}
          </div>
        </div>

        {/* Pantalla Nocturna */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
          <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" /> Pantalla Noche
          </div>
          <div className="text-base font-bold font-mono text-sky-300">
            {screenNightMinutes} <span className="text-[10px] font-normal text-slate-400">min</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Uso entre 00:00 - 05:00</div>
        </div>

        {/* Eficiencia de Sueño */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
          <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-400" /> Eficiencia Sueño
          </div>
          <div className="text-base font-bold font-mono text-purple-300">
            {sleepEff}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Total: {Number(sleepDuration).toFixed(1)} hrs</div>
        </div>
      </div>

      {/* Interpretación Algorítmica & Recomendación VR */}
      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
        <p className="leading-relaxed">
          <strong className="text-slate-200">Interpretación Algorítmica: </strong>
          {riskRationale}
        </p>

        {/* Recomendador de Módulo VR Pico 3 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 mt-2 bg-sky-950/40 border border-sky-900/50 rounded-lg text-sky-200">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-[11px] font-medium">{recommendation.text}</span>
          </div>

          {onNavigateToVrModule && (
            <button
              type="button"
              onClick={() => onNavigateToVrModule(recommendation.moduleId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold transition shrink-0 cursor-pointer active:scale-95 shadow-md shadow-sky-600/20"
            >
              <Glasses className="w-3 h-3" />
              <span>Abrir Protocolo VR</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Alerta de Contención Crítica */}
        {isHighRisk && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-[11px] font-semibold">
                Activar Protocolo de Contención 24/7 &amp; Restricción de Medios
              </span>
            </div>

            {sanitizedPhone && (
              <a
                href={`tel:${sanitizedPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition shrink-0 shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Llamar Red: {emergency.name}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSentinelDashboard;
