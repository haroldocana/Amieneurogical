// ============================================================================
// AMIE TELEMETRY SERVICE - ARQUITECTURA MULTI-PERFIL (GEOID ECG vs COLMI PPG)
// ============================================================================

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED' | 'DISCONNECTED';
export type BleDeviceProfile = 'GEOID_ECG' | 'COLMI_RING' | 'GENERIC_BLE';

export interface PrecisionTelemetryPacket {
  reactionTimeMs: number;
  handGripPressureKg: number;
  touchTapLatencyMs: number;
  heartRateBpm: number;
  hrvRmssdMs: number;
  gsrMicroSiemens: number;
  rrIntervalMs: number;
  timestamp: number;
}

type TelemetryCallback = (data: PrecisionTelemetryPacket) => void;
type StatusCallback = (status: { 
  protocol: TelemetryProtocol; 
  connected: boolean; 
  deviceName: string;
  profile?: BleDeviceProfile;
}) => void;

class TelemetryManager {
  private activeProtocol: TelemetryProtocol = 'DISCONNECTED';
  private activeProfile: BleDeviceProfile = 'GENERIC_BLE';
  private isConnected: boolean = false;
  private deviceName: string = 'Sin Dispositivo Conectado';

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
    reactionTimeMs: 0,
    handGripPressureKg: 0,
    touchTapLatencyMs: 0,
    heartRateBpm: 0,
    hrvRmssdMs: 0,
    gsrMicroSiemens: 0,
    rrIntervalMs: 0,
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
      profile: this.activeProfile
    }));
  }

  // --------------------------------------------------------------------------
  // 1. ENLACE BLUETOOTH CON RECONOCIMIENTO AUTOMÁTICO DE PERFIL DE DISPOSITIVO
  // --------------------------------------------------------------------------
  public async connectBluetooth(): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert('Navegador incompatible con Web Bluetooth API.');
      return false;
    }

    try {
      this.disconnect();
      
      const bleDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate',
          0x180D,
          '0000180d-0000-1000-8000-00805f9b34fb',
          'device_information',
          0x180A,
          'battery_service'
        ]
      });

      this.bleServer = await bleDevice.gatt.connect();
      this.bleDevice = bleDevice;
      this.activeProtocol = 'BLUETOOTH';
      this.isConnected = true;
      const rawName = (bleDevice.name || 'Sensor BLE').toUpperCase();
      this.deviceName = bleDevice.name || 'Sensor BLE';

      // 🔍 DETECCIÓN Y ASIGNACIÓN DE PERFIL DEDICADO
      if (rawName.includes('GEOID') || rawName.includes('HS500') || rawName.includes('POLAR')) {
        this.activeProfile = 'GEOID_ECG';
      } else if (rawName.includes('COLMI') || rawName.includes('RING') || rawName.includes('R10') || rawName.includes('SMART')) {
        this.activeProfile = 'COLMI_RING';
      } else {
        this.activeProfile = 'GENERIC_BLE';
      }

      this.notifyStatus();

      // Búsqueda del servicio de frecuencia cardíaca
      let service: any = null;
      try {
        service = await this.bleServer.getPrimaryService('heart_rate');
      } catch (e1) {
        try {
          service = await this.bleServer.getPrimaryService(0x180D);
        } catch (e2) {
          const allServices = await this.bleServer.getPrimaryServices();
          service = allServices.find((s: any) => s.uuid.toLowerCase().includes('180d')) || allServices[0];
        }
      }

      if (!service) throw new Error('No se encontró servicio GATT de ritmo cardíaco.');

      let characteristic: any = null;
      try {
        characteristic = await service.getCharacteristic('heart_rate_measurement');
      } catch (c1) {
        try {
          characteristic = await service.getCharacteristic(0x2A37);
        } catch (c2) {
          const chars = await service.getCharacteristics();
          characteristic = chars.find((c: any) => c.properties.notify || c.properties.indicate);
        }
      }

      if (!characteristic) throw new Error('Característica de pulso no encontrada.');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
        const dataView: DataView = e.target.value;
        if (!dataView || dataView.byteLength < 2) return;

        // 🔀 ENRUTAMIENTO SEGÚN EL PERFIL DEL DISPOSITIVO CONECTADO
        if (this.activeProfile === 'GEOID_ECG') {
          this.parseGeoidEcgPacket(dataView);
        } else if (this.activeProfile === 'COLMI_RING') {
          this.parseColmiRingPacket(dataView);
        } else {
          this.parseGenericBlePacket(dataView);
        }
      });

      bleDevice.addEventListener('gattserverdisconnected', () => this.disconnect());

      return true;
    } catch (err: any) {
      console.error('Fallo en enlace BLE:', err);
      this.disconnect();
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // A) PARSER ESPECIALIZADO: BANDA PECTORAL GEOID HS500 (ECG DE ALTA PRECISIÓN)
  // --------------------------------------------------------------------------
  private parseGeoidEcgPacket(dataView: DataView) {
    const flags = dataView.getUint8(0);
    const hrFormat16Bit = (flags & 0x01) !== 0;
    const sensorContactStatus = (flags >> 1) & 0x03;
    const energyPresent = (flags >> 3) & 0x01;
    const rrPresent = (flags >> 4) & 0x01;

    // La Geoid HS500 usa el sensor de contacto biopotencial real
    if (sensorContactStatus === 2) { // 2 = Sin contacto con la piel (Off-Body)
      this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens);
      return;
    }

    let bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
    let offset = hrFormat16Bit ? 3 : 2;
    if (energyPresent) offset += 2;

    const rrValues: number[] = [];
    if (rrPresent) {
      // Extrae todos los intervalos R-R nativos por milisegundo emitidos por la banda ECG
      while (offset + 1 < dataView.byteLength) {
        const rr1024 = dataView.getUint16(offset, true);
        const rrMs = Math.round((rr1024 / 1024) * 1000);
        if (rrMs >= 300 && rrMs <= 2000) {
          rrValues.push(rrMs);
        }
        offset += 2;
      }
    }

    if (rrValues.length === 0 && bpm > 30) {
      rrValues.push(Math.round(60000 / bpm));
    }

    this.processRealHardwareData(bpm, rrValues, this.currentPacket.gsrMicroSiemens);
  }

  // --------------------------------------------------------------------------
  // B) PARSER ESPECIALIZADO: ANILLO INTELIGENTE COLMI (PPG ÓPTICO DEDO)
  // --------------------------------------------------------------------------
  private parseColmiRingPacket(dataView: DataView) {
    const flags = dataView.getUint8(0);
    const hrFormat16Bit = (flags & 0x01) !== 0;

    // En el Colmi R10 se IGNORA el bit de contacto GATT porque el firmware del chip chino
    // reporta flags inválidos. Determinamos presencia 100% por el valor del BPM del PPG.
    let bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);

    if (bpm < 35 || bpm > 220) {
      // Si el sensor óptico no detecta flujo sanguíneo real, mandamos flatline
      this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens);
      return;
    }

    // El anillo envía tramas de frecuencia cardíaca óptica. Si incluye R-R las leemos,
    // de lo contrario calculamos el tacograma sintético basado en la frecuencia óptica.
    const rrValues: number[] = [];
    const energyPresent = (flags >> 3) & 0x01;
    const rrPresent = (flags >> 4) & 0x01;
    let offset = hrFormat16Bit ? 3 : 2;
    if (energyPresent) offset += 2;

    if (rrPresent && offset + 1 < dataView.byteLength) {
      while (offset + 1 < dataView.byteLength) {
        const rr1024 = dataView.getUint16(offset, true);
        const rrMs = Math.round((rr1024 / 1024) * 1000);
        if (rrMs >= 300 && rrMs <= 2000) rrValues.push(rrMs);
        offset += 2;
      }
    }

    if (rrValues.length === 0) {
      rrValues.push(Math.round(60000 / bpm));
    }

    this.processRealHardwareData(bpm, rrValues, this.currentPacket.gsrMicroSiemens);
  }

  // --------------------------------------------------------------------------
  // C) PARSER GENÉRICO BACKUP
  // --------------------------------------------------------------------------
  private parseGenericBlePacket(dataView: DataView) {
    const flags = dataView.getUint8(0);
    const hrFormat16Bit = (flags & 0x01) !== 0;
    let bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
    
    if (bpm < 30 || bpm > 220) {
      this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens);
      return;
    }

    this.processRealHardwareData(bpm, [Math.round(60000 / bpm)], this.currentPacket.gsrMicroSiemens);
  }

  // --------------------------------------------------------------------------
  // 2. CONEXIÓN USB SERIAL (ESP32)
  // --------------------------------------------------------------------------
  public async connectUsb(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) return false;
    try {
      this.disconnect();
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      this.activeProtocol = 'USB';
      this.isConnected = true;
      this.deviceName = 'Microcontrolador ESP32 (USB)';
      this.notifyStatus();
      this.startSerialReadLoop();
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
          
          for (const line of lines) {
            const text = line.trim();
            if (!text) continue;
            try {
              if (text.startsWith('{')) {
                const json = JSON.parse(text);
                const bpm = Number(json.bpm || json.hr) || 0;
                const rr = Number(json.rr || json.ibi) || (bpm > 0 ? 60000 / bpm : 0);
                this.processRealHardwareData(bpm, [rr], this.currentPacket.gsrMicroSiemens);
              } else if (text.includes(',')) {
                const parts = text.split(',');
                const bpm = parseFloat(parts[0]) || 0;
                const rr = parseFloat(parts[1]) || (bpm > 0 ? 60000 / bpm : 0);
                this.processRealHardwareData(bpm, [rr], this.currentPacket.gsrMicroSiemens);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      this.disconnect();
    }
  }

  // --------------------------------------------------------------------------
  // 3. CONEXIÓN WI-FI WEBSOCKET
  // --------------------------------------------------------------------------
  public connectWifi(ipAddress: string) {
    this.disconnect();
    try {
      this.webSocket = new WebSocket(`ws://${ipAddress}:8080`);
      this.webSocket.onopen = () => {
        this.activeProtocol = 'WIFI';
        this.isConnected = true;
        this.deviceName = `Módulo TCP/IP (${ipAddress})`;
        this.notifyStatus();
      };
      this.webSocket.onmessage = (event) => {
         try {
           const json = JSON.parse(event.data);
           const bpm = Number(json.bpm) || 0;
           const rr = Number(json.rr) || (bpm > 0 ? 60000 / bpm : 0);
           this.processRealHardwareData(bpm, [rr], this.currentPacket.gsrMicroSiemens);
         } catch(e) {}
      };
      this.webSocket.onerror = () => this.disconnect();
      this.webSocket.onclose = () => this.disconnect();
    } catch (e) {
      this.disconnect();
    }
  }

  // --------------------------------------------------------------------------
  // MOTOR DE CÁLCULO CLÍNICO DE VFC / RMSSD
  // --------------------------------------------------------------------------
  private processRealHardwareData(bpm: number, rrMsInput: number | number[], gsrValue: number) {
    if (bpm < 30 || bpm > 220) {
      this.rrHistoryMs = [];
      this.currentPacket = {
        ...this.currentPacket,
        heartRateBpm: 0,
        rrIntervalMs: 0,
        hrvRmssdMs: 0,
        timestamp: Date.now()
      };
      this.dataListeners.forEach(fn => fn(this.currentPacket));
      return;
    }

    const newRRArray = Array.isArray(rrMsInput) ? rrMsInput : [rrMsInput];
    let lastValidRR = this.currentPacket.rrIntervalMs;

    for (const rr of newRRArray) {
      if (rr >= 300 && rr <= 2000) {
        this.rrHistoryMs.push(rr);
        lastValidRR = rr;
      }
    }

    while (this.rrHistoryMs.length > 40) {
      this.rrHistoryMs.shift();
    }

    let rmssd = 0;
    if (this.rrHistoryMs.length > 2) {
      let sumSquaredDiffs = 0;
      for (let i = 0; i < this.rrHistoryMs.length - 1; i++) {
        const diff = this.rrHistoryMs[i + 1] - this.rrHistoryMs[i];
        sumSquaredDiffs += diff * diff;
      }
      rmssd = Math.round(Math.sqrt(sumSquaredDiffs / (this.rrHistoryMs.length - 1)));
    }

    this.currentPacket = {
      ...this.currentPacket,
      heartRateBpm: Math.round(bpm),
      rrIntervalMs: lastValidRR,
      hrvRmssdMs: rmssd > 0 ? rmssd : this.currentPacket.hrvRmssdMs,
      gsrMicroSiemens: Number(gsrValue.toFixed(2)),
      timestamp: Date.now()
    };

    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  // --------------------------------------------------------------------------
  // 4. MODO SIMULACIÓN EXPLÍCITA
  // --------------------------------------------------------------------------
  public enableSimulation() {
    this.disconnect();
    this.activeProtocol = 'SIMULATED';
    this.activeProfile = 'GENERIC_BLE';
    this.isConnected = true;
    this.deviceName = 'Generador Sintético AMIE';
    this.notifyStatus();

    this.simulationInterval = setInterval(() => {
      const simBpm = 68 + Math.sin(Date.now() / 2000) * 8; 
      const simRr = 60000 / simBpm;
      const simGsr = 2.8 + Math.random() * 0.4;
      this.processRealHardwareData(simBpm, [simRr], simGsr);
    }, 400);
  }

  // --------------------------------------------------------------------------
  // LIMPIEZA Y DESCONEXIÓN
  // --------------------------------------------------------------------------
  public disconnect() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.serialReader) try { this.serialReader.cancel(); } catch (e) {}
    if (this.serialPort) try { this.serialPort.close(); } catch (e) {}
    if (this.bleServer && this.bleServer.connected) try { this.bleServer.disconnect(); } catch (e) {}
    if (this.webSocket) try { this.webSocket.close(); } catch (e) {}
    
    this.serialPort = null;
    this.bleServer = null;
    this.webSocket = null;

    this.activeProtocol = 'DISCONNECTED';
    this.activeProfile = 'GENERIC_BLE';
    this.isConnected = false;
    this.deviceName = 'Sin Dispositivo Conectado';

    this.currentPacket = {
      reactionTimeMs: 0,
      handGripPressureKg: 0,
      touchTapLatencyMs: 0,
      heartRateBpm: 0,
      hrvRmssdMs: 0,
      gsrMicroSiemens: 0,
      rrIntervalMs: 0,
      timestamp: Date.now()
    };
    
    this.rrHistoryMs = [];

    this.notifyStatus();
    this.dataListeners.forEach(fn => fn(this.currentPacket));
  }

  public executeZeroTare(): number {
    this.gripZeroOffsetKg = this.currentPacket.handGripPressureKg;
    return this.gripZeroOffsetKg;
  }

  public getCurrentPacket(): PrecisionTelemetryPacket {
    return this.currentPacket;
  }
}

export const telemetryService = new TelemetryManager();
