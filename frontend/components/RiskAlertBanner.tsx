import React from 'react';
import { AmieClinicalAnalysis } from '../types';
import { 
  AlertOctagon, 
  ShieldAlert, 
  PhoneCall, 
  Lock, 
  Clock, 
  ArrowRight, 
  FileText, 
  Zap 
} from 'lucide-react';

interface RiskAlertBannerProps {
  alerts?: AmieClinicalAnalysis['riskAlerts'] | null;
  onOpenReferral?: () => void;
  onOpenJitai?: () => void;
  emergencyPhone?: string;
}

export const RiskAlertBanner: React.FC<RiskAlertBannerProps> = ({ 
  alerts,
  onOpenReferral,
  onOpenJitai,
  emergencyPhone = '911'
}) => {
  if (!alerts) return null;

  const a = alerts as any;

  // Extracción polimórfica defensiva de nivel y lista de alertas
  const rawRiskLevel: string = a?.suicideRiskLevel || a?.suicideRisk || a?.level || 'BAJO';
  const normalizedLevel = rawRiskLevel.toUpperCase();
  const criticalAlertsList: string[] = a?.criticalAlertsList || a?.criticalAlerts || a?.alertsList || [];

  const isCritical = normalizedLevel === 'CRÍTICO' || normalizedLevel === 'ALTO';
  const isModerate = normalizedLevel === 'MODERADO' || normalizedLevel === 'MEDIO';

  // Si no hay riesgo elevado ni alertas críticas activas, no saturar la interfaz
  if (!isCritical && !isModerate && criticalAlertsList.length === 0) {
    return null;
  }

  // Rationale dinámico generado por AMIE con fallback seguro
  const rationaleText: string = a?.riskRationale || 
                                a?.rationale || 
                                a?.justification || 
                                (isCritical 
                                  ? 'Triangulación multimodal detectó vectores de riesgo crítico (vacío existencial / desesperanza / sobrecarga / SAD PERSONS elevado).' 
                                  : 'Monitoreo biomotor y psicométrico reporta indicadores de alerta que requieren supervisión ambulatoria estrecha.');

  const protocolSuggested: string | undefined = a?.containmentProtocolSuggested || a?.containmentProtocol;

  // Sanitización del teléfono de emergencia
  const sanitizedEmergencyPhone = emergencyPhone.replace(/[^\d+]/g, '');

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl p-4 sm:p-5 border shadow-2xl transition-all duration-300 font-sans ${
        isCritical
          ? 'bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 border-red-500/80 text-red-100 ring-2 ring-red-500/30 shadow-red-950/40'
          : 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-amber-500/60 text-amber-100 shadow-amber-950/20'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Bloque Izquierdo: Icono, Encabezado y Justificación */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
              isCritical 
                ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/20' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/20'
            }`}
          >
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-black text-xs sm:text-sm uppercase tracking-wider ${
                isCritical ? 'text-red-300' : 'text-amber-300'
              }`}>
                ALERTA CLÍNICA DE SEGURIDAD &amp; CONTENCIÓN INMEDIATA
              </span>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-black font-mono rounded-full uppercase tracking-wider text-white shadow-md ${
                  normalizedLevel === 'CRÍTICO'
                    ? 'bg-red-600 animate-pulse border border-red-400'
                    : normalizedLevel === 'ALTO'
                    ? 'bg-rose-600 border border-rose-400'
                    : 'bg-amber-600 border border-amber-400'
                }`}
              >
                NIVEL: {normalizedLevel}
              </span>
            </div>

            <p className={`text-xs leading-relaxed font-medium ${
              isCritical ? 'text-red-200/90' : 'text-amber-200/90'
            }`}>
              {rationaleText}
            </p>
          </div>
        </div>

        {/* Bloque Derecho: Acciones Clínicas de Respuesta Rápida */}
        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 flex-wrap sm:flex-nowrap justify-end">
          
          {onOpenReferral && (
            <button
              type="button"
              onClick={onOpenReferral}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-md ${
                isCritical 
                  ? 'bg-red-900/80 hover:bg-red-800 text-white border border-red-500/60 shadow-red-900/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700'
              }`}
              title="Abrir Hoja de Referencia Psiquiátrica Urgente"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Hoja de Derivación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenJitai && (
            <button
              type="button"
              onClick={onOpenJitai}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition cursor-pointer active:scale-95 shadow-md"
              title="Disparar Protocolo de Contención JITAI 24/7"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Activar JITAI</span>
            </button>
          )}

          {sanitizedEmergencyPhone && (
            <a
              href={`tel:${sanitizedEmergencyPhone}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition cursor-pointer active:scale-95 shadow-lg shadow-rose-600/30"
              title={`Llamar a línea de crisis (${sanitizedEmergencyPhone})`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Línea {sanitizedEmergencyPhone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Lista Detallada de Vectores Críticos Detectados */}
      {criticalAlertsList.length > 0 && (
        <div className={`mt-3.5 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-2 text-xs ${
          isCritical ? 'border-red-500/30' : 'border-amber-500/30'
        }`}>
          {criticalAlertsList.map((item, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-2 p-2 rounded-lg border text-xs leading-snug ${
                isCritical 
                  ? 'bg-red-950/60 border-red-500/30 text-red-200' 
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Protocolo de Contención Sugerido */}
      {protocolSuggested && (
        <div className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
          isCritical 
            ? 'bg-red-950/70 border-red-500/40 text-red-100' 
            : 'bg-amber-950/60 border-amber-500/40 text-amber-100'
        }`}>
          <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
          <div>
            <strong className={isCritical ? 'text-red-300' : 'text-amber-300'}>
              Protocolo de Contención Sugerido:
            </strong>{' '}
            <span>{protocolSuggested}</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default RiskAlertBanner;
