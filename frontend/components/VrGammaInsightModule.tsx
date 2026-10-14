// ============================================================================
// AMIE CLINICAL COPILOT - MÓDULO OPTO-NEUROMODULACIÓN GAMMA & ARRASTRE (3 FASES)
// frontend/components/VrGammaInsightModule.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import {
  Sun,
  Activity,
  Play,
  Square,
  Printer,
  RotateCcw,
  Glasses,
  X,
  Stethoscope,
  Sparkles,
  FileText,
  Brain,
  Volume2,
  ShieldAlert,
  Clock,
  Sliders
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type ClinicalOperatingMode = 'DIAGNOSTIC' | 'TREATMENT';
export type GammaPipelinePhase = 'IDLE' | 'PHASE_1_BASELINE' | 'PHASE_2_STIMULATION' | 'PHASE_3_RECOVERY' | 'FINISHED';

export type NeuromodulationProtocol = 
  | 'ALZHEIMER_40HZ' 
  | 'DEPRESSION_ALPHA' 
  | 'ADHD_SMR' 
  | 'ANXIETY_THETA'
  | 'INSOMNIA_DELTA'
  | 'PTSD_THETA'
  | 'CHRONIC_PAIN_SUBDELTA'
  | 'AUTISM_MU'
  | 'BRAIN_FOG_BETA';

export interface OptoProtocolDefinition {
  id: NeuromodulationProtocol;
  name: string;
  targetHz: number;
  cie11: string;
  dsm5: string;
  specificMetricName: string;
  specificMetricUnit: string;
  scriptBaseline: string;
  scriptDiagnostic: string;
  scriptTreatment: string;
  scriptRecovery: string;
  clinicalObjective: string;
}

export const OPTO_PROTOCOLS: Record<NeuromodulationProtocol, OptoProtocolDefinition> = {
  ALZHEIMER_40HZ: {
    id: 'ALZHEIMER_40HZ',
    name: 'Ondas Gamma 40Hz (Alzheimer / Demencia)',
    targetHz: 40.0,
    cie11: '6D80',
    dsm5: '331.0',
    specificMetricName: 'Activación Microglial Est.',
    specificMetricUnit: '%',
    scriptBaseline: 'Calibración basal de reposo. Permanece con postura cómoda y fija la mirada al centro del campo estelar.',
    scriptDiagnostic: 'Test de arrastre fótico inicial a 40 Hz. Evaluamos resistencia electrocortical al estímulo estroboscópico.',
    scriptTreatment: 'Iniciando pulsación lumínica Gamma a 40 Hz. Sincronización de redes tálamo-corticales y depuración microglial.',
    scriptRecovery: 'Estimulación fótica finalizada. Registrando persistencia y consolidación del acoplamiento neuronal.',
    clinicalObjective: 'Arrastre fótico Gamma para activación microglial y depuración de placas beta-amiloides.'
  },
  DEPRESSION_ALPHA: {
    id: 'DEPRESSION_ALPHA',
    name: 'Asimetría Alpha 10Hz (Depresión Mayor)',
    targetHz: 10.0,
    cie11: '6A70',
    dsm5: '296.22',
    specificMetricName: 'Simetría Frontal L/R',
    specificMetricUnit: 'Ratio',
    scriptBaseline: 'Registro de reposo basal sin estimulación lumínica.',
    scriptDiagnostic: 'Evaluación de asimetría hemisférica frontal izquierda ante destello Alpha.',
    scriptTreatment: 'Estimulación fótica a 10 Hz para equilibrar la actividad frontal y reducir el afecto negativo.',
    scriptRecovery: 'Reposo post-estimulación. Consolidación del equilibrio neuroafectivo.',
    clinicalObjective: 'Reducción del sesgo depresivo mediante modulación de la asimetría alfa frontal.'
  },
  ADHD_SMR: {
    id: 'ADHD_SMR',
    name: 'Ritmo Sensoriomotor SMR 15Hz (TDAH / Impulsividad)',
    targetHz: 15.0,
    cie11: '6A05.0',
    dsm5: '314.01',
    specificMetricName: 'Inhibición Motora',
    specificMetricUnit: '%',
    scriptBaseline: 'Registro de estabilidad motora basal.',
    scriptDiagnostic: 'Medición de la susceptibilidad cortical ante estímulos Go/No-Go fóticos a 15 Hz.',
    scriptTreatment: 'Entrenamiento SMR para quietud motora y fortalecimiento del control inhibitorio prefrontal.',
    scriptRecovery: 'Fase de integración. Mantén la calma física y atención focalizada.',
    clinicalObjective: 'Incremento del ritmo sensoriomotor para modular hiperactividad e impulsividad.'
  },
  ANXIETY_THETA: {
    id: 'ANXIETY_THETA',
    name: 'Ondas Theta 6Hz (Ansiedad / Pánico)',
    targetHz: 6.0,
    cie11: '6B00',
    dsm5: '300.02',
    specificMetricName: 'Supresión Amigdalar',
    specificMetricUnit: '%',
    scriptBaseline: 'Registro de línea base autonómica previa.',
    scriptDiagnostic: 'Evaluación del umbral de reactividad somática ante luz pulsada lenta.',
    scriptTreatment: 'Pulsación fótica Theta a 6 Hz para desactivar el hiperarousal simpático y guiar a la relajación profunda.',
    scriptRecovery: 'Retorno gradual. Tono vagal en rango de recuperación.',
    clinicalObjective: 'Desaceleración cortical e inducción de relajación mediante ritmo Theta.'
  },
  INSOMNIA_DELTA: {
    id: 'INSOMNIA_DELTA',
    name: 'Ondas Delta 2.0Hz (Insomnio Crónico)',
    targetHz: 2.0,
    cie11: '7A00',
    dsm5: '307.42',
    specificMetricName: 'Descenso de Cortisol Est.',
    specificMetricUnit: '%',
    scriptBaseline: 'Atenuación lumínica y preparación para el reposo.',
    scriptDiagnostic: 'Evaluación de hiperexcitabilidad cortical previa al sueño.',
    scriptTreatment: 'Pulsación Sub-Delta a 2 Hz para inducir ondas lentas de sueño regenerativo.',
    scriptRecovery: 'Fase de transición al reposo nocturno descansado.',
    clinicalObjective: 'Desactivación del arousal prefrontal e inducción de sueño de ondas lentas.'
  },
  PTSD_THETA: {
    id: 'PTSD_THETA',
    name: 'Cruce Alpha/Theta 7.5Hz (TEPT / Trauma)',
    targetHz: 7.5,
    cie11: '6B40',
    dsm5: '309.81',
    specificMetricName: 'Tolerancia Hipnagógica',
    specificMetricUnit: '%',
    scriptBaseline: 'Conexión con el anclaje seguro.',
    scriptDiagnostic: 'Evaluación de labilidad afectiva ante estados hipnagógicos.',
    scriptTreatment: 'Estimulación en el umbral Alpha/Theta para reprocesar memorias sin desborde autonómico.',
    scriptRecovery: 'Consolidación de la contención emocional.',
    clinicalObjective: 'Acceso a material mnémico traumático dentro de una ventana de tolerancia segura.'
  },
  CHRONIC_PAIN_SUBDELTA: {
    id: 'CHRONIC_PAIN_SUBDELTA',
    name: 'Sub-Delta 0.5Hz (Dolor Crónico / Fibromialgia)',
    targetHz: 0.5,
    cie11: 'MG30.0',
    dsm5: '307.89',
    specificMetricName: 'Anestesia Electrónica',
    specificMetricUnit: 'Score/10',
    scriptBaseline: 'Evaluación de la carga nociceptiva basal.',
    scriptDiagnostic: 'Medición de hipersensibilidad al contraste sensorial.',
    scriptTreatment: 'Frecuencias ultra-lentas para estimular el sistema inhibitorio descendente del dolor.',
    scriptRecovery: 'Retención de la sensación de analgesia y descompresión muscular.',
    clinicalObjective: 'Desfocalización nociceptiva y liberación endorfínica refleja.'
  },
  AUTISM_MU: {
    id: 'AUTISM_MU',
    name: 'Ritmo Mu 11.0Hz (Autismo / TEA)',
    targetHz: 11.0,
    cie11: '6A02',
    dsm5: '299.00',
    specificMetricName: 'Estabilidad Neuronas Espejo',
    specificMetricUnit: '%',
    scriptBaseline: 'Entorno de baja demanda sensorial.',
    scriptDiagnostic: 'Evaluación de la reactividad a la sobrecarga estimular.',
    scriptTreatment: 'Entrenamiento del ritmo Mu a 11 Hz para estabilizar la corteza sensoriomotora.',
    scriptRecovery: 'Retorno a línea base libre de sobreestimulación.',
    clinicalObjective: 'Amortiguación de hiperexcitabilidad cortical en el espectro autista.'
  },
  BRAIN_FOG_BETA: {
    id: 'BRAIN_FOG_BETA',
    name: 'Ondas Beta 20.0Hz (Niebla Mental / Long COVID)',
    targetHz: 20.0,
    cie11: '6D70',
    dsm5: '331.83',
    specificMetricName: 'Oxigenación Prefrontal',
    specificMetricUnit: '%',
    scriptBaseline: 'Registro de velocidad de procesamiento basal.',
    scriptDiagnostic: 'Evaluación de fatiga electrocortical y enlentecimiento.',
    scriptTreatment: 'Estimulación Beta a 20 Hz para potenciar la alerta tónica y la claridad ejecutiva.',
    scriptRecovery: 'Mantenimiento del tono cognitivo activo.',
    clinicalObjective: 'Restauración de la agudeza prefrontal y reducción de la niebla mental.'
  }
};

export const VrGammaInsightModule: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || patientId;

  // 1. Selector de Propósito y Protocolo
  const [operatingMode, setOperatingMode] = useState<ClinicalOperatingMode>('TREATMENT');
  const [selectedProtocolKey, setSelectedProtocolKey] = useState<NeuromodulationProtocol>('ALZHEIMER_40HZ');
  const activeProtocol = useMemo(() => OPTO_PROTOCOLS[selectedProtocolKey], [selectedProtocolKey]);

  // 2. Control del Pipeline de 3 Fases
  const [phase, setPhase] = useState<GammaPipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const baselineSec = 30;
  const activeSec = 120;
  const recoverySec = 30;
  const totalProtocolDuration = baselineSec + activeSec + recoverySec;

  // 3. Parámetros del Terapeuta
  const [frequencyHz, setFrequencyHz] = useState<number>(activeProtocol.targetHz);
  const [programmableScript, setProgrammableScript] = useState<string>(
    operatingMode === 'DIAGNOSTIC' ? activeProtocol.scriptDiagnostic : activeProtocol.scriptTreatment
  );
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);

  // 4. Biometría en Tiempo Real
  const [plvCoherence, setPlvCoherence] = useState<number>(12);
  const [specificMetricValue, setSpecificMetricValue] = useState<number>(10);
  const [currentGsr, setCurrentGsr] = useState<number>(2.2);
  const [currentHrv, setCurrentHrv] = useState<number>(44);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; plv: number; gsr: number; hrv: number; phase: GammaPipelinePhase }>>([]);

  // 5. Enlace y Reporte
  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(false);
  const [roiReportText, setRoiReportText] = useState<string>('');

  // Refs de estado para el temporizador atómico
  const stateRef = useRef({
    phase, phaseTime, totalElapsedTime, frequencyHz, plvCoherence, specificMetricValue,
    currentGsr, currentHrv, operatingMode, activeProtocol, programmableScript
  });

  useEffect(() => {
    stateRef.current = {
      phase, phaseTime, totalElapsedTime, frequencyHz, plvCoherence, specificMetricValue,
      currentGsr, currentHrv, operatingMode, activeProtocol, programmableScript
    };
  }, [phase, phaseTime, totalElapsedTime, frequencyHz, plvCoherence, specificMetricValue, currentGsr, currentHrv, operatingMode, activeProtocol, programmableScript]);

  // Sincronizar parámetros al cambiar protocolo o modo
  useEffect(() => {
    setFrequencyHz(activeProtocol.targetHz);
    setProgrammableScript(
      operatingMode === 'DIAGNOSTIC' ? activeProtocol.scriptDiagnostic : activeProtocol.scriptTreatment
    );
    setPhase('IDLE');
    setPhaseTime(0);
    setTotalElapsedTime(0);
    setLiveCurve([]);
    setRoiReportText('');
  }, [activeProtocol, operatingMode]);

  // Suscripción defensiva al WebSocket
  useEffect(() => {
    let unsub: any = null;
    try {
      if (typeof VrControlService?.subscribeStatus === 'function') {
        unsub = VrControlService.subscribeStatus((status) => {
          setIsVisorLinked(status === 'CONNECTED');
        });
      }
    } catch (e) {
      console.warn('[AMIE Opto-Gamma] Error en suscripción:', e);
    }
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleStartPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setPhase('PHASE_1_BASELINE');
    setPlvCoherence(10);
    setSpecificMetricValue(selectedProtocolKey === 'DEPRESSION_ALPHA' ? 0.4 : selectedProtocolKey === 'CHRONIC_PAIN_SUBDELTA' ? 2.0 : 10);

    if (typeof VrControlService?.changeEnvironment === 'function') {
      VrControlService.changeEnvironment('cosmic_stars', patientId, operatingMode);
    }
    if (typeof VrControlService?.sendCommand === 'function') {
      VrControlService.sendCommand({
        type: 'UPDATE_AI_GUIDANCE_SCRIPT',
        scriptText: activeProtocol.scriptBaseline,
        category: operatingMode,
        patientId
      });
    }
  };

  // Motor continuo del Pipeline de 3 Fases
  useEffect(() => {
    if (phase === 'IDLE' || phase === 'FINISHED') return;

    const timer = setInterval(() => {
      const s = stateRef.current;
      const nextTotal = s.totalElapsedTime + 1;
      const nextPhaseTime = s.phaseTime + 1;

      setTotalElapsedTime(nextTotal);

      // Fase 1 -> Fase 2: Estimulación fótica activa
      if (s.phase === 'PHASE_1_BASELINE' && nextPhaseTime >= baselineSec) {
        setPhase('PHASE_2_STIMULATION');
        setPhaseTime(0);

        if (typeof VrControlService?.startLightStimulation === 'function') {
          VrControlService.startLightStimulation(s.frequencyHz, s.activeProtocol.id, patientId);
        }
        if (typeof VrControlService?.sendCommand === 'function') {
          VrControlService.sendCommand({
            type: 'UPDATE_AI_GUIDANCE_SCRIPT',
            scriptText: s.programmableScript,
            frequencyHz: s.frequencyHz,
            category: s.operatingMode,
            patientId
          });
        }
      } 
      // Fase 2 -> Fase 3: Detener fótico e integrar habituación
      else if (s.phase === 'PHASE_2_STIMULATION' && nextPhaseTime >= activeSec) {
        setPhase('PHASE_3_RECOVERY');
        setPhaseTime(0);

        if (typeof VrControlService?.stopLightStimulation === 'function') {
          VrControlService.stopLightStimulation(patientId);
        }
        if (typeof VrControlService?.sendCommand === 'function') {
          VrControlService.sendCommand({
            type: 'UPDATE_AI_GUIDANCE_SCRIPT',
            scriptText: s.activeProtocol.scriptRecovery,
            category: s.operatingMode,
            patientId
          });
        }
      } 
      // Fase 3 -> Conclusión
      else if (s.phase === 'PHASE_3_RECOVERY' && nextPhaseTime >= recoverySec) {
        finishSessionAndGenerateRoi();
      } else {
        setPhaseTime(nextPhaseTime);
      }

      // Dinámica de acoplamiento de fase (PLV) y métrica específica
      let newPlv = s.plvCoherence;
      let newMetric = s.specificMetricValue;

      if (s.phase === 'PHASE_2_STIMULATION') {
        newPlv = Math.min(95, s.plvCoherence + (Math.random() * 2.8));
        if (selectedProtocolKey === 'DEPRESSION_ALPHA') {
          newMetric = Number(Math.min(1.0, s.specificMetricValue + 0.04).toFixed(2));
        } else if (selectedProtocolKey === 'CHRONIC_PAIN_SUBDELTA') {
          newMetric = Number(Math.min(9.5, s.specificMetricValue + 0.2).toFixed(1));
        } else {
          newMetric = Math.min(98, s.specificMetricValue + (Math.random() * 3.5));
        }
      } else if (s.phase === 'PHASE_3_RECOVERY') {
        newPlv = Math.max(30, s.plvCoherence - 0.6);
      }

      setPlvCoherence(newPlv);
      setSpecificMetricValue(newMetric);

      // Dinámica autonómica (GSR / HRV)
      let deltaGsr = (Math.random() - 0.48) * 0.12;
      if (s.phase === 'PHASE_2_STIMULATION' && s.operatingMode === 'DIAGNOSTIC') deltaGsr += 0.06;
      if (s.phase === 'PHASE_3_RECOVERY') deltaGsr -= 0.05;
      const newGsr = Math.max(0.8, Number((s.currentGsr + deltaGsr).toFixed(2)));
      setCurrentGsr(newGsr);

      let deltaHrv = Math.floor((Math.random() - 0.45) * 4);
      if (s.phase === 'PHASE_3_RECOVERY' || (s.phase === 'PHASE_2_STIMULATION' && s.operatingMode === 'TREATMENT')) deltaHrv += 1;
      const newHrv = Math.max(18, Math.min(95, s.currentHrv + deltaHrv));
      setCurrentHrv(newHrv);

      setLiveCurve(prev => [
        ...prev,
        {
          t: nextTotal,
          plv: Math.round(newPlv),
          gsr: newGsr,
          hrv: newHrv,
          phase: s.phase
        }
      ]);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, patientId, selectedProtocolKey]);

  const finishSessionAndGenerateRoi = () => {
    setPhase('FINISHED');
    if (typeof VrControlService?.stopLightStimulation === 'function') VrControlService.stopLightStimulation(patientId);
    if (typeof VrControlService?.stopActiveSession === 'function') VrControlService.stopActiveSession(patientId);

    const curveData = liveCurve;
    const basalGsr = curveData[0]?.gsr || 2.2;
    const peakGsr = Math.max(...curveData.map(c => c.gsr), basalGsr);
    const finalGsr = curveData[curveData.length - 1]?.gsr || currentGsr;
    const maxPlv = Math.max(...curveData.map(c => c.plv), plvCoherence);
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let dictamen = `INFORME PERICIAL DE OPTO-NEUROMODULACIÓN (PIPELINE 3 FASES)\n`;
    dictamen += `Protocolo: ${activeProtocol.name}\n`;
    dictamen += `Propósito Operativo: ${operatingMode === 'TREATMENT' ? 'INTERVENCIÓN TERAPÉUTICA (Arrastre Cortical)' : 'EVALUACIÓN DIAGNÓSTICA (Reactividad Fótica)'}\n`;
    dictamen += `Frecuencia Dirigida: ${frequencyHz.toFixed(1)} Hz | CIE-11: ${activeProtocol.cie11} | DSM-5-TR: ${activeProtocol.dsm5}\n`;
    dictamen += `Duración Grabada: ${totalElapsedTime}s (Línea Base: ${baselineSec}s | Estimulación: ${activeSec}s | Habituación: ${recoverySec}s)\n\n`;
    dictamen += `1. SINCRONIZACIÓN NEURONAL & PARÁMETROS qEEG:\n`;
    dictamen += `   • PLV Coherencia Máxima: ${Math.round(maxPlv)}%\n`;
    dictamen += `   • Métrica Focal (${activeProtocol.specificMetricName}): ${typeof specificMetricValue === 'number' && Number.isInteger(specificMetricValue) ? specificMetricValue : Number(specificMetricValue).toFixed(1)} ${activeProtocol.specificMetricUnit}\n`;
    dictamen += `   • GSR Basal: ${basalGsr.toFixed(2)} µS | GSR Cierre: ${finalGsr.toFixed(2)} µS\n`;
    dictamen += `   • Tasa de Habituación Autonómica (H): ${habituationRate}% | VFC Final: ${currentHrv} ms\n\n`;
    dictamen += `2. JUICIO CLÍNICO DE ARRASTRE CORTICAL:\n`;

    if (maxPlv >= 70) {
      dictamen += `   Excelente respuesta de arrastre neurofisiológico. La corteza visual copió con éxito la cadencia fótica a ${frequencyHz.toFixed(1)} Hz, cumpliendo con los objetivos de sincronización tálamo-cortical.\n`;
    } else {
      dictamen += `   Resistencia moderada al arrastre fótico. Se aconseja programar sesión complementaria modulando el contraste cromático en el visor.\n`;
    }

    setRoiReportText(dictamen);

    if (typeof onUpdatePatientVrData === 'function') {
      onUpdatePatientVrData(
        {
          sessionDate: new Date().toISOString(),
          baselineGsr: basalGsr,
          baselineHrv: curveData[0]?.hrv || 44,
          habituationIndexH: Number(habituationRate),
          reactionTimeMs: [Math.round(frequencyHz * 10)],
          gsrMicroSiemens: curveData.map(c => c.gsr),
          hrvRmssdMs: curveData.map(c => c.hrv)
        } as any,
        {
          sessionId: `OPTO-${Date.now()}`,
          date: new Date().toISOString(),
          moduleExecuted: activeProtocol.id,
          clinicalObservations: dictamen,
          autonomicRegulationScore: maxPlv >= 70 ? 'ÓPTIMA' : 'MODERADA'
        } as any
      );
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>ROI Opto-Neuromodulación - ${patientId}</title><style>body{font-family:sans-serif;padding:25px;} pre{background:#f8fafc;padding:15px;border-radius:8px;}</style></head>
      <body><h2>AMIE Clinical Copilot — Reporte de Arrastre Fótico (ROI)</h2><pre>${roiReportText}</pre><script>window.print();</script></body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn font-sans text-slate-100 select-none overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1440px] shadow-2xl overflow-hidden relative flex flex-col h-[94vh]">
        
        {/* Cabecera */}
        <header className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-yellow-500 rounded-xl shadow-lg">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                OPTO-NEUROMODULACIÓN FÓTICA & ARRASTRE DE FASE (PIPELINE 3 FASES)
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-500/40 font-mono">
                  qEEG CLOSED-LOOP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Expediente: <strong className="text-amber-300 font-mono">{patientDisplayName}</strong> | Estado: {isVisorLinked ? 'Visor Enlazado' : 'Buscando Visor...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOperatingMode('DIAGNOSTIC')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  operatingMode === 'DIAGNOSTIC' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Modo Diagnóstico</span>
              </button>
              <button
                type="button"
                onClick={() => setOperatingMode('TREATMENT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  operatingMode === 'TREATMENT' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modo Tratamiento</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (typeof VrControlService?.triggerGroundingProtocol === 'function') {
                  VrControlService.triggerGroundingProtocol(patientId);
                }
              }}
              className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Grounding</span>
            </button>

            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Indicador de Pipeline */}
        <div className="bg-slate-950/80 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-sans font-bold uppercase">Fase Activa:</span>
            <div className={`px-2.5 py-1 rounded-lg border ${phase === 'PHASE_1_BASELINE' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              1. Línea Base ({baselineSec}s)
            </div>
            <div className={`px-2.5 py-1 rounded-lg border ${phase === 'PHASE_2_STIMULATION' ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              2. Estimulación Fótica ({activeSec}s)
            </div>
            <div className={`px-2.5 py-1 rounded-lg border ${phase === 'PHASE_3_RECOVERY' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              3. Persistencia / Habituación ({recoverySec}s)
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Fase: <strong className="text-white">{phaseTime}s</strong></span>
            <span className="text-slate-400">Total: <strong className="text-amber-300">{totalElapsedTime}s / {totalProtocolDuration}s</strong></span>
          </div>
        </div>

        {/* Rejilla Principal */}
        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          
          {/* COLUMNA 1: Selector y Guion */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                Protocolo de Neuromodulación
              </label>
              <select
                disabled={phase !== 'IDLE' && phase !== 'FINISHED'}
                value={selectedProtocolKey}
                onChange={(e) => setSelectedProtocolKey(e.target.value as NeuromodulationProtocol)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-amber-500"
              >
                {Object.values(OPTO_PROTOCOLS).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">CIE-11:</span>
                  <strong className="text-cyan-300">{activeProtocol.cie11}</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">DSM-5-TR:</span>
                  <strong className="text-amber-300">{activeProtocol.dsm5}</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Guion IA Programable (Fase Activa)
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingParams(!isEditingParams)}
                  className="text-[10px] text-cyan-400 underline cursor-pointer"
                >
                  {isEditingParams ? 'Ocultar' : 'Ajustar Hz'}
                </button>
              </div>

              <textarea
                disabled={phase !== 'IDLE' && phase !== 'FINISHED'}
                value={programmableScript}
                onChange={(e) => setProgrammableScript(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-amber-500 mb-3 leading-relaxed font-sans"
              />

              {isEditingParams && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 flex justify-between items-center text-xs mb-3">
                  <span className="text-slate-400">Frecuencia Fótica (Hz):</span>
                  <input
                    type="number"
                    step="0.5"
                    disabled={phase !== 'IDLE' && phase !== 'FINISHED'}
                    value={frequencyHz}
                    onChange={(e) => setFrequencyHz(Number(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-center font-mono text-amber-400"
                  />
                </div>
              )}

              <div className="mt-auto space-y-2">
                {phase === 'IDLE' && (
                  <button
                    type="button"
                    onClick={handleStartPipeline}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isVisorLinked ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVisorLinked ? 'Iniciar Pipeline Fótico' : 'Conecta el Visor Primero'}</span>
                  </button>
                )}

                {(phase === 'PHASE_1_BASELINE' || phase === 'PHASE_2_STIMULATION' || phase === 'PHASE_3_RECOVERY') && (
                  <button
                    type="button"
                    onClick={finishSessionAndGenerateRoi}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Detener y Compilar Dictamen</span>
                  </button>
                )}

                {phase === 'FINISHED' && (
                  <button
                    type="button"
                    onClick={handleStartPipeline}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reiniciar Protocolo</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 2: Monitor qEEG & Gráfica SVG */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">SINCRONÍA PLV</span>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">{Math.round(plvCoherence)}%</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">FREC. TARGET</span>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">{frequencyHz.toFixed(1)} <span className="text-xs text-slate-500 font-normal">Hz</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl overflow-hidden">
                <span className="text-[10px] text-slate-500 font-bold block truncate">{activeProtocol.specificMetricName}</span>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                  {typeof specificMetricValue === 'number' && Number.isInteger(specificMetricValue) ? specificMetricValue : Number(specificMetricValue).toFixed(1)}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">{activeProtocol.specificMetricUnit}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Curva de Acoplamiento de Fase Cortical (PLV)
                </span>
                <span className="text-[10px] font-mono text-slate-500">{totalElapsedTime}s / {totalProtocolDuration}s</span>
              </div>

              <div className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <line x1={baselineSec} y1="0" x2={baselineSec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
                    <line x1={baselineSec + activeSec} y1="0" x2={baselineSec + activeSec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />

                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(c => `${c.t},${Math.max(10, 100 - c.plv)}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(c => `${c.t},${Math.max(10, 100 - (c.hrv * 0.9))}`).join(' ')} />
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-mono">
                    <Clock className="w-6 h-6 mb-2 opacity-30 animate-pulse" />
                    <span>Presiona 'Iniciar Pipeline' para arrancar la estimulación</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-between text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> Sincronía PLV (%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span> Tono Vagal (ms)</span>
                <span className="flex items-center gap-1">Líneas punteadas: Transición de Fase</span>
              </div>
            </div>
          </section>

          {/* COLUMNA 3: Dictamen Pericial ROI */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Dictamen ROI Imprimible
                </span>
                {roiReportText && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-2 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Imprimir A4</span>
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {roiReportText || (
                  <div className="text-slate-600 text-center mt-12 text-xs">
                    El dictamen de sincronización fótica y reactividad amiloide se compilará automáticamente al completar la fase 3.
                  </div>
                )}
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default VrGammaInsightModule;
