import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  CreditCard, 
  FileCheck, 
  CheckCircle2, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Gift, 
  AlertCircle
} from 'lucide-react';

export const AdminSaaSPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrganization, setIsOrganization] = useState(false);
  const [grantType, setGrantType] = useState<'RECHARGE_TOKENS' | 'EXTEND_LICENSE' | 'GRANT_DEMO'>('RECHARGE_TOKENS');
  
  const [tokensToAdd, setTokensToAdd] = useState(150);
  const [extensionYears, setExtensionYears] = useState(1);
  const [demoDays, setDemoDays] = useState(15);
  
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [bankReference, setBankReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setStatusMessage({ type: 'error', text: 'Ingrese el correo, ID o número de colegiado del destinatario.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('amie_auth_token') || '';
      const response = await fetch('https://amieneurogical.onrender.com/api/admin/manual-grant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetId: searchQuery.trim(),
          isOrganization,
          grantType,
          tokensToAdd: Number(tokensToAdd),
          extensionYears: Number(extensionYears),
          demoDays: Number(demoDays),
          paymentMethod,
          bankReference: bankReference.trim(),
          adminNotes: adminNotes.trim(),
          adminUserId: localStorage.getItem('amie_username') || 'ADMIN_OPERACIONES'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMessage({ 
          type: 'success', 
          text: `¡Operación completada! ${data.message}` 
        });
        setBankReference('');
        setAdminNotes('');
      } else {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error de comunicación con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-600 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-600/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Gestión Operativa de Licencias y Transferencias Bancarias</h2>
            <p className="text-xs text-slate-400">Panel administrativo para autorizar transferencias, depósitos y demos comerciales.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-950 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold rounded-full">
          MODO AUTORIZADOR
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            1. Identificación del Destinatario
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Correo, ID de MongoDB o Nº Colegiado (Ej: doctor@hospital.com / 749210)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono pl-10"
                required
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setIsOrganization(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  !isOrganization ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Médico Individual
              </button>
              <button
                type="button"
                onClick={() => setIsOrganization(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  isOrganization ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Clínica / Hospital
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            2. Seleccionar Operación
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              onClick={() => setGrantType('RECHARGE_TOKENS')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                grantType === 'RECHARGE_TOKENS'
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Recargar Bolsón IA</span>
              </div>
              <p className="text-[10px] text-slate-400">Sumar saldo de tokens de consultas diagnósticas.</p>
            </div>

            <div
              onClick={() => setGrantType('EXTEND_LICENSE')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                grantType === 'EXTEND_LICENSE'
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Extensión de Licencia</span>
              </div>
              <p className="text-[10px] text-slate-400">Ampliar la fecha de vencimiento de la suscripción.</p>
            </div>

            <div
              onClick={() => setGrantType('GRANT_DEMO')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                grantType === 'GRANT_DEMO'
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Habilitar Demo / Cortesía</span>
              </div>
              <p className="text-[10px] text-slate-400">Acceso de prueba comercial sin costo.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
          {grantType === 'RECHARGE_TOKENS' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Cantidad de Tokens IA a Acreditar</label>
              <input
                type="number"
                value={tokensToAdd}
                onChange={(e) => setTokensToAdd(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono font-bold"
                min={1}
              />
            </div>
          )}

          {grantType === 'EXTEND_LICENSE' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Años de Suscripción Acumulados</label>
              <select
                value={extensionYears}
                onChange={(e) => setExtensionYears(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value={1}>1 Año (+365 Días)</option>
                <option value={2}>2 Años (+730 Días)</option>
                <option value={3}>3 Años (+1095 Días)</option>
              </select>
            </div>
          )}

          {grantType === 'GRANT_DEMO' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Días de Prueba Gratuita</label>
                <input
                  type="number"
                  value={demoDays}
                  onChange={(e) => setDemoDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  min={1}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Tokens de Prueba Incluidos</label>
                <input
                  type="number"
                  value={tokensToAdd}
                  onChange={(e) => setTokensToAdd(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono font-bold"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            3. Registro Contable y Método de Pago
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="BANK_TRANSFER">Transferencia Bancaria Directa</option>
                <option value="BANK_DEPOSIT">Depósito en Ventanilla / Cheque</option>
                <option value="PURCHASE_ORDER">Orden de Compra Hospitalaria (B2B)</option>
                <option value="CASH">Efectivo / Facturación Manual</option>
                <option value="FREE_DEMO">Cortesía / Prueba Comercial (Sin Cobro)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                Nº de Transferencia / Boleta de Banco / Orden
              </label>
              <input
                type="text"
                placeholder="Ej: TRX-992018 / Boleta #4012"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Notas Internas de Auditoría</label>
            <input
              type="text"
              placeholder="Ej: Pago verificado por administración en cuenta de Banco Industrial."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
            />
          </div>
        </div>

        {statusMessage && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' 
              : 'bg-rose-950 border border-rose-500 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <FileCheck className="w-4 h-4" />
          <span>{loading ? 'Procesando Acreditación...' : 'Autorizar y Acreditar Recursos en la Cuenta'}</span>
        </button>
      </form>
    </div>
  );
};
