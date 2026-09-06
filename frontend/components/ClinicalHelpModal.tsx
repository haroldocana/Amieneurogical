import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  LayoutDashboard,
  Microscope,
  GitCompare,
  GraduationCap,
  Cpu,
  ShieldAlert,
  KeyRound,
  Brain,
  Smartphone,
  Mic,
  HeartPulse,
  Pill,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Tablet,
  ScanEye,
  Flame,
  Activity
} from 'lucide-react';

export interface ClinicalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalHelpModal: React.FC<ClinicalHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('workstation');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const MODULES_HELP = [
    {
      id: 'workstation',
      icon: LayoutDashboard,
      title: '1. Workstation Clínico',
      subtitle: 'Expediente PAC, Triangulación Bioclínica y Dictamen AMIE en 5 Bloques',
      color: 'text-sky-400',
      badge: 'Módulo Central',
      summary: 'El núcleo de trabajo para la evaluación diagnóstica en tiempo real, combinando psicometría estandarizada, notas de sesión y dictámenes según el marco James Morrison y DSM-5.',
      details: [
        {
          heading: 'Expediente Digital del Paciente (JSON)',
          content: 'Permite editar o cargar casos prototípicos (PAC-XXXX). Contiene anamnesis longitudinal, motivo de consulta, notas de evolución por sesión, antecedentes médicos y consumo de sustancias.'
        },
        {
          heading: 'Medición Pasiva (APK Centinela)',
          content: 'Monitorea sin invadir la privacidad: despertares nocturnos (>3 indica alerta crítica), latencia biomotora en pantalla (ms) y actividad en horas de oscuridad para detección precoz de crisis y riesgo autolítico.'
        },
        {
          heading: 'Biometría Acústica de Voz',
          content: 'Analiza grabaciones de consulta procesando la velocidad fonatoria (WPM), índice de bradilalia, aplanamiento prosódico y latencia de respuesta antes de hablar.'
        },
        {
          heading: 'Dictamen Estructurado en 5 Bloques',
          content: 'Emite: 1) Impresión Diagnóstica Principal (>80% certeza), 2) Matriz Diferencial de 7 trastornos, 3) Neurosensometría qEEG por lóbulos, 4) Alertas S.O.S., 5) Plan Multimodal (Psicoterapia TCC/DBT/EMDR, Fármacos y Neurofeedback).'
        }
      ]
    },
    {
      id: 'scientific_evaluator',
      icon: Microscope,
      title: '2. Evaluador Científico & Multisensor',
      subtitle: 'Scoring de Afinidad Terapéutica & Telemetría Física de Hardware',
      color: 'text-teal-400',
      badge: 'Biomarcadores Físicos',
      summary: 'Extrae automáticamente los parámetros del expediente PAC y calcula el % de afinidad terapéutica cruzando datos duros con la respuesta clínica esperada.',
      details: [
        {
          heading: 'Sistema de Scoring de Afinidad Terapéutica (0-100%)',
          content: 'Calcula la probabilidad de éxito de intervenciones específicas (TCC, DBT, MBT, EMDR, Remediación Cognitiva e Integración Sensorial) para Depresión, TLP, Esquizofrenia y TEA/Asperger.'
        },
        {
          heading: 'Medidor de Tono Vagal (HRV / RMSSD)',
          content: 'Mide la actividad parasimpática y la variabilidad de la frecuencia cardíaca. Valores <25 indican estrés crónico, hiperactivación simpática y pobre regulación autonómica.'
        },
        {
          heading: 'Indicador de Enmascaramiento Social (Camouflaging Index)',
          content: 'Herramienta clave para el diagnóstico de TEA/Asperger en adultos y mujeres, detectando el esfuerzo consciente por imitar normas sociales y su costo de agotamiento emocional.'
        },
        {
          heading: 'Calibración Touch de Alta Precisión',
          content: 'Compensa la latencia táctil del hardware en tabletas y teléfonos utilizando microsegundos exactos del navegador (event.timeStamp).'
        }
      ]
    },
    {
      id: 'differential_bias',
      icon: GitCompare,
      title: '3. Diferenciador & Matriz Antisesgo',
      subtitle: 'Contraste Bioclínico Cuádruple, NLP de Notas y Gemelo de Riesgo',
      color: 'text-cyan-400',
      badge: 'Seguridad Diagnóstica',
      summary: 'Resuelve dilemas diagnósticos de alta complejidad evitando sesgos de confirmación, género o anclaje mediante contrastación cruzada.',
      details: [
        {
          heading: 'Selector de Trastornos en Conflicto',
          content: 'Compara pares de diagnóstico diferencial frecuente: TDAH vs Ansiedad (TAG), Depresión Mayor vs TLP, Autismo (TEA) vs TOC, y Deterioro Cognitivo vs Pseudodemencia.'
        },
        {
          heading: 'Tabla de Triangulación de 4 Ejes',
          content: 'Contrasta para cada patología: 1) Z-Scores qEEG, 2) Biometría Acústica de voz, 3) Batería Psicométrica DSM-5, 4) Telemetría APK Centinela.'
        },
        {
          heading: 'Decodificador de Sesgos del Lenguaje (NLP)',
          content: 'Audita el texto de las notas clínicas del profesional y señala fragmentos con sesgo de confirmación, sesgo de género o anclaje prematuro antes de cerrar el diagnóstico.'
        },
        {
          heading: 'Gemelo Digital de Riesgo Iatrogénico',
          content: 'Simula qué sucedería si se aplica el tratamiento del diagnóstico incorrecto (ej. suministrar estimulantes a un TAG no detectado o sedar a un TDAH con benzodiacepinas).'
        }
      ]
    },
    {
      id: 'academy',
      icon: GraduationCap,
      title: '4. Capacitación AMIE & Simulador IA',
      subtitle: 'Pacientes Virtuales Fotorrealistas, Ciclo Vital y Scoring 0-100 pts',
      color: 'text-purple-400',
      badge: 'Entrenamiento Inmersivo',
      summary: 'Gimnasio clínico interactivo para psicólogos y psiquiatras con avatares dinámicos, evaluación por ciclo evolutivo y feedback pedagógico con acreditación.',
      details: [
        {
          heading: 'Avatares Fotorrealistas con Micro-expresiones Dinámicas',
          content: 'El paciente simulado reacciona emocionalmente en tiempo real (Neutral, Defensivo, Ansioso, Afligido, Aliviado) según la empatía y técnica de las preguntas formuladas.'
        },
        {
          heading: 'Casos por Ciclo Evolutivo',
          content: 'Clasificación pedagógica en 4 etapas: Infancia/Niñez (0-12 años), Adolescencia (13-17 años), Adultez (18-64 años) y Adultez Mayor (65+ años).'
        },
        {
          heading: 'Generador de Casos "Cisne Negro"',
          content: 'Crea mediante IA generativa casos clínicos atípicos de extrema rareza diagnóstica con trampas clínicas complejas para entrenamiento avanzado.'
        },
        {
          heading: 'Sistema de Scoring y Pantalla Victoria/Fallo',
          content: 'Evalúa 4 ejes (25 pts c/u): Anamnesis, Agudeza, Selección de Terapia/Fármaco y Adherencia al Protocolo. Calificaciones >=70 obtienen Victoria 🥳 con Certificado descargable; <70 muestran Fallo 😞 con lecturas de repaso.'
        }
      ]
    },
    {
      id: 'neuro_3d',
      icon: Cpu,
      title: '5. Neurotopografía 3D Dinámica',
      subtitle: 'Mapeador Neuro-Espectral FFT, 5 Bandas y Seguimiento Ocular',
      color: 'text-indigo-400',
      badge: 'Electrofisiología qEEG',
      summary: 'Visualizador holográfico continuo de la actividad cortical sobre el sistema internacional 10-20 con flujo en tiempo real.',
      details: [
        {
          heading: 'Consola de 5 Bandas Espectrales',
          content: 'Control de frecuencias: Delta (1-3 Hz), Theta (4-7 Hz), Alfa (8-12 Hz), Beta (13-20 Hz) y High-Beta (21-30 Hz) con mapa térmico en degradado continuo.'
        },
        {
          heading: 'Carga de Archivos Encefalográficos (.EDF / .BDF / .EEG)',
          content: 'Procesa archivos reales de electroencefalografía, calcula microvoltios (µV), ratios de potencia y Z-Scores respecto a la base normativa.'
        },
        {
          heading: 'Retícula Saccádica y Fijación Ocular por Cámara',
          content: 'Monitorea movimientos oculares rápidos, micro-tensión y parpadeo como biomarcadores de alerta, ansiedad o estupor motor.'
        },
        {
          heading: 'Canal Human-in-the-Loop',
          content: 'Permite a la psicóloga o psiquiatra ingresar observaciones clínicas cualitativas que recalculan instantáneamente el % de certeza del dictamen.'
        }
      ]
    },
    {
      id: 'referral',
      icon: ShieldAlert,
      title: '6. Referencia a Psiquiatría & Contención',
      subtitle: 'Hoja de Derivación Oficial, Protocolo de Rescate y Checklist 24/7',
      color: 'text-rose-400',
      badge: 'Interconsulta Médica',
      summary: 'Generación estandarizada de hojas de interconsulta urgente para la derivación segura de pacientes con riesgo agudo o necesidad de ajuste farmacológico.',
      details: [
        {
          heading: 'Checklist de Contención Activa',
          content: 'Verificación formal de: restricción de medios letales en hogar, acompañamiento continuo 24/7, suministro de línea telefónica de crisis y perfiles toxicológicos.'
        },
        {
          heading: 'Hoja Oficial de Derivación Imprimible',
          content: 'Documento estructurado con firma y número de colegiado del profesional remitente, listo para imprimir o copiar.'
        }
      ]
    },
    {
      id: 'saas',
      icon: KeyRound,
      title: '7. Licencias SaaS & Cloud Storage',
      subtitle: 'Aprovisionamiento de Accesos Médicos en Google Cloud Storage',
      color: 'text-amber-400',
      badge: 'Gestión Institucional',
      summary: 'Administración de credenciales para profesionales de salud colegiados vinculadas a Cloud Storage (gs://base-conocimiento-medica/licencias/<username>.json).',
      details: [
        {
          heading: 'Validación por No. de Colegiado Numérico',
          content: 'Garantiza que sólo facultativos certificados y registrados tengan acceso a las herramientas diagnósticas avanzadas y expedientes confidenciales.'
        },
        {
          heading: 'Almacenamiento Seguro HIPAA / RGPD',
          content: 'Genera llaves de acceso cifradas y sincronización institucional por niveles (Institucional, Clínica Privada, Investigación).'
        }
      ]
    }
  ];

  const currentMod = MODULES_HELP.find(m => m.id === activeSection) || MODULES_HELP[0];

  const filteredModules = MODULES_HELP.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.details.some(d => d.heading.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Guía Integral de Módulos Clínicos AMIE
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                  MANUAL TÉCNICO V3.7
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Explicación exhaustiva del funcionamiento, biomarcadores y protocolos de cada módulo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cerrar Guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Navigation Strip */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar función, biomarcador o módulo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Pase el cursor sobre cualquier botón de la app para ver micro-ayuda rápida.</span>
          </div>
        </div>

        {/* Body Content: Left Module Index + Right Detail Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Navigation Tabs */}
          <div className="md:col-span-4 bg-slate-950/90 border-r border-slate-800 p-3 overflow-y-auto space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 block mb-1">
              Módulos del Sistema
            </span>
            {filteredModules.map((mod) => {
              const IconComponent = mod.icon;
              const isSelected = activeSection === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveSection(mod.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500/50 text-white shadow-md'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? mod.color : 'text-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate text-slate-200">{mod.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{mod.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detail Content Panel */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-5 bg-slate-900">
            {/* Header of Active Module */}
            <div className="border-b border-slate-800 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <currentMod.icon className={`w-6 h-6 ${currentMod.color}`} />
                  <h3 className="text-base font-black text-white">{currentMod.title}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentMod.badge}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-300 leading-relaxed">
                {currentMod.summary}
              </p>
            </div>

            {/* Detailed Feature List */}
            <div className="space-y-3.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Componentes & Funcionamiento Técnico:
              </span>

              <div className="grid grid-cols-1 gap-3 text-xs">
                {currentMod.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 hover:border-slate-700 transition"
                  >
                    <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                      {item.heading}
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed pl-5">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety & Protocol Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-start gap-3 text-xs text-slate-300">
              <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Estándar de Seguridad Médica:</strong> Todos los análisis emitidos deben ser contrastados por el médico colegiado responsable utilizando las reglas diagnósticas de James Morrison y el juicio clínico profesional.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            AMIE Clinical Engine • Articulate Medical Intelligence Explorer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Entendido, Volver a la Consola
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalHelpModal;
