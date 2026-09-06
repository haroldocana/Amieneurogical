import React, { useState, useRef, useEffect } from 'react';
import { PatientRecord, AmieClinicalAnalysis } from '../types';
import { askAmieAssistant } from '../services/geminiService';
import { MessageSquare, Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';

interface AmieChatCopilotProps {
  patient: PatientRecord;
  analysis: AmieClinicalAnalysis | null;
}

export const AmieChatCopilot: React.FC<AmieChatCopilotProps> = ({ patient, analysis }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: `Protocolo AMIE Activo. Estoy a su disposición para discutir hipótesis diagnósticas diferenciales, farmacocinética, interacciones o ajustes de contención para el paciente ${patient.patientNameAnonymized}.`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setInputValue('');
    const newHistory = [...messages, { role: 'user' as const, text: userText }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const reply = await askAmieAssistant(newHistory, patient, analysis);
      setMessages([...newHistory, { role: 'model', text: reply }]);
    } catch (err) {
      setMessages([
        ...newHistory,
        { role: 'model', text: '⚠️ Error de comunicación con el motor clínico AMIE. Verifique la clave de API o la conexión.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (q: string) => {
    setInputValue(q);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            AMIE Copilot • Interconsulta en Vivo
          </h3>
        </div>
        <span className="text-[10px] text-slate-400">Modelo: gemini-2.5-flash</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              m.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-cyan-400 border border-slate-700'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none'
                  : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs italic">
              AMIE evaluando hipótesis bioclínicas y literatura DSM-5...
            </div>
          </div>
        )}
      </div>

      {/* Suggested chips */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-500 shrink-0">Consultas rápidas:</span>
        <button
          onClick={() => handleQuickPrompt('¿Por qué se descarta esquizofrenia en favor de trastorno del estado de ánimo con psicosis?')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
        >
          Esquizofrenia vs Estado Ánimo
        </button>
        <button
          onClick={() => handleQuickPrompt('¿Cuál es la dosis y monitoreo sugerido de litio o antipsicóticos atípicos para este caso?')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
        >
          Manejo Psicofarmacológico
        </button>
        <button
          onClick={() => handleQuickPrompt('¿Qué pruebas de laboratorio adicionales se requieren según la regla de seguridad?')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
        >
          Laboratorios de Exclusión
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Hacer una pregunta clínica o solicitar ajuste de razonamiento a AMIE..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
