// ============================================================================
// AMIE TELEMETRY SERVICE - COMPATIBILIDAD GEOID HS500, COLMI, POLAR & USB
// ============================================================================

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED' | 'DISCONNECTED';

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
}) => void;

class TelemetryManager {
  private activeProtocol: TelemetryProtocol = 'DISCONNECTED';
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
      deviceName: this.deviceName
    }));
  }

  // --------------------------------------------------------------------------
  // 1. ENLACE BLUETOOTH ULTRA-RESILIENTE (GEOID / POLAR / COLMI RING)
  // --------------------------------------------------------------------------
  public async connectBluetooth(): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert('Navegador incompatible con Web Bluetooth API.');
      return false;
    }

    try {
      this.disconnect();
      
      // Lista expandida de servicios permitidos por Chrome
      const bleDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate',
          0x180D,
          '0000180d-0000-1000-8000-00805f9b34fb',
          'device_information',
          0x180A,
          'battery_service',
          0x180F
        ]
      });

      this.bleServer = await bleDevice.gatt.connect();
      this.bleDevice = bleDevice;
      this.activeProtocol = 'BLUETOOTH';
      this.isConnected = true;
      this.deviceName = bleDevice.name || 'Sensor BLE Biométrico';
      this.notifyStatus();

      // Búsqueda en cascada del servicio de pulso
      let service: any = null;
      try {
        service = await this.bleServer.getPrimaryService('heart_rate');
      } catch (e1) {
        try {
          service = await this.bleServer.getPrimaryService(0x180D);
        } catch (e2) {
          try {
            service = await this.bleServer.getPrimaryService('0000180d-0000-1000-8000-00805f9b34fb');
          } catch (e3) {
            // Escaneo dinámico de servicios
            const allServices = await this.bleServer.getPrimaryServices();
            for (const s of allServices) {
              if (s.uuid.toLowerCase().includes('180d')) {
                service = s;
                break;
              }
            }
            if (!service && allServices.length > 0) {
              service = allServices[0];
            }
          }
        }
      }

      if (!service) {
        throw new Error('No se encontró un servicio de Frecuencia Cardíaca activo en el dispositivo.');
      }

      // Búsqueda en cascada de la característica de medición
      let characteristic: any = null;
      try {
        characteristic = await service.getCharacteristic('heart_rate_measurement');
      } catch (cErr1) {
        try {
          characteristic = await service.getCharacteristic(0x2A37);
        } catch (cErr2) {
          const chars = await service.getCharacteristics();
          characteristic = chars.find((c: any) => c.properties.notify || c.properties.indicate);
        }
      }

      if (!characteristic) {
        throw new Error('El dispositivo no expone una característica de pulso notificable.');
      }

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
        const dataView: DataView = e.target.value;
        if (!dataView || dataView.byteLength < 2) return;

        const flags = dataView.getUint8(0);
        const hrFormat16Bit = (flags & 0x01) !== 0;
        const sensorContact = (flags >> 1) & 0x03;
        const energyPresent = (flags >> 3) & 0x01;
        const rrPresent = (flags >> 4) & 0x01;

        // Detección Off-Body (Sin contacto con piel)
        if (sensorContact === 2) {
          this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens);
          return;
        }

        let bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
        let offset = hrFormat16Bit ? 3 : 2;

        if (energyPresent) {
          offset += 2;
        }

        const rrValues: number[] = [];
        if (rrPresent) {
          while (offset + 1 < dataView.byteLength) {
            const rr1024 = dataView.getUint16(offset, true);
            const rrMs = Math.round((rr1024 / 1024) * 1000);
            if (rrMs >= 300 && rrMs <= 2000) {
              rrValues.push(rrMs);
            }
            offset += 2;
          }
        }

        if (rrValues.length === 0 && bpm > 0) {
          rrValues.push(Math.round(60000 / bpm));
        }

        this.processRealHardwareData(bpm, rrValues, this.currentPacket.gsrMicroSiemens);
      });

      bleDevice.addEventListener('gattserverdisconnected', () => {
        this.disconnect();
      });

      return true;
    } catch (err: any) {
      console.error('Fallo en enlace BLE:', err);
      this.disconnect();
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 2. CONEXIÓN USB SERIAL (ESP32)
  // --------------------------------------------------------------------------
  public async connectUsb(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      alert('Navegador incompatible con Web Serial API.');
      return false;
    }

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
      console.error('Error USB Serial:', err);
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

            if (text.startsWith('{')) {
              try {
                const json = JSON.parse(text);
                const bpm = Number(json.bpm || json.hr) || 0;
                const rr = Number(json.rr || json.ibi) || (bpm > 0 ? 60000 / bpm : 0);
                const gsr = Number(json.gsr || json.eda) || this.currentPacket.gsrMicroSiemens;
                
                this.processRealHardwareData(bpm, [rr], gsr);
              } catch (e) {}
            } else if (text.includes(',')) {
              const parts = text.split(',');
              const bpm = parseFloat(parts[0]) || 0;
              const rr = parseFloat(parts[1]) || (bpm > 0 ? 60000 / bpm : 0);
              const gsr = parseFloat(parts[2]) || this.currentPacket.gsrMicroSiemens;
              
              this.processRealHardwareData(bpm, [rr], gsr);
            }
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
           const gsr = Number(json.gsr) || this.currentPacket.gsrMicroSiemens;
           this.processRealHardwareData(bpm, [rr], gsr);
         } catch(e) {}
      };
      this.webSocket.onerror = () => this.disconnect();
      this.webSocket.onclose = () => this.disconnect();
    } catch (e) {
      this.disconnect();
    }
  }

  // --------------------------------------------------------------------------
  // MOTOR DE CÁLCULO CLINICO DE HRV / RMSSD
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
  // 4. MODO SIMULACIÓN EXPLICITA
  // --------------------------------------------------------------------------
  public enableSimulation() {
    this.disconnect();
    this.activeProtocol = 'SIMULATED';
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
  // LIMPIEZA ABSOLUTA
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
