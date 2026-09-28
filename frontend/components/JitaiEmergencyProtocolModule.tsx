import React, { useState, useEffect } from 'react';
import { PatientRecord, JitaiTelemetryPacket, JitaiConsentRecord } from '../types';
import {
  ShieldAlert, Smartphone, Activity, HeartPulse, MapPin, Bell, PhoneCall,
  FileCheck, Zap, Moon, AlertTriangle, CheckCircle2, Lock, Volume2, Users, RefreshCw
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose?: () => void;
}

export const JitaiEmergencyProtocolModule: React.FC<Props> = ({ patient, onClose }) => {
  // Estado de Consentimiento Informado
  const [consent, setConsent] = useState<JitaiConsentRecord>({
    patientSigned: true,
    patientSignatureDate: '2026-01-15',
    legalTutorSigned: true,
    legalTutorName: 'María Elena Morales',
    legalTutorPhone: '+502 5555-8921',
    legalTutorRelationship: 'Madre / Cadena de Custodia',
    gpsTrackingAuthorized: true,
    keystrokeTelemetryAuthorized: true,
    emergencySmsAuthorized: true,
    attendingPsychiatristId: 'COL-749210'
  });

  // Estado de Telemetría 24/7 en vivo
  const [telemetry, setTelemetry] = useState<JitaiTelemetryPacket>({
    timestamp: new Date().toLocaleTimeString(),
    wearableDevice: 'Empatica EmbracePlus 24/7',
    sleepHours48h: 2.5, // Simulación de privación de sueño
    restingHeartRateBpm: 104, // Taquicardia en reposo
    hrvRmssdMs: 14, // Tono vagal suprimido
    skinTemperatureCelsius: 37.4,
    keystrokeAnomaliesPct: 88,
    speechTaquilaliaIndexPct: 82,
    isOutsideSafeGeofence: true,
    geofenceCoordinates: { lat: 14.6349, lng: -90.5069, locationName: 'Puente El Incienso (Fuera de Zona Segura)' },
    calculatedAcuteDecompensationRisk: 92,
    riskLevel: 'CRÍTICO_JITAI'
  });

  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);
  const [isGroundingActive, setIsGroundingActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'patient_screen' | 'legal'>('monitor');

  // Simulación de actualización de datos cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        timestamp: new Date().toLocaleTimeString(),
        restingHeartRateBpm: Math.floor(100 + Math.random() * 10),
        keystrokeAnomaliesPct: Math.floor(82 + Math.random() * 10)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerManualJitai = () => {
    setIsSimulatingDispatch(true);
    setTimeout(() => {
      setIsSimulatingDispatch(false);
      setIsGroundingActive(true);
    }, 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-6xl w-full mx-auto space-y-6">
      
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 via-red-600 to-amber-600 rounded-2xl text-white shadow-lg shadow-rose-600/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Sistema JITAI 24/7 & Intervención Anticrisis
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                PREVENCIÓN DE BROTE EN TIEMPO REAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitoreo continuo no invasivo: wearable biomédico, dinámica de teclado, geocerca y protocolo de contención.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800">
            ✕
          </button>
        )}
      </div>

      {/* Selector de Vistas */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'monitor' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Monitor Psiquiátrico 24/7</span>
        </button>

        <button
          onClick={() => setActiveTab('patient_screen')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'patient_screen' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Vista de Contención en Celular del Paciente</span>
        </button>

        <button
          onClick={() => setActiveTab('legal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'legal' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Consentimiento Legal & Custodia</span>
        </button>
      </div>

      {/* TAB 1: MONITOR PSIQUIÁTRICO EN TIEMPO REAL */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          
          {/* Indicador de Estado del Paciente */}
          <div className="p-5 bg-rose-950/60 border-2 border-rose-500/80 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-600 rounded-xl text-white font-mono font-black text-2xl animate-ping">
                {telemetry.calculatedAcuteDecompensationRisk}%
              </div>
              <div>
                <span className="text-xs font-mono text-rose-300 uppercase block font-bold">
                  ÍNDICE DE DESCOMPENSACIÓN AGUDA (IDA): {telemetry.riskLevel}
                </span>
                <h3 className="text-sm font-bold text-white">
                  Riesgo Inminente de Brote Psicótico / Agitación Severa
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Último paquete enviado: {telemetry.timestamp} via {telemetry.wearableDevice}</span>
              </div>
            </div>

            <button
              onClick={handleTriggerManualJitai}
              disabled={isSimulatingDispatch}
              className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-xl shadow-rose-600/30 flex items-center gap-2"
            >
              {isSimulatingDispatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>DISPARAR CADENA JITAI AHORA</span>
            </button>
          </div>

          {/* Grid de Sensores Pasivos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sueño Acumulado 48h
              </span>
              <div className="text-2xl font-mono font-black text-rose-400">
                {telemetry.sleepHours48h} <span className="text-xs text-slate-500">hrs</span>
              </div>
              <span className="text-[10px] text-rose-400 font-bold block"> Privación Severa de Sueño</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Pulso en Reposo / HRV
              </span>
              <div className="text-2xl font-mono font-black text-rose-400">
                {telemetry.restingHeartRateBpm} <span className="text-xs text-slate-500">bpm</span>
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
              <span className="text-[10px] text-slate-400 block">Patrón errático / Fuga de ideas</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Geocerca de Seguridad
              </span>
              <div className="text-xs font-mono font-bold text-rose-400 truncate">
                {telemetry.geofenceCoordinates?.locationName}
              </div>
              <span className="text-[10px] text-rose-400 font-bold block"> Violación de Zona Segura</span>
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
                <p className="text-[10px] text-slate-400">Notificación enviada al Workstation y canal prioritario del Dr. Morales ({consent.attendingPsychiatristId}).</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">2. SMS a Red de Apoyo</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400">Mensaje enviado a {consent.legalTutorName} ({consent.legalTutorPhone}): "Asegure contacto visual e instale rescate."</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">3. Contención en Celular</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400">Interfase de emergencia activada en el smartphone del paciente con audio anxiolítico de anclaje.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISTA DE PANTALLA DE EMERGENCIA DEL PACIENTE */}
      {activeTab === 'patient_screen' && (
        <div className="flex justify-center py-4">
          <div className="w-80 bg-slate-950 border-4 border-rose-600 rounded-[40px] p-6 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto" />
            
            <div className="space-y-2 pt-4">
              <div className="p-3 bg-rose-600/20 border border-rose-500 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">MODO DE ASISTENCIA CLÍNICA</h3>
              <p className="text-[11px] text-rose-200 font-medium">
                Detectamos un nivel elevado de estrés en tu cuerpo. Mantén la calma, tu médico y tu familia ya están notificados.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold text-cyan-300 uppercase block flex items-center justify-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" /> Audio de Anclaje Activo
              </span>
              <p className="text-[10px] text-slate-300 italic">
                "Inhala profundamente en 4 segundos... sostén... exhala en 6 segundos. Estás a salvo."
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="tel:911"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 block"
              >
                <PhoneCall className="w-4 h-4" />
                <span>LLAMAR A SERVICIO 911 / CRISIS</span>
              </a>

              <span className="text-[9px] text-slate-500 block font-mono">
                AMIE JITAI Protection System • Enlace en vivo activo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONSENTIMIENTO INFORMADO & CUSTODIA LEGAL */}
      {activeTab === 'legal' && (
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs text-slate-300">
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
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase block">Firma del Paciente (Fase de Lucidez)</span>
              <p className="text-[11px] text-slate-400">Acepto la instalación de la APK Centinela y la transmisión de telemetría médica en segundo plano.</p>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] rounded font-mono inline-block">
                FIRMADO VIRTUALMENTE EL {consent.patientSignatureDate}
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase block">Firma del Tutor / Representante Legal</span>
              <p className="text-[11px] text-slate-400">
                Tutor: <strong>{consent.legalTutorName}</strong> ({consent.legalTutorRelationship}) • Tel: {consent.legalTutorPhone}
              </p>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] rounded font-mono inline-block">
                AUTORIZADO PARA RECEPCIÓN DE ALERTAS CRÍTICAS
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
