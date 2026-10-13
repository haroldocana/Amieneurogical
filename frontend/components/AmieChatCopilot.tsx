import React, { useState, useRef, useEffect } from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { askAmieAssistant } from '../services/geminiService';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RefreshCw, 
  Trash2,
  Stethoscope
} from 'lucide-react';

interface AmieChatCopilotProps {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis | null;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: number;
}

export const AmieChatCopilot: React.FC<AmieChatCopilotProps> = ({ patient, analysis }) => {
  const patientDisplayName = patient?.patientNameAnonymized || patient?.id || 'PAC-8104';

  const buildInitialGreeting = (): string => {
    const diagCode = analysis?.primaryDiagnostic?.dsm5Code || patient?.diagnosticCode || 'DSM-5-TR';
    const diagTitle = analysis?.primaryDiagnostic?.title || 'Evaluación en Proceso';

    return `Protocolo AMIE Activo. Estoy a su disposición para contrastar hipótesis diagnósticas diferenciales, farmacocinética, biomarcadores qEEG o protocolos VR para el paciente ${patientDisplayName} (${diagCode}: ${diagTitle}).`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: buildInitialGreeting(),
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Resincronización automática si el médico cambia de paciente en el Workstation
  useEffect(() => {
    setMessages([
      {
        role: 'model',
        text: buildInitialGreeting(),
        timestamp: Date.now()
      }
    ]);
  }, [patient?.id]);

  // 2. Auto-scroll suave hacia el último mensaje recibido
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setInputValue('');
    const newHistory: ChatMessage[] = [
      ...messages, 
      { role: 'user', text: userText, timestamp: Date.now() }
    ];
    setMessages(newHistory);
    setLoading(true);

    try {
      // Envío de historial depurado hacia el servicio de Gemini
      const apiHistory = newHistory.map(m => ({ role: m.role, text: m.text }));
      const reply = await askAmieAssistant(apiHistory, patient, analysis);
      
      setMessages([
        ...newHistory, 
        { role: 'model', text: reply, timestamp: Date.now() }
      ]);
    } catch (err: any) {
      setMessages([
        ...newHistory,
        { 
          role: 'model', 
          text: `⚠️ Error de comunicación con el motor clínico AMIE (${err?.message || 'Fallo de red'}). Verifique su conexión y saldo en el Bolsón de IA.`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (q: string) => {
    setInputValue(q);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'model',
        text: buildInitialGreeting(),
        timestamp: Date.now()
      }
    ]);
  };

  /**
   * Parser ligero para formatear negritas y listas devueltas por la IA sin librerías pesadas
   */
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, i) => {
      // Formato para listas con viñetas
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Reemplazo de **texto** por negritas
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

      return (
        <span key={i} className={`block ${isBullet ? 'pl-3.5 relative before:content-["•"] before:absolute before:left-1 before:text-sky-400' : ''} ${line.trim() === '' ? 'h-2' : ''}`}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </span>
      );
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px] text-slate-100">
      {/* Header */}
      <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              AMIE Copilot • Interconsulta en Vivo
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </h3>
            <span className="text-[10px] text-slate-400 font-mono block">
              Expediente: {patientDisplayName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            title="Reiniciar conversación"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950 border border-sky-500/40 text-sky-300">
            gemini-2.5-flash
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 animate-fadeIn ${
              m.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user' 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' 
                  : 'bg-slate-800 text-cyan-400 border border-slate-700'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
            </div>

            <div
              className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none shadow'
                  : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow-lg'
              }`}
            >
              <div className="space-y-0.5">{renderFormattedText(m.text)}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5 animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs italic">
              AMIE evaluando hipótesis bioclínicas y contrastando criterios DSM-5-TR...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompts Sugeridos */}
      <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Consultas:
        </span>
        <button
          type="button"
          onClick={() => handleQuickPrompt('¿Por qué se descarta esquizofrenia en favor de trastorno del estado de ánimo con psicosis?')}
          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition"
        >
          Esquizofrenia vs Afectivo
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt('¿Cuál es la dosis de inicio, titulación y monitoreo sugerido de litio o atípicos para este caso?')}
          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition"
        >
          Psicofarmacología
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt('¿Qué laboratorios o neuroimágenes se requieren según la Regla de Seguridad Médica A?')}
          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition"
        >
          Descarte Orgánico
        </button>
      </div>

      {/* Formulario de Entrada */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          disabled={loading}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={loading ? 'Esperando dictamen de AMIE...' : 'Plantear duda clínica, interacción medicamentosa o hipótesis...'}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shadow-md shadow-sky-600/20 active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default AmieChatCopilot;
