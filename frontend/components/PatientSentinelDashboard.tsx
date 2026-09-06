import React from 'react';
import { PatientRecord, PatientSentinelData } from '../types';
import { Smartphone, Moon, Activity, PhoneCall, ShieldAlert, Zap, Clock } from 'lucide-react';

interface PatientSentinelDashboardProps {
  patient: PatientRecord;
}

export const PatientSentinelDashboard: React.FC<PatientSentinelDashboardProps> = ({ patient }) => {
  const sentinel = patient.sentinelTelemetry || {
    pacId: patient.id || 'PAC-0001',
    deviceSyncTime: 'En línea',
    sleepMetrics: {
      nightWakeups: patient.functionalAreas.sleep < 30 ? 4 : 1,
      hoursInDarkness: 7.0,
      avgSleepDurationHours: (patient.functionalAreas.sleep / 100) * 8,
      sleepEfficiencyPct: Math.round(patient.functionalAreas.sleep * 0.8 + 15)
    },
    behavioralBiometrics: {
      typingLatencyMs: patient.neuromotorBiomarkers?.reactionTimeMs || 320,
      screenActiveTimeMinutes: patient.functionalAreas.sleep < 30 ? 110 : 20,
      biomotorLatencyMs: patient.neuromotorBiomarkers?.reactionTimeMs || 320,
      activityRestlessnessIndex: 100 - patient.functionalAreas.sleep
    },
    safetyStatus: {
      riskLevel: (patient.psychometricScores.sadPersons ?? 0) >= 7 ? 'CRÍTICO' : (patient.psychometricScores.sadPersons ?? 0) >= 4 ? 'ALTO' : 'BAJO',
      activeContentionTriggered: (patient.psychometricScores.sadPersons ?? 0) >= 6 || (patient.psychometricScores.cssrsLevel ?? 0) >= 4,
      passiveRiskRationale: 'Monitoreo biomotor pasivo correlacionado con registro de ciclo sueño-vigilia.',
      emergencyContact: {
        name: 'Contacto Primario Asignado',
        relationship: 'Familiar',
        phone: '+52 55 0000-0000'
      }
    }
  };

  const nightWakeups = sentinel.sleepMetrics?.nightWakeups ?? sentinel.nightWakeups ?? 0;
  const biomotorLatencyMs = sentinel.behavioralBiometrics?.biomotorLatencyMs ?? sentinel.behavioralBiometrics?.typingLatencyMs ?? sentinel.biomotorLatencyMs ?? 300;
  const screenNightMinutes = sentinel.behavioralBiometrics?.screenActiveTimeMinutes ?? sentinel.screenOnNightTimeMinutes ?? 0;
  const sleepEff = sentinel.sleepMetrics?.sleepEfficiencyPct ?? sentinel.sleepEfficiencyPct ?? 80;
  const sleepDuration = sentinel.sleepMetrics?.avgSleepDurationHours ?? sentinel.avgSleepDurationHours ?? 7;
  const riskScore = sentinel.safetyStatus?.riskLevel ?? sentinel.passiveRiskScore ?? 'BAJO';
  const riskRationale = sentinel.safetyStatus?.passiveRiskRationale ?? sentinel.passiveRiskRationale ?? '';
  const emergency = sentinel.safetyStatus?.emergencyContact ?? sentinel.emergencyContact ?? { name: 'Familiar', phone: '+52 55 0000-0000', relationship: 'Red de Apoyo' };

  const isNightWakeupHigh = nightWakeups > 3;
  const isBiomotorCritical = biomotorLatencyMs > 420 || biomotorLatencyMs < 200;
  const isHighRisk = riskScore === 'CRÍTICO' || riskScore === 'ALTO' || isNightWakeupHigh;

  return (
    <div className={`rounded-xl p-4 border shadow-xl transition-all ${
      isHighRisk 
        ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/20' 
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header */}
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
            <span className="text-[10px] text-slate-400">
              Sincronización: {sentinel.deviceSyncTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
            riskScore === 'CRÍTICO'
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
              : riskScore === 'ALTO'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            Riesgo: {riskScore}
          </span>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
        {/* Despertares nocturnos */}
        <div className={`p-2 rounded-lg border ${
          isNightWakeupHigh
            ? 'bg-red-950/40 border-red-500/40 text-red-200'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" /> Despertares
            </span>
            {isNightWakeupHigh && <span className="text-red-400 font-bold">ALERTA</span>}
          </div>
          <div className="text-base font-bold font-mono">
            {nightWakeups} <span className="text-[10px] font-normal">/ noche</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            {isNightWakeupHigh ? 'Despertares > 3 (Riesgo Suicida)' : 'Ciclo REM normal'}
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
            {biomotorLatencyMs} <span className="text-[10px] font-normal">ms</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            {biomotorLatencyMs > 420 ? 'Inhibición / Letargo' : biomotorLatencyMs < 200 ? 'Agitación impulsiva' : 'Velocidad esperada'}
          </div>
        </div>

        {/* Pantalla Noche */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
          <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" /> Pantalla Nocturna
          </div>
          <div className="text-base font-bold font-mono text-sky-300">
            {screenNightMinutes} <span className="text-[10px] font-normal">min</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Uso entre 00:00 - 05:00</div>
        </div>

        {/* Eficiencia Sueño */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
          <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-400" /> Eficiencia Sueño
          </div>
          <div className="text-base font-bold font-mono text-purple-300">
            {sleepEff}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Total: {sleepDuration.toFixed(1)} hrs</div>
        </div>
      </div>

      {/* Rationale & Crisis protocol trigger */}
      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
        <p className="leading-relaxed">
          <strong className="text-slate-200">Interpretación Algorítmica: </strong>
          {riskRationale}
        </p>

        {isHighRisk && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-[11px] font-semibold">
                Activar Protocolo de Contención 24/7 & Restricción de Medios
              </span>
            </div>
            <a
              href={`tel:${emergency.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Llamar Red: {emergency.name}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
