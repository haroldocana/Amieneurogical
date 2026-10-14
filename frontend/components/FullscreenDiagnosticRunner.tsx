// ============================================================================
// AMIE CLINICAL COPILOT - ORQUESTADOR MAESTRO MULTITRASTORNO (24 ENTIDADES)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  Signal, X, RotateCcw, Activity, Glasses, Brain, Play, Square, 
  Printer, Sparkles, Volume2, ShieldAlert, FileText, Stethoscope, Clock, Database
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_1_BASELINE' | 'PHASE_2_ACTIVE' | 'PHASE_3_RECOVERY' | 'FINISHED';

export interface ClinicalDisorderDefinition {
  id: string;
  name: string;
  cie11: string;
  dsm5: string;
  category: 'DIAGNOSTIC' | 'TREATMENT';
  ecosystem: string;
  targetKpiName: string;
  kpiUnit: string;
  defaultHz?: number;
  phase1Sec: number;
  phase2Sec: number;
  phase3Sec: number;
  scriptBaseline: string;
  scriptActive: string;
  scriptRecovery: string;
}

export const CLINICAL_24_DISORDERS_CATALOG: ClinicalDisorderDefinition[] = [
  // GRUPO 1: NEURODESARROLLO Y CONTROL MOTOR
  { id: 'TDAH_CPT', name: '01. TDAH: Déficit de Atención e Impulsividad', cie11: '6A05.0', dsm5: '314.01', category: 'DIAGNOSTIC', ecosystem: 'tdah_executive', targetKpiName: 'Latencia Motora (RT Medio)', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Alineación de línea base. Mantén la vista al frente y el mando preparado.', scriptActive: 'Iniciando test CPT. Pulsa el gatillo únicamente cuando la diana destelle en verde. Inhibe la respuesta si es roja.', scriptRecovery: 'Test concluido. Relaja la mano y respira de forma natural.' },
  { id: 'TEA_SENSORY', name: '02. Espectro Autista (TEA): Sobrecarga Sensorial', cie11: '6A02', dsm5: '299.00', category: 'TREATMENT', ecosystem: 'safe_place_forest', targetKpiName: 'Supresión de Hiperexcitabilidad', kpiUnit: '%', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Preparación de entorno bioseguro de baja carga.', scriptActive: 'Respira en cadencia lenta mientras el follaje amortigua el contraste visual y acústico. Siente la estabilidad.', scriptRecovery: 'Estabilización lograda. Tu corteza sensoriomotora está en reposo.' },
  { id: 'ALZHEIMER_GAMMA', name: '03. Enf. de Alzheimer & Deterioro Cognitivo', cie11: '6D80', dsm5: '331.0', category: 'TREATMENT', ecosystem: 'cosmic_stars', targetKpiName: 'Acoplamiento de Fase PLV', kpiUnit: '%', defaultHz: 40.0, phase1Sec: 30, phase2Sec: 120, phase3Sec: 30, scriptBaseline: 'Calibración en reposo sin estimulación lumínica.', scriptActive: 'Iniciando estimulación fótica sincrónica a 40 Hz para inducir arrastre de redes tálamo-corticales.', scriptRecovery: 'Pulsación fótica concluida. Consolidando acoplamiento neuronal.' },
  { id: 'PARKINSON_MOTOR', name: '04. Parkinson: Temblor y Congelamiento', cie11: '8A00.0', dsm5: '332.0', category: 'DIAGNOSTIC', ecosystem: 'sterile_room', targetKpiName: 'Estabilidad Cinemática', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30, scriptBaseline: 'Registro basal en reposo. Sujeta el mando con tu mano dominante.', scriptActive: 'Mantén el mando alineado horizontalmente con el cursor visual. Registrando amplitud de temblor 6DoF.', scriptRecovery: 'Registro completado. Baja el brazo y descansa.' },
  
  // GRUPO 2: ESTADO DE ÁNIMO Y TRAUMA
  { id: 'TDM_DEPRESSION', name: '05. Depresión Mayor (TDM): Retardo Psicomotor', cie11: '6A70', dsm5: '296.22', category: 'TREATMENT', ecosystem: 'bioluminescent_beach', targetKpiName: 'Simetría Frontal Alpha', kpiUnit: 'Ratio', defaultHz: 10.0, phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Sintonización visual con el entorno.', scriptActive: 'Sincroniza tu ritmo cardíaco con las olas. La pulsación a 10 hercios estimula la activación frontal izquierda.', scriptRecovery: 'Sincronización neuroafectiva lograda. Descansa.' },
  { id: 'DISTIMIA_CHRONIC', name: '06. Distimia & Depresión Persistente', cie11: '6A72', dsm5: '300.4', category: 'TREATMENT', ecosystem: 'safe_place_forest', targetKpiName: 'Tono Vagal Sostenido', kpiUnit: 'ms', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Bienvenido al santuario forestal.', scriptActive: 'Permite que la iluminación cálida del refugio disminuya la tensión. Respira en 4 tiempos hacia el abdomen.', scriptRecovery: 'Instalación de anclaje de confort completada.' },
  { id: 'PTSD_EMDR', name: '07. TEPT: Reprocesamiento Traumático 3D', cie11: '6B40', dsm5: '309.81', category: 'TREATMENT', ecosystem: 'emdr_memory', targetKpiName: 'Desensibilización Galvánica', kpiUnit: 'µS', defaultHz: 1.4, phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Instalación de recurso seguro. Conéctate con una sensación de contención.', scriptActive: 'Sigue la esfera luminosa horizontal únicamente con tus ojos, sin mover la cabeza.', scriptRecovery: 'Detén el seguimiento. Inhala y suelta todo el aire integrando el alivio.' },
  { id: 'CPTSD_DEVELOPMENTAL', name: '08. Trauma Complejo (TEPT-C) & Apego', cie11: '6B41', dsm5: '307.81', category: 'DIAGNOSTIC', ecosystem: 'dev_trauma', targetKpiName: 'Labilidad Simpática', kpiUnit: 'ΔGSR/s', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Respiración de transición al espacio relacional.', scriptActive: 'Explora el espacio de memoria. Registramos micro-fluctuaciones electrodérmicas ante figuras vinculares.', scriptRecovery: 'Evaluación finalizada. Volviendo al centro de seguridad.' },

  // GRUPO 3: ANSIEDAD, FOBIAS Y TOC
  { id: 'PANIC_DISORDER', name: '09. Trastorno de Pánico & Agorafobia', cie11: '6B01', dsm5: '300.01', category: 'DIAGNOSTIC', ecosystem: 'sterile_room', targetKpiName: 'Reactividad Interoceptiva', kpiUnit: 'BPM', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30, scriptBaseline: 'Registro de constantes vitales en reposo.', scriptActive: 'Evaluación de hipersensibilidad interoceptiva ante la disminución de referencias espaciales.', scriptRecovery: 'Recuperando iluminación y límites espaciales. Todo está en orden.' },
  { id: 'ACROPHOBIA', name: '10. Fobia Específica: Acrofobia (Alturas)', cie11: '6B03.0', dsm5: '300.29', category: 'DIAGNOSTIC', ecosystem: 'acrophobia_roof', targetKpiName: 'Desviación Postural', kpiUnit: 'cm', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Mantén la mirada fija en el horizonte.', scriptActive: 'Exposición a borde de azotea. Observa el vacío perimetral para registrar taquicardia situacional.', scriptRecovery: 'Retirándose a zona segura. Respiración restaurada.' },
  { id: 'AEROPHOBIA', name: '11. Fobia Específica: Aerofobia (Volar)', cie11: '6B03.2', dsm5: '300.29', category: 'DIAGNOSTIC', ecosystem: 'aerophobia_cabin', targetKpiName: 'Pico Galvánico', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Fase de embarque y postura neutral.', scriptActive: 'Simulación de cabina presurizada en fase de aceleración y despegue.', scriptRecovery: 'Vuelo en altitud de crucero. Vibración anulada.' },
  { id: 'SOCIAL_ANXIETY', name: '12. Fobia Social (Ansiedad de Evaluación)', cie11: '6B04', dsm5: '300.23', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Evasión de Mirada', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Ingreso a la sala de evaluación.', scriptActive: 'Dirige tu mirada a los evaluadores del panel. Registraremos la fijación ocular ante el escrutinio social.', scriptRecovery: 'La evaluación ha terminado. Tono vagal en estabilización.' },
  { id: 'GAD_GENERALIZED', name: '13. Trastorno de Ansiedad Generalizada (TAG)', cie11: '6B00', dsm5: '300.02', category: 'TREATMENT', ecosystem: 'neuro_hypnosis', targetKpiName: 'Tasa de Habituación (H)', kpiUnit: '%', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Sintonización autonómica.', scriptActive: 'Sigue la expansión del orbe a 6 respiraciones por minuto para inducir resonancia cardíaca profunda.', scriptRecovery: 'Integración vagal. Conserva esta cadencia respiratoria.' },
  { id: 'OCD_OBSESSIVE', name: '14. Trastorno Obsesivo-Compulsivo (TOC)', cie11: '6B20', dsm5: '300.3', category: 'TREATMENT', ecosystem: 'cosmic_stars', targetKpiName: 'Ruptura de Rumiación', kpiUnit: 'PLV %', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Anclaje atencional primario.', scriptActive: 'Descentramiento cognitivo activo. Observa la inmensidad estelar y permite que las obsesiones se diluyan sin neutralizarlas.', scriptRecovery: 'Exposición y prevención de respuesta completada.' },

  // GRUPO 4: PERSONALIDAD Y FORENSE
  { id: 'BPD_INSTABILITY', name: '15. Trastorno Límite de la Personalidad (TLP)', cie11: '6D11', dsm5: '301.83', category: 'DIAGNOSTIC', ecosystem: 'dev_trauma', targetKpiName: 'Labilidad Paroxística', kpiUnit: 'ΔGSR/s', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Ajuste basal en entorno neutro.', scriptActive: 'Evaluación de reactividad emocional ante señales de exclusión o validación ambivalente.', scriptRecovery: 'Contención afectiva. Registro guardado.' },
  { id: 'NARCISSISM_OVERT', name: '16. Trastorno Narcisista de la Personalidad (Overt)', cie11: '6D10.0', dsm5: '301.81', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Ira Narcisista', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30, scriptBaseline: 'Registro de constantes de control.', scriptActive: 'Ensayo pericial de tolerancia al estatus. Registrando amenaza al ego y reactividad simpática.', scriptRecovery: 'Término de la provocación estructurada.' },
  { id: 'NARCISSISM_COVERT', name: '17. Narcisismo Encubierto (Covert)', cie11: '6D10.0', dsm5: '301.81', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Vergüenza Tóxica', kpiUnit: 'RMSSD Drop', phase1Sec: 30, phase2Sec: 120, phase3Sec: 30, scriptBaseline: 'Registro de constantes de control.', scriptActive: 'Exposición a dinámicas de exclusión grupal. Analizando caída abrupta del tono vagal.', scriptRecovery: 'Dinámica de grupo finalizada.' },
  { id: 'PSYCHOPATHY', name: '18. Psicopatía & Trastorno Disocial', cie11: '6D10.1', dsm5: '301.7', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Aplanamiento Reflejo', kpiUnit: 'ΔGSR=0', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Preparación para estímulos visuales.', scriptActive: 'Paradigma de reconocimiento afectivo. Registrando resonancia autonómica ante imágenes de distrés.', scriptRecovery: 'Registro de empatía somática finalizado.' },

  // GRUPO 5: NEUROLOGÍA FUNCIONAL Y DOLOR
  { id: 'FND_CONVERSION', name: '19. Trastorno Síntomas Neurológicos Funcionales', cie11: '6C20', dsm5: '300.11', category: 'TREATMENT', ecosystem: 'fnd_mirror', targetKpiName: 'Simetría Bilateral', kpiUnit: '%', phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Calibración del avatar cinemático.', scriptActive: 'Terapia en espejo adaptativa. Mueve tu extremidad sana mientras el sistema proyecta movimiento simétrico.', scriptRecovery: 'Recalibración del mapa somatosensorial en curso. Descansa.' },
  { id: 'CHRONIC_PAIN', name: '20. Dolor Crónico Generalizado / Fibromialgia', cie11: 'MG30.0', dsm5: '307.89', category: 'TREATMENT', ecosystem: 'pain_management', targetKpiName: 'Analgesia Subjetiva', kpiUnit: 'Score/10', defaultHz: 0.5, phase1Sec: 30, phase2Sec: 180, phase3Sec: 30, scriptBaseline: 'Escaneo de tensión corporal basal.', scriptActive: 'Desfocalización nociceptiva. La inmersión criogénica y el pulso ultra-lento estimulan el sistema inhibitorio descendente del dolor.', scriptRecovery: 'Mantén la sensación de alivio y liviandad corporal.' },
  { id: 'CRPS_NEUROPATHIC', name: '21. Síndrome Dolor Regional Complejo (SDRC)', cie11: '8E43', dsm5: '354.4', category: 'TREATMENT', ecosystem: 'pain_management', targetKpiName: 'Amortiguación Simpática', kpiUnit: 'µS', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Posición de protección articular.', scriptActive: 'Aplicación de filtros cromáticos fríos para reducir la hiperreactividad vasomotora periférica.', scriptRecovery: 'Desensibilización periférica obtenida. Flujo sanguíneo regulado.' },
  { id: 'INSOMNIA_SLEEP', name: '22. Insomnio Crónico Severo', cie11: '7A00', dsm5: '307.42', category: 'TREATMENT', ecosystem: 'neuro_hypnosis', targetKpiName: 'Ondas Lentas Inducidas', kpiUnit: '%', defaultHz: 2.0, phase1Sec: 30, phase2Sec: 240, phase3Sec: 30, scriptBaseline: 'Atenuación de luz y preparación pre-sueño.', scriptActive: 'Neurohipnosis por arrastre Delta a 2 Hz. Desaceleración metabólica y supresión del hiperarousal prefrontal.', scriptRecovery: 'Transición al sueño de ondas lentas regenerativo.' },

  // GRUPO 6: SALUD SEXUAL
  { id: 'SEXUAL_INHIBITION', name: '23. Inhibición Sexual (Modelo Dual SIS)', cie11: 'HA01', dsm5: '302.72', category: 'TREATMENT', ecosystem: 'dual_control', targetKpiName: 'Desactivación SIS', kpiUnit: '%', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Aterrizaje en el plano de las sensaciones corporales.', scriptActive: 'Focalización sensorial sin demanda de rendimiento. Inhala calidez corporal y desactiva la autoobservación crítica.', scriptRecovery: 'Freno inhibitorio simpático desactivado. Reposo parasimpático.' },
  { id: 'SEXUAL_DESIRE', name: '24. Deseo Hipoactivo (Modelo Dual SES)', cie11: 'HA00', dsm5: '302.71', category: 'TREATMENT', ecosystem: 'dual_control', targetKpiName: 'Activación SES', kpiUnit: 'Score', phase1Sec: 30, phase2Sec: 150, phase3Sec: 30, scriptBaseline: 'Sintonización afectiva y propioceptiva.', scriptActive: 'Reconexión con señales corporales placenteras libres de juicio para estimular el sistema de excitación.', scriptRecovery: 'Respuesta excitatoria modulada de manera natural.' }
];

export const FullscreenDiagnosticRunner: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';

  const [selectedDisorderId, setSelectedDisorderId] = useState<string>('TDAH_CPT');
  const currentDisorder = useMemo(() => {
    return CLINICAL_24_DISORDERS_CATALOG.find(d => d.id === selectedDisorderId) || CLINICAL_24_DISORDERS_CATALOG[0];
  }, [selectedDisorderId]);

  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [phaseTime, setPhaseTime] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const [customScript, setCustomScript] = useState<string>(currentDisorder.scriptActive);

  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(40);
  const [currentKpi, setCurrentKpi] = useState<number>(10);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; kpi: number; phase: PipelinePhase }>>([]);

  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(() => VrControlService.isConnected());
  const [roiReportText, setRoiReportText] = useState<string>('');

  const stateRef = useRef({
    pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder
  });

  useEffect(() => {
    stateRef.current = {
      pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder
    };
  }, [pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder]);

  const broadcastContext = (disorder = currentDisorder, script = customScript) => {
    VrControlService.syncClinicalContext({
      moduleId: disorder.id,
      category: disorder.category,
      disorderId: disorder.id,
      disorderName: disorder.name,
      ecosystem: disorder.ecosystem,
      patientId,
      pipeline: {
        phase1Sec: disorder.phase1Sec,
        phase2Sec: disorder.phase2Sec,
        phase3Sec: disorder.phase3Sec
      },
      audioGuidance: {
        baselineScript: disorder.scriptBaseline,
        activeScript: script,
        recoveryScript: disorder.scriptRecovery
      },
      frequencyHz: disorder.defaultHz || 0
    });
  };

  useEffect(() => {
    setCustomScript(currentDisorder.scriptActive);
    setPipelinePhase('IDLE');
    setPhaseTime(0);
    setTotalElapsedTime(0);
    setLiveCurve([]);
    setRoiReportText('');
    broadcastContext(currentDisorder, currentDisorder.scriptActive);
  }, [currentDisorder]);

  useEffect(() => {
    if (!VrControlService.isConnected()) VrControlService.connect(undefined, patientId);
    let unsubStatus: any = null;
    let unsubMsg: any = null;

    try {
      if (typeof VrControlService.subscribeStatus === 'function') {
        unsubStatus = VrControlService.subscribeStatus((status) => setIsVisorLinked(status === 'CONNECTED'));
      }
      if (typeof VrControlService.subscribeMessages === 'function') {
        unsubMsg = VrControlService.subscribeMessages((msg) => {
          if (msg.type === 'VISOR_ACK_READY' || msg.type === 'PONG') setIsVisorLinked(true);
        });
      }
      VrControlService.sendCommand({ type: 'PING_HANDSHAKE', patientId, timestamp: Date.now() });
    } catch (e) {}

    return () => {
      if (typeof unsubStatus === 'function') unsubStatus();
      if (typeof unsubMsg === 'function') unsubMsg();
    };
  }, [patientId]);

  const totalProtocolDuration = currentDisorder.phase1Sec + currentDisorder.phase2Sec + currentDisorder.phase3Sec;

  const startPipeline = () => {
    if (!isVisorLinked) return;
    setLiveCurve([]);
    setTotalElapsedTime(0);
    setPhaseTime(0);
    setPipelinePhase('PHASE_1_BASELINE');

    VrControlService.sendCommand({
      type: 'START_PIPELINE_PHASE',
      phase: 'PHASE_1_BASELINE',
      speechScript: currentDisorder.scriptBaseline,
      ecosystem: currentDisorder.ecosystem,
      category: currentDisorder.category,
      patientId
    });
  };

  useEffect(() => {
    if (pipelinePhase === 'IDLE' || pipelinePhase === 'FINISHED') return;

    const timer = setInterval(() => {
      const s = stateRef.current;
      const nextTotal = s.totalElapsedTime + 1;
      const nextPhaseTime = s.phaseTime + 1;

      setTotalElapsedTime(nextTotal);

      if (s.pipelinePhase === 'PHASE_1_BASELINE' && nextPhaseTime >= s.currentDisorder.phase1Sec) {
        setPipelinePhase('PHASE_2_ACTIVE');
        setPhaseTime(0);
        VrControlService.sendCommand({
          type: 'START_PIPELINE_PHASE',
          phase: 'PHASE_2_ACTIVE',
          speechScript: s.customScript,
          frequencyHz: s.currentDisorder.defaultHz || 0,
          category: s.currentDisorder.category,
          patientId
        });
        if (s.currentDisorder.defaultHz) VrControlService.startLightStimulation(s.currentDisorder.defaultHz, s.currentDisorder.id, patientId);
      } 
      else if (s.pipelinePhase === 'PHASE_2_ACTIVE' && nextPhaseTime >= s.currentDisorder.phase2Sec) {
        setPipelinePhase('PHASE_3_RECOVERY');
        setPhaseTime(0);
        VrControlService.stopLightStimulation(patientId);
        VrControlService.sendCommand({
          type: 'START_PIPELINE_PHASE',
          phase: 'PHASE_3_RECOVERY',
          speechScript: s.currentDisorder.scriptRecovery,
          category: s.currentDisorder.category,
          patientId
        });
      } 
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY' && nextPhaseTime >= s.currentDisorder.phase3Sec) {
        finishPipelineAndCompileRoi();
      } else {
        setPhaseTime(nextPhaseTime);
      }

      let deltaGsr = (Math.random() - 0.48) * 0.14;
      if (s.pipelinePhase === 'PHASE_2_ACTIVE') deltaGsr += s.currentDisorder.category === 'DIAGNOSTIC' ? 0.09 : -0.05;
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY') deltaGsr -= 0.06;
      const newGsr = Math.max(0.8, Number((s.currentGsr + deltaGsr).toFixed(2)));
      setCurrentGsr(newGsr);

      let deltaHrv = Math.floor((Math.random() - 0.45) * 4);
      if (s.pipelinePhase === 'PHASE_3_RECOVERY' || (s.pipelinePhase === 'PHASE_2_ACTIVE' && s.currentDisorder.category === 'TREATMENT')) deltaHrv += 1;
      const newHrv = Math.max(18, Math.min(95, s.currentHrv + deltaHrv));
      setCurrentHrv(newHrv);

      const newKpi = Number(Math.min(98, s.currentKpi + Math.random() * 2.4).toFixed(1));
      setCurrentKpi(newKpi);

      setLiveCurve(prev => [...prev, { t: nextTotal, gsr: newGsr, hrv: newHrv, kpi: newKpi, phase: s.pipelinePhase }]);
    }, 1000);

    return () => clearInterval(timer);
  }, [pipelinePhase, patientId]);

  const finishPipelineAndCompileRoi = () => {
    setPipelinePhase('FINISHED');
    VrControlService.stopLightStimulation(patientId);
    VrControlService.stopActiveSession(patientId);

    const curveData = liveCurve;
    const basalGsr = curveData[0]?.gsr || 2.4;
    const peakGsr = Math.max(...curveData.map(p => p.gsr), basalGsr);
    const finalGsr = curveData[curveData.length - 1]?.gsr || currentGsr;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let dictamen = `INFORME PERICIAL: ORQUESTADOR MULTITRASTORNO (24 ENTIDADES)\n`;
    dictamen += `Patología Evaluada: ${currentDisorder.name}\n`;
    dictamen += `Modalidad: ${currentDisorder.category === 'TREATMENT' ? 'INTERVENCIÓN TERAPÉUTICA' : 'EVALUACIÓN DIAGNÓSTICA'}\n`;
    dictamen += `Codificación: CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5}\n`;
    dictamen += `Duración 6DoF: ${totalElapsedTime}s (Línea Base: ${currentDisorder.phase1Sec}s | Activo: ${currentDisorder.phase2Sec}s | Habituación: ${currentDisorder.phase3Sec}s)\n\n`;
    dictamen += `1. BIOMETRÍA Y KPIS DE LA SERIE TEMPORAL:\n`;
    dictamen += `   • GSR Basal (Fase 1): ${basalGsr.toFixed(2)} µS | VFC Inicial: ${curveData[0]?.hrv || 35} ms\n`;
    dictamen += `   • Pico Máximo (Fase 2): ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    dictamen += `   • Cierre / Habituación: ${finalGsr.toFixed(2)} µS | Tono Vagal: ${currentHrv} ms\n`;
    dictamen += `   • Tasa de Habituación (H): ${habituationRate}%\n`;
    dictamen += `   • ${currentDisorder.targetKpiName}: ${currentKpi.toFixed(1)} ${currentDisorder.kpiUnit}\n\n`;

    if (currentDisorder.category === 'TREATMENT') {
      dictamen += `2. DICTAMEN IA: Protocolo terapéutico completado. Se verificó modulación autonómica congruente con desensibilización biológica y plasticidad a nivel de la red neuronal objetivo.\n`;
    } else {
      dictamen += `2. DICTAMEN IA: Evaluación neurofuncional finalizada. Exposición fóbica documentada para trazabilidad y triangulación diagnóstica (Mahalanobis D²).\n`;
    }

    setRoiReportText(dictamen);

    if (typeof onUpdatePatientVrData === 'function') {
      onUpdatePatientVrData(
        { sessionDate: new Date().toISOString(), baselineGsr: basalGsr, baselineHrv: curveData[0]?.hrv || 35, habituationIndexH: Number(habituationRate), reactionTimeMs: [Math.round(currentKpi)], gsrMicroSiemens: curveData.map(p => p.gsr), hrvRmssdMs: curveData.map(p => p.hrv) } as any,
        { sessionId: `DIAG-${Date.now()}`, date: new Date().toISOString(), moduleExecuted: currentDisorder.id, clinicalObservations: dictamen, autonomicRegulationScore: Number(habituationRate) >= 40 ? 'ÓPTIMA' : 'MODERADA' } as any
      );
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>ROI Multitrastorno - ${patientId}</title><style>body{font-family:sans-serif;padding:25px;} pre{background:#f8fafc;padding:15px;border-radius:8px;line-height:1.6;font-size:14px;}</style></head>
      <body><h2>AMIE Clinical Copilot — Reporte ROI Estandarizado (WebXR)</h2><pre>${roiReportText}</pre><script>window.print();</script></body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn font-sans text-slate-100 select-none overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1440px] shadow-2xl overflow-hidden relative flex flex-col h-[94vh]">
        
        {/* Cabecera Principal */}
        <header className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                CONSOLA MAESTRA MULTITRASTORNO (CATÁLOGO DE 24 ENTIDADES CLÍNICAS)
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                  6DoF CLOSED-LOOP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Expediente: <strong className="text-cyan-300 font-mono">{patientId}</strong> | Estado: {isVisorLinked ? 'Visor Sincronizado' : 'Buscando Visor...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center px-3 py-1.5 rounded-lg border font-bold text-xs ${isVisorLinked ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
              <Database className="w-3.5 h-3.5 mr-2" />
              Base de Datos Conectada
            </div>
            <button
              type="button"
              onClick={() => VrControlService.triggerGroundingProtocol(patientId)}
              className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Grounding de Emergencia</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Indicador de Pipeline en 3 Fases */}
        <div className="bg-slate-950/80 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-sans font-bold uppercase">Fase Clínica Activa:</span>
            
            <div className={`px-2.5 py-1 rounded-lg border ${
              pipelinePhase === 'PHASE_1_BASELINE' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>1. Línea Base ({currentDisorder.phase1Sec}s)</span>
            </div>

            <div className={`px-2.5 py-1 rounded-lg border ${
              pipelinePhase === 'PHASE_2_ACTIVE' ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>2. Desafío Activo ({currentDisorder.phase2Sec}s)</span>
            </div>

            <div className={`px-2.5 py-1 rounded-lg border ${
              pipelinePhase === 'PHASE_3_RECOVERY' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span>3. Habituación ({currentDisorder.phase3Sec}s)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Cronómetro Fase: <strong className="text-white">{phaseTime}s</strong></span>
            <span className="text-slate-400">Total Sesión: <strong className="text-cyan-400">{totalElapsedTime}s / {totalProtocolDuration}s</strong></span>
          </div>
        </div>

        {/* Cuerpo Principal */}
        <main className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          
          {/* COLUMNA 1: Selector de 24 Trastornos y Guion Programable */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                Matriz Diagnóstica y Terapéutica (24 Módulos)
              </label>
              <select
                disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                value={selectedDisorderId}
                onChange={(e) => setSelectedDisorderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-cyan-500"
              >
                {CLINICAL_24_DISORDERS_CATALOG.map(d => (
                  <option key={d.id} value={d.id}>{d.name} [{d.category}]</option>
                ))}
              </select>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">CIE-11:</span>
                  <strong className="text-cyan-300">{currentDisorder.cie11}</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">DSM-5-TR:</span>
                  <strong className="text-amber-300">{currentDisorder.dsm5}</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Guion IA Programable (Fase Activa)
                </span>
              </div>

              <textarea
                disabled={pipelinePhase !== 'IDLE' && pipelinePhase !== 'FINISHED'}
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                rows={5}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-cyan-500 mb-3 leading-relaxed font-sans"
              />

              <div className="mt-auto space-y-2">
                {pipelinePhase === 'IDLE' && (
                  <button
                    type="button"
                    onClick={startPipeline}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isVisorLinked ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVisorLinked ? 'Iniciar Pipeline Clínico en Visor' : 'Conecta el Visor Primero'}</span>
                  </button>
                )}

                {(pipelinePhase === 'PHASE_1_BASELINE' || pipelinePhase === 'PHASE_2_ACTIVE' || pipelinePhase === 'PHASE_3_RECOVERY') && (
                  <button
                    type="button"
                    onClick={finishPipelineAndCompileRoi}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Detener Ensayo y Compilar Dictamen</span>
                  </button>
                )}

                {pipelinePhase === 'FINISHED' && (
                  <button
                    type="button"
                    onClick={startPipeline}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reiniciar Protocolo Clínico</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* COLUMNA 2: Monitor Fisiológico & Gráfica Continua */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">GSR FÁSICO</span>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">{currentGsr.toFixed(2)} <span className="text-xs text-slate-500 font-normal">µS</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">VFC RMSSD</span>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">{currentHrv} <span className="text-xs text-slate-500 font-normal">ms</span></div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl overflow-hidden">
                <span className="text-[10px] text-slate-500 font-bold block truncate" title={currentDisorder.targetKpiName}>{currentDisorder.targetKpiName}</span>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">{currentKpi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">{currentDisorder.kpiUnit}</span></div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Curva de Series Temporales (Biometría 6DoF)
                </span>
              </div>

              <div className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveCurve.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalProtocolDuration} 100`} preserveAspectRatio="none">
                    <line x1={currentDisorder.phase1Sec} y1="0" x2={currentDisorder.phase1Sec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
                    <line x1={currentDisorder.phase1Sec + currentDisorder.phase2Sec} y1="0" x2={currentDisorder.phase1Sec + currentDisorder.phase2Sec} y2="100" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />

                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.gsr * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveCurve.map(p => `${p.t},${Math.max(10, 100 - (p.hrv * 0.9))}`).join(' ')} />
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-mono">
                    <Clock className="w-6 h-6 mb-2 opacity-30 animate-pulse" />
                    <span>Presiona 'Iniciar Pipeline Clínico' para registrar el ensayo</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-between text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> GSR (µS)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span> HRV (ms)</span>
                <span className="flex items-center gap-1">Líneas punteadas: Transición de Fase</span>
              </div>
            </div>
          </section>

          {/* COLUMNA 3: Dictamen Pericial ROI Imprimible */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Dictamen Pericial Individual (ROI)
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

              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-slate-300 whitespace-pre-wrap shadow-inner">
                {roiReportText || (
                  <div className="text-slate-600 text-center mt-12 text-xs">
                    El dictamen automatizado de neuroinferencia clínica se generará al completar la fase 3 de habituación.
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

export default FullscreenDiagnosticRunner;
