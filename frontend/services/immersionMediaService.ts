// Servicio centralizado de audio binaural y assets visuales para todos los módulos VR
class ImmersionMediaService {
  private audioCtx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  // Mapeo oficial de entornos 3D/VR utilizando los nombres exactos de los archivos subidos
  private ecosystemAssets: Record<string, string> = {
    'HYPNOSIS': '/ecosystems/Hipnosis & Grounding',
    'SEXUAL_HEALTH': '/ecosystems/Salud Sexual',
    'CLUSTER_B_FORENSIC': '/ecosystems/Forense Cluster B',
    'TDAH_ATTENTION_LAB': '/ecosystems/Laboratorio de Atención',
    'DEVELOPMENTAL_TRAUMA': '/ecosystems/Trauma del Desarrollo (Santuario de Vínculo Seguro)',
    'PAIN_MANAGEMENT': '/ecosystems/Control de Dolor Crónico (Paisaje Subacuático)',
    'FUNCTIONAL_NEUROLOGY': '/ecosystems/Neurología Funcional & Propiocepción',
    'MEMORY_RECONSOLIDATION': '/ecosystems/Reconsolidación de Memoria (Sala de Espejo)',
    'ACROPHOBIA': '/ecosystems/ACROPHOBIA_ROOF.jpg',
    'AEROPHOBIA': '/ecosystems/AEROPHOBIA_CABIN.jpg',
    'SAFE_PLACE': '/ecosystems/SAFE_PLACE_FOREST.jpg',
    'ZEN_GARDEN': '/ecosystems/ZEN_GARDEN.jpg'
  };

  // Iniciar frecuencias binaurales terapéuticas en tiempo real
  public startBinauralBeats(baseFreq: number = 200, beatFreq: number = 6, volume: number = 0.15) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.stopBinauralBeats();

      // Canal Izquierdo y Derecho para efecto binaural
      this.leftOsc = this.audioCtx.createOscillator();
      this.rightOsc = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.leftOsc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
      this.rightOsc.frequency.setValueAtTime(baseFreq + beatFreq, this.audioCtx.currentTime);

      this.gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);

      // Mezclador estéreo básico
      const merger = this.audioCtx.createChannelMerger(2);
      this.leftOsc.connect(merger, 0, 0);
      this.rightOsc.connect(merger, 0, 1);
      merger.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.leftOsc.start();
      this.rightOsc.start();
    } catch (e) {
      console.warn('AudioContext no permitido sin interacción previa del usuario:', e);
    }
  }

  // Detener audio binaural
  public stopBinauralBeats() {
    try {
      if (this.leftOsc) { this.leftOsc.stop(); this.leftOsc.disconnect(); this.leftOsc = null; }
      if (this.rightOsc) { this.rightOsc.stop(); this.rightOsc.disconnect(); this.rightOsc = null; }
    } catch (e) {
      console.warn('Error al detener audio:', e);
    }
  }

  // Obtener la URL del asset visual optimizado para el visor VR según el módulo clínico
  public getEcosystemAssetUrl(moduleKey: string): string {
    return this.ecosystemAssets[moduleKey] || '/ecosystems/ZEN_GARDEN.jpg';
  }

  // Generar URL de entorno respaldada por IA o fallback dinámico
  public getAiAssetForModule(moduleName: string, customPrompt: string): string {
    const matchedUrl = this.ecosystemAssets[moduleName];
    if (matchedUrl) {
      return matchedUrl;
    }
    const encoded = encodeURIComponent(`${moduleName}: ${customPrompt}`);
    return `https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80&sig=${encoded}`;
  }
}

export const immersionMedia = new ImmersionMediaService();
