// ============================================================================
// AMIE CLINICAL COPILOT - MATRIZ MAESTRA CLÍNICA (30 TRASTORNOS • 240 PARADIGMAS)
// frontend/data/clinicalParadigmsMatrix.ts
// ============================================================================

export interface ClinicalExercise {
  id: string;
  mode: 'DIAGNOSTIC' | 'TREATMENT';
  paradigm: 'CPT_3D' | 'BART_3D' | 'N_BACK_3D' | 'CHOICE_3D' | 'AAT_3D' | 'EMDR_3D' | 'MIRROR_3D' | 'BIO_3D';
  name: string;
  bgAudio: string;
  script: string;
}

const ex = (
  id: string,
  mode: 'DIAGNOSTIC' | 'TREATMENT',
  paradigm: ClinicalExercise['paradigm'],
  name: string,
  bgAudio: string,
  script: string
): ClinicalExercise => ({ id, mode, paradigm, name, bgAudio, script });

export const CLINICAL_PARADIGMS_MAP: Record<string, ClinicalExercise[]> = {
  TDAH: [
    ex('TDAH_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Conners CPT: Freno Go/No-Go', 'BROWN_NOISE', 'Dispara únicamente a las esferas verdes y suprime el disparo ante las rojas.'),
    ex('TDAH_D2', 'DIAGNOSTIC', 'BART_3D', '2. Búsqueda de Estimulación (BART)', 'TENSION_DRUM', 'Bombea el globo para acumular puntos o plántate antes de que explote.'),
    ex('TDAH_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Memoria de Trabajo Visuoespacial', 'BETA_WAVES', 'Memoriza la secuencia espacial de los cubos y márcalos en orden.'),
    ex('TDAH_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Flexibilidad y Cambio de Criterio', 'HEARTBEAT', 'Adapta tu elección con rapidez cuando el sistema cambie la regla.'),
    ex('TDAH_T1', 'TREATMENT', 'AAT_3D', '5. Resistencia a Distractores (AAT)', 'ALPHA_WAVES', 'Empuja con el láser los distractores periféricos para blindar tu foco.'),
    ex('TDAH_T2', 'TREATMENT', 'EMDR_3D', '6. Integración Sacádica Interhemisférica', 'BILATERAL_SWEEP', 'Sigue la luz rítmica horizontal con tus ojos sin mover la cabeza.'),
    ex('TDAH_T3', 'TREATMENT', 'MIRROR_3D', '7. Coordinación Bimanual Somatomotora', 'THETA_WAVES', 'Sincroniza ambos mandos con el avatar para regular tu control postural.'),
    ex('TDAH_T4', 'TREATMENT', 'BIO_3D', '8. Modulación de Hiperactividad Basal', 'DELTA_WAVES', 'Acompasa tu respiración con el loto para disminuir la sobreactivación motriz.')
  ],
  TEA_1: [
    ex('TEA1_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Reconocimiento de Microexpresiones', 'BROWN_NOISE', 'Identifica la emoción sutil e impacta en la esfera correspondiente.'),
    ex('TEA1_D2', 'DIAGNOSTIC', 'BART_3D', '2. Tolerancia a la Ambigüedad Social', 'TENSION_DRUM', 'Registra tu adaptación ante cambios imprevistos en el entorno.'),
    ex('TEA1_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Memoria de Claves Pragmáticas', 'BETA_WAVES', 'Memoriza la secuencia de gestos y claves sociales espaciales.'),
    ex('TEA1_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Teoría de la Mente en Escenario 3D', 'HEARTBEAT', 'Elige la opción que prediga la intención del interlocutor virtual.'),
    ex('TEA1_T1', 'TREATMENT', 'AAT_3D', '5. Desensibilización al Contacto Visual', 'ALPHA_WAVES', 'Sostén la mirada hacia el centro mientras apartas estímulos distractores.'),
    ex('TEA1_T2', 'TREATMENT', 'EMDR_3D', '6. Integración de Sobrecarga Interpersonal', 'BILATERAL_SWEEP', 'Sigue el barrido ocular para reducir la fatiga tras la interacción social.'),
    ex('TEA1_T3', 'TREATMENT', 'MIRROR_3D', '7. Modelado de Neuronas Espejo', 'THETA_WAVES', 'Imita las posturas del avatar para estimular la sintonía cinemática.'),
    ex('TEA1_T4', 'TREATMENT', 'BIO_3D', '8. Rescate Vagal por Meltdown Social', 'DELTA_WAVES', 'Respira con el núcleo armónico para apaciguar la sobrecarga sensorial.')
  ],
  TEA_2_3: [
    ex('TEA2_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Reactividad Multisensorial', 'BROWN_NOISE', 'Mide el umbral de respuesta ante variaciones lumínicas y sonoras.'),
    ex('TEA2_D2', 'DIAGNOSTIC', 'BART_3D', '2. Regulación ante Ruptura de Rutina', 'TENSION_DRUM', 'Evalúa la flexibilidad conductual cuando el patrón se interrumpe.'),
    ex('TEA2_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Fijación Atencional y Rigidez', 'BETA_WAVES', 'Registra la capacidad de desenganche visual entre diferentes objetos.'),
    ex('TEA2_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Discriminación de Pictogramas 3D', 'HEARTBEAT', 'Apunta al pictograma funcional requerido para evaluar comprensión.'),
    ex('TEA2_T1', 'TREATMENT', 'AAT_3D', '5. Integración Sensorial Háptica Segura', 'ALPHA_WAVES', 'Interactúa con los orbes para graduar la tolerancia táctil y cinemática.'),
    ex('TEA2_T2', 'TREATMENT', 'EMDR_3D', '6. Estabilización Sacádica Suave', 'BILATERAL_SWEEP', 'Sigue la luz suave para calmar la dispersión y agitación visual.'),
    ex('TEA2_T3', 'TREATMENT', 'MIRROR_3D', '7. Reducción de Estereotipias Motoras', 'THETA_WAVES', 'Sincroniza tus mandos con el avatar para organizar el movimiento.'),
    ex('TEA2_T4', 'TREATMENT', 'BIO_3D', '8. Enraizamiento y Confort Acústico', 'DELTA_WAVES', 'Inhala y exhala con el manto lumínico para inducir seguridad profunda.')
  ],
  ALZHEIMER: [
    ex('ALZ_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Reconocimiento de Objetos Diarios', 'BROWN_NOISE', 'Señala los estímulos familiares e ignora los distractores.'),
    ex('ALZ_D2', 'DIAGNOSTIC', 'BART_3D', '2. Juicio y Prudencia Ejecutiva', 'TENSION_DRUM', 'Evalúa la toma de decisiones prudente antes de perder los puntos.'),
    ex('ALZ_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Orientación Topográfica Espacial', 'BETA_WAVES', 'Recuerda el camino señalado por los cubos luminosos en el espacio.'),
    ex('ALZ_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Memoria Episódica Inmediata', 'HEARTBEAT', 'Identifica cuál de los dos paneles corresponde a la clave inicial.'),
    ex('ALZ_T1', 'TREATMENT', 'AAT_3D', '5. Reentrenamiento de Praxias Cotidianas', 'ALPHA_WAVES', 'Alcanza y ordena los elementos virtuales para ejercitar las praxias.'),
    ex('ALZ_T2', 'TREATMENT', 'EMDR_3D', '6. Estimulación Temporoparietal Bilateral', 'BILATERAL_SWEEP', 'Rastreo visual rítmico para activar las redes de asociación cortical.'),
    ex('ALZ_T3', 'TREATMENT', 'MIRROR_3D', '7. Reafirmación del Esquema Corporal', 'THETA_WAVES', 'Mueve tus brazos frente al avatar para preservar la somatognosia.'),
    ex('ALZ_T4', 'TREATMENT', 'BIO_3D', '8. Terapia de Reminiscencia y Calma', 'DELTA_WAVES', 'Respira pausadamente para reducir la agitación y ansiedad.')
  ],
  PARKINSON: [
    ex('PK_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Cuantificación de Temblor a 90Hz', 'BROWN_NOISE', 'Sostén el puntero láser fijo sobre el centro para medir micro-oscilaciones.'),
    ex('PK_D2', 'DIAGNOSTIC', 'BART_3D', '2. Bradicinesia e Inicio de Movimiento', 'TENSION_DRUM', 'Acciona el gatillo ante la señal para registrar velocidad de iniciación motora.'),
    ex('PK_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Planificación Motora Bimanual', 'BETA_WAVES', 'Ejecuta la secuencia alternando ambos controles en el espacio 3D.'),
    ex('PK_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Detección de Bloqueo Motor (Freezing)', 'HEARTBEAT', 'Alterna rápido entre ambos paneles para detectar pausas de congelamiento.'),
    ex('PK_T1', 'TREATMENT', 'AAT_3D', '5. Terapia de Amplitud (LSVT BIG VR)', 'ALPHA_WAVES', 'Extiende el brazo con máxima amplitud para empujar el holograma.'),
    ex('PK_T2', 'TREATMENT', 'EMDR_3D', '6. Pistas Visuales Rítmicas (Visual Cues)', 'BILATERAL_SWEEP', 'Sigue el marcapasos visual para destrabar el ritmo de los ganglios basales.'),
    ex('PK_T3', 'TREATMENT', 'MIRROR_3D', '7. Reentrenamiento Espejo Propioceptivo', 'THETA_WAVES', 'Imita la simetría postural del avatar para compensar el temblor.'),
    ex('PK_T4', 'TREATMENT', 'BIO_3D', '8. Relajación de Rigidez Muscular', 'DELTA_WAVES', 'Respira profundamente para disminuir la hipertonía muscular.')
  ],
  DEPRESION: [
    ex('DEP_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Vigilancia y Retardo Psicomotor', 'BROWN_NOISE', 'Evalúa la velocidad psicomotora y la constancia atencional.'),
    ex('DEP_D2', 'DIAGNOSTIC', 'BART_3D', '2. Apatía ante Ganancia/Pérdida', 'TENSION_DRUM', 'Mide la respuesta motivacional frente a la acumulación de recompensas.'),
    ex('DEP_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Medición de Niebla Mental y Fatiga', 'BETA_WAVES', 'Cuantifica la memoria operativa bajo fatiga cognitiva.'),
    ex('DEP_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Sesgo Pesimista Decisional', 'HEARTBEAT', 'Registra la tendencia a anticipar pérdidas ante escenarios inciertos.'),
    ex('DEP_T1', 'TREATMENT', 'AAT_3D', '5. Activación Conductual y Acercamiento', 'ALPHA_WAVES', 'Interactúa activamente con los estímulos luminosos para romper la inercia.'),
    ex('DEP_T2', 'TREATMENT', 'EMDR_3D', '6. Desbloqueo Melancólico Sacádico', 'BILATERAL_SWEEP', 'Rastreo bilateral continuo para interrumpir los bucles de rumiación.'),
    ex('DEP_T3', 'TREATMENT', 'MIRROR_3D', '7. Reconexión y Antianhedonia Somática', 'THETA_WAVES', 'Reactiva la presencia corporal frente al avatar guía.'),
    ex('DEP_T4', 'TREATMENT', 'BIO_3D', '8. Rescate Vagal y Elevación del Ánimo', 'DELTA_WAVES', 'Oxigenación profunda para elevar la variabilidad cardíaca.')
  ],
  BIPOLAR: [
    ex('BIP_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Velocidad Motora en Fase Acelerada', 'BROWN_NOISE', 'Mide la precipitación motora y los errores de comisión impulsiva.'),
    ex('BIP_D2', 'DIAGNOSTIC', 'BART_3D', '2. Asunción Temeraria de Riesgo', 'TENSION_DRUM', 'Evalúa la desinhibición frente al riesgo de explosión del globo.'),
    ex('BIP_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Distraibilidad Ejecutiva Maníaca', 'BETA_WAVES', 'Mide la estabilidad de la memoria de trabajo ante estímulos rápidos.'),
    ex('BIP_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Dilema Decisional Impulsivo', 'HEARTBEAT', 'Registra la latencia de reflexión antes de elegir entre dos caminos.'),
    ex('BIP_T1', 'TREATMENT', 'AAT_3D', '5. Freno de Impulso y Retención', 'ALPHA_WAVES', 'Pausa dos segundos antes de empujar el estímulo para entrenar el freno frontal.'),
    ex('BIP_T2', 'TREATMENT', 'EMDR_3D', '6. Estabilización Afectiva Interhemisférica', 'BILATERAL_SWEEP', 'Sigue la luz a velocidad moderada para regular el ritmo central.'),
    ex('BIP_T3', 'TREATMENT', 'MIRROR_3D', '7. Enraizamiento ante Agitación Motora', 'THETA_WAVES', 'Iguala tus movimientos con la calma postural del avatar.'),
    ex('BIP_T4', 'TREATMENT', 'BIO_3D', '8. Modulación Parasimpática Basal', 'DELTA_WAVES', 'Exhala prolongadamente para reducir la activación simpática.')
  ],
  DISTIMIA: [
    ex('DIS_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Lentificación Cognitiva Crónica', 'BROWN_NOISE', 'Mide la persistencia de tiempos de reacción prolongados.'),
    ex('DIS_D2', 'DIAGNOSTIC', 'BART_3D', '2. Perseveración y Renuncia Temprana', 'TENSION_DRUM', 'Evalúa el abandono anticipado ante tareas de esfuerzo continuo.'),
    ex('DIS_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Fatiga Atencional Sostenida', 'BETA_WAVES', 'Registra el declive de precisión a lo largo de la secuencia espacial.'),
    ex('DIS_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Indefensión Aprendida Decisional', 'HEARTBEAT', 'Mide la vacilación pasiva frente a la toma de decisiones simples.'),
    ex('DIS_T1', 'TREATMENT', 'AAT_3D', '5. Refuerzo de Autoeficacia Motora', 'ALPHA_WAVES', 'Desplaza los obstáculos virtuales reafirmando tu capacidad de agencia.'),
    ex('DIS_T2', 'TREATMENT', 'EMDR_3D', '6. Atenuación de Rumiación Negativa', 'BILATERAL_SWEEP', 'Sigue la esfera bilateral para despejar el diálogo interno pesimista.'),
    ex('DIS_T3', 'TREATMENT', 'MIRROR_3D', '7. Reactivación Propioceptiva Diaria', 'THETA_WAVES', 'Coordina tu postura con el avatar para sacudir el letargo físico.'),
    ex('DIS_T4', 'TREATMENT', 'BIO_3D', '8. Coherencia Cardíaca 0.1Hz Antidistímica', 'DELTA_WAVES', 'Sincroniza tu respiración para revitalizar el tono autonómico.')
  ],
  CICLOTIMIA: [
    ex('CIC_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Fluctuación de Latencias Motoras', 'BROWN_NOISE', 'Mide la dispersión e irregularidad en los tiempos de disparo.'),
    ex('CIC_D2', 'DIAGNOSTIC', 'BART_3D', '2. Oscilación de Tolerancia al Riesgo', 'TENSION_DRUM', 'Registra los cambios bruscos de prudencia a temeridad entre ensayos.'),
    ex('CIC_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Resiliencia Ejecutiva ante el Error', 'BETA_WAVES', 'Evalúa la recuperación del foco tras cometer un fallo en la serie.'),
    ex('CIC_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Inestabilidad de Preferencias', 'HEARTBEAT', 'Analiza los cambios erráticos de criterio durante el dilema.'),
    ex('CIC_T1', 'TREATMENT', 'AAT_3D', '5. Neutralización de Reactividad', 'ALPHA_WAVES', 'Mantén un ritmo constante al apartar los estímulos sin acelerarte.'),
    ex('CIC_T2', 'TREATMENT', 'EMDR_3D', '6. Estabilización de Polaridad Afectiva', 'BILATERAL_SWEEP', 'Rastreo ocular constante para suavizar los picos emocionales.'),
    ex('CIC_T3', 'TREATMENT', 'MIRROR_3D', '7. Coherencia Kinestésica Continua', 'THETA_WAVES', 'Sostén una cadencia armónica y predecible frente al avatar.'),
    ex('CIC_T4', 'TREATMENT', 'BIO_3D', '8. Respiración de Equilibrio Vagal', 'DELTA_WAVES', 'Respira con el loto manteniendo una amplitud uniforme y serena.')
  ],
  TEPT: [
    ex('TEPT_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Sobresalto Autonómico ante Triggers', 'BROWN_NOISE', 'Mide la hiperreactividad motora ante estímulos súbitos.'),
    ex('TEPT_D2', 'DIAGNOSTIC', 'BART_3D', '2. Intolerancia a la Amenaza Inminente', 'TENSION_DRUM', 'Evalúa la respuesta de alerta frente a la tensión acumulada.'),
    ex('TEPT_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Interferencia por Reexperimentación', 'BETA_WAVES', 'Mide la retención visuoespacial bajo estrés evocador.'),
    ex('TEPT_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Respuesta: Lucha vs. Congelamiento', 'HEARTBEAT', 'Registra si predomina la precipitación defensiva o la parálisis.'),
    ex('TEPT_T1', 'TREATMENT', 'AAT_3D', '5. Externalización de la Huella Traumática', 'ALPHA_WAVES', 'Empuja el holograma lejos de ti delimitando tu espacio de seguridad.'),
    ex('TEPT_T2', 'TREATMENT', 'EMDR_3D', '6. Protocolo EMDR 8 Fases Reprocesamiento', 'BILATERAL_SWEEP', 'Sigue la esfera bilateral para desensibilizar la memoria traumática.'),
    ex('TEPT_T3', 'TREATMENT', 'MIRROR_3D', '7. Anclaje Sensoriomotor en el Presente', 'THETA_WAVES', 'Reconoce tu cuerpo en el aquí y ahora frente al avatar guía.'),
    ex('TEPT_T4', 'TREATMENT', 'BIO_3D', '8. Desactivación de Alerta Amigdalina', 'DELTA_WAVES', 'Inhala seguridad y exhala la hipervigilancia siguiendo el loto.')
  ],
  TRAUMA_COMPLEJO: [
    ex('TC_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Desregulación ante Señales Hostiles', 'BROWN_NOISE', 'Evalúa el bloqueo atencional frente a estímulos de rechazo.'),
    ex('TC_D2', 'DIAGNOSTIC', 'BART_3D', '2. Umbral de Sumisión ante Presión', 'TENSION_DRUM', 'Mide la renuncia defensiva cuando aumenta la exigencia del entorno.'),
    ex('TC_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Intrusión de Esquemas de Desamparo', 'BETA_WAVES', 'Cuantifica la continuidad ejecutiva frente a distractores emocionales.'),
    ex('TC_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Dilema de Apego y Confianza', 'HEARTBEAT', 'Evalúa la latencia al elegir entre aproximación segura o resguardo.'),
    ex('TC_T1', 'TREATMENT', 'AAT_3D', '5. Distanciamiento de Intrusiones', 'ALPHA_WAVES', 'Aparta con firmeza los hologramas invasivos reafirmando tus límites.'),
    ex('TC_T2', 'TREATMENT', 'EMDR_3D', '6. Reprocesamiento de Trauma Relacional', 'BILATERAL_SWEEP', 'Sigue la luz bilateral para integrar memorias de vulnerabilidad.'),
    ex('TC_T3', 'TREATMENT', 'MIRROR_3D', '7. Reconstrucción de Límites Corporales', 'THETA_WAVES', 'Fortalece tu soberanía postural frente al avatar de acompañamiento.'),
    ex('TC_T4', 'TREATMENT', 'BIO_3D', '8. Regulación de Ventana de Tolerancia', 'DELTA_WAVES', 'Respira suavemente para habitar tu zona de calma autonómica.')
  ],
  DESPERSONALIZACION: [
    ex('DP_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Sentido de Agencia en Movimiento 6DoF', 'BROWN_NOISE', 'Mide la sincronía entre tu acción motora y el impacto visual.'),
    ex('DP_D2', 'DIAGNOSTIC', 'BART_3D', '2. Micro-Oscilación Propioceptiva', 'TENSION_DRUM', 'Evalúa el control fino del pulso durante el inflado progresivo.'),
    ex('DP_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Anclaje de Memoria Espacial', 'BETA_WAVES', 'Ubica las coordenadas tridimensionales combatiendo la irrealidad.'),
    ex('DP_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Embotamiento y Latencia Decisional', 'HEARTBEAT', 'Mide el tiempo de conexión volitiva al elegir entre dos estímulos.'),
    ex('DP_T1', 'TREATMENT', 'AAT_3D', '5. Anclaje Táctil-Visual Bimanual', 'ALPHA_WAVES', 'Impacta los orbes percibiendo la vibración física real en tus manos.'),
    ex('DP_T2', 'TREATMENT', 'EMDR_3D', '6. Fijación Sacádica Focal', 'BILATERAL_SWEEP', 'Rastrea la esfera luminosa para disipar la neblina disociativa.'),
    ex('DP_T3', 'TREATMENT', 'MIRROR_3D', '7. Reconexión Somática en Espejo', 'THETA_WAVES', 'Observa y mueve tus brazos junto al avatar sintiendo tu peso corporal.'),
    ex('DP_T4', 'TREATMENT', 'BIO_3D', '8. Biofeedback de Presencia Somática', 'DELTA_WAVES', 'Siente el aire entrar en tus pulmones anclándote al momento presente.')
  ],
  VACIO_EXISTENCIAL: [
    ex('LOG_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Diagnóstico de Hiperreflexión (Frankl)', 'BROWN_NOISE', 'Fija tu atención en los objetivos externos sin caer en la autoobservación.'),
    ex('LOG_D2', 'DIAGNOSTIC', 'BART_3D', '2. Persistencia Teleológica y Sentido', 'TENSION_DRUM', 'Sostén tu empeño constructivo frente a la incertidumbre del entorno.'),
    ex('LOG_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Jerarquía de Valores de Sentido', 'BETA_WAVES', 'Retén y ordena los símbolos de valores creativos, vivenciales y actitudinales.'),
    ex('LOG_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Dilema Trágico: Destino vs. Actitud', 'HEARTBEAT', 'Ante una circunstancia inmutable, elige la actitud libre con la que respondes.'),
    ex('LOG_T1', 'TREATMENT', 'AAT_3D', '5. Derreflexión: Desenganche del Síntoma', 'ALPHA_WAVES', 'Empuja la rumiación egocéntrica hacia afuera para abrirte al mundo.'),
    ex('LOG_T2', 'TREATMENT', 'EMDR_3D', '6. Intención Paradójica Inmersiva', 'BILATERAL_SWEEP', 'Enfrenta con humor y desapego el temor anticipatorio mientras sigues la luz.'),
    ex('LOG_T3', 'TREATMENT', 'MIRROR_3D', '7. Diálogo Socrático con la Conciencia', 'THETA_WAVES', 'Mírate frente al avatar y reafirma tu responsabilidad ante la vida.'),
    ex('LOG_T4', 'TREATMENT', 'BIO_3D', '8. Anclaje de Sentido y Trascendencia', 'DELTA_WAVES', 'Respira profundamente conectando con tu propósito vital trascendente.')
  ],
  FOBIA_SOCIAL: [
    ex('FS_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Dot-Probe de Miradas en Multitud', 'BROWN_NOISE', 'Enfoca los objetivos neutros sin quedar atrapado en el escrutinio ajeno.'),
    ex('FS_D2', 'DIAGNOSTIC', 'BART_3D', '2. Tolerancia a la Exposición Pública', 'TENSION_DRUM', 'Mantén tu desempeño frente al auditorio midiendo tu umbral de ansiedad.'),
    ex('FS_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Interferencia por Autoevaluación', 'BETA_WAVES', 'Resuelve la secuencia espacial ignorando el temor al ridículo.'),
    ex('FS_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Test: Afrontamiento vs. Fuga Social', 'HEARTBEAT', 'Elige entre tomar la palabra o recurrir a una conducta de evitación.'),
    ex('FS_T1', 'TREATMENT', 'AAT_3D', '5. Extinción de la Evitación Social (AAT)', 'ALPHA_WAVES', 'Rechaza el impulso de esconderte empujando las barreras de temor.'),
    ex('FS_T2', 'TREATMENT', 'EMDR_3D', '6. Desensibilización de la Vergüenza', 'BILATERAL_SWEEP', 'Sigue la luz bilateral para disolver el temor al juicio externo.'),
    ex('FS_T3', 'TREATMENT', 'MIRROR_3D', '7. Reafirmación Postural de Seguridad', 'THETA_WAVES', 'Sostén la presencia tranquila frente al avatar interlocutor.'),
    ex('FS_T4', 'TREATMENT', 'BIO_3D', '8. Coherencia Vagal Anti-Ansiedad Social', 'DELTA_WAVES', 'Respira a 0.1 Hz para calmar el rubor y la taquicardia social.')
  ],
  PANICO: [
    ex('PAN_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Provocación Interoceptiva Virtual', 'BROWN_NOISE', 'Mantiene el foco ejecutivo mientras escuchas el latido acelerado.'),
    ex('PAN_D2', 'DIAGNOSTIC', 'BART_3D', '2. Umbral de Escape Agorafóbico', 'TENSION_DRUM', 'Registra tu tolerancia a la tensión interna antes de buscar una salida.'),
    ex('PAN_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Rumiación Somática de Taquicardia', 'BETA_WAVES', 'Completa el reto cognitivo sin dejarte distraer por las sensaciones físicas.'),
    ex('PAN_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Catastrofismo ante Síntomas Físicos', 'HEARTBEAT', 'Discrimina entre una alarma real y una activación autonómica benigna.'),
    ex('PAN_T1', 'TREATMENT', 'AAT_3D', '5. Exposición Interoceptiva Controlada', 'ALPHA_WAVES', 'Aparta el miedo al síntoma demostrando que tu cuerpo está seguro.'),
    ex('PAN_T2', 'TREATMENT', 'EMDR_3D', '6. Desensibilización del Ataque de Pánico', 'BILATERAL_SWEEP', 'Sigue la esfera bilateral para apagar el fuego de la amígdala.'),
    ex('PAN_T3', 'TREATMENT', 'MIRROR_3D', '7. Arraigo Corporal Anti-Vértigo', 'THETA_WAVES', 'Estabiliza tu eje visual y postural junto al avatar guía.'),
    ex('PAN_T4', 'TREATMENT', 'BIO_3D', '8. Reentrenamiento Anti-Hiperventilación', 'DELTA_WAVES', 'Inhala en 4 segundos y exhala en 6 para restaurar el CO2 sanguíneo.')
  ],
  TOC: [
    ex('TOC_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Latencia de Verificación Compulsiva', 'BROWN_NOISE', 'Responde una sola vez sin re-chequear compulsivamente el objetivo.'),
    ex('TOC_D2', 'DIAGNOSTIC', 'BART_3D', '2. Intolerancia a la Incertidumbre', 'TENSION_DRUM', 'Evalúa tu capacidad de habitar la duda sin cerrar prematuramente.'),
    ex('TOC_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Interferencia por Ideas Intrusivas', 'BETA_WAVES', 'Sostén la memoria operativa dejando pasar los pensamientos parásitos.'),
    ex('TOC_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Dificultad de Desenganche Atencional', 'HEARTBEAT', 'Toma una decisión rápida aceptando que no existe certeza absoluta.'),
    ex('TOC_T1', 'TREATMENT', 'AAT_3D', '5. Exposición con Prevención de Respuesta', 'ALPHA_WAVES', 'Permanece frente al estímulo disparador absteniéndote de ejecutar el ritual.'),
    ex('TOC_T2', 'TREATMENT', 'EMDR_3D', '6. Desensibilización de la Obsesión', 'BILATERAL_SWEEP', 'Sigue el barrido ocular quitándole peso de realidad a la intrusión.'),
    ex('TOC_T3', 'TREATMENT', 'MIRROR_3D', '7. Aceptación de la Imperfección 3D', 'THETA_WAVES', 'Reposa tus brazos frente al avatar tolerando la asimetría del entorno.'),
    ex('TOC_T4', 'TREATMENT', 'BIO_3D', '8. Freno Autonómico al Ritual Compulsivo', 'DELTA_WAVES', 'Respira con el loto dejando que la ansiedad baje sin hacer la compulsión.')
  ],
  TAG: [
    ex('TAG_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Tasa de Falsas Alarmas en Neutro', 'BROWN_NOISE', 'Discrimina con calma sin disparar ante estímulos inocuos.'),
    ex('TAG_D2', 'DIAGNOSTIC', 'BART_3D', '2. Rumiación Anticipatoria Catastrófica', 'TENSION_DRUM', 'Mide el impacto de la preocupación futura sobre tu decisión presente.'),
    ex('TAG_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Microtemblor por Tensión Muscular', 'BETA_WAVES', 'Registra la fatiga ejecutiva producida por el estado de alerta crónico.'),
    ex('TAG_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Parálisis por Análisis Excesivo', 'HEARTBEAT', 'Resuelve el dilema evitando estancarte en la rumiación indecisa.'),
    ex('TAG_T1', 'TREATMENT', 'AAT_3D', '5. Mindfulness Inmersivo Anti-Preocupación', 'ALPHA_WAVES', 'Despide cada preocupación futura volviendo una y otra vez al presente.'),
    ex('TAG_T2', 'TREATMENT', 'EMDR_3D', '6. Sincronización Ocular Sacádica', 'BILATERAL_SWEEP', 'Rastreo horizontal para silenciar el ruido mental hiperactivo.'),
    ex('TAG_T3', 'TREATMENT', 'MIRROR_3D', '7. Relajación Muscular Progresiva en VR', 'THETA_WAVES', 'Suelta la tensión de hombros y brazos frente al avatar en calma.'),
    ex('TAG_T4', 'TREATMENT', 'BIO_3D', '8. Coherencia Dual (GSR + HRV)', 'DELTA_WAVES', 'Acompasa tu aliento con el loto hasta aquietar tu ritmo basal.')
  ],
  ADICCION_SUST: [
    ex('AD_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Approach Bias hacia Parafernalia', 'BROWN_NOISE', 'Mide el sesgo de captura atencional frente a señales de consumo.'),
    ex('AD_D2', 'DIAGNOSTIC', 'BART_3D', '2. Miopía al Futuro y Riesgo (BART)', 'TENSION_DRUM', 'Evalúa la búsqueda de recompensa inmediata ignorando consecuencias.'),
    ex('AD_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Interferencia Ejecutiva por Craving', 'BETA_WAVES', 'Sostén la memoria de trabajo frente a estímulos desencadenantes.'),
    ex('AD_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Gratificación Inmediata vs. Diferida', 'HEARTBEAT', 'Elige entre el alivio fugaz o tu proyecto de salud a largo plazo.'),
    ex('AD_T1', 'TREATMENT', 'AAT_3D', '5. Rechazo Motor Activo (AAT)', 'ALPHA_WAVES', 'Empuja con fuerza el holograma de la sustancia lejos de tu alcance.'),
    ex('AD_T2', 'TREATMENT', 'EMDR_3D', '6. Desensibilización de Disparadores', 'BILATERAL_SWEEP', 'Sigue la luz bilateral para extinguir el condicionamiento pavloviano.'),
    ex('AD_T3', 'TREATMENT', 'MIRROR_3D', '7. Autoimagen en Sobriedad y Dominio', 'THETA_WAVES', 'Reafirma tu identidad libre de ataduras frente al avatar.'),
    ex('AD_T4', 'TREATMENT', 'BIO_3D', '8. Urge-Surfing con Biofeedback Vagal', 'DELTA_WAVES', 'Surfea la ola del deseo con tu respiración hasta que pierda fuerza.')
  ],
  LUDOPATIA: [
    ex('LUD_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Iowa Gambling Task 3D en VR', 'BROWN_NOISE', 'Evalúa la toma de decisiones bajo riesgo de pérdida acumulativa.'),
    ex('LUD_D2', 'DIAGNOSTIC', 'BART_3D', '2. Caza de Pérdidas (Loss Chasing)', 'TENSION_DRUM', 'Mide la persistencia temeraria tras sufrir explosiones previas.'),
    ex('LUD_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Reactividad al Casi-Acierto', 'BETA_WAVES', 'Evalúa la distorsión cognitiva ante secuencias que simulan premios.'),
    ex('LUD_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Ilusión de Control en el Azar', 'HEARTBEAT', 'Discrimina entre destreza real y eventos puramente aleatorios.'),
    ex('LUD_T1', 'TREATMENT', 'AAT_3D', '5. Bloqueo Motor de la Apuesta', 'ALPHA_WAVES', 'Aparta las señales de juego desactivando el automatismo motor.'),
    ex('LUD_T2', 'TREATMENT', 'EMDR_3D', '6. Extinción de Estímulos de Casino', 'BILATERAL_SWEEP', 'Rastreo sacádico para neutralizar la fascinación por luces y premios.'),
    ex('LUD_T3', 'TREATMENT', 'MIRROR_3D', '7. Reestructuración de Falacias del Azar', 'THETA_WAVES', 'Recupera la sobriedad financiera y el juicio crítico frente al avatar.'),
    ex('LUD_T4', 'TREATMENT', 'BIO_3D', '8. Tolerancia a la Abstinencia Dopaminérgica', 'DELTA_WAVES', 'Respira profundamente disipando la urgencia por apostar.')
  ],
  ATRACON: [
    ex('ATR_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Sesgo Atencional Hipercalórico', 'BROWN_NOISE', 'Mide la impulsividad de disparo ante señales alimentarias.'),
    ex('ATR_D2', 'DIAGNOSTIC', 'BART_3D', '2. Pérdida de Freno Ingestivo', 'TENSION_DRUM', 'Evalúa el límite de saciedad y detención voluntaria en la tarea.'),
    ex('ATR_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Hambre Emocional vs. Ejecutiva', 'BETA_WAVES', 'Mantén la concentración operativa bajo malestar afectivo.'),
    ex('ATR_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Elección Impulsiva vs. Nutrición', 'HEARTBEAT', 'Analiza el tiempo de decisión frente a recompensas comestibles.'),
    ex('ATR_T1', 'TREATMENT', 'AAT_3D', '5. Rechazo Motor de Disparadores (AAT)', 'ALPHA_WAVES', 'Aleja el estímulo de atracón fortaleciendo tu corteza prefrontal.'),
    ex('ATR_T2', 'TREATMENT', 'EMDR_3D', '6. Desensibilización de Ansiedad Oral', 'BILATERAL_SWEEP', 'Sigue la luz para calmar el vacío ansioso que precede al atracón.'),
    ex('ATR_T3', 'TREATMENT', 'MIRROR_3D', '7. Enraizamiento Somático de Saciedad', 'THETA_WAVES', 'Reconcilia tu esquema corporal frente al avatar sin juicios severos.'),
    ex('ATR_T4', 'TREATMENT', 'BIO_3D', '8. Regulación Vagal Post-Ingesta', 'DELTA_WAVES', 'Respira con serenidad disolviendo la culpa y la tensión digestiva.')
  ],
  CLEPTOMANIA: [
    ex('CLEP_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Tensión Previa a la Apropiación', 'BROWN_NOISE', 'Mide el fallo del freno Go/No-Go ante objetos tentadores.'),
    ex('CLEP_D2', 'DIAGNOSTIC', 'BART_3D', '2. Escalada de Excitación y Riesgo', 'TENSION_DRUM', 'Evalúa la búsqueda de adrenalina asociada a la transgresión.'),
    ex('CLEP_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Intrusión del Impulso de Posesión', 'BETA_WAVES', 'Sostén la tarea cognitiva sin ceder a la distracción periférica.'),
    ex('CLEP_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Juicio Ético bajo Presión Impulsiva', 'HEARTBEAT', 'Elige el respeto al límite ajeno por encima de la descarga inmediata.'),
    ex('CLEP_T1', 'TREATMENT', 'AAT_3D', '5. Freno Háptico de Urgencia Motora', 'ALPHA_WAVES', 'Empuja lejos el objeto prohibido entrenando la inhibición de agarre.'),
    ex('CLEP_T2', 'TREATMENT', 'EMDR_3D', '6. Prevención de Respuesta en Escenario', 'BILATERAL_SWEEP', 'Rastreo ocular para extinguir la tensión acumulativa del impulso.'),
    ex('CLEP_T3', 'TREATMENT', 'MIRROR_3D', '7. Autodominio y Conciencia Moral', 'THETA_WAVES', 'Mantén las manos quietas y visibles en sintonía con el avatar.'),
    ex('CLEP_T4', 'TREATMENT', 'BIO_3D', '8. Disipación de Tensión Autonómica', 'DELTA_WAVES', 'Descarga la adrenalina mediante exhalaciones lentas y profundas.')
  ],
  TLP: [
    ex('TLP_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Hipersensibilidad al Rechazo', 'BROWN_NOISE', 'Mide la desregulación motora ante estímulos de ambigüedad afectiva.'),
    ex('TLP_D2', 'DIAGNOSTIC', 'BART_3D', '2. Impulsividad en Crisis Disfórica', 'TENSION_DRUM', 'Evalúa el paso al acto impulsivo cuando sube la frustración.'),
    ex('TLP_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Continuidad Cognitiva bajo Estrés', 'BETA_WAVES', 'Mide la estabilidad ejecutiva frente a la amenaza de abandono.'),
    ex('TLP_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Escisión Decisional Todo o Nada', 'HEARTBEAT', 'Analiza la polarización extrema al evaluar opciones interpersonales.'),
    ex('TLP_T1', 'TREATMENT', 'AAT_3D', '5. Habilidades DBT: Tolerancia al Malestar', 'ALPHA_WAVES', 'Aparta el impulso autolesivo o destructivo ganando espacio mental.'),
    ex('TLP_T2', 'TREATMENT', 'EMDR_3D', '6. Desescalamiento de Pánico al Abandono', 'BILATERAL_SWEEP', 'Sigue la luz bilateral para amortiguar la tormenta emocional.'),
    ex('TLP_T3', 'TREATMENT', 'MIRROR_3D', '7. Integración de Identidad y Vínculo', 'THETA_WAVES', 'Permanece frente al avatar integrando calma y constancia objetal.'),
    ex('TLP_T4', 'TREATMENT', 'BIO_3D', '8. Enfriamiento Vagal en Crisis (TIPP)', 'DELTA_WAVES', 'Respira profundamente reduciendo el incendio simpático en segundos.')
  ],
  PSICOPATIA: [
    ex('PSI_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Frialdad Autonómica e Inhibición', 'BROWN_NOISE', 'Mide la precisión depredadora y la ausencia de sobresalto emocional.'),
    ex('PSI_D2', 'DIAGNOSTIC', 'BART_3D', '2. Insensibilidad al Castigo (BART)', 'TENSION_DRUM', 'Registra la persistencia temeraria tras el castigo o pérdida de puntos.'),
    ex('PSI_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Cálculo Frío y Memoria Operativa', 'BETA_WAVES', 'Evalúa la manipulación estratégica de variables visuoespaciales.'),
    ex('PSI_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Dilema Moral Utilitarista 3D', 'HEARTBEAT', 'Cuantifica la latencia en milisegundos ante decisiones de daño a terceros.'),
    ex('PSI_T1', 'TREATMENT', 'AAT_3D', '5. Freno Motor a la Dominancia Instrumental', 'ALPHA_WAVES', 'Detén la respuesta de agresión impositiva respetando el límite.'),
    ex('PSI_T2', 'TREATMENT', 'EMDR_3D', '6. Desescalamiento de Hostilidad', 'BILATERAL_SWEEP', 'Rastreo visual para reducir la fijación predatoria focalizada.'),
    ex('PSI_T3', 'TREATMENT', 'MIRROR_3D', '7. Entrenamiento de Neuronas Espejo', 'THETA_WAVES', 'Sincroniza tus gestos con el avatar para estimular resonancia motora.'),
    ex('PSI_T4', 'TREATMENT', 'BIO_3D', '8. Regulación de Consecuencias a Largo Plazo', 'DELTA_WAVES', 'Pausa reflexiva respiratoria antes de ejecutar cualquier acción.')
  ],
  NARCISISMO: [
    ex('NAR_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Reactividad Colérica ante el Fallo', 'BROWN_NOISE', 'Mide el aumento de errores tras recibir retroalimentación negativa.'),
    ex('NAR_D2', 'DIAGNOSTIC', 'BART_3D', '2. Sesgo de Grandiosidad e Inmunidad', 'TENSION_DRUM', 'Evalúa la creencia irracional de que el globo nunca explotará.'),
    ex('NAR_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Desatención Selectiva al Entorno', 'BETA_WAVES', 'Mide el rendimiento cuando la tarea no ofrece elogios extraordinarios.'),
    ex('NAR_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Vulnerabilidad Oculta ante la Crítica', 'HEARTBEAT', 'Registra la vacilación defensiva cuando el dilema expone límites.'),
    ex('NAR_T1', 'TREATMENT', 'AAT_3D', '5. Tolerancia a la Frustración y Límite', 'ALPHA_WAVES', 'Aleja la rabia narcisista aceptando las reglas igualitarias del entorno.'),
    ex('NAR_T2', 'TREATMENT', 'EMDR_3D', '6. Desescalamiento de Herida Egoica', 'BILATERAL_SWEEP', 'Sigue la luz para procesar la humillación sin atacar ni devaluar.'),
    ex('NAR_T3', 'TREATMENT', 'MIRROR_3D', '7. Reciprocidad y Simetría Interpersonal', 'THETA_WAVES', 'Sigue los movimientos del avatar en plano de igualdad, sin dominar.'),
    ex('NAR_T4', 'TREATMENT', 'BIO_3D', '8. Desinflamación del Orgullo Defensivo', 'DELTA_WAVES', 'Respira soltando la coraza de superioridad y tensión crónica.')
  ],
  HISTRIONICO: [
    ex('HIS_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Dependencia de Estímulo Externo', 'BROWN_NOISE', 'Mide la constancia atencional en tareas monótonas sin público.'),
    ex('HIS_D2', 'DIAGNOSTIC', 'BART_3D', '2. Expresividad Motora Exagerada', 'TENSION_DRUM', 'Evalúa la búsqueda dramática de emoción durante el inflado.'),
    ex('HIS_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Impresionabilidad y Dispersión', 'BETA_WAVES', 'Cuantifica el rigor cognitivo más allá de la intuición superficial.'),
    ex('HIS_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Sugestionabilidad en Dilemas', 'HEARTBEAT', 'Analiza la volatilidad del criterio propio frente a pistas externas.'),
    ex('HIS_T1', 'TREATMENT', 'AAT_3D', '5. Concentración Sobria sin Aplauso', 'ALPHA_WAVES', 'Completa el despeje espacial con movimientos precisos y contenidos.'),
    ex('HIS_T2', 'TREATMENT', 'EMDR_3D', '6. Regulación de Sobrecarga Dramática', 'BILATERAL_SWEEP', 'Sigue el punto lumínico aquietando la tormenta teatral afectiva.'),
    ex('HIS_T3', 'TREATMENT', 'MIRROR_3D', '7. Autenticidad Corporal en Silencio', 'THETA_WAVES', 'Conecta con el avatar desde la serenidad genuina y sin actuación.'),
    ex('HIS_T4', 'TREATMENT', 'BIO_3D', '8. Anclaje de Autovalidación Interna', 'DELTA_WAVES', 'Respira hacia tu propio centro sin buscar aprobación exterior.')
  ],
  HIPNO_ERICKSONIANA: [
    ex('HE_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Índice de Absorción Focal (Stanford)', 'THETA_WAVES', 'Fija la mirada en el centro midiendo tu capacidad de abstracción periférica.'),
    ex('HE_D2', 'DIAGNOSTIC', 'BART_3D', '2. Proyección de Resistencia Consciente', 'BROWN_NOISE', 'Observa en qué punto tu mente racional intenta tomar el control forzado.'),
    ex('HE_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Disociación por Sobrecarga Lógica', 'ALPHA_WAVES', 'Ocupa tu hemisferio izquierdo con los cubos mientras tu inconsciente se abre.'),
    ex('HE_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Respuesta Ideomotora Automática', 'HEARTBEAT', 'Deja que tu mano elija espontáneamente antes de razonar.'),
    ex('HE_T1', 'TREATMENT', 'AAT_3D', '5. Siembra de Metáforas Inmersivas 3D', 'DELTA_WAVES', 'Desplaza los símbolos permitiendo que tu mente inconsciente reorganice el cambio.'),
    ex('HE_T2', 'TREATMENT', 'EMDR_3D', '6. Inducción de Trance por Fijación Ocular', 'BILATERAL_SWEEP', 'Sigue el péndulo de luz hasta entrar en un trance profundo y reparador.'),
    ex('HE_T3', 'TREATMENT', 'MIRROR_3D', '7. Integración de Estados del Ego', 'THETA_WAVES', 'Observa al avatar e integra tus recursos internos dormidos.'),
    ex('HE_T4', 'TREATMENT', 'BIO_3D', '8. Profundización y Anclaje Posthipnótico', 'DELTA_WAVES', 'Con cada exhalación desciendes al santuario donde tu mente sana sin esfuerzo.')
  ],
  HIPNO_ANALGESIA: [
    ex('HA_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Mapeo Espacial del Dolor (EVA 3D)', 'BROWN_NOISE', 'Mide el secuestro atencional producido por la señal nociceptiva.'),
    ex('HA_D2', 'DIAGNOSTIC', 'BART_3D', '2. Hipervigilancia y Miedo al Movimiento', 'TENSION_DRUM', 'Evalúa la kinesiofobia y la anticipación aprensiva al dolor.'),
    ex('HA_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Capacidad de Distracción Analgésica', 'BETA_WAVES', 'Cuantifica cuánto disminuye el dolor al absorberte en la memoria 3D.'),
    ex('HA_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Catastrofismo vs. Modulación', 'HEARTBEAT', 'Registra la respuesta cognitiva inmediata frente a la molestia.'),
    ex('HA_T1', 'TREATMENT', 'AAT_3D', '5. Guantelete de Anestesia (Glove VR)', 'ALPHA_WAVES', 'Siente cómo una frescura azul anestésica recubre tu mano virtual y apaga el dolor.'),
    ex('HA_T2', 'TREATMENT', 'EMDR_3D', '6. Transformación Sensorial Térmica', 'BILATERAL_SWEEP', 'Sigue la luz mientras el ardor se transforma en una brisa fría y sedante.'),
    ex('HA_T3', 'TREATMENT', 'MIRROR_3D', '7. Modulación Descendente Cortical', 'THETA_WAVES', 'Contempla el cuerpo libre y flexible del avatar reduciendo la señal espinal.'),
    ex('HA_T4', 'TREATMENT', 'BIO_3D', '8. Inducción Hipnoanalgésica en Ondas Theta', 'DELTA_WAVES', 'Respira con el loto liberando endorfinas que silencian los receptores del dolor.')
  ],
  HIPNO_FANTASMA: [
    ex('HF_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Discordancia Sensoriomotora Cortical', 'BROWN_NOISE', 'Mide la precisión de comando sobre el espacio de la extremidad.'),
    ex('HF_D2', 'DIAGNOSTIC', 'BART_3D', '2. Cuantificación de Espasmo Fantasma', 'TENSION_DRUM', 'Proyecta en la esfera el grado de torsión o calambre percibido.'),
    ex('HF_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Asimetría de Representación Espacial', 'BETA_WAVES', 'Evalúa la velocidad de rotación mental de las extremidades en 3D.'),
    ex('HF_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Paroxismos Neuropáticos Reflejos', 'HEARTBEAT', 'Identifica los disparadores visuales que alivian o tensan el miembro.'),
    ex('HF_T1', 'TREATMENT', 'AAT_3D', '5. Liberación del Puño Fantasma', 'ALPHA_WAVES', 'Extiende el rayo abriendo la mano virtual para destrabar el espasmo cortical.'),
    ex('HF_T2', 'TREATMENT', 'EMDR_3D', '6. Desensibilización Talámica Bilateral', 'BILATERAL_SWEEP', 'Sigue la esfera disolviendo la memoria de dolor atrapada en el tálamo.'),
    ex('HF_T3', 'TREATMENT', 'MIRROR_3D', '7. Terapia de Caja Espejo Virtual 6DoF', 'THETA_WAVES', 'Observa ambos brazos intactos en el avatar engañando positivamente a tu corteza motora.'),
    ex('HF_T4', 'TREATMENT', 'BIO_3D', '8. Reorganización del Homúnculo de Penfield', 'DELTA_WAVES', 'Respira en paz reescribiendo el mapa cerebral con sensaciones de alivio.')
  ],
  SEX_INHIB: [
    ex('SI_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Sesgo Inhibitorio Automático (SIS)', 'BROWN_NOISE', 'Mide la hiperactivación de frenos inhibitorios ante estímulos afectivos.'),
    ex('SI_D2', 'DIAGNOSTIC', 'BART_3D', '2. Latencia de Aproximación Íntima', 'TENSION_DRUM', 'Evalúa el temor al descontrol o vulnerabilidad interpersonal.'),
    ex('SI_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Interferencia por Hipervigilancia', 'BETA_WAVES', 'Mide cuánto distraen las preocupaciones externas a la conexión presente.'),
    ex('SI_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Aproximación vs. Evitación Afectiva', 'HEARTBEAT', 'Registra la respuesta espontánea frente a escenarios de cercanía.'),
    ex('SI_T1', 'TREATMENT', 'AAT_3D', '5. Focalización Sensorial (Sensate Focus VR)', 'ALPHA_WAVES', 'Acércate suavemente a los estímulos luminosos sin exigencia de meta.'),
    ex('SI_T2', 'TREATMENT', 'EMDR_3D', '6. Desbloqueo de Inhibición y Culpa', 'BILATERAL_SWEEP', 'Sigue la luz bilateral soltando mandatos rígidos y temores aprendidos.'),
    ex('SI_T3', 'TREATMENT', 'MIRROR_3D', '7. Aceptación Somática y Presencia', 'THETA_WAVES', 'Habita tu cuerpo con naturalidad y confianza frente al avatar.'),
    ex('SI_T4', 'TREATMENT', 'BIO_3D', '8. Apertura Parasimpática y Vasodilatación', 'DELTA_WAVES', 'Respira profundamente apagando el freno simpático para permitir la respuesta natural.')
  ],
  DISFUNCION_SOM: [
    ex('DS_D1', 'DIAGNOSTIC', 'CPT_3D', '1. Rol de Espectador (Spectatoring)', 'BROWN_NOISE', 'Mide la autoobservación crítica que interrumpe la respuesta fisiológica.'),
    ex('DS_D2', 'DIAGNOSTIC', 'BART_3D', '2. Ansiedad de Desempeño y Presión', 'TENSION_DRUM', 'Evalúa el colapso por hiperexigencia y temor al fallo.'),
    ex('DS_D3', 'DIAGNOSTIC', 'N_BACK_3D', '3. Desconexión Cognitivo-Somática', 'BETA_WAVES', 'Registra la interferencia de pensamientos automáticos de fracaso.'),
    ex('DS_D4', 'DIAGNOSTIC', 'CHOICE_3D', '4. Anticipación Catastrófica en Intimidad', 'HEARTBEAT', 'Analiza el sesgo de preocupación frente al encuentro afectivo.'),
    ex('DS_T1', 'TREATMENT', 'AAT_3D', '5. Ruptura del Juez Interno (AAT)', 'ALPHA_WAVES', 'Empuja fuera de tu mente la autoexigencia de rendimiento perfecto.'),
    ex('DS_T2', 'TREATMENT', 'EMDR_3D', '6. Descatastrofización de Experiencias Previas', 'BILATERAL_SWEEP', 'Rastreo ocular para borrar la huella de ansiedad anticipatoria.'),
    ex('DS_T3', 'TREATMENT', 'MIRROR_3D', '7. Reconciliación con la Autoimagen Corporal', 'THETA_WAVES', 'Reconecta con el placer de sentir sin evaluarte desde afuera.'),
    ex('DS_T4', 'TREATMENT', 'BIO_3D', '8. Relajación Pélvica por Biofeedback Vagal', 'DELTA_WAVES', 'Afloja la tensión muscular respirando al ritmo del loto a 0.1 Hz.')
  ]
};
