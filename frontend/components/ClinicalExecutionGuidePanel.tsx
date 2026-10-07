import React, { useState } from 'react';
import { PsychotherapyFramework, PharmacologyClass } from '../types';
import { BookOpen, CheckCircle, ShieldCheck, Activity, Pill, Brain, ChevronRight, AlertTriangle, Clock, Info, Zap } from 'lucide-react';

interface ClinicalExecutionGuidePanelProps {
  selectedFramework: PsychotherapyFramework | string;
  selectedPharmacology: PharmacologyClass | string;
}

export const ClinicalExecutionGuidePanel: React.FC<ClinicalExecutionGuidePanelProps> = ({
  selectedFramework,
  selectedPharmacology,
}) => {
  
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
            { step: 'Fase 1: Psicoeducación & Registro de Pensamientos', desc: 'Identificación de distorsiones cognitivas (catastrofismo, inferencia arbitraria) mediante registros tripartitos.' },
            { step: 'Fase 2: Reestructuración Cognitiva & Prueba de Realidad', desc: 'Disputa socrática y búsqueda de evidencia empírica contradictoria para generar pensamientos alternativos equilibrados.' },
            { step: 'Fase 3: Exposición Gradual (EPR)', desc: 'Jerarquización de estímulos fóbicos/obsesivos (escala 0-100 SUDS) y deshabituación progresiva sin neutralizaciones.' },
            { step: 'Fase 4: Activación Conductual', desc: 'Programación de actividades orientadas a maestría y placer; consolidación de afrontamiento.' },
          ],
          contraindications: 'Psicosis aguda activa o intoxicación severa por sustancias.'
        };
      case 'DBT':
        return {
          title: 'Terapia Dialéctico-Conductual (DBT - Linehan)',
          duration: 'Módulos de 24 semanas (individual + grupal)',
          steps: [
            { step: 'Fase 1: Habilidades de Mindfulness Nuclear', desc: 'Entrenamiento en Mente de Sabio y habilidades Qué/Cómo (Observar, Describir, No juzgar).' },
            { step: 'Fase 2: Tolerancia al Malestar (TIPP)', desc: 'Uso de temperatura, ejercicio intenso y respiración pausada para frenar impulsos autolesivos agudos.' },
            { step: 'Fase 3: Regulación Emocional', desc: 'Identificación del impulso destructivo y ejecución deliberada de la "acción opuesta".' },
            { step: 'Fase 4: Efectividad Interpersonal (DEAR MAN)', desc: 'Expresión asertiva de necesidades y establecimiento de límites sin deterioro vincular.' },
          ],
          contraindications: 'Deterioro neurocognitivo mayor que impida el aprendizaje procedimental.'
        };
      case 'EMDR':
        return {
          title: 'Reprocesamiento por Movimientos Oculares (EMDR)',
          duration: '8 a 12 Sesiones focalizadas en trauma',
          steps: [
            { step: 'Fase 1-2: Preparación & Lugar Seguro', desc: 'Estabilización, anclaje de recursos y evaluación de capacidad disociativa (DES-II).' },
            { step: 'Fase 3: Evaluación del Blanco Traumático', desc: 'Identificación de imagen nuclear, Cognición Negativa (CN) y escala VOC / SUD.' },
            { step: 'Fase 4-5: Desensibilización & Estimulación Bilateral (EB)', desc: 'Sets continuos de movimientos oculares o tapping bilateral hasta reducir el SUD a 0.' },
            { step: 'Fase 6-8: Cierre Somático & Reevaluación', desc: 'Verificación de tensión somática residual e integración adaptativa de memorias.' },
          ],
          contraindications: 'Epilepsia no controlada, inestabilidad cardiovascular severa o disociación estructural no estabilizada.'
        };
      case 'ACT':
        return {
          title: 'Terapia de Aceptación y Compromiso (ACT)',
          duration: '10 a 14 Sesiones experienciales',
          steps: [
            { step: 'Fase 1: Desesperanza Creativa', desc: 'Evidenciar la ineficacia del control evitativo ("el control es el problema, no la solución").' },
            { step: 'Fase 2: Defusión Cognitiva', desc: 'Desprenderse de la literalidad del lenguaje mental mediante metáforas ("notar que estoy teniendo el pensamiento de...").' },
            { step: 'Fase 3: Aceptación & Momento Presente', desc: 'Hacer espacio a las sensaciones difíciles sin huida ni lucha somática.' },
            { step: 'Fase 4: Clarificación de Valores', desc: 'Definición de direcciones vitales significativas y trazado de acción comprometida.' },
          ],
          contraindications: 'Fase maníaca aguda descompensada o confusión metabólica.'
        };
      case 'SISTEMICA':
        return {
          title: 'Terapia Familiar Sistémica (Estructural / Estratégica)',
          duration: '8 a 12 Sesiones vinculares',
          steps: [
            { step: 'Fase 1: Mapeo Relacional', desc: 'Genograma e identificación del "paciente identificado", límites y alianzas.' },
            { step: 'Fase 2: Preguntas Circulares', desc: 'Romper la causalidad lineal atribucional para mostrar el circuito de retroalimentación familiar.' },
            { step: 'Fase 3: Prescripciones Paradójicas', desc: 'Intervención en la homeostasis disfuncional para reestablecer jerarquías sanas.' },
          ],
          contraindications: 'Violencia física activa o abuso intrafamiliar no contenido judicialmente.'
        };
      case 'TERAPIA_ESQUEMAS':
        return {
          title: 'Terapia de Esquemas (Jeffrey Young)',
          duration: '1 a 2 Años (Trastornos de la Personalidad)',
          steps: [
            { step: 'Fase 1: Evaluación de Esquemas Tempranos (EMT)', desc: 'Identificación de esquemas desadaptativos (abandono, defecto, privación emocional) mediante inventarios.' },
            { step: 'Fase 2: Técnicas Experienciales', desc: 'Reparentalización limitada, trabajo con sillas y rescriptura de imágenes traumáticas de la infancia.' },
            { step: 'Fase 3: Romper Patrones Conductuales', desc: 'Sustitución de modos de afrontamiento disfuncionales (rendición, evitación, sobrecompensación) por el modo de "Adulto Sano".' },
          ],
          contraindications: 'Falta de capacidad reflexiva básica o psicopatía primaria severa.'
        };
      case 'GESTALT':
      case 'PSICODINAMICA_BREVE':
      default:
        return {
          title: 'Psicoterapia Focal (Psicodinámica / Humanista)',
          duration: '16 a 20 Sesiones focalizadas',
          steps: [
            { step: 'Fase 1: Delimitación del Foco Terapéutico', desc: 'Identificación del conflicto nuclear relacional (ej. Tema Central de Conflicto Relacional - CCRT).' },
            { step: 'Fase 2: Análisis del "Aquí y Ahora"', desc: 'Interpretación de transferencias, bloqueos emocionales y mecanismos de defensa en sesión.' },
            { step: 'Fase 3: Elaboración y Cierre', desc: 'Integración afectiva de las partes disociadas y trabajo sobre la angustia de separación al alta.' },
          ],
          contraindications: 'Riesgo inminente de acting-out violento sin marco de contención institucional.'
        };
    }
  };

  // ------------------------------------------------------------------------
  // 2. DICCIONARIO FARMACOLÓGICO (Actualizado con TOC y TEA)
  // ------------------------------------------------------------------------
  const getPharmaGuide = (pc: string) => {
    switch (pc) {
      case 'ISRS':
        return {
          title: 'Inhibidores Selectivos de la Recaptación de Serotonina (ISRS / Alta Dosis TOC)',
          examples: 'Sertralina (100-250 mg/d), Fluoxetina (40-80 mg/d), Escitalopram (20 mg/d)',
          titration: 'En TOC, las dosis terapéuticas suelen duplicar las de depresión. Iniciar bajo esquema estándar y titular ascendentemente cada 2 semanas según tolerancia.',
          monitoring: 'Vigilancia de viraje a hipomanía, acatisia y seguimiento de respuesta a las 8-12 semanas (latencia clínica mayor en TOC).',
          contraindications: 'Uso concomitante de IMAO o hipersensibilidad al principio activo.'
        };
      case 'ESTABILIZADORES_ANIMO':
        return {
          title: 'Estabilizadores del Ánimo (Litio / Anticonvulsivantes)',
          examples: 'Litio (600-1200 mg/d), Valproato (500-1500 mg/d), Lamotrigina (100-200 mg/d)',
          titration: 'Litio: titular según litemia sérica (0.6-1.0 mEq/L). Lamotrigina: titulación extremadamente lenta (25mg x 2 sem) para prevenir síndrome de Stevens-Johnson.',
          monitoring: 'Litio: TSH, creatinina, electrólitos basales. Valproato: Pruebas de función hepática y biometría hemática.',
          contraindications: 'Insuficiencia renal crónica severa (Litio), embarazo primer trimestre (Valproato).'
        };
      case 'ANTIPSICOTICOS_ATIPICOS':
        return {
          title: 'Antipsicóticos de Segunda Generación (Atípicos / TEA & Irritabilidad)',
          examples: 'Aripiprazol (2-15 mg/d), Risperidona (0.5-3 mg/d), Quetiapina (150-600 mg/d)',
          titration: 'Aripiprazol o Risperidona en TEA: inicio a dosis muy bajas (ej. 0.5 mg o 2 mg) para evitar sedación excesiva o efectos extrapiramidales agudizados.',
          monitoring: 'Perfil metabólico basal y semestral (glucemia, lípidos, peso). Monitoreo de somnolencia e hiperprolactinemia (Risperidona).',
          contraindications: 'Demencia con psicosis relacionada, prolongación severa del intervalo QTc.'
        };
      case 'ESTIMULANTES':
        return {
          title: 'Psicoestimulantes y Moduladores No Estimulantes (TDAH Complejo)',
          examples: 'Metilfenidato LP (18-54 mg/d), Lisdexanfetamina (30-70 mg/d), Atomoxetina (40-100 mg/d)',
          titration: 'Atomoxetina (No estimulante): ideal en TDAH con alta ansiedad comórbida; inicio a 0.5 mg/kg/d y ajuste a las 2-4 semanas (máx 1.2 mg/kg/d).',
          monitoring: 'Presión arterial, frecuencia cardíaca, control de peso y evaluación de insomnio o tics.',
          contraindications: 'Hipertensión severa descontrolada, glaucoma, uso reciente de IMAO.'
        };
      case 'BENZODIACEPINAS':
        return {
          title: 'Moduladores GABAérgicos (Benzodiacepinas / Hipnóticos)',
          examples: 'Clonazepam (0.5-2 mg/d), Alprazolam (0.25-1 mg/d), Lorazepam (1-2 mg/d)',
          titration: 'Uso estrictamente PRN (por razón necesaria) o esquemas cortos (<4 semanas). Retiro siempre gradual disminuyendo 10-25% de la dosis cada semana.',
          monitoring: 'Vigilancia de tolerancia, dependencia cruzada y depresión respiratoria. Evaluar riesgo de caídas en adultos mayores.',
          contraindications: 'Apnea del sueño severa, Miastenia Gravis, historial activo de trastorno por uso de sustancias (TUS).'
        };
      case 'ISRN':
      default:
        return {
          title: 'Inhibidores de la Recaptación de Serotonina y Noradrenalina (IRSN)',
          examples: 'Venlafaxina (75-225 mg/d), Duloxetina (30-90 mg/d)',
          titration: 'Venlafaxina: iniciar 37.5 mg/d; el efecto noradrenérgico terapéutico real se acentúa por encima de 150 mg/d.',
          monitoring: 'Monitoreo estricto de presión arterial (elevación diastólica dosis-dependiente común).',
          contraindications: 'Hipertensión arterial sistémica no controlada o fallo hepático agudo.'
        };
    }
  };

  // ------------------------------------------------------------------------
  // 3. MOTOR DE SINERGIA BIOCLÍNICA AMPLIADO (Incluye TEA, TOC y TDAH)
  // ------------------------------------------------------------------------
  const getSynergyExplanation = (fw: string, pc: string) => {
    if (fw === 'TCC' && (pc === 'ISRS' || pc === 'ISRN')) {
      return "El fármaco actúa como 'facilitador'. Al reducir la reactividad de la amígdala y el pensamiento rumiante, el paciente adquiere la claridad cognitiva necesaria para participar en la reestructuración de la TCC y tolerar la exposición (EPR) sin sufrir crisis de pánico incontrolables.";
    }
    if (pc === 'ISRS' && fw === 'TCC' && selectedPharmacology === 'ISRS') {
      return "Sinergia crítica para Trastorno Obsesivo-Compulsivo (TOC): Los circuitos corticostriatotalámicos (CSTC) hiperactivos requieren concentraciones elevadas de recaptación de serotonina para modular el bucle orbitofrontal. La psicoterapia concurrente de Exposición con Prevención de Respuesta (EPR) entrena la habituación sin la cual el fármaco por sí solo muestra altas tasas de recaída.";
    }
    if (pc === 'ANTIPSICOTICOS_ATIPICOS') {
      return "Sinergia para Trastorno del Espectro Autista (TEA) y conductas disruptivas: El antipsicótico reduce la hiperreactividad a estímulos ambientales y la irritabilidad severa mediante bloqueo parcial dopaminérgico/serotoninérgico. La intervención psicoterapéutica (como los módulos de cognición social y tolerancia sensorial VR) se beneficia de este 'piso de calma', permitiendo procesar rostros y expresiones sin saturación atencional.";
    }
    if (pc === 'ESTIMULANTES') {
      return "Sinergia en TDAH Complejo: En perfiles con alta reactividad autonómica o comorbilidad ansiosa, el uso de moduladores prefrontales optimiza el tono dopaminérgico y la inhibición de impulsos (Go/No-Go). La estrategia psicoterapéutica asociada se enfoca en estructuración de funciones ejecutivas y agendas externas.";
    }
    if (fw === 'EMDR' && pc === 'BENZODIACEPINAS') {
      return "PRECAUCIÓN: Las benzodiacepinas bloquean el procesamiento afectivo y la consolidación de la memoria. Su uso crónico inhibe el éxito del EMDR, ya que el paciente necesita conectar somáticamente con el recuerdo para desensibilizarlo. Úsese solo como rescate extremo.";
    }
    if ((fw === 'DBT' || fw === 'TERAPIA_ESQUEMAS') && pc === 'ESTABILIZADORES_ANIMO') {
      return "Sinergia de contención límbica. El estabilizador previene las caídas alostáticas abruptas y los picos de impulsividad agresiva, proporcionando un 'suelo neuroquímico' estable para que el paciente pueda aprender e implementar las habilidades de tolerancia al malestar y mindfulness de la DBT.";
    }
    
    // Sinergia genérica para combinaciones no específicas
    return "La farmacología modula los síntomas agudos (bottom-up), regulando el sistema nervioso autónomo, mientras la psicoterapia reestructura el procesamiento cortical y los esquemas mentales (top-down). Ambos garantizan neuroplasticidad sostenible a largo plazo.";
  };

  const therapy = getTherapyGuide(selectedFramework as string);
  const pharma = getPharmaGuide(selectedPharmacology as string);
  const synergyText = getSynergyExplanation(selectedFramework as string, selectedPharmacology as string);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      
      {/* HEADER PRINCIPAL */}
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
          DSM-5 / NICE / APA
        </span>
      </div>

      {/* BANNER INFORMATIVO PARA EL PROFESIONAL */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <strong className="text-white block mb-1">¿Cómo utilizar esta guía de co-terapia?</strong>
          Esta sección funciona como un Asistente de Decisión Clínica (CDSS). A la izquierda, encontrarás las fases secuenciales de la psicoterapia seleccionada para organizar tus sesiones. A la derecha, los parámetros farmacocinéticos de seguridad para titulación. Revisa la <strong>Sinergia Bioclínica</strong> en la parte inferior para entender cómo interactúan ambos tratamientos en el cerebro del paciente.
        </p>
      </div>

      {/* COLUMNAS DE TERAPIA Y FARMACOLOGÍA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Psychotherapy Protocol */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
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

          <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-200 mt-4">
            <strong className="text-rose-300 flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3" /> Precauciones / Contraindicaciones:
            </strong>
            <span className="pl-4 block">{therapy.contraindications}</span>
          </div>
        </div>

        {/* Pharmacology Titration & Monitoring Protocol */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-emerald-300 uppercase">{pharma.title}</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Guía de Prescripción</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Moléculas & Dosis Habituales:</span>
                <p className="text-cyan-300 font-mono text-[11px]">{pharma.examples}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Esquema de Titulación Inicial:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{pharma.titration}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Monitorización & Laboratorios Requeridos:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{pharma.monitoring}</p>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-200 mt-4">
            <strong className="text-rose-300 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3" /> Contraindicaciones Absolutas:
            </strong>
            <span className="pl-4 block">{pharma.contraindications}</span>
          </div>
        </div>

      </div>

      {/* EXPLICACIÓN DE SINERGIA BIOCLÍNICA */}
      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-xl">
        <h4 className="font-bold text-indigo-300 text-xs mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Zap className="w-4 h-4 text-amber-400" />
          Mecanismo de Sinergia Bioclínica
        </h4>
        <p className="text-xs text-indigo-100/80 leading-relaxed italic">
          {synergyText}
        </p>
      </div>

    </div>
  );
};
