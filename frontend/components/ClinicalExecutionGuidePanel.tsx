import React from 'react';
import { PsychotherapyFramework, PharmacologyClass } from '../types';
import { BookOpen, CheckCircle, ShieldCheck, Activity, Pill, Brain, ChevronRight, AlertTriangle, Clock } from 'lucide-react';

interface ClinicalExecutionGuidePanelProps {
  selectedFramework: PsychotherapyFramework;
  selectedPharmacology: PharmacologyClass;
}

export const ClinicalExecutionGuidePanel: React.FC<ClinicalExecutionGuidePanelProps> = ({
  selectedFramework,
  selectedPharmacology,
}) => {
  const getTherapyGuide = (fw: PsychotherapyFramework) => {
    switch (fw) {
      case 'TCC':
        return {
          title: 'Terapia Cognitivo-Conductual (TCC Estandarizada)',
          duration: '12 a 16 Sesiones estructuradas',
          steps: [
            { step: 'Fase 1: Psicoeducación & Registro de Pensamientos', desc: 'Identificación de distorsiones cognitivas (catastrofismo, inferencia arbitraria, visión de túnel) mediante registros tripartitos (Situación-Pensamiento Automático-Emoción).' },
            { step: 'Fase 2: Reestructuración Cognitiva & Prueba de Realidad', desc: 'Disputa socrática y búsqueda de evidencia empírica contradictoria para generar pensamientos alternativos equilibrados.' },
            { step: 'Fase 3: Exposición Gradual con Prevención de Respuesta (EPR)', desc: 'Jerarquización de estímulos fóbicos/obsesivos (escala 0-100 SUDS) y deshabituación progresiva sin neutralizaciones.' },
            { step: 'Fase 4: Activación Conductual & Prevención de Recaídas', desc: 'Programación de actividades orientadas a maestría y placer; consolidación de estrategias de afrontamiento autónomo.' },
          ],
          contraindications: 'Psicosis aguda franca activa o intoxicación aguda por sustancias (requiere estabilización previa).'
        };
      case 'DBT':
        return {
          title: 'Terapia Dialéctico-Conductual (DBT - Linehan)',
          duration: 'Módulos de 24 semanas individuales + grupales',
          steps: [
            { step: 'Fase 1: Habilidades de Mindfulness Nuclear', desc: 'Entrenamiento en habilidades "Qué" (Observar, Describir, Participar) y habilidades "Cómo" (No juzgar, Mente de Sabio, Efectividad).' },
            { step: 'Fase 2: Tolerancia al Malestar & Habilidades TIPP', desc: 'Uso de temperatura (frío), ejercicio intenso, respiración pausada y relajación muscular progresiva para frenar impulsos autolesivos.' },
            { step: 'Fase 3: Regulación Emocional & Acción Opuesta', desc: 'Identificación del impulso de acción destructivo y ejecución deliberada de la conducta conductual contraria.' },
            { step: 'Fase 4: Efectividad Interpersonal (DEAR MAN)', desc: 'Expresión asertiva de necesidades y establecimiento de límites sin deterioro vincular ni autoimagen.' },
          ],
          contraindications: 'Deterioro neurocognitivo mayor avanzado que impida el aprendizaje procedimental de habilidades.'
        };
      case 'EMDR':
        return {
          title: 'Desensibilización y Reprocesamiento por Movimientos Oculares (EMDR - 8 Fases)',
          duration: '8 a 12 Sesiones focalizadas en blanco traumático',
          steps: [
            { step: 'Fase 1-2: Historia Clínica & Preparación (Lugar Seguro)', desc: 'Estabilización, instalación del recurso "Lugar Seguro" y evaluación de capacidad disociativa (DES-II).' },
            { step: 'Fase 3: Evaluación del Blanco Traumático', desc: 'Identificación de imagen nuclear, Cognición Negativa (CN), Cognición Positiva deseada (CP) y escala VOC / SUD.' },
            { step: 'Fase 4-5: Desensibilización & Estimulación Bilateral (EB)', desc: 'Sets continuos de movimientos oculares o tapping táctil bilateral hasta reducir el SUD a 0.' },
            { step: 'Fase 6-8: Examen Corporal, Cierre & Reevaluación', desc: 'Verificación de tensión somática residual e integración adaptativa de memorias.' },
          ],
          contraindications: 'Epilepsia no controlada, inestabilidad cardiovascular severa o disociación estructural no estabilizada.'
        };
      case 'ACT':
        return {
          title: 'Terapia de Aceptación y Compromiso (ACT - Flexibilidad Psicológica)',
          duration: '10 a 14 Sesiones experienciales',
          steps: [
            { step: 'Fase 1: Desesperanza Creativa', desc: 'Evidenciar la ineficacia del control evitativo ("el control es el problema, no la solución").' },
            { step: 'Fase 2: Defusión Cognitiva & Yo como Contexto', desc: 'Desprenderse de la literalidad del lenguaje mental ("notar que estoy teniendo el pensamiento de...") mediante metáforas.' },
            { step: 'Fase 3: Aceptación Abierta & Contacto con el Momento Presente', desc: 'Hacer espacio a las sensaciones difíciles sin huida ni lucha somática.' },
            { step: 'Fase 4: Clarificación de Valores & Acción Comprometida', desc: 'Definición de direcciones vitales significativas y trazado de metas conductuales innegociables.' },
          ],
          contraindications: 'Fase maníaca aguda descompensada o confusión metabólica.'
        };
      case 'SISTEMICA':
        return {
          title: 'Terapia Familiar Sistémica Estructural & Estratégica',
          duration: '8 a 12 Sesiones vinculares',
          steps: [
            { step: 'Fase 1: Mapeo de Límites, Jerarquías y Alianzas', desc: 'Genograma relacional e identificación del "paciente identificado" y dinámicas de triangulación.' },
            { step: 'Fase 2: Preguntas Circulares & Reencuadre', desc: 'Romper la causalidad lineal atribucional para mostrar el circuito de retroalimentación relacional.' },
            { step: 'Fase 3: Prescripciones Conductuales & Tareas Paradójicas', desc: 'Intervención en la homeostasis familiar disfuncional para reestablecer la parentalidad efectiva.' },
          ],
          contraindications: 'Violencia física o abuso intrafamiliar activo no contenido por la justicia.'
        };
      case 'PSICODINAMICA_BREVE':
      default:
        return {
          title: 'Psicoterapia Psicodinámica Breve Focal',
          duration: '16 a 20 Sesiones focalizadas',
          steps: [
            { step: 'Fase 1: Delimitación del Foco Terapéutico y Alianza', desc: 'Identificación del conflicto nuclear relacional (CCRT - Core Conflictual Relationship Theme).' },
            { step: 'Fase 2: Análisis de Transferencia & Mecanismos de Defensa', desc: 'Interpretación en el aquí-y-ahora de la repetición vincular, escisión, proyección o intelectualización.' },
            { step: 'Fase 3: Elaboración y Duelo de Separación', desc: 'Integración afectiva y cierre programado trabajando la angustia de separación.' },
          ],
          contraindications: 'Trastornos de la personalidad con acting-out violento inminente sin marco de contención.'
        };
    }
  };

  const getPharmaGuide = (pc: PharmacologyClass) => {
    switch (pc) {
      case 'ISRS':
        return {
          title: 'Inhibidores Selectivos de la Recaptación de Serotonina (ISRS)',
          examples: 'Sertralina (50-200 mg/d), Escitalopram (10-20 mg/d), Fluoxetina (20-60 mg/d)',
          titration: 'Iniciar con dosis semititrada (ej. Sertralina 25-50 mg) durante 7 días para mitigar náuseas o ansiedad paradójica inicial. Evaluar respuesta a las 4-6 semanas.',
          monitoring: 'Vigilancia de viraje a hipomanía en pacientes bipolares ocultos. Monitoreo de ideación suicida en <24 años durante primeras 2 semanas.',
          contraindications: 'Uso concomitante de IMAO (riesgo de síndrome serotoninérgico) o hipersensibilidad.'
        };
      case 'ESTABILIZADORES_ANIMO':
        return {
          title: 'Estabilizadores del Ánimo (Litio / Valproato / Lamotrigina)',
          examples: 'Carbonato de Litio (600-1200 mg/d), Divalproato de Sodio (500-1500 mg/d), Lamotrigina (100-200 mg/d)',
          titration: 'Litio: titular según litemia sérica meta (0.6 - 1.0 mEq/L en mantenimiento; 0.8 - 1.2 mEq/L en fase aguda). Lamotrigina: titulación lenta (25mg x 2 sem, 50mg x 2 sem) para prevenir síndrome de Stevens-Johnson.',
          monitoring: 'Litio: TSH, creatinina, electrólitos y ECG basales y cada 6 meses. Valproato: pruebas de función hepática y biometría hemática.',
          contraindications: 'Insuficiencia renal crónica severa (Litio), daño hepático severo o embarazo primer trimestre (Valproato).'
        };
      case 'ANTIPSICOTICOS_ATIPICOS':
        return {
          title: 'Antipsicóticos de Segunda Generación (Atípicos)',
          examples: 'Quetiapina (150-600 mg/d), Aripiprazol (5-15 mg/d), Olanzapina (5-20 mg/d), Risperidona (1-4 mg/d)',
          titration: 'Quetiapina: inicio gradual nocturno (50 mg a 300 mg) por efecto sedativo H1. Aripiprazol: inicio matutino (5 mg) por perfil agonista parcial.',
          monitoring: 'Perfil metabólico basal y semestral (glucemia, lípidos, circunferencia abdominal, peso). Monitoreo de síntomas extrapiramidales o discinesia.',
          contraindications: 'Demencia con psicosis relacionada (advertencia de mortalidad en ancianos), prolongación severa del intervalo QTc.'
        };
      case 'ESTIMULANTES':
        return {
          title: 'Psicoestimulantes / Moduladores Dopaminérgicos (TDAH)',
          examples: 'Metilfenidato Liberación Prolongada (18-54 mg/d), Lisdexanfetamina (30-70 mg/d), Atomoxetina (40-80 mg/d)',
          titration: 'Metilfenidato: inicio con 18-20 mg matutino; ajustar semanalmente según desempeño ejecutivo y ausencia de insomnio vespertino.',
          monitoring: 'Presión arterial, frecuencia cardíaca y curva de peso. Interrogar sobre tics motores o antecedentes de abuso de sustancias.',
          contraindications: 'Hipertensión severa descontrolada, glaucoma de ángulo estrecho, arritmias cardíacas o psicosis activa.'
        };
      case 'ISRN':
      default:
        return {
          title: 'Inhibidores de la Recaptación de Serotonina y Noradrenalina (IRSN)',
          examples: 'Venlafaxina (75-225 mg/d), Duloxetina (30-90 mg/d), Desvenlafaxina (50-100 mg/d)',
          titration: 'Venlafaxina: iniciar 37.5 - 75 mg/d; efecto noradrenérgico se acentúa por encima de 150 mg/d.',
          monitoring: 'Monitoreo de presión arterial (posible elevación diastólica dosis-dependiente).',
          contraindications: 'Hipertensión arterial no controlada o uso de IMAO.'
        };
    }
  };

  const therapy = getTherapyGuide(selectedFramework);
  const pharma = getPharmaGuide(selectedPharmacology);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
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
        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40">
          DSM-5 / NICE / APA
        </span>
      </div>

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

          <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-200">
            <strong className="text-rose-300">Precauciones / Contraindicaciones: </strong>
            <span>{therapy.contraindications}</span>
          </div>
        </div>

        {/* Pharmacology Titration & Monitoring Protocol */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
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

          <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-200">
            <strong className="text-rose-300">Contraindicaciones Absolutas: </strong>
            <span>{pharma.contraindications}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
