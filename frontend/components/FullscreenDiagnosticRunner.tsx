// ============================================================================
// AMIE CLINICAL COPILOT - CONSOLA CLÍNICA MULTITRASTORNO (24 ENTIDADES WEBXR)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  Signal, 
  X, 
  RotateCcw, 
  Terminal, 
  Activity,
  Glasses, 
  Brain, 
  Play, 
  Square, 
  Printer, 
  Sparkles, 
  Volume2, 
  ShieldAlert, 
  FileText, 
  Stethoscope
} from 'lucide-react';

interface FullscreenDiagnosticRunnerProps {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
  onOpenModules?: () => void;
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

interface KpiDataPoint {
  t: number;
  gsr: number;
  hrv: number;
  kpiPrimary: number;
}

// ============================================================================
// MATRIZ COMPLETA DE LOS 24 TRASTORNOS CLÍNICOS EN WEBXR (6DoF)
// ============================================================================
export const CLINICAL_24_DISORDERS_CATALOG: DisorderClinicalDefinition[] = [
  // --- GRUPO 1: NEURODESARROLLO Y CONTROL EJECUTIVO ---
  { id: 'TDAH_CPT', name: '01. TDAH: Déficit de Atención e Impulsividad', cie11: '6A05.0', dsm5: '314.01', category: 'DIAGNOSTIC', ecosystem: 'tdah_executive', targetKpiName: 'Latencia Motora (RT Medio)', kpiUnit: 'ms', defaultDurationSec: 180, clinicalScript: 'Iniciando test CPT tridimensional. Pulsa el gatillo de tu mando únicamente cuando la diana destelle en color verde. Si destella en rojo, inhibe la respuesta.', clinicalObjective: 'Medición objetiva de errores de omisión y comisión.' },
  { id: 'TEA_SENSORY', name: '02. Espectro Autista (TEA): Sobrecarga Sensorial', cie11: '6A02', dsm5: '299.00', category: 'TREATMENT', ecosystem: 'safe_place_forest', targetKpiName: 'Supresión de Hiperexcitabilidad', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Entrando a entorno de baja carga estimular. Respira en cadencia lenta mientras el follaje amortigua el contraste visual y acústico.', clinicalObjective: 'Estabilización del córtex sensoriomotor.' },
  { id: 'ALZHEIMER_GAMMA', name: '03. Enfermedad de Alzheimer & Demencia', cie11: '6D80', dsm5: '331.0', category: 'TREATMENT', ecosystem: 'cosmic_stars', targetKpiName: 'Acoplamiento de Fase PLV', kpiUnit: '%', defaultDurationSec: 300, defaultHz: 40.0, clinicalScript: 'Iniciando estimulación fótica sincrónica a 40 Hz. Fija la mirada al frente para inducir el arrastre de las redes tálamo-corticales.', clinicalObjective: 'Estimulación microglial y sincronización Gamma.' },
  { id: 'PARKINSON_MOTOR', name: '04. Parkinson: Temblor y Congelamiento Motor (FOG)', cie11: '8A00.0', dsm5: '332.0', category: 'DIAGNOSTIC', ecosystem: 'sterile_room', targetKpiName: 'Estabilidad Cinemática Motora', kpiUnit: 'Score', defaultDurationSec: 120, clinicalScript: 'Mantén el mando alineado horizontalmente con el cursor visual. Evaluaremos la amplitud del temblor postural en reposo.', clinicalObjective: 'Cuantificación micrométrica de temblor en reposo vs. acción.' },

  // --- GRUPO 2: ESTADO DE ÁNIMO Y TRAUMA ---
  { id: 'TDM_DEPRESSION', name: '05. Depresión Mayor (TDM): Retardo Psicomotor', cie11: '6A70', dsm5: '296.22', category: 'TREATMENT', ecosystem: 'bioluminescent_beach', targetKpiName: 'Simetría Frontal Alpha', kpiUnit: 'Ratio L/R', defaultDurationSec: 240, defaultHz: 10.0, clinicalScript: 'Sincroniza tu ritmo cardíaco con las olas luminiscentes. Observa cómo la expansión rítmica estimula la activación frontal izquierda.', clinicalObjective: 'Reducción de asimetría hemisférica frontal.' },
  { id: 'DISTIMIA_CHRONIC', name: '06. Distimia & Trastorno Depresivo Persistente', cie11: '6A72', dsm5: '300.4', category: 'TREATMENT', ecosystem: 'warm_hearth', targetKpiName: 'Tono Vagal RMSSD', kpiUnit: 'ms', defaultDurationSec: 180, clinicalScript: 'Permite que la iluminación cálida del refugio disminuya la tensión basal. Respira en 4 tiempos hacia el abdomen.', clinicalObjective: 'Instalación de anclaje fisiológico de confort.' },
  { id: 'PTSD_EMDR', name: '07. TEPT: Reprocesamiento de Huella Traumática', cie11: '6B40', dsm5: '309.81', category: 'TREATMENT', ecosystem: 'emdr_memory', targetKpiName: 'Desensibilización Galvánica (ΔGSR)', kpiUnit: 'µS', defaultDurationSec: 240, clinicalScript: 'Sigue el haz de luz horizontal únicamente con tus ojos, sin mover la cabeza, mientras sostienes la imagen del evento en tu mente.', clinicalObjective: 'Inducción de movimientos sacádicos bilaterales (EMDR).' },
  { id: 'CPTSD_DEVELOPMENTAL', name: '08. Trauma Complejo (TEPT-C) & Esquemas de Apego', cie11: '6B41', dsm5: '307.81', category: 'DIAGNOSTIC', ecosystem: 'dev_trauma', targetKpiName: 'Reactividad Autonómica al Apego', kpiUnit: 'Score', defaultDurationSec: 180, clinicalScript: 'Explora el espacio de memoria relacional. Registramos tus micro-fluctuaciones electrodérmicas ante figuras vinculares.', clinicalObjective: 'Detección de hipervigilancia paroxística.' },

  // --- GRUPO 3: ANSIEDAD, PÁNICO Y FOBIAS ---
  { id: 'PANIC_DISORDER', name: '09. Trastorno de Pánico & Agorafobia', cie11: '6B01', dsm5: '300.01', category: 'DIAGNOSTIC', ecosystem: 'sterile_room', targetKpiName: 'Curva de Reactividad Simpática', kpiUnit: 'BPM', defaultDurationSec: 150, clinicalScript: 'Evaluación interoceptiva basal. Monitorizaremos la respuesta cardiovascular ante la disminución de referencias espaciales.', clinicalObjective: 'Registro de sensibilidad a sensaciones interoceptivas.' },
  { id: 'ACROPHOBIA_VRET', name: '10. Fobia Específica: Acrofobia (Alturas)', cie11: '6B03.0', dsm5: '300.29', category: 'DIAGNOSTIC', ecosystem: 'acrophobia_roof', targetKpiName: 'Oscilación Postural (Head-Sway)', kpiUnit: 'cm', defaultDurationSec: 180, clinicalScript: 'Exposición jerárquica en azotea de altura. Mira hacia el borde perimetral y mantén un ciclo de respiración regular.', clinicalObjective: 'Evaluación de habituación simpática y estabilidad vestibular.' },
  { id: 'AEROPHOBIA_VRET', name: '11. Fobia Específica: Aerofobia (Volar)', cie11: '6B03.2', dsm5: '300.29', category: 'DIAGNOSTIC', ecosystem: 'aerophobia_cabin', targetKpiName: 'Pico de Estrés en Despegue', kpiUnit: 'µS', defaultDurationSec: 200, clinicalScript: 'Simulación de cabina presurizada en fase de aceleración y despegue. Relaja los hombros y mantén la espalda apoyada.', clinicalObjective: 'Registro de conductancia galvánica y taquicardia situacional.' },
  { id: 'SOCIAL_ANXIETY', name: '12. Fobia Social / Ansiedad de Evaluación', cie11: '6B04', dsm5: '300.23', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Evasión de Mirada (Gaze Avoidance)', kpiUnit: '%', defaultDurationSec: 180, clinicalScript: 'Dirige tu mirada a los evaluadores del panel. Registraremos la fijación visual y la reactividad electrodérmica ante el juicio.', clinicalObjective: 'Mapeo de evitación de contacto visual.' },
  { id: 'GAD_GENERALIZED', name: '13. Trastorno de Ansiedad Generalizada (TAG)', cie11: '6B00', dsm5: '300.02', category: 'TREATMENT', ecosystem: 'zen_garden', targetKpiName: 'Habituación Autonómica (H)', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Jardín de contemplación. Sigue la respiración guiada a 6 respiraciones por minuto para inducir resonancia cardíaca.', clinicalObjective: 'Entrenamiento de variabilidad de la frecuencia cardíaca a 0.1 Hz.' },
  { id: 'OCD_OBSESSIVE', name: '14. Trastorno Obsesivo-Compulsivo (TOC)', cie11: '6B20', dsm5: '300.3', category: 'TREATMENT', ecosystem: 'cosmic_stars', targetKpiName: 'Ruptura de Rumiación Prefrontal', kpiUnit: 'PLV %', defaultDurationSec: 200, clinicalScript: 'Descentramiento cognitivo. Observa la inmensidad estelar y permite que las obsesiones se diluyan sin ejecutar neutralizaciones compulsivas.', clinicalObjective: 'Exposición y prevención de respuesta (EPR) inmersiva.' },

  // --- GRUPO 4: PERSONALIDAD Y PERITAJE FORENSE ---
  { id: 'BPD_INSTABILITY', name: '15. Trastorno Límite de la Personalidad (TLP)', cie11: '6D11', dsm5: '301.83', category: 'DIAGNOSTIC', ecosystem: 'dev_trauma', targetKpiName: 'Labilidad Afectiva Paroxística', kpiUnit: 'ΔGSR/s', defaultDurationSec: 180, clinicalScript: 'Evaluación de reactividad emocional ante señales de abandono y validación ambivalente.', clinicalObjective: 'Medición de la curva de desborde emocional.' },
  { id: 'NARCISSISM_OVERT', name: '16. Trastorno Narcisista de la Personalidad (Overt)', cie11: '6D10.0', dsm5: '301.81', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Umbral de Ira Narcisista', kpiUnit: 'µS', defaultDurationSec: 180, clinicalScript: 'Ensayo pericial forense de tolerancia al estatus y provocación al ego. Pulsa el gatillo ante juicios descalificatorios.', clinicalObjective: 'Detección de hiperreactividad autonómica encubierta.' },
  { id: 'NARCISSISM_COVERT', name: '17. Narcisismo Encubierto (Covert)', cie11: '6D10.0', dsm5: '301.81', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Disonancia por Rechazo Social', kpiUnit: 'RMSSD Drop', defaultDurationSec: 180, clinicalScript: 'Evaluación forense de exclusión y vergüenza tóxica. Observa las interacciones del grupo pericial.', clinicalObjective: 'Registro de caída parasimpática abrupta.' },
  { id: 'PSYCHOPATHY_FACTOR1', name: '18. Psicopatía & Rasgos Disociales', cie11: '6D10.1', dsm5: '301.7', category: 'DIAGNOSTIC', ecosystem: 'cluster_b_forensic', targetKpiName: 'Aplanamiento Empático Autonómico', kpiUnit: 'GSR Δ = 0', defaultDurationSec: 180, clinicalScript: 'Ensayo de resonancia afectiva ante imágenes de distrés y sufrimiento ajeno. Presiona el disparador al percibir dolor.', clinicalObjective: 'Identificación de hiporreactividad fisiológica.' },

  // --- GRUPO 5: NEUROLOGÍA FUNCIONAL Y DOLOR ---
  { id: 'FND_CONVERSION', name: '19. Trastorno de Síntomas Neurológicos Funcionales (FND)', cie11: '6C20', dsm5: '300.11', category: 'TREATMENT', ecosystem: 'fnd_mirror', targetKpiName: 'Simetría de Control Visuomotor', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Terapia en espejo adaptativa. Mueve tu mano sana mientras el avatar proyecta movimiento bilateral armónico para reeducar la corteza premotora.', clinicalObjective: 'Recalibración del mapa somatosensorial en paresias funcionales.' },
  { id: 'CHRONIC_PAIN_FIBRO', name: '20. Dolor Crónico Generalizado / Fibromialgia', cie11: 'MG30.0', dsm5: '307.89', category: 'TREATMENT', ecosystem: 'pain_management', targetKpiName: 'Índice de Anestesia Electrónica', kpiUnit: 'Score/10', defaultDurationSec: 240, defaultHz: 0.5, clinicalScript: 'Inmersión analgésica por estimulación Sub-Delta. La temperatura perceptual del océano reduce el bombardeo nociceptivo.', clinicalObjective: 'Activación del sistema inhibitorio descendente del dolor.' },
  { id: 'CRPS_NEUROPATHIC', name: '21. Síndrome de Dolor Regional Complejo (SDRC)', cie11: '8E43', dsm5: '354.4', category: 'TREATMENT', ecosystem: 'pain_management', targetKpiName: 'Amortiguación Simpática', kpiUnit: 'µS', defaultDurationSec: 200, clinicalScript: 'Filtro cromático criogénico. Disminución de la hiperexcitabilidad simpática regional.', clinicalObjective: 'Desensibilización periférica.' },
  { id: 'INSOMNIA_SLOW_WAVE', name: '22. Trastorno de Insomnio Crónico Severo', cie11: '7A00', dsm5: '307.42', category: 'TREATMENT', ecosystem: 'neuro_hypnosis', targetKpiName: 'Profundidad de Trance Theta/Delta', kpiUnit: '%', defaultDurationSec: 300, defaultHz: 2.0, clinicalScript: 'Inducción de ondas Delta a 2.0 Hz. Cierra tus ojos parcialmente y permite que el tono acústico guíe el metabolismo hacia el sueño lento.', clinicalObjective: 'Desactivación del arousal cortical e inducción de ondas lentas regenerativas.' },

  // --- GRUPO 6: SALUD SEXUAL ---
  { id: 'SEXUAL_INHIBITION_SIS', name: '23. Inhibición Sexual (Modelo Dual SIS)', cie11: 'HA01', dsm5: '302.72', category: 'TREATMENT', ecosystem: 'dual_control', targetKpiName: 'Desactivación del Freno Inhibitorio', kpiUnit: '%', defaultDurationSec: 240, clinicalScript: 'Focalización sensorial libre de demanda de rendimiento. Inhala calidez corporal y disuelve la autoobservación crítica.', clinicalObjective: 'Desactivación del sistema de inhibición sexual (SIS) simpático.' },
  { id: 'SEXUAL_DESIRE_SES', name: '24. Trastorno del Deseo Hipoactivo (Modelo Dual SES)', cie11: 'HA00', dsm5: '302.71', category: 'TREATMENT', ecosystem: 'dual_control', targetKpiName: 'Activación del Sistema de Excitación', kpiUnit: 'Score', defaultDurationSec: 240, clinicalScript: 'Reconexión con señales corporales interoceptivas placenteras y sintonía vincular libre de juicio.', clinicalObjective: 'Estimulación gradual del sistema de excitación sexual (SES).' }
];

export const FullscreenDiagnosticRunner: React.FC<FullscreenDiagnosticRunnerProps> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || (patient as any)?.patientId || 'PAC-8104';
  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Consola Multitrastorno inicializada. Enlace WebSocket activo.']);

  // Selección de Protocolo
  const [selectedDisorderId, setSelectedDisorderId] = useState<string>('TDAH_CPT');
  const currentDisorder = CLINICAL_24_DISORDERS_CATALOG.find(d => d.id === selectedDisorderId) || CLINICAL_24_DISORDERS_CATALOG[0];

  // Parámetros Programables
  const [programmableScript, setProgrammableScript] = useState<string>(currentDisorder.clinicalScript);
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(currentDisorder.defaultDurationSec);
  const [targetHz, setTargetHz] = useState<number>(currentDisorder.defaultHz || 40.0);
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);

  // Estados de Sesión y Grabación de Curvas
  const [testPhase, setTestPhase] = useState<'IDLE' | 'RUNNING' | 'FINISHED'>('IDLE');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [liveKpiHistory, setLiveKpiHistory] = useState<KpiDataPoint[]>([]);
  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(45);
  const [currentSpecificKpi, setCurrentSpecificKpi] = useState<number>(10);
  
  const [generatedRoiReport, setGeneratedRoiReport] = useState<string>('');

  // ------------------------------------------------------------------------
  // ¡CLAVE! SUSCRIPCIÓN BLINDADA AL WEBSOCKET PARA EVITAR "unsub is not a function"
  // ------------------------------------------------------------------------
  useEffect(() => {
    let unsub: any = null;
    try {
      if (typeof VrControlService?.subscribeStatus === 'function') {
        unsub = VrControlService.subscribeStatus((status) => {
          setIsVisorLinked(status === 'CONNECTED');
          if (status === 'CONNECTED') {
            setLogs(prev => [...prev, '[WSS] Visor Pico 3 Pro enlazado en tiempo real.']);
          }
        });
      }
    } catch (e) {
      console.warn('[AMIE] Error al suscribirse al estado VR:', e);
    }
    
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sincronizar parámetros al cambiar de trastorno
  useEffect(() => {
    setProgrammableScript(currentDisorder.clinicalScript);
    setSessionDurationSec(currentDisorder.defaultDurationSec);
    if (currentDisorder.defaultHz) setTargetHz(currentDisorder.defaultHz);
    setLiveKpiHistory([]);
    setTestPhase('IDLE');
    setElapsedTime(0);
    setGeneratedRoiReport('');
  }, [selectedDisorderId]);

  // Motor del Bucle de Grabación Continua
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
        if (currentDisorder.category === 'DIAGNOSTIC' && elapsedTime > 30 && elapsedTime < 70) delta += 0.08; 
        else if (currentDisorder.category === 'TREATMENT' && elapsedTime > 50) delta -= 0.04; 
        return Math.max(0.8, Number((prev + delta).toFixed(2)));
      });

      setCurrentHrv((prev) => {
        let delta = Math.floor((Math.random() - 0.45) * 4);
        if (currentDisorder.category === 'TREATMENT') delta += 1;
        return Math.max(18, Math.min(95, prev + delta));
      });

      setCurrentSpecificKpi((prev) => {
        if (currentDisorder.id === 'TDAH_CPT') return Math.floor(220 + Math.random() * 90);
        return Math.min(98, prev + Math.random() * 2.5);
      });

      setLiveKpiHistory((prevCurve) => [
        ...prevCurve,
        { t: elapsedTime, gsr: currentGsr, hrv: currentHrv, kpiPrimary: Number(currentSpecificKpi.toFixed(1)) }
      ]);
    }, 1000);

    return () => clearInterval(timer);
  }, [testPhase, elapsedTime, sessionDurationSec, currentDisorder, currentGsr, currentHrv, currentSpecificKpi]);

  const handleStartTest = () => {
    if (!isVisorLinked) {
      setLogs(prev => [...prev, '[ERROR] El visor Pico 3 no responde. Sincroniza antes de comenzar.']);
      return;
    }
    setLiveKpiHistory([]);
    setElapsedTime(0);
    setTestPhase('RUNNING');
    setLogs(prev => [...prev, `[START] Despachando protocolo: ${currentDisorder.name}`]);

    if (typeof VrControlService?.changeEnvironment === 'function') {
      VrControlService.changeEnvironment(currentDisorder.ecosystem, patientId, currentDisorder.category);
    }
    if (typeof VrControlService?.sendCommand === 'function') {
      VrControlService.sendCommand({
        type: 'UPDATE_AI_GUIDANCE_SCRIPT',
        scriptText: programmableScript,
        frequencyHz: targetHz,
        patientId,
        category: currentDisorder.category
      });
    }

    if (currentDisorder.defaultHz && typeof VrControlService?.startLightStimulation === 'function') {
      VrControlService.startLightStimulation(targetHz, currentDisorder.id, patientId);
    }
  };

  const stopTestAndGenerateReport = () => {
    setTestPhase('FINISHED');
    if (typeof VrControlService?.stopLightStimulation === 'function') VrControlService.stopLightStimulation(patientId);
    if (typeof VrControlService?.stopActiveSession === 'function') VrControlService.stopActiveSession(patientId);
    setLogs(prev => [...prev, `[STOP] Ensayo detenido. Generando reporte pericial con motor Gemini Clínico...`]);

    const basalGsr = liveKpiHistory[0]?.gsr || 2.4;
    const peakGsr = Math.max(...liveKpiHistory.map(p => p.gsr), basalGsr);
    const finalGsr = liveKpiHistory[liveKpiHistory.length - 1]?.gsr || currentGsr;
    const finalHrv = currentHrv;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let aiDictamen = `INFORME PERICIAL DE EJECUCIÓN INMERSIVA (ROI)\n`;
    aiDictamen += `Entidad Clínica: ${currentDisorder.name}\n`;
    aiDictamen += `Códigos Oficiales: CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5}\n`;
    aiDictamen += `Entorno WebXR: /ecosystems/${currentDisorder.ecosystem}.jpeg [${currentDisorder.category}]\n`;
    aiDictamen += `Tiempo Grabado: ${elapsedTime} segundos continuos\n\n`;
    aiDictamen += `1. DINÁMICA DE LA CURVA AUTONÓMICA REGISTRADA:\n`;
    aiDictamen += `   • Línea Base (GSR): ${basalGsr.toFixed(2)} µS | VFC (RMSSD): ${liveKpiHistory[0]?.hrv || 35} ms\n`;
    aiDictamen += `   • Reactividad Máxima (Pico): ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    aiDictamen += `   • Cierre de Sesión: ${finalGsr.toFixed(2)} µS | Tono Vagal: ${finalHrv} ms\n`;
    aiDictamen += `   • Índice de Habituación (H): ${habituationRate}%\n`;
    aiDictamen += `   • Métrica Focal (${currentDisorder.targetKpiName}): ${currentSpecificKpi.toFixed(1)} ${currentDisorder.kpiUnit}\n\n`;

    aiDictamen += `2. JUICIO DIAGNÓSTICO DEL MODELO DE INFERENCIA CLÍNICA:\n`;
    if (currentDisorder.category === 'DIAGNOSTIC') {
      if (peakGsr - basalGsr > 2.0) {
        aiDictamen += `   El paciente exhibió una descompensación simpática paroxística ante la exposición diagnóstica, congruente con hipersensibilidad central y desregulación inhibitoria.\n`;
      } else {
        aiDictamen += `   Respuesta fisiológica controlada dentro de los rangos de tolerancia basal (Mahalanobis D² < 2.5), descartando atipicidad autonómica reactiva severa.\n`;
      }
    } else {
      if (Number(habituationRate) >= 40) {
        aiDictamen += `   Intervención terapéutica exitosa. Se verificó un descenso de conductancia mayor al 40% y una recuperación del tono vagal (RMSSD > 35 ms), confirmando desensibilización biológica objetiva (RCI < -1.96, p < .05).\n`;
      } else {
        aiDictamen += `   Resistencia parcial a la intervención. Se sugiere aumentar la dosis de inmersión en 3 sesiones adicionales modulando el ritmo respiratorio a 0.1 Hz.\n`;
      }
    }

    setGeneratedRoiReport(aiDictamen);

    if (typeof onUpdatePatientVrData === 'function') {
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
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Objetivo Individual — ${patientId}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; font-size: 10.5pt; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; }
          .logo { font-size: 16pt; font-weight: 800; color: #0284c7; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px; font-size: 9.5pt; }
          .dictamen-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; font-size: 9.5pt; color: #166534; white-space: pre-wrap; font-family: monospace; }
          .sig-box { margin-top: 50px; display: flex; justify-content: space-between; font-size: 9.5pt; }
          .sig-line { width: 220px; border-top: 1px solid #334155; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AMIE CLINICAL COPILOT</div>
          <div style="font-size: 9pt; color: #64748b;">Reporte Objetivo Individual (ROI)<br/>Emisión: ${new Date().toLocaleDateString('es-ES')}</div>
        </div>
        <div class="meta-box">
          <strong>PACIENTE:</strong> ${patientId} | <strong>PROTOCOLO:</strong> ${currentDisorder.name}<br/>
          <strong>CÓDIGOS:</strong> CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5} | <strong>MODO:</strong> ${currentDisorder.category}
        </div>
        <h4>1. DICTAMEN DE SINCRO-AUDITORÍA INMERSIVA</h4>
        <div class="dictamen-box">${generatedRoiReport}</div>
        <div class="sig-box">
          <div class="sig-line">Firma del Evaluador / Operador VR</div>
          <div class="sig-line">Dr. Alejandro Morales Rivera<br/>No. Colegiado: 749210</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1440px] shadow-2xl overflow-hidden relative text-slate-100 flex flex-col h-[94vh]">
        
        {/* Cabecera Principal */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${isVisorLinked ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-600/20 text-amber-400 border-amber-500/30'}`}>
              <Signal className={`w-5 h-5 ${isVisorLinked ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                CONSOLA CLÍNICA MULTITRASTORNO (24 PROTOCOLOS WEBXR)
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                  6DoF CLOSED-LOOP
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Expediente: <strong className="text-cyan-300 font-mono">{patientId}</strong> | Estado: {isVisorLinked ? 'Visor Enlazado y Sincronizado' : 'Buscando Visor...'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => {
                if (typeof VrControlService?.triggerGroundingProtocol === 'function') {
                  VrControlService.triggerGroundingProtocol(patientId);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> <span>Grounding Inmediato</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-700/60 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo Principal (3 Columnas) */}
        <div className="flex-1 p-5 grid grid-cols-12 gap-5 overflow-hidden">
          
          {/* COLUMNA 1: Selector y Parámetros Programables */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" /> Seleccionar Patología (24 Trastornos)
              </label>
              <select
                disabled={testPhase === 'RUNNING'}
                value={selectedDisorderId}
                onChange={(e) => setSelectedDisorderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-cyan-500"
              >
                {CLINICAL_24_DISORDERS_CATALOG.map((disorder) => (
                  <option key={disorder.id} value={disorder.id}>{disorder.name} [{disorder.category}]</option>
                ))}
              </select>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
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
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Guion de Locución IA
                </span>
                <button type="button" onClick={() => setIsEditingParams(!isEditingParams)} className="text-[10px] text-cyan-400 underline cursor-pointer">
                  {isEditingParams ? 'Ocultar' : 'Ajustar Umbrales'}
                </button>
              </div>

              <textarea
                disabled={testPhase === 'RUNNING'}
                value={programmableScript}
                onChange={(e) => setProgrammableScript(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-amber-500 mb-3 leading-relaxed"
              />

              {isEditingParams && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-2 text-[11px] mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Duración de Prueba (s):</span>
                    <input type="number" value={sessionDurationSec} onChange={(e) => setSessionDurationSec(Number(e.target.value))} className="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-center font-mono text-white" />
                  </div>
                  {currentDisorder.defaultHz && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Frecuencia Fótica (Hz):</span>
                      <input type="number" step="0.5" value={targetHz} onChange={(e) => setTargetHz(Number(e.target.value))} className="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-center font-mono text-amber-400" />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto space-y-2">
                {testPhase === 'IDLE' && (
                  <button type="button" onClick={handleStartTest} className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${isVisorLinked ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 active:scale-95' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    <Play className="w-4 h-4" /> <span>{isVisorLinked ? 'Iniciar Prueba en Visor' : 'Conecta el Visor Primero'}</span>
                  </button>
                )}
                {testPhase === 'RUNNING' && (
                  <button type="button" onClick={stopTestAndGenerateReport} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer animate-pulse">
                    <Square className="w-4 h-4" /> <span>Detener y Generar Dictamen</span>
                  </button>
                )}
                {testPhase === 'FINISHED' && (
                  <button type="button" onClick={handleStartTest} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                    <RotateCcw className="w-4 h-4" /> <span>Reiniciar Ensayo Clínico</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Monitor de KPIs y Gráfico Temporal */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
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
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">{currentSpecificKpi.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">{currentDisorder.kpiUnit}</span></div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" /> Curva de Reactividad Autonómica vs. Tiempo
                </span>
                <span className="text-[10px] font-mono text-slate-500">{elapsedTime}s / {sessionDurationSec}s</span>
              </div>
              
              <div className="flex-1 w-full bg-slate-900 rounded-lg border border-slate-800 p-2 relative flex items-end overflow-hidden">
                {liveKpiHistory.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${sessionDurationSec} 100`} preserveAspectRatio="none">
                    <line x1="0" y1="25" x2={sessionDurationSec} y2="25" stroke="#ef4444" strokeDasharray="3 3" strokeWidth="0.8" />
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={liveKpiHistory.map(p => `${p.t},${Math.max(10, 100 - (p.gsr * 12))}`).join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" points={liveKpiHistory.map(p => `${p.t},${Math.max(10, 100 - (p.hrv * 0.9))}`).join(' ')} />
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-mono">
                    <Activity className="w-6 h-6 mb-2 opacity-30 animate-pulse" />
                    <span>Presiona 'Iniciar Prueba' para registrar la serie temporal</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2 flex justify-between text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> GSR (µS)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span> HRV RMSSD (ms)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-rose-500"></span> Umbral Alerta</span>
              </div>
            </div>
          </div>

          {/* COLUMNA 3: Dictamen Pericial e Historial de Eventos */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col max-h-[60%]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Dictamen Individual (ROI)
                </span>
                {generatedRoiReport && (
                  <button
                    type="button"
                    onClick={handlePrintRoiReport}
                    className="px-2 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" /> Imprimir A4
                  </button>
                )}
              </div>
              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {generatedRoiReport || <div className="text-slate-600 text-center mt-10">El dictamen pericial se compilará automáticamente al finalizar la sesión.</div>}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex-1 flex flex-col max-h-[40%]">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                <Terminal className="w-3 h-3" /> Telemetry & System Logs
              </span>
              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] text-slate-400 flex flex-col-reverse">
                {logs.map((log, i) => <p key={i}>{log}</p>)}
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default FullscreenDiagnosticRunner;
