import { MASTER_VR_ENVIRONMENTS } from '../constants';

export interface VrCommandPayload {
  type: string;
  environmentId: string;
  unitySceneName: string;
  parameters: Record<string, any>;
  patientId: string;
  timestamp: number;
  token?: string;
}

export type VrConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

type StatusListener = (status: VrConnectionStatus, url: string) => void;
type MessageListener = (data: any) => void;

export class VrControlService {
  private static ws: WebSocket | null = null;
  private static currentUrl: string = '';
  private static reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private static heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private static statusListeners: Set<StatusListener> = new Set();
  private static messageListeners: Set<MessageListener> = new Set();
  private static pendingQueue: string[] = [];
  private static activePatientId: string = 'PAC-8104';
  private static isExplicitDisconnect: boolean = false;

  /**
   * Resuelve la URL del WebSocket priorizando variables de entorno y fallback seguro a Render
   */
  public static resolveDefaultWsUrl(): string {
    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    if (envWsUrl) return envWsUrl;

    const envApiUrl = (import.meta as any).env?.VITE_API_URL || 'https://amieneurogical.onrender.com';
    const cleanUrl = envApiUrl.replace(/\/+$/, '');

    if (cleanUrl.startsWith('https://')) {
      return cleanUrl.replace('https://', 'wss://');
    } else if (cleanUrl.startsWith('http://')) {
      return cleanUrl.replace('http://', 'ws://');
    }

    return 'wss://amieneurogical.onrender.com';
  }

  private static getAuthToken(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('amie_auth_token') || localStorage.getItem('token') || '';
      }
    } catch {
      // Contexto aislado
    }
    return '';
  }

  /**
   * Conecta automáticamente al WebSocket del backend de Render o a la URL especificada
   */
  public static connect(customUrl?: string, patientId?: string): void {
    if (patientId) {
      this.activePatientId = patientId;
    }

    this.isExplicitDisconnect = false;
    const targetUrl = customUrl || this.resolveDefaultWsUrl();

    // Evita duplicar sockets si ya está conectado o en proceso de negociación
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.currentUrl === targetUrl) return;
      this.disconnect();
    }

    this.currentUrl = targetUrl;
    this.connectInternal();
  }

  private static connectInternal(): void {
    if (this.isExplicitDisconnect) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.notifyStatus('CONNECTING');
    console.log(`🔌 [AMIE VR CONTROL] Conectando a ${this.currentUrl}...`);

    try {
      this.ws = new WebSocket(this.currentUrl);

      this.ws.onopen = () => {
        console.log('✅ [AMIE VR CONTROL] Conectado exitosamente al puente VR (Render)');
        this.notifyStatus('CONNECTED');
        this.startHeartbeat();

        // 1. Handshake inicial de registro médico
        const handshakePayload = {
          type: 'HANDSHAKE',
          role: 'sender',
          patientId: this.activePatientId,
          token: this.getAuthToken(),
          timestamp: Date.now()
        };
        this.sendRaw(JSON.stringify(handshakePayload));

        // 2. Despachar mensajes en cola que quedaron pendientes durante reconexiones
        while (this.pendingQueue.length > 0) {
          const queuedMsg = this.pendingQueue.shift();
          if (queuedMsg) {
            this.sendRaw(queuedMsg);
          }
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          this.messageListeners.forEach(listener => {
            try {
              listener(parsed);
            } catch (err) {
              console.error('[AMIE VR CONTROL] Error en listener de mensaje:', err);
            }
          });
        } catch {
          // Mensaje no JSON (p. ej. 'pong')
        }
      };

      this.ws.onerror = (err) => {
        console.warn('❌ [AMIE VR CONTROL] Error de conexión WebSocket:', err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (this.isExplicitDisconnect) {
          this.notifyStatus('DISCONNECTED');
          return;
        }

        console.warn('⚠️ [AMIE VR CONTROL] Conexión cerrada. Reconectando en 3s...');
        this.notifyStatus('RECONNECTING');
        this.reconnectTimer = setTimeout(() => this.connectInternal(), 3000);
      };
    } catch (e) {
      console.error('[AMIE VR CONTROL] Excepción al instanciar WebSocket:', e);
      this.notifyStatus('DISCONNECTED');
      if (!this.isExplicitDisconnect) {
        this.reconnectTimer = setTimeout(() => this.connectInternal(), 3000);
      }
    }
  }

  /**
   * Mantiene vivo el socket en Render evitando que el balanceador termine la conexión por timeout
   */
  private static startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now(), role: 'sender' }));
      }
    }, 25000); // Cada 25s (menor al timeout de 55s de Render)
  }

  private static stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private static sendRaw(dataStr: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(dataStr);
    } else {
      this.pendingQueue.push(dataStr);
    }
  }

  /**
   * Carga un Entorno Maestro enviando la configuración a las gafas VR o a Unity
   */
  public static loadMasterEnvironment(
    environmentId: string, 
    patientId: string, 
    customParams?: Record<string, any>
  ): void {
    const envList = Array.isArray(MASTER_VR_ENVIRONMENTS) 
      ? MASTER_VR_ENVIRONMENTS 
      : (MASTER_VR_ENVIRONMENTS as any)?.masterEnvironments || [];

    const envConfig = envList.find((e: any) => e.id === environmentId);

    if (!envConfig) {
      console.error(`[AMIE VR CONTROL] Entorno '${environmentId}' no encontrado en constantes clínicas.`);
      return;
    }

    this.activePatientId = patientId;

    const payload: VrCommandPayload = {
      type: 'LOAD_MASTER_ENVIRONMENT',
      environmentId: envConfig.id,
      unitySceneName: envConfig.unitySceneName || envConfig.id,
      parameters: customParams || envConfig.controllableParameters || {},
      patientId,
      token: this.getAuthToken(),
      timestamp: Date.now()
    };

    const payloadStr = JSON.stringify(payload);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payloadStr);
      console.log(`🚀 [AMIE VR] Enviado comando de carga: ${envConfig.name || envConfig.id}`, payload);
    } else {
      console.warn('⚠️ WebSocket no conectado aún. Encolando comando para despacho inmediato al conectar...');
      this.pendingQueue.push(payloadStr);
      this.connect();
    }
  }

  /**
   * Actualiza parámetros biométricos o visuales en la escena activa de Unity/WebXR
   */
  public static updateSceneParameters(
    parameters: Record<string, any>, 
    patientId?: string
  ): void {
    const payload = {
      type: 'UPDATE_SCENE_PARAMETERS',
      parameters,
      patientId: patientId || this.activePatientId,
      timestamp: Date.now()
    };
    this.sendRaw(JSON.stringify(payload));
  }

  /**
   * Dispara el protocolo de Grounding (retorno inmediato a sala de seguridad)
   */
  public static triggerGroundingProtocol(patientId?: string): void {
    const payload = {
      type: 'TRIGGER_GROUNDING_PROTOCOL',
      patientId: patientId || this.activePatientId,
      timestamp: Date.now()
    };
    this.sendRaw(JSON.stringify(payload));
  }

  /**
   * Detiene la prueba activa y devuelve el visor a la sala de espera
   */
  public static stopActiveSession(patientId?: string): void {
    const payload = {
      type: 'STOP_TEST',
      patientId: patientId || this.activePatientId,
      timestamp: Date.now()
    };
    this.sendRaw(JSON.stringify(payload));
  }

  /**
   * Suscribe un listener para monitorear el estado de la conexión en interfaces React
   */
  public static subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    const initialStatus: VrConnectionStatus = 
      this.ws?.readyState === WebSocket.OPEN ? 'CONNECTED' :
      this.ws?.readyState === WebSocket.CONNECTING ? 'CONNECTING' : 'DISCONNECTED';
    listener(initialStatus, this.currentUrl);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Suscribe un listener para recibir telemetría o confirmaciones desde Unity/Pico
   */
  public static subscribeMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  private static notifyStatus(status: VrConnectionStatus): void {
    this.statusListeners.forEach(fn => {
      try {
        fn(status, this.currentUrl);
      } catch (err) {
        console.error('[AMIE VR CONTROL] Error notificando estado:', err);
      }
    });
  }

  /**
   * Cierra de manera explícita la conexión WebSocket e inhabilita la auto-reconexión
   */
  public static disconnect(): void {
    this.isExplicitDisconnect = true;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.pendingQueue = [];
    this.notifyStatus('DISCONNECTED');
    console.log('🛑 [AMIE VR CONTROL] Desconexión explícita completada.');
  }

  public static isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export default VrControlService;
