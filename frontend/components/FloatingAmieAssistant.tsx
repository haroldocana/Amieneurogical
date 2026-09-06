import React, { useState } from 'react';
import {
  Bot,
  Stethoscope,
  X,
  LayoutDashboard,
  Microscope,
  GitCompare,
  GraduationCap,
  Cpu,
  Brain,
  Search,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  Zap,
  Sparkles,
  CloudDownload,
  BookOpen,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';

interface FloatingAmieAssistantProps {
  currentPatientId: string;
  onNavigateTab: (tabId: 'workstation' | 'scientific_evaluator' | 'differential_bias' | 'academy' | 'neuro_3d' | 'neurosensometry' | 'referral' | 'saas') => void;
  activeTab: string;
}

export const FloatingAmieAssistant: React.FC<FloatingAmieAssistantProps> = ({
  currentPatientId,
  onNavigateTab,
  activeTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('workstation');

  const GUIDE_TOPICS = [
    {
      id: 'workstation',
      tabKey: 'workstation' as const,
      icon: LayoutDashboard,
      title: 'a) Workstation Clínico',
      subtitle: 'Triangulación de Riesgos, APK Centinela y Dictamen 5 Bloques',
      color: 'text-sky-400',
      badge: 'Núcleo Central',
      summary: 'Área de trabajo para la evaluación diagnóstica en tiempo real, combinando psicometría estandarizada, notas de sesión y dictamen estructurado DSM-5.',
      keyPoints: [
        'Triangulación Bioclínica: Cruza datos subjetivos (anamnesis, notas) con marcadores objetivos (Z-Scores qEEG, latencia USB en ms y escalas PHQ-9/GAD-7/MMSE).',
        'Telemetría Pasiva APK Centinela: Registra despertares nocturnos (>3x indica riesgo autolítico agudo), latencia táctil en pantalla y tiempos de actividad nocturna.',
        'Biometría Acústica: Mapeo de velocidad fonatoria (WPM), bradilalia y aplanamiento prosódico de la voz del paciente.',
        'Dictamen en 5 Bloques: 1) Impresión Principal (>80%), 2) Matriz Diferencial, 3) qEEG por Lóbulos, 4) Alertas S.O.S., 5) Plan Multimodal.'
      ]
    },
    {
      id: 'scientific_evaluator',
      tabKey: 'scientific_evaluator' as const,
      icon: Microscope,
      title: 'b) Evaluador Científico',
      subtitle: 'Diagnóstico Cruzado DSM-5, Tono Vagal y Camouflaging Index',
      color: 'text-teal-400',
      badge: 'Multisensor Físico',
      summary: 'Extrae automáticamente los parámetros del expediente PAC y calcula el Scoring de Afinidad Terapéutica (0-100%).',
      keyPoints: [
        'Scoring de Afinidad (0-100%): Calcula concordancia terapéutica para Depresión Mayor, TLP, Esquizofrenia y TEA/Asperger, sugiriendo TCC, DBT, MBT, EMDR o Remediación.',
        'Medidor de Tono Vagal (HRV / RMSSD): Valores <25 revelan inhibición parasimpática severa y estrés neuroautonómico crónico.',
        'Indicador de Enmascaramiento Social (Camouflaging Index): Cuantifica el esfuerzo consciente de camuflaje en adultos y mujeres con TEA/Asperger.',
        'Calibración Touch de Latencia: Compensación precisa en microsegundos mediante event.timeStamp para pruebas en tablet/celular.'
      ]
    },
    {
      id: 'neuro_3d',
      tabKey: 'neuro_3d' as const,
      icon: Cpu,
      title: 'c) Neurotopografía 3D',
      subtitle: 'Mapeo Térmico Volumétrico, 5 Bandas y Seguimiento Saccádico',
      color: 'text-indigo-400',
      badge: 'Holographic HUD',
      summary: 'Visualizador volumétrico continuo en tiempo real con 4 vistas satelitales (Frontal, Lateral, Posterior, Dorsal) y sistema 10-20.',
      keyPoints: [
        '5 Bandas de Frecuencia: Delta (0.5-4 Hz), Theta (4-8 Hz), Alpha (8-12 Hz), Beta (12-30 Hz) y High-Beta (21-30 Hz).',
        'Gradiente Térmico Continuo: Azul (< -1.5σ) → Verde (±0.5σ) → Amarillo (+1.5σ) → Naranja (+2.2σ) → Rojo (> +2.8σ).',
        'Contraste de Patologías DSM-5: Compara en tiempo real las amplitudes y ratios Theta/Beta con benchmarks científicos (>80% correlación).',
        'Retícula Saccádica & Fijación: Mapeo por cámara de movimientos oculares rápidos y micro-tensión facial.'
      ]
    },
    {
      id: 'neurosensometry',
      tabKey: 'neurosensometry' as const,
      icon: Brain,
      title: 'd) qEEG & Carga de Señal',
      subtitle: 'Inspección de Ondas Crudas (.EDF / .BDF / .EEG) y Espectro FFT',
      color: 'text-purple-400',
      badge: 'Parser Encefalográfico',
      summary: 'Módulo para cargar trazados electroencefalográficos nativos y calcular matrices espectrales de microvoltios e impedancias.',
      keyPoints: [
        'Soporte Multiformato: Carga directa de archivos .EDF, .BDF, .EEG, .CSV y .DAT.',
        'Extracción Espectral: Mapeo automático de 19 canales al sistema internacional 10-20, detección de artefactos y cálculo de densidad espectral de potencia (µV²/Hz).',
        'Verificación de Impedancias: Mapeo de resistencia por electrodo (<3 kΩ = Óptimo).'
      ]
    },
    {
      id: 'differential_bias',
      tabKey: 'differential_bias' as const,
      icon: GitCompare,
      title: 'e) Diferenciador & Sesgos',
      subtitle: 'Matriz Antisesgo de 7 Trastornos y Gemelo Digital de Riesgo',
      color: 'text-cyan-400',
      badge: 'Seguridad Diagnóstica',
      summary: 'Resuelve conflictos diagnósticos frecuentes (TDAH vs Ansiedad, Depresión vs TLP, TEA vs TOC) mediante cruce cuádruple y auditoría NLP.',
      keyPoints: [
        'Decodificador NLP de Sesgos: Escanea las notas clínicas del terapeuta para detectar sesgos de confirmación, género y anclaje prematuro.',
        'Gemelo Digital de Riesgo: Simula las complicaciones iatrogénicas si se aplica el tratamiento del diagnóstico erróneo.',
        'Reglas de Jerarquía James Morrison: Aplicación de los principios de seguridad A (descarte orgánico) y W (no diagnosticar TP en cuadro agudo).'
      ]
    },
    {
      id: 'sync_pac',
      tabKey: 'workstation' as const,
      icon: CloudDownload,
      title: 'f) Sincronizador PAC',
      subtitle: 'Cruce de Metadatos Filiatorios con Cloud Function',
      color: 'text-emerald-400',
      badge: 'Google Cloud Run',
      summary: 'Conexión dinámica con la Cloud Function para importar expedientes PAC anonimizados (PAC-XXXX) vinculados al No. de Colegiado.',
      keyPoints: [
        'Petición HTTP POST: Envía { patientId: searchPacId, colegiado: number } al endpoint https://sync-patient-expedient-367911373284.us-central1.run.app.',
        'Manejo de Errores 404: Despliega una alerta visual no destructiva si el expediente no existe en Toro App.',
        'Anonimización Estricta: Muestra únicamente "Paciente ID: [id] | Edad: [age] | Sexo: [sex]" para cumplimiento HIPAA/RGPD.'
      ]
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
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-950/90 hover:bg-slate-900 border-2 border-cyan-400/80 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
          title="Abrir Asistente Flotante de Ayuda Clínica AMIE"
        >
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30 group-hover:rotate-12 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent uppercase flex items-center gap-1">
              <span>Asistente AMIE Help</span>
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Guía de Módulos • {currentPatientId}
            </div>
          </div>
        </button>
      </div>

      {/* Slide-over Drawer / Panel Lateral (Dark Glassmorphism) */}
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
                    Manual Operativo de Módulos • Paciente Activo: {currentPatientId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Cerrar Panel de Ayuda"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar explicación de módulo, biomarcador o herramienta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Horizontal Topic Switcher */}
            <div className="p-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {filteredTopics.map((topic) => {
                const IconComp = topic.icon;
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
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

            {/* Topic Details Panel */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/70">
              
              {/* Title Card */}
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

                {/* Direct Jump Action Button */}
                <button
                  onClick={() => {
                    onNavigateTab(currentTopicData.tabKey);
                    setIsOpen(false);
                  }}
                  className="mt-2 w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition"
                >
                  <span>Ir a este Módulo en la Consola</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step-by-Step Clinical Explanations */}
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Funcionamiento & Especificaciones Técnicas:
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

              {/* Safety Assurance Note */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Confidencialidad Médica:</strong> Todas las consultas del Asistente y los expedientes procesados se mantienen anonimizados bajo normativas HIPAA y RGPD.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>AMIE Clinical Engine v3.7</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
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
