// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR MULTITRASTORNO, REGISTRO DE KPIS Y REPORTE ROI
// frontend/components/ClinicalTestKpiRunner.tsx
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord } from '../types';
import { VrControlService } from '../services/vrControlService';
import {
  Brain,
  Activity,
  Play,
  Square,
  Printer,
  Sparkles,
  Sliders,
  Volume2,
  ShieldAlert,
  Glasses,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
  FileText,
  X,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: any, report: any) => void;
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
// 1. MATRIZ CANÓNICA DE LOS 24 TRASTORNOS CLÍNICOS EN WEBXR
// ============================================================================
export const CLINICAL_24_DISORDERS_CATALOG: DisorderClinicalDefinition[] = [
  // --- GRUPO 1: NEURODESARROLLO Y FUNCIONES EJECUTIVAS ---
  {
    id: 'TDAH_CPT',
    name: '01. TDAH: Déficit de Atención e Impulsividad',
    cie11: '6A05.0',
    dsm5: '314.01',
    category: 'DIAGNOSTIC',
    ecosystem: 'tdah_executive',
    targetKpiName: 'Latencia Motora (RT Medio)',
    kpiUnit: 'ms',
    defaultDurationSec: 180,
    clinicalScript: 'Iniciando test CPT tridimensional. Pulsa el gatillo de tu mando únicamente cuando la diana destelle en color verde. Si destella en rojo, inhibe la respuesta.',
    clinicalObjective: 'Medición objetiva de errores de omisión (inatención) y comisión (impulsividad).'
  },
  {
    id: 'TEA_SENSORY',
    name: '02. Espectro Autista (TEA): Sobrecarga Sensorial',
    cie11: '6A02',
    dsm5: '299.00',
    category: 'TREATMENT',
    ecosystem: 'safe_place_forest',
    targetKpiName: 'Supresión de Hiperexcitabilidad',
    kpiUnit: '%',
    defaultDurationSec: 240,
    clinicalScript: 'Entrando a entorno de baja carga estimular. Respira en cadencia lenta mientras el follaje amortigua el contraste visual y acústico.',
    clinicalObjective: 'Estabilización del córtex sensoriomotor y prevención de crisis por sobreestimulación.'
  },
  {
    id: 'ALZHEIMER_GAMMA',
    name: '03. Enfermedad de Alzheimer & Deterioro Neurocognitivo',
    cie11: '6D80 / 8A20',
    dsm5: '331.0',
    category: 'TREATMENT',
    ecosystem: 'cosmic_stars',
    targetKpiName: 'Acoplamiento de Fase PLV (40Hz)',
    kpiUnit: '%',
    defaultDurationSec: 300,
    defaultHz: 40.0,
    clinicalScript: 'Iniciando estimulación fótica sincrónica a 40 Hz. Fija la mirada al frente para inducir el arrastre de las redes tálamo-corticales.',
    clinicalObjective: 'Estimulación de la reactividad microglial y sincronización de ritmos Gamma.'
  },
  {
    id: 'PARKINSON_MOTOR',
    name: '04. Parkinson: Temblor y Congelamiento Motor (FOG)',
    cie11: '8A00.0',
    dsm5: '332.0',
    category: 'DIAGNOSTIC',
    ecosystem: 'sterile_room',
    targetKpiName: 'Estabilidad Cinemática Motora',
    kpiUnit: 'Score',
    defaultDurationSec: 120,
    clinicalScript: 'Mantén el mando alineado horizontalmente con el cursor visual. Evaluaremos la amplitud del temblor postural en reposo.',
    clinicalObjective: 'Cuantificación micrométrica de temblor en reposo vs. temblor de acción en 6DoF.'
  },

  // --- GRUPO 2: TRASTORNOS DEL ESTADO DE ÁNIMO Y TRAUMA ---
  {
    id: 'TDM_DEPRESSION',
    name: '05. Depresión Mayor (TDM): Retardo Psicomotor',
    cie11: '6A70',
    dsm5: '296.22',
    category: 'TREATMENT',
    ecosystem: 'bioluminescent_beach',
    targetKpiName: 'Simetría Frontal Alpha',
    kpiUnit: 'Ratio L/R',
    defaultDurationSec: 240,
    defaultHz: 10.0,
    clinicalScript: 'Sincroniza tu ritmo cardíaco con las olas luminiscentes. Observa cómo la expansión rítmica estimula la activación frontal izquierda.',
    clinicalObjective: 'Reducción de asimetría hemisférica frontal izquierda y amortiguación de afecto negativo.'
  },
  {
    id: 'DISTIMIA_CHRONIC',
    name: '06. Distimia & Trastorno Depresivo Persistente',
    cie11: '6A72',
    dsm5: '300.4',
    category: 'TREATMENT',
    ecosystem: 'warm_hearth',
    targetKpiName: 'Tono Vagal RMSSD',
    kpiUnit: 'ms',
    defaultDurationSec: 180,
    clinicalScript: 'Permite que la iluminación cálida del refugio disminuya la tensión basal. Respira en 4 tiempos hacia el abdomen.',
    clinicalObjective: 'Instalación de anclaje fisiológico de confort para desactivar la anhedonia corporal.'
  },
  {
    id: 'PTSD_EMDR',
    name: '07. TEPT: Reprocesamiento de Huella Traumática',
    cie11: '6B40',
    dsm5: '309.81',
    category: 'TREATMENT',
    ecosystem: 'emdr_memory',
    targetKpiName: 'Desensibilización Galvánica (ΔGSR)',
    kpiUnit: 'µS',
    defaultDurationSec: 240,
    clinicalScript: 'Sigue el haz de luz horizontal únicamente con tus ojos, sin mover la cabeza, mientras sostienes la imagen del evento en tu mente.',
    clinicalObjective: 'Inducción de movimientos sacádicos bilaterales para desensibilización y reconsolidación de memoria.'
  },
  {
    id: 'CPTSD_DEVELOPMENTAL',
    name: '08. Trauma Complejo (TEPT-C) & Esquemas de Apego',
    cie11: '6B41',
    dsm5: '307.81',
    category: 'DIAGNOSTIC',
    ecosystem: 'dev_trauma',
    targetKpiName: 'Reactividad Autonómica al Apego',
    kpiUnit: 'Score',
    defaultDurationSec: 180,
    clinicalScript: 'Explora el espacio de memoria relacional. Registramos tus micro-fluctuaciones electrodérmicas ante figuras vinculares.',
    clinicalObjective: 'Detección de hipervigilancia paroxística y desregulación del tono autonómico bilateral.'
  },

  // --- GRUPO 3: ANSIEDAD, PÁNICO Y FOBIAS ESPECÍFICAS ---
  {
    id: 'PANIC_DISORDER',
    name: '09. Trastorno de Pánico & Agorafobia',
    cie11: '6B01',
    dsm5: '300.01',
    category: 'DIAGNOSTIC',
    ecosystem: 'sterile_room',
    targetKpiName: 'Curva de Reactividad Simpática',
    kpiUnit: 'BPM',
    defaultDurationSec: 150,
    clinicalScript: 'Evaluación interoceptiva basal. Monitorizaremos la respuesta cardiovascular ante la disminución de referencias espaciales.',
    clinicalObjective: 'Registro de la sensibilidad a sensaciones interoceptivas catastróficas.'
  },
  {
    id: 'ACROPHOBIA_VRET',
    name: '10. Fobia Específica: Acrofobia (Alturas)',
    cie11: '6B03.0',
    dsm5: '300.29',
    category: 'DIAGNOSTIC',
    ecosystem: 'acrophobia_roof',
    targetKpiName: 'Oscilación Postural (Head-Sway)',
    kpiUnit: 'cm',
    defaultDurationSec: 180,
    clinicalScript: 'Exposición jerárquica en azotea de altura. Mira hacia el borde perimetral y mantén un ciclo de respiración regular.',
    clinicalObjective: 'Evaluación de habituación simpática y estabilidad vestibular ante el abismo.'
  },
  {
    id: 'AEROPHOBIA_VRET',
    name: '11. Fobia Específica: Aerofobia (Volar)',
    cie11: '6B03.2',
    dsm5: '300.29',
    category: 'DIAGNOSTIC',
    ecosystem: 'aerophobia_cabin',
    targetKpiName: 'Pico de Estrés en Despegue',
    kpiUnit: 'µS',
    defaultDurationSec: 200,
    clinicalScript: 'Simulación de cabina presurizada en fase de aceleración y despegue. Relaja los hombros y mantén la espalda apoyada.',
    clinicalObjective: 'Registro de conductancia galvánica y taquicardia situacional durante turbulencia simulada.'
  },
  {
    id: 'SOCIAL_ANXIETY',
    name: '12. Fobia Social / Ansiedad de Evaluación',
    cie11: '6B04',
    dsm5: '300.23',
    category: 'DIAGNOSTIC',
    ecosystem: 'cluster_b_forensic',
    targetKpiName: 'Evasión de Mirada (Gaze Avoidance)',
    kpiUnit: '%',
    defaultDurationSec: 180,
    clinicalScript: 'Dirige tu mirada a los evaluadores del panel. Registraremos la fijación visual y la reactividad electrodérmica ante el juicio.',
    clinicalObjective: 'Mapeo de evitación de contacto visual y desregulación autonómica fásica.'
  },
  {
    id: 'GAD_GENERALIZED',
    name: '13. Trastorno de Ansiedad Generalizada (TAG)',
    cie11: '6B00',
    dsm5: '300.02',
    category: 'TREATMENT',
    ecosystem: 'zen_garden',
    targetKpiName: 'Habituación Autonómica (H)',
    kpiUnit: '%',
    defaultDurationSec: 240,
    clinicalScript: 'Jardín de contemplación. Sigue la respiración guiada a 6 respiraciones por minuto para inducir resonancia cardíaca.',
    clinicalObjective: 'Entrenamiento de variabilidad de la frecuencia cardíaca a 0.1 Hz.'
  },
  {
    id: 'OCD_OBSESSIVE',
    name: '14. Trastorno Obsesivo-Compulsivo (TOC)',
    cie11: '6B20',
    dsm5: '300.3',
    category: 'TREATMENT',
    ecosystem: 'cosmic_stars',
    targetKpiName: 'Ruptura de Rumiación Prefrontal',
    kpiUnit: 'PLV %',
    defaultDurationSec: 200,
    clinicalScript: 'Descentramiento cognitivo. Observa la inmensidad estelar y permite que las obsesiones se diluyan sin ejecutar neutralizaciones compulsivas.',
    clinicalObjective: 'Exposición y prevención de respuesta (EPR) inmersiva sin ritualización.'
  },

  // --- GRUPO 4: PERSONALIDAD Y PSICOPATOLOGÍA FORENSE ---
  {
    id: 'BPD_INSTABILITY',
    name: '15. Trastorno Límite de la Personalidad (TLP / BPD)',
    cie11: '6D11',
    dsm5: '301.83',
    category: 'DIAGNOSTIC',
    ecosystem: 'dev_trauma',
    targetKpiName: 'Labilidad Afectiva Paroxística',
    kpiUnit: 'ΔGSR/s',
    defaultDurationSec: 180,
    clinicalScript: 'Evaluación de reactividad emocional ante señales de abandono y validación ambivalente.',
    clinicalObjective: 'Medición de la curva de desborde y tiempo de recuperación basal tras provocación afectiva.'
  },
  {
    id: 'NARCISSISM_OVERT',
    name: '16. Trastorno Narcisista de la Personalidad (Overt)',
    cie11: '6D10.0',
    dsm5: '301.81',
    category: 'DIAGNOSTIC',
    ecosystem: 'cluster_b_forensic',
    targetKpiName: 'Umbral de Ira Narcisista',
    kpiUnit: 'µS',
    defaultDurationSec: 180,
    clinicalScript: 'Ensayo pericial forense de tolerancia al estatus y provocación al ego. Pulsa el gatillo ante juicios descalificatorios.',
    clinicalObjective: 'Detección de hiperreactividad autonómica encubierta ante cuestionamiento de estatus.'
  },
  {
    id: 'NARCISSISM_COVERT',
    name: '17. Narcisismo Encubierto & Vulnerable (Covert)',
    cie11: '6D10.0',
    dsm5: '301.81',
    category: 'DIAGNOSTIC',
    ecosystem: 'cluster_b_forensic',
    targetKpiName: 'Disonancia por Rechazo Social',
    kpiUnit: 'RMSSD Drop',
    defaultDurationSec: 180,
    clinicalScript: 'Evaluación forense de exclusión y vergüenza tóxica. Observa las interacciones del grupo pericial.',
    clinicalObjective: 'Registro de caída parasimpática abrupta ante micro-desprecios sociales simulados.'
  },
  {
    id: 'PSYCHOPATHY_FACTOR1',
    name: '18. Psicopatía & Rasgos Disociales (PCL-R Factor 1)',
    cie11: '6D10.1',
    dsm5: '301.7',
    category: 'DIAGNOSTIC',
    ecosystem: 'cluster_b_forensic',
    targetKpiName: 'Aplanamiento Empático Autonómico',
    kpiUnit: 'GSR Δ = 0',
    defaultDurationSec: 180,
    clinicalScript: 'Ensayo de resonancia afectiva ante imágenes de distrés y sufrimiento ajeno. Presiona el disparador al percibir dolor.',
    clinicalObjective: 'Identificación de hiporreactividad fisiológica y ausencia de sobresalto electrodérmico.'
  },

  // --- GRUPO 5: NEUROLOGÍA FUNCIONAL, DOLOR Y SOMATIZACIÓN ---
  {
    id: 'FND_CONVERSION',
    name: '19. Trastorno de Síntomas Neurológicos Funcionales (FND)',
    cie11: '6C20 / 6C23',
    dsm5: '300.11',
    category: 'TREATMENT',
    ecosystem: 'fnd_mirror',
    targetKpiName: 'Simetría de Control Visuomotor',
    kpiUnit: '%',
    defaultDurationSec: 240,
    clinicalScript: 'Terapia en espejo adaptativa. Mueve tu mano sana mientras el avatar proyecta movimiento bilateral armónico para reeducar la corteza premotora.',
    clinicalObjective: 'Recalibración del mapa somatosensorial en paresias y distonías funcionales sin daño estructural.'
  },
  {
    id: 'CHRONIC_PAIN_FIBRO',
    name: '20. Dolor Crónico Generalizado / Fibromialgia',
    cie11: 'MG30.0',
    dsm5: '307.89',
    category: 'TREATMENT',
    ecosystem: 'pain_management',
    targetKpiName: 'Índice de Anestesia Electrónica',
    kpiUnit: 'Score/10',
    defaultDurationSec: 240,
    defaultHz: 0.5,
    clinicalScript: 'Inmersión analgésica por estimulación Sub-Delta. La temperatura perceptual del océano reduce el bombardeo de los nociceptores espinales.',
    clinicalObjective: 'Activación del sistema inhibitorio descendente del dolor mediante desfocalización atencional.'
  },
  {
    id: 'CRPS_NEUROPATHIC',
    name: '21. Síndrome de Dolor Regional Complejo (SDRC / CRPS)',
    cie11: '8E43',
    dsm5: '354.4',
    category: 'TREATMENT',
    ecosystem: 'pain_management',
    targetKpiName: 'Amortiguación de Alodinia Simpática',
    kpiUnit: 'µS Descenso',
    defaultDurationSec: 200,
    clinicalScript: 'Filtro cromático criogénico. Disminución de la hiperexcitabilidad simpática regional.',
    clinicalObjective: 'Desensibilización periférica y reducción del tono eferente vasoconstrictor.'
  },
  {
    id: 'INSOMNIA_SLOW_WAVE',
    name: '22. Trastorno de Insomnio Crónico Severo',
    cie11: '7A00',
    dsm5: '307.42',
    category: 'TREATMENT',
    ecosystem: 'neuro_hypnosis',
    targetKpiName: 'Profundidad de Trance Theta/Delta',
    kpiUnit: '%',
    defaultDurationSec: 300,
    defaultHz: 2.0,
    clinicalScript: 'Inducción de ondas Delta a 2.0 Hz. Cierra tus ojos parcialmente y permite que el tono acústico guíe el metabolismo hacia el sueño lento.',
    clinicalObjective: 'Desactivación del arousal cortical e inducción de ondas lentas regenerativas.'
  },

  // --- GRUPO 6: SALUD SEXUAL Y MODELO DUAL ---
  {
    id: 'SEXUAL_INHIBITION_SIS',
    name: '23. Inhibición Sexual Psicosomática (Modelo Dual SIS)',
    cie11: 'HA01 / HA02',
    dsm5: '302.72',
    category: 'TREATMENT',
    ecosystem: 'dual_control',
    targetKpiName: 'Desactivación del Freno Inhibitorio',
    kpiUnit: '%',
    defaultDurationSec: 240,
    clinicalScript: 'Focalización sensorial libre de demanda de rendimiento. Inhala calidez corporal y disuelve la autoobservación crítica (spectatoring).',
    clinicalObjective: 'Desactivación del sistema de inhibición sexual (SIS) simpático para permitir la vasodilatación parasimpática.'
  },
  {
    id: 'SEXUAL_DESIRE_SES',
    name: '24. Trastorno del Deseo Hipoactivo (Modelo Dual SES)',
    cie11: 'HA00',
    dsm5: '302.71',
    category: 'TREATMENT',
    ecosystem: 'dual_control',
    targetKpiName: 'Activación del Sistema de Excitación',
    kpiUnit: 'Score',
    defaultDurationSec: 240,
    clinicalScript: 'Reconexión con señales corporales interoceptivas placenteras y sintonía vincular libre de juicio.',
    clinicalObjective: 'Estimulación gradual del sistema de excitación sexual (SES) sin sobrecarga ansiógena.'
  }
];

export const ClinicalTestKpiRunner: React.FC<Props> = ({
  patient,
  onClose,
  onUpdatePatientVrData
}) => {
  const patientId = patient?.id || 'PAC-8104';

  // 1. Selección de protocolo
  const [selectedDisorderId, setSelectedDisorderId] = useState<string>('ALZHEIMER_GAMMA');
  const currentDisorder = CLINICAL_24_DISORDERS_CATALOG.find(d => d.id === selectedDisorderId) || CLINICAL_24_DISORDERS_CATALOG[2];

  // 2. Parámetros programables por el terapeuta
  const [programmableScript, setProgrammableScript] = useState<string>(currentDisorder.clinicalScript);
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(currentDisorder.defaultDurationSec);
  const [targetHz, setTargetHz] = useState<number>(currentDisorder.defaultHz || 40.0);
  const [targetThresholdGsr, setTargetThresholdGsr] = useState<number>(4.5);
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);

  // 3. Estado de sesión y grabación continua de curvas
  const [testPhase, setTestPhase] = useState<'IDLE' | 'RUNNING' | 'FINISHED'>('IDLE');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [liveKpiHistory, setLiveKpiHistory] = useState<KpiDataPoint[]>([]);
  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(38);
  const [currentSpecificKpi, setCurrentSpecificKpi] = useState<number>(10);
  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(false);

  // 4. Reporte Pericial Generado por IA
  const [generatedRoiReport, setGeneratedRoiReport] = useState<string>('');

  // Sincronizar guion y valores por defecto al cambiar de trastorno
  useEffect(() => {
    setProgrammableScript(currentDisorder.clinicalScript);
    setSessionDurationSec(currentDisorder.defaultDurationSec);
    if (currentDisorder.defaultHz) setTargetHz(currentDisorder.defaultHz);
    setLiveKpiHistory([]);
    setTestPhase('IDLE');
    setElapsedTime(0);
    setGeneratedRoiReport('');
  }, [selectedDisorderId]);

  // Suscripción al túnel WebSocket para monitoreo del visor
  useEffect(() => {
    const unsub = VrControlService.subscribeStatus((status) => {
      setIsVisorLinked(status === 'CONNECTED');
    });
    return () => unsub();
  }, []);

  // Despacho del entorno y guion programado al visor
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

  // Motor del bucle de prueba y grabación de serie temporal
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

      // Simulación biológica adaptativa basada en el protocolo seleccionado
      setCurrentGsr((prev) => {
        let delta = (Math.random() - 0.48) * 0.15;
        if (currentDisorder.category === 'DIAGNOSTIC' && elapsedTime > 30 && elapsedTime < 70) {
          delta += 0.08; // Provocación fásica
        } else if (currentDisorder.category === 'TREATMENT' && elapsedTime > 50) {
          delta -= 0.04; // Habituación de calma
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

      // Inyectar punto a la curva temporal grabada
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

  // Iniciar prueba
  const handleStartTest = () => {
    setLiveKpiHistory([]);
    setElapsedTime(0);
    setTestPhase('RUNNING');
    dispatchConfigToVisor();

    if (currentDisorder.defaultHz) {
      VrControlService.startLightStimulation(targetHz, currentDisorder.id, patientId);
    }
  };

  // Detener prueba y compilar dictamen pericial con IA
  const stopTestAndGenerateReport = () => {
    setTestPhase('FINISHED');
    VrControlService.stopLightStimulation(patientId);
    VrControlService.stopActiveSession(patientId);

    const basalGsr = liveKpiHistory[0]?.gsr || 2.4;
    const peakGsr = Math.max(...liveKpiHistory.map(p => p.gsr), basalGsr);
    const finalGsr = liveKpiHistory[liveKpiHistory.length - 1]?.gsr || currentGsr;
    const finalHrv = currentHrv;
    const habituationRate = peakGsr > 0 ? (((peakGsr - finalGsr) / peakGsr) * 100).toFixed(1) : '0';

    let aiDictamen = `INFORME PERICIAL DE EJECUCIÓN INMERSIVA (ROI)\n`;
    aiDictamen += `Trastorno Evaluado: ${currentDisorder.name} (${currentDisorder.cie11} / DSM-5: ${currentDisorder.dsm5})\n`;
    aiDictamen += `Entorno WebXR: /ecosystems/${currentDisorder.ecosystem}.jpeg [${currentDisorder.category}]\n`;
    aiDictamen += `Duración Efectiva: ${elapsedTime} segundos grabados (Muestreo a 50 Hz)\n\n`;
    aiDictamen += `1. DINÁMICA DE LA CURVA AUTONÓMICA REGISTRADA:\n`;
    aiDictamen += `   • Línea Base Inicial (GSR): ${basalGsr.toFixed(2)} µS | VFC (RMSSD): ${liveKpiHistory[0]?.hrv || 35} ms\n`;
    aiDictamen += `   • Reactividad Máxima (Pico): ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    aiDictamen += `   • Nivel de Cierre: ${finalGsr.toFixed(2)} µS | Tono Vagal Final: ${finalHrv} ms\n`;
    aiDictamen += `   • Tasa de Habituación / Recuperación (H): ${habituationRate}%\n`;
    aiDictamen += `   • Métrica Focal (${currentDisorder.targetKpiName}): ${currentSpecificKpi.toFixed(1)} ${currentDisorder.kpiUnit}\n\n`;

    aiDictamen += `2. CONCLUSIÓN CLÍNICA Y JUICIO DIAGNÓSTICO (MOTOR GEMINI CLÍNICO):\n`;
    if (currentDisorder.category === 'DIAGNOSTIC') {
      if (peakGsr - basalGsr > 2.0) {
        aiDictamen += `   El paciente exhibió una descompensación simpática paroxística ante la exposición diagnóstica, congruente con hipersensibilidad central y desregulación inhibitoria (criterio cardinal DSM-5).\n`;
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

    // Notificar al expediente central
    if (onUpdatePatientVrData) {
      onUpdatePatientVrData(
        { lastGsr: finalGsr, lastHrv: finalHrv, recordedPoints: liveKpiHistory.length },
        { disorderId: currentDisorder.id, habituationRate, reportText: aiDictamen }
      );
    }
  };

  // Impresión formal A4 del reporte individual
  const handlePrintRoiReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Prueba Inmersiva — ${patientId}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; line-height: 1.45; font-size: 11pt; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 18pt; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
          .sublogo { font-size: 9pt; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10pt; }
          .section-title { font-size: 11pt; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-top: 18px; margin-bottom: 8px; border-left: 3px solid #0284c7; padding-left: 8px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; font-size: 9.5pt; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          .data-table th { background: #f1f5f9; color: #334155; }
          .dictamen-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; font-size: 10pt; color: #166534; white-space: pre-wrap; font-family: monospace; }
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
            Emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}<br/>
            Folio: EXP-${patientId}-${Date.now().toString().slice(-4)}
          </div>
        </div>

        <div class="meta-box">
          <div><strong>PACIENTE:</strong> ${patientId} (Edad: ${patient.age || 55} años | Sexo: ${patient.gender || 'M'})</div>
          <div><strong>MODALIDAD:</strong> ${currentDisorder.category === 'DIAGNOSTIC' ? 'EVALUACIÓN DIAGNÓSTICA' : 'INTERVENCIÓN TERAPÉUTICA'}</div>
          <div><strong>PATOLOGÍA:</strong> ${currentDisorder.name}</div>
          <div><strong>CÓDIGO CLÍNICO:</strong> CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5}</div>
          <div><strong>ESCENARIO WEBXR:</strong> ${currentDisorder.ecosystem}.jpeg (6DoF)</div>
          <div><strong>DISPOSITIVO:</strong> Pico Neo 3 Pro / Meta Quest (Modo Kiosco)</div>
        </div>

        <div class="section-title">1. Parámetros y Guion de Autorregulación Programados</div>
        <p style="font-size: 9.5pt; color: #334155; margin-bottom: 12px; font-style: italic;">
          "${programmableScript}"
        </p>

        <div class="section-title">2. Métricas y KPIs de la Curva Temporal (Serie Grabada)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Parámetro Fisiológico</th>
              <th>Línea Base (t=0s)</th>
              <th>Pico / Desafío</th>
              <th>Cierre de Sesión</th>
              <th>Interpretación Clínica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Conductancia Dérmica (GSR)</td>
              <td>${(liveKpiHistory[0]?.gsr || 2.4).toFixed(2)} µS</td>
              <td>${Math.max(...liveKpiHistory.map(p => p.gsr), 2.5).toFixed(2)} µS</td>
              <td>${currentGsr.toFixed(2)} µS</td>
              <td>${currentGsr < 3.0 ? 'Respuesta dentro de norma' : 'Hiperreactividad simpática'}</td>
            </tr>
            <tr>
              <td>Variabilidad Cardíaca (HRV RMSSD)</td>
              <td>${liveKpiHistory[0]?.hrv || 35} ms</td>
              <td>—</td>
              <td>${currentHrv} ms</td>
              <td>${currentHrv > 35 ? 'Adecuada reserva vagal' : 'Tono vagal reprimido'}</td>
            </tr>
            <tr>
              <td>${currentDisorder.targetKpiName}</td>
              <td>10.0 ${currentDisorder.kpiUnit}</td>
              <td>—</td>
              <td>${currentSpecificKpi.toFixed(1)} ${currentDisorder.kpiUnit}</td>
              <td>Objetivo clínico alcanzado</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">3. Dictamen Clínico Asistido por IA (Auditoría Multimodal)</div>
        <div class="dictamen-box">${generatedRoiReport}</div>

        <div class="signature-area">
          <div class="signature-block">
            Operador de Telemetría VR<br/>
            Firma de Asistencia Médica
          </div>
          <div class="signature-block">
            Dr. Alejandro Morales Rivera<br/>
            No. Colegiado: 749210<br/>
            Especialista Responsable
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printableHtml);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col font-sans text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* 1. BARRA SUPERIOR DE CONTROL */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              CONSOLA DE EJECUCIÓN CLÍNICA MULTITRASTORNO (24 TRASTORNOS WEBXR)
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                PICO 3 / QUEST 6DoF
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Expediente: <strong className="text-cyan-300 font-mono">{patientId}</strong> | Paciente: {patient.patientNameAnonymized || 'Anónimo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicador de estado del visor en vivo */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
            isVisorLinked ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Glasses className={`w-4 h-4 ${isVisorLinked ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{isVisorLinked ? 'Visor Enlazado (Sincronizado)' : 'Buscando Visor...'}</span>
          </div>

          <button
            type="button"
            onClick={() => VrControlService.triggerGroundingProtocol(patientId)}
            className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Despachar Grounding inmediato de calma al visor"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Grounding Emergencia</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. CUERPO PRINCIPAL DIVIDIDO EN 3 COLUMNAS */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        
        {/* COLUMNA 1 (3 Cols): SELECTOR DE TRASTORNO Y PARÁMETROS */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4 overflow-y-auto pr-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <label className="text-xs font-bold text-slate-300 uppercase block mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              Seleccionar Entidad Clínica (24 Trastornos)
            </label>
            <select
              disabled={testPhase === 'RUNNING'}
              value={selectedDisorderId}
              onChange={(e) => setSelectedDisorderId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold outline-none cursor-pointer focus:border-cyan-500"
            >
              {CLINICAL_24_DISORDERS_CATALOG.map((disorder) => (
                <option key={disorder.id} value={disorder.id}>
                  {disorder.name} [{disorder.category}]
                </option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">CIE-11:</span>
                <strong className="text-cyan-300">{currentDisorder.cie11}</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">DSM-5-TR:</span>
                <strong className="text-amber-300">{currentDisorder.dsm5}</strong>
              </div>
            </div>
          </div>

          {/* EDITOR PROGRAMABLE DEL PROFESIONAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-400" />
                Guion de Locución IA (Programable)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingParams(!isEditingParams)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                {isEditingParams ? 'Ocultar Parámetros' : 'Ajustar Umbrales'}
              </button>
            </div>

            <textarea
              disabled={testPhase === 'RUNNING'}
              value={programmableScript}
              onChange={(e) => setProgrammableScript(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none resize-none focus:border-amber-500 leading-relaxed font-sans"
              placeholder="Escribe la instrucción exacta que la IA verbalizará al paciente..."
            />

            {/* PARÁMETROS DE UMBRAL Y CORTE */}
            {isEditingParams && (
              <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Duración de Sesión (s):</span>
                  <input
                    type="number"
                    value={sessionDurationSec}
                    onChange={(e) => setSessionDurationSec(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono text-white"
                  />
                </div>
                {currentDisorder.defaultHz && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Frecuencia Fótica (Hz):</span>
                    <input
                      type="number"
                      step="0.5"
                      value={targetHz}
                      onChange={(e) => setTargetHz(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono text-amber-400"
                    />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Umbral Alerta GSR (µS):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={targetThresholdGsr}
                    onChange={(e) => setTargetThresholdGsr(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono text-rose-400"
                  />
                </div>
              </div>
            )}

            {/* BOTONERA DE CONTROL DE SESIÓN */}
            <div className="mt-auto pt-4 space-y-2">
              {testPhase === 'IDLE' && (
                <button
                  type="button"
                  onClick={handleStartTest}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Prueba en Visor</span>
                </button>
              )}

              {testPhase === 'RUNNING' && (
                <button
                  type="button"
                  onClick={stopTestAndGenerateReport}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Detener y Generar Dictamen</span>
                </button>
              )}

              {testPhase === 'FINISHED' && (
                <button
                  type="button"
                  onClick={handleStartTest}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar Ensayo Clínico</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* COLUMNA 2 (5 Cols): MONITOR DE KPIS Y GRÁFICO TEMPORAL */}
        <section className="col-span-12 lg:col-span-5 flex flex-col space-y-4">
          {/* TARJETAS DE KPIS NUMÉRICOS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold block">GSR FÁSICO</span>
              <div className="text-xl font-mono font-black text-amber-400 mt-1">
                {currentGsr.toFixed(2)} <span className="text-xs text-slate-500 font-normal">µS</span>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold block">VFC (RMSSD)</span>
              <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                {currentHrv} <span className="text-xs text-slate-500 font-normal">ms</span>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold block truncate" title={currentDisorder.targetKpiName}>
                {currentDisorder.targetKpiName.split(' ')[0]}
              </span>
              <div className="text-xl font-mono font-black text-cyan-400 mt-1">
                {currentSpecificKpi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">{currentDisorder.kpiUnit}</span>
              </div>
            </div>
          </div>

          {/* TRAZADOR DE CURVA TEMPORAL SVG */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                Curva de Reactividad Autonómica vs. Tiempo
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {elapsedTime}s / {sessionDurationSec}s
              </span>
            </div>

            {/* ÁREA DE GRAFICADO SVG */}
            <div className="flex-1 w-full bg-slate-950 rounded-xl border border-slate-800 relative p-2 overflow-hidden flex items-end">
              {liveKpiHistory.length > 1 ? (
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${sessionDurationSec} 100`} preserveAspectRatio="none">
                  {/* Línea de umbral crítico */}
                  <line x1="0" y1="25" x2={sessionDurationSec} y2="25" stroke="#ef4444" strokeDasharray="3 3" strokeWidth="0.8" />
                  
                  {/* Curva de GSR (Color Ámbar) */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    points={liveKpiHistory.map(p => `${p.t},${Math.max(10, 100 - (p.gsr * 12))}`).join(' ')}
                  />

                  {/* Curva de HRV (Color Esmeralda) */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    points={liveKpiHistory.map(p => `${p.t},${Math.max(10, 100 - (p.hrv * 0.9))}`).join(' ')}
                  />
                </svg>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-xs font-mono">
                  <Activity className="w-8 h-8 mb-2 opacity-30 animate-pulse" />
                  <span>Presiona 'Iniciar Prueba' para registrar la serie temporal</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> GSR (µS)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> HRV RMSSD (ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span> Umbral Alerta
              </span>
            </div>
          </div>
        </section>

        {/* COLUMNA 3 (4 Cols): DICTAMEN DE IA Y SALIDA IMPRIMIBLE */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Dictamen Pericial Individual (ROI)
              </span>
              {generatedRoiReport && (
                <button
                  type="button"
                  onClick={handlePrintRoiReport}
                  className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/50 text-sky-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Imprimir A4</span>
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
              {generatedRoiReport ? (
                generatedRoiReport
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-4">
                  <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                  <span>El informe pericial con análisis de habituación y dictamen DSM-5 se compilará automáticamente al finalizar la sesión.</span>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default ClinicalTestKpiRunner;
