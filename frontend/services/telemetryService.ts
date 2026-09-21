// ============================================================================
// AMIE MULTI-PROTOCOL TELEMETRY DRIVER (USB / BLE / WIFI / SIMULATED)
// ============================================================================

import { MultisensoryHardwareTelemetry, NeuromotorBiomarkers } from '../types';

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED';

export interface PrecisionTelemetryPacket {
  reactionTimeMs: number;
  handGripPressureKg: number;
  touchTapLatencyMs: number;
  heartRateBpm: number;
  hrvRmssdMs: number;
  gsrMicroSiemens: number;
  eegChannelsRaw: number[];
  timestamp: number;
}

type TelemetryCallback = (data: PrecisionTelemetryPacket) => void;
type StatusCallback = (status: { protocol: TelemetryProtocol; connected: boolean; deviceName: string }) => void;

class TelemetryManager {
  private activeProtocol: TelemetryProtocol = 'SIMULATED';
  private isConnected: boolean = false;
  private deviceName: string = 'Modo Simulación AMIE';
  
  private serialPort: any = null;
  private serialReader: any = null;
  private bleDevice: any = null;
  private bleServer: any = null;
  private webSocket: WebSocket | null = null;
  private simulationInterval: any = null;

  // Calibración Baseline / Tara
  private gripZeroOffsetKg: number = 0;
  private isCalibrating: boolean = false;

  private dataListeners: Set<TelemetryCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();

  private currentPacket: PrecisionTelemetryPacket = {
    reactionTimeMs: 195,
    handGripPressureKg: 32.4,
    touchTapLatencyMs: 180,
    heartRateBpm: 72,
    hrvRmssdMs: 38,
    gsrMicroSiemens: 3.2,
    eegChannelsRaw: [12.4, -4.2, 18.1, 8.5, -2.1, 14.3, 6.2, 0.8],
    timestamp: Date.now()
  };

  constructor() {
    this.startSimulation();
  }

  public subscribeData(callback: TelemetryCallback): () => void {
    this.dataListeners.add(callback);
    callback(this.currentPacket);
    return () => this.dataListeners.delete(callback);
  }

  public subscribeStatus(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    this.notifyStatus();
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus() {
    const status = {
      protocol: this.activeProtocol,
      connected: this.isConnected || this.activeProtocol === 'SIMULATED',
      deviceName: this.deviceName
    };
    this.statusListeners.forEach(fn => fn(status));
  }

  private broadcastPacket(packet: PrecisionTelemetryPacket) {
    // Aplicar tara/offset de calibración
    const calibratedGrip = Math.max(0, Number((packet.handGripPressureKg - this.gripZeroOffsetKg).toFixed(2)));
    
    this.currentPacket = {
      ...packet,
      handGripPressureKg: calibratedGrip
    };

    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  // --------------------------------------------------------------------------
  // 1. CONEXIÓN USB SERIAL (115200 Baudios - ESP32 / FTDI)
  // --------------------------------------------------------------------------
  public async connectUsb(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      alert('Tu navegador no soporta Web Serial API (Usa Chrome o Edge).');
      return false;
    }

    try {
      this.stopCurrentProtocol();
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      this.activeProtocol = 'USB';
      this.isConnected = true;
      this.deviceName = 'ESP32 Bio-Telemetry (USB 115200 Baud)';
      this.notifyStatus();

      this.startSerialLoop();
      return true;
    } catch (err) {
      console.error('Error de conexión USB:', err);
      this.enableSimulation();
      return false;
    }
  }

  private async startSerialLoop() {
    const textDecoder = new TextDecoderStream();
    this.serialPort.readable.pipeTo(textDecoder.writable);
    this.serialReader = textDecoder.readable.getReader();

    let buffer = '';
    try {
      while (this.isConnected && this.activeProtocol === 'USB') {
        const { value, done } = await this.serialReader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            this.parseIncomingPayload(line.trim());
          }
        }
      }
    } catch (err) {
      console.warn('Lectura USB finalizada:', err);
    }
  }

  // --------------------------------------------------------------------------
  // 2. CONEXIÓN BLUETOOTH BLE (GATT Services)
  // --------------------------------------------------------------------------
  public async connectBluetooth(): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert('Tu navegador no soporta Web Bluetooth API.');
      return false;
    }

    try {
      this.stopCurrentProtocol();
      this.bleDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', '0000ffe0-0000-1000-8000-00805f9b34fb']
      });

      this.bleServer = await this.bleDevice.gatt.connect();
      this.activeProtocol = 'BLUETOOTH';
      this.isConnected = borderConnect(this.bleDevice);
      this.deviceName = this.bleDevice.name || 'Sensor Bluetooth BLE AMIE';
      this.notifyStatus();

      // Escuchar desconexión física
      this.bleDevice.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.enableSimulation();
      });

      return true;
    } catch (err) {
      console.error('Error al vincular Bluetooth:', err);
      this.enableSimulation();
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 3. CONEXIÓN WI-FI SOCKET (ESP32 WebSocket local / REST)
  // --------------------------------------------------------------------------
  public connectWifi(ipAddress: string = '192.168.1.105', port: number = 8080): boolean {
    try {
      this.stopCurrentProtocol();
      const wsUrl = `ws://${ipAddress}:${port}`;
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = () => {
        this.activeProtocol = 'WIFI';
        this.isConnected = true;
        this.deviceName = `ESP32 Wi-Fi Socket (${ipAddress})`;
        this.notifyStatus();
      };

      this.webSocket.onmessage = (event) => {
        this.parseIncomingPayload(event.data);
      };

      this.webSocket.onerror = (err) => {
        console.error('Error Socket Wi-Fi:', err);
        this.enableSimulation();
      };

      this.webSocket.onclose = () => {
        this.isConnected = false;
        this.notifyStatus();
      };

      return true;
    } catch (err) {
      console.error('Fallo al abrir Socket Wi-Fi:', err);
      this.enableSimulation();
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 4. MODO SIMULACIÓN BIOMÉDRICA EN VIVO
  // --------------------------------------------------------------------------
  public enableSimulation() {
    this.stopCurrentProtocol();
    this.activeProtocol = 'SIMULATED';
    this.isConnected = true;
    this.deviceName = 'Sensor Virtual AMIE (Simulación Sincronizada)';
    this.notifyStatus();
    this.startSimulation();
  }

  private startSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.simulationInterval = setInterval(() => {
      if (this.activeProtocol !== 'SIMULATED') return;

      const simReaction = Math.floor(190 + Math.random() * 25 - 10);
      const simGrip = Number((32.0 + Math.random() * 4 - 2).toFixed(1));
      const simTap = Math.floor(175 + Math.random() * 20);
      const simBpm = Math.floor(70 + Math.random() * 6 - 3);
      const simHrv = Math.floor(36 + Math.random() * 6 - 3);
      const simGsr = Number((3.1 + Math.random() * 0.4 - 0.2).toFixed(2));
      const simEeg = Array.from({ length: 8 }, () => Number((Math.random() * 20 - 10).toFixed(1)));

      this.broadcastPacket({
        reactionTimeMs: simReaction,
        handGripPressureKg: simGrip,
        touchTapLatencyMs: simTap,
        heartRateBpm: simBpm,
        hrvRmssdMs: simHrv,
        gsrMicroSiemens: simGsr,
        eegChannelsRaw: simEeg,
        timestamp: Date.now()
      });
    }, 100);
  }

  // --------------------------------------------------------------------------
  // DECODIFICADOR DE TRAMAS (JSON / CSV)
  // --------------------------------------------------------------------------
  private parseIncomingPayload(rawString: string) {
    if (!rawString) return;
    try {
      if (rawString.startsWith('{') && rawString.endsWith('}')) {
        const json = JSON.parse(rawString);
        this.broadcastPacket({
          reactionTimeMs: Number(json.reaction || json.rt) || this.currentPacket.reactionTimeMs,
          handGripPressureKg: Number(json.grip || json.kg) || this.currentPacket.handGripPressureKg,
          touchTapLatencyMs: Number(json.tap || json.lat) || this.currentPacket.touchTapLatencyMs,
          heartRateBpm: Number(json.bpm) || this.currentPacket.heartRateBpm,
          hrvRmssdMs: Number(json.hrv) || this.currentPacket.hrvRmssdMs,
          gsrMicroSiemens: Number(json.gsr) || this.currentPacket.gsrMicroSiemens,
          eegChannelsRaw: json.eeg || this.currentPacket.eegChannelsRaw,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      // Ignorar fragmentos incompletos
    }
  }

  // --------------------------------------------------------------------------
  // CALIBRACIÓN CERO / BASELINE
  // --------------------------------------------------------------------------
  public executeZeroTare(): number {
    this.gripZeroOffsetKg = this.currentPacket.handGripPressureKg;
    return this.gripZeroOffsetKg;
  }

  private stopCurrentProtocol() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.serialReader) {
      try { this.serialReader.cancel(); } catch (e) {}
      this.serialReader = null;
    }
    if (this.serialPort) {
      try { this.serialPort.close(); } catch (e) {}
      this.serialPort = null;
    }
    if (this.bleServer && this.bleServer.connected) {
      try { this.bleServer.disconnect(); } catch (e) {}
    }
    if (this.webSocket) {
      try { this.webSocket.close(); } catch (e) {}
      this.webSocket = null;
    }
    this.isConnected = false;
  }

  public getCurrentPacket(): PrecisionTelemetryPacket {
    return this.currentPacket;
  }
}

function borderConnect(dev: any): boolean {
  return dev && dev.gatt && dev.gatt.connected;
}

export const telemetryService = new TelemetryManager();
