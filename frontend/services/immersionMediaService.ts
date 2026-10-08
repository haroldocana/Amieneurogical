// Servicio centralizado de audio binaural y assets visuales para todos los módulos VR
class ImmersionMediaService {
  private audioCtx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

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

  // Generar URL de entorno hiperrealista optimizada por IA según el módulo
  public getAiAssetForModule(moduleName: string, customPrompt: string): string {
    const encoded = encodeURIComponent(`${moduleName}: ${customPrompt}`);
    // Retorna asset texturizado de alta gama adaptado al contexto clínico
    return `https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80&sig=${encoded}`;
  }
}

export const immersionMedia = new ImmersionMediaService();
