// ============================================================================
// AMIE CLINICAL COPILOT - PUENTE WEBSOCKET VR (PICO 3 / META QUEST)
// frontend/services/vrControlService.ts
// ============================================================================

import { MASTER_VR_ENVIRONMENTS } from '../constants';

export type VrConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
export type ModuleCategory = 'DIAGNOSTIC' | 'TREATMENT';

export interface VrCommandPayload {
  type: string;
  environmentId?: string;
  ecosystem?: string;
  moduleId?: string;
  moduleName?: string;
  unitySceneName?: string;
  parameters?: Record<string, any>;
  category?: ModuleCategory;
  frequencyHz?: number;
  protocol?: string;
  patientId: string;
  role?: 'sender' | 'receiver';
  timestamp: number;
  token?: string;
  [key: string]: any;
}

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
    } catch {}
    return '';
  }

  public static connect(customUrl?: string, patientId?: string): void {
    if (patientId) {
      this.activePatientId = patientId;
    }

    this.isExplicitDisconnect = false;
    const targetUrl = customUrl || this.resolveDefaultWsUrl();

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
        console.log('✅ [AMIE VR CONTROL] Conectado exitosamente al puente VR');
        this.notifyStatus('CONNECTED');
        this.startHeartbeat();

        const handshakePayload = {
          type: 'HANDSHAKE',
          role: 'sender',
          patientId: this.activePatientId,
          token: this.getAuthToken(),
          timestamp: Date.now()
        };
        this.sendRaw(JSON.stringify(handshakePayload));

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
        } catch {}
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

        console.warn('⚠️ [AMIE VR CONTROL] Conexión cerrada. Reconectando en 2.5s...');
        this.notifyStatus('RECONNECTING');
        this.reconnectTimer = setTimeout(() => this.connectInternal(), 2500);
      };
    } catch (e) {
      console.error('[AMIE VR CONTROL] Excepción al instanciar WebSocket:', e);
      this.notifyStatus('DISCONNECTED');
      if (!this.isExplicitDisconnect) {
        this.reconnectTimer = setTimeout(() => this.connectInternal(), 2500);
      }
    }
  }

  private static startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'PING', 
          timestamp: Date.now(), 
          role: 'sender', 
          patientId: this.activePatientId 
        }));
      }
    }, 20000);
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

  public static sendCommand(payload: Partial<VrCommandPayload> & Record<string, any>): void {
    const fullPayload: VrCommandPayload = {
      type: payload.type || 'CHANGE_ENVIRONMENT',
      patientId: payload.patientId || this.activePatientId,
      role: 'sender',
      token: this.getAuthToken(),
      timestamp: Date.now(),
      ...payload
    };
    this.sendRaw(JSON.stringify(fullPayload));
  }

  /**
   * Sincronización proactiva de módulo, modo, patología, audio y pipeline al visor
   */
  public static syncClinicalContext(context: {
    moduleId: string;
    category: ModuleCategory;
    disorderId: string;
    disorderName: string;
    ecosystem: string;
    patientId?: string;
    pipeline?: { phase1Sec: number; phase2Sec: number; phase3Sec: number };
    audioGuidance?: { baselineScript: string; activeScript: string; recoveryScript: string };
    frequencyHz?: number;
  }): void {
    if (context.patientId) this.activePatientId = context.patientId;
    this.sendCommand({
      type: 'SYNC_CLINICAL_CONTEXT',
      patientId: this.activePatientId,
      ...context,
      timestamp: Date.now()
    });
    console.log(`📡 [AMIE VR] Contexto clínico sincronizado al visor: ${context.disorderName} [${context.category}]`);
  }

  public static changeEnvironment(
    environmentId: string, 
    patientId?: string, 
    category: ModuleCategory = 'TREATMENT'
  ): void {
    if (patientId) this.activePatientId = patientId;

    this.sendCommand({
      type: 'CHANGE_ENVIRONMENT',
      environmentId,
      ecosystem: environmentId,
      moduleId: environmentId,
      moduleName: environmentId,
      category,
      patientId: this.activePatientId
    });
  }

  public static setModuleMode(
    category: ModuleCategory, 
    environmentId?: string, 
    patientId?: string
  ): void {
    if (patientId) this.activePatientId = patientId;

    this.sendCommand({
      type: 'SET_MODULE_MODE',
      category,
      environmentId,
      patientId: this.activePatientId
    });
  }

  public static startLightStimulation(
    frequencyHz: number = 40.0, 
    protocol: string = 'ALZHEIMER_40HZ', 
    patientId?: string
  ): void {
    if (patientId) this.activePatientId = patientId;

    this.sendCommand({
      type: 'START_LIGHT_STIMULATION',
      frequencyHz,
      protocol,
      category: 'TREATMENT',
      environmentId: 'cosmic_stars',
      patientId: this.activePatientId
    });
  }

  public static stopLightStimulation(patientId?: string): void {
    this.sendCommand({
      type: 'STOP_LIGHT_STIMULATION',
      patientId: patientId || this.activePatientId
    });
  }

  public static triggerGroundingProtocol(patientId?: string): void {
    const pid = patientId || this.activePatientId;
    this.sendCommand({
      type: 'TRIGGER_GROUNDING_PROTOCOL',
      environmentId: 'safe_place_forest',
      ecosystem: 'safe_place_forest',
      category: 'TREATMENT',
      patientId: pid
    });
  }

  public static stopActiveSession(patientId?: string): void {
    this.sendCommand({
      type: 'STOP_TEST',
      patientId: patientId || this.activePatientId
    });
  }

  public static subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    const initialStatus: VrConnectionStatus = 
      this.ws?.readyState === WebSocket.OPEN ? 'CONNECTED' :
      this.ws?.readyState === WebSocket.CONNECTING ? 'CONNECTING' : 'DISCONNECTED';
    listener(initialStatus, this.currentUrl);
    return () => this.statusListeners.delete(listener);
  }

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
  }

  public static isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export default VrControlService;
