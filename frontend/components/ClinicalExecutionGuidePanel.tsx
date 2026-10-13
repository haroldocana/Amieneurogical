import React from 'react';
import { PsychotherapyFramework, PharmacologyClass } from '../types';
import { 
  BookOpen, 
  CheckCircle, 
  ShieldCheck, 
  Pill, 
  Brain, 
  AlertTriangle, 
  Clock, 
  Info, 
  Zap,
  Sparkles
} from 'lucide-react';

interface ClinicalExecutionGuidePanelProps {
  selectedFramework: PsychotherapyFramework | string;
  selectedPharmacology: PharmacologyClass | string;
}

export const ClinicalExecutionGuidePanel: React.FC<ClinicalExecutionGuidePanelProps> = ({
  selectedFramework,
  selectedPharmacology,
}) => {
  // Normalización defensiva para evitar fallos por minúsculas
  const fwKey = (selectedFramework || '').toString().trim().toUpperCase();
  const pcKey = (selectedPharmacology || '').toString().trim().toUpperCase();

  // ------------------------------------------------------------------------
  // 1. DICCIONARIO DE PSICOTERAPIA
  // ------------------------------------------------------------------------
  const getTherapyGuide = (fw: string) => {
    switch (fw) {
      case 'TCC':
        return {
          title: 'Terapia Cognitivo-Conductual (TCC Estandarizada)',
          duration: '12 a 16 Sesiones estructuradas',
          steps: [
            { step: 'Fase 1: Psicoeducación & Registro de Pensamientos', desc: 'Identificación de distorsiones cognitivas (catastrofismo, inferencia arbitraria) mediante autorregistros tripartitos.' },
            { step: 'Fase 2: Reestructuración Cognitiva & Prueba de Realidad', desc: 'Disputa socrática y búsqueda de evidencia empírica contradictoria para generar esquemas adaptativos.' },
            { step: 'Fase 3: Exposición Gradual con Prevención de Respuesta (EPR)', desc: 'Jerarquización de estímulos fóbicos u obsesivos (escala 0-100 SUDS) y extinción sin conductas compensatorias.' },
            { step: 'Fase 4: Activación Conductual y Prevención de Recaídas', desc: 'Programación de actividades de dominio y placer; consolidación de estrategias de afrontamiento autónomo.' },
          ],
          contraindications: 'Psicosis aguda activa no contenida o intoxicación severa por sustancias.'
        };
      case 'DBT':
        return {
          title: 'Terapia Dialéctico-Conductual (DBT - Linehan)',
          duration: 'Módulos de 24 semanas (individual + entrenamiento grupal)',
          steps: [
            { step: 'Fase 1: Habilidades de Mindfulness Nuclear', desc: 'Entrenamiento en Mente de Sabio y habilidades Qué/Cómo (Observar, Describir, Participar sin juzgar).' },
            { step: 'Fase 2: Tolerancia al Malestar (Protocolo TIPP)', desc: 'Uso de temperatura fría, ejercicio intenso, respiración pausada y relajación pareada para frenar crisis impulsivas.' },
            { step: 'Fase 3: Regulación Emocional y Acción Opuesta', desc: 'Identificación de impulsos de acción destructivos y ejecución deliberada de la conducta opuesta.' },
            { step: 'Fase 4: Efectividad Interpersonal (DEAR MAN / FAST)', desc: 'Expresión asertiva de límites y necesidades manteniendo el autorrespeto y el vínculo relacional.' },
          ],
          contraindications: 'Deterioro neurocognitivo mayor que impida el aprendizaje y retención procedimental.'
        };
      case 'EMDR':
        return {
          title: 'Reprocesamiento por Movimientos Oculares (EMDR - Shapiro)',
          duration: '8 a 12 Sesiones focalizadas en memorias traumáticas',
          steps: [
            { step: 'Fase 1-2: Preparación e Instalación de Lugar Seguro', desc: 'Estabilización afectiva, anclaje somatosensorial y despistaje de disociación estructural (DES-II).' },
            { step: 'Fase 3: Evaluación de la Diana Traumática', desc: 'Identificación de imagen nuclear, Cognición Negativa (CN), Cognición Positiva (CP) y escalas VOC / SUD.' },
            { step: 'Fase 4-5: Desensibilización y Estimulación Bilateral (EB)', desc: 'Barridos sacádicos continuos a 1.2-1.5 Hz o estimulación táctil bilateral hasta reducir SUD a 0.' },
            { step: 'Fase 6-8: Exploración Somática y Cierre Adaptativo', desc: 'Chequeo corporal de tensión residual e integración adaptativa de redes mnémicas.' },
          ],
          contraindications: 'Epilepsia fotoinducida no controlada, inestabilidad hemodinámica severa o disociación no estabilizada.'
        };
      case 'ACT':
        return {
          title: 'Terapia de Aceptación y Compromiso (ACT - Hayes)',
          duration: '10 a 14 Sesiones experienciales',
          steps: [
            { step: 'Fase 1: Desesperanza Creativa', desc: 'Evidenciar la paradoja del control emocional ("el intento de control es el problema, no la solución").' },
            { step: 'Fase 2: Defusión Cognitiva', desc: 'Desarticulación de la fusión con el lenguaje mental ("notar que mi mente me está diciendo que...").' },
            { step: 'Fase 3: Aceptación y Yo-Como-Contexto', desc: 'Apertura interoceptiva hacia sensaciones viscerales difíciles sin escape conductual.' },
            { step: 'Fase 4: Clarificación de Valores y Acción Comprometida', desc: 'Construcción de patrones de acción guiados por direcciones vitales significativas elegidas.' },
          ],
          contraindications: 'Episodio maníaco agudo con desorganización de pensamiento o encefalopatía metabólica.'
        };
      case 'SISTEMICA':
        return {
          title: 'Terapia Familiar Sistémica (Estructural y Estratégica)',
          duration: '8 a 12 Sesiones relacionales',
          steps: [
            { step: 'Fase 1: Mapeo Relacional y Genograma Trigeneracional', desc: 'Desactivación de la etiqueta de "paciente identificado" y delimitación de fronteras generacionales.' },
            { step: 'Fase 2: Preguntas Circulares y Connotación Positiva', desc: 'Sustitución de atribuciones lineales por la visibilización de circuitos recursivos de retroalimentación.' },
            { step: 'Fase 3: Prescripciones Conductuales e Intervención en Homeostasis', desc: 'Reestructuración de alianzas patológicas y redefinición jerárquica del subsistema parental.' },
          ],
          contraindications: 'Violencia física activa, abuso intrafamiliar no judicializado o falta de seguridad física en el hogar.'
        };
      case 'TERAPIA_ESQUEMAS':
        return {
          title: 'Terapia de Esquemas (Jeffrey Young)',
          duration: '1 a 2 Años (Trastornos Severos de la Personalidad)',
          steps: [
            { step: 'Fase 1: Identificación de Esquemas Tempranos Desadaptativos (ETD)', desc: 'Mapeo de esquemas nucleares (Abandono, Defectuosidad, Privación Emocional).' },
            { step: 'Fase 2: Intervenciones Experienciales y Rescriptura Imaginativa', desc: 'Reparentalización limitada, diálogo de sillas y modificación de memorias infantiles aversivas.' },
            { step: 'Fase 3: Modificación de Modos y Consolidación del Adulto Sano', desc: 'Desactivación de modos de afrontamiento desadaptativos (rendición, sobrecompensación y evitación).' },
          ],
          contraindications: 'Psicopatía primaria severa con nula alianza o ausencia de motivación voluntaria mínima.'
        };
      case 'PSICODINAMICA_BREVE':
      case 'GESTALT':
      default:
        return {
          title: 'Psicoterapia Focal Breve (Psicodinámica / Focalizadora)',
          duration: '16 a 20 Sesiones focalizadas',
          steps: [
            { step: 'Fase 1: Delimitación del Conflicto Focal Nuclear (CCRT)', desc: 'Identificación del patrón relacional central de deseo, respuesta del otro y respuesta del yo.' },
            { step: 'Fase 2: Señalamiento de Resistencias y Elaboración', desc: 'Interpretación de transferencias inmediatas y defensas de intelectualización o somatización en sesión.' },
            { step: 'Fase 3: Elaboración de Duelo y Cierre Terapéutico', desc: 'Consolidación de la autonomía del yo y procesamiento de la angustia de separación al alta médica.' },
          ],
          contraindications: 'Riesgo inminente de acting-out violento o autolítico sin marco de internamiento.'
        };
    }
  };

  // ------------------------------------------------------------------------
  // 2. DICCIONARIO FARMACOLÓGICO
  // ------------------------------------------------------------------------
  const getPharmaGuide = (pc: string) => {
    switch (pc) {
      case 'ISRS':
        return {
          title: 'Inhibidores Selectivos de la Recaptación de Serotonina (ISRS)',
          examples: 'Sertralina (50-200 mg/d), Escitalopram (10-20 mg/d), Fluoxetina (20-80 mg/d)',
          titration: 'Iniciar con dosis semiefectiva (ej. Sertralina 25-50 mg/d) durante 7 días para mitigar náuseas y ansiedad paradójica. En TOC se requieren dosis supramáximas autorizadas tras titulación gradual.',
          monitoring: 'Vigilancia de viraje maníaco, acatisia motora inicial y respuesta clínica formal entre las semanas 4 y 8 (o semanas 8-12 en TOC).',
          contraindications: 'Coadministración con IMAO (riesgo de síndrome serotoninérgico mortal) o hipersensibilidad documentada.'
        };
      case 'ESTABILIZADORES_ANIMO':
        return {
          title: 'Estabilizadores del Estado de Ánimo (Litio / Anticonvulsivantes)',
          examples: 'Carbonato de Litio (600-1200 mg/d), Divalproato de Sodio (500-1500 mg/d), Lamotrigina (100-200 mg/d)',
          titration: 'Litio: titulación guiada estrictamente por litemia sérica (0.6 a 0.8 mEq/L en mantenimiento; 0.8 a 1.0 mEq/L en fase maníaca). Lamotrigina: titulación muy lenta (25 mg/d por 14 días) para prevenir el síndrome de Stevens-Johnson.',
          monitoring: 'Litio: TSH, creatinina sérica, tasa de filtrado glomerular y electrolitos cada 3 a 6 meses. Valproato: transaminasas hepáticas y recuento plaquetario.',
          contraindications: 'Insuficiencia renal crónica grave (Litio), daño hepático severo o embarazo en primer trimestre (Valproato).'
        };
      case 'ANTIPSICOTICOS_ATIPICOS':
        return {
          title: 'Antipsicóticos de Segunda Generación (Atípicos)',
          examples: 'Aripiprazol (2-15 mg/d), Risperidona (0.5-4 mg/d), Quetiapina (150-600 mg/d)',
          titration: 'En irritabilidad en TEA o potenciación en depresión: iniciar a dosis mínimas (Aripiprazol 2-5 mg/d o Risperidona 0.5 mg/d) para evitar distonía aguda o sedación diurna.',
          monitoring: 'Control metabólico basal y trimestral: glucemia en ayunas, perfil lipídico, índice de masa corporal y perímetro abdominal. Prolactina sérica si se utiliza Risperidona.',
          contraindications: 'Psicosis asociada a demencia con cuerpos de Lewy (hipersensibilidad neuroléptica) o prolongación severa del intervalo QTc (> 500 ms).'
        };
      case 'ESTIMULANTES':
        return {
          title: 'Psicoestimulantes y Moduladores Prefrontales (TDAH)',
          examples: 'Metilfenidato LP (18-54 mg/d), Lisdexanfetamina (30-70 mg/d), Atomoxetina (40-100 mg/d)',
          titration: 'Metilfenidato: iniciar con formulación matutina e incrementar semanalmente según curva de atención. Atomoxetina (no estimulante): iniciar a 0.5 mg/kg/d y ajustar a 1.2 mg/kg/d a las 2-4 semanas.',
          monitoring: 'Tensión arterial y frecuencia cardíaca basales en cada consulta. Curva pondoestatural en niños y despistaje de insomnio o tics motores.',
          contraindications: 'Glaucoma de ángulo cerrado, arritmias ventriculares graves, hipertensión no controlada o uso concomitante de IMAO.'
        };
      case 'BENZODIACEPINAS':
        return {
          title: 'Moduladores GABAérgicos (Benzodiacepinas)',
          examples: 'Clonazepam (0.5-2 mg/d), Lorazepam (1-2 mg/d), Alprazolam (0.25-1 mg/d)',
          titration: 'Uso estrictamente temporal (máximo 2 a 4 semanas) como terapia puente durante la latencia terapéutica de los ISRS. Desescalada gradual reduciendo 10-25% de la dosis semanalmente.',
          monitoring: 'Vigilancia de tolerancia, dependencia física, sedación motora y riesgo de caídas en adultos mayores.',
          contraindications: 'Miastenia gravis, insuficiencia respiratoria severa, apnea obstructiva del sueño o historial activo de trastorno por abuso de sustancias.'
        };
      case 'ISRN':
      default:
        return {
          title: 'Inhibidores de la Recaptación de Serotonina y Noradrenalina (IRSN)',
          examples: 'Venlafaxina (75-225 mg/d), Duloxetina (30-90 mg/d), Desvenlafaxina (50-100 mg/d)',
          titration: 'Venlafaxina: iniciar con 37.5 a 75 mg/d; el bloqueo de recaptación noradrenérgica se intensifica clínicamente por encima de 150 mg/d.',
          monitoring: 'Monitoreo periódico de presión arterial diastólica (riesgo de hipertensión dosis-dependiente) y función hepática con Duloxetina.',
          contraindications: 'Hipertensión arterial sistémica descontrolada, glaucoma de ángulo estrecho no operado o hepatopatía crónica.'
        };
    }
  };

  // ------------------------------------------------------------------------
  // 3. MOTOR DE SINERGIA BIOCLÍNICA (Jerarquía corregida sin ramas muertas)
  // ------------------------------------------------------------------------
  const getSynergyExplanation = (fw: string, pc: string) => {
    // 1. Interacciones de Alerta / Contraindicación Cruzada
    if (fw === 'EMDR' && pc === 'BENZODIACEPINAS') {
      return "ALERTA DE CO-TERAPIA: Las benzodiacepinas interfieren con la plasticidad sináptica amigdalina y la reconsolidación de memorias emocionales. Su uso crónico amortigua la respuesta afectiva necesaria para procesar la diana traumática en EMDR, reduciendo la efectividad de la estimulación bilateral. Se aconseja desescalar la dosis antes de entrar en las fases 4 a 6 de desensibilización.";
    }

    // 2. Sinergia de Alta Especificidad: TCC + ISRS (Diferenciación de TOC vs Ansiedad/Depresión)
    if (fw === 'TCC' && pc === 'ISRS') {
      return "Sinergia de Extinción Cortico-Estriatal: En trastornos obsesivos y ansiosos graves, el ISRS eleva la biodisponibilidad serotoninérgica en las vías corticostriatotalámicas (CSTC), atenuando la hiperactivación del córtex orbitofrontal. Esto amplía la ventana de tolerancia del paciente para ejecutar la Exposición con Prevención de Respuesta (EPR) de la TCC sin caer en compulsiones de neutralización.";
    }

    // 3. Sinergia TCC + IRSN
    if (fw === 'TCC' && pc === 'ISRN') {
      return "Sinergia Neuroenergética y Activación: El componente noradrenérgico del IRSN aumenta la vigilia y la motivación motora en corteza prefrontal, contrarrestando la anhedonia y el enlentecimiento psicomotor. Esta base facilita la ejecución de los programas de Activación Conductual y experimentos de reestructuración cognitiva de la TCC.";
    }

    // 4. Sinergia Antipsicóticos Atípicos (TEA / Irritabilidad / Bipolar)
    if (pc === 'ANTIPSICOTICOS_ATIPICOS') {
      return "Sinergia de Amortiguación Dopaminérgica: En perfiles con desregulación emocional severa, agresividad o hipersensibilidad sensorial (TEA / Cluster B), el antipsicótico atípico actúa como 'suelo de contención neuroquímica' mediante modulación D2/5-HT2A. Al rebajar la reactividad límbica basal, permite al terapeuta aplicar entrenamiento en habilidades socioemocionales y exposición inmersiva sin sobrecarga atencional.";
    }

    // 5. Sinergia Estimulantes / Moduladores Prefrontales (TDAH)
    if (pc === 'ESTIMULANTES') {
      return "Sinergia en Funciones Ejecutivas: La optimización dopaminérgica y noradrenérgica en el córtex prefrontal dorsolateral mejora la relación señal-ruido neuronal y el control inhibitorio (frenado Go/No-Go). Esto permite al paciente internalizar rutinas psicoterapéuticas, metacognición y planificación conductual estructurada.";
    }

    // 6. Sinergia DBT o Terapia de Esquemas + Estabilizadores del Ánimo
    if ((fw === 'DBT' || fw === 'TERAPIA_ESQUEMAS') && pc === 'ESTABILIZADORES_ANIMO') {
      return "Sinergia de Estabilización Membranal: El estabilizador modula la señalización intracelular (vía PKC y GSK-3) y reduce la variabilidad emocional extrema. Esto proporciona un piso alostático estable para que el paciente pueda asimilar e implementar las habilidades de tolerancia al malestar (TIPP), defusión y regulación de la DBT sin sufrir descompensaciones impulsivas agudas.";
    }

    // 7. Sinergia General Multimodal (Fallback armónico)
    return "Mecanismo Bioclínico Integrado: El esquema farmacológico modula los síntomas diana de forma bottom-up (regulando el tono neurovegetativo y la reactividad amigdalina), mientras la intervención psicoterapéutica reestructura los esquemas cognitivos y relacionales de forma top-down. Ambos ejes convergen para consolidar una neuroplasticidad adaptativa duradera.";
  };

  const therapy = getTherapyGuide(fwKey);
  const pharma = getPharmaGuide(pcKey);
  const synergyText = getSynergyExplanation(fwKey, pcKey);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 text-slate-100">
      
      {/* Encabezado del Panel */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Guía de Ejecución Clínica Paso a Paso
            </h3>
            <p className="text-[11px] text-slate-400">
              Protocolo técnico operativo basado en evidencia para el abordaje seleccionado
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40 hidden sm:inline-block">
          EVIDENCIA DSM-5-TR / NICE / APA
        </span>
      </div>

      {/* Banner Informativo para el Profesional */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <strong className="text-white block mb-0.5">Asistente de Decisión Clínica Multimodal (CDSS):</strong>
          A la izquierda se desglosan las fases secuenciales del modelo psicoterapéutico activo. A la derecha, los parámetros de dosificación, seguridad y monitorización farmacológica. En la sección inferior se expone la <strong>Sinergia Bioclínica</strong> que explica la interacción neurobiológica entre ambos tratamientos.
        </p>
      </div>

      {/* Columnas de Psicoterapia y Psicofarmacología */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Protocolo de Psicoterapia */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-sky-400" />
                <h4 className="font-bold text-xs text-sky-300 uppercase">{therapy.title}</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> {therapy.duration}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              {therapy.steps.map((st, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{st.step}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed pl-5">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-200 mt-4">
            <strong className="text-rose-300 flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3" /> Precauciones / Criterios de Exclusión:
            </strong>
            <span className="pl-4 block text-slate-300">{therapy.contraindications}</span>
          </div>
        </div>

        {/* Protocolo de Titulación y Monitorización Farmacológica */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-emerald-300 uppercase">{pharma.title}</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Prescripción Clínica</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Fármacos &amp; Dosis Habituales:</span>
                <p className="text-cyan-300 font-mono text-[11px]">{pharma.examples}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Pauta de Inicio y Titulación:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{pharma.titration}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Monitorización &amp; Parámetros de Seguridad:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{pharma.monitoring}</p>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-200 mt-4">
            <strong className="text-rose-300 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3" /> Contraindicaciones Absolutas:
            </strong>
            <span className="pl-4 block text-slate-300">{pharma.contraindications}</span>
          </div>
        </div>

      </div>

      {/* Bloque de Sinergia Bioclínica */}
      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl">
        <h4 className="font-bold text-indigo-300 text-xs mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Zap className="w-4 h-4 text-amber-400" />
          Mecanismo de Sinergia Bioclínica (Top-Down &amp; Bottom-Up)
          <Sparkles className="w-3 h-3 text-cyan-400" />
        </h4>
        <p className="text-xs text-indigo-100/90 leading-relaxed italic">
          {synergyText}
        </p>
      </div>

    </div>
  );
};

export default ClinicalExecutionGuidePanel;
