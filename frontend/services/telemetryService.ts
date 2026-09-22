// ============================================================================
// AMIE TELEMETRY SERVICE - ENGINE CON FILTRO EMA (SUAVIZADO DE JITTER)
// ============================================================================

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED' | 'DISCONNECTED';

export type DeviceVendorProfile = 
  | 'GENERIC_SERIAL'
  | 'ESP32_CUSTOM'
  | 'POLAR_H10'
  | 'COLMI_SMART_RING'
  | 'OPENBCI_CYTON'
  | 'OPENBCI_CYTON_DAISY'
  | 'BITALINO_PLUX'
  | 'GENERIC_BLE_HRM';

export interface PrecisionTelemetryPacket {
  vendor: DeviceVendorProfile;
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
type StatusCallback = (status: { 
  protocol: TelemetryProtocol; 
  connected: boolean; 
  deviceName: string; 
  vendor: DeviceVendorProfile;
}) => void;

class TelemetryManager {
  private activeProtocol: TelemetryProtocol = 'DISCONNECTED';
  private activeVendor: DeviceVendorProfile = 'GENERIC_SERIAL';
  private isConnected: boolean = false;
  private deviceName: string = 'Sin Dispositivo Conectado';

  private serialPort: any = null;
  private serialReader: any = null;
  private bleDevice: any = null;
  private bleServer: any = null;
  private webSocket: WebSocket | null = null;
  
  private activeStreamTimer: any = null;
  private gripZeroOffsetKg: number = 0;

  // Valores objetivo y suavizados mediante filtro de media móvil exponencial (EMA)
  private rawBpm: number = 72;
  private smoothedBpm: number = 72;
  
  private rawHrv: number = 42;
  private smoothedHrv: number = 42;

  private rawGsr: number = 3.22;
  private smoothedGsr: number = 3.22;

  private lastRaw16Eeg: number[] = new Array(16).fill(0);

  private dataListeners: Set<TelemetryCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();

  private currentPacket: PrecisionTelemetryPacket = {
    vendor: 'GENERIC_SERIAL',
    reactionTimeMs: 195,
    handGripPressureKg: 32.0,
    touchTapLatencyMs: 180,
    heartRateBpm: 0,
    hrvRmssdMs: 0,
    gsrMicroSiemens: 0,
    eegChannelsRaw: new Array(16).fill(0),
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

  private notifyStatus() {
    this.statusListeners.forEach(fn => fn({
      protocol: this.activeProtocol,
      connected: this.isConnected,
      deviceName: this.deviceName,
      vendor: this.activeVendor
    }));
  }

  public async connectBluetooth(vendorProfile: DeviceVendorProfile = 'COLMI_SMART_RING'): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) return false;

    try {
      this.disconnect();
      const optionalServices: (string | number)[] = [
        'heart_rate', 'battery_service', 'health_thermometer',
        0x180D, 0x180F, 0x2A37, 0xFFE0, 0xFFF0, 0xFEE0, 0xFEE7,
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
      ];

      this.bleDevice = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true, optionalServices });
      this.bleServer = await this.bleDevice.gatt.connect();
      this.activeProtocol = 'BLUETOOTH';
      this.activeVendor = vendorProfile;
      this.isConnected = true;
      this.deviceName = this.bleDevice.name || `Sensor BLE (${vendorProfile})`;
      this.notifyStatus();

      const services = await this.bleServer.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.notify || char.properties.indicate) {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (e: any) => this.parseBLEPayload(e.target.value));
            }
          }
        } catch (e) {}
      }

      this.bleDevice.addEventListener('gattserverdisconnected', () => this.disconnect());
      this.startActiveStreamLoop();
      return true;
    } catch (err) {
      this.disconnect();
      return false;
    }
  }

  public async connectUsb(vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM'): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) return false;
    try {
      this.disconnect();
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      this.activeProtocol = 'USB';
      this.activeVendor = vendorProfile;
      this.isConnected = true;
      this.deviceName = `${vendorProfile} (USB Directo)`;
      this.notifyStatus();

      this.startSerialReadLoop();
      this.startActiveStreamLoop();
      return true;
    } catch (err) {
      this.disconnect();
      return false;
    }
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
          for (const line of lines) this.parseTextPayload(line.trim());
        }
      }
    } catch (err) {
      this.disconnect();
    }
  }

  public connectWifi(ipAddress: string = '192.168.1.105', port: number = 8080, vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM'): boolean {
    try {
      this.disconnect();
      this.webSocket = new WebSocket(`ws://${ipAddress}:${port}`);
      this.webSocket.onopen = () => {
        this.activeProtocol = 'WIFI';
        this.activeVendor = vendorProfile;
        this.isConnected = true;
        this.deviceName = `Socket Wi-Fi (${ipAddress})`;
        this.notifyStatus();
        this.startActiveStreamLoop();
      };
      this.webSocket.onmessage = (event) => this.parseTextPayload(event.data);
      this.webSocket.onerror = () => this.disconnect();
      this.webSocket.onclose = () => this.disconnect();
      return true;
    } catch (err) {
      this.disconnect();
      return false;
    }
  }

  public enableSimulation() {
    this.disconnect();
    this.activeProtocol = 'SIMULATED';
    this.activeVendor = 'GENERIC_SERIAL';
    this.isConnected = true;
    this.deviceName = 'Sensor Virtual (Modo Simulación)';
    this.notifyStatus();
    this.startActiveStreamLoop();
  }

  private parseBLEPayload(dataView: DataView) {
    const len = dataView.byteLength;
    if (len === 0) return;

    for (let i = 0; i < len; i++) {
      const val = dataView.getUint8(i);
      if (val >= 45 && val <= 190) {
        this.rawBpm = val;
        this.rawHrv = Math.round((60000 / val) * 0.06);
        break;
      }
    }
  }

  private parseTextPayload(text: string) {
    if (!text) return;
    try {
      if (text.startsWith('{') && text.endsWith('}')) {
        const json = JSON.parse(text);
        if (json.bpm) this.rawBpm = Number(json.bpm);
        if (json.hrv) this.rawHrv = Number(json.hrv);
        if (json.gsr) this.rawGsr = Number(json.gsr);
        if (Array.isArray(json.eeg)) this.lastRaw16Eeg = json.eeg;
      }
    } catch (e) {}
  }

  private startActiveStreamLoop() {
    if (this.activeStreamTimer) clearInterval(this.activeStreamTimer);

    // Mantenemos streaming de datos a 35Hz para el gráfico de Canvas,
    // pero aplicamos un filtro de paso bajo (Alpha = 0.08) para eliminar la vibración brusca de números
    this.activeStreamTimer = setInterval(() => {
      if (!this.isConnected) return;

      const alpha = 0.08; // Factor de suavizado

      if (this.activeProtocol === 'SIMULATED') {
        const targetBpm = 71;
        const targetHrv = 43;
        const targetGsr = 3.22;

        this.smoothedBpm += (targetBpm + (Math.random() * 2 - 1) - this.smoothedBpm) * alpha;
        this.smoothedHrv += (targetHrv + (Math.random() * 2 - 1) - this.smoothedHrv) * alpha;
        this.smoothedGsr += (targetGsr + (Math.random() * 0.04 - 0.02) - this.smoothedGsr) * alpha;
      } else {
        this.smoothedBpm += (this.rawBpm - this.smoothedBpm) * alpha;
        this.smoothedHrv += (this.rawHrv - this.smoothedHrv) * alpha;
        this.smoothedGsr += (this.rawGsr - this.smoothedGsr) * alpha;
      }

      this.currentPacket = {
        vendor: this.activeVendor,
        reactionTimeMs: 195,
        handGripPressureKg: Math.max(0, Number((31.5 - this.gripZeroOffsetKg).toFixed(1))),
        touchTapLatencyMs: 180,
        heartRateBpm: Math.round(this.smoothedBpm),
        hrvRmssdMs: Math.round(this.smoothedHrv),
        gsrMicroSiemens: Number(this.smoothedGsr.toFixed(2)),
        eegChannelsRaw: this.lastRaw16Eeg,
        timestamp: Date.now()
      };

      this.dataListeners.forEach(fn => fn(this.currentPacket));
    }, 28);
  }

  public disconnect() {
    if (this.activeStreamTimer) clearInterval(this.activeStreamTimer);
    if (this.serialReader) { try { this.serialReader.cancel(); } catch (e) {} this.serialReader = null; }
    if (this.serialPort) { try { this.serialPort.close(); } catch (e) {} this.serialPort = null; }
    if (this.bleServer && this.bleServer.connected) { try { this.bleServer.disconnect(); } catch (e) {} }
    if (this.webSocket) { try { this.webSocket.close(); } catch (e) {} this.webSocket = null; }

    this.activeProtocol = 'DISCONNECTED';
    this.isConnected = false;
    this.deviceName = 'Sin Dispositivo Conectado';

    this.currentPacket = {
      vendor: this.activeVendor,
      reactionTimeMs: 0,
      handGripPressureKg: 0,
      touchTapLatencyMs: 0,
      heartRateBpm: 0,
      hrvRmssdMs: 0,
      gsrMicroSiemens: 0,
      eegChannelsRaw: new Array(16).fill(0),
      timestamp: Date.now()
    };

    this.notifyStatus();
    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  public executeZeroTare(): number {
    this.gripZeroOffsetKg = 31.5;
    return this.gripZeroOffsetKg;
  }

  public getCurrentPacket(): PrecisionTelemetryPacket {
    return this.currentPacket;
  }
}

export const telemetryService = new TelemetryManager();
