{/* SALUD SEXUAL & SES/SIS */}
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Sexología & Respuesta Sexual (SES / SIS)" description="Evaluación y tratamiento inmersivo con Gemini 3.8 Flash." clinicalUtility="Mapeo de doble control sexual y generación de assets IA." badge="Sexualidad">
                <button onClick={() => setActiveTab('sexual_health')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'sexual_health' ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-300" />
                  <span>Salud Sexual & SES/SIS</span>
                </button>
              </HoverTooltip>
            </div>

            {/* MÓDULO EXCLUSIVO DE HIPNOSIS EN BUCLE CERRADO */}
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Hipnosis & Bucle Cerrado" description="Neurohipnosis y regulación autonómica con telemetría." clinicalUtility="Inducción y grounding." badge="Hipnosis">
                <button onClick={() => setActiveTab('hypnosis_closed_loop')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'hypnosis_closed_loop' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Hipnosis Bucle Cerrado</span>
                </button>
              </HoverTooltip>
            </div>

            {/* HUB DE MÓDULOS AVANZADOS (TDAH, Trauma, Dolor, etc.) */}
            <div className="shrink-0 inline-flex">
              <HoverTooltip title="Módulos VR Avanzados (TDAH / Trauma / Dolor)" description="Acceso directo a submódulos clínicos especializados." clinicalUtility="Intervención inmersiva." badge="Submódulos">
                <button onClick={() => setActiveTab('vr_advanced_hub')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${activeTab === 'vr_advanced_hub' ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <Zap className="w-3.5 h-3.5 text-indigo-300" />
                  <span>TDAH, Trauma & Dolor</span>
                </button>
              </HoverTooltip>
            </div>
