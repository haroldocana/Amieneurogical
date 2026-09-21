import React, { useState } from 'react';
import { Stethoscope, Lock, User, AlertCircle, ArrowRight, RefreshCw, UserPlus, CheckCircle2, KeyRound } from 'lucide-react';

interface LoginModalProps {
  onSuccess: (authData: { doctorName: string; colegiadoNumber: number; token: string; username: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'superadmin'>('login');
  const API_BASE_URL = 'https://amie-clinical-analyzer-367911373284.us-central1.run.app/api';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [colegiado, setColegiado] = useState('');

  // Formulario Registro
  const [regUsername, setRegUsername] = useState('');
  const [regDoctorName, setRegDoctorName] = useState('');
  const [regColegiado, setRegColegiado] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Formulario SuperAdmin
  const [adminPin, setAdminPin] = useState('');

  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`No se pudo guardar ${key} en localStorage:`, e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericColegiado = parseInt(colegiado, 10);
    if (isNaN(numericColegiado) || !/^\d+$/.test(colegiado.trim())) {
      setError('El No. de Colegiado debe ser puramente numérico.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          colegiado: numericColegiado,
        })
      });

      const data = await response.json().catch(() => ({ error: 'Respuesta no válida del servidor.' }));

      if (!response.ok) {
        throw new Error(data.error || 'Credenciales rechazadas por el servidor.');
      }

      safeSetLocalStorage('amie_auth_token', data.token);
      safeSetLocalStorage('amie_doctor_name', data.doctorName);
      safeSetLocalStorage('amie_username', data.username);
      safeSetLocalStorage('amie_colegiado_number', String(data.colegiadoNumber));

      onSuccess({
        doctorName: data.doctorName || 'Dr. Usuario Registrado',
        colegiadoNumber: data.colegiadoNumber || numericColegiado,
        token: data.token || 'LOCAL_TOKEN',
        username: data.username || username.trim()
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo de autenticación en el servidor central.';
      setError(msg === 'Failed to fetch' ? 'Error de conexión con el servidor remoto.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegSuccessMsg(null);

    const numericColegiado = parseInt(regColegiado, 10);
    if (isNaN(numericColegiado)) {
      setError('El No. de Colegiado debe ser puramente numérico.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          doctorName: regDoctorName.trim(),
          email: regEmail.trim(),
          colegiadoNumber: numericColegiado,
          password: regPassword,
          accountType: 'INDIVIDUAL'
        })
      });

      const data = await response.json().catch(() => ({ error: 'Error al procesar el registro.' }));
      if (!response.ok) throw new Error(data.error || 'Error al emitir la licencia.');

      setRegSuccessMsg(`¡Médico registrado en la base de datos! Licencia individual activa.`);
      setUsername(data.username || regUsername.trim());
      setColegiado(String(numericColegiado));

      setTimeout(() => {
        setActiveTab('login');
        setRegSuccessMsg(null);
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear el usuario.';
      setError(msg === 'Failed to fetch' ? 'Error de conexión con la API de registro.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterKey: adminPin.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Clave Maestra de Administrador inválida.');
      }

      safeSetLocalStorage('amie_auth_token', data.token || 'SUPERADMIN_TOKEN');
      safeSetLocalStorage('amie_doctor_name', 'SuperAdmin AMIE');
      safeSetLocalStorage('amie_username', 'superadmin');
      safeSetLocalStorage('amie_colegiado_number', '0');

      onSuccess({
        doctorName: 'SuperAdmin AMIE',
        colegiadoNumber: 0,
        token: data.token || 'SUPERADMIN_TOKEN',
        username: 'superadmin'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en la verificación de administrador.';
      setError(msg === 'Failed to fetch' ? 'Error de conexión con el servidor de autenticación.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AMIE Clinical Engine • Autenticación
            </h2>
            <p className="text-xs text-slate-400">
              Gestión de Accesos & Licencias Médicas
            </p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold mb-4">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'login' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'register' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Registro
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('superadmin'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${activeTab === 'superadmin' ? 'bg-amber-600 text-white' : 'text-amber-400/80 hover:text-amber-300'}`}
          >
            <KeyRound className="w-3 h-3" />
            <span>SuperAdmin</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl mb-4 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {regSuccessMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl mb-4 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{regSuccessMsg}</span>
          </div>
        )}

        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">No. de Colegiado Médico *</label>
              <input
                type="text"
                required
                value={colegiado}
                onChange={(e) => setColegiado(e.target.value)}
                placeholder="749210"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Usuario ID / Email *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ID de usuario"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Contraseña de Licencia *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 hover:from-sky-400 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando en Base de Datos...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Motor Clínico</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Usuario ID *</label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="ej. dr_morales"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Correo Electrónico Médico *</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="doctor@clinica.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Nombre Completo Médico *</label>
              <input
                type="text"
                required
                value={regDoctorName}
                onChange={(e) => setRegDoctorName(e.target.value)}
                placeholder="Dr. Nombre Apellidos"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">No. Colegiado *</label>
                <input
                  type="text"
                  required
                  value={regColegiado}
                  onChange={(e) => setRegColegiado(e.target.value)}
                  placeholder="749210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>Registrar Médico e Iniciar Licencia</span>
            </button>
          </form>
        )}

        {activeTab === 'superadmin' && (
          <form onSubmit={handleAdminAuth} className="space-y-3.5 text-xs">
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200">
              <span className="font-bold block mb-0.5">Validación en Servidor</span>
              <span>Ingresa la Clave Maestra de Administrador para gestión de licencias.</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Clave Maestra *</label>
              <input
                type="password"
                required
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Clave de Administrador"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>Verificar Administrador</span>
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500 font-mono">
          API Endpoint: amie-clinical-analyzer-367911373284.us-central1.run.app
        </div>
      </div>
    </div>
  );
};
