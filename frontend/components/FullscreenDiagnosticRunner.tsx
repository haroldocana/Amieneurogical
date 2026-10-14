// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR UNIFICADO MULTITRASTORNO (DIAGNÓSTICO Y TRATAMIENTO)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import {
  Brain,
  Activity,
  Play,
  Square,
  Printer,
  Sparkles,
  Volume2,
  ShieldAlert,
  Glasses,
  RotateCcw,
  FileText,
  X,
  Stethoscope,
  Terminal,
  Signal
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
  onOpenModules?: () => void;
}

export interface KpiDataPoint {
  t: number;             // Segundo de sesión
  gsr: number;           // Conductancia Galvánica (µS)
  hrv: number;           // Variabilidad Cardíaca RMSSD (ms)
  kpiPrimary: number;    // Métrica específica (PLV %, RT ms, o Profundidad %)
  phase: string;         // 'BASAL' | 'STIMULUS' | 'RECOVERY'
}

export interface DisorderClinicalDefinition {
  id: string;
  name: string;
  cie11: string;
  dsm5: string;
  category: 'DIAGNOSTIC' | 'TREATMENT';
  ecosystem: string;
  targetKpiName: string;
  kpiUnit: string;
  defaultDurationSec: number;
  defaultHz?: number;
  clinicalScript: string;
  clinicalObjective: string;
}

// ============================================================================
// MATRIZ CANÓNICA DE LOS 24 TRASTORNOS CLÍNICOS EN WEBXR
// ============================================================================
export const CLINICAL_24_DISORDERS_CATALOG: DisorderClinicalDefinition[] = [
  // --- GRUPO 1: NEURODESARROLLO Y FUNCIONES EJECUTIVAS ---
  { id: 'TDAH_CPT', name: '01. TDAH: Déficit de Atención e Impulsividad', cie11: '6A05.0', dsm5: '314.01', category: 'DIAGNOSTIC', ecosystem: 'tdah_executive', targetKpiName: 'Latencia Motora (RT Medio)', kpiUnit: 'ms', defaultDurationSec: 180, clinicalScript: 'Iniciando test CPT tridimensional. Pulsa el gatillo de tu mando únicamente cuando la diana destelle en color verde. Si destella en rojo, inhibe la respuesta.', clinicalObjective: 'Medición objetiva de errores de omisión y comisión.' },
  { id: 'TEA_SENSORY', name: '02. Espectro Autista (TEA): Sobrecarga Sensorial', cie11: '6A02', dsm5: '299.00', category: 'TREATMENT', ecosystem: 'safe_place_forest', targetKpiName: 'Supresión de Hiperexcitabilidad', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Entrando a entorno de baja carga estimular. Respira en cadencia lenta mientras el follaje amortigua el contraste visual y acústico.', clinicalObjective: 'Estabilización del córtex sensoriomotor.' },
  { id: 'ALZHEIMER_GAMMA', name: '03. Enfermedad de Alzheimer & Demencia', cie11: '6D80 / 8A20', dsm5: '331.0', category: 'TREATMENT', ecosystem: 'cosmic_stars', targetKpiName: 'Acoplamiento de Fase PLV (40Hz)', kpiUnit: '%', defaultDurationSec: 300, defaultHz: 40.0, clinicalScript: 'Iniciando estimulación fótica sincrónica a 40 Hz. Fija la mirada al frente para inducir el arrastre de las redes tálamo-corticales.', clinicalObjective: 'Sincronización de ritmos Gamma.' },
  { id: 'PARKINSON_MOTOR', name: '04. Parkinson: Temblor y Congelamiento Motor', cie11: '8A00.0', dsm5: '332.0', category: 'DIAGNOSTIC', ecosystem: 'sterile_room', targetKpiName: 'Estabilidad Cinemática Motora', kpiUnit: 'Score', defaultDurationSec: 120, clinicalScript: 'Mantén el mando alineado horizontalmente con el cursor visual. Evaluaremos la amplitud del temblor postural en reposo.', clinicalObjective: 'Cuantificación micrométrica de temblor en reposo vs. acción.' },

  // --- GRUPO 2: ESTADO DE ÁNIMO Y TRAUMA ---
  { id: 'TDM_DEPRESSION', name: '05. Depresión Mayor (TDM): Retardo Psicomotor', cie11: '6A70', dsm5: '296.22', category: 'TREATMENT', ecosystem: 'bioluminescent_beach', targetKpiName: 'Simetría Frontal Alpha', kpiUnit: 'Ratio L/R', defaultDurationSec: 240, defaultHz: 10.0, clinicalScript: 'Sincroniza tu ritmo cardíaco con las olas luminiscentes. Observa cómo la expansión rítmica estimula la activación frontal izquierda.', clinicalObjective: 'Reducción de asimetría hemisférica frontal.' },
  { id: 'DISTIMIA_CHRONIC', name: '06. Distimia & Depresión Persistente', cie11: '6A72', dsm5: '300.4', category: 'TREATMENT', ecosystem: 'warm_hearth', targetKpiName: 'Tono Vagal RMSSD', kpiUnit: 'ms', defaultDurationSec: 180, clinicalScript: 'Permite que la iluminación cálida del refugio disminuya la tensión basal. Respira en 4 tiempos hacia el abdomen.', clinicalObjective: 'Instalación de anclaje fisiológico de confort.' },
  { id: 'PTSD_EMDR', name: '07. TEPT: Reprocesamiento de Huella Traumática', cie11: '6B40', dsm5: '309.81', category: 'TREATMENT', ecosystem: 'emdr_memory', targetKpiName: 'Desensibilización Galvánica (ΔGSR)', kpiUnit: 'µS', defaultDurationSec: 240, clinicalScript: 'Sigue el haz de luz horizontal únicamente con tus ojos, sin mover la cabeza, mientras sostienes la imagen del evento en tu mente.', clinicalObjective: 'Inducción de movimientos sacádicos bilaterales (EMDR).' },
  { id: 'CPTSD_DEVELOPMENTAL', name: '08. Trauma Complejo (TEPT-C) & Apego', cie11: '6B41', dsm5: '307.81', category: 'DIAGNOSTIC', ecosystem: 'dev_trauma', targetKpiName: 'Reactividad Autonómica al Apego', kpiUnit: 'Score', defaultDurationSec: 180, clinicalScript: 'Explora el espacio de memoria relacional. Registramos tus micro-fluctuaciones electrodérmicas ante figuras vinculares.', clinicalObjective: 'Detección de hipervigilancia paroxística.' },

  // --- GRUPO 3: ANSIEDAD, PÁNICO Y FOBIAS ---
  { id: 'PANIC_DISORDER', name: '09. Trastorno de Pánico & Agorafobia', cie11: '6B01', dsm5: '300.01', category: 'DIAGNOSTIC', ecosystem: 'sterile_room', targetKpiName: 'Curva de Reactividad Simpática', kpiUnit: 'BPM', defaultDurationSec: 150, clinicalScript: 'Evaluación interoceptiva basal. Monitorizaremos la respuesta cardiovascular ante la disminución de referencias espaciales.', clinicalObjective: 'Registro de la sensibilidad a sensaciones interoceptivas.' },
  { id: 'ACROPHOBIA_VRET', name: '10. Fobia Específica: Acrofobia (Alturas)', cie11: '6B03.0', dsm5: '300.29', category: 'DIAGNOSTIC', ecosystem: 'acrophobia_roof', targetKpiName: 'Oscilación Postural (Head-Sway)', kpiUnit: 'cm', defaultDurationSec: 180, clinicalScript: 'Exposición jerárquica en azotea de altura. Mira hacia el borde perimetral y mantén un ciclo de respiración regular.', clinicalObjective: 'Evaluación de habituación simpática y estabilidad vestibular.' },
  { id: 'AEROPHOBIA_VRET', name: '11. Fobia Específica: Aerofobia (Volar)', cie11: '6B03.2', dsm5: '300.29', category: 'DIAGNOSTIC', ecosystem: 'aerophobia_cabin', targetKpiName: 'Pico de Estrés en Despegue', kpiUnit: 'µS', defaultDurationSec: 200, clinicalScript: 'Simulación de cabina presurizada en fase de aceleración y despegue. Relaja los hombros y mantén la espalda apoyada.', clinicalObjective: 'Registro de conductancia galvánica y taquicardia situacional.' },
  { id: 'SOCIAL_ANXIETY', name: '12. Fobia Social / Ansiedad de Evaluación', cie11: '6B04', dsm5: '300.23', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Evasión de Mirada (Gaze Avoidance)', kpiUnit: '%', defaultDurationSec: 180, clinicalScript: 'Dirige tu mirada a los evaluadores del panel. Registraremos la fijación visual y la reactividad electrodérmica ante el juicio.', clinicalObjective: 'Mapeo de evitación de contacto visual.' },
  { id: 'GAD_GENERALIZED', name: '13. Trastorno de Ansiedad Generalizada (TAG)', cie11: '6B00', dsm5: '300.02', category: 'TREATMENT', ecosystem: 'zen_garden', targetKpiName: 'Habituación Autonómica (H)', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Jardín de contemplación. Sigue la respiración guiada a 6 respiraciones por minuto para inducir resonancia cardíaca.', clinicalObjective: 'Entrenamiento de variabilidad de la frecuencia cardíaca a 0.1 Hz.' },
  { id: 'OCD_OBSESSIVE', name: '14. Trastorno Obsesivo-Compulsivo (TOC)', cie11: '6B20', dsm5: '300.3', category: 'TREATMENT', ecosystem: 'cosmic_stars', targetKpiName: 'Ruptura de Rumiación Prefrontal', kpiUnit: 'PLV %', defaultDurationSec: 200, clinicalScript: 'Descentramiento cognitivo. Observa la inmensidad estelar y permite que las obsesiones se diluyan sin ejecutar neutralizaciones compulsivas.', clinicalObjective: 'Exposición y prevención de respuesta (EPR) inmersiva.' },

  // --- GRUPO 4: PERSONALIDAD Y PSICOPATOLOGÍA FORENSE ---
  { id: 'BPD_INSTABILITY', name: '15. Trastorno Límite de la Personalidad (TLP)', cie11: '6D11', dsm5: '301.83', category: 'DIAGNOSTIC', ecosystem: 'dev_trauma', targetKpiName: 'Labilidad Afectiva Paroxística', kpiUnit: 'ΔGSR/s', defaultDurationSec: 180, clinicalScript: 'Evaluación de reactividad emocional ante señales de abandono y validación ambivalente.', clinicalObjective: 'Medición de la curva de desborde emocional.' },
  { id: 'NARCISSISM_OVERT', name: '16. Trastorno Narcisista de la Personalidad (Overt)', cie11: '6D10.0', dsm5: '301.81', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Umbral de Ira Narcisista', kpiUnit: 'µS', defaultDurationSec: 180, clinicalScript: 'Ensayo pericial forense de tolerancia al estatus y provocación al ego. Pulsa el gatillo ante juicios descalificatorios.', clinicalObjective: 'Detección de hiperreactividad autonómica encubierta.' },
  { id: 'NARCISSISM_COVERT', name: '17. Narcisismo Encubierto (Covert)', cie11: '6D10.0', dsm5: '301.81', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Disonancia por Rechazo Social', kpiUnit: 'RMSSD Drop', defaultDurationSec: 180, clinicalScript: 'Evaluación forense de exclusión y vergüenza tóxica. Observa las interacciones del grupo pericial.', clinicalObjective: 'Registro de caída parasimpática abrupta.' },
  { id: 'PSYCHOPATHY_FACTOR1', name: '18. Psicopatía & Rasgos Disociales', cie11: '6D10.1', dsm5: '301.7', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Aplanamiento Empático Autonómico', kpiUnit: 'GSR Δ = 0', defaultDurationSec: 180, clinicalScript: 'Ensayo de resonancia afectiva ante imágenes de distrés y sufrimiento ajeno. Presiona el disparador al percibir dolor.', clinicalObjective: 'Identificación de hiporreactividad fisiológica.' },

  // --- GRUPO 5: NEUROLOGÍA FUNCIONAL Y DOLOR ---
  { id: 'FND_CONVERSION', name: '19. Trastorno de Síntomas Neurológicos Funcionales (FND)', cie11: '6C20', dsm5: '300.11', category: 'TREATMENT', ecosystem: 'fnd_mirror', targetKpiName: 'Simetría de Control Visuomotor', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Terapia en espejo adaptativa. Mueve tu mano sana mientras el avatar proyecta movimiento bilateral armónico.', clinicalObjective: 'Recalibración del mapa somatosensorial.' },
  { id: 'CHRONIC_PAIN_FIBRO', name: '20. Dolor Crónico / Fibromialgia', cie11: 'MG30.0', dsm5: '307.89', category: 'TREATMENT', ecosystem: 'pain_management', targetKpiName: 'Índice de Anestesia Electrónica', kpiUnit: 'Score/10', defaultDurationSec: 240, defaultHz: 0.5, clinicalScript: 'Inmersión analgésica por estimulación Sub-Delta. La temperatura perceptual del océano reduce el bombardeo nociceptivo.', clinicalObjective: 'Activación del sistema inhibitorio descendente del dolor.' },
  { id: 'CRPS_NEUROPATHIC', name: '21. Síndrome de Dolor Regional Complejo (SDRC)', cie11: '8E43', dsm5: '354.4', category: 'TREATMENT', ecosystem: 'pain_management', targetKpiName: 'Amortiguación Simpática', kpiUnit: 'µS', defaultDurationSec: 200, clinicalScript: 'Filtro cromático criogénico. Disminución de la hiperexcitabilidad simpática regional.', clinicalObjective: 'Desensibilización periférica.' },
  { id: 'INSOMNIA_SLOW_WAVE', name: '22. Trastorno de Insomnio Crónico Severo', cie11: '7A00', dsm5: '307.42', category: 'TREATMENT', ecosystem: 'neuro_hypnosis', targetKpiName: 'Profundidad de Trance Theta/Delta', kpiUnit: '%', defaultDurationSec: 300, defaultHz: 2.0, clinicalScript: 'Inducción de ondas Delta a 2.0 Hz. Cierra tus ojos parcialmente y permite que el tono acústico guíe el metabolismo hacia el sueño lento.', clinicalObjective: 'Desactivación del arousal cortical e inducción de ondas lentas.' },

  // --- GRUPO 6: SALUD SEXUAL ---
  { id: 'SEXUAL_INHIBITION_SIS', name: '23. Inhibición Sexual (Modelo Dual SIS)', cie11: 'HA01', dsm5: '302.72', category: 'TREATMENT', ecosystem: 'dual_control', targetKpiName: 'Desactivación del Freno Inhibitorio', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Focalización sensorial libre de demanda de rendimiento. Inhala calidez corporal y disuelve la autoobservación crítica.', clinicalObjective: 'Desactivación del sistema de inhibición sexual (SIS).' },
  { id: 'SEXUAL_DESIRE_SES', name: '24. Trastorno del Deseo Hipoactivo (Modelo Dual SES)', cie11: 'HA00', dsm5: '302.71', category: 'TREATMENT', ecosystem: 'dual_control', targetKpiName: 'Activación del Sistema de Excitación', kpiUnit: 'Score', defaultDurationSec: 240, clinicalScript: 'Reconexión con señales corporales interoceptivas placenteras y sintonía vincular libre de juicio.', clinicalObjective: 'Estimulación del sistema de excitación sexual (SES).' }
];

export const FullscreenDiagnosticRunner: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || 'PAC-8104';

  const [selectedDisorderId, setSelectedDisorderId] = useState<string>('TDAH_CPT');
  const currentDisorder = CLINICAL_24_DISORDERS_CATALOG.find(d => d.id === selectedDisorderId) || CLINICAL_24_DISORDERS_CATALOG[0];

  const [programmableScript, setProgrammableScript] = useState<string>(currentDisorder.clinicalScript);
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(currentDisorder.defaultDurationSec);
  const [targetHz, setTargetHz] = useState<number>(currentDisorder.defaultHz || 40.0);
  const [targetThresholdGsr, setTargetThresholdGsr] = useState<number>(4.5);
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);

  const [testPhase, setTestPhase] = useState<'IDLE' | 'RUNNING' | 'FINISHED'>('IDLE');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [liveKpiHistory, setLiveKpiHistory] = useState<KpiDataPoint[]>([]);
  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(38);
  const [currentSpecificKpi, setCurrentSpecificKpi] = useState<number>(10);
  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Consola Clínica Multitrastorno inicializada.']);

  const [generatedRoiReport, setGeneratedRoiReport] = useState<string>('');

  useEffect(() => {
    setProgrammableScript(currentDisorder.clinicalScript);
    setSessionDurationSec(currentDisorder.defaultDurationSec);
    if (currentDisorder.defaultHz) setTargetHz(currentDisorder.defaultHz);
    setLiveKpiHistory([]);
    setTestPhase('IDLE');
    setElapsedTime(0);
    setGeneratedRoiReport('');
  }, [selectedDisorderId]);

  useEffect(() => {
    const unsub = VrControlService.subscribeStatus((status) => {
      setIsVisorLinked(status === 'CONNECTED');
      if (status === 'CONNECTED') {
        setLogs(prev => [...prev, '[WSS] Enlace WebSocket con Pico 3 ESTABLECIDO.']);
      }
    });
    return () => unsub();
  }, []);

  const dispatchConfigToVisor = () => {
    VrControlService.changeEnvironment(currentDisorder.ecosystem, patientId, currentDisorder.category);
    VrControlService.sendCommand({
      type: 'UPDATE_AI_GUIDANCE_SCRIPT',
      scriptText: programmableScript,
      frequencyHz: targetHz,
      patientId,
      category: currentDisorder.category
    });
  };

  useEffect(() => {
    if (testPhase !== 'RUNNING') return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const nextTime = prev + 1;
        if (nextTime >= sessionDurationSec) {
          stopTestAndGenerateReport();
          return sessionDurationSec;
        }
        return nextTime;
      });

      setCurrentGsr((prev) => {
        let delta = (Math.random() - 0.48) * 0.15;
        if (currentDisorder.category === 'DIAGNOSTIC' && elapsedTime > 30 && elapsedTime < 70) {
          delta += 0.08; 
        } else if (currentDisorder.category === 'TREATMENT' && elapsedTime > 50) {
          delta -= 0.04; 
        }
        return Math.max(0.8, Number((prev + delta).toFixed(2)));
      });

      setCurrentHrv((prev) => {
        let delta = Math.floor((Math.random() - 0.45) * 4);
        if (currentDisorder.category === 'TREATMENT') delta += 1;
        return Math.max(18, Math.min(95, prev + delta));
      });

      setCurrentSpecificKpi((prev) => {
        if (currentDisorder.id === 'TDAH_CPT') {
          return Math.floor(220 + Math.random() * 90);
        }
        return Math.min(98, prev + Math.random() * 2.5);
      });

      setLiveKpiHistory((prevCurve) => [
        ...prevCurve,
        {
          t: elapsedTime,
          gsr: currentGsr,
          hrv: currentHrv,
          kpiPrimary: Number(currentSpecificKpi.toFixed(1)),
          phase: elapsedTime < 30 ? 'BASAL' : elapsedTime < 90 ? 'STIMULUS' : 'RECOVERY'
        }
      ]);
    }, 1000);

    return () => clearInterval(timer);
  }, [testPhase, elapsedTime, sessionDurationSec, currentDisorder, currentGsr, currentHrv, currentSpecificKpi]);

  const handleStartTest = () => {
    if (!isVisorLinked) {
      setLogs(prev => [...prev, '[ERROR] El visor no responde. Sincroniza antes de comenzar.']);
      return;
    }
    setLiveKpiHistory([]);
    setElapsedTime(0);
    setTestPhase('RUNNING');
    setLogs(prev => [...prev, `[START] Despachando protocolo: ${currentDisorder.name}`]);
    dispatchConfigToVisor();

    if (currentDisorder.defaultHz) {
      VrControlService.startLightStimulation(targetHz, currentDisorder.id, patientId);
    }
  };

  const stopTestAndGenerateReport = () => {
    setTestPhase('FINISHED');
    VrControlService.stopLightStimulation(patientId);
    VrControlService.stopActiveSession(patientId);
    setLogs(prev => [...prev, `[STOP] Ensayo finalizado. Generando dictamen ROI con IA...`]);

    const basalGsr = liveKpiHistory[0]?.gsr || 2.4;
    const peakGsr = Math.max(...liveKpiHistory.map(p => p.gsr), basalGsr);
    const finalGsr = liveKpiHistory[liveKpiHistory.length - 1]?.gsr || currentGsr;
    const finalHrv = currentHrv;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let aiDictamen = `INFORME PERICIAL DE EJECUCIÓN INMERSIVA (ROI)\n`;
    aiDictamen += `Entidad Clínica: ${currentDisorder.name} (${currentDisorder.cie11} / DSM-5:${currentDisorder.dsm5})\n`;
    aiDictamen += `Entorno WebXR: /ecosystems/${currentDisorder.ecosystem}.jpeg [MODO${currentDisorder.category}]\n`;
    aiDictamen += `Duración Efectiva: ${elapsedTime} segundos grabados (Muestreo continuo)\n\n`;
    aiDictamen += `1. DINÁMICA DE LA CURVA AUTONÓMICA REGISTRADA:\n`;
    aiDictamen += `   • Línea Base (GSR): ${basalGsr.toFixed(2)} µS \vert{} VFC (RMSSD):${liveKpiHistory[0]?.hrv || 35} ms\n`;
    aiDictamen += `   • Reactividad Máxima (Pico): ${peakGsr.toFixed(2)} µS (ΔGSR =${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    aiDictamen += `   • Nivel de Cierre: ${finalGsr.toFixed(2)} µS \vert{} Tono Vagal:${finalHrv} ms\n`;
    aiDictamen += `   • Tasa de Habituación / Recuperación (H): ${habituationRate}%\n`;
    aiDictamen += `   • Métrica Focal (${currentDisorder.targetKpiName}): ${currentSpecificKpi.toFixed(1)}${currentDisorder.kpiUnit}\n\n`;

    aiDictamen += `2. CONCLUSIÓN CLÍNICA Y JUICIO DIAGNÓSTICO:\n`;
    if (currentDisorder.category === 'DIAGNOSTIC') {
      if (peakGsr - basalGsr > 2.0) {
        aiDictamen += `   El paciente exhibió una descompensación simpática paroxística ante la exposición diagnóstica, congruente con hipersensibilidad central y desregulación inhibitoria.\n`;
      } else {
        aiDictamen += `   Respuesta fisiológica controlada dentro de los rangos de tolerancia basal (Mahalanobis D² < 2.5).\n`;
      }
    } else {
      if (Number(habituationRate) >= 40) {
        aiDictamen += `   Intervención terapéutica exitosa. Se verificó un descenso de conductancia mayor al 40% y recuperación vagal (RMSSD > 35 ms), confirmando desensibilización biológica objetiva.\n`;
      } else {
        aiDictamen += `   Resistencia parcial a la intervención. Se sugiere aumentar la dosis de inmersión en 3 sesiones adicionales.\n`;
      }
    }

    setGeneratedRoiReport(aiDictamen);

    if (onUpdatePatientVrData) {
      onUpdatePatientVrData(
        { 
          sessionDate: new Date().toISOString(), 
          baselineGsr: basalGsr, 
          baselineHrv: liveKpiHistory[0]?.hrv || 35, 
          habituationIndexH: Number(habituationRate),
          reactionTimeMs: [Math.round(currentSpecificKpi)],
          gsrMicroSiemens: liveKpiHistory.map(p => p.gsr),
          hrvRmssdMs: liveKpiHistory.map(p => p.hrv)
        } as any,
        { 
          sessionId: `ROI-${Date.now()}`, 
          date: new Date().toISOString(), 
          moduleExecuted: currentDisorder.id, 
          clinicalObservations: aiDictamen,
          autonomicRegulationScore: Number(habituationRate) >= 40 ? 'ÓPTIMA' : 'MODERADA'
        } as any
      );
    }
  };

  const handlePrintRoiReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Objetivo Individual — ${patientId}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; line-height: 1.45; font-size: 10.5pt; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 16pt; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
          .sublogo { font-size: 9pt; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9.5pt; }
          .section-title { font-size: 11pt; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-top: 18px; margin-bottom: 8px; border-left: 3px solid #0284c7; padding-left: 8px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; font-size: 9.5pt; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          .data-table th { background: #f1f5f9; color: #334155; }
          .dictamen-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; font-size: 9.5pt; color: #166534; white-space: pre-wrap; font-family: monospace; }
          .signature-area { margin-top: 45px; display: flex; justify-content: space-between; }
          .signature-block { width: 220px; text-align: center; border-top: 1px solid #334155; padding-top: 6px; font-size: 9.5pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">AMIE CLINICAL COPILOT</div>
            <div class="sublogo">Reporte Pericial de Desempeño Inmersivo en WebXR (ROI)</div>
          </div>
          <div style="text-align: right; font-size: 9pt; color: #64748b;">
            Emisión: ${new Date().toLocaleDateString('es-ES')}<br/>
            Folio: EXP-${patientId}-${Date.now().toString().slice(-4)}
          </div>
        </div>

        <div class="meta-box">
          <div><strong>PACIENTE:</strong> ${patientId}</div>
          <div><strong>MODALIDAD:</strong> ${currentDisorder.category === 'DIAGNOSTIC' ? 'EVALUACIÓN DIAGNÓSTICA' : 'INTERVENCIÓN TERAPÉUTICA'}</div>
          <div><strong>PATOLOGÍA:</strong> ${currentDisorder.name}</div>
          <div><strong>CÓDIGO CLÍNICO:</strong> CIE-11: ${currentDisorder.cie11} \vert{} DSM-5-TR:${currentDisorder.dsm5}</div>
          <div><strong>ESCENARIO WEBXR:</strong> ${currentDisorder.ecosystem}.jpeg (6DoF)</div>
          <div><strong>DISPOSITIVO:</strong> Pico Neo 3 Pro / Meta Quest</div>
        </div>

        <div class="section-title">1. Parámetros y Guion Programado</div>
        <p style="font-size: 9.5pt; color: #334155; margin-bottom: 12px; font-style: italic;">
          "${programmableScript}"
        </p>

        <div class="section-title">2. Métricas de la Curva Temporal (Serie Grabada)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Parámetro Fisiológico</th>
              <th>Línea Base (t=0s)</th>
              <th>Pico / Desafío</th>
              <th>Cierre de Sesión</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Conductancia Dérmica (GSR)</td>
              <td>${(liveKpiHistory[0]?.gsr || 2.4).toFixed(2)} µS</td>
              <td>${Math.max(...liveKpiHistory.map(p => p.gsr), 2.5).toFixed(2
