import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  ArrowRight, 
  Brain, 
  User, 
  Users, 
  Flame, 
  Lock, 
  Video, 
  Ear, 
  Glasses, 
  Activity, 
  RefreshCw,
  X,
  CheckCircle2
} from 'lucide-react';
import { PatientRecord } from '../types';
import { useVrTelemetryBridge } from '../hooks/useVrTelemetryBridge';

interface Props { 
  patient: PatientRecord; 
  onClose: () => void; 
}

export const VrDualControlTherapyModule: React.FC<Props> = ({ patient, onClose }) => {
  const p = patient as any;
  const patientId = p?.id || p?.patientId || 'PAC-8104';
  const patientDisplayName = p?.patientNameAnonymized || patientId;
  
  const [profileType, setProfileType] = useState<'INDIVIDUAL_FEMALE' | 'INDIVIDUAL_MALE' | 'COUPLE'>('INDIVIDUAL_FEMALE');
  const [currentPhase, setCurrentPhase] = useState<'assessment' | 'sis_release' | 'ses_activation'>('assessment');
  const [stimulusType, setStimulusType] = useState<'RELATIONAL_AUDIO' | 'PHYSICAL_VIDEO'>('RELATIONAL_AUDIO');
  const [audioEcosystem, setAudioEcosystem] = useState('WARM_HEARTH');
  const [promptText, setPromptText] = useState('Siento que me gustas mucho y quiero que seamos totalmente transparentes...');
  const [videoScenario, setVideoScenario] = useState('narcissism_covert');
  const [sisBrakeLevel, setSisBrakeLevel] = useState<number>(78);
  const [sesAcceleratorLevel, setSesAcceleratorLevel] = useState<number>(35);
  const [activeStressor, setActiveStressor] = useState<string>('Autocrítica corporal y vergüenza de la imagen (Body Shame)');
  const [transmitNotification, setTransmitNotification] = useState<string | null>(null);

  // Conexión WebSocket unificada al canal de control dual
  const { isConnected, isPeerConnected, transmit, syncSession } = useVrTelemetryBridge('sender', patientId, 'DUAL_CONTROL');

  const stressorsMap = {
    INDIVIDUAL_FEMALE: [
      'Autocrítica corporal y vergüenza de la imagen (Body Shame)', 
      'Carga mental doméstica y fatiga ejecutiva acumulada', 
      'Expectativa de rendimiento o complacencia hacia la pareja', 
      'Hipervigilancia por antecedentes de coerción o invasión'
    ],
    INDIVIDUAL_MALE: [
      'Ansiedad de ejecución y miedo anticipatorio a la falla (Espectador Ansioso)', 
      'Exigencia de rol y presión por iniciar o rendir', 
      'Agotamiento crónico por estrés laboral y financiero', 
      'Desconexión somática por bloqueo emocional'
    ],
    COUPLE: [
      'Tensión interpersonal no resuelta y resentimientos acumulados', 
      'Transaccionalidad del afecto (sentir que el cariño es solo un medio para el sexo)', 
      'Falta absoluta de privacidad o interrupciones constantes', 
      'Desincronización de los ciclos de descanso entre ambos'
    ]
  };

  const handleProfileTypeChange = (newType: 'INDIVIDUAL_FEMALE' | 'INDIVIDUAL_MALE' | 'COUPLE') => {
    setProfileType(newType);
    setActiveStressor(stressorsMap[newType][0]);
  };

  const handleLaunchPatientVisor = () => {
    if (typeof window !== 'undefined') {
      window.open(`/visor?paciente=${encodeURIComponent(patientId)}&modulo=DUAL_CONTROL`, '_blank');
    }
  };

  const handleTransmitToVR = () => {
    syncSession();

    let command: any = { 
      type: 'LOAD_MODULE', 
      moduleName: 'DUAL_CONTROL', 
      ecosystem: 'NEUTRAL_VOID', 
      isVideo: false,
      patientId,
      currentPhase,
      sisBrakeLevel,
      sesAcceleratorLevel,
      activeStressor
    };
    
    if (currentPhase === 'sis_release') {
      command = { 
        type: 'LOAD_MODULE', 
        moduleName: 'DUAL_CONTROL', 
        ecosystem: 'SAFE_PLACE_FOREST', 
        isVideo: false,
        patientId,
        currentPhase,
        action: 'TRIGGER_GROUNDING_PROTOCOL'
      };
    } else if (currentPhase === 'ses_activation') {
      if (stimulusType === 'RELATIONAL_AUDIO') {
        // Formato compatible con el visualizador inmersivo de IA (PicoVisorApp)
        command = { 
          type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA', 
          moduleName: 'DUAL_CONTROL', 
          ecosystem: audioEcosystem,
          environment: audioEcosystem,
          professionalPrompt: promptText,
          voiceStyle: 'Susurro Cálido',
          isVideo: false,
          stimulusType,
          patientId,
          currentPhase
        };
      } else {
        command = { 
          type: 'LOAD_MODULE', 
          moduleName: 'DUAL_CONTROL', 
          ecosystem: videoScenario, 
          environment: videoScenario,
          isVideo: true,
          stimulusType,
          patientId,
          currentPhase
        };
      }
    }
    
    transmit(command);
    setTransmitNotification('Comando y directriz transmitidos al visor.');
    setTimeout(() => setTransmitNotification(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans p-6 overflow-y-auto">
      
      {/* BARRA SUPERIOR Y ESTADO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-400" /> 
            AMIE • Motor Clínico y Laboratorio Relacional
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            Expediente Activo: <strong className="text-sky-400 font-mono">{patientDisplayName} ({patientId})</strong> | Enfoque: <span className="text-rose-300 font-semibold uppercase">{profileType}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Botón para lanzar visor VR */}
          <button 
            type="button"
            onClick={handleLaunchPatientVisor} 
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer active:scale-95"
          >
            <Glasses className="w-4 h-4" />
            <span>Lanzar Visor VR</span>
          </button>

          {/* Botón de sincronizar WebSocket */}
          <button 
            type="button"
            onClick={syncSession} 
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-900/50 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizar</span>
          </button>

          {/* Etiqueta de conexión */}
          <div className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 font-mono ${
            isPeerConnected 
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
              : isConnected 
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-400' 
              : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
          }`}>
            <Activity className="w-4 h-4" />
            <span>{isPeerConnected ? 'VR Enlazado' : isConnected ? 'Conectado / Buscando...' : 'Sin Señal VR'}</span>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg border border-slate-700 active:scale-95 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Volver al Selector</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL DE LA TERAPIA */}
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Selector de Perfil Relacional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            type="button"
            onClick={() => handleProfileTypeChange('INDIVIDUAL_FEMALE')} 
            className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
              profileType === 'INDIVIDUAL_FEMALE' 
                ? 'bg-pink-950/40 border-pink-500 text-pink-200 shadow-[0_0_15px_rgba(236,72,153,0.15)]' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <User className="w-5 h-5 text-pink-400 shrink-0" />
            <div>
              <span className="block font-bold text-xs text-white">Individual (Femenino)</span>
              <span className="text-[10px] text-slate-400">Foco: Body Shame, carga mental y SIS</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => handleProfileTypeChange('INDIVIDUAL_MALE')} 
            className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
              profileType === 'INDIVIDUAL_MALE' 
                ? 'bg-sky-950/40 border-sky-500 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <User className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="block font-bold text-xs text-white">Individual (Masculino)</span>
              <span className="text-[10px] text-slate-400">Foco: Ansiedad de ejecución y rol</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => handleProfileTypeChange('COUPLE')} 
            className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
              profileType === 'COUPLE' 
                ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Users className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="block font-bold text-xs text-white">Terapia de Pareja</span>
              <span className="text-[10px] text-slate-400">Foco: Sincronía y desescalada</span>
            </div>
          </button>
        </div>

        {/* Medidores Duales (SIS Freno vs SES Acelerador) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-400" /> Sistema de Inhibición (Freno - SIS)
              </span>
              <span className="text-xl font-mono font-bold text-rose-400">{sisBrakeLevel}%</span>
            </div>

            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-rose-900/50">
              <div 
                className="bg-rose-500 h-full transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" 
                style={{ width: `${sisBrakeLevel}%` }}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Estresor Principal Detectado:</span>
              <select 
                value={activeStressor} 
                onChange={(e) => setActiveStressor(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {stressorsMap[profileType].map((st, idx) => (
                  <option key={idx} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" /> Sistema de Excitación (Acelerador - SES)
              </span>
              <span className="text-xl font-mono font-bold text-emerald-400">{sesAcceleratorLevel}%</span>
            </div>

            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-emerald-900/50">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" 
                style={{ width: `${sesAcceleratorLevel}%` }}
              />
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Paradigma Clínico:</span>
              <strong className="text-cyan-300 font-medium">Acelerar con freno puesto = Cero Respuesta</strong>
            </div>
          </div>
        </div>

        {/* Secuencia Terapéutica Inmersiva */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" /> Secuencia Terapéutica Inmersiva (Visor WebXR)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Fase 1 */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => { setCurrentPhase('assessment'); setSisBrakeLevel(78); }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCurrentPhase('assessment');
                  setSisBrakeLevel(78);
                }
              }}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-2 text-left focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                currentPhase === 'assessment' 
                  ? 'bg-sky-600/20 border-sky-500 shadow-md shadow-sky-950/40' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="px-2 py-0.5 bg-sky-950 border border-sky-800 text-[10px] font-bold text-sky-400 rounded">
                Fase 1
              </span>
              <h3 className="font-bold text-xs text-white">Mapeo y Calibración Dual</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Evaluación psicométrica basal de inhibición vs. aceleración relacional.
              </p>
            </div>

            {/* Fase 2 */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => { setCurrentPhase('sis_release'); setSisBrakeLevel(25); }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCurrentPhase('sis_release');
                  setSisBrakeLevel(25);
                }
              }}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-2 text-left focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                currentPhase === 'sis_release' 
                  ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-950/40' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="px-2 py-0.5 bg-purple-950 border border-purple-800 text-[10px] font-bold text-purple-400 rounded">
                Fase 2
              </span>
              <h3 className="font-bold text-xs text-white">Descompresión (Apagar Freno)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Entorno virtual de cierre del estrés. <strong className="text-purple-300">(SAFE_PLACE_FOREST)</strong>
              </p>
            </div>

            {/* Fase 3 */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => { setCurrentPhase('ses_activation'); setSesAcceleratorLevel(85); }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCurrentPhase('ses_activation');
                  setSesAcceleratorLevel(85);
                }
              }}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-3 text-left focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                currentPhase === 'ses_activation' 
                  ? 'bg-emerald-600/20 border-emerald-500 shadow-md shadow-emerald-950/40' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-[10px] font-bold text-emerald-400 rounded">
                Fase 3: Exposición
              </span>
              <h3 className="font-bold text-xs text-white">Activación SES &amp; Sensibilización</h3>

              {currentPhase === 'ses_activation' && (
                <div className="space-y-4 mt-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                    <button 
                      type="button"
                      onClick={() => setStimulusType('RELATIONAL_AUDIO')} 
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                        stimulusType === 'RELATIONAL_AUDIO' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Ear className="w-3 h-3" />
                      <span>Opción 1: Generar IA</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setStimulusType('PHYSICAL_VIDEO')} 
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                        stimulusType === 'PHYSICAL_VIDEO' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video className="w-3 h-3" />
                      <span>Opción 2: Video MP4</span>
                    </button>
                  </div>

                  {stimulusType === 'RELATIONAL_AUDIO' && (
                    <div className="space-y-3 p-4 bg-slate-900 rounded-lg border border-indigo-900/50">
                      <div>
                        <label className="block text-[10px] text-indigo-300 font-bold uppercase mb-1">
                          Objetivo Clínico (Voz IA):
                        </label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-indigo-500 cursor-pointer" 
                          onChange={(e) => {
                            const target = e.target.value;
                            if (target === 'COUPLES') setPromptText("Siento que me gustas mucho y quiero que seamos totalmente transparentes...");
                            if (target === 'TLP') setPromptText("Se acabó. Ya no soporto esto, me voy y no me busques.");
                            if (target === 'SOCIAL') setPromptText("Todos te están mirando... y la verdad es que estás haciendo el ridículo.");
                            if (target === 'TDAH_RSD') setPromptText("Otra vez te olvidaste. Eres un desastre, nunca haces nada bien.");
                            if (target === 'TRAUMA') setPromptText("Vas a hacer lo que yo te diga, te guste o no. Aquí mando yo.");
                          }}
                        >
                          <option value="COUPLES">Terapia de Pareja (Intimidad)</option>
                          <option value="TLP">Cluster B / TLP (Abandono)</option>
                          <option value="SOCIAL">Ansiedad Social (Juicio)</option>
                          <option value="TDAH_RSD">TDAH (Rechazo Sensible)</option>
                          <option value="TRAUMA">Trauma / TEPT (Coerción)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-indigo-300 font-bold uppercase mb-1">
                          Entorno 360 de Catálogo:
                        </label>
                        <select 
                          value={audioEcosystem} 
                          onChange={(e) => setAudioEcosystem(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 cursor-pointer font-mono"
                        >
                          <option value="WARM_HEARTH">Hogar Cálido (Intimidad)</option>
                          <option value="CLINICAL_OFFICE">Oficina Clínica (Distancia)</option>
                          <option value="STERILE_ROOM">Habitación Estéril (Tensión)</option>
                          <option value="PROTECTIVE_TREEHOUSE">Casa del Árbol (Refugio)</option>
                          <option value="BIOLUMINESCENT_BEACH">Playa Bioluminiscente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-indigo-300 font-bold uppercase mb-1">
                          Directriz Terapéutica (Texto de la Voz):
                        </label>
                        <textarea 
                          value={promptText} 
                          onChange={(e) => setPromptText(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-sky-200 h-16 resize-none focus:border-indigo-500 font-mono" 
                        />
                      </div>
                    </div>
                  )}

                  {stimulusType === 'PHYSICAL_VIDEO' && (
                    <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-emerald-900/50">
                      <label className="block text-[10px] text-emerald-300 font-bold uppercase">
                        Seleccionar Video MP4 (/video):
                      </label>
                      <select 
                        value={videoScenario} 
                        onChange={(e) => setVideoScenario(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-200 cursor-pointer font-mono"
                      >
                        <option value="narcissism_covert">Narcisismo Encubierto (Manipulación)</option>
                        <option value="narcissism_overt">Narcisismo Manifiesto (Agresión / Grandiosidad)</option>
                        <option value="narcissism_collapse">Colapso Narcisista (Victimización / Ira)</option>
                      </select>
                      <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                        <Video className="w-3 h-3 text-emerald-400" />
                        <span>Transmite el video directo a la pantalla virtual del visor.</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Barra de Transmisión */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                Transmitiendo:{' '}
                <strong className="text-cyan-400 uppercase font-mono">
                  {currentPhase === 'ses_activation' 
                    ? (stimulusType === 'RELATIONAL_AUDIO' ? `Generar IA: ${audioEcosystem}` : `Video: ${videoScenario}`) 
                    : currentPhase}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {transmitNotification && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {transmitNotification}
                </span>
              )}

              <button 
                type="button"
                disabled={!isConnected} 
                onClick={handleTransmitToVR} 
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition cursor-pointer active:scale-95 ${
                  !isConnected 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white'
                }`}
              >
                <span>{isConnected ? 'Transmitir al Visor VR' : 'Conecte las gafas primero'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VrDualControlTherapyModule;
