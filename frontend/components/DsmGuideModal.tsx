import React, { useState } from 'react';
import { MORRISON_CLINICAL_PRINCIPLES } from '../constants';
import { 
  BookOpen, X, Stethoscope, Search, ShieldCheck, Activity, 
  Layers, CheckCircle2, AlertTriangle, Users, Brain, Cpu, Glasses, GitCompare
} from 'lucide-react';

interface DsmGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'guide' | 'principles' | 'modules' | 'ranges';
}

interface ModuleClinicalDetail {
  id: string;
  name: string;
  badge: string;
  purpose: string;
  metrics: {
    name: string;
    normal: string;
    warning: string;
    pathological: string;
  }[];
  psychologyFocus: string;
  psychiatryFocus: string;
}

const MODULE_CLINICAL_DETAILS: ModuleClinicalDetail[] = [
  {
    id: 'workstation',
    name: '1. Workstation Clínico & APK Centinela',
    badge: 'Módulo 1 — Triaje Integrado',
    purpose: 'Consola principal para triangulación de datos del expediente JSON, psicometría (PHQ-9, GAD-7, MMSE), prosodia acústica y generación del dictamen normativo en 5 bloques.',
    metrics: [
      { name: 'PHQ-9 (Depresión)', normal: '0 - 4 (Mínimo)', warning: '5 - 14 (Leve - Moderado)', pathological: '15 - 27 (Grave / Severo)' },
      { name: 'GAD-7 (Ansiedad)', normal: '0 - 4 (Mínimo)', warning: '5 - 9 (Leve - Moderado)', pathological: '10 - 21 (Grave)' },
      { name: 'MMSE (Cognitivo)', normal: '27 - 30 (Normal)', warning: '24 - 26 (Deterioro Leve)', pathological: '< 24 (Deterioro Cognitivo Significativo)' },
      { name: 'Prosodia Acústica (F0)', normal: 'Variabilidad Tonal Normal', warning: 'Aplanamiento Tonal Leve', pathological: 'Monotonía Paroxística / Micro-temblor' }
    ],
    psychologyFocus: 'Permite contrastar la vivencia sintomática del paciente con la psicometría, establecer la línea base de distrés y definir objetivos psicoterapéuticos.',
    psychiatryFocus: 'Soporte para evaluar la severidad del episodio, descartar compromiso orgánico con MMSE y definir necesidad de intervención psicofarmacológica primaria.'
  },
  {
    id: 'scientific_evaluator',
    name: '2. Evaluador Científico & Multisensor',
    badge: 'Módulo 2 — Afinidad Diagnóstica',
    purpose: 'Extracción de biomarcadores para el cálculo automático del Scoring de Afinidad Terapéutica (0% - 100%) para Depresión Mayor, TLP, Esquizofrenia y TEA.',
    metrics: [
      { name: 'Afinidad Depresión Mayor', normal: '0% - 25%', warning: '26% - 60%', pathological: '> 60% (Coincidencia Bioclínica Alta)' },
      { name: 'Afinidad TLP (6D11)', normal: '0% - 30%', warning: '31% - 65%', pathological: '> 65% (Desregulación Afectiva Severa)' },
      { name: 'Afinidad Esquizofrenia', normal: '0% - 20%', warning: '21% - 50%', pathological: '> 50% (Sintomatología Psicótica / Pródromo)' },
      { name: 'Camouflaging Index (TEA)', normal: '< 35%', warning: '35% - 65%', pathological: '> 65% (Enmascaramiento Social Severo)' }
    ],
    psychologyFocus: 'Evita confundir rasgos de personalidad limítrofe con labilidad emocional reactiva o enmascaramiento autista en adultos.',
    psychiatryFocus: 'Orienta la selección de esquemas psicofarmacológicos (estabilizadores del ánimo, neurolépticos o ISRS) según la firma biocomportamental.'
  },
  {
    id: 'differential_bias',
    name: '3. Diferenciador Bioclínico & Filtro Antisesgo',
    badge: 'Módulo 3 — Filtro Antisesgo',
    purpose: 'Cruce multiaxial y cálculo de la Distancia de Mahalanobis para neutralizar sesgos de confirmación, deseabilidad social y efecto Rosenthal.',
    metrics: [
      { name: 'Distancia de Mahalanobis ($D^2$)', normal: '< 2.0 (Vector Coherente)', warning: '2.0 - 2.5 (Discrepancia Leve)', pathological: '> 2.5 (Atípico / Incongruencia de Autorreporte)' },
      { name: 'Ajuste Enmascaramiento Género', normal: '0% - 5%', warning: '6% - 15%', pathological: '> 15% (Máscara Social / Camouflaging)' },
      { name: 'Corrección Deseabilidad Social', normal: '< 0.10', warning: '0.10 - 0.25', pathological: '> 0.25 (Sesgo de Complacencia / Simulación)' }
    ],
    psychologyFocus: 'Identifica mecanismos de defensa (intelectualización, negación) para trabajar las resistencias no verbalizadas en sesión.',
    psychiatryFocus: 'Asegura la validez médica y pericial antes de prescribir, evitando sobre-diagnósticos en trastornos afectivos o psicóticos.'
  },
  {
    id: 'apa_framework',
    name: '4. Corrientes APA, RCI & Sincronía Díadica',
    badge: 'Marco APA — Efectividad & Alianza',
    purpose: 'Traducción epistemológica por corrientes (TCC, Psicodinámica, Gestalt, Sistémica, Neuropsicología), RCI de Jacobson & Truax y Co-regulación Autonómica.',
    metrics: [
      { name: 'Índice RCI (Jacobson & Truax)', normal: '-1.95 a +1.95 (Sin Cambio)', warning: 'Variación no significativa', pathological: 'RCI ≤ -1.96 (Mejoría Significativa p < 0.05)' },
      { name: 'Acoplamiento Fisiológico Díada', normal: '> 70% (Alianza Óptima)', warning: '45% - 69% (Co-regulación Moderada)', pathological: '< 45% (Desacoplamiento / Riesgo de Ruptura)' },
      { name: 'Índice de Habituación ($H$)', normal: '> 2.0 (Extinción Óptima)', warning: '1.0 - 2.0 (Lenta Extinción)', pathological: '< 1.0 (Resistencia a la Extinción / Fobia)' }
    ],
    psychologyFocus: 'Permite evaluar empíricamente el progreso psicoterapéutico en diseño de caso único (N=1) y monitorear la calidad de la alianza terapéutica.',
    psychiatryFocus: 'Proporciona evidencia cuantitativa sobre la efectividad combinada del tratamiento farmacológico y la psicoterapia.'
  },
  {
    id: 'neuro_3d',
    name: '5. Neurotopografía 3D & qEEG',
    badge: 'Módulo 5 — Mapeo Cortical',
    purpose: 'Visualización holográfica 3D del encéfalo, análisis de potencias por banda ($\delta, \theta, \alpha, \beta, \gamma$), ratios neurofisiológicos y Z-Scores normativos.',
    metrics: [
      { name: 'Ratio Frontal Theta/Beta ($T/B$)', normal: '1.0 - 2.2', warning: '2.3 - 2.9 (Desatención Moderada)', pathological: '> 3.0 (TDAH / Hipoactivación Frontal)' },
      { name: 'qEEG Z-Scores Corticales', normal: '-1.0 a +1.0 SD', warning: '±1.1 a ±1.9 SD', pathological: '> ±2.0 SD (Desviación Clínica Significativa)' },
      { name: 'Asimetría Alfa Temporal', normal: '-0.1 a +0.1', warning: '±0.2 a ±0.3', pathological: '> +0.4 / < -0.4 (Vulnerabilidad Afectiva)' }
    ],
    psychologyFocus: 'Facilita la psicoeducación visual con el paciente para explicar los correlatos neurobiológicos de la atención y la autorregulación.',
    psychiatryFocus: 'Directriz neurofisiológica para definir necesidad de neuromodulación (rTMS, tDCS), neurofeedback o ajuste de estimulantes/ansiolíticos.'
  },
  {
    id: 'vr_therapy',
    name: '6. VR Inmersivo (Meta Quest 3S / Pico Neuro 3 Pro)',
    badge: 'Biometría VR — Telemetría en Tiempo Real',
    purpose: 'Módulo de exposición inmersiva y desensibilización con biofeedback en tiempo real (GSR, HRV) y consolas de Analgesia, Mirror VR, Gamma 40Hz y Neurohipnosis.',
    metrics: [
      { name: 'Conductancia Cutánea (GSR)', normal: '0.5 - 2.5 µS', warning: '2.6 - 4.0 µS (Excitación Moderada)', pathological: '> 4.0 µS (Hiperalerta / Pánico) ó < 0.5 µS (Aplanamiento)' },
      { name: 'Tono Vagal Parasimpático (HRV)', normal: '> 35 ms RMSSD', warning: '20 - 35 ms RMSSD', pathological: '< 20 ms RMSSD (Inhibición Vagal / Colapso)' },
      { name: 'Índice de Freezing Motriz', normal: '0 - 1.5 pts', warning: '1.6 - 3.0 pts', pathological: '> 3.0 pts (Bloqueo Motor en Umbrales VR)' },
      { name: 'Gaze Tracking Error (Eye Tracking)', normal: '< 1.5°', warning: '1.5° - 3.0°', pathological: '> 3.0° (Incongruencia Oculomotora)' }
    ],
    psychologyFocus: 'Permite realizar desensibilización sistemática inmersiva adaptando la intensidad de la exposición según el nivel de estrés fisiológico real.',
    psychiatryFocus: 'Evaluación cuantitativa del tono autonómico simpático/parasimpático y capacidad de recuperación homeostática frente a provocación estresante.'
  }
];

export const DsmGuideModal: React.FC<DsmGuideModalProps> = ({
  isOpen,
  onClose,
  defaultView = 'principles',
}) => {
  const [view, setView] = useState<'guide' | 'principles' | 'modules' | 'ranges'>(defaultView);
  const [search, setSearch] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('workstation');

  if (!isOpen) return null;

  const filteredPrinciples = MORRISON_CLINICAL_PRINCIPLES.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.text.toLowerCase().includes(search.toLowerCase()) ||
      p.letter.toLowerCase().includes(search.toLowerCase())
  );

  const selectedModule = MODULE_CLINICAL_DETAILS.find(m => m.id === selectedModuleId) || MODULE_CLINICAL_DETAILS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Compendio Diagnóstico & Manual de Interpretación AMIE
                <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] rounded-full font-mono">
                  DSM-5-TR / CIE-11
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Reglas de James Morrison, estructura DSM-5®, matriz de rangos y guías de lectura interdisciplinaria.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bar de Navegación & Búsqueda */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setView('principles')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                view === 'principles' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              16 Principios Morrison
            </button>
            <button
              onClick={() => setView('modules')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                view === 'modules' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Guía de Módulos & Lectura
            </button>
            <button
              onClick={() => setView('ranges')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                view === 'ranges' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Matriz de Rangos & Umbrales
            </button>
            <button
              onClick={() => setView('guide')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                view === 'guide' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Capítulos DSM-5®
            </button>
          </div>

          {view === 'principles' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Buscar principio o término..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-950">
          
          {/* VISTA 1: 16 PRINCIPIOS DE JAMES MORRISON */}
          {view === 'principles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {filteredPrinciples.map((principle) => (
                <div
                  key={principle.letter}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center font-mono border border-sky-500/30 text-xs shrink-0">
                      {principle.letter}
                    </span>
                    <h3 className="font-bold text-slate-100">{principle.title}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-8 text-[11px]">{principle.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* VISTA 2: GUÍA DETALLADA DE MÓDULOS CON LECTURA DUAL */}
          {view === 'modules' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Lista Lateral de Módulos */}
              <div className="md:col-span-4 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Seleccionar Módulo a Consultar:
                </span>
                {MODULE_CLINICAL_DETAILS.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                      selectedModuleId === mod.id
                        ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold">{mod.name}</div>
                    <span className="text-[10px] opacity-80 block mt-0.5">{mod.badge}</span>
                  </button>
                ))}
              </div>

              {/* Panel de Detalle del Módulo */}
              <div className="md:col-span-8 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white">{selectedModule.name}</h3>
                    <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800/60 px-2.5 py-0.5 rounded-full font-mono">
                      {selectedModule.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedModule.purpose}</p>
                </div>

                {/* Métricas y Rangos */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Activity className="w-4 h-4" /> Métricas e Indicadores de Lectura
                  </h4>
                  <div className="space-y-2">
                    {selectedModule.metrics.map((m, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1">
                        <div className="font-bold text-slate-200">{m.name}</div>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <span className="text-emerald-400 font-mono">Normal: {m.normal}</span>
                          <span className="text-amber-400 font-mono">Alerta: {m.warning}</span>
                          <span className="text-rose-400 font-mono">Patológico: {m.pathological}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enfoques por Profesión */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Orientación para Psicólogos</span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{selectedModule.psychologyFocus}</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Orientación para Psiquiatras</span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{selectedModule.psychiatryFocus}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 3: MATRIZ CONSOLIDADA DE RANGOS Y UMBRALES */}
          {view === 'ranges' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sky-400 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Matriz Consolidada de Biomarcadores Fisiológicos & Psicométricos
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Unidades Estándar ISO/IEEE</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Biomarcador</th>
                      <th className="p-3">Rango Normal</th>
                      <th className="p-3">Rango Alerta</th>
                      <th className="p-3">Rango Patológico</th>
                      <th className="p-3">Utilidad Clínica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950 text-slate-300">
                    <tr>
                      <td className="p-3 font-bold text-white">GSR (Conductancia Cutánea)</td>
                      <td className="p-3 text-emerald-400">0.5 - 2.5 µS</td>
                      <td className="p-3 text-amber-400">2.6 - 4.0 µS</td>
                      <td className="p-3 text-rose-400">&gt; 4.0 µS / &lt; 0.5 µS</td>
                      <td className="p-3 text-slate-400 font-sans">Excitación adrenérgica simpática.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">HRV RMSSD (Tono Vagal)</td>
                      <td className="p-3 text-emerald-400">&gt; 35 ms</td>
                      <td className="p-3 text-amber-400">20 - 35 ms</td>
                      <td className="p-3 text-rose-400">&lt; 20 ms</td>
                      <td className="p-3 text-slate-400 font-sans">Capacidad de autorregulación parasimpática.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Ratio Frontal Theta/Beta ($T/B$)</td>
                      <td className="p-3 text-emerald-400">1.0 - 2.2</td>
                      <td className="p-3 text-amber-400">2.3 - 2.9</td>
                      <td className="p-3 text-rose-400">&gt; 3.0</td>
                      <td className="p-3 text-slate-400 font-sans">Inatención y desregulación frontal (TDAH).</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">qEEG Z-Scores Corticales</td>
                      <td className="p-3 text-emerald-400">-1.0 a +1.0 SD</td>
                      <td className="p-3 text-amber-400">±1.1 a ±1.9 SD</td>
                      <td className="p-3 text-rose-400">&gt; ±2.0 SD</td>
                      <td className="p-3 text-slate-400 font-sans">Desviación neurofisiológica normativa por edad.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Índice RCI (Jacobson & Truax)</td>
                      <td className="p-3 text-slate-400">-1.95 a +1.95</td>
                      <td className="p-3 text-amber-400">N/A</td>
                      <td className="p-3 text-emerald-400">RCI ≤ -1.96</td>
                      <td className="p-3 text-slate-400 font-sans">Cambio clínico significativo ($p &lt; 0.05$).</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Distancia de Mahalanobis ($D^2$)</td>
                      <td className="p-3 text-emerald-400">&lt; 2.0</td>
                      <td className="p-3 text-amber-400">2.0 - 2.5</td>
                      <td className="p-3 text-rose-400">&gt; 2.5</td>
                      <td className="p-3 text-slate-400 font-sans">Incongruencias y sesgos de deseabilidad social.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 4: GUÍA ESTRUCTURAL DE CAPÍTULOS DSM-5® */}
          {view === 'guide' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="font-bold text-sky-400 text-sm mb-1">Estructura de la Guía Morrison (19 Capítulos)</h3>
                <p className="text-slate-300 leading-relaxed mb-3">
                  La Guía DSM-5® de Morrison unifica capítulos clave y enfatiza prototipos y reglas de seguridad (las "D": Duración, Discapacidad, Diagnóstico diferencial, Datos demográficos).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-0.5">Capítulo 1-2: Neurodesarrollo & Psicosis</span>
                    <p className="text-slate-400">TDAH (F90.2), TEA (F84.0), Esquizofrenia (F20.9), Catatonia (F06.1), Trastorno Esquizofreniforme (F20.81).</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-0.5">Capítulo 3-4: Ánimo & Ansiedad</span>
                    <p className="text-slate-400">TDM (F32/F33), Bipolar I/II (F31), Distimia (F34.1), Pánico (F41.0), Agorafobia (F40.0), TAG (F41.1).</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-0.5">Capítulo 5-8: TOC, Trauma & Somáticos</span>
                    <p className="text-slate-400">TOC (F42), TEPT (F43.10), Estrés Agudo (F43.3), Síntomas Somáticos (F45.1), Conversión (F44.4).</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-0.5">Capítulo 15-17: Sustancias, Cognitivos & Personalidad</span>
                    <p className="text-slate-400">Intoxicación/Abstinencia F10-F19, Delirium (F05), TNC Mayor/Leve (G30/G31), TLP (F60.3), TPA (F60.2).</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>AMIE Clinical Engine • Norma DSM-5-TR / CIE-11</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition cursor-pointer font-sans"
          >
            Cerrar Manual
          </button>
        </div>
      </div>
    </div>
  );
};
