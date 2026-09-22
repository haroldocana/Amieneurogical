// ============================================================================
// AMIE TELEMETRY SERVICE - ARQUITECTURA MULTIMODAL (SOPORTE EEG 16 CANALES)
// ============================================================================

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED' | 'DISCONNECTED';

export type DeviceVendorProfile = 
  | 'GENERIC_SERIAL'
  | 'ESP32_CUSTOM'
  | 'POLAR_H10'
  | 'COLMI_SMART_RING'
  | 'OPENBCI_CYTON'
  | 'OPENBCI_CYTON_DAISY' // <-- Nuevo perfil de Alta Densidad (16-Ch)
  | 'BITALINO_PLUX'
  | 'GENERIC_BLE_HRM'
  | 'EMOTIV_CORTEX_WS';

export interface PrecisionTelemetryPacket {
  vendor: DeviceVendorProfile;
  reactionTimeMs: number;
  handGripPressureKg: number;
  touchTapLatencyMs: number;
  heartRateBpm: number;
  hrvRmssdMs: number;
  gsrMicroSiemens: number;
  eegChannelsRaw: number[]; // Array dinámico de hasta 16 canales
  timestamp: number;
}

type TelemetryCallback = (data: PrecisionTelemetryPacket) => void;
type StatusCallback = (status: { 
  protocol: TelemetryProtocol; 
  connected: boolean; 
  deviceName: string; 
  vendor: DeviceVendorProfile;
  allowSimulation: boolean;
}) => void;

class TelemetryManager {
  private activeProtocol: TelemetryProtocol = 'DISCONNECTED';
  private activeVendor: DeviceVendorProfile = 'GENERIC_SERIAL';
  private isConnected: boolean = false;
  private deviceName: string = 'Sin Dispositivo Conectado';
  private allowSimulation: boolean = false;

  private serialPort: any = null;
  private serialReader: any = null;
  private bleDevice: any = null;
  private bleServer: any = null;
  private webSocket: WebSocket | null = null;
  private simulationInterval: any = null;

  private gripZeroOffsetKg: number = 0;
  private rrHistoryMs: number[] = [];

  private dataListeners: Set<TelemetryCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();

  private currentPacket: PrecisionTelemetryPacket = {
    vendor: 'GENERIC_SERIAL',
    reactionTimeMs: 0,
    handGripPressureKg: 0,
    touchTapLatencyMs: 0,
    heartRateBpm: 0,
    hrvRmssdMs: 0,
    gsrMicroSiemens: 0,
    eegChannelsRaw: new Array(16).fill(0), // Inicializado para 16 canales base
    timestamp: Date.now()
  };

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

  public setAllowSimulation(enable: boolean) {
    this.allowSimulation = enable;
    if (!enable) {
      if (this.activeProtocol === 'SIMULATED') {
        this.disconnect();
      }
    } else if (!this.isConnected) {
      this.enableSimulation();
    }
    this.notifyStatus();
  }

  public getAllowSimulation(): boolean {
    return this.allowSimulation;
  }

  private notifyStatus() {
    this.statusListeners.forEach(fn => fn({
      protocol: this.activeProtocol,
      connected: this.isConnected,
      deviceName: this.deviceName,
      vendor: this.activeVendor,
      allowSimulation: this.allowSimulation
    }));
  }

  // --- (Conexiones BLE, USB y WIFI permanecen igual que en la versión anterior) ---
  public async connectBluetooth(vendorProfile: DeviceVendorProfile = 'GENERIC_BLE_HRM'): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) return false;
    try {
      this.stopCurrentProtocol();
      const optionalServices: (string | number)[] = [
        'heart_rate', 'battery_service', 'health_thermometer',
        0x180D, 0x180F, 0x2A37, 0xFFE0, 0xFFF0, 0xFEE0, 0xFEE7, '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
      ];
      this.bleDevice = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true, optionalServices });
      this.bleServer = await this.bleDevice.gatt.connect();
      this.activeProtocol = 'BLUETOOTH';
      this.activeVendor = vendorProfile;
      this.isConnected = true;
      this.deviceName = this.bleDevice.name || `Sensor BLE (${vendorProfile})`;
      this.notifyStatus();

      const services = await this.bleServer.getPrimaryServices();
      let rxSubscribed = false;
      for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.notify || char.properties.indicate) {
            try {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (e: any) => this.parseBLEPayloadUniversal(e.target.value));
              rxSubscribed = true;
            } catch (err) { }
          }
        }
      }
      this.bleDevice.addEventListener('gattserverdisconnected', () => this.disconnect());
      return rxSubscribed;
    } catch (err) { this.disconnect(); return false; }
  }

  public async connectUsb(vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM'): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) return false;
    try {
      this.stopCurrentProtocol();
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });
      this.activeProtocol = 'USB';
      this.activeVendor = vendorProfile;
      this.isConnected = true;
      this.deviceName = `${vendorProfile} (USB Directo)`;
      this.notifyStatus();
      this.startSerialReadLoop();
      return true;
    } catch (err) { this.disconnect(); return false; }
  }

  private async startSerialReadLoop() {
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
          for (const line of lines) this.parseTextPayloadUniversal(line.trim());
        }
      }
    } catch (err) { this.disconnect(); }
  }

  public connectWifi(ipAddress: string = '192.168.1.105', port: number = 8080, vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM'): boolean {
    try {
      this.stopCurrentProtocol();
      this.webSocket = new WebSocket(`ws://${ipAddress}:${port}`);
      this.webSocket.onopen = () => {
        this.activeProtocol = 'WIFI';
        this.activeVendor = vendorProfile;
        this.isConnected = true;
        this.deviceName = `Socket Wi-Fi (${ipAddress})`;
        this.notifyStatus();
      };
      this.webSocket.onmessage = (event) => this.parseTextPayloadUniversal(event.data);
      this.webSocket.onerror = () => this.disconnect();
      this.webSocket.onclose = () => this.disconnect();
      return true;
    } catch (err) { this.disconnect(); return false; }
  }

  // --- PARSERS UNIVERSALES ---
  private parseBLEPayloadUniversal(dataView: DataView) {
    const len = dataView.byteLength;
    if (len === 0) return;
    let detectedBpm = 0;
    const now = Date.now();
    if (len <= 4) {
      const flags = dataView.getUint8(0);
      detectedBpm = (flags & 0x1) ? dataView.getUint16(1, true) : dataView.getUint8(1);
    } else {
      for (let i = 0; i < len; i++) {
        const val = dataView.getUint8(i);
        if (val >= 40 && val <= 210) { detectedBpm = val; break; }
      }
    }
    if (detectedBpm >= 35 && detectedBpm <= 220) this.processHeartRateBpm(detectedBpm, now);
  }

  private parseTextPayloadUniversal(text: string) {
    if (!text) return;
    const now = Date.now();
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const json = JSON.parse(text);
        const bpm = Number(json.bpm || json.hr || json.heartRate) || 0;
        const gsr = Number(json.gsr || json.eda || json.microSiemens) || this.currentPacket.gsrMicroSiemens;
        const grip = Number(json.grip || json.kg) || this.currentPacket.handGripPressureKg;
        const rt = Number(json.rt || json.reactionTime) || this.currentPacket.reactionTimeMs;
        // Soporte dinámico para hasta 16 canales
        const eeg = Array.isArray(json.eeg) ? json.eeg : this.currentPacket.eegChannelsRaw;

        if (bpm > 0) this.processHeartRateBpm(bpm, now);

        this.updatePacketAndBroadcast({
          ...this.currentPacket, gsrMicroSiemens: gsr, handGripPressureKg: grip, reactionTimeMs: rt, eegChannelsRaw: eeg, timestamp: now
        });
        return;
      } catch (e) {}
    }
  }

  private processHeartRateBpm(bpm: number, timestamp: number) {
    const rrMs = 60000 / bpm;
    this.rrHistoryMs.push(rrMs);
    if (this.rrHistoryMs.length > 30) this.rrHistoryMs.shift();

    let sumSquaredDiffs = 0;
    if (this.rrHistoryMs.length > 1) {
      for (let i = 0; i < this.rrHistoryMs.length - 1; i++) {
        const diff = this.rrHistoryMs[i + 1] - this.rrHistoryMs[i];
        sumSquaredDiffs += diff * diff;
      }
      this.currentPacket.hrvRmssdMs = Math.round(Math.sqrt(sumSquaredDiffs / (this.rrHistoryMs.length - 1)));
    } else {
      this.currentPacket.hrvRmssdMs = Math.round(rrMs * 0.06);
    }
    this.currentPacket.heartRateBpm = bpm;
    this.currentPacket.timestamp = timestamp;
    this.updatePacketAndBroadcast(this.currentPacket);
  }

  private updatePacketAndBroadcast(packet: PrecisionTelemetryPacket) {
    const calibratedGrip = Math.max(0, Number((packet.handGripPressureKg - this.gripZeroOffsetKg).toFixed(1)));
    this.currentPacket = { ...packet, handGripPressureKg: calibratedGrip, vendor: this.activeVendor };
    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  // --- MODO SIMULACIÓN PARA 16 CANALES ---
  public enableSimulation() {
    this.stopCurrentProtocol();
    this.allowSimulation = true;
    this.activeProtocol = 'SIMULATED';
    this.isConnected = true;
    this.deviceName = 'Sensor Virtual Alta Densidad (16-Ch)';
    this.notifyStatus();

    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.simulationInterval = setInterval(() => {
      if (this.activeProtocol !== 'SIMULATED' || !this.allowSimulation) return;
      const simBpm = Math.floor(68 + Math.random() * 8 - 4);
      this.processHeartRateBpm(simBpm, Date.now());

      // Generación simulada de alta velocidad para 16 CANALES EEG
      const sim16Ch = Array.from({ length: 16 }, () => Number((Math.random() * 60 - 30).toFixed(1)));

      this.updatePacketAndBroadcast({
        ...this.currentPacket,
        handGripPressureKg: Number((31.5 + Math.random() * 2 - 1).toFixed(1)),
        reactionTimeMs: Math.floor(195 + Math.random() * 20),
        touchTapLatencyMs: Math.floor(180 + Math.random() * 15),
        gsrMicroSiemens: Number((2.8 + Math.random() * 0.4 - 0.2).toFixed(2)),
        eegChannelsRaw: sim16Ch,
        timestamp: Date.now()
      });
    }, 150);
  }

  public disconnect() {
    this.stopCurrentProtocol();
    this.activeProtocol = 'DISCONNECTED';
    this.isConnected = false;
    this.deviceName = 'Sin Dispositivo Conectado';
    this.currentPacket = {
      vendor: this.activeVendor, reactionTimeMs: 0, handGripPressureKg: 0, touchTapLatencyMs: 0, 
      heartRateBpm: 0, hrvRmssdMs: 0, gsrMicroSiemens: 0, eegChannelsRaw: new Array(16).fill(0), timestamp: Date.now()
    };
    this.rrHistoryMs = [];
    this.notifyStatus();
    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  private stopCurrentProtocol() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.serialReader) { try { this.serialReader.cancel(); } catch (e) {} this.serialReader = null; }
    if (this.serialPort) { try { this.serialPort.close(); } catch (e) {} this.serialPort = null; }
    if (this.bleServer && this.bleServer.connected) { try { this.bleServer.disconnect(); } catch (e) {} }
    if (this.webSocket) { try { this.webSocket.close(); } catch (e) {} this.webSocket = null; }
    this.isConnected = false;
  }

  public executeZeroTare(): number { this.gripZeroOffsetKg = this.currentPacket.handGripPressureKg; return this.gripZeroOffsetKg; }
  public getCurrentPacket(): PrecisionTelemetryPacket { return this.currentPacket; }
}

export const telemetryService = new TelemetryManager();
