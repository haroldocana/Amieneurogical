// ============================================================================
// AMIE TELEMETRY SERVICE WITH STRICT SIMULATION TOGGLE CONTROL
// ============================================================================

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED' | 'DISCONNECTED';

export type DeviceVendorProfile = 
  | 'GENERIC_SERIAL'
  | 'ESP32_CUSTOM'
  | 'POLAR_H10'
  | 'OPENBCI_CYTON'
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
  eegChannelsRaw: number[];
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
  
  // Interruptor de simulación (por defecto OFF para evitar interferencias)
  private allowSimulation: boolean = false;

  private serialPort: any = null;
  private serialReader: any = null;
  private bleDevice: any = null;
  private bleServer: any = null;
  private webSocket: WebSocket | null = null;
  private simulationInterval: any = null;

  private gripZeroOffsetKg: number = 0;

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
    eegChannelsRaw: [0, 0, 0, 0, 0, 0, 0, 0],
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
        this.stopCurrentProtocol();
        this.setZeroStatePacket();
      }
    } else {
      if (!this.isConnected) {
        this.enableSimulation();
      }
    }
    this.notifyStatus();
  }

  public getAllowSimulation(): boolean {
    return this.allowSimulation;
  }

  private notifyStatus() {
    const status = {
      protocol: this.activeProtocol,
      connected: this.isConnected,
      deviceName: this.deviceName,
      vendor: this.activeVendor,
      allowSimulation: this.allowSimulation
    };
    this.statusListeners.forEach(fn => fn(status));
  }

  private setZeroStatePacket() {
    this.activeProtocol = 'DISCONNECTED';
    this.isConnected = false;
    this.deviceName = 'Sin Dispositivo Físico Conectado';
    this.currentPacket = {
      vendor: this.activeVendor,
      reactionTimeMs: 0,
      handGripPressureKg: 0,
      touchTapLatencyMs: 0,
      heartRateBpm: 0,
      hrvRmssdMs: 0,
      gsrMicroSiemens: 0,
      eegChannelsRaw: [0, 0, 0, 0, 0, 0, 0, 0],
      timestamp: Date.now()
    };
    this.dataListeners.forEach(fn => fn(this.currentPacket));
    this.notifyStatus();
  }

  private broadcastPacket(packet: PrecisionTelemetryPacket) {
    const calibratedGrip = Math.max(0, Number((packet.handGripPressureKg - this.gripZeroOffsetKg).toFixed(2)));
    
    this.currentPacket = {
      ...packet,
      handGripPressureKg: calibratedGrip,
      vendor: this.activeVendor
    };

    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  // --------------------------------------------------------------------------
  // CONEXIONES HARDWARE REAL
  // --------------------------------------------------------------------------
  public async connectUsb(vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM'): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      alert('Se requiere un navegador compatible con Web Serial API (Chrome/Edge).');
      return false;
    }

    try {
      this.stopCurrentProtocol();
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      this.activeProtocol = 'USB';
      this.activeVendor = vendorProfile;
      this.isConnected = true;
      this.deviceName = `${vendorProfile} (USB Serial)`;
      this.notifyStatus();

      this.startSerialLoop();
      return true;
    } catch (err) {
      console.error('Error USB:', err);
      this.handleFallbackOrDisconnect();
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
            this.parseVendorPayload(line.trim());
          }
        }
      }
    } catch (err) {
      this.handleFallbackOrDisconnect();
    }
  }

  public async connectBluetooth(vendorProfile: DeviceVendorProfile = 'POLAR_H10'): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert('Tu navegador no soporta Web Bluetooth API.');
      return false;
    }

    try {
      this.stopCurrentProtocol();

      const optionalServices: (string | number)[] = ['heart_rate', 'battery_service'];
      if (vendorProfile === 'POLAR_H10') {
        optionalServices.push('fb005c80-02c7-4c73-ba83-05780d1000b0');
      }

      this.bleDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices
      });

      this.bleServer = await this.bleDevice.gatt.connect();
      this.activeProtocol = 'BLUETOOTH';
      this.activeVendor = vendorProfile;
      this.isConnected = this.bleServer.connected;
      this.deviceName = this.bleDevice.name || `Dispositivo BLE (${vendorProfile})`;
      this.notifyStatus();

      try {
        const service = await this.bleServer.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
          this.parseGattHeartRate(e.target.value);
        });
      } catch (e) {
        console.warn('GATT Heart Rate no disponible.');
      }

      this.bleDevice.addEventListener('gattserverdisconnected', () => {
        this.handleFallbackOrDisconnect();
      });

      return true;
    } catch (err) {
      this.handleFallbackOrDisconnect();
      return false;
    }
  }

  public connectWifi(ipAddress: string = '192.168.1.105', port: number = 8080, vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM'): boolean {
    try {
      this.stopCurrentProtocol();
      const wsUrl = `ws://${ipAddress}:${port}`;
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = () => {
        this.activeProtocol = 'WIFI';
        this.activeVendor = vendorProfile;
        this.isConnected = true;
        this.deviceName = `${vendorProfile} Socket (${ipAddress})`;
        this.notifyStatus();
      };

      this.webSocket.onmessage = (event) => {
        this.parseVendorPayload(event.data);
      };

      this.webSocket.onerror = () => this.handleFallbackOrDisconnect();
      this.webSocket.onclose = () => this.handleFallbackOrDisconnect();

      return true;
    } catch (err) {
      this.handleFallbackOrDisconnect();
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // CONTROL DE SIMULACIÓN Y FALLBACK
  // --------------------------------------------------------------------------
  public enableSimulation() {
    this.stopCurrentProtocol();
    this.allowSimulation = true;
    this.activeProtocol = 'SIMULATED';
    this.isConnected = true;
    this.deviceName = 'Sensor Virtual (Modo Simulación)';
    this.notifyStatus();
    this.startSimulation();
  }

  private handleFallbackOrDisconnect() {
    if (this.allowSimulation) {
      this.enableSimulation();
    } else {
      this.setZeroStatePacket();
    }
  }

  private startSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.simulationInterval = setInterval(() => {
      if (this.activeProtocol !== 'SIMULATED' || !this.allowSimulation) return;

      this.broadcastPacket({
        vendor: 'GENERIC_SERIAL',
        reactionTimeMs: Math.floor(190 + Math.random() * 25 - 10),
        handGripPressureKg: Number((32.0 + Math.random() * 4 - 2).toFixed(1)),
        touchTapLatencyMs: Math.floor(175 + Math.random() * 20),
        heartRateBpm: Math.floor(70 + Math.random() * 6 - 3),
        hrvRmssdMs: Math.floor(36 + Math.random() * 6 - 3),
        gsrMicroSiemens: Number((3.1 + Math.random() * 0.4 - 0.2).toFixed(2)),
        eegChannelsRaw: Array.from({ length: 8 }, () => Number((Math.random() * 20 - 10).toFixed(1))),
        timestamp: Date.now()
      });
    }, 100);
  }

  private parseVendorPayload(rawString: string) {
    if (!rawString) return;
    try {
      if (rawString.startsWith('{') && rawString.endsWith('}')) {
        const json = JSON.parse(rawString);
        this.broadcastPacket({
          vendor: this.activeVendor,
          reactionTimeMs: Number(json.reaction || json.rt) || this.currentPacket.reactionTimeMs,
          handGripPressureKg: Number(json.grip || json.kg) || this.currentPacket.handGripPressureKg,
          touchTapLatencyMs: Number(json.tap || json.lat) || this.currentPacket.touchTapLatencyMs,
          heartRateBpm: Number(json.bpm || json.hr) || this.currentPacket.heartRateBpm,
          hrvRmssdMs: Number(json.hrv || json.rmssd) || this.currentPacket.hrvRmssdMs,
          gsrMicroSiemens: Number(json.gsr || json.eda) || this.currentPacket.gsrMicroSiemens,
          eegChannelsRaw: json.eeg || this.currentPacket.eegChannelsRaw,
          timestamp: Date.now()
        });
      }
    } catch (e) {}
  }

  private parseGattHeartRate(valueDataView: DataView) {
    const flags = valueDataView.getUint8(0);
    const rate16Bits = flags & 0x1;
    let bpm = rate16Bits ? valueDataView.getUint16(1, true) : valueDataView.getUint8(1);

    this.broadcastPacket({
      ...this.currentPacket,
      vendor: this.activeVendor,
      heartRateBpm: bpm,
      hrvRmssdMs: Math.round((60000 / (bpm || 70)) * 0.05 + 30)
    });
  }

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

export const telemetryService = new TelemetryManager();
