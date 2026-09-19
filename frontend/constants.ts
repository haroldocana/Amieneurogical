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
        vagalToneHrvIndex: 18,
        handGripPressureKg: 21.4,
        camouflagingIndexPct: 12,
        ocularFixationDurationMs: 4200,
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
        bandPowers: { delta: 34, theta: 28, alfa: 18, beta: 14, highBeta: 6, gamma: 2 },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: 1.9, thetaZ: 2.3, alfaZ: -1.2, betaZ: 0.4, highBetaZ: 0.1, coherenceZ: 0.81, interpretation: 'Enlentecimiento frontal difuso con elevación de ondas lentas' },
          parietal: { region: 'Parietal', deltaZ: 0.4, thetaZ: 0.8, alfaZ: 0.3, betaZ: 0.2, highBetaZ: 0.0, coherenceZ: 0.94 },
          temporal: { region: 'Temporal', deltaZ: 0.6, thetaZ: 1.1, alfaZ: 1.8, betaZ: 0.9, highBetaZ: 0.3, coherenceZ: 0.89 },
          occipital: { region: 'Occipital', deltaZ: 0.2, thetaZ: 0.4, alfaZ: 1.9, betaZ: -0.1, highBetaZ: 0.0, coherenceZ: 0.92 }
        },
        thetaBetaRatio: 1.8,
        alphaPeakFrequencyHz: 8.5
      },
      psychometricScores: { phq9: 24, gad7: 16, bdi2: 42, bai: 18, mmse: 29, sadPersons: 9, cssrsLevel: 5, gafEstimated: 25, whodas2: 4.2 },
      functionalAreas: { sleep: 15, appetite: 20, energy: 15, social: 10, attention: 35 },
      neuromotorBiomarkers: { reactionTimeMs: 485, omissionErrors: 8, commissionErrors: 2, motorStabilityScore: 42 },
      qeegZScores: { frontalThetaBetaRatio: 1.8, temporalAsymmetry: 0.4, alphaPeakFrequencyHz: 8.5, deltaSlowActivityZ: 1.9 },
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
        ocularFixationDurationMs: 140,
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
        bandPowers: { delta: 12, theta: 35, alfa: 15, beta: 26, highBeta: 12, gamma: 5 },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: -0.5, thetaZ: 3.2, alfaZ: -1.4, betaZ: 2.6, highBetaZ: 2.1, coherenceZ: 0.76, interpretation: 'Desincronización fronto-estriatal masiva con exceso theta/beta' },
          parietal: { region: 'Parietal', deltaZ: -0.2, thetaZ: 1.4, alfaZ: -0.8, betaZ: 1.8, highBetaZ: 1.2, coherenceZ: 0.88 },
          temporal: { region: 'Temporal', deltaZ: 0.1, thetaZ: 1.8, alfaZ: 1.4, betaZ: 2.2, highBetaZ: 1.5, coherenceZ: 0.82 },
          occipital: { region: 'Occipital', deltaZ: -0.3, thetaZ: 0.5, alfaZ: 1.1, betaZ: 0.8, highBetaZ: 0.4, coherenceZ: 0.94 }
        },
        thetaBetaRatio: 3.2,
        alphaPeakFrequencyHz: 11.2
      },
      psychometricScores: { phq9: 2, gad7: 12, bdi2: 4, mmse: 27, asrs: 15, sadPersons: 3, cssrsLevel: 0, gafEstimated: 25 },
      functionalAreas: { sleep: 10, appetite: 40, energy: 98, social: 95, attention: 20 },
      neuromotorBiomarkers: { reactionTimeMs: 195, omissionErrors: 1, commissionErrors: 19, motorStabilityScore: 30 },
      qeegZScores: { frontalThetaBetaRatio: 3.2, temporalAsymmetry: 1.4, alphaPeakFrequencyHz: 11.2, deltaSlowActivityZ: -0.5 },
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
        bandPowers: { delta: 15, theta: 38, alfa: 22, beta: 16, highBeta: 7, gamma: 2 },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: 0.8, thetaZ: 2.8, alfaZ: -0.4, betaZ: 0.2, highBetaZ: 0.1, coherenceZ: 0.85, interpretation: 'Ratio Theta/Beta frontal 2.8σ compatible con fenotipo TDAH inatento' },
          parietal: { region: 'Parietal', deltaZ: 0.2, thetaZ: 1.1, alfaZ: 0.4, betaZ: 0.1, highBetaZ: 0.0, coherenceZ: 0.95 },
          temporal: { region: 'Temporal', deltaZ: 0.3, thetaZ: 0.9, alfaZ: 0.1, betaZ: 0.4, highBetaZ: 0.1, coherenceZ: 0.92 },
          occipital: { region: 'Occipital', deltaZ: 0.1, thetaZ: 0.4, alfaZ: 1.5, betaZ: -0.2, highBetaZ: 0.0, coherenceZ: 0.96 }
        },
        thetaBetaRatio: 2.8,
        alphaPeakFrequencyHz: 9.8
      },
      psychometricScores: { phq9: 8, gad7: 11, asrs: 17, mmse: 30, sadPersons: 1, cssrsLevel: 0, gafEstimated: 70 },
      functionalAreas: { sleep: 65, appetite: 80, energy: 85, social: 75, attention: 25 },
      neuromotorBiomarkers: { reactionTimeMs: 275, omissionErrors: 12, commissionErrors: 14, motorStabilityScore: 58 },
      qeegZScores: { frontalThetaBetaRatio: 2.8, temporalAsymmetry: 0.1, alphaPeakFrequencyHz: 9.8, deltaSlowActivityZ: 0.8 },
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
        bandPowers: { delta: 48, theta: 29, alfa: 12, beta: 8, highBeta: 2, gamma: 1 },
        regionalZScores: {
          frontal: { region: 'Frontal', deltaZ: 2.9, thetaZ: 2.1, alfaZ: -1.8, betaZ: -1.2, highBetaZ: -0.9, coherenceZ: 0.65, interpretation: 'Enlentecimiento polimorfo generalizado con ondas delta continuas (+2.9σ)' },
          parietal: { region: 'Parietal', deltaZ: 2.4, thetaZ: 1.8, alfaZ: -1.4, betaZ: -0.8, highBetaZ: -0.5, coherenceZ: 0.72 },
          temporal: { region: 'Temporal', deltaZ: 2.7, thetaZ: 1.9, alfaZ: -1.1, betaZ: -0.6, highBetaZ: -0.4, coherenceZ: 0.68 },
          occipital: { region: 'Occipital', deltaZ: 2.0, thetaZ: 1.5, alfaZ: -1.6, betaZ: -0.9, highBetaZ: -0.5, coherenceZ: 0.74 }
        },
        thetaBetaRatio: 2.1,
        alphaPeakFrequencyHz: 7.2
      },
      psychometricScores: { phq9: 6, mmse: 14, sadPersons: 2, cssrsLevel: 0, gafEstimated: 25 },
      functionalAreas: { sleep: 20, appetite: 30, energy: 25, social: 20, attention: 15 },
      neuromotorBiomarkers: { reactionTimeMs: 560, omissionErrors: 18, commissionErrors: 9, motorStabilityScore: 28 },
      qeegZScores: { frontalThetaBetaRatio: 2.1, temporalAsymmetry: 0.8, alphaPeakFrequencyHz: 7.2, deltaSlowActivityZ: 2.9 },
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

export const MASTER_VR_ENVIRONMENTS = {
  version: "3.8.0-AMIE-CLINICAL",
  systemName: "AMIE VR 52-DISORDER MASTER CONFIGURATION",
  updatedAt: "2026-03-20T00:00:00Z",
  environmentsCount: 10,
  coveredDisordersCount: 52,
  defaultSamplingRateHz: 60,
  masterEnvironments: [
    {
      id: "ENV_01_CLASSROOM_OFFICE",
      name: "Aula / Oficina de Carga Atencional y Cognitiva",
      unitySceneName: "Scene_Classroom_CPT3D",
      supportedClinicalTasks: ["CPT_3D_GO_NO_GO", "N_BACK_MEMORY", "STROOP_3D_SPATIAL"],
      targetDisorders: [
        { code: "6A05.0", dsm5: "314.01", name: "TDAH Presentación Combinada" },
        { code: "6A05.1", dsm5: "314.00", name: "TDAH Presentación Inatenta" },
        { code: "6A05.2", dsm5: "314.01", name: "TDAH Presentación Hiperactiva/Impulsiva" },
        { code: "6A03.0", dsm5: "315.00", name: "Trastorno Específico del Aprendizaje (Lectura/Dislexia)" },
        { code: "6A03.1", dsm5: "315.1", name: "Trastorno Específico del Aprendizaje (Cálculo/Discalculia)" },
        { code: "6A04", dsm5: "315.4", name: "Trastorno del Desarrollo de la Coordinación Motora" }
      ],
      controllableParameters: {
        distractorDensity360: { type: "range", min: 0, max: 12, default: 4, unit: "active_distractors" },
        stimulusIntervalMs: { type: "range", min: 200, max: 2000, default: 1000, unit: "milliseconds" },
        ambientNoiseDecibels: { type: "range", min: 30, max: 85, default: 50, unit: "dB" },
        openDoorDistractorActive: { type: "boolean", default: true }
      },
      lslEventMarkers: {
        stimulusTarget: "STIMULUS_TARGET_GO",
        stimulusNoGo: "STIMULUS_NOGO",
        commissionError: "ERROR_COMMISSION_IMPULSIVITY",
        omissionError: "ERROR_OMISSION_INATTENTION"
      },
      biometricThresholds: {
        maxPupilDilationMm: 4.5,
        maxHeadJitterIndex: 0.35,
        criticalHrvDropMs: 20
      }
    },
    {
      id: "ENV_02_INTERPERSONAL_AUDITORIUM",
      name: "Auditorio Intersubjetivo e Interacción Social",
      unitySceneName: "Scene_Auditorium_TSST",
      supportedClinicalTasks: ["VR_TSST_SPEECH", "SOCIAL_GAZE_TRACKING", "CAMOUFLAGING_DETECTOR"],
      targetDisorders: [
        { code: "6B01", dsm5: "300.23", name: "Trastorno de Ansiedad Social (Fobia Social)" },
        { code: "6A02.0", dsm5: "299.00", name: "Trastorno del Espectro Autista Nivel 1 (Sin DTI)" },
        { code: "6A02.1", dsm5: "299.00", name: "Trastorno del Espectro Autista Nivel 2/3 (Con DTI)" },
        { code: "6B04", dsm5: "309.21", name: "Trastorno de Ansiedad por Separación" },
        { code: "6B05", dsm5: "312.23", name: "Mutismo Selectivo" },
        { code: "6D11.0", dsm5: "301.82", name: "Trastorno de la Personalidad Evitativa" },
        { code: "6D11.1", dsm5: "301.20", name: "Trastorno de la Personalidad Esquizoide" },
        { code: "6A22", dsm5: "301.22", name: "Trastorno de la Personalidad Esquizotípica" }
      ],
      controllableParameters: {
        audienceSize: { type: "range", min: 1, max: 100, default: 25, unit: "avatars" },
        avatarAffectiveExpression: { type: "select", options: ["NEUTRAL", "HOSTILE_DISAPPROVAL", "APPROVING", "INATTENTIVE"], default: "HOSTILE_DISAPPROVAL" },
        stageLightingLux: { type: "range", min: 100, max: 2000, default: 800, unit: "lux" },
        directEyeContactEnforced: { type: "boolean", default: true }
      },
      lslEventMarkers: {
        speechStart: "MARKER_SPEECH_START",
        audienceGasp: "MARKER_AUDIENCE_REACTION_NEGATIVE",
        eyeAvoidanceDetected: "MARKER_EYE_AVOIDANCE_EVENT"
      },
      biometricThresholds: {
        gsrSpikeMicroSiemens: 4.5,
        minHrvRmssdMs: 25,
        saccadicFrequencyHz: 3.2
      }
    },
    {
      id: "ENV_03_CUE_EXPOSURE_LOUNGE",
      name: "Bar / Casino / Habitación de Exposición a Pistas (Cue-Exposure)",
      unitySceneName: "Scene_CueExposure_Lounge",
      supportedClinicalTasks: ["CUE_EXPOSURE_THERAPY", "INHIBITORY_CONTROL_BAR"],
      targetDisorders: [
        { code: "6C40", dsm5: "303.90", name: "Trastorno por Consumo de Alcohol" },
        { code: "6C41", dsm5: "304.30", name: "Trastorno por Consumo de Cánnabis" },
        { code: "6C42", dsm5: "304.20", name: "Trastorno por Consumo de Estimulantes (Cocaína/Anfetaminas)" },
        { code: "6C43", dsm5: "304.00", name: "Trastorno por Consumo de Opioides" },
        { code: "6C4A", dsm5: "305.1", name: "Trastorno por Consumo de Tabaco / Nicotina" },
        { code: "6C50", dsm5: "312.31", name: "Trastorno por Juego de Apuestas (Ludopatía)" },
        { code: "6C51", dsm5: "312.39", name: "Trastorno por Juego por Internet (Gaming Disorder)" },
        { code: "6C4E", dsm5: "312.34", name: "Trastorno Explosivo Intermitente / Conducta Impulsiva" }
      ],
      controllableParameters: {
        substanceType: { type: "select", options: ["ALCOHOL", "CANNABIS", "STIMULANTS", "GAMBLING_SLOTS", "TOBACCO"], default: "ALCOHOL" },
        peerPressureAvatars: { type: "range", min: 0, max: 5, default: 2, unit: "avatars" },
        cueProximityMeters: { type: "range", min: 0.2, max: 3.0, default: 0.5, unit: "meters" }
      },
      lslEventMarkers: {
        cuePresented: "CUE_STIMULUS_PRESENTED",
        approachTriggered: "APPROACH_BEHAVIOR_DETECTED",
        avoidanceTriggered: "AVOIDANCE_BEHAVIOR_DETECTED"
      },
      biometricThresholds: {
        cravingGsrSpike: 5.0,
        hrvVagalCollapseMs: 18
      }
    },
    {
      id: "ENV_04_BODY_IMAGE_BUFFET",
      name: "Espejo Virtual y Buffet de Alimentación",
      unitySceneName: "Scene_BodyImage_Buffet",
      supportedClinicalTasks: ["BODY_DISMORPHIA_HEATMAP", "FOOD_PROVOCATION_TEST"],
      targetDisorders: [
        { code: "6B80", dsm5: "307.1", name: "Anorexia Nerviosa (Restrictiva / Purgativa)" },
        { code: "6B81", dsm5: "307.51", name: "Bulimia Nerviosa" },
        { code: "6B82", dsm5: "307.54", name: "Trastorno por Atracón (Binge Eating)" },
        { code: "6B83", dsm5: "307.59", name: "Trastorno de Evitación/Restricción de la Ingesta (ARFID)" },
        { code: "6B21", dsm5: "300.7", name: "Trastorno Dismórfico Corporal" }
      ],
      controllableParameters: {
        avatarBmiDistortionPct: { type: "range", min: -30, max: 50, default: 0, unit: "percent" },
        foodCaloricDensity: { type: "select", options: ["LOW_CALORIE", "HIGH_CALORIE_BINGE", "MIXED"], default: "HIGH_CALORIE_BINGE" },
        mirrorEyeGazeHeatmapActive: { type: "boolean", default: true }
      },
      lslEventMarkers: {
        mirrorLookStart: "MIRROR_INSPECTION_START",
        bodyDistortionPeak: "BODY_DISTORTION_APPLIED",
        bingeFoodApproach: "BINGE_FOOD_GAZE_FIXATION"
      },
      biometricThresholds: {
        fixationDurationMs: 2500,
        gsrElevationMicroSiemens: 3.8
      }
    },
    {
      id: "ENV_05_PHOBIA_ELEVATOR_HEIGHTS",
      name: "Ascensor / Balcón / Espacios Limítrofes (Fobias y Pánico)",
      unitySceneName: "Scene_Phobia_Elevator_Heights",
      supportedClinicalTasks: ["VRET_GRADUAL_EXPOSURE", "INTEROCEPTIVE_PANIC_PROVOCATION"],
      targetDisorders: [
        { code: "6B02", dsm5: "300.22", name: "Agorafobia" },
        { code: "6B00", dsm5: "300.01", name: "Trastorno de Pánico" },
        { code: "6B03.0", dsm5: "300.29", name: "Acrofobia (Miedo a las alturas)" },
        { code: "6B03.1", dsm5: "300.29", name: "Claustrofobia (Espacios cerrados)" },
        { code: "6B03.2", dsm5: "300.29", name: "Aerofobia (Miedo a volar)" },
        { code: "6B03.3", dsm5: "300.29", name: "Aracnofobia / Zoofobia" },
        { code: "6B03.4", dsm5: "300.29", name: "Fobia a Sangre / Inyecciones / Heridas" }
      ],
      controllableParameters: {
        floorHeightMeters: { type: "range", min: 0, max: 200, default: 50, unit: "meters" },
        elevatorEnclosureTightness: { type: "range", min: 0, max: 100, default: 80, unit: "percent" },
        turbulenceLevel: { type: "range", min: 0, max: 10, default: 0, unit: "index" }
      },
      lslEventMarkers: {
        exposureLevelIncreased: "VRET_EXPOSURE_STEP_UP",
        panicSpikeDetected: "PANIC_BIOMETRIC_SPIKE",
        habituationReached: "HABITUATION_CRITERIA_MET"
      },
      biometricThresholds: {
        panicHeartRateBpm: 125,
        panicGsrMicroSiemens: 6.5,
        habituationIndexH: 2.5
      }
    },
    {
      id: "ENV_06_CYBERBALL_SOCIAL_REJECTION",
      name: "Simulación Cyberball (Exclusión Social y Rechazo)",
      unitySceneName: "Scene_Cyberball_Rejection",
      supportedClinicalTasks: ["CYBERBALL_PARADIGM", "REJECTION_SENSITIVITY_TEST"],
      targetDisorders: [
        { code: "6D11.2", dsm5: "301.83", name: "Trastorno Límite de la Personalidad (TLP)" },
        { code: "6D11.3", dsm5: "301.50", name: "Trastorno de la Personalidad Histriónica" },
        { code: "6D11.4", dsm5: "301.81", name: "Trastorno de la Personalidad Narcisista" },
        { code: "6D11.5", dsm5: "301.6", name: "Trastorno de la Personalidad Dependiente" },
        { code: "6B00", dsm5: "300.02", name: "Trastorno de Ansiedad Generalizada (TAG)" }
      ],
      controllableParameters: {
        exclusionPhaseActive: { type: "boolean", default: true },
        throwsToPatientPct: { type: "range", min: 0, max: 50, default: 0, unit: "percent" },
        avatarSmirkOnExclusion: { type: "boolean", default: true }
      },
      lslEventMarkers: {
        inclusionPhaseStart: "CYBERBALL_INCLUSION_START",
        exclusionPhaseStart: "CYBERBALL_EXCLUSION_START",
        rejectionReactionPeak: "REJECTION_GSPSP_PEAK"
      },
      biometricThresholds: {
        paroxysmalHrvDropMs: 15,
        sympatheticLabilityIndex: 5.2
      }
    },
    {
      id: "ENV_07_DISASSOCIATION_AGENCY_ROOM",
      name: "Habitación Sensoriomotora y Perturbación de Agencia",
      unitySceneName: "Scene_AgencyPerturbation_Disassociation",
      supportedClinicalTasks: ["SENSORIMOTOR_AGENCY_TEST", "RUBBER_HAND_VR_ILLUSION"],
      targetDisorders: [
        { code: "6A20", dsm5: "295.90", name: "Esquizofrenia (Fase Aguda / Síntomas Negativos)" },
        { code: "6A21", dsm5: "295.40", name: "Trastorno Esquizofreniforme / Psicosis Breve" },
        { code: "6A24", dsm5: "297.1", name: "Trastorno Delirante (Paranoia)" },
        { code: "6B60", dsm5: "300.6", name: "Trastorno de Despersonalización / Desrealización" },
        { code: "6B61", dsm5: "300.12", name: "Trastorno de Amnesia Disociativa" },
        { code: "6C20", dsm5: "300.82", name: "Trastorno de Síntomas Somáticos / Hipocondría" }
      ],
      controllableParameters: {
        controllerTrackingDelayMs: { type: "range", min: 0, max: 300, default: 150, unit: "milliseconds" },
        auditoryHallucinationVolume: { type: "range", min: 0, max: 100, default: 30, unit: "percent" },
        mirrorDesynchronizationActive: { type: "boolean", default: true }
      },
      lslEventMarkers: {
        agencyPerturbationApplied: "AGENCY_PERTURBATION_APPLIED",
        hallucinationTriggered: "AUDITORY_HALLUCINATION_PLAYED",
        realityTestingBreak: "REALITY_TESTING_DISRUPTED"
      },
      biometricThresholds: {
        motorTremorJitterHz: 4.5,
        gsrHypoReactivityMicroSiemens: 0.5
      }
    },
    {
      id: "ENV_08_TRAUMA_EXPOSURE_ZONE",
      name: "Zona de Evento Traumático Controlado (TEPT y EMDR 3D)",
      unitySceneName: "Scene_Trauma_EMDR_Exposure",
      supportedClinicalTasks: ["EMDR_3D_BILATERAL_HAPTIC", "PROLONGED_EXPOSURE_VR"],
      targetDisorders: [
        { code: "6B40", dsm5: "309.81", name: "Trastorno de Estrés Postraumático (TEPT)" },
        { code: "6B41", dsm5: "308.3", name: "Trastorno de Estrés Agudo" },
        { code: "6B42", dsm5: "309.28", name: "Trastornos de Adaptación" },
        { code: "6B43", dsm5: "313.89", name: "Trastorno de Apego Reactivo / Desinhibido" }
      ],
      controllableParameters: {
        emdrSaccadicSpeedHz: { type: "range", min: 0.5, max: 3.0, default: 1.5, unit: "Hz" },
        controllerHapticBilateralActive: { type: "boolean", default: true },
        traumaCueDesaturationPct: { type: "range", min: 0, max: 100, default: 50, unit: "percent" }
      },
      lslEventMarkers: {
        emdrSweepStart: "EMDR_SWEEP_START",
        startleResponseSpike: "STARTLE_RESPONSE_SPIKE",
        traumaUncouplingMet: "TRAUMA_UNCOUPLING_SUCCESS"
      },
      biometricThresholds: {
        startleGsrPeakMicroSiemens: 6.8,
        habituationExtinctionH: 2.2
      }
    },
    {
      id: "ENV_09_BIOPHILIC_SANCTUARY",
      name: "Santuario Biofílico y Autorregulación Vagal (Depresión / Bipolar)",
      unitySceneName: "Scene_Biophilic_Sanctuary",
      supportedClinicalTasks: ["ANHEDONIA_REWARD_MAPPING", "VAGAL_BIOFEEDBACK_BREATHING"],
      targetDisorders: [
        { code: "6A70", dsm5: "296.23", name: "Trastorno de Depresión Mayor (TDM) Episodio Único" },
        { code: "6A71", dsm5: "296.33", name: "Trastorno de Depresión Mayor Recurrente" },
        { code: "6A72", dsm5: "300.4", name: "Trastorno Depresivo Persistente (Distimia)" },
        { code: "6A60", dsm5: "296.40", name: "Trastorno Bipolar I (Episodio Maníaco/Depresivo)" },
        { code: "6A61", dsm5: "296.89", name: "Trastorno Bipolar II" }
      ],
      controllableParameters: {
        environmentColorSaturation: { type: "range", min: 0, max: 100, default: 80, unit: "percent" },
        biofeedbackOceanWavesHrvSync: { type: "boolean", default: true },
        rewardTaskFrequency: { type: "range", min: 1, max: 10, default: 5, unit: "tasks_per_min" }
      },
      lslEventMarkers: {
        rewardTaskCompleted: "REWARD_TASK_COMPLETED",
        affectiveResonanceStart: "AFFECTIVE_RESONANCE_START",
        vagalCoherenceAchieved: "VAGAL_COHERENCE_ACHIEVED"
      },
      biometricThresholds: {
        targetHrvRmssdMs: 45,
        basalGsrMicroSiemens: 1.2
      }
    },
    {
      id: "ENV_10_NEURODEGENERATIVE_DAILY_HOME",
      name: "Hogar Virtual de Actividades de la Vida Diaria (AVD) / Neurocognitivo",
      unitySceneName: "Scene_DailyHome_CognitiveAVD",
      supportedClinicalTasks: ["AVD_FUNCTIONAL_ASSESSMENT", "SPATIAL_ORIENTATION_TEST"],
      targetDisorders: [
        { code: "6D70", dsm5: "331.83", name: "Deterioro Cognitivo Leve (DCL)" },
        { code: "6D80", dsm5: "294.11", name: "Trastorno Neurocognitivo Mayor (Tipo Alzheimer)" },
        { code: "6D81", dsm5: "290.40", name: "Trastorno Neurocognitivo Vascular" },
        { code: "6D82", dsm5: "294.11", name: "Trastorno Neurocognitivo por Cuerpos de Lewy" },
        { code: "6D83", dsm5: "294.11", name: "Trastorno Neurocognitivo Frontotemporal" },
        { code: "6D71", dsm5: "293.0", name: "Delirium / Estado Confusional Agudo" }
      ],
      controllableParameters: {
        objectsMisplacementCount: { type: "range", min: 0, max: 10, default: 3, unit: "objects" },
        stepByStepVoiceGuidance: { type: "boolean", default: false },
        clockDrawingTaskActive: { type: "boolean", default: true }
      },
      lslEventMarkers: {
        avdTaskStart: "AVD_TASK_START",
        spatialDisorientationError: "SPATIAL_DISORIENTATION_ERROR",
        taskCompletedSuccess: "AVD_TASK_COMPLETED_SUCCESS"
      },
      biometricThresholds: {
        maxHesitationLatencySec: 15,
        motorTremorAmplitude: 0.4
      }
    }
  ]
};
