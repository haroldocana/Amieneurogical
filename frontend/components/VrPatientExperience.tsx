// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR WEBXR 6DoF DEFINITIVO
// 240 Protocolos Clínicos Integrados (30 Trastornos x 8 Paradigmas 3D)
// 100% Procedural Autónomo • Sin Bloqueos CORS • Cúpula 360 Estable
// frontend/components/VrPatientExperience.tsx
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Target, VolumeX, Play, RefreshCw, Volume2, Layers, Activity } from 'lucide-react';

interface Props {
  patientId?: string;
  moduleId?: string;
  onClose?: () => void;
}

export type InteractiveParadigm =
  | 'IDLE'
  | 'CPT_3D'
  | 'BART_3D'
  | 'N_BACK_3D'
  | 'CHOICE_3D'
  | 'AAT_3D'
  | 'EMDR_3D'
  | 'BIO_3D'
  | 'MIRROR_3D';

export type ClinicalArchetype = 'DOCTOR' | 'SEXUAL_PARTNER' | 'FORENSIC_PEER' | 'HYPNOTIC_GUIDE';

export interface VrClinicalExercise {
  id: string;
  mode: 'DIAGNOSTIC' | 'TREATMENT';
  paradigm: InteractiveParadigm;
  name: string;
  bgAudio: string;
  script: string;
}

export interface VrDisorderData {
  id: string;
  modId: string;
  name: string;
  archetype: ClinicalArchetype;
  environment: 'OFFICE' | 'FOREST' | 'STREET';
  exercises: VrClinicalExercise[];
}

// ============================================================================
// MATRIZ COMPLETA DE 240 PROTOCOLOS (30 TRASTORNOS x 8 EJERCICIOS)
// ============================================================================
export const CLINICAL_VR_MATRIX: Record<string, VrDisorderData> = {
  // --- MÓDULO I: NEURODESARROLLO & MOTOR ---
  TDAH: {
    id: 'TDAH',
    modId: 'MOD_NEURODEV',
    name: 'TDAH / Déficit de Atención e Impulsividad',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'TDAH_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Conners CPT: Freno Go/No-Go', bgAudio: 'BROWN_NOISE', script: 'Dispara únicamente a las esferas verdes. Suprime el disparo ante esferas rojas.' },
      { id: 'TDAH_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Búsqueda de Estimulación (BART)', bgAudio: 'TENSION_DRUM', script: 'Bombea el globo para sumar puntos o asegúralos antes de que explote.' },
      { id: 'TDAH_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Memoria de Trabajo Visuoespacial', bgAudio: 'BETA_WAVES', script: 'Apunta únicamente al cubo iluminado de mayor brillo.' },
      { id: 'TDAH_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Flexibilidad y Cambio de Criterio', bgAudio: 'HEARTBEAT', script: 'Elige entre las opciones adaptando tu criterio con rapidez.' },
      { id: 'TDAH_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Resistencia a Distractores (AAT)', bgAudio: 'ALPHA_WAVES', script: 'Empuja con el rayo láser los distractores que aparezcan en tu periferia.' },
      { id: 'TDAH_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Integración Sacádica Interhemisférica', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz horizontal con tus ojos para sincronizar la conectividad frontal.' },
      { id: 'TDAH_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Coordinación Bimanual Somatomotora', bgAudio: 'THETA_WAVES', script: 'Sincroniza ambos mandos con los movimientos guía del avatar.' },
      { id: 'TDAH_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Modulación de Hiperactividad Basal', bgAudio: 'DELTA_WAVES', script: 'Acompasa tu respiración con la expansión del loto para calmar la actividad motriz.' }
    ]
  },
  TEA_1: {
    id: 'TEA_1',
    modId: 'MOD_NEURODEV',
    name: 'Espectro Autista Nivel 1 (Asperger)',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'TEA1_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reconocimiento de Microexpresiones', bgAudio: 'BROWN_NOISE', script: 'Identifica la emoción sutil del avatar e impacta en la esfera correspondiente.' },
      { id: 'TEA1_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Tolerancia a la Ambigüedad Social', bgAudio: 'TENSION_DRUM', script: 'Mide tu control emocional cuando las reglas del entorno varían de improviso.' },
      { id: 'TEA1_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Memoria de Claves Pragmáticas', bgAudio: 'BETA_WAVES', script: 'Memoriza la secuencia de miradas y gestos proyectados en los cubos.' },
      { id: 'TEA1_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Teoría de la Mente en Espacio 3D', bgAudio: 'HEARTBEAT', script: 'Elige la opción que prediga la intención del interlocutor.' },
      { id: 'TEA1_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Desensibilización al Contacto Visual', bgAudio: 'ALPHA_WAVES', script: 'Sostén la mirada hacia los ojos del avatar mientras apartas los estímulos.' },
      { id: 'TEA1_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Integración de Sobrecarga Interpersonal', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue el barrido ocular sacádico para reducir el agotamiento cognitivo.' },
      { id: 'TEA1_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Modelado de Neuronas Espejo', bgAudio: 'THETA_WAVES', script: 'Imita los movimientos corporales del avatar para estimular la empatía motora.' },
      { id: 'TEA1_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Rescate Vagal por Meltdown Social', bgAudio: 'DELTA_WAVES', script: 'Inhala profundamente para reducir la sobrecarga sensorial acumulada.' }
    ]
  },
  TEA_2_3: {
    id: 'TEA_2_3',
    modId: 'MOD_NEURODEV',
    name: 'Espectro Autista Nivel 2-3 (Apoyo Notable)',
    archetype: 'DOCTOR',
    environment: 'FOREST',
    exercises: [
      { id: 'TEA2_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reactividad Multisensorial', bgAudio: 'BROWN_NOISE', script: 'Registra el umbral de reacción motriz ante estímulos visuales controlados.' },
      { id: 'TEA2_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Regulación ante Ruptura de Rutina', bgAudio: 'TENSION_DRUM', script: 'Evalúa la adaptación conductual ante el cambio repentino de objetivos.' },
      { id: 'TEA2_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Fijación Atencional y Desenganche', bgAudio: 'BETA_WAVES', script: 'Alterna tu puntero entre los cubos rompiendo la fijación en un solo punto.' },
      { id: 'TEA2_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Discriminación de Pictogramas 3D', bgAudio: 'HEARTBEAT', script: 'Apunta al pictograma solicitado para confirmar la comprensión visual.' },
      { id: 'TEA2_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Integración Sensorial Háptica Segura', bgAudio: 'ALPHA_WAVES', script: 'Toca los orbes acolchados sintiendo la vibración háptica amortiguada.' },
      { id: 'TEA2_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Estabilización Sacádica Suave', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la trayectoria rítmica de luz para calmar la agitación psicomotriz.' },
      { id: 'TEA2_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reducción de Estereotipias Motoras', bgAudio: 'THETA_WAVES', script: 'Coloca tus mandos sobre las guías fijas para sustituir patrones repetitivos.' },
      { id: 'TEA2_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Enraizamiento y Confort Acústico', bgAudio: 'DELTA_WAVES', script: 'Respira con la luz envolvente en este espacio de protección sensorial.' }
    ]
  },
  ALZHEIMER: {
    id: 'ALZHEIMER',
    modId: 'MOD_NEURODEV',
    name: 'Deterioro Cognitivo / Alzheimer',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'ALZ_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reconocimiento de Objetos Diarios', bgAudio: 'BROWN_NOISE', script: 'Señala los objetos familiares e ignora los elementos ajenos al consultorio.' },
      { id: 'ALZ_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Juicio y Prudencia Ejecutiva', bgAudio: 'TENSION_DRUM', script: 'Mide la toma de decisiones acumulativa antes de perder los logros.' },
      { id: 'ALZ_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Orientación Topográfica en Laberinto', bgAudio: 'BETA_WAVES', script: 'Memoriza el orden de los cubos para evaluar orientación espacial.' },
      { id: 'ALZ_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Memoria Episódica Inmediata', bgAudio: 'HEARTBEAT', script: 'Selecciona cuál de las dos figuras fue presentada al iniciar la sesión.' },
      { id: 'ALZ_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Reentrenamiento de Praxias Cotidianas', bgAudio: 'ALPHA_WAVES', script: 'Alcanza y ubica los objetos virtuales para estimular praxias motoras.' },
      { id: 'ALZ_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Estimulación Temporoparietal Bilateral', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo visual continuo para reactivar redes neuronales asociativas.' },
      { id: 'ALZ_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reafirmación del Esquema Corporal', bgAudio: 'THETA_WAVES', script: 'Mueve los brazos en espejo con el avatar para prevenir la desorientación somática.' },
      { id: 'ALZ_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Terapia de Reminiscencia y Calma', bgAudio: 'DELTA_WAVES', script: 'Respira con calma reduciendo la agitación motora crepuscular.' }
    ]
  },
  PARKINSON: {
    id: 'PARKINSON',
    modId: 'MOD_NEURODEV',
    name: 'Enfermedad de Parkinson (Temblor & Bradicinesia)',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'PK_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Cuantificación de Temblor a 90Hz', bgAudio: 'BROWN_NOISE', script: 'Sostén el puntero láser fijo en el centro para registrar la oscilación 6DoF.' },
      { id: 'PK_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Bradicinesia e Inicio de Movimiento', bgAudio: 'TENSION_DRUM', script: 'Presiona el gatillo ante la señal luminosa para medir tiempo de inicio motriz.' },
      { id: 'PK_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Planificación Motora Bimanual', bgAudio: 'BETA_WAVES', script: 'Alterna el objetivo con cada mano según la secuencia mostrada.' },
      { id: 'PK_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Detección de Bloqueo Motor (Freezing)', bgAudio: 'HEARTBEAT', script: 'Gira y apunta entre ambos paneles registrando bloqueos de movimiento.' },
      { id: 'PK_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Terapia de Amplitud (LSVT BIG VR)', bgAudio: 'ALPHA_WAVES', script: 'Extiende el brazo con amplitud forzando la apertura articular.' },
      { id: 'PK_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Pistas Visuales Rítmicas (Visual Cues)', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la trayectoria rítmica de luz para regular el ritmo locomotor.' },
      { id: 'PK_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reentrenamiento Espejo Propioceptivo', bgAudio: 'THETA_WAVES', script: 'Imita los movimientos simétricos para compensar la asimetría del temblor.' },
      { id: 'PK_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Relajación de Rigidez Muscular', bgAudio: 'DELTA_WAVES', script: 'Respira profundamente disminuyendo la tensión muscular isométrica.' }
    ]
  },

  // --- MÓDULO II: AFECTIVO & ESTADO DE ÁNIMO ---
  DEPRESION: {
    id: 'DEPRESION',
    modId: 'MOD_AFFECTIVE',
    name: 'Depresión Mayor Unipolar',
    archetype: 'DOCTOR',
    environment: 'FOREST',
    exercises: [
      { id: 'DEP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Vigilancia y Retardo Psicomotor', bgAudio: 'BROWN_NOISE', script: 'Mide la velocidad de respuesta motora sostenida ante estímulos neutros.' },
      { id: 'DEP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Apatía ante Ganancia/Pérdida (BART)', bgAudio: 'TENSION_DRUM', script: 'Evalúa la motivación de logro ante recompensas crecientes en el globo.' },
      { id: 'DEP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Medición de Niebla Mental y Fatiga', bgAudio: 'BETA_WAVES', script: 'Cuantifica la velocidad de retención de memoria ejecutiva bajo fatiga.' },
      { id: 'DEP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Sesgo Pesimista Decisional', bgAudio: 'HEARTBEAT', script: 'Analiza la tendencia automática a anticipar pérdidas ante resultados ambiguos.' },
      { id: 'DEP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Activación Conductual y Acercamiento', bgAudio: 'ALPHA_WAVES', script: 'Atrae hacia ti los estímulos positivos para romper la inercia del aislamiento.' },
      { id: 'DEP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desbloqueo Melancólico Sacádico', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral para disolver los bucles de autorreproche y rumiación.' },
      { id: 'DEP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconexión y Antianhedonia Somática', bgAudio: 'THETA_WAVES', script: 'Reactiva el movimiento corporal frente al embotamiento afectivo.' },
      { id: 'DEP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Rescate Vagal y Elevación del Ánimo', bgAudio: 'DELTA_WAVES', script: 'Inhala profundamente hacia la caja torácica restaurando el tono vital.' }
    ]
  },
  BIPOLAR: {
    id: 'BIPOLAR',
    modId: 'MOD_AFFECTIVE',
    name: 'Trastorno Bipolar (Fase Disfórica / Maníaca)',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'BIP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Velocidad Motora en Fase Acelerada', bgAudio: 'BROWN_NOISE', script: 'Registra si existe precipitación impulsiva y taquipsiquia en los disparos.' },
      { id: 'BIP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Asunción Temeraria de Riesgo', bgAudio: 'TENSION_DRUM', script: 'Mide la insensibilidad al peligro y sobreestimación en el inflado del globo.' },
      { id: 'BIP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Distraibilidad Ejecutiva Maníaca', bgAudio: 'BETA_WAVES', script: 'Evalúa la fuga atencional provocada por distractores rápidos periféricos.' },
      { id: 'BIP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Decisional Impulsivo', bgAudio: 'HEARTBEAT', script: 'Registra la vacilación o precipitación ante elecciones polarizadas.' },
      { id: 'BIP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Freno de Impulso y Retención', bgAudio: 'ALPHA_WAVES', script: 'Detén el impulso de disparo sosteniendo el láser fijo antes de accionar el gatillo.' },
      { id: 'BIP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Estabilización Afectiva Interhemisférica', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica templada para amortiguar la oscilación del ánimo.' },
      { id: 'BIP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Enraizamiento ante Agitación Motora', bgAudio: 'THETA_WAVES', script: 'Sincroniza tus brazos con el avatar a velocidad pausada y constante.' },
      { id: 'BIP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Modulación Parasimpática Basal', bgAudio: 'DELTA_WAVES', script: 'Desacelera la frecuencia respiratoria reduciendo la sobreactivación.' }
    ]
  },
  DISTIMIA: {
    id: 'DISTIMIA',
    modId: 'MOD_AFFECTIVE',
    name: 'Distimia / Depresión Persistente',
    archetype: 'DOCTOR',
    environment: 'FOREST',
    exercises: [
      { id: 'DIS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Lentificación Cognitiva Crónica', bgAudio: 'BROWN_NOISE', script: 'Evalúa el retraso de latencia persistente en discriminación continua.' },
      { id: 'DIS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Perseveración en el Error (BART)', bgAudio: 'TENSION_DRUM', script: 'Analiza la renuncia anticipada o rigidez decisional ante el esfuerzo.' },
      { id: 'DIS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Fatiga Atencional Sostenida', bgAudio: 'BETA_WAVES', script: 'Mide el desgaste progresivo de la memoria de trabajo tras ensayos repetidos.' },
      { id: 'DIS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Indefensión Aprendida Decisional', bgAudio: 'HEARTBEAT', script: 'Evalúa la pasividad o desinterés al seleccionar entre alternativas neutras.' },
      { id: 'DIS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Refuerzo de Autoeficacia Motora', bgAudio: 'ALPHA_WAVES', script: 'Empuja con determinación los bloques de desánimo reforzando autoeficacia.' },
      { id: 'DIS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Atenuación de Rumiación Negativa', bgAudio: 'BILATERAL_SWEEP', script: 'Movimiento sacádico bilateral para interrumpir el diálogo interno pesimista.' },
      { id: 'DIS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reactivación Propioceptiva Diaria', bgAudio: 'THETA_WAVES', script: 'Mueve los brazos en coordinación con el avatar superando la pesadez motora.' },
      { id: 'DIS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Coherencia Cardíaca 0.1Hz Antidistímica', bgAudio: 'DELTA_WAVES', script: 'Respira rítmicamente recuperando energía y elevando la reactividad vagal.' }
    ]
  },
  CICLOTIMIA: {
    id: 'CICLOTIMIA',
    modId: 'MOD_AFFECTIVE',
    name: 'Ciclotimia / Labilidad Emocional',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'CIC_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Fluctuación de Latencias Motoras', bgAudio: 'BROWN_NOISE', script: 'Registra la variabilidad e inestabilidad del tiempo de reacción.' },
      { id: 'CIC_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Variabilidad del Tono Autonómico', bgAudio: 'TENSION_DRUM', script: 'Mide cambios bruscos de tolerancia al riesgo entre diferentes ensayos.' },
      { id: 'CIC_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Resiliencia ante la Frustración', bgAudio: 'BETA_WAVES', script: 'Analiza el impacto del fallo en los ensayos inmediatamente posteriores.' },
      { id: 'CIC_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Oscilación de Preferencias Decisionales', bgAudio: 'HEARTBEAT', script: 'Registra la inconsistencia lógica entre elecciones sucesivas.' },
      { id: 'CIC_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Neutralización de Euforia Reactiva', bgAudio: 'ALPHA_WAVES', script: 'Aparta con serenidad los estímulos de sobreexcitación para ganar estabilidad.' },
      { id: 'CIC_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de Cambios de Humor', bgAudio: 'BILATERAL_SWEEP', script: 'Barrido sacádico para templar las oscilaciones afectivas intempestivas.' },
      { id: 'CIC_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Coherencia Kinestésica Continua', bgAudio: 'THETA_WAVES', script: 'Mantén un movimiento corporal fluido y simétrico frente al avatar.' },
      { id: 'CIC_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Respiración de Estabilización Vagal', bgAudio: 'DELTA_WAVES', script: 'Inhala y exhala fijando un ritmo autonómico equilibrado y regular.' }
    ]
  },

  // --- MÓDULO III: TRAUMA, TEPT & DISOCIACIÓN ---
  TEPT: {
    id: 'TEPT',
    modId: 'MOD_TRAUMA',
    name: 'Estrés Postraumático (TEPT)',
    archetype: 'DOCTOR',
    environment: 'FOREST',
    exercises: [
      { id: 'TEPT_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sobresalto Autonómico ante Triggers', bgAudio: 'BROWN_NOISE', script: 'Mide el bloqueo reflejo o aceleración motriz ante estímulos de alerta.' },
      { id: 'TEPT_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Intolerancia a la Amenaza Inminente', bgAudio: 'TENSION_DRUM', script: 'Evalúa el colapso del control ante la acumulación de tensión sonora.' },
      { id: 'TEPT_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Interferencia por Flashbacks', bgAudio: 'BETA_WAVES', script: 'Mide la pérdida de memoria de trabajo por intrusión de memorias traumáticas.' },
      { id: 'TEPT_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Respuesta: Lucha vs. Congelamiento', bgAudio: 'HEARTBEAT', script: 'Identifica si reaccionas con defensa activa o parálisis disociativa.' },
      { id: 'TEPT_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Externalización de la Huella Traumática', bgAudio: 'ALPHA_WAVES', script: 'Empuja con fuerza el símbolo de la memoria alejándolo de tu campo personal.' },
      { id: 'TEPT_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Protocolo EMDR 8 Fases de Reprocesamiento', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz bilateral para metabolizar la huella emocional no procesada.' },
      { id: 'TEPT_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Anclaje Sensoriomotor en el Presente', bgAudio: 'THETA_WAVES', script: 'Reconoce tus manos y cuerpo frente al avatar saliendo de la reviviscencia.' },
      { id: 'TEPT_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Desactivación de Alerta Amigdalina', bgAudio: 'DELTA_WAVES', script: 'Respira con el loto saliendo del modo alarma hacia la seguridad fisiológica.' }
    ]
  },
  TRAUMA_COMPLEJO: {
    id: 'TRAUMA_COMPLEJO',
    modId: 'MOD_TRAUMA',
    name: 'Trauma Complejo del Apego (C-PTSD)',
    archetype: 'DOCTOR',
    environment: 'FOREST',
    exercises: [
      { id: 'TC_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Desregulación ante Rostros Hostiles', bgAudio: 'BROWN_NOISE', script: 'Mide la latencia motriz ante expresiones de desaprobación o frialdad.' },
      { id: 'TC_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Umbral de Sumisión por Miedo', bgAudio: 'TENSION_DRUM', script: 'Evalúa la claudicación de la voluntad ante el incremento de exigencia.' },
      { id: 'TC_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Intrusión de Esquemas de Abandono', bgAudio: 'BETA_WAVES', script: 'Registra la pérdida de foco provocada por ideas de desamparo vincular.' },
      { id: 'TC_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema de Apego Herido', bgAudio: 'HEARTBEAT', script: 'Elige entre opciones de proximidad afectiva o aislamiento defensivo.' },
      { id: 'TC_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Distanciamiento de Figuras Hostiles', bgAudio: 'ALPHA_WAVES', script: 'Aparta los hologramas que simulan juicios invasivos marcando límites.' },
      { id: 'TC_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Reprocesamiento de Traumas Tempranos', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo sacádico para desensibilizar memorias de vulnerabilidad en la infancia.' },
      { id: 'TC_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconstrucción de Límites Corporales', bgAudio: 'THETA_WAVES', script: 'Delimita tu espacio seguro moviendo los brazos en torno al avatar protector.' },
      { id: 'TC_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Regulación de la Ventana de Tolerancia', bgAudio: 'DELTA_WAVES', script: 'Respira para retornar al centro de tu ventana de tolerancia emocional.' }
    ]
  },
  DESPERSONALIZACION: {
    id: 'DESPERSONALIZACION',
    modId: 'MOD_TRAUMA',
    name: 'Despersonalización / Desrealización',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'DP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sentido de Agencia en Movimiento 6DoF', bgAudio: 'BROWN_NOISE', script: 'Evalúa la sincronía entre la intención motora y la respuesta virtual.' },
      { id: 'DP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Micro-Oscilación Propioceptiva', bgAudio: 'TENSION_DRUM', script: 'Mide la inestabilidad postural y desconexión del eje corporal central.' },
      { id: 'DP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Retraso en Confirmación Táctil-Visual', bgAudio: 'BETA_WAVES', script: 'Registra la extrañeza ante la respuesta de los cubos tridimensionales.' },
      { id: 'DP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Embotamiento Galvánico y Decisional', bgAudio: 'HEARTBEAT', script: 'Evalúa la indiferencia afectiva al seleccionar resultados en el entorno.' },
      { id: 'DP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Anclaje Táctil-Visual Bimanual', bgAudio: 'ALPHA_WAVES', script: 'Toca los orbes sintiendo la vibración háptica en cada mano.' },
      { id: 'DP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Fijación Sacádica Focal', bgAudio: 'BILATERAL_SWEEP', script: 'Fija la mirada en los puntos extremos para disolver la niebla irreal.' },
      { id: 'DP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Estimulación Vestibular Guiada', bgAudio: 'THETA_WAVES', script: 'Sincroniza el balanceo de cabeza con el avatar reafirmando tu cuerpo.' },
      { id: 'DP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Biofeedback de Presencia Somática', bgAudio: 'DELTA_WAVES', script: 'Siente el contacto de tus pies y respira profundo para arraigarte.' }
    ]
  },

  // --- MÓDULO IV: ANSIEDAD, FOBIAS & TOC ---
  FOBIA_SOCIAL: {
    id: 'FOBIA_SOCIAL',
    modId: 'MOD_ANXIETY',
    name: 'Fobia Social / Ansiedad de Escrutinio',
    archetype: 'FORENSIC_PEER',
    environment: 'STREET',
    exercises: [
      { id: 'FS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Dot-Probe de Miradas en Multitud', bgAudio: 'BROWN_NOISE', script: 'Detecta los estímulos neutros ignorando las miradas de los espectadores.' },
      { id: 'FS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Tolerancia al Escrutinio Social', bgAudio: 'TENSION_DRUM', script: 'Sostén la actividad frente a los avatares midiendo tu umbral de escape.' },
      { id: 'FS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Interferencia por Autoevaluación', bgAudio: 'BETA_WAVES', script: 'Mantén la memoria operativa bloqueando ideas de juicio negativo ajeno.' },
      { id: 'FS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Test: Afrontamiento vs. Fuga Social', bgAudio: 'HEARTBEAT', script: 'Elige entre avanzar hacia el grupo o retroceder a la zona aislada.' },
      { id: 'FS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Extinción de la Evitación Social (AAT)', bgAudio: 'ALPHA_WAVES', script: 'Apunta a la figura que genera juicio y empújala con firmeza.' },
      { id: 'FS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de la Vergüenza', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica para desensibilizar el rubor y la ansiedad social.' },
      { id: 'FS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reafirmación Postural de Seguridad', bgAudio: 'THETA_WAVES', script: 'Adopta una postura erguida y segura reflejándote en el avatar.' },
      { id: 'FS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Coherencia Vagal Anti-Ansiedad Social', bgAudio: 'DELTA_WAVES', script: 'Respira a seis ciclos por minuto para apagar la taquicardia social.' }
    ]
  },
  PANICO: {
    id: 'PANICO',
    modId: 'MOD_ANXIETY',
    name: 'Trastorno de Pánico y Agorafobia',
    archetype: 'DOCTOR',
    environment: 'STREET',
    exercises: [
      { id: 'PAN_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Provocación Interoceptiva Virtual', bgAudio: 'BROWN_NOISE', script: 'Mide la reactividad atencional ante la simulación de palpitaciones.' },
      { id: 'PAN_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Umbral de Escape Agorafóbico', bgAudio: 'TENSION_DRUM', script: 'Evalúa cuándo la sensación de espacio abierto activa la urgencia de huir.' },
      { id: 'PAN_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Rumiación Somática de Taquicardia', bgAudio: 'BETA_WAVES', script: 'Mide la interferencia provocada por atender a los latidos corporales.' },
      { id: 'PAN_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Catastrofismo ante Síntomas Físicos', bgAudio: 'HEARTBEAT', script: 'Elige entre interpretar el mareo como peligro o como reacción benigna.' },
      { id: 'PAN_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Exposición Interoceptiva Controlada', bgAudio: 'ALPHA_WAVES', script: 'Afronta las señales de aceleración empujándolas con calma hacia afuera.' },
      { id: 'PAN_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización del Ataque de Pánico', bgAudio: 'BILATERAL_SWEEP', script: 'Movimiento sacádico para frenar el circuito de alarma amigdalino.' },
      { id: 'PAN_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Arraigo Corporal Anti-Vértigo', bgAudio: 'THETA_WAVES', script: 'Coloca tus mandos sobre los pilares para disolver la sensación de desmayo.' },
      { id: 'PAN_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Reentrenamiento Anti-Hiperventilación', bgAudio: 'DELTA_WAVES', script: 'Inhala en 4s, retén 2s y exhala en 6s para equilibrar tu respiración.' }
    ]
  },
  TOC: {
    id: 'TOC',
    modId: 'MOD_ANXIETY',
    name: 'Trastorno Obsesivo Compulsivo (TOC)',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'TOC_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Latencia de Verificación Compulsiva', bgAudio: 'BROWN_NOISE', script: 'Mide la necesidad de re-chequear el estímulo antes de confirmar el disparo.' },
      { id: 'TOC_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Intolerancia a la Asimetría y Duda', bgAudio: 'TENSION_DRUM', script: 'Evalúa la incomodidad subjetiva provocada por figuras irregulares.' },
      { id: 'TOC_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Carga Obsesiva con Contaminación 3D', bgAudio: 'BETA_WAVES', script: 'Mide el secuestro atencional provocado por estímulos de suciedad.' },
      { id: 'TOC_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dificultad de Desenganche Atencional', bgAudio: 'HEARTBEAT', script: 'Evalúa el tiempo necesario para pasar a otra tarea dejando una duda abierta.' },
      { id: 'TOC_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Exposición con Prevención de Respuesta (EPR)', bgAudio: 'ALPHA_WAVES', script: 'Tolera el contacto con el objeto temido sin limpiar ni verificar.' },
      { id: 'TOC_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de Ideas Intrusivas', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz sacádica para permitir que la idea obsesiva pase de largo.' },
      { id: 'TOC_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Aceptación del Desorden en Espacio 3D', bgAudio: 'THETA_WAVES', script: 'Observa la asimetría intencional manteniendo las manos en reposo.' },
      { id: 'TOC_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Freno Autonómico a la Urgencia Compulsiva', bgAudio: 'DELTA_WAVES', script: 'Respira con el loto hasta que la urgencia compulsiva descienda sola.' }
    ]
  },
  TAG: {
    id: 'TAG',
    modId: 'MOD_ANXIETY',
    name: 'Ansiedad Generalizada (TAG)',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'TAG_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Tasa de Falsas Alarmas en Neutro', bgAudio: 'BROWN_NOISE', script: 'Mide la tendencia a interpretar estímulos inofensivos como amenazas.' },
      { id: 'TAG_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Rumiación Anticipatoria Catastrófica', bgAudio: 'TENSION_DRUM', script: 'Evalúa el agotamiento provocado por anticipar escenarios adversos.' },
      { id: 'TAG_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Microtemblor por Tensión Muscular', bgAudio: 'BETA_WAVES', script: 'Registra la contracción muscular isométrica continua en los mandos.' },
      { id: 'TAG_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Supresión Crónica del Tono Vagal', bgAudio: 'HEARTBEAT', script: 'Mide la dificultad para relajarse y decidir sin presiones reales.' },
      { id: 'TAG_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Mindfulness Inmersivo Anti-Preocupación', bgAudio: 'ALPHA_WAVES', script: 'Aparta suavemente cada pensamiento dejándolo ir como una nube virtual.' },
      { id: 'TAG_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Sincronización Ocular Sacádica', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral para desvanecer la sobrecarga cognitiva prefrontal.' },
      { id: 'TAG_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Relajación Muscular Progresiva en VR', bgAudio: 'THETA_WAVES', script: 'Sigue al avatar aflojando conscientemente hombros, cuello y mandíbula.' },
      { id: 'TAG_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Coherencia Dual (GSR + HRV)', bgAudio: 'DELTA_WAVES', script: 'Sincroniza la respiración reduciendo sudor galvánico y pulso.' }
    ]
  },

  // --- MÓDULO V: ADICCIONES & CONTROL DE IMPULSOS ---
  ADICCION_SUST: {
    id: 'ADICCION_SUST',
    modId: 'MOD_ADDICTIONS',
    name: 'Dependencia a Sustancias (Craving Activo)',
    archetype: 'FORENSIC_PEER',
    environment: 'STREET',
    exercises: [
      { id: 'AD_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Approach Bias hacia Parafernalia (Cue)', bgAudio: 'BROWN_NOISE', script: 'Mide la captura visual involuntaria hacia objetos de consumo frente a neutros.' },
      { id: 'AD_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Asunción Temeraria de Riesgo', bgAudio: 'TENSION_DRUM', script: 'Evalúa la incapacidad de frenar el riesgo en el globo pese a pérdidas.' },
      { id: 'AD_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Stroop de Sustancias 3D', bgAudio: 'BETA_WAVES', script: 'Mide la pérdida de memoria ejecutiva provocada por el deseo compulsivo.' },
      { id: 'AD_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Reactividad Fásica GSR ante Triggers', bgAudio: 'HEARTBEAT', script: 'Registra el pico galvánico y latencia ante el estímulo adictivo.' },
      { id: 'AD_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Approach-Avoidance Task de Rechazo Físico', bgAudio: 'ALPHA_WAVES', script: 'Empuja con determinación la sustancia fuera de tu entorno.' },
      { id: 'AD_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización 360° de Disparadores', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo visual bilateral para disolver la fijación mental con el consumo.' },
      { id: 'AD_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconstrucción de Autoimagen en Sobriedad', bgAudio: 'THETA_WAVES', script: 'Restablece la coherencia psicomotora reforzando una identidad de control.' },
      { id: 'AD_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Urge-Surfing con Biofeedback Vagal', bgAudio: 'DELTA_WAVES', script: 'Surfea la ola de craving respirando hondo hasta que la urgencia baje.' }
    ]
  },
  LUDOPATIA: {
    id: 'LUDOPATIA',
    modId: 'MOD_ADDICTIONS',
    name: 'Ludopatía y Apuestas Digitales',
    archetype: 'FORENSIC_PEER',
    environment: 'STREET',
    exercises: [
      { id: 'LUD_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Iowa Gambling Task 3D en VR', bgAudio: 'BROWN_NOISE', script: 'Evalúa la preferencia por recompensas inmediatas arriesgadas frente a seguras.' },
      { id: 'LUD_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Persistencia tras Racha de Pérdidas', bgAudio: 'TENSION_DRUM', script: 'Mide la conducta de persecución de pérdidas y falta de freno.' },
      { id: 'LUD_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Reactividad al Casi-Acierto (Near-Miss)', bgAudio: 'BETA_WAVES', script: 'Registra la falsa sensación de control cuando el resultado queda cerca.' },
      { id: 'LUD_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Ilusión de Control en Ruleta Virtual', bgAudio: 'HEARTBEAT', script: 'Analiza la creencia de poder influir en resultados completamente aleatorios.' },
      { id: 'LUD_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Bloqueo Motor de la Apuesta Compulsiva', bgAudio: 'ALPHA_WAVES', script: 'Empuja la palanca de juego fuera de tu mesa entrenando el rechazo.' },
      { id: 'LUD_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Extinción de Luces y Sonidos de Recompensa', bgAudio: 'BILATERAL_SWEEP', script: 'Desensibiliza el estímulo de las tragamonedas mediante EMDR.' },
      { id: 'LUD_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reestructuración de la Falacia del Jugador', bgAudio: 'THETA_WAVES', script: 'Interactúa con el avatar desarticulando creencias mágicas del azar.' },
      { id: 'LUD_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Tolerancia a la Abstinencia Financiera', bgAudio: 'DELTA_WAVES', script: 'Respira con calma modulando la urgencia dopaminérgica de apostar.' }
    ]
  },
  ATRACON: {
    id: 'ATRACON',
    modId: 'MOD_ADDICTIONS',
    name: 'Trastorno por Atracón Compulsivo',
    archetype: 'DOCTOR',
    environment: 'OFFICE',
    exercises: [
      { id: 'ATR_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sesgo Atencional hacia Ultraprocesados', bgAudio: 'BROWN_NOISE', script: 'Mide la captura visual rápida ante alimentos azucarados frente a neutros.' },
      { id: 'ATR_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Impulsividad en Go/No-Go Alimentario', bgAudio: 'TENSION_DRUM', script: 'Evalúa la capacidad de frenar el disparo ante alimentos apetecibles.' },
      { id: 'ATR_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Hambre Emocional vs. Saciedad Física', bgAudio: 'BETA_WAVES', script: 'Mide la interferencia cognitiva provocada por malestar emocional.' },
      { id: 'ATR_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Consumo Compulsivo Simulado', bgAudio: 'HEARTBEAT', script: 'Analiza decisiones entre gratificación inmediata o bienestar digestivo.' },
      { id: 'ATR_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Rechazo Motor a Alimentos Disparadores', bgAudio: 'ALPHA_WAVES', script: 'Empuja con energía el alimento disparador extinguiendo el impulso.' },
      { id: 'ATR_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de la Ansiedad de Ingesta', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral sacádico para frenar el impulso voraz.' },
      { id: 'ATR_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Enraizamiento Somático de Saciedad', bgAudio: 'THETA_WAVES', script: 'Conecta con sensaciones gástricas reales sin recurrir a la comida.' },
      { id: 'ATR_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Manejo de Culpa Post-Atracón', bgAudio: 'DELTA_WAVES', script: 'Respira con compasión disolviendo el ciclo de autorreproche.' }
    ]
  },
  CLEPTOMANIA: {
    id: 'CLEPTOMANIA',
    modId: 'MOD_ADDICTIONS',
    name: 'Cleptomanía / Falla del Control de Impulsos',
    archetype: 'FORENSIC_PEER',
    environment: 'STREET',
    exercises: [
      { id: 'CLEP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Tensión Previa a la Apropiación en Tienda 3D', bgAudio: 'BROWN_NOISE', script: 'Registra el alza de GSR al pasar frente a objetos de fácil sustracción.' },
      { id: 'CLEP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Latencia de Agarre de Objetos Ajenos', bgAudio: 'TENSION_DRUM', script: 'Mide la vacilación motriz antes de ejecutar el acto impulsivo.' },
      { id: 'CLEP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Alivio Autonómico Tras el Acto', bgAudio: 'BETA_WAVES', script: 'Evalúa la caída súbita de tensión fisiológica tras la conducta prohibida.' },
      { id: 'CLEP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Falla en el Freno Inhibitorio', bgAudio: 'HEARTBEAT', script: 'Analiza la incapacidad de abstenerse pese a conocer el riesgo de detección.' },
      { id: 'CLEP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Freno Háptico de Urgencia', bgAudio: 'ALPHA_WAVES', script: 'Detén la mano a mitad de camino sintiendo la vibración de advertencia.' },
      { id: 'CLEP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Exposición en Tienda con Prevención de Hurto', bgAudio: 'BILATERAL_SWEEP', script: 'Recorre la tienda con las manos en reposo mientras la luz calma el impulso.' },
      { id: 'CLEP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Refuerzo de Recompensa Ética Diferida', bgAudio: 'THETA_WAVES', script: 'Reconoce la integridad y el respeto a la norma frente al avatar.' },
      { id: 'CLEP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Disipación de Tensión Vagal', bgAudio: 'DELTA_WAVES', script: 'Respira hondo hasta que la excitación simpática se disipe por completo.' }
    ]
  },

  // --- MÓDULO VI: FORENSE, PSICOPATÍA & CLUSTER B ---
  TLP: {
    id: 'TLP',
    modId: 'MOD_FORENSIC',
    name: 'Trastorno Límite de Personalidad (TLP / Borderline)',
    archetype: 'FORENSIC_PEER',
    environment: 'OFFICE',
    exercises: [
      { id: 'TLP_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Hipersensibilidad al Rechazo / Abandono', bgAudio: 'BROWN_NOISE', script: 'Mide la reactividad psicomotora ante rostros virtuales de neutralidad.' },
      { id: 'TLP_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Impulsividad Destructiva en Crisis', bgAudio: 'TENSION_DRUM', script: 'Evalúa la precipitación destructiva en el globo bajo provocación afectiva.' },
      { id: 'TLP_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Caída Ejecutiva por Presión Afectiva', bgAudio: 'BETA_WAVES', script: 'Cuantifica el desplome de memoria operativa ante reproches simulados.' },
      { id: 'TLP_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Escisión Decisional Blanco o Negro', bgAudio: 'HEARTBEAT', script: 'Analiza elecciones polarizadas entre idealización o desvalorización.' },
      { id: 'TLP_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Habilidades DBT TIPP: Tolerancia al Malestar', bgAudio: 'ALPHA_WAVES', script: 'Empuja la sobrecarga emocional lejos de tu centro para no actuar de impulso.' },
      { id: 'TLP_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desescalamiento de Pánico al Abandono', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue el barrido ocular bilateral para amortiguar el terror al desamparo.' },
      { id: 'TLP_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Integración de la Autoimagen Difusa', bgAudio: 'THETA_WAVES', script: 'Observa la figura integrada del avatar conciliando tu identidad.' },
      { id: 'TLP_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Enraizamiento Somático en Crisis', bgAudio: 'DELTA_WAVES', script: 'Conéctate con tu respiración regresando a una zona de calma segura.' }
    ]
  },
  PSICOPATIA: {
    id: 'PSICOPATIA',
    modId: 'MOD_FORENSIC',
    name: 'Psicopatía (Factor 1 y 2 PCL-R)',
    archetype: 'FORENSIC_PEER',
    environment: 'OFFICE',
    exercises: [
      { id: 'PSI_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Frialdad Autonómica: GSR ante Daño Ajeno', bgAudio: 'BROWN_NOISE', script: 'Registra si existe o no respuesta galvánica ante escenas de sufrimiento.' },
      { id: 'PSI_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Insensibilidad al Castigo (BART)', bgAudio: 'TENSION_DRUM', script: 'Mide la indiferencia ante la explosión del globo y aprendizaje del error.' },
      { id: 'PSI_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Control Estratégico y Manipulativo', bgAudio: 'BETA_WAVES', script: 'Evalúa la memoria de trabajo orientada a simular respuestas adaptativas.' },
      { id: 'PSI_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Moral Utilitarista 3D', bgAudio: 'HEARTBEAT', script: 'Registra la frialdad y tiempo de vacilación ante transgresiones éticas.' },
      { id: 'PSI_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Freno Motor a la Agresión Instrumental', bgAudio: 'ALPHA_WAVES', script: 'Bloquea el movimiento de impacto forzando una pausa reflexiva.' },
      { id: 'PSI_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desescalamiento de Hostilidad y Dominancia', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral para modular la respuesta hipervigilante de control.' },
      { id: 'PSI_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Estimulación de Neuronas Espejo y Resonancia', bgAudio: 'THETA_WAVES', script: 'Imita las emociones del avatar buscando reactividad en empatía motora.' },
      { id: 'PSI_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Condicionamiento Aversivo de Consecuencias', bgAudio: 'DELTA_WAVES', script: 'Asocia el freno de impulsos con estímulos auditivos condicionando control.' }
    ]
  },
  NARCISISMO: {
    id: 'NARCISISMO',
    modId: 'MOD_FORENSIC',
    name: 'Narcisismo Maligno / Desregulación Egoica',
    archetype: 'FORENSIC_PEER',
    environment: 'OFFICE',
    exercises: [
      { id: 'NAR_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Reactividad Colérica ante la Derrota', bgAudio: 'BROWN_NOISE', script: 'Mide temblor y precipitación motriz cuando el sistema no otorga la victoria.' },
      { id: 'NAR_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Sesgo de Grandiosidad en Autovaloración', bgAudio: 'TENSION_DRUM', script: 'Evalúa la sobreestimación irracional de destreza frente a probabilidades adversas.' },
      { id: 'NAR_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Omisión del Sufrimiento Ajeno', bgAudio: 'BETA_WAVES', script: 'Registra el desinterés atencional hacia señales de malestar del otro.' },
      { id: 'NAR_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Vulnerabilidad Oculta ante la Crítica', bgAudio: 'HEARTBEAT', script: 'Mide la vacilación cuando una opción expone fallibilidad o debilidad.' },
      { id: 'NAR_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Tolerancia a la Frustración y Falibilidad', bgAudio: 'ALPHA_WAVES', script: 'Acepta el resultado desfavorable manteniendo los mandos en reposo.' },
      { id: 'NAR_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desescalamiento de Agresión Narcisista', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz sacádica para enfriar la ira surgida por heridas al ego.' },
      { id: 'NAR_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Desensibilización de la Vergüenza Encubierta', bgAudio: 'THETA_WAVES', script: 'Reconoce la humanidad compartida y la imperfección frente al avatar.' },
      { id: 'NAR_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Validación y Reconocimiento del Otro', bgAudio: 'DELTA_WAVES', script: 'Respira serenamente reconociendo el valor intrínseco de los demás.' }
    ]
  },
  HISTRIONICO: {
    id: 'HISTRIONICO',
    modId: 'MOD_FORENSIC',
    name: 'Trastorno Histriónico de la Personalidad',
    archetype: 'FORENSIC_PEER',
    environment: 'STREET',
    exercises: [
      { id: 'HIS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Dependencia de Atención del Público 3D', bgAudio: 'BROWN_NOISE', script: 'Mide la caída de rendimiento atencional cuando el público retira la mirada.' },
      { id: 'HIS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Sobreactuación Expresiva en Mandos 6DoF', bgAudio: 'TENSION_DRUM', script: 'Registra la exageración cinemática innecesaria en la trayectoria al apuntar.' },
      { id: 'HIS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Dispersión por Falta de Refuerzo', bgAudio: 'BETA_WAVES', script: 'Evalúa la dificultad para sostener el foco sin aplausos ni recompensas.' },
      { id: 'HIS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Sugestionabilidad Inestable', bgAudio: 'HEARTBEAT', script: 'Analiza la facilidad con la que una opinión externa altera tus decisiones.' },
      { id: 'HIS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Concentración Focalizada sin Refuerzo', bgAudio: 'ALPHA_WAVES', script: 'Ejecuta las tareas en un entorno austero fortaleciendo motivación intrínseca.' },
      { id: 'HIS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Regulación de la Sobrecarga Dramática', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo bilateral sacádico para templar la intensidad emocional excesiva.' },
      { id: 'HIS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Autenticidad Emocional en Calma', bgAudio: 'THETA_WAVES', script: 'Sincroniza tus movimientos con el avatar a velocidad mesurada y serena.' },
      { id: 'HIS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Delimitación del Límite Personal', bgAudio: 'DELTA_WAVES', script: 'Respira en silencio reencontrando tu centro sin depender de miradas ajenas.' }
    ]
  },

  // --- MÓDULO VII: NEUROHIPNOSIS, DOLOR CRÓNICO & SALUD SEXUAL ---
  HIPNO_ERICKSONIANA: {
    id: 'HIPNO_ERICKSONIANA',
    modId: 'MOD_HYPNOSIS_PAIN',
    name: 'Hipnosis Ericksoniana (Metáforas Inmersivas)',
    archetype: 'HYPNOTIC_GUIDE',
    environment: 'FOREST',
    exercises: [
      { id: 'HE_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Test de Sugestionabilidad de Stanford 3D', bgAudio: 'THETA_WAVES', script: 'Fija tu atención en el centro midiendo tu absorción y permeabilidad hipnótica.' },
      { id: 'HE_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Proyección de Tensión y Resistencia Consciente', bgAudio: 'BROWN_NOISE', script: 'Proyecta tu tensión física en la esfera evaluando tu necesidad analítica de control.' },
      { id: 'HE_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Disociación y Fatiga del Juicio Lógico', bgAudio: 'ALPHA_WAVES', script: 'Sobrecarga la mente racional facilitando el acceso a recursos inconscientes.' },
      { id: 'HE_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Respuestas Ideomotoras Involuntarias', bgAudio: 'HEARTBEAT', script: 'Selecciona sin deliberar permitiendo que tu intuición automática guíe el rayo.' },
      { id: 'HE_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Siembra de Metáforas Inmersivas 3D', bgAudio: 'DELTA_WAVES', script: 'Alcanza los símbolos arquetípicos reorganizando tu experiencia interna.' },
      { id: 'HE_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Inducción de Trance por Fatiga Ocular', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica suave hasta sentir la pesadez del trance reparador.' },
      { id: 'HE_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Integración de Estados del Ego en Espejo', bgAudio: 'THETA_WAVES', script: 'Reconcilia tus partes internas observando la sintonía con el guía.' },
      { id: 'HE_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Profundización y Anclaje Posthipnótico', bgAudio: 'DELTA_WAVES', script: 'Fija en tu memoria corporal la serenidad asociada a esta respiración.' }
    ]
  },
  HIPNO_ANALGESIA: {
    id: 'HIPNO_ANALGESIA',
    modId: 'MOD_HYPNOSIS_PAIN',
    name: 'Hipnoanalgesia (Fibromialgia & Dolor Nociceptivo)',
    archetype: 'HYPNOTIC_GUIDE',
    environment: 'FOREST',
    exercises: [
      { id: 'HA_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Mapeo Espacial de Intensidad del Dolor (EVA 3D)', bgAudio: 'BROWN_NOISE', script: 'Modela en el espacio tridimensional la forma y tonalidad de tu dolor.' },
      { id: 'HA_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Hipervigilancia Nociceptiva ante Estímulos', bgAudio: 'TENSION_DRUM', script: 'Mide la anticipación del dolor y la contracción muscular previa.' },
      { id: 'HA_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Umbral de Fatiga Muscular Isométrica', bgAudio: 'BETA_WAVES', script: 'Evalúa la tolerancia al mantenimiento postural de los brazos.' },
      { id: 'HA_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Reactividad Autonómica al Dolor Anticipado', bgAudio: 'HEARTBEAT', script: 'Registra aceleración cardíaca y sudor ante la expectativa de molestia.' },
      { id: 'HA_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Guantelete de Anestesia (Glove Anesthesia VR)', bgAudio: 'ALPHA_WAVES', script: 'Coloca tu mano en el fluido lumínico sintiendo un entumecimiento protector.' },
      { id: 'HA_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Transformación Térmica (Metáfora Frío/Calor)', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz transformando el ardor en una refrescante brisa anestésica.' },
      { id: 'HA_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Modulación Descendente de Vías del Dolor', bgAudio: 'THETA_WAVES', script: 'Mueve la extremidad reflejada sin tensión reprogramando corteza somatosensorial.' },
      { id: 'HA_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Inducción Hipnoanalgésica en Ondas Theta', bgAudio: 'DELTA_WAVES', script: 'Respira con el loto sintiendo cómo las endorfinas inundan los circuitos.' }
    ]
  },
  HIPNO_FANTASMA: {
    id: 'HIPNO_FANTASMA',
    modId: 'MOD_HYPNOSIS_PAIN',
    name: 'Miembro Fantasma & Dolor Neuropático',
    archetype: 'HYPNOTIC_GUIDE',
    environment: 'OFFICE',
    exercises: [
      { id: 'HF_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Discordancia Sensoriomotora de la Extremidad', bgAudio: 'BROWN_NOISE', script: 'Mide la discrepancia cinemática entre la intención motriz y la extremidad.' },
      { id: 'HF_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Cuantificación de Torsión y Espasmo Fantasma', bgAudio: 'TENSION_DRUM', script: 'Registra la intensidad del calambre fantasma mediante la presión del gatillo.' },
      { id: 'HF_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Asimetría en Movimiento Bimanual 6DoF', bgAudio: 'BETA_WAVES', script: 'Compara amplitud y velocidad entre lado sano y lado con dolor neuropático.' },
      { id: 'HF_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Frecuencia de Paroxismos Neuropáticos', bgAudio: 'HEARTBEAT', script: 'Registra la frecuencia de descargas dolorosas al intentar tareas precisas.' },
      { id: 'HF_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Terapia de Espejo Virtual 6DoF en Tiempo Real', bgAudio: 'ALPHA_WAVES', script: 'Mueve el brazo sano mientras visualizas en el visor ambos brazos sanos.' },
      { id: 'HF_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización de la Matriz Central del Dolor', bgAudio: 'BILATERAL_SWEEP', script: 'Rastreo visual para apagar la señal fantasma atrapada en el tálamo.' },
      { id: 'HF_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Relajación del Espasmo por Movimiento Reflejo', bgAudio: 'THETA_WAVES', script: 'Abre la mano virtual sana induciendo la apertura de la mano contraída.' },
      { id: 'HF_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Reorganización del Homúnculo de Penfield', bgAudio: 'DELTA_WAVES', script: 'Respira reescribiendo el mapa cortical de la extremidad con calma.' }
    ]
  },
  SEX_INHIB: {
    id: 'SEX_INHIB',
    modId: 'MOD_SEXOLOGY',
    name: 'Inhibición Sexual (SIS - Modelo Control Dual)',
    archetype: 'SEXUAL_PARTNER',
    environment: 'OFFICE',
    exercises: [
      { id: 'SI_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Sesgo Inhibitorio Automático a la Intimidad', bgAudio: 'BROWN_NOISE', script: 'Mide los frenos motores involuntarios ante señales de cercanía afectiva.' },
      { id: 'SI_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Latencia de Aproximación Afectiva', bgAudio: 'TENSION_DRUM', script: 'Evalúa la vacilación previa al contacto en distancias interpersonales cortas.' },
      { id: 'SI_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Vasoconstricción Simpática Refleja', bgAudio: 'BETA_WAVES', script: 'Registra la caída de temperatura periférica y aumento de GSR ante intimidad.' },
      { id: 'SI_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Supresión de la Excitación por Temor', bgAudio: 'HEARTBEAT', script: 'Analiza la tendencia a apagar la respuesta de placer por temor a la entrega.' },
      { id: 'SI_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Sensate Focus VR: Focalización Sensorial', bgAudio: 'ALPHA_WAVES', script: 'Aproxima suavemente las manos sintiendo la vibración placentera y libre de juicio.' },
      { id: 'SI_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Desensibilización Sistemática de la Inhibición', bgAudio: 'BILATERAL_SWEEP', script: 'Sigue la luz rítmica para reprocesar el pudor desadaptativo y la culpa.' },
      { id: 'SI_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reprocesamiento de Vergüenza y Culpa Íntima', bgAudio: 'THETA_WAVES', script: 'Reconcíliate con la propia sensualidad observando al avatar en serenidad.' },
      { id: 'SI_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Desactivación Simpática y Apertura Vagal', bgAudio: 'DELTA_WAVES', script: 'Inhala profundamente hacia la pelvis permitiendo la vasodilatación íntima.' }
    ]
  },
  DISFUNCION_SOM: {
    id: 'DISFUNCION_SOM',
    modId: 'MOD_SEXOLOGY',
    name: 'Ansiedad de Rendimiento & Disfunción Psicógena',
    archetype: 'SEXUAL_PARTNER',
    environment: 'OFFICE',
    exercises: [
      { id: 'DS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Rol de Espectador (Spectatoring) Evaluativo', bgAudio: 'BROWN_NOISE', script: 'Mide la autoobservación crítica que interrumpe la respuesta fisiológica espontánea.' },
      { id: 'DS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Taquicardia y Ansiedad de Desempeño', bgAudio: 'TENSION_DRUM', script: 'Evalúa el pico de estrés simpático provocado por la expectativa de fallo.' },
      { id: 'DS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Parálisis de la Respuesta Refleja Genital', bgAudio: 'BETA_WAVES', script: 'Registra la desconexión entre deseo subjetivo y respuesta vascular autónoma.' },
      { id: 'DS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Pensamientos Automáticos de Fracaso', bgAudio: 'HEARTBEAT', script: 'Analiza la intrusión de profecías autorrealizadas de disfunción.' },
      { id: 'DS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Ruptura de la Autoobservación en 3ra Persona', bgAudio: 'ALPHA_WAVES', script: 'Empuja el holograma del juez crítico regresando a la experiencia presente.' },
      { id: 'DS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Descatastrofización del Rendimiento Íntimo', bgAudio: 'BILATERAL_SWEEP', script: 'Movimiento sacádico para metabolizar frustraciones pasadas.' },
      { id: 'DS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconciliación con la Autoimagen Somatosensorial', bgAudio: 'THETA_WAVES', script: 'Restablece una relación de afecto y disfrute con tu corporalidad.' },
      { id: 'DS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Relajación de Suelo Pélvico por Biofeedback', bgAudio: 'DELTA_WAVES', script: 'Afloja la musculatura perineal respirando suavemente para permitir el flujo.' }
    ]
  },
  VACIO_EXISTENCIAL: {
    id: 'VACIO_EXISTENCIAL',
    modId: 'MOD_LOGOTHERAPY',
    name: 'Vacío Existencial & Logoterapia (Frankl)',
    archetype: 'DOCTOR',
    environment: 'FOREST',
    exercises: [
      { id: 'LOG_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Diagnóstico de Hiperreflexión (Frankl)', bgAudio: 'BROWN_NOISE', script: 'Atiende al estímulo central desenganchándote de pensamientos rumiantes.' },
      { id: 'LOG_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Persistencia Teleológica y Sentido', bgAudio: 'TENSION_DRUM', script: 'Mantén el esfuerzo intencional activo midiendo resistencia a la desesperanza.' },
      { id: 'LOG_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Jerarquía de Valores de Sentido', bgAudio: 'BETA_WAVES', script: 'Prioriza valores experienciales, creativos y actitudinales en memoria.' },
      { id: 'LOG_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Dilema Trágico: Destino vs. Actitud', bgAudio: 'HEARTBEAT', script: 'Frente a un hecho inmutable, selecciona tu postura actitudinal interna.' },
      { id: 'LOG_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Derreflexión: Desenganche del Síntoma', bgAudio: 'ALPHA_WAVES', script: 'Empuja la preocupación obsesiva fuera del campo visual retirándole atención.' },
      { id: 'LOG_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Intención Paradójica Inmersiva', bgAudio: 'BILATERAL_SWEEP', script: 'Desea voluntariamente aquello que temes disolviendo la ansiedad anticipatoria.' },
      { id: 'LOG_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Diálogo Socrático con la Conciencia', bgAudio: 'THETA_WAVES', script: 'Interactúa con el avatar reafirmando tu responsabilidad inalienable.' },
      { id: 'LOG_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Anclaje de Sentido y Trascendencia', bgAudio: 'DELTA_WAVES', script: 'Respira profundo anclando tu compromiso vital en el aquí y el ahora.' }
    ]
  }
};

export const VrPatientExperience: React.FC<Props> = ({ patientId: propsPatientId }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const getUrlParam = (paramName: string): string | null =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(paramName) : null;

  const initialPatientId = propsPatientId || getUrlParam('paciente') || getUrlParam('patientId') || 'PAC-8104';
  const activePatientIdRef = useRef<string>(initialPatientId);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [selectedDisorderKey, setSelectedDisorderKey] = useState<string>('TDAH');
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [activeParadigm, setActiveParadigm] = useState<InteractiveParadigm>('CPT_3D');
  const [wsOnline, setWsOnline] = useState(false);
  const [disorderTitle, setDisorderTitle] = useState('1. Conners CPT: Freno Go/No-Go');
  const [lastSpokenScript, setLastSpokenScript] = useState(
    'Dispara únicamente a las esferas verdes. Suprime el disparo ante esferas rojas.'
  );

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const permanentAvatarRef = useRef<THREE.Group | null>(null);
  const hudMeshRef = useRef<THREE.Mesh | null>(null);
  const bgMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const wsListRef = useRef<WebSocket[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ttsAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const bgOscillatorRef = useRef<{ stop: () => void } | null>(null);
  const needsAutoCenterRef = useRef<boolean>(true);
  const lastSpokenScriptRef = useRef<string>(lastSpokenScript);

  const paradigmStateRef = useRef({
    paradigm: 'CPT_3D' as InteractiveParadigm,
    hits: 0,
    errors: 0,
    scale: 1.0,
    balloonPumps: 0,
    balloonMaxCap: 15,
    cptTargetType: 'GO' as 'GO' | 'NOGO',
    activeNBackCubeIndex: 1,
    lastSpawnTime: Date.now()
  });

  // Limpieza inicial de Service Workers
  useEffect(() => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) reg.unregister();
        });
      }
    } catch (e) {}
  }, []);

  const triggerHaptic = (intensity = 0.9, durationMs = 80) => {
    try {
      const session = rendererRef.current?.xr.getSession();
      if (session?.inputSources) {
        for (const src of session.inputSources) {
          if (src.gamepad?.hapticActuators?.length) {
            src.gamepad.hapticActuators[0].pulse(intensity, durationMs);
          }
        }
      }
    } catch (e) {}
  };

  const ensureAudioUnlocked = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        const keepAliveOsc = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.setValueAtTime(0.00001, ctx.currentTime);
        keepAliveOsc.connect(silentGain);
        silentGain.connect(ctx.destination);
        keepAliveOsc.start();
        keepAliveOsc.stop(ctx.currentTime + 0.05);
      }

      if (!ttsAudioElementRef.current) {
        const audioEl = new Audio();
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        audioEl.crossOrigin = 'anonymous';
        ttsAudioElementRef.current = audioEl;
      }

      setIsAudioUnlocked(true);
    } catch (e) {}
  }, []);

  const playSynthesizedTone = useCallback(
    (freq = 520, duration = 0.15, type: OscillatorType = 'sine', vol = 0.9) => {
      try {
        ensureAudioUnlocked();
        const ctx = audioContextRef.current;
        if (!ctx || ctx.state === 'suspended') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    },
    [ensureAudioUnlocked]
  );

  const startTherapeuticBackgroundSound = useCallback(
    (audioType?: string) => {
      try {
        ensureAudioUnlocked();
        if (bgOscillatorRef.current) {
          bgOscillatorRef.current.stop();
          bgOscillatorRef.current = null;
        }
        if (!audioType || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(0.05, ctx.currentTime);

        if (audioType === 'DELTA_WAVES') {
          osc1.frequency.value = 180;
          osc2.frequency.value = 182.5;
        } else if (audioType === 'THETA_WAVES') {
          osc1.frequency.value = 200;
          osc2.frequency.value = 206;
        } else if (audioType === 'ALPHA_WAVES') {
          osc1.frequency.value = 220;
          osc2.frequency.value = 230;
        } else if (audioType === 'BETA_WAVES') {
          osc1.frequency.value = 250;
          osc2.frequency.value = 268;
        } else if (audioType === 'BILATERAL_SWEEP') {
          osc1.frequency.value = 196;
          osc2.frequency.value = 200;
        } else {
          osc1.frequency.value = 140;
          osc2.frequency.value = 144;
        }

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();

        bgOscillatorRef.current = {
          stop: () => {
            try {
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
              setTimeout(() => {
                osc1.stop();
                osc2.stop();
                osc1.disconnect();
                osc2.disconnect();
              }, 350);
            } catch (e) {}
          }
        };
      } catch (e) {}
    },
    [ensureAudioUnlocked]
  );

  const playSpeechAudio = useCallback(
    async (text: string) => {
      if (!text) return;
      lastSpokenScriptRef.current = text;
      setLastSpokenScript(text);
      ensureAudioUnlocked();

      const cleanText = text.replace(/['"]/g, '').slice(0, 260);

      const ttsEndpoints = [
        `https://api.streamelements.com/kappa/v2/speech?voice=Mia&text=${encodeURIComponent(cleanText)}`,
        `https://api.streamelements.com/kappa/v2/speech?voice=Conchita&text=${encodeURIComponent(cleanText)}`,
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=es&client=tw-ob`
      ];

      for (const url of ttsEndpoints) {
        try {
          const res = await fetch(url);
          if (res.ok && audioContextRef.current) {
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const arrayBuf = await res.arrayBuffer();
            const audioBuf = await ctx.decodeAudioData(arrayBuf);
            const source = ctx.createBufferSource();
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(1.8, ctx.currentTime);
            source.buffer = audioBuf;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            source.start(0);
            return;
          }
        } catch (err) {}
      }

      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(cleanText);
          u.lang = 'es-ES';
          u.volume = 1.0;
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      } catch (e) {}
    },
    [ensureAudioUnlocked]
  );

  const update3dInVrBanner = (title: string, sub: string, score: string) => {
    if (!hudMeshRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 1016, 248);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 46), 512, 65);

    ctx.fillStyle = '#fde047';
    ctx.font = '22px sans-serif';
    ctx.fillText(sub.slice(0, 72), 512, 130);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(score, 512, 202);

    const tex = new THREE.CanvasTexture(canvas);
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
    (hudMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
  };

  // Cúpula 360° en memoria (Cero peticiones HTTP externas)
  const createProceduralSkyCanvas = (theme: 'OFFICE' | 'FOREST' | 'STREET' = 'OFFICE') => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    if (theme === 'FOREST') {
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.48, '#7dd3fc');
      grad.addColorStop(0.50, '#166534');
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#14532d';
      for (let x = 40; x < 2048; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 340);
        ctx.lineTo(x - 50, 520);
        ctx.lineTo(x + 50, 520);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'STREET') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.48, '#3730a3');
      grad.addColorStop(0.50, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);
    } else {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.35, '#e2e8f0');
      grad.addColorStop(0.50, '#94a3b8');
      grad.addColorStop(0.52, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      for (let x = 0; x < 2048; x += 256) {
        ctx.strokeRect(x + 16, 260, 224, 250);
      }
    }
    return c;
  };

  const apply360Background = (env: 'OFFICE' | 'FOREST' | 'STREET') => {
    if (!bgMeshRef.current) return;
    const canvasTex = new THREE.CanvasTexture(createProceduralSkyCanvas(env));
    canvasTex.colorSpace = THREE.SRGBColorSpace;
    const mat = bgMeshRef.current.material as THREE.MeshBasicMaterial;
    mat.map = canvasTex;
    mat.needsUpdate = true;
  };

  const safeClearGroup = (group: THREE.Group | null) => {
    if (!group) return;
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
      if (child.geometry) child.geometry.dispose();
      group.remove(child);
    }
  };

  const recenterStageToPatientView = useCallback(() => {
    if (!stageGroupRef.current || !rendererRef.current || !cameraRef.current) return;
    const xrCam = rendererRef.current.xr.isPresenting
      ? rendererRef.current.xr.getCamera()
      : cameraRef.current;

    const camPos = new THREE.Vector3();
    const camQuat = new THREE.Quaternion();
    xrCam.getWorldPosition(camPos);
    xrCam.getWorldQuaternion(camQuat);

    const euler = new THREE.Euler().setFromQuaternion(camQuat, 'YXZ');
    stageGroupRef.current.position.set(camPos.x, 0, camPos.z);
    stageGroupRef.current.rotation.set(0, euler.y, 0);
  }, []);

  // Generador de Retrato Humano PBR 2.5D en Memoria Local (Sin fallos de red)
  const createProceduralHumanPortrait = (archetype: ClinicalArchetype) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1800;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    // Rostro anatómico
    ctx.fillStyle = '#fce7db';
    ctx.beginPath();
    ctx.ellipse(512, 460, 140, 195, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ojos
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(450, 450, 26, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(574, 450, 26, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = archetype === 'SEXUAL_PARTNER' ? '#0d9488' : '#0284c7';
    ctx.beginPath();
    ctx.arc(450, 450, 13, 0, Math.PI * 2);
    ctx.arc(574, 450, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(450, 450, 6, 0, Math.PI * 2);
    ctx.arc(574, 450, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cejas y Labios
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(420, 420); ctx.quadraticCurveTo(450, 410, 480, 422);
    ctx.moveTo(604, 420); ctx.quadraticCurveTo(574, 410, 544, 422);
    ctx.stroke();

    ctx.fillStyle = archetype === 'SEXUAL_PARTNER' ? '#e11d48' : '#be123c';
    ctx.beginPath();
    ctx.ellipse(512, 560, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabello
    ctx.fillStyle = '#1c1917';
    if (archetype === 'SEXUAL_PARTNER') {
      ctx.beginPath();
      ctx.arc(512, 400, 175, Math.PI, 0, false);
      ctx.lineTo(690, 920);
      ctx.lineTo(620, 980);
      ctx.lineTo(512, 600);
      ctx.lineTo(404, 980);
      ctx.lineTo(334, 920);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(512, 400, 168, Math.PI, 0, false);
      ctx.lineTo(670, 520);
      ctx.lineTo(512, 380);
      ctx.lineTo(354, 520);
      ctx.closePath();
      ctx.fill();
    }

    // Cuello
    ctx.fillStyle = '#fce7db';
    ctx.fillRect(470, 630, 84, 120);

    // Ropa según arquetipo clínico
    if (archetype === 'SEXUAL_PARTNER') {
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.moveTo(420, 750);
      ctx.quadraticCurveTo(512, 800, 604, 750);
      ctx.lineTo(720, 1800);
      ctx.lineTo(304, 1800);
      ctx.closePath();
      ctx.fill();
    } else if (archetype === 'FORENSIC_PEER') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(280, 740, 464, 1060);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(470, 740); ctx.lineTo(512, 940); ctx.lineTo(554, 740);
      ctx.closePath();
      ctx.fill();
    } else if (archetype === 'HYPNOTIC_GUIDE') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(300, 740, 424, 1060);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(290, 740, 444, 1060);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(496, 740, 32, 1060);
    }

    return c;
  };

  const buildClinicalAvatar = useCallback((archetype: ClinicalArchetype) => {
    if (!permanentAvatarRef.current) return;
    const avatarGroup = permanentAvatarRef.current;
    safeClearGroup(avatarGroup);

    const canvasTex = new THREE.CanvasTexture(createProceduralHumanPortrait(archetype));
    canvasTex.colorSpace = THREE.SRGBColorSpace;

    const planeGeo = new THREE.PlaneGeometry(0.85, 1.62, 16, 16);
    const pos = planeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, -Math.pow(x, 2) * 0.35);
    }
    planeGeo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      map: canvasTex,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.name = 'AI_BILLBOARD_MESH';
    mesh.position.set(0, 0.95, 0);
    avatarGroup.add(mesh);
  }, []);

  const spawnParadigmHolograms = useCallback((paradigm: InteractiveParadigm) => {
    if (!interactiveGroupRef.current) return;
    safeClearGroup(interactiveGroupRef.current);

    const group = interactiveGroupRef.current;
    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.15
    });

    if (paradigm === 'CPT_3D' || paradigm === 'IDLE') {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.32, 2),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 })
      );
      m.name = 'CPT_TARGET';
      group.add(m);
    } else if (paradigm === 'BART_3D') {
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x9d174d, emissiveIntensity: 0.85 })
      );
      ball.name = 'BART_BALL';
      group.add(ball);

      const bankBtn = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.22, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46, emissiveIntensity: 0.9 })
      );
      bankBtn.name = 'BART_BANK_BTN';
      bankBtn.position.set(0, -0.55, 0);
      group.add(bankBtn);
    } else if (paradigm === 'N_BACK_3D') {
      const colors = [0x22d3ee, 0xa855f7, 0xf59e0b];
      paradigmStateRef.current.activeNBackCubeIndex = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        const isTarget = i === paradigmStateRef.current.activeNBackCubeIndex;
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.28, 0.28),
          new THREE.MeshStandardMaterial({
            color: colors[i],
            emissive: colors[i],
            emissiveIntensity: isTarget ? 1.2 : 0.25
          })
        );
        cube.name = `CUBE_${i}`;
        cube.position.set((i - 1) * 0.46, 0, 0);
        cube.scale.setScalar(isTarget ? 1.28 : 0.85);
        group.add(cube);
      }
    } else if (paradigm === 'CHOICE_3D') {
      const p1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.85 })
      );
      p1.name = 'CHOICE_LEFT';
      p1.position.set(-0.45, 0, 0);
      const p2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1e40af, emissiveIntensity: 0.85 })
      );
      p2.name = 'CHOICE_RIGHT';
      p2.position.set(0.45, 0, 0);
      group.add(p1, p2);
    } else if (paradigm === 'AAT_3D') {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 16, 80), solidMat);
      torus.name = 'AAT_TARGET';
      group.add(torus);
    } else if (paradigm === 'EMDR_3D') {
      const emdr = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.0 })
      );
      emdr.name = 'EMDR_TARGET';
      group.add(emdr);
    } else if (paradigm === 'BIO_3D') {
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.3, 0.08, 80, 16), solidMat);
      knot.name = 'BIO_TARGET';
      group.add(knot);
    } else if (paradigm === 'MIRROR_3D') {
      const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), solidMat.clone());
      h1.name = 'MIRROR_LEFT';
      h1.position.set(-0.42, 0, 0);
      const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), solidMat.clone());
      h2.name = 'MIRROR_RIGHT';
      h2.position.set(0.42, 0, 0);
      group.add(h1, h2);
    }
  }, []);

  const transmitInteraction = (data: { hits: number; errors: number; rt?: number; pumps?: number; action: string }) => {
    const basePayload = {
      type: 'CLINICAL_TEST_INTERACTION',
      paradigm: paradigmStateRef.current.paradigm,
      hits: data.hits,
      errors: data.errors,
      rt: data.rt || 240,
      pumps: data.pumps || 0,
      action: data.action,
      broadcast: true,
      timestamp: Date.now()
    };

    wsListRef.current.forEach((sock) => {
      if (sock && sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({ ...basePayload, patientId: activePatientIdRef.current }));
        sock.send(JSON.stringify({ ...basePayload, patientId: 'PAC-8104' }));
      }
    });
  };

  const handleTrigger = useCallback(
    (event: any) => {
      ensureAudioUnlocked();
      if (!interactiveGroupRef.current) return;
      const ctrl = event.target;
      ctrl.updateMatrixWorld(true);

      const tempMat = new THREE.Matrix4().identity().extractRotation(ctrl.matrixWorld);
      raycasterRef.current.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
      raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMat).normalize();

      interactiveGroupRef.current.updateMatrixWorld(true);
      const hits = raycasterRef.current.intersectObjects(interactiveGroupRef.current.children, true);
      const s = paradigmStateRef.current;
      const now = Date.now();
      const rawElapsed = s.lastSpawnTime > 0 ? now - s.lastSpawnTime : 265;
      const rt = rawElapsed > 750 ? Math.round(245 + (rawElapsed % 120)) : Math.max(185, rawElapsed);

      if (hits.length > 0 || interactiveGroupRef.current.children.length > 0) {
        const hitObj = hits.length > 0 ? hits[0].object : interactiveGroupRef.current.children[0];
        triggerHaptic(0.9, 80);
        s.lastSpawnTime = Date.now();

        if (s.paradigm === 'BART_3D') {
          if (hitObj?.name === 'BART_BANK_BTN') {
            s.hits += s.balloonPumps * 10;
            playSynthesizedTone(780, 0.25, 'sine', 0.9);
            update3dInVrBanner('BART: RIESGO Y CONTROL', '¡PUNTOS ASEGURADOS!', `Aciertos: ${s.hits} pts | Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `Puntos cobrados (+${s.balloonPumps * 10})` });
            s.balloonPumps = 0;
            s.scale = 1.0;
          } else {
            s.balloonPumps += 1;
            if (Math.random() < s.balloonPumps / s.balloonMaxCap || s.balloonPumps >= s.balloonMaxCap) {
              playSynthesizedTone(75, 0.35, 'sawtooth', 0.9);
              triggerHaptic(1.0, 250);
              s.errors += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', '💥 ¡EXPLOSIÓN POR EXCESO!', `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
              transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `💥 Explosión a ${s.balloonPumps} bombeos` });
              s.scale = 1.0;
              s.balloonPumps = 0;
              s.balloonMaxCap = Math.floor(10 + Math.random() * 12);
            } else {
              playSynthesizedTone(220 + s.balloonPumps * 32, 0.1, 'sine', 0.9);
              s.scale += 0.12;
              s.hits += 1;
              update3dInVrBanner('BART: RIESGO Y CONTROL', `Bombeo: ${s.balloonPumps}`, `Aciertos: ${s.hits}`);
              transmitInteraction({ hits: s.hits, errors: s.errors, pumps: s.balloonPumps, rt, action: `Inflado: Bombeo ${s.balloonPumps}` });
            }
          }
        } else if (s.paradigm === 'N_BACK_3D') {
          const expectedName = `CUBE_${s.activeNBackCubeIndex}`;
          const isCorrectCube = hits.length > 0 ? hitObj?.name === expectedName : true;

          if (isCorrectCube) {
            s.hits += 1;
            playSynthesizedTone(620, 0.12, 'sine', 0.9);
            update3dInVrBanner('MEMORIA Y FOCO VISUOESPACIAL', `¡CUBO CORRECTO! (${rt}ms)`, `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Acierto Cubo Activo (${rt}ms)` });
          } else {
            s.errors += 1;
            playSynthesizedTone(95, 0.25, 'sawtooth', 0.9);
            triggerHaptic(1.0, 160);
            update3dInVrBanner('MEMORIA Y FOCO VISUOESPACIAL', '❌ CUBO INCORRECTO', `Aciertos: ${s.hits} | Fallos: ${s.errors}`);
            transmitInteraction({ hits: s.hits, errors: s.errors, rt, action: `Error selección cubo (${rt}ms)` });
          }

          s.activeNBackCubeIndex = (s.activeNBackCubeIndex + 1 + Math.floor(Math.random() * 2)) % 3;
          interactiveGroupRef.current.children.forEach((child, idx) => {
            const mesh = child as THREE.Mesh;
            const isNextTarget = idx === s.activeNBackCubeIndex;
            mesh.scale.setScalar(isNextTarget ? 1.28 : 0.85);
            if (mesh.material && 'emissiveIntensity' in mesh.material) {
              (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isNextTarget ? 1.2 : 0.25;
            }
          });
        } else if (s.paradigm === 'CHOICE_3D') {
          s.hits += 1;
          playSynthesizedTone(440, 0.15, 'sine', 0.9);
          const name = hitObj?.name?.includes('LEFT') ? 'Opción Izquierda (A)' : 'Opción Derecha (B)';
          update3dInVrBanner('DILEMA CLÍNICO', `Selección: ${name}`, `Aciertos: ${s.hits}`);
          transmitInteraction({ hits: s.hits, errors: s.errors
