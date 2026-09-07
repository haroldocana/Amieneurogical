import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, Clock, Cpu, Key, Lock, CheckCircle2, AlertCircle, UserPlus, Database, LogOut } from 'lucide-react';
import { getRegisteredUsers, updateDoctorPassword, registerDoctorUser, updateDoctorAiCredits, DoctorUser } from '../services/userService';

export const AdminSaaSPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<DoctorUser | null>(null);
  const [showAdminEmitter, setShowAdminEmitter] = useState(false);

  // Reseteo de contraseña de usuario
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Estado para emisión y gestión (SuperAdmin)
  const [allUsers, setAllUsers] = useState<DoctorUser[]>([]);
  const [regDoctorName, setRegDoctorName] = useState('');
  const [regColegiado, setRegColegiado] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regAiLimit, setRegAiLimit] = useState<number>(100);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const users = getRegisteredUsers();
    setAllUsers(users);

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

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const numColegiado = parseInt(regColegiado, 10);
    if (isNaN(numColegiado)) {
      setRegError('El No. de Colegiado debe ser puramente numérico.');
      return;
    }

    try {
      const newUser = registerDoctorUser(
        {
          username: regUsername.trim(),
          doctorName: regDoctorName.trim(),
          colegiadoNumber: numColegiado,
        },
        regAiLimit
      );

      setRegSuccess(`Licencia emitida exitosamente: ${newUser.licenseKey}`);
      setRegDoctorName('');
      setRegColegiado('');
      setRegUsername('');
      refreshData();
    } catch (err: any) {
      setRegError(err.message || 'Error al emitir la licencia.');
    }
  };

  const handleUpdateQuota = (targetUsername: string, currentLimit: number) => {
    const newQuotaStr = prompt(`Ingresa la nueva cuota de IA para ${targetUsername}:`, String(currentLimit));
    if (newQuotaStr !== null) {
      const newQuota = parseInt(newQuotaStr, 10);
      if (!isNaN(newQuota) && newQuota >= 0) {
        updateDoctorAiCredits(targetUsername, newQuota);
        refreshData();
      }
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amie_auth_token');
      localStorage.removeItem('amie_doctor_name');
      localStorage.removeItem('amie_username');
      localStorage.removeItem('amie_doctor_username');
      localStorage.removeItem('amie_colegiado_number');
      localStorage.removeItem('amie_ai_credits');
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdminEmitter(!showAdminEmitter)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{showAdminEmitter ? 'Ocultar Emisión' : 'Modo SuperAdmin'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            title="Cerrar Sesión Activa"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
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

      {/* MÓDULO ADMINISTRATIVO EXTERNO (EMISIÓN Y CONTROL SUPERADMIN) */}
      {showAdminEmitter && (
        <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-2xl space-y-6 shadow-2xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
            <UserPlus className="w-4 h-4" />
            <span>Módulo SuperAdmin: Emisión y Control de Licencias Médicas</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleCreateLicense} className="lg:col-span-5 space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              {regError && <div className="p-2 bg-rose-950 text-rose-200 rounded">{regError}</div>}
              {regSuccess && <div className="p-2 bg-emerald-950 text-emerald-200 rounded">{regSuccess}</div>}

              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo Médico *</label>
                <input
                  type="text"
                  required
                  value={regDoctorName}
                  onChange={(e) => setRegDoctorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
                  placeholder="Dr. Nombre Apellidos"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">No. Colegiado *</label>
                  <input
                    type="text"
                    required
                    value={regColegiado}
                    onChange={(e) => setRegColegiado(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                    placeholder="749210"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cuota de IA Inicial</label>
                  <input
                    type="number"
                    required
                    value={regAiLimit}
                    onChange={(e) => setRegAiLimit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Usuario ID *</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
                  placeholder="dr_usuario"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition"
              >
                Emitir Nueva Licencia
              </button>
            </form>

            <div className="lg:col-span-7 space-y-2 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Licencias Emitidas ({allUsers.length})</span>
                </h4>
              </div>

              {allUsers.map((u) => (
                <div key={u.username} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{u.doctorName}</span>
                    <span className="text-slate-400 text-[11px] font-mono">User: {u.username} | Col: #{u.colegiadoNumber}</span>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <button
                      onClick={() => handleUpdateQuota(u.username, u.aiCreditsLimit)}
                      className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition font-bold"
                    >
                      {u.aiCredits}/{u.aiCreditsLimit} IA
                    </button>
                    <span className="text-slate-500 block text-[10px] mt-1">{u.licenseKey}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
