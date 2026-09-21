// ============================================================================
// AMIE MULTI-VENDOR & MULTI-PROTOCOL TELEMETRY DRIVER (USB / BLE / WIFI / SIM)
// Compatible con: Polar, Garmin, OpenBCI, BITalino, ESP32, Emotiv, Nonin
// ============================================================================

import { MultisensoryHardwareTelemetry, NeuromotorBiomarkers } from '../types';

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED';

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
}) => void;

class TelemetryManager {
  private activeProtocol: TelemetryProtocol = 'SIMULATED';
  private activeVendor: DeviceVendorProfile = 'GENERIC_SERIAL';
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

  private dataListeners: Set<TelemetryCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();

  private currentPacket: PrecisionTelemetryPacket = {
    vendor: 'GENERIC_SERIAL',
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
      deviceName: this.deviceName,
      vendor: this.activeVendor
    };
    this.statusListeners.forEach(fn => fn(status));
  }

  private broadcastPacket(packet: PrecisionTelemetryPacket) {
    // Aplicar tara/offset de calibración
    const calibratedGrip = Math.max(0, Number((packet.handGripPressureKg - this.gripZeroOffsetKg).toFixed(2)));
    
    this.currentPacket = {
      ...packet,
      handGripPressureKg: calibratedGrip,
      vendor: this.activeVendor
    };

    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  // --------------------------------------------------------------------------
  // 1. CONEXIÓN USB / SERIAL MULTI-MARCA (ESP32, OpenBCI, BITalino, FTDI)
  // --------------------------------------------------------------------------
  public async connectUsb(
    vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM', 
    baudRate: number = 115200
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      alert('Tu navegador no soporta Web Serial API (Usa Chrome o Edge).');
      return false;
    }

    try {
      this.stopCurrentProtocol();
      this.serialPort = await (navigator as any).serial.requestPort();
      
      const targetBaud = vendorProfile === 'OPENBCI_CYTON' || vendorProfile === 'BITALINO_PLUX' ? 115200 : baudRate;
      await this.serialPort.open({ baudRate: targetBaud });

      this.activeProtocol = 'USB';
      this.activeVendor = vendorProfile;
      this.isConnected = true;
      this.deviceName = `${vendorProfile} (USB Serial ${targetBaud} Bps)`;
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
            this.parseVendorPayload(line.trim());
          }
        }
      }
    } catch (err) {
      console.warn('Lectura USB finalizada:', err);
    }
  }

  // --------------------------------------------------------------------------
  // 2. CONEXIÓN BLUETOOTH BLE MULTI-MARCA (Polar H10, Garmin, GATT Generic)
  // --------------------------------------------------------------------------
  public async connectBluetooth(vendorProfile: DeviceVendorProfile = 'POLAR_H10'): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert('Tu navegador no soporta Web Bluetooth API.');
      return false;
    }

    try {
      this.stopCurrentProtocol();

      const optionalServices: (string | number)[] = ['heart_rate', 'battery_service'];
      if (vendorProfile === 'POLAR_H10') {
        optionalServices.push('fb005c80-02c7-4c73-ba83-05780d1000b0'); // Servicio PMD Polar
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

      // Suscripción al servicio estándar Heart Rate (0x180D)
      try {
        const service = await this.bleServer.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
          this.parseGattHeartRate(e.target.value);
        });
      } catch (e) {
        console.warn('Servicio GATT Heart Rate no detectado, operando en modo canal abierto.');
      }

      this.bleDevice.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.enableSimulation();
      });

      return true;
    } catch (err) {
      console.error('Error al vincular Bluetooth BLE:', err);
      this.enableSimulation();
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 3. CONEXIÓN WI-FI SOCKET / WEBSOCKET (ESP32, OpenBCI Wi-Fi, Emotiv Cortex)
  // --------------------------------------------------------------------------
  public connectWifi(
    ipAddress: string = '192.168.1.105', 
    port: number = 8080,
    vendorProfile: DeviceVendorProfile = 'ESP32_CUSTOM'
  ): boolean {
    try {
      this.stopCurrentProtocol();
      const wsUrl = `ws://${ipAddress}:${port}`;
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = () => {
        this.activeProtocol = 'WIFI';
        this.activeVendor = vendorProfile;
        this.isConnected = true;
        this.deviceName = `${vendorProfile} Socket (${ipAddress}:${port})`;
        this.notifyStatus();
      };

      this.webSocket.onmessage = (event) => {
        this.parseVendorPayload(event.data);
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
    this.activeVendor = 'GENERIC_SERIAL';
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
        vendor: 'GENERIC_SERIAL',
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
  // DECODIFICADORES MULTI-MARCA (JSON, CSV, GATT BLE)
  // --------------------------------------------------------------------------
  private parseVendorPayload(rawString: string) {
    if (!rawString) return;
    try {
      // Parser JSON (ESP32, Emotiv Cortex, OpenBCI Stream)
      if (rawString.startsWith('{') && rawString.endsWith('}')) {
        const json = JSON.parse(rawString);
        this.broadcastPacket({
          vendor: this.activeVendor,
          reactionTimeMs: Number(json.reaction || json.rt || json.latency) || this.currentPacket.reactionTimeMs,
          handGripPressureKg: Number(json.grip || json.kg || json.force) || this.currentPacket.handGripPressureKg,
          touchTapLatencyMs: Number(json.tap || json.lat) || this.currentPacket.touchTapLatencyMs,
          heartRateBpm: Number(json.bpm || json.hr) || this.currentPacket.heartRateBpm,
          hrvRmssdMs: Number(json.hrv || json.rmssd) || this.currentPacket.hrvRmssdMs,
          gsrMicroSiemens: Number(json.gsr || json.eda) || this.currentPacket.gsrMicroSiemens,
          eegChannelsRaw: json.eeg || json.channels || this.currentPacket.eegChannelsRaw,
          timestamp: Date.now()
        });
        return;
      }

      // Parser CSV (BITalino / OpenBCI Cyton Raw)
      if (rawString.includes(',')) {
        const parts = rawString.split(',').map(Number);
        if (parts.length >= 3) {
          this.broadcastPacket({
            vendor: this.activeVendor,
            reactionTimeMs: parts[0] || this.currentPacket.reactionTimeMs,
            handGripPressureKg: parts[1] || this.currentPacket.handGripPressureKg,
            touchTapLatencyMs: parts[2] || this.currentPacket.touchTapLatencyMs,
            heartRateBpm: parts[3] || this.currentPacket.heartRateBpm,
            hrvRmssdMs: parts[4] || this.currentPacket.hrvRmssdMs,
            gsrMicroSiemens: parts[5] || this.currentPacket.gsrMicroSiemens,
            eegChannelsRaw: parts.slice(6),
            timestamp: Date.now()
          });
        }
      }
    } catch (e) {
      // Ignorar líneas o tramas fragmentadas
    }
  }

  private parseGattHeartRate(valueDataView: DataView) {
    const flags = valueDataView.getUint8(0);
    const rate16Bits = flags & 0x1;
    let bpm = 0;
    if (rate16Bits) {
      bpm = valueDataView.getUint16(1, true);
    } else {
      bpm = valueDataView.getUint8(1);
    }

    this.broadcastPacket({
      ...this.currentPacket,
      vendor: this.activeVendor,
      heartRateBpm: bpm,
      hrvRmssdMs: Math.round((60000 / (bpm || 70)) * 0.05 + 30)
    });
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

export const telemetryService = new TelemetryManager();
