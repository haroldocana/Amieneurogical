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
  rrIntervalMs: number; // Intervalo R-R instantáneo para osciloscopio y tacograma
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

  // Buffer de cálculo clínico de VFC / HRV
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
  // 1. RECEPTOR BLUETOOTH UNIVERSAL (GEOID HS500 / POLAR / COLMI RING)
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
        optionalServices: ['heart_rate', 0x180D] // Estándar GATT Frecuencia Cardíaca
      });

      this.bleServer = await bleDevice.gatt.connect();
      this.bleDevice = bleDevice;
      this.activeProtocol = 'BLUETOOTH';
      this.isConnected = true;
      this.deviceName = bleDevice.name || 'Sensor BLE (Geoid / Polar / Ring)';
      this.notifyStatus();

      const service = await this.bleServer.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
        const dataView: DataView = e.target.value;
        if (!dataView || dataView.byteLength < 2) return;

        const flags = dataView.getUint8(0);
        
        // Estructura de Flags GATT (0x2A37):
        const hrFormat16Bit = (flags & 0x01) !== 0;        // Bit 0: 0=Uint8, 1=Uint16
        const sensorContact = (flags >> 1) & 0x03;          // Bit 1-2: 2=No Contacto (Off-Body)
        const energyPresent = (flags >> 3) & 0x01;          // Bit 3: Energía consumida
        const rrPresent = (flags >> 4) & 0x01;              // Bit 4: Intervalos R-R presentes

        // 🛡️ Detección de contacto (Anillos ópticos y Cintas pectorales Geoid HS500 sin electrodos)
        if (sensorContact === 2) {
          this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens);
          return;
        }

        // Extracción de BPM
        let bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
        let offset = hrFormat16Bit ? 3 : 2;

        if (energyPresent) {
          offset += 2;
        }

        // Extracción de múltiples Intervalos R-R (Característica clave del Geoid HS500)
        const rrValues: number[] = [];
        if (rrPresent) {
          while (offset + 1 < dataView.byteLength) {
            const rr1024 = dataView.getUint16(offset, true);
            const rrMs = Math.round((rr1024 / 1024) * 1000); // Conversión 1/1024s -> Millisegundos
            if (rrMs >= 300 && rrMs <= 2000) {
              rrValues.push(rrMs);
            }
            offset += 2;
          }
        }

        // Fallback matemático si el dispositivo no reporta trama R-R explícita
        if (rrValues.length === 0 && bpm > 0) {
          rrValues.push(Math.round(60000 / bpm));
        }

        this.processRealHardwareData(bpm, rrValues, this.currentPacket.gsrMicroSiemens);
      });

      bleDevice.addEventListener('gattserverdisconnected', () => {
        this.disconnect();
      });

      return true;
    } catch (err) {
      console.error('Fallo en enlace BLE:', err);
      this.disconnect();
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 2. CONEXIÓN USB SERIAL (ESP32 / SENSORES CON CABLE)
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
  // MOTOR DE CÁLCULO CLINICO DE HRV / RMSSD (PROCESAMIENTO R-R ECG)
  // --------------------------------------------------------------------------
  private processRealHardwareData(bpm: number, rrMsInput: number | number[], gsrValue: number) {
    // 🛡️ Filtro Fisiológico: Si los BPM están fuera del rango humano normal (30 - 220), mandar a cero (Flatline)
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

    // Mantener ventana móvil de 40 latidos para cálculo instantáneo de RMSSD (VFC / Tono Vagal)
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
