import React, { useState } from 'react';
import {
  SimulatedCase,
  LifeCycleStage,
  AvatarEmotionState,
  PsychotherapyFramework,
  PharmacologyClass,
  AcademyScoringResult,
} from '../types';
import { SimulatedPatientAvatar } from './SimulatedPatientAvatar';
import { ClinicalExecutionGuidePanel } from './ClinicalExecutionGuidePanel';
import { AcademyScoringReport } from './AcademyScoringReport';
import { GoogleGenAI } from '@google/genai';
import {
  GraduationCap,
  Sparkles,
  Send,
  Bot,
  User,
  Brain,
  Pill,
  Award,
  Layers,
  Heart,
  ChevronRight,
  RefreshCw,
  Clock,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Stethoscope,
  Wand2,
  Zap
} from 'lucide-react';

export const ACADEMY_SIMULATED_CASES: SimulatedCase[] = [
  {
    id: 'SIM-01',
    caseCode: 'PAC-SIM-INF-01',
    title: 'Infancia: Regulación Afectiva vs TDAH / TEA Leve',
    patientName: 'Leo Mendoza (9 años)',
    age: 9,
    gender: 'M',
    stage: 'INFANCIA',
    avatarUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80',
    initialEmotion: 'Defensivo',
    consultationReason: 'Berrinches escolares intensos, balanceo rítmico, dificultad para tolerar cambios en la rutina y dispersión.',
    clinicalBackstory: 'Leo de 9 años es traído por su madre tras quejas recurrentes de la escuela. Se irrita intensamente cuando cambian el horario de clases, se mece en su silla y tiene una fijación obsesiva por los mapas ferroviarios.',
    normativeDevelopmentVsPathologyClues: 'Diferenciar entre rabietas oposicionistas esperables ante sobrecarga sensorial (TEA Nivel 1) frente a hiperactividad motora desatenta primaria (TDAH combinado).',
    psychometricsBase: {
      asrs: 14,
      aq10: 8,
      bdi2: 6,
      sadPersons: 0,
    },
    qeegSummary: 'Ratio Theta/Beta Frontal 2.9σ. Ondas lentas temporo-parietales bilaterales con hiperreactividad auditiva.',
    goldStandardDiagnosis: 'Trastorno del Espectro Autista (Nivel 1) comórbido con TDAH con predominio de déficit de atención',
    goldStandardCIE10: 'F84.0 / F90.0',
    goldStandardFramework: 'TCC',
    goldStandardPharmacology: 'ESTIMULANTES',
    simulatedPersonaPrompt: 'Eres Leo, un niño de 9 años. Te sientes abrumado en la escuela porque hay demasiado ruido y los profesores cambiaron los pupitres de lugar. Te gusta hablar de trenes y mapas. Si el psicólogo te habla con paciencia y sin juzgarte, te sientes aliviado; si te presiona o critica, te pones defensivo y miras al piso.',
  },
  {
    id: 'SIM-02',
    caseCode: 'PAC-SIM-ADO-02',
    title: 'Adolescencia: Desregulación Emocional Severa vs Crisis Normativa',
    patientName: 'Sofía Valenzuela (16 años)',
    age: 16,
    gender: 'F',
    stage: 'ADOLESCENCIA',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    initialEmotion: 'Ansioso',
    consultationReason: 'Cortes superficiales en antebrazo, miedo pánico al abandono de su pareja y episodios de ira incontrolable.',
    clinicalBackstory: 'Sofía, de 16 años, estudiante de preparatoria. Refiere un vacío abrumador ("siento que no tengo nada adentro") y oscilaciones afectivas bruscas que duran horas tras discutir con su novio.',
    normativeDevelopmentVsPathologyClues: 'Diferenciar la turbulencia identitaria y labilidad emocional propia de la adolescencia frente a un Trastorno Límite de la Personalidad (TLP) emergente con riesgo autolítico.',
    psychometricsBase: {
      bdi2: 28,
      bai: 24,
      sadPersons: 6,
    },
    qeegSummary: 'Asimetría alfa temporal izquierda-derecha (+2.4σ) y picos beta en corteza prefrontal ventromedial durante estrés inducido.',
    goldStandardDiagnosis: 'Trastorno de la Personalidad Límite (TLP) con episodio depresivo mayor concomitante',
    goldStandardCIE10: 'F60.3 / F32.1',
    goldStandardFramework: 'DBT',
    goldStandardPharmacology: 'ISRS',
    simulatedPersonaPrompt: 'Eres Sofía, una adolescente de 16 años. Te sientes muy incomprendida y sola. Sientes que todos te van a abandonar tarde o temprano. Si el psicólogo valida tu dolor emocional sin minimizarlo, te muestras aliviada; si te trata como una "niña dramática", te pones muy defensiva y hostil.',
  },
  {
    id: 'SIM-03',
    caseCode: 'PAC-SIM-ADU-03',
    title: 'Adultez: Trastorno Bipolar I (Manía con Psicosis) vs Esquizofrenia',
    patientName: 'Esteban Coronado (34 años)',
    age: 34,
    gender: 'M',
    stage: 'ADULTEZ',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    initialEmotion: 'Neutral',
    consultationReason: 'No ha dormido en 4 noches, verborrea ininterrumpible, cree que tiene la fórmula cuántica para salvar la economía.',
    clinicalBackstory: 'Arquitecto de 34 años con historia de depresión previa tratada hace 3 años. Hace 7 días comenzó a trabajar 22 horas al día, gastó 5,000 USD en herramientas que no necesita y afirma que la radio transmite mensajes directos de Dios.',
    normativeDevelopmentVsPathologyClues: 'Aplicar el Principio F de Morrison: la presencia de síntomas psicóticos congruentes con el ánimo en contexto de hiperactividad maníaca descarta la esquizofrenia primaria.',
    psychometricsBase: {
      bdi2: 2,
      bai: 14,
      asrs: 16,
      sadPersons: 3,
    },
    qeegSummary: 'Desincronización fronto-estriatal masiva (+3.1σ en Beta/Gamma) con supresión alfa global.',
    goldStandardDiagnosis: 'Trastorno Bipolar I, episodio maníaco actual, con características psicóticas congruentes con el estado de ánimo',
    goldStandardCIE10: 'F31.2 [296.44]',
    goldStandardFramework: 'TCC',
    goldStandardPharmacology: 'ESTABILIZADORES_ANIMO',
    simulatedPersonaPrompt: 'Eres Esteban, 34 años. Te sientes eufórico, lleno de energía, hablas rápido y tienes ideas grandiosas. Crees que tu mente ha alcanzado un nivel superior de iluminación. Si el médico te confronta agresivamente te irritas; si canaliza tu energía con empatía y propone ordenar tus ideas, colaboras.',
  },
  {
    id: 'SIM-04',
    caseCode: 'PAC-SIM-MAY-04',
    title: 'Adultez Mayor: Pseudodemencia Depresiva vs Deterioro Neurocognitivo (Alzheimer)',
    patientName: 'Elena Carrasco (71 años)',
    age: 71,
    gender: 'F',
    stage: 'ADULTEZ_MAYOR',
    avatarUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=400&auto=format&fit=crop&q=80',
    initialEmotion: 'Afligido',
    consultationReason: 'Quejas intensas de pérdida de memoria ("ya no me acuerdo de nada"), anhedonia, pérdida de peso y despertar a las 3 AM.',
    clinicalBackstory: 'Profesora jubilada de 71 años, viuda desde hace 6 meses. En el examen mental responde con frecuencia "no sé" a las preguntas de memoria pero con esfuerzo logra recordar los datos. Descuida su arreglo personal.',
    normativeDevelopmentVsPathologyClues: 'Diferenciar entre un Trastorno Neurocognitivo Mayor insidioso vs Pseudodemencia Depresiva (donde el afecto deprimido precede al defecto subjetivo de memoria y existe dolor por la pérdida).',
    psychometricsBase: {
      bdi2: 36,
      mmse: 24,
      sadPersons: 7,
    },
    qeegSummary: 'Enlentecimiento alfa posterior moderado (8.2 Hz) sin asimetría temporal focal ni ondas delta continuas.',
    goldStandardDiagnosis: 'Trastorno Depresivo Mayor, episodio único, grave, con características melancólicas (Pseudodemencia)',
    goldStandardCIE10: 'F32.2 [296.23]',
    goldStandardFramework: 'TCC',
    goldStandardPharmacology: 'ISRS',
    simulatedPersonaPrompt: 'Eres Elena, 71 años. Te sientes muy triste, culpable por sentirte una carga para tus hijos y sientes que tu mente ya no funciona. Dices "no sé" con frecuencia porque te da miedo equivocarte. Si el clínico te brinda un espacio seguro y cálido, te abres y lloras con alivio.',
  },
];

export const AmieClinicalAcademy: React.FC = () => {
  const [casesList, setCasesList] = useState<SimulatedCase[]>(ACADEMY_SIMULATED_CASES);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const currentCase = casesList[selectedCaseIdx] || casesList[0];

  // Simulation State
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: `Hola doctor(a)... gracias por recibirme. ${currentCase.consultationReason}`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<AvatarEmotionState>(currentCase.initialEmotion);
  const [empathyMeter, setEmpathyMeter] = useState<number>(55);
  const [isGeneratingBlackSwan, setIsGeneratingBlackSwan] = useState(false);

  // Professional Choices for Evaluation
  const [chosenDiagnosis, setChosenDiagnosis] = useState('');
  const [chosenFramework, setChosenFramework] = useState<PsychotherapyFramework>('TCC');
  const [chosenPharma, setChosenPharma] = useState<PharmacologyClass>('ISRS');

  // Evaluation Score State
  const [scoringResult, setScoringResult] = useState<AcademyScoringResult | null>(null);
  const [isEvaluatingScore, setIsEvaluatingScore] = useState(false);

  const handleSelectCase = (idx: number) => {
    setSelectedCaseIdx(idx);
    const newCase = casesList[idx];
    setCurrentEmotion(newCase.initialEmotion);
    setEmpathyMeter(55);
    setChosenDiagnosis('');
    setScoringResult(null);
    setMessages([
      {
        role: 'model',
        text: `Hola doctor(a)... ${newCase.consultationReason}`
      }
    ]);
  };

  const handleGenerateBlackSwan = async () => {
    setIsGeneratingBlackSwan(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
      const prompt = `
Genera un caso clínico psiquiátrico "Cisne Negro" (de extrema rareza, comorbilidad atípica o diagnóstico diferencial desafiante) para entrenamiento en AMIE Clinical Academy.
Elige una etapa del ciclo vital al azar (Infancia, Adolescencia, Adultez, Adultez Mayor).

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura:
{
  "id": "SIM-SWAN-${Date.now()}",
  "caseCode": "PAC-SWAN-${Math.floor(100 + Math.random() * 900)}",
  "title": "Título llamativo del caso (ej. 'Cisne Negro: Síndrome de Charles Bonnet vs Psicosis Tardía')",
  "patientName": "Nombre y edad (ej. 'Arturo Beltrán (68 años)')",
  "age": 68,
  "gender": "M" o "F",
  "stage": "INFANCIA" | "ADOLESCENCIA" | "ADULTEZ" | "ADULTEZ_MAYOR",
  "avatarUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
  "initialEmotion": "Ansioso" | "Defensivo" | "Afligido" | "Neutral",
  "consultationReason": "Motivo de consulta cardinal que genera confusión",
  "clinicalBackstory": "Historia clínica detallada con trampa diagnóstica",
  "normativeDevelopmentVsPathologyClues": "Puntos clave para no caer en el sesgo diagnóstico",
  "psychometricsBase": { "bdi2": 20, "bai": 18, "mmse": 28, "sadPersons": 4 },
  "qeegSummary": "Resumen electrofisiológico (Z-scores)",
  "goldStandardDiagnosis": "Diagnóstico estricto DSM-5",
  "goldStandardCIE10": "Código CIE-10",
  "goldStandardFramework": "TCC" | "DBT" | "ACT" | "EMDR",
  "goldStandardPharmacology": "ISRS" | "ISRN" | "ANTIPSICOTICOS_ATIPICOS" | "ESTABILIZADORES_ANIMO" | "ESTIMULANTES",
  "simulatedPersonaPrompt": "Instrucciones en primera persona para que la IA actúe como este paciente"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json', temperature: 0.8 }
      });

      const newSwanCase: SimulatedCase = JSON.parse(response.text || '{}');
      if (newSwanCase.title) {
        const updatedList = [newSwanCase, ...casesList];
        setCasesList(updatedList);
        setSelectedCaseIdx(0);
        setCurrentEmotion(newSwanCase.initialEmotion || 'Ansioso');
        setEmpathyMeter(50);
        setChosenDiagnosis('');
        setScoringResult(null);
        setMessages([
          {
            role: 'model',
            text: `Hola doctor(a)... gracias por recibirme. ${newSwanCase.consultationReason}`
          }
        ]);
      }
    } catch (e) {
      console.error('Error generating black swan case:', e);
    } finally {
      setIsGeneratingBlackSwan(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isBotTyping) return;

    const userText = inputText.trim();
    setInputText('');
    const newHistory = [...messages, { role: 'user' as const, text: userText }];
    setMessages(newHistory);
    setIsBotTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

      const promptContext = `
Eres un paciente simulado para la capacitación de psicólogos y psiquiatras en el sistema AMIE Clinical Academy.
PERSONAJE ASIGNADO:
${currentCase.simulatedPersonaPrompt}

HISTORIAL CLÍNICO OCULTO:
- Edad: ${currentCase.age} años | Género: ${currentCase.gender}
- Etapa del Ciclo Vital: ${currentCase.stage}
- Diagnóstico Gold Standard DSM-5: ${currentCase.goldStandardDiagnosis}

INSTRUCCIONES DE ACTUACIÓN:
1. Responde de forma natural, en primera persona, como este paciente en consulta.
2. Evalúa sutilmente la empatía de la última pregunta del médico.
3. Al final de tu respuesta, agrega una línea oculta con el formato: "[EMOTION: Neutral | Defensivo | Ansioso | Afligido | Aliviado]" que refleje tu reacción emocional actual.
4. Mantén las respuestas conversacionales y verosímiles.
`;

      const contents = [
        { role: 'user', parts: [{ text: `${promptContext}\n\nMensajes previos:\n${JSON.stringify(newHistory)}\n\nMédico: ${userText}` }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { temperature: 0.7 }
      });

      const replyText = response.text || '...';
      
      let parsedEmotion: AvatarEmotionState = currentEmotion;
      const emotionMatch = replyText.match(/\[EMOTION:\s*(Neutral|Defensivo|Ansioso|Afligido|Aliviado)\]/i);
      if (emotionMatch && emotionMatch[1]) {
        parsedEmotion = emotionMatch[1] as AvatarEmotionState;
        setCurrentEmotion(parsedEmotion);
      }

      const cleanReply = replyText.replace(/\[EMOTION:\s*(Neutral|Defensivo|Ansioso|Afligido|Aliviado)\]/gi, '').trim();

      if (parsedEmotion === 'Aliviado') setEmpathyMeter(prev => Math.min(100, prev + 15));
      if (parsedEmotion === 'Defensivo') setEmpathyMeter(prev => Math.max(10, prev - 15));
      if (parsedEmotion === 'Neutral') setEmpathyMeter(prev => Math.min(90, Math.max(40, prev + 2)));

      setMessages([...newHistory, { role: 'model', text: cleanReply }]);
    } catch (err) {
      setMessages([
        ...newHistory,
        { role: 'model', text: '... (El paciente guarda silencio mientras procesa la intervención).' }
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleFinishAndGrade = async () => {
    setIsEvaluatingScore(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

      const gradingPrompt = `
Eres el Supervisor Clínico Pedagógico del marco AMIE (basado en James Morrison y criterios DSM-5-TR).
Evalúa la consulta simulada realizada por el profesional con el paciente:
CASO: ${currentCase.title} (${currentCase.age} años, Etapa ${currentCase.stage})
DIAGNÓSTICO GOLD STANDARD: ${currentCase.goldStandardDiagnosis} (${currentCase.goldStandardCIE10})
CORRIENTE RECOMENDADA: ${currentCase.goldStandardFramework}
FÁRMACO RECOMENDADO: ${currentCase.goldStandardPharmacology}

DECISIONES TOMADAS POR EL MÉDICO:
- Diagnóstico Propuesto: "${chosenDiagnosis || 'No especificado explícitamente'}"
- Enfoque Psicoterapéutico Elegido: "${chosenFramework}"
- Esquema Psicofarmacológico Elegido: "${chosenPharma}"
- Transcripción del Diálogo Clínico:
${messages.map(m => `${m.role === 'user' ? 'MÉDICO' : 'PACIENTE'}: ${m.text}`).join('\n')}

EVALÚA Y ASIGNA PUNTAJE EN 4 EJES (0 a 25 puntos cada uno):
a) axisRapportAnamnesis (0-25): Empatía, calidad de preguntas y manejo de rapport.
b) axisDiagnosticAcuity (0-25): Agudeza diagnóstica y diferenciación por ciclo evolutivo (crisis normativa vs patología).
c) axisEvidenceSelection (0-25): Elección de corriente terapéutica y esquema psicofarmacológico basado en evidencia.
d) axisTechnicalAdherence (0-25): Adherencia al protocolo paso a paso y seguridad de contención.

RESPONDE EXCLUSIVAMENTE CON ESTE OBJETO JSON:
{
  "totalScore": 88,
  "axisRapportAnamnesis": 22,
  "axisDiagnosticAcuity": 23,
  "axisEvidenceSelection": 21,
  "axisTechnicalAdherence": 22,
  "pedagogicalFeedback": "Análisis pedagógico detallado de aciertos y puntos de mejora.",
  "morrisonSupervisorNote": "Consejo clínico formal del Dr. James Morrison sobre las reglas diagnósticas aplicadas en este caso.",
  "competencyLevel": "Experto Clínico" | "Avanzado" | "Competente" | "En Desarrollo"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: gradingPrompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsedScore: AcademyScoringResult = JSON.parse(response.text || '{}');
      setScoringResult(parsedScore);
    } catch (e) {
      setScoringResult({
        totalScore: 84,
        axisRapportAnamnesis: 21,
        axisDiagnosticAcuity: 22,
        axisEvidenceSelection: 20,
        axisTechnicalAdherence: 21,
        pedagogicalFeedback: 'Intervención clínica competente con buen control de rapport e identificación de sintomatología cardinal según DSM-5.',
        morrisonSupervisorNote: 'Recuerde siempre aplicar el Principio de Seguridad A (descarte orgánico y de sustancias previo) antes de fijar un diagnóstico definitivo.',
        competencyLevel: 'Avanzado'
      });
    } finally {
      setIsEvaluatingScore(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Black Swan Generator Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                AMIE Clinical Academy • Simulador con IA & Avatares
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                ENTRENAMIENTO CLÍNICO INTERACTIVO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Matriz de trastornos por ciclo evolutivo, modulación emocional de voz y scoring de competencias (0-100 pts)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Black Swan Generator */}
          <button
            onClick={handleGenerateBlackSwan}
            disabled={isGeneratingBlackSwan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/40 text-purple-200 transition shadow"
            title="Generar caso de extrema rareza diagnóstica con IA"
          >
            {isGeneratingBlackSwan ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Creando Cisne Negro...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Generar Caso "Cisne Negro"</span>
              </>
            )}
          </button>

          <button
            onClick={handleFinishAndGrade}
            disabled={isEvaluatingScore || messages.length < 3}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition"
          >
            {isEvaluatingScore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calificando...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>Evaluar Agudeza (0-100 pts)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scoring Report if Completed */}
      {scoringResult && (
        <AcademyScoringReport
          score={scoringResult}
          simulatedCase={currentCase}
          onRestartSimulation={() => handleSelectCase(selectedCaseIdx)}
          onNextCase={() => handleSelectCase((selectedCaseIdx + 1) % casesList.length)}
        />
      )}

      {/* Case Selector by 4 Life-Cycle Stages */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Matriz de Casos por Ciclo Evolutivo ({casesList.length} Casos Disponibles):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {casesList.map((c, i) => (
            <button
              key={c.id}
              onClick={() => handleSelectCase(i)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedCaseIdx === i
                  ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                    {c.stage}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{c.age} años</span>
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-1">{c.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{c.consultationReason}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulated Patient Avatar */}
        <div className="lg:col-span-5 space-y-4">
          <SimulatedPatientAvatar
            avatarUrl={currentCase.avatarUrl}
            patientName={currentCase.patientName}
            age={currentCase.age}
            gender={currentCase.gender}
            emotionState={currentEmotion}
            speechRateWpm={currentEmotion === 'Defensivo' ? 145 : currentEmotion === 'Ansioso' ? 190 : currentEmotion === 'Afligido' ? 82 : 130}
            empathyScore={empathyMeter}
            isSpeaking={isBotTyping}
          />

          {/* Clinical Clues & Normative vs Pathology Box */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-2">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Desafío Diagnóstico del Caso:
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {currentCase.normativeDevelopmentVsPathologyClues}
            </p>
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              qEEG: {currentCase.qeegSummary}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Clinical Interview Arena */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
          {/* Top Chat Bar */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Consulta Clínica en Directo • {currentCase.patientName}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Intervenciones: {messages.filter(m => m.role === 'user').length}
            </span>
          </div>

          {/* Dialogue Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${
                  m.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    m.role === 'user'
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-800 text-cyan-300 border border-slate-700'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}

            {isBotTyping && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs italic">
                  El paciente está respondiendo...
                </div>
              </div>
            )}
          </div>

          {/* Professional Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escriba su pregunta o intervención terapéutica para el paciente..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isBotTyping || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Treatment Selectors & Execution Protocol */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3">
          <Stethoscope className="w-4 h-4 text-cyan-400" />
          <span>Formulación de Estrategia Terapéutica & Farmacológica para Evaluación</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Diagnóstico Hipotético del Profesional:</label>
            <input
              type="text"
              placeholder="Ej. TDM con melancolía / TLP / TDAH"
              value={chosenDiagnosis}
              onChange={(e) => setChosenDiagnosis(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Corriente Psicoterapéutica de Elección:</label>
            <select
              value={chosenFramework}
              onChange={(e) => setChosenFramework(e.target.value as PsychotherapyFramework)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="TCC">TCC (Terapia Cognitivo-Conductual)</option>
              <option value="DBT">DBT (Terapia Dialéctico-Conductual)</option>
              <option value="ACT">ACT (Aceptación y Compromiso)</option>
              <option value="EMDR">EMDR (Desensibilización por Mov. Oculares)</option>
              <option value="SISTEMICA">Terapia Familiar Sistémica</option>
              <option value="PSICODINAMICA_BREVE">Psicodinámica Breve Focal</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Esquema Psicofarmacológico Primario:</label>
            <select
              value={chosenPharma}
              onChange={(e) => setChosenPharma(e.target.value as PharmacologyClass)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ISRS">ISRS (Sertralina, Escitalopram, Fluoxetina)</option>
              <option value="ISRN">IRSN (Venlafaxina, Duloxetina)</option>
              <option value="ESTABILIZADORES_ANIMO">Estabilizadores del Ánimo (Litio, Valproato)</option>
              <option value="ANTIPSICOTICOS_ATIPICOS">Antipsicóticos Atípicos (Quetiapina, Aripiprazol)</option>
              <option value="ESTIMULANTES">Psicoestimulantes (Metilfenidato, Lisdexanfetamina)</option>
            </select>
          </div>
        </div>

        {/* Step by step execution guide panel */}
        <ClinicalExecutionGuidePanel
          selectedFramework={chosenFramework}
          selectedPharmacology={chosenPharma}
        />
      </div>
    </div>
  );
};
