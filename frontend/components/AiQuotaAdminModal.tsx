import React, { useState, useEffect } from 'react';
import { Cpu, Key, Shield, UserCheck, PlusCircle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { getRegisteredUsers, updateDoctorAiCredits, DoctorUser } from '../services/userService';

interface AiQuotaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiQuotaAdminModal: React.FC<AiQuotaAdminModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<DoctorUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newCreditLimit, setNewCreditLimit] = useState<number>(100);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const list = getRegisteredUsers();
      setUsers(list);
      if (list.length > 0) setSelectedUser(list[0].username);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssignQuota = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedUser) {
      setErrorMsg('Selecciona un médico.');
      return;
    }

    try {
      const updated = updateDoctorAiCredits(selectedUser, Number(newCreditLimit));
      setSuccessMsg(`Cuota asignada con éxito a ${updated.doctorName}: ${updated.aiCredits} consultas de IA disponibles.`);
      setUsers(getRegisteredUsers());
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al asignar cuota de IA.');
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
            <h3 className="text-base font-bold text-white">Panel Administrador: Control de Consultas IA</h3>
            <p className="text-xs text-slate-400">Asignación de créditos de uso de Vertex AI por Especialista</p>
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

        {/* Formulario de asignación */}
        <form onSubmit={handleAssignQuota} className="space-y-4 text-xs mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Seleccionar Médico Especialista</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              {users.map(u => (
                <option key={u.username} value={u.username}>
                  {u.doctorName} ({u.username}) - Disponibles: {u.aiCredits}/{u.aiCreditsLimit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Asignar Límite de Consultas de IA</label>
            <input
              type="number"
              min="0"
              max="10000"
              value={newCreditLimit}
              onChange={(e) => setNewCreditLimit(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
              placeholder="Ej. 50, 100, 500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Asignar Créditos de IA</span>
          </button>
        </form>

        {/* Tabla resumen de médicos y su uso de IA */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Estado de Licencias y Cuotas</h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {users.map(u => (
              <div key={u.username} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-white block">{u.doctorName}</span>
                  <span className="text-[11px] text-slate-400">User: {u.username} | Col: #{u.colegiadoNumber}</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold rounded-md block text-[11px]">
                    {u.aiCredits} / {u.aiCreditsLimit} IA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
