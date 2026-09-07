import React, { useState, useEffect } from 'react';
import { Shield, Clock, Cpu, Key, Lock, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { getRegisteredUsers, updateDoctorPassword, DoctorUser } from '../services/userService';

export const AdminSaaSPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<DoctorUser | null>(null);

  // Reseteo de contraseña de usuario
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const users = getRegisteredUsers();
    const activeUsername = typeof window !== 'undefined'
      ? localStorage.getItem('amie_username') || 'harold01'
      : 'harold01';

    const active = users.find(u => u.username.toLowerCase() === activeUsername.toLowerCase());
    setCurrentUser(active || users[0] || null);
  };

  const handleResetPassword = (e: React.FormEvent) => {
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
      if (currentUser) {
        updateDoctorPassword(currentUser.username, newPassword);
        setPassSuccess('Contraseña de licencia actualizada correctamente.');
        setNewPassword('');
        setConfirmPassword('');
        refreshData();
      }
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

  const getDaysRemaining = (expiresAtStr?: string) => {
    if (!expiresAtStr) return 365;
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining(currentUser?.expiresAt);
  const aiPercentage = currentUser ? Math.round((currentUser.aiCredits / currentUser.aiCreditsLimit) * 100) : 0;

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
              Perfil de Licencia Médica & Control de Recursos
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo de vigencia temporal, bolsón de consultas de IA y reseteo de claves de acceso.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
          title="Cerrar Sesión Activa"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* VISTA PRINCIPAL DEL MÉDICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Métricas del Usuario */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{currentUser?.doctorName}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Usuario: {currentUser?.username} | Colegiado #{currentUser?.colegiadoNumber}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-lg">
                LICENCIA ACTIVA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tarjeta de Vigencia */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase">
                  <Clock className="w-4 h-4" />
                  <span>Vigencia Temporal</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {daysRemaining} <span className="text-xs font-normal text-slate-400">días restantes</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Clave: <code className="text-sky-300">{currentUser?.licenseKey}</code>
                </p>
              </div>

              {/* Tarjeta de Consumo de IA */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>Bolsón de IA</span>
                  </div>
                  <span className="font-mono text-white">{aiPercentage}%</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {currentUser?.aiCredits} <span className="text-xs font-normal text-slate-400">/ {currentUser?.aiCreditsLimit} disponibles</span>
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

        {/* Reseteo de Contraseña */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase">
            <Key className="w-4 h-4 text-sky-400" />
            <span>Resetear Contraseña de Acceso</span>
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
        </div>
      </div>
    </div>
  );
};
