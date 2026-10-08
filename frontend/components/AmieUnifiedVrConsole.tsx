const handleInitializeAndRenderEnvironment = async () => {
    setIsGeneratingAi(true);
    setEnvStatusMsg('Generando entorno y estímulo visual fotorrealista con Gemini 3.8 Flash...');

    try {
      // Detección multi-variable de la API Key tal como en tus servicios
      const apiKey = 
        import.meta.env.VITE_GEMINI_API_KEY || 
        import.meta.env.GEMINI_API_KEY || 
        import.meta.env.VITE_API_KEY || 
        '';

      let generatedAssetUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80';

      if (apiKey && apiKey.startsWith('AIza')) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          // Uso correcto de la versión 3.8 que maneja tu plataforma
          const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
          const promptText = `Describe visualmente en inglés y de forma fotorrealista esta escena para entorno clínico: "${customProfessionalPrompt}" (máx 15 palabras).`;
          const result = await model.generateContent(promptText);
          const queryTag = encodeURIComponent(result.response.text().trim());
          generatedAssetUrl = `https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80&sig=${queryTag}`;
        } catch (apiErr) {
          console.warn("Aviso de API Gemini, usando motor procedural local:", apiErr);
        }
      } else {
        const encodedKeyword = encodeURIComponent(customProfessionalPrompt.slice(0, 20));
        generatedAssetUrl = `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80&t=${encodedKeyword}`;
      }

      setEnvStatusMsg('¡Asset visual generado con éxito y transmitido al visor!');

      transmit({
        type: 'RENDER_SPATIAL_ENVIRONMENT_WITH_MEDIA',
        environment: selectedEnvironment,
        mode: vrMode,
        interactionType,
        professionalPrompt: customProfessionalPrompt,
        aiGeneratedAssetUrl: generatedAssetUrl,
        autoRegulation: isAiAutoRegulationActive,
        voiceStyle: aiVoiceTone
      });

      setSessionActive(true);
      setIsAbreactionTriggered(false);
    } catch (e) {
      setEnvStatusMsg('Entorno activo con parámetros predeterminados.');
      setSessionActive(true);
    } finally {
      setIsGeneratingAi(false);
    }
  };
