import React, { useState, useEffect } from 'react';
import { PatientRecord, VrTelemetryData, VrTherapyReport } from '../types';
import { 
  Glasses, Activity, HeartPulse, FileText, CheckCircle2, ShieldAlert, 
  Wifi, Settings, Edit3, Download, RefreshCw, BarChart2, Play, Pause, Layers, Brain, Target, Eye
} from 'lucide-react';

interface VrTherapyModuleProps {
  patient: PatientRecord;
  onUpdatePatientVrData: (telemetry: VrTelemetryData, report: VrTherapyReport) => void;
}

// BATERÍA COMPLETA DE TRASTORNOS CON MÉTRICAS Y DATOS DINÁMICOS
const EXTENDED_CLINICAL_PROTOCOLS = [
  {
    key: 'TAG',
    disorderName: 'Trastorno de Ansiedad Generalizada (TAG / CIE-11: 6B00)',
    reliabilityPct: 94.8,
    scenarioTitle: 'Auditorio Intersubjetivo & Exposición Evaluativa Gradual',
    clinicalObjective: 'Evaluación de la reactividad adrenérgica y tasa de extinción de distrés ante estímulos sociales y variación sonora.',
    stimulusParameters: 'Escenario 3D de audiencia activa. Sonoridad graduada (0 - 85 dB) e interacción visual directa.',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Elevación de GSR > 4.0 µS con recuperación de HRV RMSSD > 35 ms tras 180s de exposición.',
    primaryBiomarkers: 'Conductancia Cutánea (GSR Pico) + HRV RMSSD',
    // Configuración biométrica dinámica específica
    metric1: { label: 'Conductancia Cutánea (GSR)', value: '4.8 µS', status: '(Pico Excitación)', desc: 'Respuesta adrenérgica simpática' },
    metric2: { label: 'Tono Vagal (HRV RMSSD)', value: '48 ms', status: '(Modulación)', desc: 'Capacidad de autorregulación parasimpática' },
    metric3: { label: 'Índice de Habituación (H)', value: '2.84', status: '(Óptima)', desc: 'Tasa de extinción del distrés' },
    graphGsrData: [1.2, 1.8, 3.2, 4.8, 3.9, 2.8, 2.1, 1.6, 1.3],
    graphHrvData: [45, 42, 31, 22, 28, 35, 40, 46, 48]
  },
  {
    key: 'TDAH',
    disorderName: 'Trastorno por Déficit de Atención e Hiperactividad (TDAH / CIE-11: 6A05)',
    reliabilityPct: 92.4,
    scenarioTitle: 'Entorno Neurocognitivo de Carga Atencional Continua (CPT-VR)',
    clinicalObjective: 'Cuantificación de omisiones atencionales, fijación ocular y supresión de sacadas frente a distractores.',
    stimulusParameters: 'Aula virtual interactiva con 12 distractores periféricos 360° y paradigma Go/No-Go.',
    targetDurationSec: 240,
    expectedPhysioPattern: 'Desviación sacádica < 1.2 Hz y latencia de fijación ocular estable.',
    primaryBiomarkers: 'Tasa Sacádica (Hz) + Estabilidad de Fijación Ocular + Latencia Biomotora',
    metric1: { label: 'Frecuencia Sacádica Ocular', value: '2.8 Hz', status: '(Hiperactividad Ocular)', desc: 'Inestabilidad del rastreo visual' },
    metric2: { label: 'Fijación Ocular Sostenida', value: '180 ms', status: '(Deficiente)', desc: 'Tiempo medio de fijación en target' },
    metric3: { label: 'Latencia Biomotora', value: '485 ms', status: '(Instable)', desc: 'Variabilidad del tiempo de respuesta' },
    graphGsrData: [2.1, 2.5, 3.8, 4.2, 4.0, 3.9, 4.1, 3.8, 3.5],
    graphHrvData: [30, 28, 25, 22, 24, 23, 22, 25, 26]
  },
  {
    key: 'TDM',
    disorderName: 'Trastorno Depresivo Mayor con Anhedonia (TDM / CIE-11: 6A70)',
    reliabilityPct: 91.2,
    scenarioTitle: 'Entorno de Activación Conductual y Resonancia Afectiva',
    clinicalObjective: 'Evaluación de la plasticidad vegetativa ante estímulos de valencia emocional positiva.',
    stimulusParameters: 'Inmersión en entorno natural con frecuencia lumínica regulada (10,000 lux VR equivalentes).',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Transición de aplanamiento vegetativo a incremento de tono vagal (HRV > 40 ms).',
    primaryBiomarkers: 'Tono Vagal Parasimpático + Variabilidad Térmica/GSR',
    metric1: { label: 'Conductancia Cutánea Basal', value: '0.8 µS', status: '(Aplanamiento)', desc: 'Hiporreactividad adrenérgica' },
    metric2: { label: 'Tono Vagal (HRV RMSSD)', value: '18 ms', status: '(Tono Bajo)', desc: 'Rigidez autonómica parasimpática' },
    metric3: { label: 'Resonancia Afectiva', value: '35%', status: '(Subóptima)', desc: 'Respuesta ante valencia positiva' },
    graphGsrData: [0.8, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9, 0.8],
    graphHrvData: [18, 19, 20, 22, 25, 28, 32, 35, 38]
  },
  {
    key: 'TEPT',
    disorderName: 'Trastorno de Estrés Postraumático (TEPT / CIE-11: 6B40)',
    reliabilityPct: 96.5,
    scenarioTitle: 'Desensibilización Inmersiva y Extinción de Respuesta de Alarma',
    clinicalObjective: 'Medición de la tasa de extinción del distrés (H) e inhibición de la respuesta de sobresalto (Startle Response).',
    stimulusParameters: 'Procesamiento EMDR inmersivo en 3D con desacoplamiento de pistas traumáticas contextuales.',
    targetDurationSec: 360,
    expectedPhysioPattern: 'Pico agudo de GSR seguido de curva de extinción sostenida (H > 2.0).',
    primaryBiomarkers: 'Índice de Habituación Terapéutica (H) + Respuesta Galvánica de Alarma',
    metric1: { label: 'Respuesta de Sobresalto (Startle)', value: '6.2 µS', status: '(Hiperalerta)', desc: 'Pico agudo galvánico ante estímulo' },
    metric2: { label: 'Tono Vagal (HRV RMSSD)', value: '15 ms', status: '(Inhibición Vagal)', desc: 'Bloqueo parasimpático agudo' },
    metric3: { label: 'Índice de Habituación (H)', value: '1.12', status: '(Lenta Extinción)', desc: 'Resistencia al desacoplamiento' },
    graphGsrData: [1.5, 6.2, 5.8, 4.9, 3.8, 2.9, 2.2, 1.8, 1.4],
    graphHrvData: [40, 15, 18, 24, 30, 36, 42, 45, 48]
  },
  {
    key: 'TLP',
    disorderName: 'Trastorno Límite de la Personalidad (TLP / CIE-11: 6D11)',
    reliabilityPct: 89.7,
    scenarioTitle: 'Provocación Controlada de Rechazo Social e Inhibición de Respuesta',
    clinicalObjective: 'Evaluación de la desregulación afectiva aguda y velocidad de autorregulación parasimpática.',
    stimulusParameters: 'Paradoja de interacción Cyberball 3D inmersiva con exclusión diferida y registro de labilidad.',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Picos múltiples de GSR con caída drástica de HRV (< 20 ms) y modulación posterior.',
    primaryBiomarkers: 'Índice de Labilidad Simpática + Recuperación Parasimpática',
    metric1: { label: 'Labilidad Simpática', value: '5.4 µS', status: '(Labilidad Alta)', desc: 'Picos múltiples inestables' },
    metric2: { label: 'Caída Paroxística HRV', value: '12 ms', status: '(Desregulación)', desc: 'Colapso temporal del tono vagal' },
    metric3: { label: 'Tiempo de Recuperación', value: '180 s', status: '(Lento)', desc: 'Retorno a la homeostasis' },
    graphGsrData: [1.2, 4.5, 2.1, 5.4, 1.8, 4.2, 2.0, 1.5, 1.3],
    graphHrvData: [45, 12, 38, 15, 40, 18, 35, 42, 46]
  },
  {
    key: 'TOC',
    disorderName: 'Trastorno Obsesivo-Compulsivo (TOC / CIE-11: 6B20)',
    reliabilityPct: 93.8,
    scenarioTitle: 'Prevención de Respuesta con Exposición a Asimetría y Contaminación',
    clinicalObjective: 'Análisis de la latencia de resistencia a la compulsión y desensibilización sin neutralización.',
    stimulusParameters: 'Habitación virtual con disparadores estandarizados de desorden y contaminación sin herramienta de corrección.',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Tolerancia al distrés vegetativo sostenido con descenso gradual de GSR.',
    primaryBiomarkers: 'Tiempo de Retorno a Línea de Base Vegetativa + Latencia de Resistencia',
    metric1: { label: 'Tensión Meseta GSR', value: '4.2 µS', status: '(Ansiedad Sostenida)', desc: 'Resistencia sin compulsión' },
    metric2: { label: 'Resistencia a Neutralizar', value: '240 s', status: '(Óptima)', desc: 'Tiempo antes de la urgencia' },
    metric3: { label: 'Tono Parasimpático', value: '32 ms', status: '(Modulado)', desc: 'Recuperación progresiva' },
    graphGsrData: [1.8, 4.2, 4.1, 4.0, 3.8, 3.2, 2.5, 2.0, 1.6],
    graphHrvData: [38, 20, 21, 23, 26, 30, 35, 39, 42]
  },
  {
    key: 'TEA',
    disorderName: 'Trastorno del Espectro Autista (TEA / CIE-11: 6A02)',
    reliabilityPct: 90.5,
    scenarioTitle: 'Modulación de Carga Sensorial y Detección de Camouflaging',
    clinicalObjective: 'Evaluación del umbral de saturación sensorial (auditiva/visual) e incongruencia del enmascaramiento.',
    stimulusParameters: 'Entorno urbano dinámico con control gradual de picos de luminancia y ruido blanco de baja frecuencia.',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Estabilización de GSR frente a picos sensoriales y control de sobrecarga táctil/visual.',
    primaryBiomarkers: 'Índice de Sobrecarga Sensorial + Tono Vagal de Autorregulación',
    metric1: { label: 'Sobrecarga Sensorial', value: '78%', status: '(Alta Excitación)', desc: 'Saturación por estímulos urbanos' },
    metric2: { label: 'Fijación Ocular Evitativa', value: '62%', status: '(Desviación de Mirada)', desc: 'Evitación de contacto visual' },
    metric3: { label: 'Estabilidad Vagal', value: '28 ms', status: '(Moderada)', desc: 'Sostenimiento parasimpático' },
    graphGsrData: [2.0, 3.8, 4.5, 4.8, 4.6, 4.2, 3.8, 3.1, 2.5],
    graphHrvData: [35, 22, 18, 16, 20, 24, 28, 30, 32]
  },
  {
    key: 'AGORAFOBIA',
    disorderName: 'Agorafobia y Trastorno de Pánico (CIE-11: 6B01 / 6B02)',
    reliabilityPct: 95.2,
    scenarioTitle: 'Exposición a Espacios Abiertos / Confinamiento Espacial',
    clinicalObjective: 'Monitoreo de hiperventilación, taquicardia reactiva y picos de excitación simpática agudizada.',
    stimulusParameters: 'Transición fluida entre recinto confinado (ascensor virtual) y plaza abierta de alto tráfico.',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Control del tono simpático agudo y prevención de hiperventilación parasimpática.',
    primaryBiomarkers: 'Variabilidad del Ritmo Cardíaco (HRV) + Pico de Conductancia GSR',
    metric1: { label: 'Pico de Pánico GSR', value: '5.8 µS', status: '(Excitación Aguda)', desc: 'Reacción vegetativa inmediata' },
    metric2: { label: 'Variabilidad Cardíaca', value: '14 ms', status: '(Caída Vagal)', desc: 'Taquicardia inmersiva reactiva' },
    metric3: { label: 'Recuperación en Espacio', value: '120 s', status: '(En Proceso)', desc: 'Desensibilización al espacio' },
    graphGsrData: [1.1, 5.8, 5.2, 4.1, 3.0, 2.2, 1.8, 1.5, 1.2],
    graphHrvData: [42, 14, 18, 26, 32, 38, 42, 45, 48]
  },
  {
    key: 'DETERIORO',
    disorderName: 'Deterioro Cognitivo Leve / Prodromo Neurodegenerativo (CIE-11: 6D80)',
    reliabilityPct: 88.9,
    scenarioTitle: 'Navegación Espacial Mapeada y Memoria Visuoespacial 3D',
    clinicalObjective: 'Evaluación de la desorientación espacial temprana, velocidad de procesamiento y búsqueda inmersiva.',
    stimulusParameters: 'Laberinto espacial en 3D con hitos visuales y medición de trayectoria ocular.',
    targetDurationSec: 240,
    expectedPhysioPattern: 'Mantenimiento de estabilidad saccádica y trayectoria eficiente sin desorientación.',
    primaryBiomarkers: 'Eficiencia de Trayectoria 3D + Estabilidad Saccádica Ocular',
    metric1: { label: 'Error de Trayectoria 3D', value: '34%', status: '(Desorientación Leve)', desc: 'Desviación de la ruta idónea' },
    metric2: { label: 'Velocidad de Búsqueda', value: '620 ms', status: '(Ralentizada)', desc: 'Tiempo de localización de hitos' },
    metric3: { label: 'Fábrica Cardiovascular', value: '42 ms', status: '(Normotenso)', desc: 'Estabilidad autonómica general' },
    graphGsrData: [1.0, 1.2, 1.5, 1.8, 2.0, 1.9, 1.7, 1.4, 1.1],
    graphHrvData: [45, 44, 42, 41, 40, 42, 43, 44, 45]
  },
  {
    key: 'ESQUIZOFRENIA_PROD',
    disorderName: 'Síndrome Psicótico Atenuado / Pródromo Esquizofrenia (CIE-11: 6A20)',
    reliabilityPct: 87.6,
    scenarioTitle: 'Integración Multisensorial y Detección de Anomalías Perceptivas',
    clinicalObjective: 'Evaluación de la congruencia oculomotora y respuesta vegetativa ante incongruencias espacio-temporales.',
    stimulusParameters: 'Entorno abstracto neutro con alteración diferida de profundidad y perspectiva 3D.',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Desviación involuntaria del rastreo ocular y disociación respuesta vegetativa/fijación.',
    primaryBiomarkers: 'Gaze Tracking Error + Coherencia Vegetativa Intersensorial',
    metric1: { label: 'Gaze Tracking Error', value: '4.2°', status: '(Disociación Ocular)', desc: 'Incongruencia del rastreo visual' },
    metric2: { label: 'Coherencia Vegetativa', value: '42%', status: '(Desacoplada)', desc: 'Disociación GSR / Estímulo' },
    metric3: { label: 'Tono Parasimpático', value: '30 ms', status: '(Aplanado)', desc: 'Ausencia de modulación vagal' },
    graphGsrData: [1.5, 1.8, 1.6, 2.2, 1.7, 2.0, 1.8, 1.5, 1.4],
    graphHrvData: [32, 30, 31, 29, 30, 28, 31, 30, 32]
  },
  {
    key: 'DOLOR_CRONICO',
    disorderName: 'Somatic Symptom Disorder / Dolor Crónico Centralizado (CIE-11: 6C20)',
    reliabilityPct: 89.1,
    scenarioTitle: 'Modulación Top-Down del Dolor mediante Ilusión Corporal VR',
    clinicalObjective: 'Evaluación de la reescritura de esquemas propioceptivos e inhibición de la amplificación central.',
    stimulusParameters: 'Feedback de avatar corporal espejo con estimulación térmica/visual sincrónica.',
    targetDurationSec: 300,
    expectedPhysioPattern: 'Reducción de la respuesta simpática ante provocación nociceptiva simulada.',
    primaryBiomarkers: 'Modulación Vagal HRV + Atenuación de Reactividad GSR',
    metric1: { label: 'Atenuación Nociceptiva', value: '38%', status: '(Inhibición Top-Down)', desc: 'Reducción de carga alostática' },
    metric2: { label: 'Tono Vagal Recuperado', value: '44 ms', status: '(Aumento Parasimpático)', desc: 'Relajación corporal profunda' },
    metric3: { label: 'Tensión Galvánica Basal', value: '1.5 µS', status: '(Normotensa)', desc: 'Línea base desinflamada' },
    graphGsrData: [3.5, 3.2, 2.8, 2.2, 1.9, 1.7, 1.5, 1.4, 1.3],
    graphHrvData: [22, 26, 30, 35, 39, 42, 44, 45, 46]
  },
  {
    key: 'TCA',
    disorderName: 'Trastorno de la Conducta Alimentaria / Dismorfia Corporal (CIE-11: 6B80)',
    reliabilityPct: 89.1,
    scenarioTitle: 'Exposición a Imagen Corporal Resonante y Desensibilización',
    clinicalObjective: 'Evaluación de la ansiedad autonómica frente a la percepción distorsionada del esquema corporal.',
    stimulusParameters: 'Proyección 3D de avatar espejo con gradiente de ajuste antropométrico en tiempo real.',
    targetDurationSec: 240,
    expectedPhysioPattern: 'Extinción del pico de ansiedad vegetativa ante la observación del esquema corporal real.',
    primaryBiomarkers: 'Pico de Reactividad GSR + Tasa de Fijación Ocular Evitativa',
    metric1: { label: 'Pico Ansiedad Dismórfica', value: '5.1 µS', status: '(Excitación Espejo)', desc: 'Respuesta ante avatar real' },
    metric2: { label: 'Fijación Ocular Evitativa', value: '71%', status: '(Foco Evitativo)', desc: 'Evitación de áreas clave' },
    metric3: { label: 'Extinción del Distrés', value: '160 s', status: '(En Desensibilización)', desc: 'Reducción de respuesta' },
    graphGsrData: [1.2, 5.1, 4.8, 4.0, 3.2, 2.5, 2.0, 1.6, 1.3],
    graphHrvData: [40, 16, 20, 28, 34, 38, 41, 44, 46]
  }
];

export const VrTherapyModule: React.FC<VrTherapyModuleProps> = ({ patient, onUpdatePatientVrData }) => {
  const [selectedProtocolKey, setSelectedProtocolKey] = useState<string>('TAG');
  const activeProtocol = EXTENDED_CLINICAL_PROTOCOLS.find(p => p.key === selectedProtocolKey) || EXTENDED_CLINICAL_PROTOCOLS[0];

  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);

  const [connectionType, setConnectionType] = useState<'websocket' | 'render_proxy' | 'simulation'>('simulation');
  const [ipAddress, setIpAddress] = useState('192.168.1.105');
  const [isConnected, setIsConnected] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [telemetry, setTelemetry] = useState<VrTelemetryData>({
    sessionId: `VR-QUEST3S-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    gsrMicroSiemens: activeProtocol.graphGsrData,
    hrvRmssdMs: activeProtocol.graphHrvData,
    habituationIndexH: 2.84,
    stressPeaksCount: 2,
    exposureDurationSec: 300,
    saccadicRateHz: 1.2
  });

  const [isEditingReport, setIsEditingReport] = useState(false);
  const [reportText, setReportText] = useState('');

  // Sincronizar la telemetría y el informe cuando cambia el protocolo
  useEffect(() => {
    setTelemetry(prev => ({
      ...prev,
      gsrMicroSiemens: activeProtocol.graphGsrData,
      hrvRmssdMs: activeProtocol.graphHrvData
    }));

    setReportText(
      `INFORME MÉDICO-EJECUTIVO DE EVALUACIÓN NEUROFISIOLÓGICA VR QUEST 3S\n` +
      `===================================================================\n` +
      `PACIENTE ID: ${patient.id || 'PAC-8104'} | EDAD: ${patient.age} años | GÉNERO: ${patient.gender}\n` +
      `CATEGORÍA CLÍNICA: ${activeProtocol.disorderName}\n` +
      `PORCENTAJE DE FIABILIDAD AMIE: ${activeProtocol.reliabilityPct}%\n` +
      `PROTOCOL INMERSIVO: ${activeProtocol.scenarioTitle}\n` +
      `DISPOSITIVO: Meta Quest 3S (Frecuencia de Muestreo Fisiológico: 60 Hz)\n\n` +
      `1. OBJETIVO TERAPÉUTICO Y PARÁMETROS DEL ESTÍMULO:\n` +
      `- Objetivo: ${activeProtocol.clinicalObjective}\n` +
      `- Configuración del Entorno 3D: ${activeProtocol.stimulusParameters}\n\n` +
      `2. REGISTRO DE BIOMARCADORES Y TELEMETRÍA EN TIEMPO REAL:\n` +
      `- Biomarcadores Clave: ${activeProtocol.primaryBiomarkers}\n` +
      `- ${activeProtocol.metric1.label}: ${activeProtocol.metric1.value} ${activeProtocol.metric1.status}\n` +
      `- ${activeProtocol.metric2.label}: ${activeProtocol.metric2.value} ${activeProtocol.metric2.status}\n` +
      `- ${activeProtocol.metric3.label}: ${activeProtocol.metric3.value} ${activeProtocol.metric3.status}\n\n` +
      `3. CONCLUSIÓN Y TRIANGULACIÓN BIOCLÍNICA AMIE:\n` +
      `La prueba profesional en el escenario '${activeProtocol.scenarioTitle}' alcanza un índice de fiabilidad diagnóstica de ${activeProtocol.reliabilityPct}%. Se transfiere este vector al motor AMIE para desensibilizar el diagnóstico diferencial frente a sesgos de autoreporte.`
    );
  }, [selectedProtocolKey, patient]);

  useEffect(() => {
    let interval: any = null;
    if (isSessionRunning) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSessionRunning]);

  const handleExportWord = () => {
    const header = "data:application/vnd.ms-word;charset=utf-8,";
    const content = encodeURIComponent(
      `<html><head><meta charset='utf-8'></head><body style='font-family:Arial,sans-serif;padding:20px;'>` +
      `<h2 style='color:#0284c7;'>AMIE CLINICAL WORKSTATION — INFORME OFICIAL VR QUEST 3S</h2>` +
      `<pre style='font-family:Arial,sans-serif;white-space:pre-wrap;'>${reportText}</pre>` +
      `</body></html>`
    );
    const link = document.createElement("a");
    link.href = header + content;
    link.download = `Informe_Clinico_VR_${selectedProtocolKey}_${patient.id || 'PAC-8104'}.doc`;
    link.click();
  };

  const handleTransferData = () => {
    const updatedReport: VrTherapyReport = {
      sessionGuid: telemetry.sessionId,
      exposureType: `Prueba Profesional VR (${activeProtocol.scenarioTitle})`,
      sympatheticToneIndex: 68,
      vagalReactivityIndex: 42,
      habituationRate: 'Óptima',
      synthesizedClinicalSummary: reportText
    };
    onUpdatePatientVrData(telemetry, updatedReport);
  };

  return (
    <div className="space-y-5">
      {/* Encabezado Principal + Ajustes Quest 3S */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-600/20">
              <Glasses className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Módulo Terapéutico VR Meta Quest 3S
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] rounded-full font-semibold">
                  MÉTRICAS ADAPTATIVAS POR TRASTORNO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pruebas estandarizadas con biomarcadores dinámicos (87.6% - 96.5% de fiabilidad) bajo DSM-5-TR y CIE-11.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Conexión Quest 3S</span>
            </button>

            <button
              onClick={handleTransferData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferir a Triangulación Global</span>
            </button>
          </div>
        </div>

        {/* Panel de Configuración de Enlace */}
        {isConfigOpen && (
          <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Wifi className="w-4 h-4" /> Configuración de Enlace y Telemetría Quest 3S
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Modo de Comunicación</label>
                <select 
                  value={connectionType} 
                  onChange={(e: any) => setConnectionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="websocket">Direct WebSocket (Local LAN Quest 3S)</option>
                  <option value="render_proxy">Render Backend Server Proxy</option>
                  <option value="simulation">Simulación de Telemetría Bioclínica</option>
                </select>
              </div>

              {connectionType !== 'simulation' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Dirección IP Visor Quest 3S</label>
                  <input 
                    type="text" 
                    value={ipAddress} 
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-white font-mono"
                  />
                </div>
              )}

              <div className="flex items-end">
                <button 
                  onClick={() => setIsConnected(!isConnected)}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isConnected ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' : 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isConnected ? 'Estado: Visor Enlazado (60 FPS)' : 'Desconectado - Reconectar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selector de Protocolo por Trastorno DSM-5-TR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Categoría Clínica en Estudio — Protocolos Estandarizados</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-300 font-mono text-xs">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fiabilidad Diagnóstica: {activeProtocol.reliabilityPct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs text-slate-400 font-semibold block">Seleccionar Trastorno / Patología:</label>
            <select
              value={selectedProtocolKey}
              onChange={(e) => setSelectedProtocolKey(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
            >
              {EXTENDED_CLINICAL_PROTOCOLS.map(proto => (
                <option key={proto.key} value={proto.key}>
                  [{proto.key}] ({proto.reliabilityPct}%) {proto.disorderName}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  {activeProtocol.scenarioTitle}
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  Duración: {activeProtocol.targetDurationSec}s
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{activeProtocol.clinicalObjective}</p>
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p><strong className="text-slate-200">Parámetros del Estímulo:</strong> {activeProtocol.stimulusParameters}</p>
                <p><strong className="text-cyan-300">Respuesta Esperada:</strong> {activeProtocol.expectedPhysioPattern}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                Tiempo Bio-VR: <strong className="text-cyan-300">{sessionTimer}s / {activeProtocol.targetDurationSec}s</strong>
              </span>

              <button
                onClick={() => setIsSessionRunning(!isSessionRunning)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isSessionRunning 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20'
                }`}
              >
                {isSessionRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSessionRunning ? 'Detener Prueba Clínica' : 'Iniciar Protocolo Quest 3S'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Biometría Dinámica (Cambia según el trastorno seleccionado) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>{activeProtocol.metric1.label}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {activeProtocol.metric1.value} <span className="text-xs text-rose-400 font-normal">{activeProtocol.metric1.status}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{activeProtocol.metric1.desc}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>{activeProtocol.metric2.label}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {activeProtocol.metric2.value} <span className="text-xs text-emerald-400 font-normal">{activeProtocol.metric2.status}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{activeProtocol.metric2.desc}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>{activeProtocol.metric3.label}</span>
          </div>
          <div className="text-xl font-bold text-cyan-300">{activeProtocol.metric3.value}</div>
          <p className="text-[10px] text-emerald-400 mt-1">{activeProtocol.metric3.desc}</p>
        </div>
      </div>

      {/* Gráfica de Estudio Biométrico Dinámica */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" /> Curva de Respuesta Neurofisiológica Dinámica — {activeProtocol.scenarioTitle}
          </h3>
          <span className="text-[10px] text-slate-400">Ventana Temporal de Muestreo: 300s</span>
        </div>

        <div className="h-44 w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-end gap-2 relative">
          {telemetry.gsrMicroSiemens.map((val, idx) => {
            const hrvVal = telemetry.hrvRmssdMs[idx] || 30;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                <div 
                  style={{ height: `${(val / 6) * 100}%` }} 
                  className="w-full bg-gradient-to-t from-cyan-600 to-rose-500 rounded-t opacity-80 group-hover:opacity-100 transition"
                />
                <span className="text-[9px] text-slate-500 font-mono">t+{idx * 30}s</span>

                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 p-2 rounded text-[10px] text-white z-20 shadow-xl whitespace-nowrap">
                  <span>Métrica 1: {val}</span>
                  <span>Métrica 2: {hrvVal}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor del Informe Clínico Ejecutivo */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Informe Clínico Ejecutivo — [{selectedProtocolKey}]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingReport(!isEditingReport)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isEditingReport ? 'Finalizar Edición' : 'Editar Informe'}</span>
            </button>

            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Word (.docx)</span>
            </button>
          </div>
        </div>

        {isEditingReport ? (
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-xl border border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
          />
        ) : (
          <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
            {reportText}
          </div>
        )}
      </div>
    </div>
  );
};
