import React, { useState } from 'react';
import { MedicalLicenseAccount } from '../types';
import { INITIAL_LICENSES } from '../constants';
import { KeyRound, UserPlus, Database, ShieldCheck, CheckCircle2, AlertCircle, Copy, Check, FileSpreadsheet } from 'lucide-react';

export const AdminSaaSPanel: React.FC = () => {
  const [licenses, setLicenses] = useState<MedicalLicenseAccount[]>(INITIAL_LICENSES);
  const [doctorName, setDoctorName] = useState('');
  const [colegiadoNumber, setColegiadoNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');
  const [specialty, setSpecialty] = useState('Psiquiatría General');
  const [tier, setTier] = useState<'Institucional' | 'Clínica Privada' | 'Investigación'>('Institucional');
  const [createdSuccessMsg, setCreatedSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setCreatedSuccessMsg(null);

    // Validate colegiado is purely numeric
    const numericColegiado = parseInt(colegiadoNumber, 10);
    if (!colegiadoNumber || isNaN(numericColegiado) || !/^\d+$/.test(colegiadoNumber.trim())) {
      setValidationError('El Número de Colegiado debe ser puramente numérico (ej. 749210 o 8923).');
      return;
    }

    if (!doctorName.trim() || !username.trim() || !password.trim()) {
      setValidationError('Por favor complete todos los campos requeridos del formulario.');
      return;
    }

    const newId = `LIC-${Math.floor(10000 + Math.random() * 90000)}`;
    const sanitizedUsername = username.trim().toLowerCase();
    const storageUri = `gs://base-conocimiento-medica/licencias/${sanitizedUsername}.json`;

    const newLicense: MedicalLicenseAccount = {
      id: newId,
      doctorName: doctorName.trim(),
      colegiadoNumber: numericColegiado,
      username: sanitizedUsername,
      hospitalClinic: hospitalClinic.trim() || 'Centro Médico Clínico',
      specialty: specialty,
      tier: tier,
      storageBucketUri: storageUri,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Activa'
    };

    setLicenses([newLicense, ...licenses]);
    setCreatedSuccessMsg(`Licencia #${newLicense.id} generada y almacenada en: ${storageUri}`);

    // Reset Form
    setDoctorName('');
    setColegiadoNumber('');
    setUsername('');
    setPassword('');
    setHospitalClinic('');
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
            Aprovisionamiento de accesos clínicos vinculados a Cloud Storage (<code className="text-sky-300">gs://base-conocimiento-medica/licencias/&lt;username&gt;.json</code>)
          </p>
        </div>
      </div>

      {/* Grid: Creation Form & License List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Create License */}
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
                <label className="block text-slate-400 mb-1">No. de Colegiado (Numérico) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 749210 o 8923"
                  value={colegiadoNumber}
                  onChange={(e) => setColegiadoNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nivel / Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="Institucional">Institucional</option>
                  <option value="Clínica Privada">Clínica Privada</option>
                  <option value="Investigación">Investigación</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Usuario / Email Clínico *</label>
                <input
                  type="text"
                  required
                  placeholder="usuario@instituto.med"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contraseña de Acceso *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Especialidad Médica</label>
              <input
                type="text"
                placeholder="Psiquiatría / Neurología / Neuropsicología"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Hospital / Institución de Afiliación</label>
              <input
                type="text"
                placeholder="Hospital General / Centro de Salud Mental"
                value={hospitalClinic}
                onChange={(e) => setHospitalClinic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition"
            >
              Generar y Guardar en Cloud Storage
            </button>
          </form>
        </div>

        {/* Right Table: Active Licenses */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Licencias Médicas Vigentes ({licenses.length})
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">gs://base-conocimiento-medica/licencias/</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[480px]">
            {licenses.map((lic) => (
              <div
                key={lic.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-sm text-slate-100">{lic.doctorName}</span>
                    <div className="text-[11px] text-slate-400">{lic.specialty} • {lic.hospitalClinic}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      Colegiado #{lic.colegiadoNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {lic.status}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] font-mono text-slate-400 truncate flex items-center justify-between">
                  <span className="truncate">{lic.storageBucketUri}</span>
                  <span className="text-slate-500 text-[10px] shrink-0 ml-2">Expira: {lic.expiresAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
