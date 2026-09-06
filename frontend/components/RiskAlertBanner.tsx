import React from 'react';
import { AmieClinicalAnalysis } from '../types';
import { AlertOctagon, ShieldAlert, PhoneCall, Lock, Clock } from 'lucide-react';

interface RiskAlertBannerProps {
  alerts: AmieClinicalAnalysis['riskAlerts'];
}

export const RiskAlertBanner: React.FC<RiskAlertBannerProps> = ({ alerts }) => {
  const isCritical = alerts.suicideRiskLevel === 'CRÍTICO' || alerts.suicideRiskLevel === 'ALTO';

  if (!isCritical && alerts.criticalAlertsList.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl p-4 border shadow-2xl transition-all ${
        isCritical
          ? 'bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 border-red-500/80 text-red-100 ring-2 ring-red-500/30 animate-pulse-slow'
          : 'bg-amber-950/70 border-amber-500/60 text-amber-100'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'} shrink-0 mt-0.5`}>
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wider text-red-300">
                ALERTA CLÍNICA DE SEGURIDAD & CONTENCIÓN INMEDIATA
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-red-600 text-white shadow">
                NIVEL: {alerts.suicideRiskLevel}
              </span>
            </div>
            <p className="text-xs text-red-200/90 mt-1 font-medium">
              Triangulación detectó vectores de riesgo crítico (vacío existencial / desesperanza / carga / SAD PERSONS elevado).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 border border-red-500/50 text-xs font-semibold text-white">
            <Clock className="w-4 h-4 text-red-300" />
            <span>Seguimiento 24/7 Requerido</span>
          </div>
        </div>
      </div>

      {/* Critical alerts detail */}
      {alerts.criticalAlertsList.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-500/30 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {alerts.criticalAlertsList.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-red-200 bg-red-950/40 p-1.5 rounded border border-red-500/20">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Containment Protocol */}
      {alerts.containmentProtocolSuggested && (
        <div className="mt-3 p-3 bg-red-900/40 rounded-lg border border-red-500/40 text-xs text-red-100 flex items-start gap-2">
          <Lock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-red-300">Protocolo de Contención Sugerido: </span>
            <span>{alerts.containmentProtocolSuggested}</span>
          </div>
        </div>
      )}
    </div>
  );
};
