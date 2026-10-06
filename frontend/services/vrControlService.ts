import { MASTER_VR_ENVIRONMENTS } from '../constants';

export interface VrCommandPayload {
  type: string;
  environmentId: string;
  unitySceneName: string;
  parameters: Record<string, any>;
  patientId: string;
  timestamp: number;
}

export class VrControlService {
  private static ws: WebSocket | null = null;
  private static currentUrl: string = '';

  // Conecta automáticamente al backend en Render o al local según el entorno
  public static connect(customUrl?: string) {
    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    
    // Si estás en Render, usa wss:// (seguro). Si no, ws://localhost
    const defaultWsUrl = isProd 
      ? `wss://${window.location.host}` 
      : 'ws://localhost:10000';

    this.currentUrl = customUrl || defaultWsUrl;
    this.connectInternal();
  }

  private static connectInternal() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    console.log(`🔌 [AMIE VR CONTROL] Conectando a ${this.currentUrl}...`);
    this.ws = new WebSocket(this.currentUrl);

    this.ws.onopen = () => {
      console.log('✅ [AMIE VR CONTROL] Conectado exitosamente al puente VR (Render)');
    };

    this.ws.onerror = (err) => {
      console.error('❌ [AMIE VR CONTROL] Error de conexión', err);
    };

    // Auto-reconectar si se cae la red
    this.ws.onclose = () => {
      console.warn('⚠️ [AMIE VR CONTROL] Conexión cerrada. Reconectando en 3s...');
      setTimeout(() => this.connectInternal(), 3000);
    };
  }

  // Carga un Entorno Maestro enviando la configuración a las gafas VR
  public static loadMasterEnvironment(environmentId: string, patientId: string, customParams?: Record<string, any>) {
    const envConfig = MASTER_VR_ENVIRONMENTS.masterEnvironments.find(e => e.id === environmentId);

    if (!envConfig) {
      console.error(`Entorno ${environmentId} no encontrado en constants.`);
      return;
    }

    const payload: VrCommandPayload = {
      type: 'LOAD_MASTER_ENVIRONMENT', // Identificador para el Switch del Backend
      environmentId: envConfig.id,
      unitySceneName: envConfig.unitySceneName,
      parameters: customParams || envConfig.controllableParameters,
      patientId,
      timestamp: Date.now()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      console.log(`🚀 [AMIE VR] Enviado comando de carga: ${envConfig.name}`, payload);
    } else {
      console.warn('⚠️ WebSocket no conectado. Simulando transmisión a Unity...');
    }
  }

  public static disconnect() {
    if (this.ws) {
      this.ws.onclose = null; // Desactiva la auto-reconexión si cerramos a propósito
      this.ws.close();
      this.ws = null;
    }
  }
}
