import React, { useState, useEffect } from 'react';
import { KeyRound, UserPlus, Database, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { getRegisteredUsers, registerDoctorUser, updateDoctorAiCredits, DoctorUser } from '../services/userService';

export const AdminSaaSPanel: React.FC = () => {
  const [users, setUsers] = useState<DoctorUser[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [colegiadoNumber, setColegiadoNumber] = useState('');
  const [username, setUsername] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');
  const [specialty, setSpecialty] = useState('Psiquiatría General');
  const [aiLimit, setAiLimit] = useState<number>(100);
  const [createdSuccessMsg, setCreatedSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    const list = getRegisteredUsers();
    setUsers(list);
  };

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setCreatedSuccessMsg(null);

    const numericColegiado = parseInt(colegiadoNumber, 10);
    if (!colegiadoNumber || isNaN(numericColegiado) || !/^\d+$/.test(colegiadoNumber.trim())) {
      setValidationError('El Número de Colegiado debe ser puramente numérico (ej. 749210 o 8923).');
      return;
    }

    if (!doctorName.trim() || !username.trim()) {
      setValidationError('Por favor complete todos los campos requeridos del formulario.');
      return;
    }

    try {
      const newUser = registerDoctorUser(
        {
          username: username.trim(),
          doctorName: doctorName.trim(),
          colegiadoNumber: numericColegiado,
        },
        aiLimit
      );

      setCreatedSuccessMsg(`Licencia #${newUser.licenseKey} emitida para ${newUser.doctorName} con ${newUser.aiCreditsLimit} consultas de IA.`);
      refreshUsers();

      // Reset Form
      setDoctorName('');
      setColegiadoNumber('');
      setUsername('');
      setHospitalClinic('');
    } catch (err: any) {
      setValidationError(err.message || 'Error al emitir la licencia médica.');
    }
  };

  const handleUpdateQuota = (targetUsername: string, currentLimit: number) => {
    const newQuotaStr = prompt(`Ingresa la nueva cuota de consultas de IA para ${targetUsername}:`, String(currentLimit));
    if (newQuotaStr !== null) {
      const newQuota = parseInt(newQuotaStr, 10);
      if (!isNaN(newQuota) && newQuota >= 0) {
        updateDoctorAiCredits(targetUsername, newQuota);
        refreshUsers();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-sky-600 to-cyan-500 rounded-lg text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-white">
              Panel de Administración SaaS & Licenciamiento Médico
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aprovisionamiento de accesos clínicos y asignación de cuotas de IA (Vertex AI)
          </p>
        </div>
      </div>

      {/* Grid: Form & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-4">
            <UserPlus className="w-4 h-4" />
            <span>Emitir Nueva Licencia Profesional</span>
          </div>

          {validationError && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {createdSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{createdSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateLicense} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Nombre Completo del Médico *</label>
              <input
                type="text"
                required
                placeholder="Dr(a). Nombre y Apellidos"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">No. de Colegiado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 749210"
                  value={colegiadoNumber}
                  onChange={(e) => setColegiadoNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cuota de Consultas IA *</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="5000"
                  value={aiLimit}
                  onChange={(e) => setAiLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Usuario ID de Acceso *</label>
              <input
                type="text"
                required
                placeholder="ej. dr_morales"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Especialidad Médica</label>
              <input
                type="text"
                placeholder="Psiquiatría / Neurología"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Hospital / Institución de Afiliación</label>
              <input
                type="text"
                placeholder="Hospital General / Centro Médico"
                value={hospitalClinic}
                onChange={(e) => setHospitalClinic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition"
            >
              Generar y Persistir Licencia
            </button>
          </form>
        </div>

        {/* Right Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Licencias Médicas Activas ({users.length})
              </h2>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[480px]">
            {users.map((u) => (
              <div
                key={u.username}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-sm text-slate-100">{u.doctorName}</span>
                    <div className="text-[11px] text-slate-400">Usuario: {u.username}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      Colegiado #{u.colegiadoNumber}
                    </span>
                    <button
                      onClick={() => handleUpdateQuota(u.username, u.aiCreditsLimit)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition flex items-center gap-1"
                      title="Clic para ajustar límite de IA"
                    >
                      <Cpu className="w-3 h-3" />
                      <span>{u.aiCredits} / {u.aiCreditsLimit} IA</span>
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] font-mono text-slate-400 truncate flex items-center justify-between">
                  <span className="truncate">Licencia: {u.licenseKey}</span>
                  <span className="text-emerald-400 text-[10px] shrink-0 ml-2 font-bold">{u.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
