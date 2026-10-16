// ============================================================================
// AMIE CLINICAL COPILOT - MATRIZ MAESTRA CLÍNICA
// frontend/data/clinicalParadigmsMatrix.ts
// 30 Trastornos • 4 Evaluaciones + 4 Tratamientos (240 Paradigmas Clínicos)
// ============================================================================

export interface ClinicalExercise {
  id: string;
  mode: 'DIAGNOSTIC' | 'TREATMENT';
  paradigm: 'CPT_3D' | 'BART_3D' | 'N_BACK_3D' | 'CHOICE_3D' | 'AAT_3D' | 'EMDR_3D' | 'MIRROR_3D' | 'BIO_3D';
  name: string;
  bgAudio: string;
  script: string;
}

export const CLINICAL_PARADIGMS_MAP: Record<string, ClinicalExercise[]> = {
  // ==========================================================================
  // MÓDULO I: NEURODESARROLLO & MOTOR
  // ==========================================================================

  // 1. TDAH / Impulsividad
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

  // 2. Espectro Autista Nivel 1 (Asperger)
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

  // 3. Espectro Autista Nivel 2-3 (Apoyo Notable)
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

  // 4. Deterioro Cognitivo / Alzheimer
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

  // 5. Enfermedad de Parkinson
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

  // ==========================================================================
  // MÓDULO II: AFECTIVO & ESTADO DE ÁNIMO
  // ==========================================================================

  // 6. Depresión Mayor Unipolar
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

  // 7. Trastorno Bipolar
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

  // 8. Distimia
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

  // 9. Ciclotimia
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

  // ==========================================================================
  // MÓDULO III: TRAUMA, TEPT & LOGOTERAPIA
  // ==========================================================================

  // 10. Estrés Postraumático (TEPT)
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

  // 11. Trauma Complejo del Apego (C-PTSD)
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

  // 12. Despersonalización / Desrealización
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

  // 13. Vacío Existencial & Logoterapia (Frankl)
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

  // ==========================================================================
  // MÓDULO IV: ANSIEDAD, FOBIAS & TOC
  // ==========================================================================

  // 14. Fobia Social
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

  // 15. Trastorno de Pánico y Agorafobia
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

  // 16. TOC
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

  // 17. TAG
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

  // ==========================================================================
  // MÓDULO V: ADICCIONES & CONTROL DE IMPULSOS
  // ==========================================================================

  // 18. Adicciones a Sustancias
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

  // 19. Ludopatía
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

  // 20. Atracón
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

  // 21. Cleptomanía
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

  // ==========================================================================
  // MÓDULO VI: FORENSE, PSICOPATÍA & CLUSTER B
  // ==========================================================================

  // 22. TLP / Borderline
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

  // 23. Psicopatía
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

  // 24. Narcisismo
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

  // 25. Histriónico
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

  // ==========================================================================
  // MÓDULO VII: NEUROHIPNOSIS & DOLOR CRÓNICO
  // ==========================================================================

  // 26. Hipnosis Ericksoniana
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

  // 27. Hipnoanalgesia
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

  // 28. Miembro Fantasma
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

  // ==========================================================================
  // MÓDULO VIII: SALUD SEXUAL & PSICOSOMÁTICA
  // ==========================================================================

  // 29. Inhibición Sexual (SIS)
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

  // 30. Disfunción Somatomorfa / Rendimiento
  DISFUNCION_SOM: [
    { id: 'DS_D1', mode: 'DIAGNOSTIC', paradigm: 'CPT_3D', name: '1. Rol de Espectador (Spectatoring) Evaluativo', bgAudio: 'BROWN_NOISE', script: 'Mide la autoobservación crítica intrusiva que interrumpe la respuesta fisiológica espontánea.' },
    { id: 'DS_D2', mode: 'DIAGNOSTIC', paradigm: 'BART_3D', name: '2. Taquicardia y Ansiedad de Desempeño', bgAudio: 'TENSION_DRUM', script: 'Evalúa el pico de estrés simpático provocado por la expectativa de evaluación o fallo.' },
    { id: 'DS_D3', mode: 'DIAGNOSTIC', paradigm: 'N_BACK_3D', name: '3. Parálisis de la Respuesta Refleja Genital', bgAudio: 'BETA_WAVES', script: 'Registra la desconexión entre el deseo subjetivo y la respuesta vascular autónoma.' },
    { id: 'DS_D4', mode: 'DIAGNOSTIC', paradigm: 'CHOICE_3D', name: '4. Pensamientos Automáticos de Fracaso', bgAudio: 'HEARTBEAT', script: 'Analiza la intrusión de profecías autorrealizadas de disfunción durante el encuentro.' },
    { id: 'DS_T1', mode: 'TREATMENT', paradigm: 'AAT_3D', name: '5. Ruptura de la Autoobservación en 3ra Persona', bgAudio: 'ALPHA_WAVES', script: 'Empuja el holograma del juez crítico fuera de tu campo visual para regresar a la experiencia presente.' },
    { id: 'DS_T2', mode: 'TREATMENT', paradigm: 'EMDR_3D', name: '6. Descatastrofización del Rendimiento Íntimo', bgAudio: 'BILATERAL_SWEEP', script: 'Movimiento sacádico para metabolizar el recuerdo de frustraciones pasadas.' },
    { id: 'DS_T3', mode: 'TREATMENT', paradigm: 'MIRROR_3D', name: '7. Reconciliación con la Autoimagen Somatosensorial', bgAudio: 'THETA_WAVES', script: 'Restablece una relación de afecto y disfrute con tu corporalidad frente al espejo.' },
    { id: 'DS_T4', mode: 'TREATMENT', paradigm: 'BIO_3D', name: '8. Relajación de Suelo Pélvico
