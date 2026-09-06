import { PatientRecord, MedicalLicenseAccount } from './types';

export const MORRISON_CLINICAL_PRINCIPLES = [
  { letter: 'A', title: 'Seguridad en Diagnóstico Diferencial', text: 'Establezca su diagnóstico diferencial en forma jerárquica conforme a la seguridad del paciente (trastornos orgánicos y tratables primero).' },
  { letter: 'B', title: 'Antecedentes Familiares', text: 'Los antecedentes familiares orientan el diagnóstico; revalúe tras entrevistar a la familia.' },
  { letter: 'C', title: 'Etiología Física & Tratamientos', text: 'Los trastornos físicos y su farmacoterapia pueden inducir o agravar los síntomas mentales.' },
  { letter: 'D', title: 'Descarte Somatomorfo', text: 'Descarte trastorno de síntomas somáticos cuando los síntomas no coincidan con la anatomía o los tratamientos no funcionen.' },
  { letter: 'E', title: 'Consumo de Sustancias', text: 'El consumo de sustancias (intoxicación/abstinencia) puede inducir casi cualquier cuadro psicopatológico.' },
  { letter: 'F', title: 'Prioridad al Estado de Ánimo', text: 'Por su alta prevalencia, letalidad y respuesta a tratamiento, siempre descarte trastornos del estado de ánimo.' },
  { letter: 'G', title: 'Antecedentes > Aspecto Actual', text: 'Los antecedentes longitudinales tienen mayor peso predictivo que el corte transversal actual.' },
  { letter: 'H', title: 'Recencia de Antecedentes', text: 'Los antecedentes más recientes tienen más valor diagnóstico que los de mayor antigüedad.' },
  { letter: 'I', title: 'Fuentes Colaterales', text: 'La información de informantes confiables con frecuencia supera los relatos con anosognosia o simulación.' },
  { letter: 'J', title: 'Signos > Síntomas', text: 'Los signos objetivos observables tienen más valor que las quejas subjetivas no verificadas.' },
  { letter: 'M', title: 'Navaja de Occam', text: 'Elija la explicación más simple y unificadora antes de acumular diagnósticos independientes.' },
  { letter: 'N', title: 'Caballos vs Cebras', text: 'Piense primero en las afecciones más comunes antes que en patologías exóticas.' },
  { letter: 'P', title: 'Predictor de Conducta', text: 'El elemento que mejor predice el comportamiento futuro es el comportamiento previo en circunstancias análogas.' },
  { letter: 'Q', title: 'Conteo de Criterios', text: 'A mayor número de síntomas cardinales de un trastorno, mayor probabilidad de certeza diagnóstica.' },
  { letter: 'W', title: 'Evitar TP en Cuadro Agudo', text: 'Evite diagnosticar trastornos de la personalidad durante un cuadro agudo del Eje I o crisis descompensatoria.' },
  { letter: 'X', title: 'Jerarquía de Tratabilidad', text: 'Enliste diagnósticos múltiples priorizando el más urgente y sensible al tratamiento médico.' }
];

export const INITIAL_LICENSES: MedicalLicenseAccount[] = [
  {
    id: 'LIC-00891',
    doctorName: 'Dr. Alejandro Morales Rivera',
    colegiadoNumber: 749210,
    username: 'dr.morales@hospitalgeneral.med',
    hospitalClinic: 'Hospital Central de Especialidades Psiquiátricas',
    specialty: 'Psiquiatría de Enlace & Neuropsiquiatría',
    tier: 'Institucional',
    storageBucketUri: 'gs://base-conocimiento-medica/licencias/dr.morales@hospitalgeneral.med.json',
    createdAt: '2024-01-15',
    expiresAt: '2026-12-31',
    status: 'Activa'
  },
  {
    id: 'LIC-00892',
    doctorName: 'Dra. Gabriela Enríquez Cotera',
    colegiadoNumber: 883194,
    username: 'dra.enriquez@neuromed.cl',
    hospitalClinic: 'Instituto de Neurociencias y Salud Mental',
    specialty: 'Neurología Clínica & Psicofarmacología',
    tier: 'Investigación',
    storageBucketUri: 'gs://base-conocimiento-medica/licencias/dra.enriquez@neuromed.cl.json',
    createdAt: '2024-03-01',
    expiresAt: '2026-03-01',
    status: 'Activa'
  }
];

export const CLINICAL_CASE_PRESETS: { name: string; description: string; record: PatientRecord }[] = [
  {
    name: 'Caso 1: Crisis Depresiva Severa con SAD PERSONS Crítico (Riesgo Suicida)',
    description: 'Paciente adulto con colapso neurovegetativo, bradilalia severa, tono vagal disminuido y tiempo de reacción motor ralentizado.',
    record: {
      id: 'PAC-8104',
      patientNameAnonymized: 'Paciente B. M. (55 años)',
      age: 55,
      gender: 'M',
      consultationReason: 'Ideación suicida estructurada tras colapso sociofuncional, insomnio de despertar precoz y rumiación de ruina.',
      anamnesis: 'Hombre de 55 años, previamente activo en labores agrícolas y comerciales. Desde hace 3 meses presenta anhedonia total, despertar a las 02:30 AM con llanto e hiperalerta, baja de peso de 6 kg, convicción de ruina económica inminente ("debemos vender la granja") y verbalización de que "su familia estaría mejor sin él". Niega historia de manía/hipomanía.',
      sessionNotes: [
        'Sesión 1: Facies profundamente abatida, enlentecimiento psicomotor notable. Expresa sensación de vacío insoportable y culpa delirante de bancarrota familiar.',
        'Sesión 2: Acompañado por cónyuge quien reporta que el paciente pasa horas mirando al vacío y revisando un arma en el ático. Se interviene para decomiso de medios.'
      ],
      multisensoryHardware: {
        vagalToneHrvIndex: 18, // Severamente deprimido (<25)
        handGripPressureKg: 21.4, // Hipotonía psicomotora marcada
        camouflagingIndexPct: 12,
        ocularFixationDurationMs: 4200, // Fijación inmóvil prolongada
        touchTapLatencyCompensatedMs: 485,
        microExpressionState: 'Aplanamiento Motor'
      },
      audioRecordings: [
        {
          id: 'AUD-8104-01',
          sessionNumber: 1,
          date: '2025-02-12',
          durationSeconds: 142,
          audioTitle: 'Sesión Inicial: Entrevista de Evaluación y Desesperanza',
          transcriptText: '...Tendremos que vender la granja. Ya no sirvo para nada. Siento un peso en el pecho todas las mañanas desde las dos y media. Rachel dice que mis inversiones están bien, pero sé que todo se derrumbará. No veo salida...',
          acousticBiometrics: {
            speechRateWpm: 78,
            bradylaliaIndex: 86,
            affectiveFlatteningScore: 88,
            responseLatencyMs: 2450,
            prosodyVariabilityPct: 12,
            acousticStressMarker: 'Inhibición Severa'
          },
          audioWaveformData: [12, 14, 8, 20, 18, 10, 8, 6, 22, 15, 8, 6, 4, 18, 24, 16, 8, 6, 4]
        }
      ],
      psychopharmacologyCurrent: [
        {
          drugName: 'Sertralina',
          dosage: '50 mg/día',
          durationMonths: 1,
          adherenceStatus: 'Adherente'
        }
      ],
      sentinelTelemetry: {
        pacId: 'PAC-8104',
        deviceSyncTime: 'Hace 8 minutos (En línea)',
        sleepMetrics: {
          nightWakeups: 5,
          hoursInDarkness: 7.2,
          avgSleepDurationHours: 3.4,
          sleepEfficiencyPct: 41
        },
        behavioralBiometrics: {
          typingLatencyMs: 485,
          screenActiveTimeMinutes: 140,
          biomotorLatencyMs: 485,
          activityRestlessnessIndex: 82
        },
        safetyStatus: {
          riskLevel: 'CRÍTICO',
          activeContentionTriggered: true,
          passiveRiskRationale: 'Despertares nocturnos múltiples (5x/noche), latencia táctil ralentizada (485 ms) compatible con inhibición psicomotora grave, asociada a rumiación nocturna continua.',
          emergencyContact: {
            name: 'Rachel Murphy',
            relationship: 'Cónyuge / Red Primaria',
            phone: '+52 (55) 4192-8831'
          }
        },
        nightWakeups: 5,
        avgSleepDurationHours: 3.4,
        sleepEfficiencyPct: 41,
        biomotorLatencyMs: 485,
        screenOnNightTimeMinutes: 140,
        activityRestlessnessIndex: 82,
        crisisDistressTriggered: true,
        passiveRiskScore: 'CRÍTICO',
        passiveRiskRationale: 'Despertares nocturnos múltiples (5x/noche), latencia táctil ralentizada (485 ms) compatible con inhibición psicomotora grave, asociada a rumiación nocturna continua.',
        emergencyContact: {
          name: 'Rachel Murphy',
          relationship: 'Cónyuge / Red Primaria',
          phone: '+52 (55) 4192-8831'
        }
      },
      qeegBiomarkers: {
        recordingDate: '2025-02-14',
        channelsCount: 19,
        samplingRateHz: 500,
        bandPowers: {
          delta: 34,
          theta: 28,
          alfa: 18,
          beta: 14,
          highBeta: 6,
          gamma: 2
        },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: 1.9, thetaZ: 2.3, alfaZ: -1.2, betaZ: 0.4, highBetaZ: 0.1, coherenceZ: 0.81, interpretation: 'Enlentecimiento frontal difuso con elevación de ondas lentas' },
          parietal: { region: 'Parietal', deltaZ: 0.4, thetaZ: 0.8, alfaZ: 0.3, betaZ: 0.2, highBetaZ: 0.0, coherenceZ: 0.94 },
          temporal: { region: 'Temporal', deltaZ: 0.6, thetaZ: 1.1, alfaZ: 1.8, betaZ: 0.9, highBetaZ: 0.3, coherenceZ: 0.89 },
          occipital: { region: 'Occipital', deltaZ: 0.2, thetaZ: 0.4, alfaZ: 1.9, betaZ: -0.1, highBetaZ: 0.0, coherenceZ: 0.92 }
        },
        thetaBetaRatio: 1.8,
        alphaPeakFrequencyHz: 8.5
      },
      psychometricScores: {
        phq9: 24,
        gad7: 16,
        bdi2: 42,
        bai: 18,
        mmse: 29,
        sadPersons: 9,
        cssrsLevel: 5,
        gafEstimated: 25,
        whodas2: 4.2
      },
      functionalAreas: {
        sleep: 15,
        appetite: 20,
        energy: 15,
        social: 10,
        attention: 35
      },
      neuromotorBiomarkers: {
        reactionTimeMs: 485,
        omissionErrors: 8,
        commissionErrors: 2,
        motorStabilityScore: 42
      },
      qeegZScores: {
        frontalThetaBetaRatio: 1.8,
        temporalAsymmetry: 0.4,
        alphaPeakFrequencyHz: 8.5,
        deltaSlowActivityZ: 1.9
      },
      substancesHistory: {
        alcohol: 'Consumo ocasional previo, nulo en último mes',
        tobacco: 'Fumador leve (5 cig/día)',
        cannabis: 'Negativo',
        stimulants: 'Negativo',
        medicationsCurrent: ['Sertralina 50 mg/día']
      },
      medicalHistory: ['Úlcera péptica previa', 'Dislipidemia leve']
    }
  },
  {
    name: 'Caso 2: Triangulación Bipolar I - Episodio Maníaco con Psicosis Mística',
    description: 'Mujer de 32 años con expansividad mística ("Soy Dios"), taquilalia extrema, aceleración biomotora y tono simpático hiperactivo.',
    record: {
      id: 'PAC-4412',
      patientNameAnonymized: 'Paciente L. F. (32 años)',
      age: 32,
      gender: 'F',
      consultationReason: 'Agitación psicomotriz extrema, fuga de ideas, insomnio total de 4 días y megalomanía religiosa.',
      anamnesis: 'Mujer de 32 años con antecedente de hospitalización a los 19 años por psicosis posparto con desinhibición conductual. Estuvo estabilizada con litio hasta hace 10 días cuando lo suspendió unilateralmente porque "se sentía invencible". Ingresa cantando, saltando, donando sus pertenencias a extraños y proclamando tener la cura del sufrimiento universal.',
      sessionNotes: [
        'Ingreso Urgencias: Desinhibida, vestimenta llamativa, lenguaje taquilálico ininterrumpible con rimas y asociaciones laxas.',
        'Evaluación piso: No duerme más de 1 hora por noche. Manifiesta que los satélites se conectan a su pensamiento para bendecir al hospital.'
      ],
      multisensoryHardware: {
        vagalToneHrvIndex: 78,
        handGripPressureKg: 42.1,
        camouflagingIndexPct: 8,
        ocularFixationDurationMs: 140, // Saccades erráticas ultra-rápidas
        touchTapLatencyCompensatedMs: 195,
        microExpressionState: 'Hipervigilancia Ocular'
      },
      audioRecordings: [
        {
          id: 'AUD-4412-01',
          sessionNumber: 1,
          date: '2025-02-18',
          durationSeconds: 118,
          audioTitle: 'Entrevista de Urgencias: Taquilalia y Fuga de Ideas',
          transcriptText: '...¡Nunca me había sentido mejor en la vida, doctor! Soy el Todopoderoso, la música me habla, los satélites vibran con mi frecuencia. Doné mi auto porque el dinero es una ilusión de los que no pueden volar...',
          acousticBiometrics: {
            speechRateWpm: 215,
            bradylaliaIndex: 5,
            affectiveFlatteningScore: 10,
            responseLatencyMs: 80,
            prosodyVariabilityPct: 92,
            acousticStressMarker: 'Presión del Habla (Taquilalia)'
          },
          audioWaveformData: [65, 85, 90, 75, 95, 80, 88, 92, 70, 85, 90, 95, 80, 92]
        }
      ],
      psychopharmacologyCurrent: [
        {
          drugName: 'Carbonato de Litio',
          dosage: '900 mg/día',
          durationMonths: 24,
          adherenceStatus: 'Abandono Reciente'
        }
      ],
      sentinelTelemetry: {
        pacId: 'PAC-4412',
        deviceSyncTime: 'Hace 2 minutos (En línea)',
        sleepMetrics: {
          nightWakeups: 6,
          hoursInDarkness: 3.1,
          avgSleepDurationHours: 1.2,
          sleepEfficiencyPct: 22
        },
        behavioralBiometrics: {
          typingLatencyMs: 195,
          screenActiveTimeMinutes: 280,
          biomotorLatencyMs: 195,
          activityRestlessnessIndex: 96
        },
        safetyStatus: {
          riskLevel: 'ALTO',
          activeContentionTriggered: true,
          passiveRiskRationale: 'Patrón de no-sueño persistente (<2h), micro-pulsaciones biomotoras ultra-aceleradas (195ms) y envío masivo de mensajes nocturnos.',
          emergencyContact: {
            name: 'Carlos Freitas',
            relationship: 'Padre',
            phone: '+52 (55) 7741-9920'
          }
        },
        nightWakeups: 6,
        avgSleepDurationHours: 1.2,
        sleepEfficiencyPct: 22,
        biomotorLatencyMs: 195,
        screenOnNightTimeMinutes: 280,
        activityRestlessnessIndex: 96,
        crisisDistressTriggered: true,
        passiveRiskScore: 'ALTO',
        passiveRiskRationale: 'Patrón de no-sueño persistente (<2h), micro-pulsaciones biomotoras ultra-aceleradas (195ms) y envío masivo de mensajes nocturnos.',
        emergencyContact: {
          name: 'Carlos Freitas',
          relationship: 'Padre',
          phone: '+52 (55) 7741-9920'
        }
      },
      qeegBiomarkers: {
        recordingDate: '2025-02-18',
        channelsCount: 19,
        samplingRateHz: 500,
        bandPowers: {
          delta: 12,
          theta: 35,
          alfa: 15,
          beta: 26,
          highBeta: 12,
          gamma: 5
        },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: -0.5, thetaZ: 3.2, alfaZ: -1.4, betaZ: 2.6, highBetaZ: 2.1, coherenceZ: 0.76, interpretation: 'Desincronización fronto-estriatal masiva con exceso theta/beta' },
          parietal: { region: 'Parietal', deltaZ: -0.2, thetaZ: 1.4, alfaZ: -0.8, betaZ: 1.8, highBetaZ: 1.2, coherenceZ: 0.88 },
          temporal: { region: 'Temporal', deltaZ: 0.1, thetaZ: 1.8, alfaZ: 1.4, betaZ: 2.2, highBetaZ: 1.5, coherenceZ: 0.82 },
          occipital: { region: 'Occipital', deltaZ: -0.3, thetaZ: 0.5, alfaZ: 1.1, betaZ: 0.8, highBetaZ: 0.4, coherenceZ: 0.94 }
        },
        thetaBetaRatio: 3.2,
        alphaPeakFrequencyHz: 11.2
      },
      psychometricScores: {
        phq9: 2,
        gad7: 12,
        bdi2: 4,
        mmse: 27,
        asrs: 15,
        sadPersons: 3,
        cssrsLevel: 0,
        gafEstimated: 25
      },
      functionalAreas: {
        sleep: 10,
        appetite: 40,
        energy: 98,
        social: 95,
        attention: 20
      },
      neuromotorBiomarkers: {
        reactionTimeMs: 195,
        omissionErrors: 1,
        commissionErrors: 19,
        motorStabilityScore: 30
      },
      qeegZScores: {
        frontalThetaBetaRatio: 3.2,
        temporalAsymmetry: 1.4,
        alphaPeakFrequencyHz: 11.2,
        deltaSlowActivityZ: -0.5
      },
      substancesHistory: {
        alcohol: 'Negativo',
        tobacco: 'Negativo',
        cannabis: 'Uso experimental en adolescencia',
        stimulants: 'Negativo (panel toxicológico en orina negativo)',
        medicationsCurrent: ['Carbonato de litio 900mg/d (abandonado hace 10 días)']
      },
      medicalHistory: ['Salpingoclasia', 'Sin patología médica mayor']
    }
  },
  {
    name: 'Caso 3: TDAH del Adulto vs Trastorno de Ansiedad y Desorganización',
    description: 'Varón de 37 años, científico con dispersión crónica, pérdida de foco, impulsividad y respuesta dramática previa a psicoestimulantes.',
    record: {
      id: 'PAC-1120',
      patientNameAnonymized: 'Paciente D. T. (37 años)',
      age: 37,
      gender: 'M',
      consultationReason: 'Dificultad severa y crónica para sostener esfuerzo mental, desorganización ejecutiva y olvidos laborales críticos.',
      anamnesis: 'Químico investigador de 37 años con historia de inquietud e inatención desde los 7 años de edad en la escuela primaria ("se retorcía como un insecto"). Refiere que recientemente tomó por confusión metilfenidato prescrito a su hijo con TDAH y experimentó por primera vez "un túnel de claridad mental absoluta y cese del caos cognitivo".',
      sessionNotes: [
        'Consulta Inicial: Muy inteligente pero extremadamente disperso; cambia de tema con rapidez pero con juicio lógico conservado. Niega alucinaciones.',
        'Reporte conyugal: Pierde llaves a diario, inicia múltiples proyectos simultáneos sin culminar ninguno, desatención a conversaciones.'
      ],
      multisensoryHardware: {
        vagalToneHrvIndex: 58,
        handGripPressureKg: 36.8,
        camouflagingIndexPct: 24,
        ocularFixationDurationMs: 620,
        touchTapLatencyCompensatedMs: 275,
        microExpressionState: 'Normorreactivo'
      },
      audioRecordings: [
        {
          id: 'AUD-1120-01',
          sessionNumber: 1,
          date: '2025-01-22',
          durationSeconds: 95,
          audioTitle: 'Sesión Clínica: Relato de Dispersión y Respuesta a Metilfenidato',
          transcriptText: '...Fue como magia. En media hora desapareció el ruido mental y pude concentrarme en la síntesis química que llevaba estancada tres semanas. Siempre he tenido cinco proyectos abiertos a la vez sin poder cerrar ninguno...',
          acousticBiometrics: {
            speechRateWpm: 158,
            bradylaliaIndex: 12,
            affectiveFlatteningScore: 18,
            responseLatencyMs: 210,
            prosodyVariabilityPct: 58,
            acousticStressMarker: 'Normal'
          },
          audioWaveformData: [35, 45, 52, 60, 48, 55, 62, 50, 45, 58, 64, 40]
        }
      ],
      psychopharmacologyCurrent: [
        {
          drugName: 'Metilfenidato Liberación Prolongada',
          dosage: '20 mg/día (ensayo)',
          durationMonths: 1,
          adherenceStatus: 'Adherente'
        }
      ],
      sentinelTelemetry: {
        pacId: 'PAC-1120',
        deviceSyncTime: 'Hace 1 hora',
        sleepMetrics: {
          nightWakeups: 1,
          hoursInDarkness: 7.5,
          avgSleepDurationHours: 6.8,
          sleepEfficiencyPct: 82
        },
        behavioralBiometrics: {
          typingLatencyMs: 275,
          screenActiveTimeMinutes: 25,
          biomotorLatencyMs: 275,
          activityRestlessnessIndex: 44
        },
        safetyStatus: {
          riskLevel: 'BAJO',
          activeContentionTriggered: false,
          passiveRiskRationale: 'Patrón circadiano estable con cambios atencionales diurnos e irregularidad en uso de apps productivas.',
          emergencyContact: {
            name: 'Elena Tourney',
            relationship: 'Esposa',
            phone: '+52 (55) 3320-1198'
          }
        },
        nightWakeups: 1,
        avgSleepDurationHours: 6.8,
        sleepEfficiencyPct: 82,
        biomotorLatencyMs: 275,
        screenOnNightTimeMinutes: 25,
        activityRestlessnessIndex: 44,
        crisisDistressTriggered: false,
        passiveRiskScore: 'BAJO',
        passiveRiskRationale: 'Patrón circadiano estable con cambios atencionales diurnos e irregularidad en uso de apps productivas.',
        emergencyContact: {
          name: 'Elena Tourney',
          relationship: 'Esposa',
          phone: '+52 (55) 3320-1198'
        }
      },
      qeegBiomarkers: {
        recordingDate: '2025-01-20',
        channelsCount: 19,
        samplingRateHz: 500,
        bandPowers: {
          delta: 15,
          theta: 38,
          alfa: 22,
          beta: 16,
          highBeta: 7,
          gamma: 2
        },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: 0.8, thetaZ: 2.8, alfaZ: -0.4, betaZ: 0.2, highBetaZ: 0.1, coherenceZ: 0.85, interpretation: 'Ratio Theta/Beta frontal 2.8σ compatible con fenotipo TDAH inatento' },
          parietal: { region: 'Parietal', deltaZ: 0.2, thetaZ: 1.1, alfaZ: 0.4, betaZ: 0.1, highBetaZ: 0.0, coherenceZ: 0.95 },
          temporal: { region: 'Temporal', deltaZ: 0.3, thetaZ: 0.9, alfaZ: 0.1, betaZ: 0.4, highBetaZ: 0.1, coherenceZ: 0.92 },
          occipital: { region: 'Occipital', deltaZ: 0.1, thetaZ: 0.4, alfaZ: 1.5, betaZ: -0.2, highBetaZ: 0.0, coherenceZ: 0.96 }
        },
        thetaBetaRatio: 2.8,
        alphaPeakFrequencyHz: 9.8
      },
      psychometricScores: {
        phq9: 8,
        gad7: 11,
        asrs: 17,
        mmse: 30,
        sadPersons: 1,
        cssrsLevel: 0,
        gafEstimated: 70
      },
      functionalAreas: {
        sleep: 65,
        appetite: 80,
        energy: 85,
        social: 75,
        attention: 25
      },
      neuromotorBiomarkers: {
        reactionTimeMs: 275,
        omissionErrors: 12,
        commissionErrors: 14,
        motorStabilityScore: 58
      },
      qeegZScores: {
        frontalThetaBetaRatio: 2.8,
        temporalAsymmetry: 0.1,
        alphaPeakFrequencyHz: 9.8,
        deltaSlowActivityZ: 0.8
      },
      substancesHistory: {
        alcohol: 'Ocasional social',
        tobacco: 'Negativo',
        cannabis: 'Negativo',
        stimulants: 'Negativo sin prescripción',
        medicationsCurrent: ['Ninguno']
      },
      medicalHistory: ['Salud física óptima']
    }
  },
  {
    name: 'Caso 4: Trastorno Neurocognitivo Mayor vs Delirium en Paciente Añoso',
    description: 'Varón de 72 años con EPOC e infección severa, fluctuación circadiana (puesta de sol) y alucinaciones visuales.',
    record: {
      id: 'PAC-2045',
      patientNameAnonymized: 'Paciente E. B. (72 años)',
      age: 72,
      gender: 'M',
      consultationReason: 'Confusión fluctuante aguda, agitación nocturna y alucinaciones visuales (ve cables como serpientes).',
      anamnesis: 'Paciente masculino de 72 años con antecedente de EPOC oxígeno-dependiente. Hace 5 días sufrió herida punzante en talón con evolución a celulitis y bacteriemia febril (38.9°C). Durante el día permanece somnoliento y por la noche se agita, desconoce a su hija y ve fieras en la habitación.',
      sessionNotes: [
        'Interconsulta hospitalaria: Desorientado en tiempo y espacio (cree estar en un barco de pesca). Atención muy lábil, lenguaje entrecortado con momentos de lucidez matutina.',
        'Exploración médica: Saturación O2 86%, leucocitosis 16,500/mm3. ECG taquicardia sinusal.'
      ],
      multisensoryHardware: {
        vagalToneHrvIndex: 22,
        handGripPressureKg: 18.2,
        camouflagingIndexPct: 5,
        ocularFixationDurationMs: 3100,
        touchTapLatencyCompensatedMs: 560,
        microExpressionState: 'Incongruencia Afectiva'
      },
      audioRecordings: [
        {
          id: 'AUD-2045-01',
          sessionNumber: 1,
          date: '2025-02-19',
          durationSeconds: 80,
          audioTitle: 'Interconsulta en Cama: Estado Confusional y Fluctuación',
          transcriptText: '...Ese cable en la pared se convirtió en víbora... sáquenme de este barco que ya es tarde para la faena... ¿Dónde está mi hija? ¿Quiénes son ustedes?...',
          acousticBiometrics: {
            speechRateWpm: 84,
            bradylaliaIndex: 78,
            affectiveFlatteningScore: 65,
            responseLatencyMs: 1980,
            prosodyVariabilityPct: 35,
            acousticStressMarker: 'Labilidad Emocional'
          },
          audioWaveformData: [20, 25, 45, 15, 10, 50, 40, 20, 15, 30]
        }
      ],
      psychopharmacologyCurrent: [
        {
          drugName: 'Haloperidol (dosis baja rescate)',
          dosage: '1 mg oral noche',
          durationMonths: 0.1,
          adherenceStatus: 'Adherente'
        }
      ],
      sentinelTelemetry: {
        pacId: 'PAC-2045',
        deviceSyncTime: 'Hace 15 minutos',
        sleepMetrics: {
          nightWakeups: 7,
          hoursInDarkness: 4.0,
          avgSleepDurationHours: 2.8,
          sleepEfficiencyPct: 34
        },
        behavioralBiometrics: {
          typingLatencyMs: 560,
          screenActiveTimeMinutes: 190,
          biomotorLatencyMs: 560,
          activityRestlessnessIndex: 88
        },
        safetyStatus: {
          riskLevel: 'ALTO',
          activeContentionTriggered: true,
          passiveRiskRationale: 'Inversión marcada del ciclo circadiano, fragmentación extrema del sueño y caídas motoras asociadas a estado confusional agudo.',
          emergencyContact: {
            name: 'Clara Brion',
            relationship: 'Esposa',
            phone: '+52 (55) 8830-4412'
          }
        },
        nightWakeups: 7,
        avgSleepDurationHours: 2.8,
        sleepEfficiencyPct: 34,
        biomotorLatencyMs: 560,
        screenOnNightTimeMinutes: 190,
        activityRestlessnessIndex: 88,
        crisisDistressTriggered: true,
        passiveRiskScore: 'ALTO',
        passiveRiskRationale: 'Inversión marcada del ciclo circadiano, fragmentación extrema del sueño y caídas motoras asociadas a estado confusional agudo.',
        emergencyContact: {
          name: 'Clara Brion',
          relationship: 'Esposa',
          phone: '+52 (55) 8830-4412'
        }
      },
      qeegBiomarkers: {
        recordingDate: '2025-02-17',
        channelsCount: 19,
        samplingRateHz: 500,
        bandPowers: {
          delta: 48,
          theta: 29,
          alfa: 12,
          beta: 8,
          highBeta: 2,
          gamma: 1
        },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: 2.9, thetaZ: 2.1, alfaZ: -1.8, betaZ: -1.2, highBetaZ: -0.9, coherenceZ: 0.65, interpretation: 'Enlentecimiento polimorfo generalizado con ondas delta continuas (+2.9σ)' },
          parietal: { region: 'Parietal', deltaZ: 2.4, thetaZ: 1.8, alfaZ: -1.4, betaZ: -0.8, highBetaZ: -0.5, coherenceZ: 0.72 },
          temporal: { region: 'Temporal', deltaZ: 2.7, thetaZ: 1.9, alfaZ: -1.1, betaZ: -0.6, highBetaZ: -0.4, coherenceZ: 0.68 },
          occipital: { region: 'Occipital', deltaZ: 2.0, thetaZ: 1.5, alfaZ: -1.6, betaZ: -0.9, highBetaZ: -0.5, coherenceZ: 0.74 }
        },
        thetaBetaRatio: 2.1,
        alphaPeakFrequencyHz: 7.2
      },
      psychometricScores: {
        phq9: 6,
        mmse: 14,
        sadPersons: 2,
        cssrsLevel: 0,
        gafEstimated: 25
      },
      functionalAreas: {
        sleep: 20,
        appetite: 30,
        energy: 25,
        social: 20,
        attention: 15
      },
      neuromotorBiomarkers: {
        reactionTimeMs: 560,
        omissionErrors: 18,
        commissionErrors: 9,
        motorStabilityScore: 28
      },
      qeegZScores: {
        frontalThetaBetaRatio: 2.1,
        temporalAsymmetry: 0.8,
        alphaPeakFrequencyHz: 7.2,
        deltaSlowActivityZ: 2.9
      },
      substancesHistory: {
        alcohol: 'Abstemio desde hace 15 años',
        tobacco: 'Ex-fumador severo (60 paquetes/año)',
        cannabis: 'Negativo',
        stimulants: 'Negativo',
        medicationsCurrent: ['Bromuro de ipratropio', 'Salbutamol aerosol', 'Oxigenoterapia domiciliaria 2L/min']
      },
      medicalHistory: ['EPOC GOLD III', 'Celulitis infecciosa de pie derecho con septicemia']
    }
  }
];
