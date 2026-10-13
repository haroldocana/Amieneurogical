// ============================================================================
// AMIE CLINICAL COPILOT - MOTOR DE VOZ GUIADA Y PROTOCOLOS PSICOTERAPÉUTICOS
// frontend/services/clinicalAudioGuidanceService.ts
// ============================================================================

export type ClinicalProtocolId = 
  | 'VRET_EXPOSURE'
  | 'EMDR_RECONSOLIDATION'
  | 'NEURO_HYPNOSIS_THETA'
  | 'GROUNDING_EMERGENCY'
  | 'CPT_DIAGNOSTIC_ATTENTION'
  | 'ANALGESIA_CHILL';

export interface AudioGuidancePhase {
  id: string;
  phaseNumber: number;
  phaseTitle: string;
  spokenScript: string;
  durationEstimateSec: number;
  recommendedCadenceRate: number; // 0.75 a 0.95 (ritmo vagal desacelerado)
  recommendedPitch: number;       // 0.85 a 1.0 (tono cálido / no amenazante)
  targetBiomarker: string;        // Biomarcador esperado (ej. "Descenso GSR", "Sincronía HRV")
}

export interface AudioGuidanceProtocol {
  protocolId: ClinicalProtocolId;
  title: string;
  clinicalDomain: string;
  phases: AudioGuidancePhase[];
}

// ----------------------------------------------------------------------------
// BANCO MAESTRO DE GUIONES CLÍNICOS ESTRUCTURADOS PASO A PASO
// ----------------------------------------------------------------------------
export const CLINICAL_PROTOCOLS: Record<ClinicalProtocolId, AudioGuidanceProtocol> = {
  // PROTOCOLO 1: Desensibilización Sistemática Inmersiva (VRET)
  VRET_EXPOSURE: {
    protocolId: 'VRET_EXPOSURE',
    title: 'Desensibilización Sistemática en Exposición Virtual',
    clinicalDomain: 'Fobias Específicas, Ansiedad Social y Agorafobia',
    phases: [
      {
        id: 'vret_p1',
        phaseNumber: 1,
        phaseTitle: 'Fase 1: Anclaje y Línea Base de Calma',
        spokenScript: 'Respira hondo por la nariz... Siente el apoyo de tus pies en el suelo. Este es un espacio completamente seguro y tú tienes el control absoluto en todo momento. Observa el entorno a tu propio ritmo mientras tu respiración se estabiliza.',
        durationEstimateSec: 15,
        recommendedCadenceRate: 0.82,
        recommendedPitch: 0.95,
        targetBiomarker: 'HRV RMSSD Basal > 35 ms'
      },
      {
        id: 'vret_p2',
        phaseNumber: 2,
        phaseTitle: 'Fase 2: Introducción del Estímulo Jerárquico',
        spokenScript: 'El escenario va a cambiar progresivamente. Si notas que tu corazón late con más fuerza o sientes tensión en el pecho, recuerda: es solo tu cuerpo activando una falsa alarma. Mantén la mirada fija en el horizonte virtual y exhala suavemente.',
        durationEstimateSec: 16,
        recommendedCadenceRate: 0.85,
        recommendedPitch: 0.95,
        targetBiomarker: 'Pico fásico GSR < 5.0 µS'
      },
      {
        id: 'vret_p3',
        phaseNumber: 3,
        phaseTitle: 'Fase 3: Meseta y Extinción Fóbica (Habituación H)',
        spokenScript: 'Permanece con la sensación sin luchar contra ella. Deja que la ola de distrés alcance su punto máximo y descienda por sí sola. Tu sistema nervioso se está recalibrando. Inhala en cuatro segundos... y exhala en seis.',
        durationEstimateSec: 18,
        recommendedCadenceRate: 0.80,
        recommendedPitch: 0.90,
        targetBiomarker: 'Habituación H >= 1.5 (Descenso a meseta)'
      }
    ]
  },

  // PROTOCOLO 2: EMDR 3D y Reconsolidación de Memorias Traumáticas
  EMDR_RECONSOLIDATION: {
    protocolId: 'EMDR_RECONSOLIDATION',
    title: 'Estimulación Bilateral Sacádica y Reprocesamiento EMDR',
    clinicalDomain: 'TEPT, Duelo Traumático y Ansiedad Aguda',
    phases: [
      {
        id: 'emdr_p1',
        phaseNumber: 1,
        phaseTitle: 'Fase 1: Activación del Engrama Blanco',
        spokenScript: 'Trae a tu mente la imagen más difícil asociada a ese recuerdo... Observa qué sensación física despierta en tu cuerpo en este momento, sin juzgarla. Mantén esa escena presente mientras preparas tu mirada.',
        durationEstimateSec: 16,
        recommendedCadenceRate: 0.85,
        recommendedPitch: 0.95,
        targetBiomarker: 'Elevación de reactividad simpática basal'
      },
      {
        id: 'emdr_p2',
        phaseNumber: 2,
        phaseTitle: 'Fase 2: Barrido Sacádico Bilateral Activo',
        spokenScript: 'Sigue la esfera luminosa únicamente con los ojos, de un lado a otro, sin mover la cabeza. Mantén el ritmo visual... Solo observa lo que aparece en tu mente y déjalo pasar como un tren que atraviesa una estación.',
        durationEstimateSec: 16,
        recommendedCadenceRate: 0.88,
        recommendedPitch: 1.0,
        targetBiomarker: 'Agotamiento de memoria de trabajo en córtex frontal'
      },
      {
        id: 'emdr_p3',
        phaseNumber: 3,
        phaseTitle: 'Fase 3: Instalación de Cognición Positiva',
        spokenScript: 'Detén la mirada en el centro. Toma aire profundamente y déjalo ir... Conecta ahora con la idea: Aquí y ahora estoy a salvo, ya pasó. Siente cómo esa certeza se asienta en tu cuerpo.',
        durationEstimateSec: 16,
        recommendedCadenceRate: 0.80,
        recommendedPitch: 0.90,
        targetBiomarker: 'Aumento de tono vagal parasimpático'
      }
    ]
  },

  // PROTOCOLO 3: Neurohipnosis de Bucle Cerrado y Trance Theta
  NEURO_HYPNOSIS_THETA: {
    protocolId: 'NEURO_HYPNOSIS_THETA',
    title: 'Inducción Neurohipnótica y Sintonización Autonómica',
    clinicalDomain: 'Insomnio, Distrés Somático y Dolor Psicógeno',
    phases: [
      {
        id: 'hypno_p1',
        phaseNumber: 1,
        phaseTitle: 'Fase 1: Focalización Ocular y Fijación de Luz',
        spokenScript: 'Fija tu atención en el centro del orbe de luz. Permite que tus párpados se sientan pesados, naturalmente relajados. Con cada pulso luminoso, tu actividad mental se desacelera, entrando en sintonía con las ondas binaurales de fondo.',
        durationEstimateSec: 17,
        recommendedCadenceRate: 0.78,
        recommendedPitch: 0.88,
        targetBiomarker: 'Ralentización de parpadeo y dilatación pupilar'
      },
      {
        id: 'hypno_p2',
        phaseNumber: 2,
        phaseTitle: 'Fase 2: Fraccionamiento y Profundización Autonómica',
        spokenScript: 'Con cada número que escuches, desciendes un nivel más profundo de comodidad. Diez... soltando los hombros. Nueve... sintiendo una agradable sensación de pesadez en las manos. Ocho... tu mente en reposo absoluto.',
        durationEstimateSec: 18,
        recommendedCadenceRate: 0.75,
        recommendedPitch: 0.85,
        targetBiomarker: 'Incremento de potencia Theta (4-7 Hz) en qEEG'
      }
    ]
  },

  // PROTOCOLO 4: Protocolo de Emergencia, Grounding y Regulación Vagal
  GROUNDING_EMERGENCY: {
    protocolId: 'GROUNDING_EMERGENCY',
    title: 'Protocolo de Emergencia y Grounding Inmediato',
    clinicalDomain: 'Ataques de Pánico en VR, Disociación y Paroxismo Simpático',
    phases: [
      {
        id: 'ground_p1',
        phaseNumber: 1,
        phaseTitle: 'Fase 1: Interrupción Inmediata y Anclaje Sensorial 5-4-3-2-1',
        spokenScript: 'Abre bien los ojos. El ejercicio de exposición ha terminado. Estás a salvo aquí con nosotros. Nombra en voz alta tres cosas verdes que veas en este santuario. Siente la textura del asiento debajo de ti.',
        durationEstimateSec: 15,
        recommendedCadenceRate: 0.88,
        recommendedPitch: 1.0,
        targetBiomarker: 'Ruptura del ciclo de pánico amigdalar'
      },
      {
        id: 'ground_p2',
        phaseNumber: 2,
        phaseTitle: 'Fase 2: Respiración en Caja (Box Breathing 4-4-4-4)',
        spokenScript: 'Vamos a respirar juntos para restaurar tu calma: Inhala... dos, tres, cuatro. Sostén el aire... dos, tres, cuatro. Suelta suavemente... dos, tres, cuatro. Pausa... dos, tres, cuatro. Tu cuerpo está recuperando el equilibrio.',
        durationEstimateSec: 20,
        recommendedCadenceRate: 0.80,
        recommendedPitch: 0.90,
        targetBiomarker: 'Reducción de frecuencia cardíaca a < 85 lpm'
      }
    ]
  },

  // PROTOCOLO 5: Diagnóstico CPT de Carga Ejecutiva y TDAH
  CPT_DIAGNOSTIC_ATTENTION: {
    protocolId: 'CPT_DIAGNOSTIC_ATTENTION',
    title: 'Evaluación Neurocognitiva Estandarizada CPT 3D',
    clinicalDomain: 'Diagnóstico de TDAH, Control Inhibitorio y Deterioro Ejecutivo',
    phases: [
      {
        id: 'cpt_p1',
        phaseNumber: 1,
        phaseTitle: 'Fase 1: Instrucción de Calibración Motora',
        spokenScript: 'Bienvenido a la prueba de atención sostenida. En la pizarra central aparecerán diferentes figuras geométricas. Presiona el gatillo del control únicamente cuando veas aparecer una esfera azul. Si aparece cualquier otra figura, no presiones nada.',
        durationEstimateSec: 17,
        recommendedCadenceRate: 0.90,
        recommendedPitch: 1.0,
        targetBiomarker: 'Línea base motriz y latencia pre-tarea'
      },
      {
        id: 'cpt_p2',
        phaseNumber: 2,
        phaseTitle: 'Fase 2: Advertencia de Carga con Distractores Ambientales',
        spokenScript: 'La tarea va a comenzar. Ignora cualquier sonido o movimiento en las ventanas del aula. Mantén tu atención exclusivamente fija en la pizarra central. Comenzamos en tres, dos, uno.',
        durationEstimateSec: 12,
        recommendedCadenceRate: 0.92,
        recommendedPitch: 1.0,
        targetBiomarker: 'Errores de omisión/comisión bajo interferencia 360°'
      }
    ]
  },

  // PROTOCOLO 6: Analgesia Virtual y Defocalización Nociceptiva
  ANALGESIA_CHILL: {
    protocolId: 'ANALGESIA_CHILL',
    title: 'Inmersión Criogénica y Control de Compuerta de Dolor',
    clinicalDomain: 'Fibromialgia, Dolor Crónico e Hiperexcitabilidad Central',
    phases: [
      {
        id: 'pain_p1',
        phaseNumber: 1,
        phaseTitle: 'Fase 1: Transmutación Sensorial Térmica',
        spokenScript: 'Imagina que una suave corriente de agua fresca y cristalina comienza a fluir alrededor de la zona donde sentías molestia. Con cada respiración, esa corriente disuelve la tensión y sustituye el calor irritante por un alivio frío y sedante.',
        durationEstimateSec: 18,
        recommendedCadenceRate: 0.80,
        recommendedPitch: 0.88,
        targetBiomarker: 'Descenso de tono simpático y modulación de dolor'
      }
    ]
  }
};

// ----------------------------------------------------------------------------
// MOTOR SINGLETON DE SÍNTESIS VOCAL CLÍNICA CON WEB SPEECH API
// ----------------------------------------------------------------------------
export class ClinicalAudioGuidanceEngine {
  private static synth: SpeechSynthesis | null = 
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  
  private static cachedVoice: SpeechSynthesisVoice | null = null;
  private static isSpeakingInternal: boolean = false;
  private static keepAliveTimer: any = null;

  /**
   * Localiza y cachea la mejor voz natural en español disponible en el sistema operativo o visor
   */
  public static resolveBestSpanishVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    if (this.cachedVoice) return this.cachedVoice;

    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // Prioridad: Voces naturales premium en español (Google, Microsoft, Apple, locales)
    const priorityNames = [
      'Microsoft Helena', 'Microsoft Laura', 'Google español', 'Paulina', 
      'Monica', 'Jorge', 'Soledad', 'Rosa', 'Lucia', 'es-ES', 'es-MX', 'es-US'
    ];

    for (const name of priorityNames) {
      const match = voices.find(v => v.name.includes(name) || v.lang.replace('_', '-').startsWith(name));
      if (match) {
        this.cachedVoice = match;
        return match;
      }
    }

    // Fallback: Cualquier voz cuyo código comience por 'es'
    const genericEs = voices.find(v => v.lang.startsWith('es'));
    if (genericEs) {
      this.cachedVoice = genericEs;
      return genericEs;
    }

    return voices[0] || null;
  }

  /**
   * Emite una instrucción verbal estructurada garantizando que los visores Chromium no la corten
   */
  public static speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!this.synth) {
      console.warn('[AMIE Voice Engine] Web Speech API no está soportada en este entorno.');
      options.onEnd?.();
      return;
    }

    // Detener cualquier locución activa para evitar solapamientos
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.resolveBestSpanishVoice();
    if (voice) utterance.voice = voice;

    utterance.lang = voice?.lang || 'es-ES';
    utterance.rate = options.rate ?? 0.85; // Cadencia pausada para favorecer el descenso de catecolaminas
    utterance.pitch = options.pitch ?? 0.95;
    utterance.volume = options.volume ?? 1.0;

    utterance.onstart = () => {
      this.isSpeakingInternal = true;
      options.onStart?.();

      // Fix para visores Chromium/Android: reanudar si el motor de síntesis entra en pausa arbitraria
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = setInterval(() => {
        if (this.synth?.speaking) {
          this.synth.pause();
          this.synth.resume();
        } else {
          clearInterval(this.keepAliveTimer);
        }
      }, 12000);
    };

    utterance.onend = () => {
      this.isSpeakingInternal = false;
      clearInterval(this.keepAliveTimer);
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      this.isSpeakingInternal = false;
      clearInterval(this.keepAliveTimer);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('[AMIE Voice Engine] Evento de error en locución:', event.error);
        options.onError?.(event);
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('[AMIE Voice Engine] Error al invocar speech.speak():', err);
      options.onError?.(err);
    }
  }

  /**
   * Ejecuta inmediatamente el protocolo de Grounding de voz sin esperas
   */
  public static triggerEmergencyGroundingVoice(onComplete?: () => void): void {
    const protocol = CLINICAL_PROTOCOLS.GROUNDING_EMERGENCY;
    const firstPhase = protocol.phases[0];
    this.speak(firstPhase.spokenScript, {
      rate: firstPhase.recommendedCadenceRate,
      pitch: firstPhase.recommendedPitch,
      volume: 1.0,
      onEnd: () => {
        if (protocol.phases[1]) {
          setTimeout(() => {
            this.speak(protocol.phases[1].spokenScript, {
              rate: protocol.phases[1].recommendedCadenceRate,
              pitch: protocol.phases[1].recommendedPitch,
              onEnd: onComplete
            });
          }, 800);
        } else {
          onComplete?.();
        }
      }
    });
  }

  public static stop(): void {
    clearInterval(this.keepAliveTimer);
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.isSpeakingInternal = false;
  }

  public static isSpeaking(): boolean {
    return Boolean(this.synth?.speaking || this.isSpeakingInternal);
  }
}

// Carga inicial anticipada de voces para evitar demoras en la primera locución
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    ClinicalAudioGuidanceEngine.resolveBestSpanishVoice();
  };
}

export default ClinicalAudioGuidanceEngine;
