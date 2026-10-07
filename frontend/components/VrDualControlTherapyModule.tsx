import React, { useState } from 'react';
import { HeartHandshake, ShieldAlert, Activity, Sparkles, ArrowRight, Brain, User, Users, Flame, Lock } from 'lucide-react';
import { PatientRecord } from '../types';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const VrDualControlTherapyModule: React.FC<Props> = ({ patient, onClose }) => {
  const [profileType, setProfileType] = useState<'INDIVIDUAL_FEMALE' | 'INDIVIDUAL_MALE' | 'COUPLE'>('INDIVIDUAL_FEMALE');
  const [currentPhase, setCurrentPhase] = useState<'assessment' | 'sis_release' | 'ses_activation'>('assessment');
  
  // Métricas del Modelo de Control Dual (Acelerador vs Freno)
  const [sisBrakeLevel, setSisBrakeLevel] = useState<number>(78); // Sistema de Inhibición (Freno)
  const [sesAcceleratorLevel, setSesAcceleratorLevel] = useState<number>(35); // Sistema de Excitación (Acelerador)
  const [activeStressor, setActiveStressor] = useState<string>('Carga mental y fatiga ejecutiva');

  // Banco de estresores específicos según el perfil clínico
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans p-6 overflow-y-auto">
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-400" />
            AMIE • Motor Clínico de Control Dual (Bancroft & Janssen / Nagoski)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Expediente Activo: <strong className="text-sky-400">{patient?.id || 'PAC-8104'}</strong> | Enfoque: <span className="text-rose-300 font-semibold uppercase">{profileType}</span>
          </p>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg"
        >
          Cerrar Módulo
        </button>
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Selector de Perfil Clínico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={() => setProfileType('INDIVIDUAL_FEMALE')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${profileType === 'INDIVIDUAL_FEMALE' ? 'bg-pink-950/40 border-pink-500 text-pink-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            <User className="w-5 h-5 text-pink-400" />
            <div className="text-left">
              <span className="block font-bold text-xs text-white">Individual (Femenino)</span>
              <span className="text-[10px]">Foco: Body Shame, carga mental y SIS</span>
            </div>
          </button>

          <button 
            onClick={() => setProfileType('INDIVIDUAL_MALE')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${profileType === 'INDIVIDUAL_MALE' ? 'bg-sky-950/40 border-sky-500 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            <User className="w-5 h-5 text-sky-400" />
            <div className="text-left">
              <span className="block font-bold text-xs text-white">Individual (Masculino)</span>
              <span className="text-[10px]">Foco: Ansiedad de ejecución y rol</span>
            </div>
          </button>

          <button 
            onClick={() => setProfileType('COUPLE')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${profileType === 'COUPLE' ? 'bg-purple-950/40 border-purple-500 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            <Users className="w-5 h-5 text-purple-400" />
            <div className="text-left">
              <span className="block font-bold text-xs text-white">Terapia de Pareja</span>
              <span className="text-[10px]">Foco: Sincronía y desescalada</span>
            </div>
          </button>
        </div>

        {/* Panel de Biofeedback: El Freno vs El Acelerador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* El Freno (SIS) */}
          <div className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-400" /> Sistema de Inhibición (El Freno - SIS)
              </span>
              <span className="text-xl font-mono font-bold text-rose-400">{sisBrakeLevel}%</span>
            </div>
            
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-rose-900/50">
              <div className="bg-rose-500 h-full transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" style={{ width: `${sisBrakeLevel}%` }}></div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400">Estresor Principal Detectado:</span>
              <select 
                value={activeStressor}
                onChange={(e) => setActiveStressor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                {stressorsMap[profileType].map((st, idx) => (
                  <option key={idx} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <strong className="text-rose-300">Diagnóstico Neurobiológico:</strong> Con el freno a este nivel, cualquier estímulo de aceleración generará resistencia o rechazo defensivo. Es imperativo ejecutar la Fase 1.
            </p>
          </div>

          {/* El Acelerador (SES) */}
          <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" /> Sistema de Excitación (El Acelerador - SES)
              </span>
              <span className="text-xl font-mono font-bold text-emerald-400">{sesAcceleratorLevel}%</span>
            </div>

            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-emerald-900/50">
              <div className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" style={{ width: `${sesAcceleratorLevel}%` }}></div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-400 block">Sensibilidad Sensorial y Emocional:</span>
              <p className="text-[11px] text-slate-300">
                Latente pero bloqueada por la sobreactivación del sistema simpático. Requiere desactivación previa del cortisol.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Paridigma Clínico:</span>
              <strong className="text-cyan-300">Acelerar con freno puesto = Cero Respuesta</strong>
            </div>
          </div>

        </div>

        {/* Fases del Protocolo Terapéutico VR */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" /> Secuencia Terapéutica Inmersiva en el Visor Pico 3
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Fase 1 */}
            <div 
              onClick={() => { setCurrentPhase('assessment'); setSisBrakeLevel(78); }}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${currentPhase === 'assessment' ? 'bg-sky-600/20 border-sky-500' : 'bg-slate-950 border-slate-800'}`}
            >
              <span className="px-2 py-0.5 bg-sky-950 border border-sky-800 text-[10px] font-bold text-sky-400 rounded">Fase 1</span>
              <h3 className="font-bold text-xs text-white">Mapeo y Calibración Dual</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Evaluación cruzada de estresores cotidianos y medición de la línea base de conductancia cutánea.
              </p>
            </div>

            {/* Fase 2 */}
            <div 
              onClick={() => { setCurrentPhase('sis_release'); setSisBrakeLevel(25); }}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${currentPhase === 'sis_release' ? 'bg-purple-600/20 border-purple-500' : 'bg-slate-950 border-slate-800'}`}
            >
              <span className="px-2 py-0.5 bg-purple-950 border border-purple-800 text-[10px] font-bold text-purple-400 rounded">Fase 2</span>
              <h3 className="font-bold text-xs text-white">Descompresión (Apagar el Freno)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Entorno virtual de cierre del ciclo del estrés, descarga de carga mental y regulación vagotónica.
              </p>
            </div>

            {/* Fase 3 */}
            <div 
              onClick={() => { setCurrentPhase('ses_activation'); setSesAcceleratorLevel(85); }}
              className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${currentPhase === 'ses_activation' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-slate-950 border-slate-800'}`}
            >
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-[10px] font-bold text-emerald-400 rounded">Fase 3</span>
              <h3 className="font-bold text-xs text-white">Afecto Sin Demanda (SES)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Estímulos seguros y libres de presión para reeducar el sistema nervioso en la respuesta placentera.
              </p>
            </div>

          </div>

          {/* Barra de Transmisión */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">Fase Activa en Protocolo: <strong className="text-cyan-400 uppercase">{currentPhase}</strong></span>
            </div>
            
            <button 
              onClick={() => alert(`Transmitiendo protocolo de Control Dual (${profileType}) al visor Pico 3...`)}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg transition"
            >
              <span>Transmitir al Visor VR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
