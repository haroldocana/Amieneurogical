import React, { useState, useEffect } from 'react';
import { Cpu, PlusCircle, CheckCircle2, AlertCircle, X, Calendar } from 'lucide-react';

interface DoctorUserSummary {
  id: string;
  username: string;
  doctorName: string;
  colegiadoNumber: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

interface AiQuotaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiQuotaAdminModal: React.FC<AiQuotaAdminModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<DoctorUserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [addTokens, setAddTokens] = useState<number>(100);
  const [extensionYears, setExtensionYears] = useState<number>(1); // 1, 2 o 3 Años
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsersList();
    }
  }, [isOpen]);

  const fetchUsersList = async () => {
    try {
      const token = localStorage.getItem('amie_auth_token');
      const res = await fetch('https://amie-clinical-analyzer-367911373284.us-central1.run.app/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (data.length > 0) setSelectedUserId(data[0].id || data[0].username);
      }
    } catch (e) {
      console.warn('Fallo al cargar lista de usuarios del backend.');
    }
  };

  if (!isOpen) return null;

  const handleAssignQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedUserId) {
      setErrorMsg('Selecciona un médico especialista.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('amie_auth_token');
      const res = await fetch('https://amie-clinical-analyzer-367911373284.us-central1.run.app/api/admin/refill-license', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId: selectedUserId,
          isOrganization: false,
          addTokens: Number(addTokens),
          extensionYears: Number(extensionYears)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar cuota.');

      setSuccessMsg(`Bolsón e extensión de licencia por ${extensionYears} año(s) aplicados exitosamente.`);
      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Fallo de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Panel SuperAdmin: Asignación & Licencias</h3>
            <p className="text-xs text-slate-400">Recarga de Bolsón de IA y Extensión Multianual</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleAssignQuota} className="space-y-4 text-xs mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Seleccionar Médico Especialista</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              {users.map(u => (
                <option key={u.id || u.username} value={u.id || u.username}>
                  {u.doctorName} ({u.username}) - Uso: {u.aiCreditsUsed}/{u.aiCreditsLimit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Agregar Tokens IA</label>
              <input
                type="number"
                min="0"
                value={addTokens}
                onChange={(e) => setAddTokens(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                placeholder="Ej. 100, 500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400"/> Extensión Licencia
              </label>
              <select
                value={extensionYears}
                onChange={(e) => setExtensionYears(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-bold"
              >
                <option value={0}>Sin extensión de fecha</option>
                <option value={1}>+1 Año Adicional</option>
                <option value={2}>+2 Años Adicionales</option>
                <option value={3}>+3 Años Adicionales</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Aplicando en Base de Datos...' : 'Aplicar Créditos & Extensión'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
