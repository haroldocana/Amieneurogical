import React, { useState } from 'react';
import {
  Bot,
  Stethoscope,
  X,
  LayoutDashboard,
  Microscope,
  GitCompare,
  Cpu,
  Brain,
  Search,
  ArrowRight,
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  Lock,
  Glasses,
  BookOpen,
  Activity
} from 'lucide-react';

interface FloatingAmieAssistantProps {
  currentPatientId: string;
  onNavigateTab: (tabId: 'workstation' | 'scientific_evaluator' | 'differential_bias' | 'academy' | 'neuro_3d' | 'neurosensometry' | 'referral' | 'saas') => void;
  activeTab: string;
}

interface GuideTopic {
  id: string;
  tabKey: 'workstation' | 'scientific_evaluator' | 'differential_bias' | 'academy' | 'neuro_3d' | 'neurosensometry' | 'referral' | 'saas';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  summary: string;
  keyPoints: string[];
  psychologyTip: string;
  psychiatryTip: string;
}

export const FloatingAmieAssistant: React.FC<FloatingAmieAssistantProps> = ({
  currentPatientId,
  onNavigateTab,
  activeTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('workstation');

  const GUIDE_TOPICS: GuideTopic[] = [
    {
      id: 'workstation',
      tabKey: 'workstation',
      icon: LayoutDashboard,
      title: 'a) Workstation Clínico & Centinela',
      subtitle: 'Triangulación de Riesgos, APK Centinela y Dictamen 5 Bloques',
      color: 'text-sky-400',
      badge: 'Módulo 1 — Núcleo',
      summary: 'Área de trabajo para evaluación diagnóstica en tiempo real, combinando psicometría estandarizada, notas de sesión y dictamen estructurado DSM-5-TR.',
      keyPoints: [
        'Triangulación Bioclínica: Cruza datos subjetivos (anamnesis, notas) con marcadores objetivos (Z-Scores qEEG, latencia USB en ms y escalas PHQ-9/GAD-7/MMSE).',
        'Telemetría Pasiva APK Centinela: Registra despertares nocturnos (>3x indica riesgo autolítico agudo), latencia táctil en pantalla y tiempos de actividad nocturna.',
        'Biometría Acústica: Mapeo de velocidad fonatoria (WPM), bradilalia y aplanamiento prosódico de la voz del paciente.',
        'Dictamen en 5 Bloques: 1) Impresión Principal (>80%), 2) Matriz Diferencial, 3) qEEG por Lóbulos, 4) Alertas S.O.S., 5) Plan Multimodal.'
      ],
      psychologyTip: 'Revisa las puntuaciones PHQ-9 (≥15 grave) y GAD-7 (≥10 grave) para definir el foco psicoterapéutico primario.',
      psychiatryTip: 'Soporte para evaluar la severidad del episodio, descartar compromiso orgánico con MMSE (<24) y decidir la necesidad de fármacos.'
    },
    {
      id: 'scientific_evaluator',
      tabKey: 'scientific_evaluator',
      icon: Microscope,
      title: 'b) Evaluador Científico & Multisensor',
      subtitle: 'Diagnóstico Cruzado DSM-5, Tono Vagal y Camouflaging Index',
      color: 'text-teal-400',
      badge: 'Módulo 2 — Afinidad',
      summary: 'Extrae automáticamente parámetros del expediente PAC y calcula el Scoring de Afinidad Terapéutica (0-100%).',
      keyPoints: [
        'Scoring de Afinidad (0-100%): Calcula concordancia terapéutica para Depresión Mayor, TLP, Esquizofrenia y TEA/Asperger.',
        'Medidor de Tono Vagal (HRV / RMSSD): Valores <20 ms RMSSD revelan inhibición parasimpática severa y estrés neuroautonómico crónico.',
        'Indicador de Enmascaramiento Social (Camouflaging Index): Cuantifica el esfuerzo consciente de camuflaje en adultos y mujeres con TEA.',
        'Calibración Touch de Latencia: Compensación precisa en microsegundos mediante event.timeStamp para pruebas en tablet/celular.'
      ],
      psychologyTip: 'Permite diferenciar la inestabilidad reactiva de personalidad limítrofe de la sobrecarga sensorial en personas con TEA.',
      psychiatryTip: 'Guía para ajustar estabilizadores del ánimo o neurolépticos de acuerdo a la firma autonómica predominante.'
    },
    {
      id: 'differential_bias',
      tabKey: 'differential_bias',
      icon: GitCompare,
      title: 'c) Diferenciador Bioclínico & Antisesgo',
      subtitle: 'Matriz Antisesgo de 7 Trastornos y Gemelo Digital de Riesgo',
      color: 'text-cyan-400',
      badge: 'Módulo 3 — Antisesgo',
      summary: 'Resuelve conflictos diagnósticos frecuentes (TDAH vs Ansiedad, Depresión vs TLP, TEA vs TOC) mediante la Distancia de Mahalanobis ($D^2$) y auditoría NLP.',
      keyPoints: [
        'Decodificador NLP de Sesgos: Escanea las notas clínicas del terapeuta para detectar sesgos de confirmación, género y anclaje prematuro.',
        'Distancia de Mahalanobis ($D^2$): Un valor $D^2 > 2.5$ señala atipicidad o incongruencia entre autorreporte y biometría.',
        'Gemelo Digital de Riesgo: Simula las complicaciones iatrogénicas si se aplica el tratamiento del diagnóstico erróneo.',
        'Reglas de Jerarquía James Morrison: Aplicación de los principios de seguridad A (descarte orgánico) y W (no diagnosticar TP en cuadro agudo).'
      ],
      psychologyTip: 'Identifica defensas de deseabilidad social o intelectualización para explorar resistencias en la terapia.',
      psychiatryTip: 'Garantiza solidez pericial y médica antes de iniciar esquemas farmacológicos complejos.'
    },
    {
      id: 'neuro_3d',
      tabKey: 'neuro_3d',
      icon: Cpu,
      title: 'd) Neurotopografía 3D Holográfica',
      subtitle: 'Mapeo Térmico Volumétrico, 5 Bandas y Ratios Neurofisiológicos',
      color: 'text-indigo-400',
      badge: 'Módulo 5 — Cortical',
      summary: 'Visualizador volumétrico continuo en tiempo real con 4 vistas satelitales (Frontal, Lateral, Posterior, Dorsal) y sistema 10-20.',
      keyPoints: [
        '5 Bandas de Frecuencia: Delta (0.5-4 Hz), Theta (4-8 Hz), Alpha (8-12 Hz), Beta (12-30 Hz) y High-Beta (21-30 Hz).',
        'Ratio Frontal Theta/Beta ($T/B$): Un ratio $T/B > 3.0$ es indicativo de hipoactivación dorsolateral frontal y desatención (TDAH).',
        'Z-Scores Corticales: Valores $> \pm 2.0\text{ SD}$ reflejan desviaciones neurofisiológicas estadísticamente significativas.',
        'Asimetría Alfa Temporal: Asimetrías $> \pm 0.4$ sugieren vulnerabilidad afectiva o inhibición anhedónica.'
      ],
      psychologyTip: 'Herramienta visual clave para psicoeducación sobre autorregulación cerebral y biofeedback.',
      psychiatryTip: 'Fundamento neurofisiológico para planificar rTMS, tDCS o estimulantes centrales.'
    },
    {
      id: 'neurosensometry',
      tabKey: 'neurosensometry',
      icon: Brain,
      title: 'e) qEEG & Carga de Señal Cruda',
      subtitle: 'Inspección de Ondas Crudas (.EDF / .BDF / .EEG) y Espectro FFT',
      color: 'text-purple-400',
      badge: 'Parser Encefalográfico',
      summary: 'Módulo para cargar trazados electroencefalográficos nativos y calcular matrices espectrales de microvoltios e impedancias.',
      keyPoints: [
        'Soporte Multiformato: Carga directa de archivos .EDF, .BDF, .EEG, .CSV y .DAT.',
        'Extracción Espectral: Mapeo automático de 19 canales al sistema internacional 10-20 y cálculo de densidad espectral de potencia (µV²/Hz).',
        'Verificación de Impedancias: Mapeo de resistencia por electrodo (<3 kΩ = Óptimo).'
      ],
      psychologyTip: 'Permite asociar episodios de desregulación emocional con picos de lentificación Theta o hiperarousal Beta.',
      psychiatryTip: 'Inspección de paroxismos o enlentecimiento focal previo a la prescripción.'
    },
    {
      id: 'sync_pac',
      tabKey: 'workstation',
      icon: DownloadCloud,
      title: 'f) Sincronizador PAC & Servidor Backend',
      subtitle: 'Importación de Expedientes Anonimizados Cloud Run',
      color: 'text-emerald-400',
      badge: 'Google Cloud Run / Render',
      summary: 'Conexión dinámica para importar expedientes PAC anonimizados (PAC-XXXX) vinculados al número de colegiado médico.',
      keyPoints: [
        'Sincronización Segura: Petición HTTP POST autenticada con token JWT al backend.',
        'Respuesta No Destructiva: Alerta visual clara en la barra superior si el código PAC no registra datos en la nube.',
        'Privacidad HIPAA/RGPD: Exposición exclusiva de datos anonimizados para resguardo de identidad.'
      ],
      psychologyTip: 'Garantiza la trazabilidad longitudinal del expediente del paciente.',
      psychiatryTip: 'Permite compartir datos interconsulta de forma segura entre centros de salud.'
    }
  ];

  const currentTopicData = GUIDE_TOPICS.find((t) => t.id === selectedTopic) || GUIDE_TOPICS[0];

  const filteredTopics = GUIDE_TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.keyPoints.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {/* Botón Flotante en la Esquina Inferior Derecha */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-950/90 hover:bg-slate-900 border-2 border-cyan-400/80 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
          title="Abrir Asistente Flotante de Ayuda Clínica AMIE"
        >
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30 group-hover:rotate-12 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent uppercase flex items-center gap-1">
              <span>Asistente AMIE 2.5</span>
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Guía de Módulos • {currentPatientId}
            </div>
          </div>
        </button>
      </div>

      {/* Drawer Lateral / Modal Flotante */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl h-full bg-slate-950/95 border-l border-cyan-500/40 shadow-[-15px_0_40px_rgba(6,182,212,0.2)] flex flex-col text-slate-100 overflow-hidden font-sans">
            
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                    <span>Asistente de Orientación Clínica AMIE</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Manual Operativo • Paciente Activo: {currentPatientId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Cerrar Panel de Ayuda"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar explicación de módulo, biomarcador o rango..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Selector Horizontal de Temas */}
            <div className="p-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {filteredTopics.map((topic) => {
                const IconComp = topic.icon;
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/40'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : topic.color}`} />
                    <span>{topic.title.split(') ')[1] || topic.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel de Detalle del Tema Seleccionado */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/70">
              
              {/* Tarjeta de Título y Resumen */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <currentTopicData.icon className={`w-5 h-5 ${currentTopicData.color}`} />
                    <h3 className="font-black text-sm text-white">{currentTopicData.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {currentTopicData.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentTopicData.summary}
                </p>

                {/* Botón para Navegar al Módulo */}
                <button
                  onClick={() => {
                    onNavigateTab(currentTopicData.tabKey);
                    setIsOpen(false);
                  }}
                  className="mt-2 w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition cursor-pointer"
                >
                  <span>Ir a este Módulo en la Consola</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Especificaciones Técnicas */}
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Especificaciones & Operativa:
                </span>

                <div className="space-y-2">
                  {currentTopicData.keyPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2 hover:border-slate-700 transition"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips para Psicólogos y Psiquiatras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">Tip para Psicólogos</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{currentTopicData.psychologyTip}</p>
                </div>

                <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase block">Tip para Psiquiatras</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{currentTopicData.psychiatryTip}</p>
                </div>
              </div>

              {/* Confidencialidad */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Garantía de Confidencialidad:</strong> Los expedientes cargados y las consultas del asistente están anonimizados bajo protocolo médico HIPAA / RGPD.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>AMIE Assistant Engine v2.5</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer font-sans"
              >
                Cerrar Asistente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
