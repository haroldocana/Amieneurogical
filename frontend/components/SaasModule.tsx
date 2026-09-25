import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Cpu, Key, Lock, PlusCircle, CheckCircle2, 
  AlertCircle, RefreshCw, History, CreditCard, Building, UserCheck
} from 'lucide-react';

interface SaasProfileData {
  name: string;
  collegiateNumber: string;
  hospitalName: string;
  licenseDaysRemaining: number;
  aiTokensTotal: number;
  aiTokensUsed: number;
  aiTokensAvailable: number;
  rechargeHistory: Array<{
    tokensAdded: number;
    packageType: string;
    date: string;
    referenceId: string;
  }>;
}

export const SaasModule: React.FC = () => {
  const [profile, setProfile] = useState<SaasProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<{ amount: number; label: string; price: string }>({
    amount: 100,
    label: 'Bolsón Clínico Pro (+100 Consultas)',
    price: '$49 USD'
  });
  const [notification, setNotification] = useState<string | null>(null);

  // Obtener perfil actualizado desde MongoDB
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/saas/profile', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
      }
    } catch (err) {
      console.error('Error cargando perfil SaaS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Procesar recarga en MongoDB
  const handleRechargeTokens = async () => {
    try {
      const res = await fetch('/api/saas/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          amount: selectedPackage.amount,
          packageType: selectedPackage.label
        })
      });

      const json = await res.json();
      if (json.success) {
        setNotification(json.message);
        setIsRechargeModalOpen(false);
        fetchProfile(); // Refrescar los datos persistidos
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error('Error al recargar tokens:', err);
    }
  };

  const tokensTotal = profile?.aiTokensTotal || 100;
  const tokensUsed = profile?.aiTokensUsed || 0;
  const tokensAvailable = profile?.aiTokensAvailable ?? (tokensTotal - tokensUsed);
  const usagePercentage = Math.min(100, Math.round((tokensUsed / (tokensTotal || 1)) * 100));

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. ENCABEZA PRINCIPAL Y PERFIL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-600/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Perfil de Licencia Médica & Control de Recursos SaaS
              </h2>
              <p className="text-xs text-slate-400">
                Monitoreo de vigencia multianual, bolsón de consultas de IA y registro de licencias en MongoDB.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRechargeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Recargar Bolsón de IA</span>
          </button>
        </div>

        {/* DATOS DE IDENTIFICACIÓN INSTITUCIONAL */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              Hospital: {profile?.hospitalName || 'Centro Médico Especializado'}
            </span>
            <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              LICENCIA ACTIVA
            </span>
          </div>

          <div className="text-xs font-mono text-slate-300">
            Usuario: <strong className="text-white">{profile?.name || 'Dr. Morrison'}</strong> | Colegiado #: <strong className="text-cyan-400">{profile?.collegiateNumber || '2000'}</strong>
          </div>
        </div>

        {notification && (
          <div className="p-3 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* 2. TARJETAS DE VIGENCIA Y BOLSÓN DE IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TARJETA 1: VIGENCIA DE LICENCIA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4" /> Vigencia de Licencia
          </span>
          <div className="text-4xl font-black text-white font-mono">
            {profile?.licenseDaysRemaining || 365} <span className="text-xs text-slate-400 font-normal">días restantes</span>
          </div>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            Suscripción Institucional activa conectada al directorio general AMIE.
          </p>
        </div>

        {/* TARJETA 2: BOLSÓN DE CONSULTAS IA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Bolsón de IA (Gemini 3.8 Flash)
            </span>
            <span className="text-xs font-mono font-bold text-purple-300">
              {usagePercentage}% USADO
            </span>
          </div>

          <div className="text-4xl font-black text-white font-mono">
            {tokensAvailable} <span className="text-xs text-slate-400 font-normal">/ {tokensTotal} disponibles</span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500" 
              style={{ width: `${usagePercentage}%` }} 
            />
          </div>

          <p className="text-xs text-slate-400 pt-1">
            Consultas consumidas: <strong className="text-white">{tokensUsed}</strong> de <strong className="text-white">{tokensTotal}</strong> asignadas.
          </p>
        </div>
      </div>

      {/* 3. SEGURIDAD Y RECONEXIÓN ACTIVE DIRECTORY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" /> Seguridad y Clave de Acceso
        </h3>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs leading-relaxed space-y-2">
          <p className="text-cyan-300 font-bold">
            Inicio de Sesión Institucional ({profile?.hospitalName || 'Centro Médico'})
          </p>
          <p className="text-slate-400">
            Su cuenta está vinculada al Active Directory de <strong className="text-slate-200">{profile?.hospitalName || 'su institución'}</strong>. El restablecimiento de claves de acceso o asignación de licencias grupales debe realizarse a través del departamento de sistemas de su hospital.
          </p>
        </div>
      </div>

      {/* 4. MODAL PARA RECARGAR CRÉDITOS DE IA */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" /> Recargar Bolsón de IA
              </h3>
              <button 
                onClick={() => setIsRechargeModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Seleccione el paquete de consultas clínicas con Gemini 3.8 Flash para acreditarlo a su cuenta en MongoDB:
            </p>

            <div className="space-y-2">
              {[
                { amount: 50, label: 'Paquete Básico (+50 Consultas)', price: '$25 USD' },
                { amount: 100, label: 'Bolsón Clínico Pro (+100 Consultas)', price: '$49 USD' },
                { amount: 500, label: 'Licencia Hospitalaria (+500 Consultas)', price: '$199 USD' }
              ].map((pkg) => (
                <div
                  key={pkg.amount}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedPackage.amount === pkg.amount
                      ? 'bg-purple-950/60 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">{pkg.label}</div>
                    <div className="text-[10px] text-purple-300 mt-0.5">Acredita +{pkg.amount} fichas inmediatamente</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    {pkg.price}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechargeTokens}
                className="w-1/2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition"
              >
                Confirmar Recarga
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
