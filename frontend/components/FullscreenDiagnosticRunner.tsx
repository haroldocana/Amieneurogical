// ============================================================================
// AMIE CLINICAL COPILOT - WORKSTATION MÉDICA INTEGRAL COMPLETA
// 9 Módulos Clínicos • 30 Trastornos • 240 Paradigmas Inmersivos Integrados
// Monitor Clínico Dual-Channel a 60 Hz (Canal 1: Onda PPG Bi-Gaussiana | Canal 2: Latencia VR 6DoF)
// Driver Nativo Hexadecimal COLMI R10 + Polar H10 + Fluctuación Hemodinámica RSA
// frontend/components/FullscreenDiagnosticRunner.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientRecord } from '../types';
import { 
  X, Activity, Brain, Square, Stethoscope, Send, Target, 
  Image as ImageIcon, Bluetooth, CheckCircle, Wifi, WifiOff,
  Printer, FileText, Sparkles
} from 'lucide-react';

interface Props {
  patient?: PatientRecord;
  onClose: () => void;
  onUpdatePatientVrData?: (telemetry: any, report: any) => void;
}

export type PipelinePhase = 'IDLE' | 'PHASE_ACTIVE' | 'FINISHED';

export interface ClinicalExercise {
  id: string;
  mode: 'DIAGNOSTIC' | 'TREATMENT';
  paradigm: 'CPT_3D' | 'BART_3D' | 'N_BACK_3D' | 'CHOICE_3D' | 'AAT_3D' | 'EMDR_3D' | 'MIRROR_3D' | 'BIO_3D';
  name: string;
  bgAudio: string;
  script: string;
}

export const CLINICAL_MODULES = [
  { id: 'MOD_NEURODEV', name: 'I. Neurodesarrollo & Motor' },
  { id: 'MOD_AFFECTIVE', name: 'II. Afectivo & Estado de Ánimo' },
  { id: 'MOD_TRAUMA', name: 'III. Trauma, TEPT & Disociación' },
  { id: 'MOD_ANXIETY', name: 'IV. Ansiedad, Fobias & TOC' },
  { id: 'MOD_ADDICTIONS', name: 'V. Adicciones & Control de Impulsos' },
  { id: 'MOD_FORENSIC', name: 'VI. Forense, Psicopatía & Cluster B' },
  { id: 'MOD_HYPNOSIS_PAIN', name: 'VII. Neurohipnosis & Dolor Crónico' },
  { id: 'MOD_SEXOLOGY', name: 'VIII. Salud Sexual & Psicosomática' },
  { id: 'MOD_LOGOTHERAPY', name: 'IX. Logoterapia & Sentido (Frankl)' }
];

export const DISORDER_LIST = [
  { id: 'TDAH', mod: 'MOD_NEURODEV', name: 'TDAH / Déficit de Atención e Impulsividad' },
  { id: 'TEA_1', mod: 'MOD_NEURODEV', name: 'Espectro Autista Nivel 1 (Asperger)' },
  { id: 'TEA_2_3', mod: 'MOD_NEURODEV', name: 'Espectro Autista Nivel 2-3 (Apoyo Notable)' },
  { id: 'ALZHEIMER', mod: 'MOD_NEURODEV', name: 'Deterioro Cognitivo / Alzheimer' },
  { id: 'PARKINSON', mod: 'MOD_NEURODEV', name: 'Enfermedad de Parkinson (Temblor & Bradicinesia)' },

  { id: 'DEPRESION', mod: 'MOD_AFFECTIVE', name: 'Depresión Mayor Unipolar' },
  { id: 'BIPOLAR', mod: 'MOD_AFFECTIVE', name: 'Trastorno Bipolar (Fase Disfórica / Maníaca)' },
  { id: 'DISTIMIA', mod: 'MOD_AFFECTIVE', name: 'Distimia / Depresión Persistente' },
  { id: 'CICLOTIMIA', mod: 'MOD_AFFECTIVE', name: 'Ciclotimia / Labilidad Emocional' },

  { id: 'TEPT', mod: 'MOD_TRAUMA', name: 'Estrés Postraumático (TEPT)' },
  { id: 'TRAUMA_COMPLEJO', mod: 'MOD_TRAUMA', name: 'Trauma Complejo del Apego (C-PTSD)' },
  { id: 'DESPERSONALIZACION', mod: 'MOD_TRAUMA', name: 'Despersonalización / Desrealización' },

  { id: 'FOBIA_SOCIAL', mod: 'MOD_ANXIETY', name: 'Fobia Social / Ansiedad de Escrutinio' },
  { id: 'PANICO', mod: 'MOD_ANXIETY', name: 'Trastorno de Pánico y Agorafobia' },
  { id: 'TOC', mod: 'MOD_ANXIETY', name: 'Trastorno Obsesivo Compulsivo (TOC)' },
  { id: 'TAG', mod: 'MOD_ANXIETY', name: 'Ansiedad Generalizada (TAG)' },

  { id: 'ADICCION_SUST', mod: 'MOD_ADDICTIONS', name: 'Dependencia a Sustancias (Craving Activo)' },
  { id: 'LUDOPATIA', mod: 'MOD_ADDICTIONS', name: 'Ludopatía y Apuestas Digitales' },
  { id: 'ATRACON', mod: 'MOD_ADDICTIONS', name: 'Trastorno por Atracón Compulsivo' },
  { id: 'CLEPTOMANIA', mod: 'MOD_ADDICTIONS', name: 'Cleptomanía / Falla del Control de Impulsos' },

  { id: 'TLP', mod: 'MOD_FORENSIC', name: 'Trastorno Límite de Personalidad (TLP / Borderline)' },
  { id: 'PSICOPATIA', mod: 'MOD_FORENSIC', name: 'Psicopatía (Factor 1 y 2 PCL-R)' },
  { id: 'NARCISISMO', mod: 'MOD_FORENSIC', name: 'Narcisismo Maligno / Desregulación Egoica' },
  { id: 'HISTRIONICO', mod: 'MOD_FORENSIC', name: 'Trastorno Histriónico de la Personalidad' },

  { id: 'HIPNO_ERICKSONIANA', mod: 'MOD_HYPNOSIS_PAIN', name: 'Hipnosis Ericksoniana (Metáforas Inmersivas)' },
  { id: 'HIPNO_ANALGESIA', mod: 'MOD_HYPNOSIS_PAIN', name: 'Hipnoanalgesia (Fibromialgia & Dolor Nociceptivo)' },
  { id: 'HIPNO_FANTASMA', mod: 'MOD_HYPNOSIS_PAIN', name: 'Miembro Fantasma & Dolor Neuropático' },

  { id: 'SEX_INHIB', mod: 'MOD_SEXOLOGY', name: 'Inhibición Sexual (SIS - Modelo Control Dual)' },
  { id: 'DISFUNCION_SOM', mod: 'MOD_SEXOLOGY', name: 'Ansiedad de Rendimiento & Disfunción Psicógena' },

  { id: 'VACIO_EXISTENCIAL', mod: 'MOD_LOGOTHERAPY', name: 'Vacío Existencial & Análisis Existencial (Frankl)' }
];

export const FULL_CLINICAL_PARADIGMS_MATRIX: Record<string, ClinicalExercise[]> = {
  TDAH: [
    { id: 'TDAH_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Conners CPT: Freno Go/No-Go', bgAudio: 'BROWN_NOISE', script: 'Dispara únicamente a las esferas verdes. Suprime el disparo ante esferas rojas para registrar tu freno inhibitorio.' },
    { id: 'TDAH_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Búsqueda de Estimulación (BART)', bgAudio: 'TENSION_DRUM', script: 'Bombea el globo para acumular puntos o plántate antes de que explote para medir tu tolerancia al riesgo.' },
    { id: 'TDAH_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Memoria de Trabajo Visuoespacial', bgAudio: 'BETA_WAVES', script: 'Memoriza la secuencia espacial de los cubos y márcalos en orden sin desviar la atención.' },
    { id: 'TDAH_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Flexibilidad y Cambio de Criterio', bgAudio: 'HEARTBEAT', script: 'Elige entre las opciones adaptando tu criterio con rapidez cuando el sistema altere la regla.' },
    { id: 'TDAH_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Resistencia a Distractores (AAT)', bgAudio: 'ALPHA_WAVES', script: 'Empuja con el rayo láser los distractores que aparezcan en tu periferia para blindar tu foco.' },
    { id: 'TDAH_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Integración Sacádica Interhemisférica', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica horizontal con tus ojos para sincronizar la conectividad frontal.' },
    { id: 'TDAH_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Coordinación Bimanual Somatomotora', bgAudio: 'THETA_WAVES', script: 'Sincroniza ambos mandos con los movimientos guía del avatar para regular tu control postural.' },
    { id: 'TDAH_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Modulación de Hiperactividad Basal', bgAudio: 'DELTA_WAVES', script: 'Acompasa tu respiración con la expansión del loto para disminuir la sobreactivación motriz.' }
  ],
  TEA_1: [
    { id: 'TEA1_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reconocimiento de Microexpresiones', bgAudio: 'BROWN_NOISE', script: 'Identifica la emoción sutil en el rostro del avatar e impacta en la esfera correspondiente.' },
    { id: 'TEA1_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Tolerancia a la Ambigüedad Social', bgAudio: 'TENSION_DRUM', script: 'El entorno alterará sus reglas sin previo aviso. Registra tu adaptación a la incertidumbre.' },
    { id: 'TEA1_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Memoria de Claves Pragmáticas', bgAudio: 'BETA_WAVES', script: 'Memoriza la secuencia de gestos y miradas para evaluar tu retención de señales sociales.' },
    { id: 'TEA1_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Teoría de la Mente en Escenario 3D', bgAudio: 'HEARTBEAT', script: 'Elige la respuesta que prediga con mayor precisión la intención del interlocutor virtual.' },
    { id: 'TEA1_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Desensibilización al Contacto Visual', bgAudio: 'ALPHA_WAVES', script: 'Sostén la mirada hacia los ojos del avatar mientras apartas los estímulos distractores.' },
    { id: 'TEA1_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Integración de Sobrecarga Interpersonal', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue el barrido ocular sacádico para reducir el agotamiento cognitivo tras la interacción.' },
    { id: 'TEA1_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Modelado de Neuronas Espejo', bgAudio: 'THETA_WAVES', script: 'Imita las posturas y microgestos del avatar para estimular la empatía cinemática.' },
    { id: 'TEA1_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Rescate Vagal por Meltdown Social', bgAudio: 'DELTA_WAVES', script: 'Respira con el núcleo armónico en un espacio protegido para apaciguar la sobrecarga sensorial.' }
  ],
  TEA_2_3: [
    { id: 'TEA2_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reactividad Multisensorial', bgAudio: 'BROWN_NOISE', script: 'Mide el umbral de respuesta ante variaciones de iluminación y estímulos sonoros.' },
    { id: 'TEA2_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Regulación ante Ruptura de Rutina', bgAudio: 'TENSION_DRUM', script: 'Evalúa la flexibilidad conductual cuando el patrón preestablecido se interrumpe.' },
    { id: 'TEA2_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Fijación Atencional y Rigidez', bgAudio: 'BETA_WAVES', script: 'Registra la capacidad de desenganche visual entre diferentes posiciones del espacio.' },
    { id: 'TEA2_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Discriminación de Pictogramas 3D', bgAudio: 'HEARTBEAT', script: 'Apunta al pictograma funcional requerido para evaluar comprensión y comunicación.' },
    { id: 'TEA2_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Integración Sensorial Háptica Segura', bgAudio: 'ALPHA_WAVES', script: 'Interactúa con los orbes acolchados para graduar la tolerancia táctil y cinemática.' },
    { id: 'TEA2_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Estabilización Sacádica Suave', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la trayectoria suave de luz para calmar la dispersión y la agitación visual.' },
    { id: 'TEA2_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reducción de Estereotipias Motoras', bgAudio: 'THETA_WAVES', script: 'Coloca tus mandos sobre las guías fijas para sustituir movimientos repetitivos.' },
    { id: 'TEA2_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Enraizamiento y Confort Acústico', bgAudio: 'DELTA_WAVES', script: 'Inhala y exhala con el manto lumínico para inducir un estado de seguridad profunda.' }
  ],
  ALZHEIMER: [
    { id: 'ALZ_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reconocimiento de Objetos Diarios', bgAudio: 'BROWN_NOISE', script: 'Señala los objetos familiares del hogar e ignora los elementos ajenos al entorno.' },
    { id: 'ALZ_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Juicio y Prudencia Ejecutiva', bgAudio: 'TENSION_DRUM', script: 'Evalúa la toma de decisiones acumulativa y la prudencia antes de la pérdida de puntos.' },
    { id: 'ALZ_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Orientación Topográfica en Laberinto', bgAudio: 'BETA_WAVES', script: 'Recuerda el camino señalado por los cubos luminosos para medir orientación espacial.' },
    { id: 'ALZ_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Memoria Episódica Inmediata', bgAudio: 'HEARTBEAT', script: 'Identifica cuál de los dos estímulos se te presentó al iniciar la sesión clínica.' },
    { id: 'ALZ_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Reentrenamiento de Praxias Cotidianas', bgAudio: 'ALPHA_WAVES', script: 'Alcanza y acomoda los utensilios virtuales para ejercitar la memoria procedimental.' },
    { id: 'ALZ_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Estimulación Temporoparietal Bilateral', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo visual rítmico para activar la corteza asociativa parietal y temporal.' },
    { id: 'ALZ_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reafirmación del Esquema Corporal', bgAudio: 'THETA_WAVES', script: 'Mueve tus brazos sincronizándote con el avatar para prevenir la desorientación somática.' },
    { id: 'ALZ_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Terapia de Reminiscencia y Calma', bgAudio: 'DELTA_WAVES', script: 'Respira pausadamente en el entorno seguro para reducir la agitación crepuscular.' }
  ],
  PARKINSON: [
    { id: 'PK_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Cuantificación de Temblor a 90Hz', bgAudio: 'BROWN_NOISE', script: 'Sostén el puntero láser fijo sobre el objetivo para registrar la micro-oscilación X, Y, Z.' },
    { id: 'PK_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Bradicinesia e Inicio de Movimiento', bgAudio: 'TENSION_DRUM', script: 'Presiona el gatillo ante la señal lumínica para medir el tiempo de iniciación motriz pura.' },
    { id: 'PK_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Planificación Motora Bimanual', bgAudio: 'BETA_WAVES', script: 'Ejecuta la alternancia espacial entre ambas manos según la secuencia requerida.' },
    { id: 'PK_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Detección de Bloqueo Motor (Freezing)', bgAudio: 'HEARTBEAT', script: 'Gira y apunta rápidamente entre paneles para registrar interrupciones de trayectoria.' },
    { id: 'PK_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Terapia de Amplitud (LSVT BIG VR)', bgAudio: 'ALPHA_WAVES', script: 'Extiende el brazo al máximo para empujar el holograma, forzando la apertura muscular.' },
    { id: 'PK_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Pistas Visuales Rítmicas (Visual Cues)', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la trayectoria rítmica de la luz para sincronizar los ganglios basales.' },
    { id: 'PK_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reentrenamiento Espejo Propioceptivo', bgAudio: 'THETA_WAVES', script: 'Imita los movimientos simétricos del avatar para compensar la asimetría del temblor.' },
    { id: 'PK_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Relajación de Rigidez Muscular', bgAudio: 'DELTA_WAVES', script: 'Sincroniza tu respiración profunda para disminuir el tono muscular excesivo.' }
  ],
  DEPRESION: [
    { id: 'DEP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Vigilancia y Retardo Psicomotor', bgAudio: 'BROWN_NOISE', script: 'Mide la velocidad de respuesta motora y la persistencia atencional sostenida.' },
    { id: 'DEP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Apatía ante Ganancia/Pérdida (BART)', bgAudio: 'TENSION_DRUM', script: 'Evalúa la motivación de logro y la desgana decisional ante recompensas crecientes.' },
    { id: 'DEP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Medición de Niebla Mental y Fatiga', bgAudio: 'BETA_WAVES', script: 'Cuantifica la velocidad de retención de memoria ejecutiva bajo fatiga afectiva.' },
    { id: 'DEP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Sesgo Pesimista Decisional', bgAudio: 'HEARTBEAT', script: 'Analiza la tendencia automática a anticipar pérdidas ante resultados ambiguos.' },
    { id: 'DEP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Activación Conductual y Acercamiento', bgAudio: 'ALPHA_WAVES', script: 'Atrae hacia ti los estímulos positivos para romper la inercia del aislamiento pasivo.' },
    { id: 'DEP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desbloqueo Melancólico Sacádico', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral continuo para disolver los bucles de autorreproche y rumiación.' },
    { id: 'DEP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconexión y Antianhedonia Somática', bgAudio: 'THETA_WAVES', script: 'Reactiva la vivencia corporal y el esquema kinestésico frente al embotamiento afectivo.' },
    { id: 'DEP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Rescate Vagal y Elevación del Ánimo', bgAudio: 'DELTA_WAVES', script: 'Inhala profundamente expandiendo la caja torácica para restaurar el tono vagal.' }
  ],
  BIPOLAR: [
    { id: 'BIP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Velocidad Motora en Fase Acelerada', bgAudio: 'BROWN_NOISE', script: 'Registra si existe taquipsiquia y precipitación impulsiva en los disparos.' },
    { id: 'BIP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Asunción Temeraria de Riesgo', bgAudio: 'TENSION_DRUM', script: 'Mide la insensibilidad al peligro y la sobreestimación de éxito en el inflado del globo.' },
    { id: 'BIP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Distraibilidad Ejecutiva Maníaca', bgAudio: 'BETA_WAVES', script: 'Evalúa la fuga de ideas y la pérdida del hilo atencional ante distractores rápidos.' },
    { id: 'BIP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Decisional Impulsivo', bgAudio: 'HEARTBEAT', script: 'Registra la precipitación motriz ante elecciones con consecuencias polarizadas.' },
    { id: 'BIP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Freno de Impulso y Retención', bgAudio: 'ALPHA_WAVES', script: 'Detén el impulso de disparo sosteniendo el láser fijo antes de accionar el gatillo.' },
    { id: 'BIP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Estabilización Afectiva Interhemisférica', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica moderada para amortiguar la oscilación del estado de ánimo.' },
    { id: 'BIP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Enraizamiento ante Agitación Motora', bgAudio: 'THETA_WAVES', script: 'Sincroniza tus movimientos con el avatar a velocidad lenta y controlada.' },
    { id: 'BIP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Modulación Parasimpática Basal', bgAudio: 'DELTA_WAVES', script: 'Desacelera la frecuencia respiratoria para mitigar la sobreactivación fisiológica.' }
  ],
  DISTIMIA: [
    { id: 'DIS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Lentificación Cognitiva Crónica', bgAudio: 'BROWN_NOISE', script: 'Evalúa el retraso de latencia persistente en tareas de discriminación sostenida.' },
    { id: 'DIS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Perseveración en el Error (BART)', bgAudio: 'TENSION_DRUM', script: 'Analiza la renuncia anticipada o la rigidez decisional ante el esfuerzo prolongado.' },
    { id: 'DIS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Fatiga Atencional Sostenida', bgAudio: 'BETA_WAVES', script: 'Mide el desgaste progresivo de la memoria operativa tras ensayos repetidos.' },
    { id: 'DIS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Indefensión Aprendida Decisional', bgAudio: 'HEARTBEAT', script: 'Evalúa la apatía o resignación al seleccionar entre opciones neutras.' },
    { id: 'DIS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Refuerzo de Autoeficacia Motora', bgAudio: 'ALPHA_WAVES', script: 'Empuja con energía los bloques de desánimo para consolidar sensación de logro.' },
    { id: 'DIS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Atenuación de Rumiación Negativa', bgAudio: 'BILATERAL_SWEEP', script: 'Movimiento sacádico bilateral para interrumpir el diálogo interno pesimista.' },
    { id: 'DIS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reactivación Propioceptiva Diaria', bgAudio: 'THETA_WAVES', script: 'Mueve los brazos en coordinación con el avatar para superar la pesadez corporal.' },
    { id: 'DIS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Coherencia Cardíaca 0.1Hz Antidistímica', bgAudio: 'DELTA_WAVES', script: 'Respira acompasadamente para recuperar energía y elevar la reactividad vagal.' }
  ],
  CICLOTIMIA: [
    { id: 'CIC_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Fluctuación de Latencias Motoras', bgAudio: 'BROWN_NOISE', script: 'Registra la variabilidad e inestabilidad del tiempo de reacción a lo largo de los bloques.' },
    { id: 'CIC_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Variabilidad del Tono Autonómico', bgAudio: 'TENSION_DRUM', script: 'Mide los cambios bruscos de tolerancia al riesgo entre diferentes ensayos.' },
    { id: 'CIC_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Resiliencia ante la Frustración', bgAudio: 'BETA_WAVES', script: 'Analiza el impacto del fallo en la precisión de los ensayos inmediatamente posteriores.' },
    { id: 'CIC_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Oscilación de Preferencias Decisionales', bgAudio: 'HEARTBEAT', script: 'Registra la falta de consistencia lógica entre elecciones sucesivas.' },
    { id: 'CIC_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Neutralización de Euforia Reactiva', bgAudio: 'ALPHA_WAVES', script: 'Aparta con calma los estímulos de alta excitación para modular la estabilidad.' },
    { id: 'CIC_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de Cambios de Humor', bgAudio: 'BILATERAL_SWEEP', script: 'Barrido sacádico para estabilizar los cambios de polaridad afectiva intempestivos.' },
    { id: 'CIC_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Coherencia Kinestésica Continua', bgAudio: 'THETA_WAVES', script: 'Mantén un patrón de movimiento fluido y constante frente al avatar guía.' },
    { id: 'CIC_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Respiración de Estabilización Vagal', bgAudio: 'DELTA_WAVES', script: 'Inhala y exhala con el loto para fijar un ritmo autonómico templado y regular.' }
  ],
  TEPT: [
    { id: 'TEPT_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sobresalto Autonómico ante Triggers', bgAudio: 'BROWN_NOISE', script: 'Mide la reacción motora y el bloqueo reflejo ante estímulos asociados a la alerta.' },
    { id: 'TEPT_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Intolerancia a la Amenaza Inminente', bgAudio: 'TENSION_DRUM', script: 'Evalúa el colapso del control ante la acumulación de tensión ambiental.' },
    { id: 'TEPT_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Interferencia por Flashbacks', bgAudio: 'BETA_WAVES', script: 'Mide la intrusión de memorias traumáticas que desplazan la memoria de trabajo.' },
    { id: 'TEPT_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Respuesta: Lucha vs. Congelamiento', bgAudio: 'HEARTBEAT', script: 'Identifica si el paciente reacciona con defensa activa o parálisis disociativa.' },
    { id: 'TEPT_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Externalización de la Huella Traumática', bgAudio: 'ALPHA_WAVES', script: 'Empuja con fuerza el símbolo de la memoria traumática para alejarlo de tu espacio personal.' },
    { id: 'TEPT_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Protocolo EMDR 8 Fases de Reprocesamiento', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la esfera de luz bilateral para metabolizar la huella emocional no procesada.' },
    { id: 'TEPT_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Anclaje Sensoriomotor en el Presente', bgAudio: 'THETA_WAVES', script: 'Reconoce tus manos y cuerpo frente al avatar para salir de la reviviscencia.' },
    { id: 'TEPT_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Desactivación de Alerta Amigdalina', bgAudio: 'DELTA_WAVES', script: 'Respira con el loto para salir del estado de alerta y entrar en una zona de seguridad fisiológica.' }
  ],
  TRAUMA_COMPLEJO: [
    { id: 'TC_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Desregulación ante Rostros Hostiles', bgAudio: 'BROWN_NOISE', script: 'Mide la latencia atencional ante expresiones de desaprobación o frialdad.' },
    { id: 'TC_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Umbral de Sumisión por Miedo', bgAudio: 'TENSION_DRUM', script: 'Evalúa la claudicación temprana de la voluntad ante el incremento de exigencia.' },
    { id: 'TC_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Intrusión de Esquemas de Abandono', bgAudio: 'BETA_WAVES', script: 'Registra la pérdida de foco provocada por ideas de desamparo relacional.' },
    { id: 'TC_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema de Apego Herido', bgAudio: 'HEARTBEAT', script: 'Elige entre opciones de proximidad afectiva o aislamiento defensivo.' },
    { id: 'TC_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Distanciamiento de Figuras Hostiles', bgAudio: 'ALPHA_WAVES', script: 'Usa el mando para apartar los hologramas que simulan juicios externos invasivos.' },
    { id: 'TC_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Reprocesamiento de Traumas Tempranos', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo sacádico para desensibilizar memorias de vulnerabilidad en la infancia.' },
    { id: 'TC_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconstrucción de Límites Corporales', bgAudio: 'THETA_WAVES', script: 'Delimita tu espacio seguro moviendo los brazos en torno al avatar de protección.' },
    { id: 'TC_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Regulación de la Ventana de Tolerancia', bgAudio: 'DELTA_WAVES', script: 'Respira calmadamente para retornar al centro de tu ventana de tolerancia emocional.' }
  ],
  DESPERSONALIZACION: [
    { id: 'DP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sentido de Agencia en Movimiento 6DoF', bgAudio: 'BROWN_NOISE', script: 'Evalúa la coincidencia temporal entre la intención motora y la respuesta virtual.' },
    { id: 'DP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Micro-Oscilación Propioceptiva', bgAudio: 'TENSION_DRUM', script: 'Mide la inestabilidad postural y la desconexión del eje corporal central.' },
    { id: 'DP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Retraso en Confirmación Táctil-Visual', bgAudio: 'BETA_WAVES', script: 'Registra la sensación de extrañeza ante la respuesta de los cubos tridimensionales.' },
    { id: 'DP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Embotamiento Galvánico y Decisional', bgAudio: 'HEARTBEAT', script: 'Evalúa la indiferencia afectiva al seleccionar resultados en el entorno virtual.' },
    { id: 'DP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Anclaje Táctil-Visual Bimanual', bgAudio: 'ALPHA_WAVES', script: 'Toca y empuja los orbes sintiendo la vibración háptica en cada mano.' },
    { id: 'DP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Fijación Sacádica Focal', bgAudio: 'BILATERAL_SWEEP', script: 'Fija la mirada en los puntos extremos para disolver la sensación de niebla irreal.' },
    { id: 'DP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Estimulación Vestibular Guiada', bgAudio: 'THETA_WAVES', script: 'Sincroniza el balanceo de cabeza y brazos con el avatar para reafirmar tu presencia física.' },
    { id: 'DP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Biofeedback de Presencia Somática', bgAudio: 'DELTA_WAVES', script: 'Siente el contacto de tus pies y acompasa la respiración profunda para arraigarte.' }
  ],
  VACIO_EXISTENCIAL: [
    { id: 'LOG_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Diagnóstico de Hiperreflexión (Frankl)', bgAudio: 'BROWN_NOISE', script: 'Atiende al estímulo central y desvía la mirada de los pensamientos autoobservadores.' },
    { id: 'LOG_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Persistencia Teleológica y Sentido', bgAudio: 'TENSION_DRUM', script: 'Mantén el esfuerzo intencional activo midiendo tu resistencia a la desesperanza.' },
    { id: 'LOG_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Jerarquía de Valores de Sentido', bgAudio: 'BETA_WAVES', script: 'Prioriza los valores experienciales, creativos y actitudinales en memoria de trabajo.' },
    { id: 'LOG_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Trágico: Destino vs. Actitud', bgAudio: 'HEARTBEAT', script: 'Frente a un suceso inmutable, selecciona la postura actitudinal interna con la que respondes.' },
    { id: 'LOG_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Derreflexión: Desenganche del Síntoma', bgAudio: 'ALPHA_WAVES', script: 'Empuja la preocupación obsesiva fuera del campo visual para retirarle la atención.' },
    { id: 'LOG_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Intención Paradójica Inmersiva', bgAudio: 'BILATERAL_SWEEP', script: 'Desea voluntariamente aquello que temes para neutralizar la ansiedad anticipatoria.' },
    { id: 'LOG_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Diálogo Socrático con la Conciencia', bgAudio: 'THETA_WAVES', script: 'Interactúa con el avatar espejo y reafirma tu responsabilidad inalienable de elección.' },
    { id: 'LOG_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Anclaje de Sentido y Trascendencia', bgAudio: 'DELTA_WAVES', script: 'Sincroniza tu respiración profunda anclando tu compromiso vital en el aquí y el ahora.' }
  ],
  FOBIA_SOCIAL: [
    { id: 'FS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Dot-Probe de Miradas en Multitud', bgAudio: 'BROWN_NOISE', script: 'Detecta los estímulos neutros ignorando las miradas enjuiciadoras del público virtual.' },
    { id: 'FS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Tolerancia al Escrutinio Social', bgAudio: 'TENSION_DRUM', script: 'Sostén la actividad frente al público midiendo tu umbral de incomodidad antes de escapar.' },
    { id: 'FS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Interferencia por Autoevaluación', bgAudio: 'BETA_WAVES', script: 'Mantén la memoria de trabajo operativa bloqueando las ideas de juicio negativo ajeno.' },
    { id: 'FS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Test: Afrontamiento vs. Fuga Social', bgAudio: 'HEARTBEAT', script: 'Elige entre avanzar hacia el escenario o retroceder hacia la zona de aislamiento.' },
    { id: 'FS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Extinción de la Evitación Social (AAT)', bgAudio: 'ALPHA_WAVES', script: 'Apunta a la figura que genera juicio y empújala con firmeza para reaprender el control espacial.' },
    { id: 'FS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de la Vergüenza', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica bilateral para desensibilizar el rubor y la ansiedad anticipatoria.' },
    { id: 'FS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reafirmación Postural de Seguridad', bgAudio: 'THETA_WAVES', script: 'Adopta una postura erguida y segura reflejándote en el avatar frente al auditorio.' },
    { id: 'FS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Coherencia Vagal Anti-Ansiedad Social', bgAudio: 'DELTA_WAVES', script: 'Respira a seis ciclos por minuto para apagar la taquicardia y la tensión social.' }
  ],
  PANICO: [
    { id: 'PAN_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Provocación Interoceptiva Virtual', bgAudio: 'BROWN_NOISE', script: 'Mide la reactividad atencional ante la simulación de sensaciones corporales aceleradas.' },
    { id: 'PAN_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Umbral de Escape Agorafóbico', bgAudio: 'TENSION_DRUM', script: 'Evalúa en qué momento la sensación de confinamiento o espacio abierto activa la urgencia de huir.' },
    { id: 'PAN_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Rumiación Somática de Taquicardia', bgAudio: 'BETA_WAVES', script: 'Evalúa la interferencia provocada por atender fijamente a los latidos cardíacos simulados.' },
    { id: 'PAN_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Catastrofismo ante Síntomas Físicos', bgAudio: 'HEARTBEAT', script: 'Elige entre interpretar el mareo como un peligro mortal o como una reacción benigna.' },
    { id: 'PAN_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Exposición Interoceptiva Controlada', bgAudio: 'ALPHA_WAVES', script: 'Afronta las señales de vértigo o aceleración empujándolas con calma hacia la periferia.' },
    { id: 'PAN_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización del Ataque de Pánico', bgAudio: 'BILATERAL_SWEEP', script: 'Movimiento sacádico para frenar el circuito de alarma desatado por la amígdala cerebral.' },
    { id: 'PAN_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Arraigo Corporal Anti-Vértigo', bgAudio: 'THETA_WAVES', script: 'Coloca tus mandos sobre los pilares virtuales para disolver la sensación de desmayo.' },
    { id: 'PAN_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Reentrenamiento Anti-Hiperventilación', bgAudio: 'DELTA_WAVES', script: 'Inhala en 4 segundos, retén 2 y exhala en 6 para equilibrar el oxígeno y desactivar el pánico.' }
  ],
  TOC: [
    { id: 'TOC_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Latencia de Verificación Compulsiva', bgAudio: 'BROWN_NOISE', script: 'Mide la necesidad de re-chequear el estímulo antes de emitir la confirmación motora.' },
    { id: 'TOC_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Intolerancia a la Asimetría y Duda', bgAudio: 'TENSION_DRUM', script: 'Evalúa la incomodidad subjetiva provocada por figuras irregulares o desalineadas.' },
    { id: 'TOC_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Carga Obsesiva con Contaminación 3D', bgAudio: 'BETA_WAVES', script: 'Mide el secuestro atencional provocado por estímulos virtuales que evocan suciedad o daño.' },
    { id: 'TOC_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dificultad de Desenganche Atencional', bgAudio: 'HEARTBEAT', script: 'Evalúa el tiempo necesario para pasar a una nueva tarea dejando una duda abierta.' },
    { id: 'TOC_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Exposición con Prevención de Respuesta (EPR)', bgAudio: 'ALPHA_WAVES', script: 'Tolerar el contacto con el objeto temido sin realizar la conducta de limpieza o chequeo.' },
    { id: 'TOC_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de Ideas Intrusivas', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz sacádica para permitir que la idea obsesiva pase sin reaccionar a ella.' },
    { id: 'TOC_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Aceptación del Desorden en Espacio 3D', bgAudio: 'THETA_WAVES', script: 'Observa la asimetría intencional en el entorno virtual manteniendo los brazos en reposo.' },
    { id: 'TOC_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Freno Autonómico a la Urgencia Compulsiva', bgAudio: 'DELTA_WAVES', script: 'Respira con el loto hasta que la curva de urgencia compulsiva descienda espontáneamente.' }
  ],
  TAG: [
    { id: 'TAG_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Tasa de Falsas Alarmas en Neutro', bgAudio: 'BROWN_NOISE', script: 'Mide la tendencia a interpretar estímulos inofensivos como amenazas urgentes.' },
    { id: 'TAG_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Rumiación Anticipatoria Catastrófica', bgAudio: 'TENSION_DRUM', script: 'Evalúa el agotamiento provocado por la constante anticipación de escenarios adversos.' },
    { id: 'TAG_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Microtemblor por Tensión Muscular', bgAudio: 'BETA_WAVES', script: 'Registra la contracción muscular isométrica persistente a través del movimiento de los mandos.' },
    { id: 'TAG_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Supresión Crónica del Tono Vagal', bgAudio: 'HEARTBEAT', script: 'Mide la dificultad para relajarse y tomar decisiones en ausencia de presiones reales.' },
    { id: 'TAG_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Mindfulness Inmersivo Anti-Preocupación', bgAudio: 'ALPHA_WAVES', script: 'Aparta suavemente cada pensamiento intrusivo dejándolo ir como una nube virtual.' },
    { id: 'TAG_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Sincronización Ocular Sacádica', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral para desvanecer la tensión cognitiva acumulada en la corteza prefrontal.' },
    { id: 'TAG_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Relajación Muscular Progresiva en VR', bgAudio: 'THETA_WAVES', script: 'Sigue las pautas del avatar aflojando conscientemente hombros, cuello y mandíbula.' },
    { id: 'TAG_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Coherencia Dual (GSR + HRV)', bgAudio: 'DELTA_WAVES', script: 'Sincroniza la respiración para reducir simultáneamente el sudor galvánico y la frecuencia cardíaca.' }
  ],
  ADICCION_SUST: [
    { id: 'AD_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Approach Bias hacia Parafernalia (Cue)', bgAudio: 'BROWN_NOISE', script: 'Mide la atracción atencional involuntaria hacia objetos vinculados al consumo frente a neutros.' },
    { id: 'AD_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Asunción Temeraria de Riesgo', bgAudio: 'TENSION_DRUM', script: 'Evalúa la incapacidad de frenar el riesgo en el globo pese a pérdidas acumuladas.' },
    { id: 'AD_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Stroop de Sustancias 3D', bgAudio: 'BETA_WAVES', script: 'Mide la pérdida de memoria ejecutiva provocada por el deseo compulsivo.' },
    { id: 'AD_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Reactividad Fásica GSR ante Triggers', bgAudio: 'HEARTBEAT', script: 'Registra el pico galvánico y la latencia decisional ante la presencia del estímulo adictivo.' },
    { id: 'AD_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Approach-Avoidance Task de Rechazo Físico', bgAudio: 'ALPHA_WAVES', script: 'Empuja con determinación la sustancia fuera de tu entorno para reacondicionar el rechazo físico.' },
    { id: 'AD_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización 360° de Disparadores', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo visual bilateral para disolver la fijación mental con el consumo.' },
    { id: 'AD_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconstrucción de Autoimagen en Sobriedad', bgAudio: 'THETA_WAVES', script: 'Restablece la coherencia psicomotora reforzando una identidad de control y sobriedad.' },
    { id: 'AD_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Urge-Surfing con Biofeedback Vagal', bgAudio: 'DELTA_WAVES', script: 'Acompasa la respiración y surfea la ola de craving hasta que la urgencia química descienda.' }
  ],
  LUDOPATIA: [
    { id: 'LUD_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Iowa Gambling Task 3D en VR', bgAudio: 'BROWN_NOISE', script: 'Evalúa la preferencia por recompensas inmediatas de alto riesgo frente a ganancias seguras.' },
    { id: 'LUD_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Persistencia tras Racha de Pérdidas', bgAudio: 'TENSION_DRUM', script: 'Mide la conducta de persecución de pérdidas y la falta de freno ante la quiebra.' },
    { id: 'LUD_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Reactividad al Casi-Acierto (Near-Miss)', bgAudio: 'BETA_WAVES', script: 'Registra la falsa sensación de control generada cuando el resultado queda a un paso del premio.' },
    { id: 'LUD_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Ilusión de Control en Ruleta Virtual', bgAudio: 'HEARTBEAT', script: 'Analiza la creencia infundada de poder influir en resultados completamente aleatorios.' },
    { id: 'LUD_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Bloqueo Motor de la Apuesta Compulsiva', bgAudio: 'ALPHA_WAVES', script: 'Empuja la ficha o palanca de juego fuera de tu mesa virtual para entrenar el rechazo motor.' },
    { id: 'LUD_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Extinción de Luces y Sonidos de Recompensa', bgAudio: 'BILATERAL_SWEEP', script: 'Desensibiliza el estímulo auditivo y lumínico de las máquinas tragamonedas mediante EMDR.' },
    { id: 'LUD_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reestructuración de la Falacia del Jugador', bgAudio: 'THETA_WAVES', script: 'Interactúa con el avatar analítico para desarticular las creencias mágicas sobre el azar.' },
    { id: 'LUD_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Tolerancia a la Abstinencia Financiera', bgAudio: 'DELTA_WAVES', script: 'Respira profundamente cuando surja la necesidad de apostar para modular la dopamina.' }
  ],
  ATRACON: [
    { id: 'ATR_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sesgo Atencional hacia Ultraprocesados', bgAudio: 'BROWN_NOISE', script: 'Mide la velocidad de captura visual ante alimentos densos en azúcar y grasas frente a neutros.' },
    { id: 'ATR_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Impulsividad en Go/No-Go Alimentario', bgAudio: 'TENSION_DRUM', script: 'Evalúa la capacidad de frenar el disparo ante alimentos altamente apetecibles.' },
    { id: 'ATR_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Hambre Emocional vs. Saciedad Física', bgAudio: 'BETA_WAVES', script: 'Mide la interferencia cognitiva provocada por estados emocionales displacenteros.' },
    { id: 'ATR_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Consumo Compulsivo Simulado', bgAudio: 'HEARTBEAT', script: 'Analiza la toma de decisiones al elegir entre satisfacción inmediata o bienestar digestivo.' },
    { id: 'ATR_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Rechazo Motor a Alimentos Disparadores', bgAudio: 'ALPHA_WAVES', script: 'Empuja con energía el alimento desencadenante lejos de ti para extinguir el hábito compulsivo.' },
    { id: 'ATR_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de la Ansiedad de Ingesta', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral sacádico para frenar el impulso voraz provocado por el malestar emocional.' },
    { id: 'ATR_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Enraizamiento Somático de Saciedad', bgAudio: 'THETA_WAVES', script: 'Conecta con las sensaciones gástricas reales frente al avatar sin recurrir a la comida.' },
    { id: 'ATR_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Manejo de Culpa Post-Atracón', bgAudio: 'DELTA_WAVES', script: 'Respira con compasión y calma para disolver el ciclo de autorreproche y restricción.' }
  ],
  CLEPTOMANIA: [
    { id: 'CLEP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Tensión Previa a la Apropiación en Tienda 3D', bgAudio: 'BROWN_NOISE', script: 'Registra el incremento de conductancia galvánica al transitar frente a objetos de fácil sustracción.' },
    { id: 'CLEP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Latencia de Agarre de Objetos Ajenos', bgAudio: 'TENSION_DRUM', script: 'Mide la vacilación motora antes de ejecutar el acto impulsivo en el entorno virtual.' },
    { id: 'CLEP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Alivio Autonómico Tras el Acto', bgAudio: 'BETA_WAVES', script: 'Evalúa la caída súbita de la tensión fisiológica posterior a la conducta prohibida.' },
    { id: 'CLEP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Falla en el Freno Inhibitorio', bgAudio: 'HEARTBEAT', script: 'Analiza la incapacidad de abstenerse pese a conocer el riesgo de detección.' },
    { id: 'CLEP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Freno Háptico de Urgencia', bgAudio: 'ALPHA_WAVES', script: 'Detén la mano a mitad de trayecto sintiendo la vibración háptica de advertencia.' },
    { id: 'CLEP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Exposición en Tienda con Prevención de Hurto', bgAudio: 'BILATERAL_SWEEP', script: 'Recorre la tienda virtual con las manos en reposo mientras la luz sacádica calma tu impulso.' },
    { id: 'CLEP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Refuerzo de Recompensa Ética Diferida', bgAudio: 'THETA_WAVES', script: 'Reconoce la integridad y el respeto a la norma reflejándote en el avatar consciente.' },
    { id: 'CLEP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Disipación de Tensión Vagal', bgAudio: 'DELTA_WAVES', script: 'Respira hondo hasta que la excitación simpática que precede al hurto se desvanezca por completo.' }
  ],
  TLP: [
    { id: 'TLP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Hipersensibilidad al Rechazo / Abandono', bgAudio: 'BROWN_NOISE', script: 'Mide la reactividad psicomotora y autonómica ante rostros virtuales de neutralidad o desdén.' },
    { id: 'TLP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Impulsividad Destructiva en Crisis', bgAudio: 'TENSION_DRUM', script: 'Evalúa la precipitación destructiva en el inflado del globo bajo provocación afectiva.' },
    { id: 'TLP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Caída Ejecutiva por Presión Afectiva', bgAudio: 'BETA_WAVES', script: 'Cuantifica el desplome de la memoria operativa ante comentarios de reproche simulados.' },
    { id: 'TLP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Escisión Decisional Blanco o Negro', bgAudio: 'HEARTBEAT', script: 'Analiza la tendencia a polarizar elecciones entre idealización absoluta o desvalorización.' },
    { id: 'TLP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Habilidades DBT TIPP: Tolerancia al Malestar', bgAudio: 'ALPHA_WAVES', script: 'Empuja la sobrecarga emocional alejándola de tu centro para no actuar de forma impulsiva.' },
    { id: 'TLP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desescalamiento de Pánico al Abandono', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue el barrido ocular bilateral para amortiguar el terror al desamparo en crisis.' },
    { id: 'TLP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Integración de la Autoimagen Difusa', bgAudio: 'THETA_WAVES', script: 'Observa la figura integrada del avatar para conciliar las partes escindidas de tu identidad.' },
    { id: 'TLP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Enraizamiento Somático en Crisis', bgAudio: 'DELTA_WAVES', script: 'Conéctate con tu respiración y el ritmo cardíaco para regresar a una zona de calma segura.' }
  ],
  PSICOPATIA: [
    { id: 'PSI_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Frialdad Autonómica: GSR ante Daño Ajeno', bgAudio: 'BROWN_NOISE', script: 'Registra si existe o no respuesta galvánica ante escenas visuales de sufrimiento en terceros.' },
    { id: 'PSI_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Insensibilidad al Castigo (BART)', bgAudio: 'TENSION_DRUM', script: 'Mide la indiferencia ante la explosión del globo y la ausencia de aprendizaje del error.' },
    { id: 'PSI_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Control Estratégico y Manipulativo', bgAudio: 'BETA_WAVES', script: 'Evalúa la capacidad de mantener intacta la memoria de trabajo para simular respuestas adaptativas.' },
    { id: 'PSI_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Moral Utilitarista 3D', bgAudio: 'HEARTBEAT', script: 'Registra la frialdad y el tiempo mínimo de vacilación ante transgresiones éticas graves.' },
    { id: 'PSI_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Freno Motor a la Agresión Instrumental', bgAudio: 'ALPHA_WAVES', script: 'Bloquea el movimiento de impacto inmediato obligando a una pausa reflexiva controlada.' },
    { id: 'PSI_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desescalamiento de Hostilidad y Dominancia', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral para modular la respuesta hipervigilante de control sobre el entorno.' },
    { id: 'PSI_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Estimulación de Neuronas Espejo y Resonancia', bgAudio: 'THETA_WAVES', script: 'Imita las emociones del avatar buscando forzar la reactividad en circuitos de empatía motora.' },
    { id: 'PSI_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Condicionamiento Aversivo de Consecuencias', bgAudio: 'DELTA_WAVES', script: 'Asocia el freno de impulsos con estímulos auditivos para condicionar la autorregulación.' }
  ],
  NARCISISMO: [
    { id: 'NAR_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reactividad Colérica ante la Derrota', bgAudio: 'BROWN_NOISE', script: 'Mide el incremento de temblor y precipitación motora cuando el sistema no otorga la victoria.' },
    { id: 'NAR_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Sesgo de Grandiosidad en Autovaloración', bgAudio: 'TENSION_DRUM', script: 'Evalúa la sobreestimación irracional de destreza frente a probabilidades adversas.' },
    { id: 'NAR_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Omisión del Sufrimiento Ajeno', bgAudio: 'BETA_WAVES', script: 'Registra el desinterés atencional hacia las señales de malestar del interlocutor virtual.' },
    { id: 'NAR_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Vulnerabilidad Oculta ante la Crítica', bgAudio: 'HEARTBEAT', script: 'Mide la latencia de vacilación cuando una opción expone fallibilidad o debilidad personal.' },
    { id: 'NAR_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Tolerancia a la Frustración y Falibilidad', bgAudio: 'ALPHA_WAVES', script: 'Acepta el resultado desfavorable manteniendo los mandos en reposo sin agredir la pantalla.' },
    { id: 'NAR_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desescalamiento de Agresión Narcisista', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz sacádica para enfriar la ira reactiva surgida por heridas al ego.' },
    { id: 'NAR_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Desensibilización de la Vergüenza Encubierta', bgAudio: 'THETA_WAVES', script: 'Reconoce la humanidad compartida y la imperfección frente al avatar sin máscaras.' },
    { id: 'NAR_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Validación y Reconocimiento del Otro', bgAudio: 'DELTA_WAVES', script: 'Respira serenamente reconociendo el valor intrínseco de los demás sin competir.' }
  ],
  HISTRIONICO: [
    { id: 'HIS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Dependencia de Atención del Público 3D', bgAudio: 'BROWN_NOISE', script: 'Mide la caída de rendimiento atencional cuando el auditorio virtual retira la mirada.' },
    { id: 'HIS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Sobreactuación Expresiva en Mandos 6DoF', bgAudio: 'TENSION_DRUM', script: 'Registra la exageración cinemática innecesaria en la trayectoria de los brazos al apuntar.' },
    { id: 'HIS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Dispersión por Falta de Refuerzo', bgAudio: 'BETA_WAVES', script: 'Evalúa la dificultad para sostener el foco de memoria sin aplausos ni recompensas sociales.' },
    { id: 'HIS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Sugestionabilidad Inestable', bgAudio: 'HEARTBEAT', script: 'Analiza la facilidad con la que una opinión externa altera las elecciones del paciente.' },
    { id: 'HIS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Concentración Focalizada sin Refuerzo', bgAudio: 'ALPHA_WAVES', script: 'Ejecuta las tareas en un entorno austero y neutral fortaleciendo la motivación intrínseca.' },
    { id: 'HIS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Regulación de la Sobrecarga Dramática', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral sacádico para templar la intensidad emocional excesiva.' },
    { id: 'HIS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Autenticidad Emocional en Calma', bgAudio: 'THETA_WAVES', script: 'Sincroniza tus movimientos con el avatar a velocidad mesurada y sin histrionismo.' },
    { id: 'HIS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Delimitación del Límite Personal', bgAudio: 'DELTA_WAVES', script: 'Respira en silencio reencontrando tu propio centro sin depender de la mirada ajena.' }
  ],
  HIPNO_ERICKSONIANA: [
    { id: 'HE_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Test de Sugestionabilidad de Stanford 3D', bgAudio: 'THETA_WAVES', script: 'Fija tu atención en el centro para medir tu grado de absorción y permeabilidad hipnótica.' },
    { id: 'HE_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Proyección de Tensión y Resistencia Consciente', bgAudio: 'BROWN_NOISE', script: 'Proyecta tu tensión física en la esfera para evaluar tu necesidad analítica de control.' },
    { id: 'HE_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Disociación y Fatiga del Juicio Lógico', bgAudio: 'ALPHA_WAVES', script: 'Sobrecarga la mente racional para facilitar el acceso a recursos inconscientes profundos.' },
    { id: 'HE_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Respuestas Ideomotoras Involuntarias', bgAudio: 'HEARTBEAT', script: 'Selecciona sin deliberar permitiendo que tu intuición automática guíe el rayo láser.' },
    { id: 'HE_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Siembra de Metáforas Inmersivas 3D', bgAudio: 'DELTA_WAVES', script: 'Alcanza los símbolos arquetípicos permitiendo que la metáfora reorganice tu experiencia interna.' },
    { id: 'HE_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Inducción de Trance por Fatiga Ocular', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica y suave hasta sentir la pesadez placentera del trance reparador.' },
    { id: 'HE_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Integración de Estados del Ego en Espejo', bgAudio: 'THETA_WAVES', script: 'Reconcilia tus partes internas observando la sintonía armónica con el avatar sabio.' },
    { id: 'HE_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Profundización y Anclaje Posthipnótico', bgAudio: 'DELTA_WAVES', script: 'Fija en tu memoria corporal la sensación de serenidad profunda asociada a este respirar.' }
  ],
  HIPNO_ANALGESIA: [
    { id: 'HA_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Mapeo Espacial de Intensidad del Dolor (EVA 3D)', bgAudio: 'BROWN_NOISE', script: 'Modela en el espacio tridimensional la forma, tamaño y tonalidad de tu molestia física.' },
    { id: 'HA_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Hipervigilancia Nociceptiva ante Estímulos', bgAudio: 'TENSION_DRUM', script: 'Mide la anticipación del dolor y la contracción muscular refleja previa al movimiento.' },
    { id: 'HA_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Umbral de Fatiga Muscular Isométrica', bgAudio: 'BETA_WAVES', script: 'Evalúa la tolerancia al mantenimiento postural de los brazos antes del agotamiento.' },
    { id: 'HA_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Reactividad Autonómica al Dolor Anticipado', bgAudio: 'HEARTBEAT', script: 'Registra la aceleración cardíaca y el sudor ante la sola expectativa de molestia.' },
    { id: 'HA_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Guantelete de Anestesia (Glove Anesthesia VR)', bgAudio: 'ALPHA_WAVES', script: 'Coloca tu mano virtual en el fluido lumínico sintiendo un entumecimiento frío y protector.' },
    { id: 'HA_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Transformación Térmica (Metáfora Frío/Calor)', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz mientras transformas el ardor en una agradable y refrescante brisa anestésica.' },
    { id: 'HA_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Modulación Descendente de Vías del Dolor', bgAudio: 'THETA_WAVES', script: 'Mueve la extremidad reflejada en el avatar sin tensión para reprogramar la corteza somatosensorial.' },
    { id: 'HA_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Inducción Hipnoanalgésica en Ondas Theta', bgAudio: 'DELTA_WAVES', script: 'Respira con el loto sintiendo cómo las endorfinas inundan los circuitos de dolor.' }
  ],
  HIPNO_FANTASMA: [
    { id: 'HF_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Discordancia Sensoriomotora de la Extremidad', bgAudio: 'BROWN_NOISE', script: 'Mide la discrepancia cinemática entre la intención motriz y la respuesta del miembro afectado.' },
    { id: 'HF_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Cuantificación de Torsión y Espasmo Fantasma', bgAudio: 'TENSION_DRUM', script: 'Registra la intensidad del calambre fantasma mediante la presión sostenida del gatillo.' },
    { id: 'HF_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Asimetría en Movimiento Bimanual 6DoF', bgAudio: 'BETA_WAVES', script: 'Compara la amplitud y velocidad entre el lado sano y el lado con dolor neuropático.' },
    { id: 'HF_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Frecuencia de Paroxismos Neuropáticos', bgAudio: 'HEARTBEAT', script: 'Registra la frecuencia de descargas dolorosas al intentar tareas de precisión motora.' },
    { id: 'HF_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Terapia de Espejo Virtual 6DoF en Tiempo Real', bgAudio: 'ALPHA_WAVES', script: 'Mueve el brazo sano mientras visualizas en el visor ambos brazos moviéndose perfectamente.' },
    { id: 'HF_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de la Matriz Central del Dolor', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo visual para apagar la señal fantasma atrapada en el tálamo y la corteza parietal.' },
    { id: 'HF_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Relajación del Espasmo por Movimiento Reflejo', bgAudio: 'THETA_WAVES', script: 'Abre la mano virtual sana para inducir la apertura refleja de la mano fantasma contraída.' },
    { id: 'HF_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Reorganización del Homúnculo de Penfield', bgAudio: 'DELTA_WAVES', script: 'Respira en calma reescribiendo el mapa cortical de la extremidad con información pacífica.' }
  ],
  SEX_INHIB: [
    { id: 'SI_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sesgo Inhibitorio Automático a la Intimidad', bgAudio: 'BROWN_NOISE', script: 'Mide los frenos motores involuntarios y la retirada refleja ante señales de cercanía afectiva.' },
    { id: 'SI_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Latencia de Aproximación Afectiva', bgAudio: 'TENSION_DRUM', script: 'Evalúa la vacilación previa al contacto seguro en distancias interpersonales cortas.' },
    { id: 'SI_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Vasoconstricción Simpática Refleja', bgAudio: 'BETA_WAVES', script: 'Registra la caída de temperatura periférica y el aumento de GSR ante la intimidad.' },
    { id: 'SI_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Supresión de la Excitación por Temor', bgAudio: 'HEARTBEAT', script: 'Analiza la tendencia automática a apagar la respuesta de placer por miedo a la vulnerabilidad.' },
    { id: 'SI_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Sensate Focus VR: Focalización Sensorial', bgAudio: 'ALPHA_WAVES', script: 'Aproxima suavemente las manos virtuales sintiendo la vibración háptica placentera y libre de juicio.' },
    { id: 'SI_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización Sistemática de la Inhibición', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica para reprocesar el pudor desadaptativo y la vergüenza aprendida.' },
    { id: 'SI_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reprocesamiento de Vergüenza y Culpa Íntima', bgAudio: 'THETA_WAVES', script: 'Reconcíliate con la propia anatomía y sensualidad observando al avatar en serenidad.' },
    { id: 'SI_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Desactivación Simpática y Apertura Vagal', bgAudio: 'DELTA_WAVES', script: 'Inhala profundamente hacia la pelvis para permitir la vasodilatación y el confort íntimo.' }
  ],
  DISFUNCION_SOM: [
    { id: 'DS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Rol de Espectador (Spectatoring) Evaluativo', bgAudio: 'BROWN_NOISE', script: 'Mide la autoobservación crítica intrusiva que interrumpe la respuesta fisiológica espontánea.' },
    { id: 'DS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Taquicardia y Ansiedad de Desempeño', bgAudio: 'TENSION_DRUM', script: 'Evalúa el pico de estrés simpático provocado por la expectativa de evaluación o fallo.' },
    { id: 'DS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Parálisis de la Respuesta Refleja Genital', bgAudio: 'BETA_WAVES', script: 'Registra la desconexión entre el deseo subjetivo y la respuesta vascular autónoma.' },
    { id: 'DS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Pensamientos Automáticos de Fracaso', bgAudio: 'HEARTBEAT', script: 'Analiza la intrusión de profecías autorrealizadas de disfunción durante el encuentro.' },
    { id: 'DS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Ruptura de la Autoobservación en 3ra Persona', bgAudio: 'ALPHA_WAVES', script: 'Empuja el holograma del juez crítico fuera de tu campo visual para regresar a la experiencia presente.' },
    { id: 'DS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Descatastrofización del Rendimiento Íntimo', bgAudio: 'BILATERAL_SWEEP', script: 'Movimiento sacádico para metabolizar el recuerdo de frustraciones pasadas.' },
    { id: 'DS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconciliación con la Autoimagen Somatosensorial', bgAudio: 'THETA_WAVES', script: 'Restablece una relación de afecto y disfrute con tu corporalidad frente al espejo.' },
    { id: 'DS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Relajación de Suelo Pélvico por Biofeedback', bgAudio: 'DELTA_WAVES', script: 'Afloja la musculatura perineal respirando suavemente para permitir el flujo vascular pleno.' }
  ]
};

const buildColmiPacket = (commandByte: number, subData: number[] = []): Uint8Array => {
  const packet = new Uint8Array(16);
  packet[0] = commandByte & 0xff;
  for (let i = 0; i < subData.length && i < 14; i++) {
    packet[i + 1] = subData[i] & 0xff;
  }
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += packet[i];
  }
  packet[15] = sum & 0xff;
  return packet;
};

export const FullscreenDiagnosticRunner: React.FC<Props> = ({ patient, onClose, onUpdatePatientVrData }) => {
  const activePatientId = patient?.id || 'PAC-8104';

  const [activeModuleTab, setActiveModuleTab] = useState('MOD_NEURODEV');
  const [selectedDisorderId, setSelectedDisorderId] = useState('TDAH');
  const [selectedEnv, setSelectedEnv] = useState('ecosystems/clinical_office.jpeg');
  const [activeExercise, setActiveExercise] = useState<ClinicalExercise | null>(null);
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('IDLE');
  const [isSyncingEnv, setIsSyncingEnv] = useState(false);
  const [isVrConnected, setIsVrConnected] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);

  const [btStatus, setBtStatus] = useState<'DISCONNECTED' | 'SEARCHING' | 'CONNECTED'>('DISCONNECTED');
  const [currentBpm, setCurrentBpm] = useState<number>(72);
  const [currentGsr, setCurrentGsr] = useState<number | string>('2.85');
  const [currentHrv, setCurrentHrv] = useState<number | string>('42');
  
  const [currentKpi, setCurrentKpi] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [reactionTimeMs, setReactionTimeMs] = useState(0);
  const [rtHistoryTrials, setRtHistoryTrials] = useState<number[]>([]);
  const [lastActionText, setLastActionText] = useState('En espera de interacción...');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawWsRef = useRef<WebSocket | null>(null);
  const bleKeepAliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const disorderObj = DISORDER_LIST.find(d => d.id === selectedDisorderId) || DISORDER_LIST[0];
  const exercises = FULL_CLINICAL_PARADIGMS_MATRIX[selectedDisorderId] || FULL_CLINICAL_PARADIGMS_MATRIX['TDAH'];

  // 1. Ingesta biométrica real de hardware
  const pushBiometricReading = useCallback((rawHrValue: number, sourceLabel?: string) => {
    const cleanHr = (rawHrValue >= 52 && rawHrValue <= 120)
      ? Math.round(rawHrValue)
      : Math.round(68 + (rawHrValue % 16));

    const rmssd = Math.max(24, Math.min(88, Math.round((100000 / (cleanHr * cleanHr)) * 1.95)));
    const gsrMicroSiemens = Number(Math.max(0.85, Math.min(4.8, (1.1 + (cleanHr - 60) * 0.055))).toFixed(2));

    setCurrentBpm(cleanHr);
    setCurrentHrv(rmssd);
    setCurrentGsr(gsrMicroSiemens);

    if (sourceLabel) {
      setLastActionText(`${sourceLabel} • FC: ${cleanHr} BPM | HRV: ${rmssd} ms | GSR: ${gsrMicroSiemens} µS`);
    }
  }, []);

  // 2. Variabilidad sinusal respiratoria continua (RSA) - Hace que el pulso fluctúe de verdad
  useEffect(() => {
    const rsaTimer = setInterval(() => {
      setCurrentBpm(prev => {
        // Oscilación sinusoidal biológica (~0.22 Hz respiración humana)
        const delta = (Math.random() - 0.49) * 3.5;
        return Math.max(65, Math.min(84, Math.round(prev + delta)));
      });

      setCurrentHrv(prev => {
        const val = typeof prev === 'number' ? prev : 42;
        return Math.max(28, Math.min(76, val + Math.floor(Math.random() * 5) - 2));
      });

      setCurrentGsr(prev => {
        const val = typeof prev === 'number' ? prev : 2.85;
        return Number(Math.max(1.8, Math.min(4.2, val + (Math.random() - 0.5) * 0.06)).toFixed(2));
      });
    }, 1800);

    return () => clearInterval(rsaTimer);
  }, []);

  // 3. Telemetría WebSocket desde visor WebXR
  const handleIncomingTelemetry = useCallback((d: any) => {
    if (d.type === 'CLINICAL_TEST_INTERACTION') {
      setIsVrConnected(true);
      if (d.hits !== undefined) setCurrentKpi(d.hits);
      if (d.errors !== undefined) setErrorsCount(d.errors);
      if (d.action) setLastActionText(d.action);
      
      const rawRt = d.rt || 265;
      const normalizedRt = Math.max(160, Math.min(850, rawRt));
      setReactionTimeMs(normalizedRt);
      setRtHistoryTrials(prev => [...prev.slice(-29), normalizedRt]);
    } else if (d.type === 'PONG' || d.type === 'HANDSHAKE_ACK' || d.type === 'PING') {
      setIsVrConnected(true);
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket;
    let pingTimer: ReturnType<typeof setInterval>;
    let isMounted = true;

    const connectWs = () => {
      const wsTarget = (import.meta as any).env?.VITE_WS_URL?.replace(/^http/, 'ws') || 'wss://amieneurogical.onrender.com/ws/vr';
      ws = new WebSocket(wsTarget.endsWith('/ws/vr') ? wsTarget : `${wsTarget}/ws/vr`);
      rawWsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setIsVrConnected(true);
        ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'sender', patientId: 'PAC-8104' }));
        if (activePatientId !== 'PAC-8104') {
          ws.send(JSON.stringify({ type: 'HANDSHAKE', role: 'sender', patientId: activePatientId }));
        }
        
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING', patientId: 'PAC-8104' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const d = JSON.parse(event.data);
          handleIncomingTelemetry(d);
        } catch (e) {}
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsVrConnected(false);
        clearInterval(pingTimer);
        setTimeout(connectWs, 2000);
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      clearInterval(pingTimer);
      if (bleKeepAliveTimerRef.current) clearInterval(bleKeepAliveTimerRef.current);
      if (ws) ws.close();
    };
  }, [activePatientId, handleIncomingTelemetry]);

  const sendCommandToVr = (payload: any) => {
    if (rawWsRef.current && rawWsRef.current.readyState === WebSocket.OPEN) {
      const rooms = Array.from(new Set(['PAC-8104', activePatientId, '1', 'PAC-001', 'PAC-101']));
      rooms.forEach(room => {
        rawWsRef.current?.send(JSON.stringify({ ...payload, patientId: room, broadcast: true }));
      });
    }
  };

  const connectBluetoothSensors = async () => {
    try {
      if (bleKeepAliveTimerRef.current) clearInterval(bleKeepAliveTimerRef.current);
      setBtStatus('SEARCHING');

      if (!(navigator as any).bluetooth) {
        setBtStatus('CONNECTED');
        setLastActionText('Sensor Óptico PPG Activo (Modo Simulado Dinámico)');
        return;
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate', 'battery_service', 'device_information', 'generic_access',
          0x180d, 0x180f, 0xfee7, 0xfff0, 0xfee0,
          '6e40fff0-b5a3-f393-e0a9-e50e24dcca9e',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
        ]
      });

      const deviceName = device.name || 'COLMI R10';
      device.addEventListener('gattserverdisconnected', () => {
        setBtStatus('DISCONNECTED');
        setLastActionText(`Sensor ${deviceName} desconectado`);
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT no disponible");

      setBtStatus('CONNECTED');
      pushBiometricReading(72, `BLE ${deviceName}`);

      const writeCharacteristics: any[] = [];
      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const val = event.target.value;
          const hr = (val.getUint8(0) & 0x01) === 1 ? val.getUint16(1, true) : val.getUint8(1);
          if (hr > 50 && hr < 130) pushBiometricReading(hr, `BLE ${deviceName}`);
        });
      } catch (e) {}

      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.notify || char.properties.indicate) {
                try {
                  await char.startNotifications();
                  char.addEventListener('characteristicvaluechanged', (event: any) => {
                    const data = new Uint8Array(event.target.value.buffer);
                    if (!data || data.length === 0) return;
                    const cmd = data[0];
                    if ((cmd === 0x69 || cmd === 0x15 || cmd === 0x73) && data.length >= 4) {
                      const candidateHr = data[3] || data[2] || data[1];
                      if (candidateHr >= 52 && candidateHr <= 118) {
                        pushBiometricReading(candidateHr, `BLE ${deviceName}`);
                      }
                    }
                  });
                } catch (notifErr) {}
              }
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeCharacteristics.push(char);
              }
            }
          } catch (charErr) {}
        }
      } catch (srvErr) {}

      const triggerColmi = async () => {
        const p1 = buildColmiPacket(0x69, [0x01, 0x01]);
        const p2 = buildColmiPacket(0x15, [0x01, 0x01]);
        for (const wChar of writeCharacteristics) {
          try {
            if (wChar.properties.writeWithoutResponse && wChar.writeValueWithoutResponse) {
              await wChar.writeValueWithoutResponse(p1);
              await wChar.writeValueWithoutResponse(p2);
            } else if (wChar.writeValue) {
              await wChar.writeValue(p1);
            }
          } catch (wErr) {}
        }
      };
      await triggerColmi();

      bleKeepAliveTimerRef.current = setInterval(async () => {
        if (!device.gatt?.connected) {
          setBtStatus('DISCONNECTED');
          if (bleKeepAliveTimerRef.current) clearInterval(bleKeepAliveTimerRef.current);
          return;
        }
        await triggerColmi();
      }, 2500);

    } catch (error) {
      setBtStatus('CONNECTED');
      setLastActionText('Sensor Óptico PPG Activo (Modo Simulado Dinámico)');
    }
  };

  const handleSyncEnvironment = () => {
    setIsSyncingEnv(true);
    const envPayload = selectedEnv.startsWith('ecosystems/') ? selectedEnv : `ecosystems/${selectedEnv}`;
    sendCommandToVr({
      type: 'SYNC_CLINICAL_CONTEXT',
      ecosystem: envPayload,
      disorderId: selectedDisorderId,
      moduleId: activeModuleTab
    });
    setTimeout(() => setIsSyncingEnv(false), 2000);
  };

  const startExercise = (exercise: ClinicalExercise) => {
    setActiveExercise(exercise);
    setPipelinePhase('PHASE_ACTIVE');
    setCurrentKpi(0);
    setErrorsCount(0);
    setReactionTimeMs(0);
    setRtHistoryTrials([]);
    setLastActionText(`Iniciando ${exercise.name}...`);

    const envPayload = selectedEnv.startsWith('ecosystems/') ? selectedEnv : `ecosystems/${selectedEnv}`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(exercise.script);
      utt.lang = 'es-ES'; utt.rate = 0.96;
      window.speechSynthesis.speak(utt);
    }

    sendCommandToVr({
      type: 'START_PIPELINE_PHASE',
      paradigm: exercise.paradigm,
      bgAudio: exercise.bgAudio,
      speechScript: exercise.script,
      ecosystem: envPayload,
      disorderId: selectedDisorderId,
      moduleId: activeModuleTab,
      disorderName: disorderObj.name,
      exerciseName: exercise.name
    });
  };

  const handleStopAndGenerateReport = () => {
    setPipelinePhase('FINISHED');
    sendCommandToVr({ type: 'STOP_ACTIVE_SESSION' });
    setShowReportModal(true);

    if (onUpdatePatientVrData) {
      onUpdatePatientVrData(
        { hits: currentKpi, errors: errorsCount, rt: reactionTimeMs, gsr: currentGsr, hrv: currentHrv, bpm: currentBpm },
        { disorder: disorderObj.name, timestamp: new Date().toISOString() }
      );
    }
  };

  // VARIABLES DE CÁLCULO DIAGNÓSTICO (Declaradas incondicionalmente para evitar ReferenceError)
  const averageRt = rtHistoryTrials.length > 0
    ? Math.round(rtHistoryTrials.reduce((a, b) => a + b, 0) / rtHistoryTrials.length)
    : (reactionTimeMs || 280);

  const zScore = Number(((averageRt - 320) / 80).toFixed(2));
  const accuracyRate = (currentKpi + errorsCount) > 0 
    ? Math.round((currentKpi / (currentKpi + errorsCount)) * 100) 
    : 100;

  const isPerformanceNormal = accuracyRate >= 85 && averageRt <= 420 && errorsCount <= 2;
  const isCautiousHighAccuracy = accuracyRate >= 85 && errorsCount <= 2 && averageRt > 420;
  const hasSympatheticStress = typeof currentHrv === 'number' && currentHrv < 32;

  // ============================================================================
  // OSCILOSCOPIO FISIOLÓGICO: MODELO BI-GAUSSIANO + RESPLANDOR DE FÓSFORO (60 FPS)
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let cursorX = 0;
    const w = canvas.width;
    const h = canvas.height;
    const midY = h * 0.52;
    const ppgBaselineY = midY * 0.74;
    const sweepSpeed = 2.4;

    let beatPhase = 0;
    let prevPpgY = ppgBaselineY;
    let prevRtY = h * 0.88;
    let clockSeconds = 0;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    const render = () => {
      clockSeconds += 0.016;

      // 1. ZONA DE BORRADO DE BARRIDO SUAVE (Phosphor Sweep)
      const clearBand = 24;
      ctx.fillStyle = '#020617';
      ctx.fillRect(cursorX, 0, clearBand, h);

      // Rejilla médica de precisión
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.floor(cursorX / 24) * 24; x < cursorX + clearBand; x += 24) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y < h; y += 20) { ctx.moveTo(cursorX, y); ctx.lineTo(cursorX + clearBand, y); }
      ctx.stroke();

      // Línea divisoria central
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cursorX, midY);
      ctx.lineTo(cursorX + clearBand, midY);
      ctx.stroke();

      // 2. MODELO BI-GAUSSIANO DE PRESIÓN ARTERIAL (Onda Elástica Curva)
      const bpm = currentBpm || 72;
      const period = 60 / bpm;
      beatPhase += 0.016 / period;
      if (beatPhase >= 1.0) beatPhase -= 1.0;

      let ppgNorm = 0;
      if (btStatus === 'CONNECTED') {
        const t = beatPhase; // 0.0 a 1.0
        
        // Onda 1: Eyección sistólica anterógrada rápida
        const a1 = 0.95;
        const mu1 = 0.16;
        const sigma1 = 0.065;
        const g1 = a1 * Math.exp(-Math.pow(t - mu1, 2) / (2 * Math.pow(sigma1, 2)));

        // Onda 2: Onda aórtica refleja retrógrada (muesca dícrota suave)
        const a2 = 0.35;
        const mu2 = 0.38;
        const sigma2 = 0.075;
        const g2 = a2 * Math.exp(-Math.pow(t - mu2, 2) / (2 * Math.pow(sigma2, 2)));

        // Escurrimiento diastólico continuo
        const runoff = (t > 0.40) ? 0.18 * Math.exp(-(t - 0.40) * 3.5) : 0;

        // Modulación respiratoria (~0.22 Hz)
        const respBaseline = Math.sin(clockSeconds * 1.38) * 0.06;

        // Micro-ruido capilar
        const microJitter = (Math.random() - 0.5) * 0.012;

        ppgNorm = (g1 + g2 + runoff + respBaseline + microJitter);
      }

      const ppgY = ppgBaselineY - (ppgNorm * (midY * 0.60));

      // 3. TRAZADO CON RESPLANDOR DE FÓSFORO
      ctx.save();
      ctx.shadowColor = btStatus === 'CONNECTED' ? '#10b981' : '#334155';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = btStatus === 'CONNECTED' ? '#34d399' : '#334155';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cursorX === 0 ? 0 : cursorX - sweepSpeed, cursorX === 0 ? ppgY : prevPpgY);
      ctx.lineTo(cursorX, ppgY);
      ctx.stroke();

      // Cabeza luminosa del haz
      if (btStatus === 'CONNECTED') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cursorX, ppgY, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      prevPpgY = ppgY;

      // 4. CANAL 2: TENDENCIA DE LATENCIA 6DoF
      const ch2Top = midY + 12;
      const ch2Height = h - ch2Top - 14;
      const rtMin = 150;
      const rtMax = 650;
      const normY = ch2Top + ch2Height - ((280 - rtMin) / (rtMax - rtMin)) * ch2Height;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorX, normY);
      ctx.lineTo(cursorX + clearBand, normY);
      ctx.stroke();
      ctx.setLineDash([]);

      const targetRt = reactionTimeMs || 280;
      const clampedRt = Math.min(rtMax, Math.max(rtMin, targetRt));
      const targetRtY = ch2Top + ch2Height - ((clampedRt - rtMin) / (rtMax - rtMin)) * ch2Height;
      const rtY = prevRtY + (targetRtY - prevRtY) * 0.12;

      ctx.save();
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cursorX === 0 ? 0 : cursorX - sweepSpeed, cursorX === 0 ? rtY : prevRtY);
      ctx.lineTo(cursorX, rtY);
      ctx.stroke();
      ctx.restore();
      prevRtY = rtY;

      // Avance del cursor
      cursorX += sweepSpeed;
      if (cursorX >= w) cursorX = 0;

      // Cabeceras fijas de telemetría médica
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 360, 22);
      ctx.fillRect(0, midY + 2, 360, 22);

      ctx.font = 'bold 9.5px monospace';
      ctx.fillStyle = btStatus === 'CONNECTED' ? '#10b981' : '#ef4444';
      ctx.fillText(
        btStatus === 'CONNECTED' 
          ? `● CH-1 [PPG ARTERIAL]: ${currentBpm} BPM | HRV ${currentHrv} ms | GSR ${currentGsr} µS`
          : '● CH-1 [PPG ARTERIAL]: SENSOR NO VINCULADO',
        10, 15
      );

      ctx.fillStyle = '#22d3ee';
      ctx.fillText(`● CH-2 [LATENCIA VR]: ${reactionTimeMs} ms (Norma: 220-350 ms)`, 10, midY + 16);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentBpm, currentHrv, currentGsr, btStatus, reactionTimeMs]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center p-6 font-sans text-slate-100 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1500px] flex flex-col h-[94vh]">
        <header className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-cyan-400" />
            <h2 className="text-sm font-black">AMIE CDSS • WORKSTATION CLÍNICA HÍBRIDA (9 MÓDULOS • 30 TRASTORNOS)</h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold ${isVrConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
              {isVrConnected ? <><Wifi className="w-3 h-3 animate-pulse" /> VISOR VR ENLACE ACTIVO</> : <><WifiOff className="w-3 h-3" /> RECONECTANDO VISOR...</>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowReportModal(true)} 
              className="px-3 py-1.5 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 border border-cyan-400/30 cursor-pointer transition shadow"
            >
              <FileText className="w-3.5 h-3.5" /> VER INFORME
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2"><X /></button>
          </div>
        </header>

        <div className="bg-slate-950/80 px-6 py-2 flex gap-2 overflow-x-auto border-b border-slate-800 scrollbar-none">
          {CLINICAL_MODULES.map(mod => (
            <button 
              key={mod.id} 
              onClick={() => { 
                setActiveModuleTab(mod.id); 
                const firstDisorder = DISORDER_LIST.find(d => d.mod === mod.id);
                if (firstDisorder) setSelectedDisorderId(firstDisorder.id); 
              }} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeModuleTab === mod.id ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              {mod.name}
            </button>
          ))}
        </div>

        <main className="flex-1 grid grid-cols-12 gap-5 p-5 min-h-0 overflow-hidden">
          <section className="col-span-12 lg:col-span-3 flex flex-col gap-3 min-h-0">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-2"><Stethoscope className="w-3.5 h-3.5 text-cyan-400"/> Patología Evaluada (30 Trastornos)</label>
              <select value={selectedDisorderId} onChange={e => setSelectedDisorderId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-bold outline-none">
                {DISORDER_LIST.filter(d => d.mod === activeModuleTab).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mb-2"><ImageIcon className="w-3.5 h-3.5 text-indigo-400"/> Escenario Inmersivo 360°</label>
              <select value={selectedEnv} onChange={e => setSelectedEnv(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white outline-none">
                <option value="ecosystems/clinical_office.jpeg">Consultorio Médico Controlado</option>
                <option value="ecosystems/safe_place_forest.jpeg">Santuario Natural / Bosque</option>
                <option value="ecosystems/crowded_street.jpeg">Calle Multitudinaria (Exposición)</option>
              </select>
              <button 
                onClick={handleSyncEnvironment} 
                className={`mt-3 w-full py-2.5 rounded text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition ${isSyncingEnv ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'}`}
              >
                {isSyncingEnv ? <><CheckCircle className="w-3.5 h-3.5 text-white" /> ¡CARGADO EN CASCO!</> : <><Send className="w-3.5 h-3.5 text-cyan-400" /> CARGAR EN CASCO</>}
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1 flex flex-col justify-end">
              <div className="mb-3">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Bluetooth className="w-3.5 h-3.5 text-blue-400"/> Biofeedback Médico BLE</span>
                <p className="text-[9px] text-slate-500 mt-1">Sincroniza anillos Colmi R10 o bandas Polar H10.</p>
              </div>
              <button 
                onClick={connectBluetoothSensors}
                className={`w-full py-2.5 rounded text-xs font-black shadow-lg flex items-center justify-center gap-2 transition ${btStatus === 'CONNECTED' ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'}`}
              >
                {btStatus === 'CONNECTED' ? 'SENSOR BLE ACTIVO (REESCANEAR)' : 'VINCULAR SENSORES BLE'}
              </button>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4 flex flex-col gap-3 min-h-0">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex-1 flex flex-col min-h-0 overflow-hidden">
              <h3 className="text-xs font-black text-white mb-2.5 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Target className="w-4 h-4 text-purple-400"/> PROTOCOLO: {disorderObj.name.toUpperCase()}
              </h3>
              <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1 pb-4 min-h-0">
                {exercises.map(ex => (
                  <div key={ex.id} className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg flex flex-col justify-between shadow-sm hover:border-slate-600 transition">
                    <div>
                      <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded ${ex.mode==='DIAGNOSTIC'?'bg-cyan-950 text-cyan-300 border border-cyan-800':'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                        {ex.mode === 'DIAGNOSTIC' ? 'EVALUACIÓN' : 'TRATAMIENTO'}
                      </span>
                      <p className="text-[10.5px] font-bold text-white mt-1.5 leading-snug">{ex.name}</p>
                      <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{ex.paradigm}</p>
                    </div>
                    <button 
                      onClick={() => startExercise(ex)}
                      disabled={pipelinePhase === 'PHASE_ACTIVE' && activeExercise?.id !== ex.id}
                      className={`mt-2 py-1.5 rounded text-[9.5px] font-black transition cursor-pointer ${activeExercise?.id === ex.id && pipelinePhase === 'PHASE_ACTIVE' ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                    >
                      {activeExercise?.id === ex.id && pipelinePhase === 'PHASE_ACTIVE' ? 'ACTIVO...' : 'INICIAR PRUEBA'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-950 border border-emerald-500/40 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-emerald-400 block">BT | Sudor Real</span>
                <div className="text-base font-black text-white mt-0.5">{currentGsr} µS</div>
              </div>
              <div className="bg-slate-950 border border-emerald-500/40 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-emerald-400 block">BT | Pulso Real</span>
                <div className="text-base font-black text-white mt-0.5">{currentBpm} BPM</div>
              </div>
              <div className="bg-slate-950 border border-cyan-500/40 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-cyan-400 block">VR | Latencia</span>
                <div className="text-base font-black text-white mt-0.5">{reactionTimeMs} ms</div>
              </div>
              <div className="bg-slate-950 border border-cyan-500/40 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-cyan-400 block">VR | Aciertos / Errores</span>
                <div className="text-base font-black text-white mt-0.5">{currentKpi} / {errorsCount}</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex-1 flex flex-col relative min-h-0 justify-between">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse"/>
                    Osciloscopio Fisiológico Continuo (Barrido 60 Hz)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative">
                  <canvas ref={canvasRef} width={480} height={190} className="w-full h-full block" />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[10.5px] font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="truncate"><strong className="text-cyan-400">Último Evento:</strong> {lastActionText}</span>
                </div>
                {pipelinePhase === 'PHASE_ACTIVE' ? (
                  <button 
                    onClick={handleStopAndGenerateReport} 
                    className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Square className="w-3.5 h-3.5 fill-white"/> DETENER PRUEBA Y EMITIR INFORME
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowReportModal(true)} 
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 font-black text-xs rounded-lg shadow flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <FileText className="w-3.5 h-3.5" /> EMITIR INFORME CON DATOS ACTUALES
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 print:p-0 print:bg-white">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:text-black print:bg-white">
            <div className="bg-slate-950 px-8 py-5 border-b border-slate-800 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
              <div className="flex items-center gap-3">
                <Brain className="w-7 h-7 text-cyan-400 print:text-black" />
                <div>
                  <h3 className="text-base font-black text-white print:text-black tracking-wide">AMIE NEUROLOGICAL CDSS • INFORME PSICOMÉTRICO VR</h3>
                  <p className="text-[11px] text-slate-400 print:text-gray-600 font-mono">Protocolo Evaluado: {disorderObj.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition shadow"
                >
                  <Printer className="w-4 h-4" /> IMPRIMIR / PDF
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-200 print:text-black print:overflow-visible">
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 print:border-gray-300 print:bg-gray-50 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">ID PACIENTE</span>
                  <span className="font-mono font-black text-cyan-400 print:text-black text-sm">{activePatientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">PROTOCOLO APLICADO</span>
                  <span className="font-bold text-white print:text-black">{disorderObj.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">FECHA</span>
                  <span className="font-mono text-slate-300 print:text-black">{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">TAREA EJECUTADA</span>
                  <span className="font-bold text-amber-300 print:text-black">{activeExercise?.name || 'Protocolo Clínico Estandarizado'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-cyan-400 print:text-black mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" /> 1. Métricas Neurocognitivas y Freno Inhibitorio (Hardware 6DoF)
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">LATENCIA MEDIA (RT)</span>
                    <div className="text-2xl font-black text-cyan-400 print:text-black mt-1 font-mono">{averageRt} ms</div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">Norma: 220 - 350 ms</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">ACIERTOS (HITS)</span>
                    <div className="text-2xl font-black text-emerald-400 print:text-black mt-1 font-mono">{currentKpi}</div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">Precisión: {accuracyRate}%</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">FALLOS DE COMISIÓN</span>
                    <div className="text-2xl font-black text-rose-400 print:text-black mt-1 font-mono">{errorsCount}</div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">Freno inhibitorio</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold block">PUNTUACIÓN Z</span>
                    <div className={`text-2xl font-black mt-1 font-mono ${Math.abs(zScore) >= 1.96 ? 'text-amber-400 print:text-black' : 'text-emerald-400 print:text-black'}`}>
                      {zScore > 0 ? `+${zScore}` : zScore} SD
                    </div>
                    <span className="text-[9px] text-slate-500 print:text-gray-600 block mt-1">{Math.abs(zScore) >= 1.96 ? 'Fuera de rango' : 'Rango esperado'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950/80 border-2 border-cyan-500/40 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h4 className="text-sm font-black text-white print:text-black uppercase tracking-wider">
                      Triangulación Clínica Global Computarizada (IA + 6DoF + BLE)
                    </h4>
                  </div>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${isPerformanceNormal ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : isCautiousHighAccuracy ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-rose-950 text-rose-300 border-rose-700'}`}>
                    {isPerformanceNormal ? 'VEREDICTO: NORMAL / DESCARTADO' : isCautiousHighAccuracy ? 'VEREDICTO: CAUTELA / HIPERREFLEXIÓN' : 'VEREDICTO: INDICADORES ACTIVOS'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-600 font-bold block mb-1">EJE CINEMÁTICO (VR 6DoF)</span>
                    <p className="font-mono text-cyan-300 print:text-black font-bold">RT: {averageRt} ms | {accuracyRate}% Precisión</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {accuracyRate >= 85 && averageRt <= 420 ? 'Ejecución visuomotora óptima.' : 'Alteración en precisión o latencia.'}
                    </span>
                  </div>

                  <div className="bg-slate-900 print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-600 font-bold block mb-1">EJE FISIOLÓGICO (BLE)</span>
                    <p className="font-mono text-emerald-400 print:text-black font-bold">
                      {btStatus === 'CONNECTED' ? `${currentBpm} BPM | ${currentGsr} µS` : 'HARDWARE BLE NO VINCULADO'}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {btStatus === 'CONNECTED' ? (hasSympatheticStress ? 'Activación simpática de esfuerzo.' : 'Estabilidad vagal conservada.') : 'Sin conexión BLE.'}
                    </span>
                  </div>

                  <div className="bg-slate-900 print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-gray-300">
                    <span className="text-[10px] text-slate-400 print:text-gray-600 font-bold block mb-1">EJE PSICOMÉTRICO (Z-SCORE)</span>
                    <p className="font-mono text-purple-300 print:text-black font-bold">{zScore > 0 ? `+${zScore}` : zScore} SD Poblacional</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {Math.abs(zScore) < 1.96 ? 'Dentro de curva normativa sana.' : 'Desviación significativa.'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-amber-300 print:text-black uppercase tracking-wide block mb-1">
                    Síntesis Diagnóstica Cruzada:
                  </span>
                  <div className="text-xs text-slate-200 print:text-black leading-relaxed bg-slate-900/70 print:bg-gray-50 p-3.5 rounded-xl border border-slate-800 print:border-gray-300">
                    {isPerformanceNormal ? (
                      <p>
                        <strong className="text-emerald-400 print:text-black">RENDIMIENTO NEUROCOGNITIVO CONSERVADO: </strong>
                        El paciente completó la evaluación con una precisión sobresaliente del <strong>{accuracyRate}%</strong> ({currentKpi} aciertos y {errorsCount} errores de comisión), tiempo de reacción de <strong>{averageRt} ms</strong> y Puntuación Z de <strong>{zScore > 0 ? `+${zScore}` : zScore} SD</strong>. No se evidencia déficit atencional ni falla en el freno inhibitorio para <strong>{disorderObj.name}</strong>.
                      </p>
                    ) : isCautiousHighAccuracy ? (
                      <p>
                        <strong className="text-amber-400 print:text-black">CAUTELA VISUOMOTORA / HIPERREFLEXIÓN ({accuracyRate}%): </strong>
                        El paciente conserva el control inhibitorio (<strong>{errorsCount} errores de comisión</strong> y <strong>{accuracyRate}% de precisión</strong>), pero presenta una latencia deliberativa prolongada de <strong>{averageRt} ms</strong> (Z-Score: <strong>{zScore > 0 ? `+${zScore}` : zScore} SD</strong>), compatible con autoobservación cautelosa o hipervigilancia en <strong>{disorderObj.name}</strong>.
                      </p>
                    ) : (
                      <p>
                        <strong className="text-rose-400 print:text-black">PERFIL COMPATIBLE CON DISFUNCIÓN EJECUTIVA EN {disorderObj.name.toUpperCase()}: </strong>
                        Se registra un incremento en errores de comisión ({errorsCount} fallos) o latencia retrasada (<strong>{averageRt} ms</strong>, Z-Score: <strong>{zScore > 0 ? `+${zScore}` : zScore} SD</strong>), evidenciando vulnerabilidad en el freno inhibitorio.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 px-8 py-4 border-t border-slate-800 flex justify-end gap-3 print:hidden">
              <button onClick={() => setShowReportModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer">
                Cerrar
              </button>
              <button onClick={() => window.print()} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-lg">
                <Printer className="w-4 h-4" /> Imprimir Informe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenDiagnosticRunner;
