// 3. CARGA DE TEXTURAS / MEDIOS (ANTI-PANTALLA NEGRA DE VIDEO)
  useEffect(() => {
    if (!envMeshRef.current) return;
    const mat = envMeshRef.current.material as THREE.MeshBasicMaterial;

    // Limpiar video/textura anterior para liberar memoria
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
      videoElementRef.current.removeAttribute('src');
      videoElementRef.current.load();
      videoElementRef.current = null;
    }
    if (videoTextureRef.current) {
      videoTextureRef.current.dispose();
      videoTextureRef.current = null;
    }

    // 1. Mostrar color temporal mientras se descarga el recurso
    mat.map = null;
    mat.color.setHex(0x0284c7); // Color Cyan (así sabes que está cargando, no roto)
    mat.needsUpdate = true;

    const mapEcosystemKey = (rawName: string): string => {
      if (rawName.includes('07') || rawName.includes('SES/SIS')) return 'SEXUAL_HEALTH_SYSTEMIC';
      if (rawName.includes('NARCISSISM') || rawName.includes('Narcisismo')) return 'NARCISSISM_COVERT';
      if (rawName.includes('TDAH')) return 'TDAH_EXECUTIVE';
      return rawName;
    };

    const safeKey = mapEcosystemKey(activeEcosystem);

    if (isVideo) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = customImageUrl || `/video/${safeKey}.mp4`;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      videoElementRef.current = video;

      // EVENTO CLAVE: Solo asignar la textura cuando el video tenga datos reales
      video.addEventListener('loadeddata', () => {
        const texture = new THREE.VideoTexture(video);
        if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
        videoTextureRef.current = texture;
        
        mat.map = texture;
        mat.color.setHex(0xffffff); // Restaurar color para ver el video
        mat.needsUpdate = true;

        video.play().catch((e) => {
          console.warn('El navegador bloqueó el autoplay del video:', e);
          // Al presionar el botón "ENTER VR" con el mando, se suele destrabar el bloqueo
        });
      });

      // EVENTO CLAVE: Si el video NO existe (404) o el formato no es compatible
      video.addEventListener('error', () => {
        console.warn(`El video /video/${safeKey}.mp4 no existe o falló. Pasando a imagen JPG de respaldo...`);
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          `/ecosystems/${safeKey}.jpg`,
          (fallbackTex) => {
            mat.map = fallbackTex;
            mat.color.setHex(0xffffff);
            mat.needsUpdate = true;
          },
          undefined,
          () => {
            // Si tampoco hay JPG, se queda el fondo Cyan de seguridad
            mat.map = null;
            mat.color.setHex(0x0284c7);
            mat.needsUpdate = true;
          }
        );
      });

      // Forzar la carga
      video.load();

    } else {
      // Carga de imágenes estándar (JPG)
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      const targetUrl = customImageUrl || `/ecosystems/${safeKey}.jpg`;

      loader.load(
        targetUrl,
        (texture) => {
          if ('colorSpace' in texture) (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
          mat.map = texture;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
        },
        undefined,
        (err) => {
          console.warn(`No se pudo cargar la imagen: ${targetUrl}`, err);
          mat.map = null;
          mat.color.setHex(0x0284c7); // Cyan de emergencia
          mat.needsUpdate = true;
        }
      );
    }
  }, [activeEcosystem, isVideo, customImageUrl]);
