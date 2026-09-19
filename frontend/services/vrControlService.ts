import { MASTER_VR_ENVIRONMENTS } from '../constants';

export interface VrCommandPayload {
  environmentId: string;
  unitySceneName: string;
  parameters: Record<string, any>;
  patientId: string;
  timestamp: number;
}

export class VrControlService {
  private static ws: WebSocket | null = null;

  public static connect(ipAddress: string = '192.168.1.105', port: number = 8080) {
    this.ws = new WebSocket(`ws://${ipAddress}:${port}/vr-control`);

    this.ws.onopen = () => {
      console.log('🔌 [AMIE VR CONTROL] Conectado exitosamente al Visor VR');
    };

    this.ws.onerror = (err) => {
      console.error('❌ [AMIE VR CONTROL] Error de conexión con el Visor VR', err);
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
}
