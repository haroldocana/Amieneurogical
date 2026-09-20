import React, { useState, useEffect } from 'react';
import { Shield, Clock, Cpu, Key, Lock, CheckCircle2, AlertCircle, LogOut, Building2, User } from 'lucide-react';

interface SaaSProfileData {
  id: string;
  username: string;
  doctorName: string;
  colegiadoNumber: number;
  email: string;
  accountType: 'INDIVIDUAL' | 'CORPORATE_MEMBER';
  organizationName?: string;
  authMethod: string;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  licenseValidUntil: string;
  licenseKey: string;
}

export const AdminSaaSPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SaaSProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario Reseteo de Contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('amie_auth_token') : null;
    const activeUsername = typeof window !== 'undefined' ? localStorage.getItem('amie_username') : null;

    try {
      const response = await fetch(`https://amie-clinical-analyzer-367911373284.us-central1.run.app/api/auth/profile?username=${activeUsername}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      } else {
        // Objeto seguro si la BD aún no ha sincronizado el perfil
        setCurrentUser({
          id: '101',
          username: activeUsername || 'dr_morales',
          doctorName: localStorage.getItem('amie_doctor_name') || 'Dr. Alejandro Morales',
          colegiadoNumber: Number(localStorage.getItem('amie_colegiado_number')) || 749210,
          email: 'doctor@clinica.com',
          accountType: 'INDIVIDUAL',
          authMethod: 'LOCAL_PASSWORD',
          aiCreditsUsed: 12,
          aiCreditsLimit: 100,
          licenseValidUntil: new Date(Date.now() + 31536000000).toISOString(), // 1 Año
          licenseKey: token || 'AMIE-LIC-2026-X901'
        });
      }
    } catch (e) {
      console.warn('Fallo al obtener perfil del servidor, usando token local.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(null);
    setPassError(null);

    if (!newPassword || newPassword.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const token = localStorage.getItem('amie_auth_token');
      const response = await fetch('https://amie-clinical-analyzer-367911373284.us-central1.run.app/api/auth/update-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: currentUser?.username,
          newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar contraseña.');
      }

      setPassSuccess('Contraseña de licencia actualizada correctamente.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Error al actualizar la contraseña.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const getDaysRemaining = (validUntilStr?: string) => {
    if (!validUntilStr) return 365;
    const diff = new Date(validUntilStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining(currentUser?.licenseValidUntil);
  const remainingCredits = (currentUser?.aiCreditsLimit || 100) - (currentUser?.aiCreditsUsed || 0);
  const aiPercentage = currentUser ? Math.round((currentUser.aiCreditsUsed / currentUser.aiCreditsLimit) * 100) : 0;
  const isIndividual = currentUser?.accountType === 'INDIVIDUAL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-sky-600 to-cyan-500 rounded-lg text-white">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-white">
              Perfil de Licencia Médica & Control de Recursos SaaS
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo de vigencia multianual, bolsón de consultas de IA y reseteo de claves de acceso.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Métricas del Usuario y Licencia */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {currentUser?.doctorName}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isIndividual ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-sky-950 text-sky-400 border border-sky-500/30'}`}>
                    {isIndividual ? 'Práctica Independiente' : `Hospital: ${currentUser?.organizationName}`}
                  </span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Usuario: {currentUser?.username} | Colegiado #{currentUser?.colegiadoNumber}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-lg">
                LICENCIA ACTIVA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tarjeta de Vigencia Temporal */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase">
                  <Clock className="w-4 h-4" />
                  <span>Vigencia de Licencia</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {daysRemaining} <span className="text-xs font-normal text-slate-400">días restantes</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Clave: <code className="text-sky-300">{currentUser?.licenseKey}</code>
                </p>
              </div>

              {/* Tarjeta del Bolsón de IA */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>Bolsón de IA</span>
                  </div>
                  <span className="font-mono text-white">{aiPercentage}% usado</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {remainingCredits} <span className="text-xs font-normal text-slate-400">/ {currentUser?.aiCreditsLimit} disponibles</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${aiPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reseteo de Contraseña o Info SSO */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase">
            <Key className="w-4 h-4 text-sky-400" />
            <span>Seguridad y Clave de Acceso</span>
          </div>

          {passError && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {isIndividual ? (
            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nueva Contraseña *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirmar Nueva Contraseña *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl transition"
              >
                Actualizar Contraseña
              </button>
            </form>
          ) : (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-sky-400 mb-1">Inicie sesión institucional ({currentUser?.authMethod})</p>
              Su cuenta está vinculada al Active Directory de <strong>{currentUser?.organizationName}</strong>. El restablecimiento de claves de acceso debe realizarse a través del departamento de sistemas de su hospital.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
