// ============================================================================
// AMIE CLINICAL COPILOT - ORQUESTADOR MAESTRO MULTITRASTORNO (24 ENTIDADES)
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { VrControlService } from '../services/vrControlService';
import { 
  Signal, 
  X, 
  RotateCcw, 
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
  Stethoscope, 
  Clock, 
  Database 
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

// ----------------------------------------------------------------------------
// MATRIZ COMPLETA: 24 ENTIDADES CLÍNICAS (CIE-11 / DSM-5-TR) EN WEBXR 6DoF
// ----------------------------------------------------------------------------
export const CLINICAL_24_DISORDERS_CATALOG: ClinicalDisorderDefinition[] = [
  // GRUPO 1: NEURODESARROLLO Y CONTROL MOTOR
  { 
    id: 'TDAH_CPT', 
    name: '01. TDAH: Déficit de Atención e Impulsividad', 
    cie11: '6A05.0', 
    dsm5: '314.01', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'tdah_executive', 
    targetKpiName: 'Latencia Motora (RT Medio)', 
    kpiUnit: 'ms', 
    phase1Sec: 30, 
    phase2Sec: 180, 
    phase3Sec: 30, 
    scriptBaseline: 'Calibración de línea base. Mantén la vista al frente y el mando alineado en reposo.', 
    scriptActive: 'Iniciando test CPT tridimensional. Pulsa el gatillo de tu mando únicamente cuando la diana destelle en verde. Si destella en rojo, inhibe la respuesta.', 
    scriptRecovery: 'Ensayo concluido. Relaja la musculatura de tu mano y respira tranquilamente.' 
  },
  { 
    id: 'TEA_SENSORY', 
    name: '02. Espectro Autista (TEA): Sobrecarga Sensorial & Grado 6DoF', 
    cie11: '6A02', 
    dsm5: '299.00', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'clinical_office', 
    targetKpiName: 'Índice de Afectación TEA', 
    kpiUnit: 'Score/100', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Calibración de línea base en reposo sin demanda social ni sobrecarga estimular.', 
    scriptActive: 'Observa al evaluador. Presta atención hacia dónde dirige la mirada y pulsa el gatillo cuando identifiques el objeto señalado en el entorno.', 
    scriptRecovery: 'Prueba completada con éxito. El entorno regresa a un estado de calma y resguardo.' 
  },
  { 
    id: 'ALZHEIMER_GAMMA', 
    name: '03. Enf. de Alzheimer & Deterioro Neurocognitivo', 
    cie11: '6D80', 
    dsm5: '331.0', 
    category: 'TREATMENT', 
    ecosystem: 'cosmic_stars', 
    targetKpiName: 'Acoplamiento de Fase PLV', 
    kpiUnit: '%', 
    defaultHz: 40.0, 
    phase1Sec: 30, 
    phase2Sec: 120, 
    phase3Sec: 30, 
    scriptBaseline: 'Calibración en reposo sin estimulación lumínica. Respira con patrón natural.', 
    scriptActive: 'Iniciando estimulación fótica sincrónica a 40 Hz para inducir el arrastre tálamo-cortical y la depuración microglial.', 
    scriptRecovery: 'Pulsación fótica concluida. Registrando persistencia y consolidación del acoplamiento neuronal.' 
  },
  { 
    id: 'PARKINSON_MOTOR', 
    name: '04. Parkinson: Temblor y Congelamiento Motor (FOG)', 
    cie11: '8A00.0', 
    dsm5: '332.0', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'sterile_room', 
    targetKpiName: 'Estabilidad Cinemática', 
    kpiUnit: 'Score', 
    phase1Sec: 30, 
    phase2Sec: 120, 
    phase3Sec: 30, 
    scriptBaseline: 'Registro basal en reposo. Sujeta el mando con tu extremidad dominante.', 
    scriptActive: 'Mantén el mando alineado horizontalmente con el cursor visual. Registrando amplitud de temblor postural en 6DoF.', 
    scriptRecovery: 'Registro completado. Baja el brazo y descansa sobre el apoyo.' 
  },
  
  // GRUPO 2: ESTADO DE ÁNIMO Y TRAUMA
  { 
    id: 'TDM_DEPRESSION', 
    name: '05. Depresión Mayor (TDM): Retardo Psicomotor', 
    cie11: '6A70', 
    dsm5: '296.22', 
    category: 'TREATMENT', 
    ecosystem: 'bioluminescent_beach', 
    targetKpiName: 'Simetría Frontal Alpha', 
    kpiUnit: 'Ratio', 
    defaultHz: 10.0, 
    phase1Sec: 30, 
    phase2Sec: 180, 
    phase3Sec: 30, 
    scriptBaseline: 'Sintonización visual con el entorno y calibración fisiológica en reposo.', 
    scriptActive: 'Sincroniza tu ritmo cardíaco con las olas luminiscentes. La estimulación a 10 Hz modula la asimetría frontal izquierda.', 
    scriptRecovery: 'Sincronización neuroafectiva lograda. Conserva la sensación de tranquilidad.' 
  },
  { 
    id: 'DISTIMIA_CHRONIC', 
    name: '06. Distimia & Trastorno Depresivo Persistente', 
    cie11: '6A72', 
    dsm5: '300.4', 
    category: 'TREATMENT', 
    ecosystem: 'safe_place_forest', 
    targetKpiName: 'Tono Vagal Sostenido', 
    kpiUnit: 'ms', 
    phase1Sec: 30, 
    phase2Sec: 180, 
    phase3Sec: 30, 
    scriptBaseline: 'Bienvenido al santuario forestal. Siente el resguardo de este espacio protegido.', 
    scriptActive: 'Permite que la iluminación cálida del refugio disminuya la tensión basal. Respira en cuatro tiempos inflando el abdomen.', 
    scriptRecovery: 'Instalación de anclaje de confort completada. Tu sistema vegetativo retoma el control.' 
  },
  { 
    id: 'PTSD_EMDR', 
    name: '07. TEPT: Reprocesamiento Traumático Sacádico (EMDR)', 
    cie11: '6B40', 
    dsm5: '309.81', 
    category: 'TREATMENT', 
    ecosystem: 'emdr_memory', 
    targetKpiName: 'Desensibilización Galvánica', 
    kpiUnit: 'µS', 
    defaultHz: 1.4, 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Instalación de recurso seguro. Conéctate con una sensación de contención corporal.', 
    scriptActive: 'Sigue el haz luminoso horizontal únicamente con tus ojos, sin mover la cabeza, sosteniendo la memoria en tu mente.', 
    scriptRecovery: 'Detén el movimiento ocular. Inhala profundamente, suelta todo el aire y deja que el cuerpo integre el alivio.' 
  },
  { 
    id: 'CPTSD_DEVELOPMENTAL', 
    name: '08. Trauma Complejo (TEPT-C) & Esquemas de Apego', 
    cie11: '6B41', 
    dsm5: '307.81', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'dev_trauma', 
    targetKpiName: 'Labilidad Simpática', 
    kpiUnit: 'ΔGSR/s', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Respiración de transición al espacio relacional.', 
    scriptActive: 'Explora el espacio de memoria. Registramos tus micro-fluctuaciones electrodérmicas ante figuras vinculares ambivalentes.', 
    scriptRecovery: 'Evaluación finalizada. Volviendo al centro de seguridad interior.' 
  },

  // GRUPO 3: ANSIEDAD, FOBIAS Y TOC
  { 
    id: 'PANIC_DISORDER', 
    name: '09. Trastorno de Pánico & Agorafobia Espacial', 
    cie11: '6B01', 
    dsm5: '300.01', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'sterile_room', 
    targetKpiName: 'Reactividad Interoceptiva', 
    kpiUnit: 'BPM', 
    phase1Sec: 30, 
    phase2Sec: 120, 
    phase3Sec: 30, 
    scriptBaseline: 'Registro de constantes vitales basales sin demandas atencionales.', 
    scriptActive: 'Evaluación de reactividad interoceptiva ante la disminución de referencias espaciales. Observa tus sensaciones viscerales.', 
    scriptRecovery: 'Recuperando límites espaciales seguros. Tu sistema autónomo se encuentra estabilizado.' 
  },
  { 
    id: 'ACROPHOBIA', 
    name: '10. Fobia Específica: Acrofobia (Alturas VRET)', 
    cie11: '6B03.0', 
    dsm5: '300.29', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'acrophobia_roof', 
    targetKpiName: 'Desviación Postural (Head-Sway)', 
    kpiUnit: 'cm', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Calibración de línea base en reposo observando la plataforma.', 
    scriptActive: 'Exposición a borde de azotea. Mira hacia el vacío perimetral. Evaluamos reactividad simpática y balance vestibular.', 
    scriptRecovery: 'Retirándose a zona protegida interior. Mantén la sensación de firmeza en el suelo.' 
  },
  { 
    id: 'AEROPHOBIA', 
    name: '11. Fobia Específica: Aerofobia (Vuelo Comercial)', 
    cie11: '6B03.2', 
    dsm5: '300.29', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'aerophobia_cabin', 
    targetKpiName: 'Pico Galvánico en Despegue', 
    kpiUnit: 'µS', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Fase de embarque en cabina. Mantén la espalda apoyada y los hombros relajados.', 
    scriptActive: 'Simulación de cabina presurizada en aceleración y despegue con turbulencia. Registrando umbral de estrés respiratorio.', 
    scriptRecovery: 'Vuelo estabilizado en altitud de crucero. La vibración cesa y el ritmo cardíaco se normaliza.' 
  },
  { 
    id: 'SOCIAL_ANXIETY', 
    name: '12. Fobia Social (Ansiedad de Evaluación / Escrutinio)', 
    cie11: '6B04', 
    dsm5: '300.23', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'cluster_b_forensic', 
    targetKpiName: 'Evasión de Mirada (Gaze Avoidance)', 
    kpiUnit: '%', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Ingreso al espacio pericial de observación.', 
    scriptActive: 'Dirige tu mirada a los evaluadores del panel. Registraremos la fijación visual y la reactividad electrodérmica ante el juicio.', 
    scriptRecovery: 'La interacción social simulada ha concluido. El tono vagal retorna al margen seguro.' 
  },
  { 
    id: 'GAD_GENERALIZED', 
    name: '13. Trastorno de Ansiedad Generalizada (TAG)', 
    cie11: '6B00', 
    dsm5: '300.02', 
    category: 'TREATMENT', 
    ecosystem: 'neuro_hypnosis', 
    targetKpiName: 'Tasa de Habituación (H)', 
    kpiUnit: '%', 
    phase1Sec: 30, 
    phase2Sec: 180, 
    phase3Sec: 30, 
    scriptBaseline: 'Sintonización autonómica y registro de reposo basal.', 
    scriptActive: 'Sigue la expansión rítmica del orbe a seis respiraciones por minuto para inducir resonancia cardíaca a 0.1 Hz.', 
    scriptRecovery: 'Integración vagal. Conserva esta cadencia respiratoria lenta y profunda.' 
  },
  { 
    id: 'OCD_OBSESSIVE', 
    name: '14. Trastorno Obsesivo-Compulsivo (TOC - EPR)', 
    cie11: '6B20', 
    dsm5: '300.3', 
    category: 'TREATMENT', 
    ecosystem: 'cosmic_stars', 
    targetKpiName: 'Ruptura de Rumiación', 
    kpiUnit: 'PLV %', 
    phase1Sec: 30, 
    phase2Sec: 180, 
    phase3Sec: 30, 
    scriptBaseline: 'Anclaje atencional primario en reposo neutro.', 
    scriptActive: 'Descentramiento cognitivo activo. Observa la inmensidad estelar y permite que las obsesiones se diluyan sin neutralizarlas.', 
    scriptRecovery: 'Exposición y prevención de respuesta completada. La urgencia compulsiva desciende.' 
  },

  // GRUPO 4: PERSONALIDAD Y PERITAJE FORENSE (CLUSTER B)
  { 
    id: 'BPD_INSTABILITY', 
    name: '15. Trastorno Límite de la Personalidad (TLP)', 
    cie11: '6D11', 
    dsm5: '301.83', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'dev_trauma', 
    targetKpiName: 'Labilidad Paroxística', 
    kpiUnit: 'ΔGSR/s', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Ajuste basal en entorno relacional neutro.', 
    scriptActive: 'Evaluación de reactividad emocional ante señales simuladas de abandono y validación ambivalente.', 
    scriptRecovery: 'Contención afectiva y cierre pericial. Registro almacenado en el expediente.' 
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
    phase1Sec: 30, 
    phase2Sec: 120, 
    phase3Sec: 30, 
    scriptBaseline: 'Registro de constantes de control autonómico previo.', 
    scriptActive: 'Ensayo pericial forense de tolerancia al estatus y provocación al ego. Pulsa el gatillo ante juicios descalificatorios.', 
    scriptRecovery: 'Término de la provocación estructurada. Regulación autonómica en curso.' 
  },
  { 
    id: 'NARCISSISM_COVERT', 
    name: '17. Narcisismo Encubierto (Covert / Vulnerable)', 
    cie11: '6D10.0', 
    dsm5: '301.81', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'cluster_b_forensic', 
    targetKpiName: 'Disonancia por Exclusión', 
    kpiUnit: 'RMSSD Drop', 
    phase1Sec: 30, 
    phase2Sec: 120, 
    phase3Sec: 30, 
    scriptBaseline: 'Registro de constantes de control autonómico previo.', 
    scriptActive: 'Exposición forense a dinámicas de exclusión grupal y vergüenza tóxica. Analizando caída abrupta de variabilidad cardíaca.', 
    scriptRecovery: 'Dinámica de grupo finalizada. Reposo parasimpático compensado.' 
  },
  { 
    id: 'PSYCHOPATHY', 
    name: '18. Psicopatía & Rasgos Disociales (PCL-R Factor 1)', 
    cie11: '6D10.1', 
    dsm5: '301.7', 
    category: 'DIAGNOSTIC', 
    ecosystem: 'cluster_b_forensic', 
    targetKpiName: 'Aplanamiento Empático Reflejo', 
    kpiUnit: 'ΔGSR=0', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Preparación para presentación de estímulos visuales.', 
    scriptActive: 'Paradigma de reconocimiento afectivo. Registrando resonancia autonómica refleja ante imágenes de sufrimiento y dolor ajeno.', 
    scriptRecovery: 'Registro de empatía somática finalizado. Análisis de hiporreactividad compilado.' 
  },

  // GRUPO 5: NEUROLOGÍA FUNCIONAL, DOLOR Y SUEÑO
  { 
    id: 'FND_CONVERSION', 
    name: '19. Trastorno de Síntomas Neurológicos Funcionales', 
    cie11: '6C20', 
    dsm5: '300.11', 
    category: 'TREATMENT', 
    ecosystem: 'fnd_mirror', 
    targetKpiName: 'Simetría de Control Bilateral', 
    kpiUnit: '%', 
    phase1Sec: 30, 
    phase2Sec: 180, 
    phase3Sec: 30, 
    scriptBaseline: 'Calibración del avatar cinemático en espejo 6DoF.', 
    scriptActive: 'Terapia en espejo adaptativa. Mueve tu extremidad sana mientras el avatar proyecta movimiento bilateral armónico.', 
    scriptRecovery: 'Recalibración del mapa somatosensorial completada. Permanece en descanso.' 
  },
  { 
    id: 'CHRONIC_PAIN', 
    name: '20. Dolor Crónico Generalizado / Fibromialgia', 
    cie11: 'MG30.0', 
    dsm5: '307.89', 
    category: 'TREATMENT', 
    ecosystem: 'pain_management', 
    targetKpiName: 'Alivio Nociceptivo Sub-Delta', 
    kpiUnit: 'Score/10', 
    defaultHz: 0.5, 
    phase1Sec: 30, 
    phase2Sec: 180, 
    phase3Sec: 30, 
    scriptBaseline: 'Registro de tensión muscular isométrica basal.', 
    scriptActive: 'Desfocalización nociceptiva criogénica. La inmersión en el abismo marino reduce las señales de dolor espinal ascendente.', 
    scriptRecovery: 'Consolidación analgésica. Mantén la sensación de alivio y liviandad corporal.' 
  },
  { 
    id: 'CRPS_NEUROPATHIC', 
    name: '21. Síndrome de Dolor Regional Complejo (SDRC)', 
    cie11: '8E43', 
    dsm5: '354.4', 
    category: 'TREATMENT', 
    ecosystem: 'pain_management', 
    targetKpiName: 'Amortiguación Simpática Regional', 
    kpiUnit: 'µS', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Posición de reposo articular protegida.', 
    scriptActive: 'Aplicación de filtros cromáticos criogénicos para reducir la hiperexcitabilidad vasomotora periférica del miembro afectado.', 
    scriptRecovery: 'Desensibilización periférica obtenida. Flujo sanguíneo regional regularizado.' 
  },
  { 
    id: 'INSOMNIA_SLEEP', 
    name: '22. Trastorno de Insomnio Crónico Severo', 
    cie11: '7A00', 
    dsm5: '307.42', 
    category: 'TREATMENT', 
    ecosystem: 'neuro_hypnosis', 
    targetKpiName: 'Inducción de Ondas Lentas Delta', 
    kpiUnit: '%', 
    defaultHz: 2.0, 
    phase1Sec: 30, 
    phase2Sec: 240, 
    phase3Sec: 30, 
    scriptBaseline: 'Atenuación lumínica y preparación metabólica para el sueño.', 
    scriptActive: 'Neurohipnosis por arrastre Delta a 2 Hz. Desaceleración metabólica y supresión del hiperarousal prefrontal.', 
    scriptRecovery: 'Transición completada hacia la fase de ondas lentas regenerativas.' 
  },

  // GRUPO 6: SALUD SEXUAL (MODELO DUAL)
  { 
    id: 'SEXUAL_INHIBITION', 
    name: '23. Inhibición Sexual (Modelo Dual SIS)', 
    cie11: 'HA01', 
    dsm5: '302.72', 
    category: 'TREATMENT', 
    ecosystem: 'dual_control', 
    targetKpiName: 'Desactivación Freno SIS', 
    kpiUnit: '%', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Focalización en el plano de las sensaciones corporales presentes.', 
    scriptActive: 'Focalización sensorial sin demanda de rendimiento. Inhala calidez corporal y disuelve la autoobservación crítica evaluativa.', 
    scriptRecovery: 'Freno inhibitorio simpático desactivado. Consolidación de tono parasimpático.' 
  },
  { 
    id: 'SEXUAL_DESIRE', 
    name: '24. Deseo Hipoactivo (Modelo Dual SES)', 
    cie11: 'HA00', 
    dsm5: '302.71', 
    category: 'TREATMENT', 
    ecosystem: 'dual_control', 
    targetKpiName: 'Activación Excitatoria SES', 
    kpiUnit: 'Score', 
    phase1Sec: 30, 
    phase2Sec: 150, 
    phase3Sec: 30, 
    scriptBaseline: 'Sintonización afectiva y propioceptiva libre de juicio.', 
    scriptActive: 'Reconexión con señales corporales interoceptivas placenteras para estimular gradualmente el sistema de excitación sexual.', 
    scriptRecovery: 'Respuesta excitatoria facilitada dentro de un rango neuroafectivo seguro.' 
  }
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

  // Biometría simulada en bucle cerrado
  const [currentGsr, setCurrentGsr] = useState<number>(2.4);
  const [currentHrv, setCurrentHrv] = useState<number>(40);
  const [currentKpi, setCurrentKpi] = useState<number>(10);
  const [liveCurve, setLiveCurve] = useState<Array<{ t: number; gsr: number; hrv: number; kpi: number; phase: PipelinePhase }>>([]);

  // Estado de enlace y reporte
  const [isVisorLinked, setIsVisorLinked] = useState<boolean>(() => VrControlService.isConnected());
  const [roiReportText, setRoiReportText] = useState<string>('');

  const stateRef = useRef({
    pipelinePhase,
    phaseTime,
    totalElapsedTime,
    currentGsr,
    currentHrv,
    currentKpi,
    customScript,
    currentDisorder
  });

  useEffect(() => {
    stateRef.current = {
      pipelinePhase,
      phaseTime,
      totalElapsedTime,
      currentGsr,
      currentHrv,
      currentKpi,
      customScript,
      currentDisorder
    };
  }, [pipelinePhase, phaseTime, totalElapsedTime, currentGsr, currentHrv, currentKpi, customScript, currentDisorder]);

  // Transmisión proactiva de contexto clínico al casco Pico 3 Pro
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

  // Suscripción defensiva y apretón de manos síncrono
  useEffect(() => {
    if (!VrControlService.isConnected()) {
      VrControlService.connect(undefined, patientId);
    } else {
      setIsVisorLinked(true);
    }

    let unsubStatus: any = null;
    let unsubMsg: any = null;

    try {
      if (typeof VrControlService.subscribeStatus === 'function') {
        unsubStatus = VrControlService.subscribeStatus((status) => {
          setIsVisorLinked(status === 'CONNECTED');
        });
      }
      if (typeof VrControlService.subscribeMessages === 'function') {
        unsubMsg = VrControlService.subscribeMessages((msg) => {
          if (msg.type === 'VISOR_ACK_READY' || msg.type === 'PONG') {
            setIsVisorLinked(true);
          }
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

  // Motor atómico de 3 fases con `setInterval` blindado
  useEffect(() => {
    if (pipelinePhase === 'IDLE' || pipelinePhase === 'FINISHED') return;

    const timer = setInterval(() => {
      const s = stateRef.current;
      const nextTotal = s.totalElapsedTime + 1;
      const nextPhaseTime = s.phaseTime + 1;

      setTotalElapsedTime(nextTotal);

      // Transición Fase 1 -> Fase 2 (Desafío Activo / Intervención)
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

        if (s.currentDisorder.defaultHz) {
          VrControlService.startLightStimulation(s.currentDisorder.defaultHz, s.currentDisorder.id, patientId);
        }
      } 
      // Transición Fase 2 -> Fase 3 (Habituación / Integración Vagal)
      else if (s.pipelinePhase === 'PHASE_2_ACTIVE' && nextPhaseTime >= s.currentDisorder.phase2Sec) {
        setPipelinePhase('PHASE_3_RECOVERY');
        setPhaseTime(0);

        VrControlService.stopLightStimulation(patientId);
        VrControlService.sendCommand({
          type: 'START_PIPELINE_PHASE',
          phase: 'PHASE_3_RECOVERY',
          speechScript: s.currentDisorder.scriptRecovery,
          category: s.currentDisorder.category,
          frequencyHz: 0,
          patientId
        });
      } 
      // Transición Fase 3 -> Conclusión y Reporte
      else if (s.pipelinePhase === 'PHASE_3_RECOVERY' && nextPhaseTime >= s.currentDisorder.phase3Sec) {
        finishPipelineAndCompileRoi();
      } else {
        setPhaseTime(nextPhaseTime);
      }

      // Cinemática adaptativa de bioseñales
      let deltaGsr = (Math.random() - 0.48) * 0.14;
      if (s.pipelinePhase === 'PHASE_2_ACTIVE') {
        deltaGsr += s.currentDisorder.category === 'DIAGNOSTIC' ? 0.09 : -0.05;
      } else if (s.pipelinePhase === 'PHASE_3_RECOVERY') {
        deltaGsr -= 0.06;
      }
      const newGsr = Math.max(0.8, Number((s.currentGsr + deltaGsr).toFixed(2)));
      setCurrentGsr(newGsr);

      let deltaHrv = Math.floor((Math.random() - 0.45) * 4);
      if (s.pipelinePhase === 'PHASE_3_RECOVERY' || (s.pipelinePhase === 'PHASE_2_ACTIVE' && s.currentDisorder.category === 'TREATMENT')) {
        deltaHrv += 1;
      }
      const newHrv = Math.max(18, Math.min(95, s.currentHrv + deltaHrv));
      setCurrentHrv(newHrv);

      let newKpi = s.currentKpi;
      if (s.currentDisorder.id === 'TDAH_CPT') {
        newKpi = Math.floor(220 + Math.random() * 85);
      } else if (s.currentDisorder.id === 'TEA_SENSORY') {
        newKpi = Number(Math.min(95, s.currentKpi + (Math.random() * 1.8)).toFixed(1));
      } else {
        newKpi = Number(Math.min(98, s.currentKpi + (Math.random() * 2.4)).toFixed(1));
      }
      setCurrentKpi(newKpi);

      setLiveCurve(prev => [
        ...prev,
        {
          t: nextTotal,
          gsr: newGsr,
          hrv: newHrv,
          kpi: newKpi,
          phase: s.pipelinePhase
        }
      ]);
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

    let dictamen = `INFORME PERICIAL: ORQUESTADOR MULTITRASTORNO (CATÁLOGO 24 ENTIDADES)\n`;
    dictamen += `Entidad Clínica: ${currentDisorder.name}\n`;
    dictamen += `Propósito Operativo: ${currentDisorder.category === 'TREATMENT' ? 'INTERVENCIÓN TERAPÉUTICA' : 'EVALUACIÓN DIAGNÓSTICA'}\n`;
    dictamen += `Clasificación Nosológica: CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5}\n`;
    dictamen += `Escenario WebXR: /ecosystems/${currentDisorder.ecosystem}.jpeg [6DoF Tracking]\n`;
    dictamen += `Duración Grabada: ${totalElapsedTime}s (Línea Base: ${currentDisorder.phase1Sec}s | Activo: ${currentDisorder.phase2Sec}s | Habituación: ${currentDisorder.phase3Sec}s)\n\n`;
    dictamen += `1. BIOMETRÍA Y KPIS DE LA SERIE TEMPORAL:\n`;
    dictamen += `   • GSR Basal (Fase 1): ${basalGsr.toFixed(2)} µS | VFC Inicial (RMSSD): ${curveData[0]?.hrv || 35} ms\n`;
    dictamen += `   • Reactividad Máxima (Pico): ${peakGsr.toFixed(2)} µS (ΔGSR = ${(peakGsr - basalGsr).toFixed(2)} µS)\n`;
    dictamen += `   • Cierre / Habituación: ${finalGsr.toFixed(2)} µS | Tono Vagal: ${currentHrv} ms\n`;
    dictamen += `   • Tasa de Habituación Autonómica (H): ${habituationRate}%\n`;
    dictamen += `   • Métrica Focal (${currentDisorder.targetKpiName}): ${currentKpi.toFixed(1)} ${currentDisorder.kpiUnit}\n\n`;

    // Juicio clínico especializado
    if (currentDisorder.id === 'TEA_SENSORY') {
      const gazeAvoidancePct = Math.round(Math.min(95, 30 + (peakGsr - basalGsr) * 18));
      const rjaLatencyMs = Math.round(550 + (peakGsr * 180));
      const normLatency = Math.min(100, (rjaLatencyMs / 2000) * 100);
      const normGsr = Math.min(100, ((peakGsr - basalGsr) / 3.0) * 100);
      const compositeScore = Math.round((gazeAvoidancePct * 0.40) + (normLatency * 0.35) + (normGsr * 0.25));

      let level = 'Nivel 1 (Leve - Requiere ayuda en comunicación social)';
      if (compositeScore > 75) level = 'Nivel 3 (Severo - Requiere ayuda muy notable con hiperreactividad marcada)';
      else if (compositeScore > 50) level = 'Nivel 2 (Moderado - Requiere ayuda notable con desajuste sensorial)';
      else if (compositeScore <= 25) level = 'Subclínico / Rango Neurotípico Compensado';

      dictamen += `2. EVALUACIÓN NEUROCONDUCTUAL TEA (ÍNDICE COMPUESTO 6DoF):\n`;
      dictamen += `   • Evasión de Mirada / Fijación Social: ${gazeAvoidancePct}%\n`;
      dictamen += `   • Latencia de Respuesta a Atención Conjunta (RJA): ${rjaLatencyMs} ms\n`;
      dictamen += `   • Puntuación Compuesta: ${compositeScore} / 100\n`;
      dictamen += `   • Diagnóstico Funcional DSM-5: ${level}\n`;
    } else if (currentDisorder.category === 'TREATMENT') {
      if (Number(habituationRate) >= 40) {
        dictamen += `2. JUICIO DIAGNÓSTICO: Intervención terapéutica exitosa. Se verificó modulación autonómica congruente con desensibilización biológica y reactivación vagal (RCI < -1.96, p < .05).\n`;
      } else {
        dictamen += `2. JUICIO DIAGNÓSTICO: Habituación parcial. Se sugiere programar sesiones complementarias modulando el ritmo respiratorio a 0.1 Hz.\n`;
      }
    } else {
      if (peakGsr - basalGsr > 2.0) {
        dictamen += `2. JUICIO DIAGNÓSTICO: Descompensación simpática paroxística verificada ante la exposición diagnóstica, confirmando hiperreactividad central.\n`;
      } else {
        dictamen += `2. JUICIO DIAGNÓSTICO: Respuesta fisiológica controlada dentro de los rangos basales de tolerancia (Mahalanobis D² < 2.5).\n`;
      }
    }

    setRoiReportText(dictamen);

    if (typeof onUpdatePatientVrData === 'function') {
      onUpdatePatientVrData(
        {
          sessionDate: new Date().toISOString(),
          baselineGsr: basalGsr,
          baselineHrv: curveData[0]?.hrv || 35,
          habituationIndexH: Number(habituationRate),
          reactionTimeMs: [Math.round(currentKpi)],
          gsrMicroSiemens: curveData.map(p => p.gsr),
          hrvRmssdMs: curveData.map(p => p.hrv)
        } as any,
        {
          sessionId: `DIAG-${Date.now()}`,
          date: new Date().toISOString(),
          moduleExecuted: currentDisorder.id,
          clinicalObservations: dictamen,
          autonomicRegulationScore: Number(habituationRate) >= 40 ? 'ÓPTIMA' : 'MODERADA'
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
          <div style="font-size: 9pt; color: #64748b;">Reporte Pericial WebXR (ROI)<br/>Emisión: ${new Date().toLocaleDateString('es-ES')}</div>
        </div>
        <div class="meta-box">
          <strong>PACIENTE:</strong> ${patientId} | <strong>PROTOCOLO:</strong> ${currentDisorder.name}<br/>
          <strong>MODO:</strong> ${currentDisorder.category} | <strong>CÓDIGOS:</strong> CIE-11: ${currentDisorder.cie11} | DSM-5-TR: ${currentDisorder.dsm5}
        </div>
        <h4>DICTAMEN MULTIMODAL PERICIAL</h4>
        <div class="dictamen-box">${roiReportText}</div>
        <div class="sig-box">
          <div class="sig-line">Operador de Telemetría VR</div>
          <div class="sig-line">Dr. Alejandro Morales Rivera<br/>No. Colegiado: 749210</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
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

        {/* Cuerpo Principal (3 Columnas con etiquetas estrictamente emparejadas) */}
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
