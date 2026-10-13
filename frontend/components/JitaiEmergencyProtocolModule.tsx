import React, { useState, useEffect } from 'react';
import { PatientRecord, JitaiTelemetryPacket, JitaiConsentRecord } from '../types';
import {
  ShieldAlert,
  Smartphone,
  Activity,
  HeartPulse,
  MapPin,
  Bell,
  PhoneCall,
  FileCheck,
  Zap,
  Moon,
  CheckCircle2,
  Volume2,
  RefreshCw,
  X,
  Glasses
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

export const JitaiEmergencyProtocolModule: React.FC<Props> = ({ patient, onClose }) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const emergencyContact = p?.sentinelTelemetry?.emergencyContact;

  // Estado de Consentimiento Informado con fallback dinámico al expediente
  const [consent, setConsent] = useState<JitaiConsentRecord>({
    patientSigned: true,
    patientSignatureDate: '2026-01-15',
    legalTutorSigned: true,
    legalTutorName: emergencyContact?.name || 'María Elena Morales',
    legalTutorPhone: emergencyContact?.phone || '+502 5555-8921',
    legalTutorRelationship: emergencyContact?.relationship || 'Familiar Red Primaria / Custodia',
    gpsTrackingAuthorized: true,
    keystrokeTelemetryAuthorized: true,
    emergencySmsAuthorized: true,
    attendingPsychiatristId: 'COL-749210'
  });

  // Estado de Telemetría 24/7 en vivo
  const [telemetry, setTelemetry] = useState<JitaiTelemetryPacket>({
    timestamp: new Date().toLocaleTimeString('es-GT'),
    wearableDevice: 'Empatica EmbracePlus 24/7',
    sleepHours48h: p?.sentinelTelemetry?.sleepMetrics?.avgDurationHours ? Number((p.sentinelTelemetry.sleepMetrics.avgDurationHours * 0.6).toFixed(1)) : 2.5,
    restingHeartRateBpm: 104,
    hrvRmssdMs: p?.multisensoryHardware?.vagalToneHrvIndex ? Math.min(18, p.multisensoryHardware.vagalToneHrvIndex) : 14,
    skinTemperatureCelsius: 37.4,
    keystrokeAnomaliesPct: 88,
    speechTaquilaliaIndexPct: 82,
    isOutsideSafeGeofence: true,
    geofenceCoordinates: { lat: 14.6349, lng: -90.5069, locationName: 'Puente El Incienso (Fuera de Geocerca)' },
    calculatedAcuteDecompensationRisk: 92,
    riskLevel: 'CRÍTICO_JITAI'
  });

  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);
  const [isGroundingActive, setIsGroundingActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'patient_screen' | 'legal'>('monitor');

  // Simulación continua de flujo teleimétrico cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        timestamp: new Date().toLocaleTimeString('es-GT'),
        restingHeartRateBpm: Math.floor(100 + Math.random() * 8),
        keystrokeAnomaliesPct: Math.floor(84 + Math.random() * 8)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerManualJitai = () => {
    setIsSimulatingDispatch(true);
    setTimeout(() => {
      setIsSimulatingDispatch(false);
      setIsGroundingActive(true);
    }, 1200);
  };

  const handleToggleConsentFlag = (field: 'gpsTrackingAuthorized' | 'keystrokeTelemetryAuthorized' | 'emergencySmsAuthorized') => {
    setConsent(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-6xl w-full mx-auto space-y-6 font-sans">
      
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 via-red-600 to-amber-600 rounded-2xl text-white shadow-lg shadow-rose-600/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Sistema JITAI 24/7 &amp; Intervención Anticrisis
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                PREVENCIÓN DE BROTE EN TIEMPO REAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Expediente: <strong className="text-slate-200">{patientId}</strong> | Monitoreo continuo no invasivo: wearable biomédico, dinámica de teclado, geocerca y contención.
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            title="Cerrar Módulo JITAI"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Selector de Vistas */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'monitor' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Monitor Psiquiátrico 24/7</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('patient_screen')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'patient_screen' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Vista de Contención en Celular</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('legal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'legal' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Consentimiento Legal &amp; Custodia</span>
        </button>
      </div>

      {/* Banner de Intervención Activa */}
      {isGroundingActive && (
        <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cadena JITAI Desplegada: Protocolo de Grounding y Audio Anxiolítico Emitiéndose al Paciente.</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            AUDIO ANCLAJE 0.1 HZ ACTIVO
          </span>
        </div>
      )}

      {/* TAB 1: MONITOR PSIQUIÁTRICO EN TIEMPO REAL */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          
          {/* Indicador de Descompensación Aguda */}
          <div className="p-5 bg-rose-950/60 border-2 border-rose-500/80 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-600 rounded-xl text-white font-mono font-black text-2xl shadow-lg shadow-rose-600/40">
                {telemetry.calculatedAcuteDecompensationRisk}%
              </div>
              <div>
                <span className="text-xs font-mono text-rose-300 uppercase block font-bold">
                  ÍNDICE DE DESCOMPENSACIÓN AGUDA (IDA): {telemetry.riskLevel}
                </span>
                <h3 className="text-sm font-bold text-white">
                  Riesgo Inminente de Brote Psicótico / Agitación Severa
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Último paquete recibido: {telemetry.timestamp} vía {telemetry.wearableDevice}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerManualJitai}
              disabled={isSimulatingDispatch}
              className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-xl shadow-rose-600/30 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSimulatingDispatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{isGroundingActive ? 'RE-ENVIAR ALERTA JITAI' : 'DISPARAR CADENA JITAI AHORA'}</span>
            </button>
          </div>

          {/* Rejilla de Sensores Pasivos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sueño Acumulado 48h
              </span>
              <div className="text-2xl font-mono font-black text-rose-400">
                {telemetry.sleepHours48h} <span className="text-xs text-slate-500 font-normal">hrs</span>
              </div>
              <span className="text-[10px] text-rose-400 font-bold block">Privación Severa de Sueño</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Pulso en Reposo / HRV
              </span>
              <div className="text-2xl font-mono font-black text-rose-400">
                {telemetry.restingHeartRateBpm} <span className="text-xs text-slate-500 font-normal">bpm</span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Tono Vagal HRV: {telemetry.hrvRmssdMs} ms (Crítico)</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Agitación de Tecleo
              </span>
              <div className="text-2xl font-mono font-black text-amber-400">
                {telemetry.keystrokeAnomaliesPct}%
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Patrón errático / Fuga de ideas</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Geocerca de Seguridad
              </span>
              <div className="text-xs font-mono font-bold text-rose-400 truncate" title={telemetry.geofenceCoordinates?.locationName}>
                {telemetry.geofenceCoordinates?.locationName}
              </div>
              <span className="text-[10px] text-rose-400 font-bold block">Violación de Zona Segura</span>
            </div>
          </div>

          {/* Cadena Automática de Notificaciones Disparadas */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Estado de la Cadena de Intervención Adaptativa (JITAI)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">1. Alerta al Psiquiatra</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Notificación enviada al Workstation y canal prioritario del facultativo ({consent.attendingPsychiatristId}).
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">2. SMS a Red de Apoyo</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Mensaje despachado a {consent.legalTutorName} ({consent.legalTutorPhone}): "Asegure contacto visual e instale rescate."
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">3. Contención en Celular</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Interfaz de rescate activada en el smartphone del paciente con audio anxiolítico de respiración guiada.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISTA DE PANTALLA DE EMERGENCIA DEL PACIENTE */}
      {activeTab === 'patient_screen' && (
        <div className="flex justify-center py-4">
          <div className="w-80 bg-slate-950 border-4 border-rose-600 rounded-[40px] p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto" />
            
            <div className="space-y-2 pt-2">
              <div className="p-3 bg-rose-600/20 border border-rose-500 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">MODO DE ASISTENCIA CLÍNICA</h3>
              <p className="text-[11px] text-rose-200 font-medium leading-relaxed">
                Detectamos un nivel elevado de sobrecarga física y emocional. Mantén la calma, tu médico y tu red de apoyo han sido informados.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-left">
              <span className="text-[10px] font-bold text-cyan-300 uppercase block flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" /> Audio de Anclaje Activo
              </span>
              <p className="text-[10px] text-slate-300 italic leading-relaxed">
                "Inhala profundamente en 4 segundos... sostén... exhala despacio en 6 segundos. Estás en un lugar seguro."
              </p>
            </div>

            {/* Enlace con sesión de Grounding VR Pico 3 */}
            <div className="p-3 bg-slate-900/60 border border-indigo-500/30 rounded-xl text-[10px] text-indigo-300 flex items-center gap-2 text-left">
              <Glasses className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Si dispones de tu visor Pico 3, colócatelo para entrar al Santuario Alpino.</span>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="tel:911"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>LLAMAR A SERVICIO 911 / CRISIS</span>
              </a>

              <span className="text-[9px] text-slate-500 block font-mono">
                AMIE JITAI Protection System • Enlace seguro activo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONSENTIMIENTO INFORMADO & CUSTODIA LEGAL */}
      {activeTab === 'legal' && (
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5 text-xs text-slate-300">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Consentimiento Informado Especial HIPAA / GDPR</h3>
              <p className="text-[11px] text-slate-400">
                Autorización explícita para monitoreo biométrico continuo 24/7, rastreo por GPS y notificación a la red de apoyo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-emerald-400 uppercase block">Firma del Paciente (Fase de Estabilidad)</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Autorizo la recolección de datos telemétricos pasivos en segundo plano por la APK Centinela para prevención de recaídas agudas.
              </p>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] rounded font-mono inline-block">
                FIRMADO ELECTRÓNICAMENTE EL {consent.patientSignatureDate}
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-emerald-400 uppercase block">Tutor Legal / Cadena de Custodia</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Representante: <strong className="text-white">{consent.legalTutorName}</strong> ({consent.legalTutorRelationship}) • Tel: {consent.legalTutorPhone}
              </p>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] rounded font-mono inline-block">
                AUTORIZADO PARA RECEPCIÓN DE ALERTAS CRÍTICAS
              </span>
            </div>
          </div>

          {/* Permisos de Telemetría Dinámicos */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Permisos Telemétricos Otorgados en la Cadena JITAI:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleToggleConsentFlag('gpsTrackingAuthorized')}
                className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                  consent.gpsTrackingAuthorized ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Geolocalización GPS</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${consent.gpsTrackingAuthorized ? 'text-emerald-400' : 'text-slate-600'}`} />
              </button>

              <button
                type="button"
                onClick={() => handleToggleConsentFlag('keystrokeTelemetryAuthorized')}
                className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                  consent.keystrokeTelemetryAuthorized ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Dinámica de Tecleo</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${consent.keystrokeTelemetryAuthorized ? 'text-emerald-400' : 'text-slate-600'}`} />
              </button>

              <button
                type="button"
                onClick={() => handleToggleConsentFlag('emergencySmsAuthorized')}
                className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                  consent.emergencySmsAuthorized ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Despacho de SMS</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${consent.emergencySmsAuthorized ? 'text-emerald-400' : 'text-slate-600'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default JitaiEmergencyProtocolModule;
