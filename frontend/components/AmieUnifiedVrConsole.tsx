{/* 🧠 PANEL DE CONFIGURACIÓN Y PROMPTS PARA SES/SIS E IA */}
{vrMode === 'SEXUAL_HEALTH_SES_SIS' && (
  <div className="p-4 bg-slate-900 rounded-xl border border-rose-500/30 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-rose-400" /> Generador IA para Respuesta Sexual (Modelo Bancroft SES / SIS):
      </span>
      <select 
        value={aiContentType} 
        onChange={(e) => setAiContentType(e.target.value as any)} 
        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-200 font-bold focus:outline-none"
      >
        <option value="SES_SIS_EXCITATORY">Modelo SES: Activar Aceleradores / Foco Erótico</option>
        <option value="SES_SIS_INHIBITORY">Modelo SIS: Mitigación de Frenos / Culpa / Ansiedad</option>
        <option value="COUPLE_MEDIATION">Sintonía y Comunicación Diádica en Pareja</option>
        <option value="CUSTOM_SCRIPT">Guion y Estímulo Clínico Libre</option>
      </select>
    </div>

    <div className="space-y-1">
      <label className="text-[11px] text-slate-400 font-semibold block">
        Instrucciones de la IA (Guion, Diálogo y Parámetros del Video/Audio para Inhibir o Exitar):
      </label>
      <textarea
        rows={3}
        value={customProfessionalPrompt}
        onChange={(e) => setCustomProfessionalPrompt(e.target.value)}
        placeholder="Ej: Generar un entorno de seguridad y un guion con tono pausado que ayude a desarticular los frenos inhibitorios (SIS) por autoexigencia y vergüenza corporal..."
        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 transition"
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold block">Tono de Voz del Guía / Avatar (TTS Inmersivo):</label>
        <select 
          value={aiVoiceTone} 
          onChange={(e) => setAiVoiceTone(e.target.value as any)} 
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none"
        >
          <option value="SOFT_WHISPER">Susurro Cálido y Pausado (Desactivar Frenos SIS)</option>
          <option value="EMPATHIC_GUIDE">Guía Empático y Validante (Sintonía SES)</option>
          <option value="ARROGANT_COLD">Analítico y Desapasionado (Reestructuración)</option>
        </select>
      </div>

      <div className="flex items-end">
        <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-[10px] text-rose-200 w-full leading-relaxed">
          💡 La IA compilará este prompt para sintetizar el audio, estructurar los estímulos visuales y sincronizar el bucle cerrado con el visor.
        </div>
      </div>
    </div>
  </div>
)}
