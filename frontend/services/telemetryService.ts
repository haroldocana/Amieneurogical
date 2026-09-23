// ============================================================================
// AMIE TELEMETRY SERVICE - STRICT HARDWARE MODE & OFF-BODY DETECTION
// ============================================================================

export type TelemetryProtocol = 'USB' | 'BLUETOOTH' | 'WIFI' | 'SIMULATED' | 'DISCONNECTED';

export interface PrecisionTelemetryPacket {
  reactionTimeMs: number;
  handGripPressureKg: number;
  touchTapLatencyMs: number;
  heartRateBpm: number;
  hrvRmssdMs: number;
  gsrMicroSiemens: number;
  rrIntervalMs: number; // Fundamental para dibujar la onda real
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
  
  // Timer de simulación (solo se activa explícitamente)
  private simulationInterval: any = null;

  // Buffer de cálculo clínico
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
  // 1. CONEXIÓN BLUETOOTH CON FILTRO ANTI-FANTASMA (GATT OFF-BODY DETECT)
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
        optionalServices: ['heart_rate'] // Estándar GATT 0x180D
      });

      this.bleServer = await bleDevice.gatt.connect();
      this.bleDevice = bleDevice;
      this.activeProtocol = 'BLUETOOTH';
      this.isConnected = true;
      this.deviceName = bleDevice.name || 'Sensor BLE Biométrico';
      this.notifyStatus();

      const service = await this.bleServer.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
        const dataView = e.target.value;
        const flags = dataView.getUint8(0);
        
        // 🛡️ FILTRO 1: Detección de contacto con piel (GATT Bits 1 y 2)
        // Bit 1 & Bit 2 = 0b10 (2): Sensor soportado pero SIN CONTACTO CON PIEL (Off-Body)
        const sensorContactStatus = (flags >> 1) & 0x03;
        if (sensorContactStatus === 2) {
          // Anillo fuera del dedo -> Forzar Flatline inmediato
          this.processRealHardwareData(0, 0, this.currentPacket.gsrMicroSiemens);
          return;
        }

        // Extracción de BPM (8 o 16 bits)
        let bpm = (flags & 0x1) ? dataView.getUint16(1, true) : dataView.getUint8(1);
        
        let rrValue = 0;
        // Intervalo R-R (Flag bit 4)
        if (flags & 0x10) {
          const rrIndex = (flags & 0x1) ? 3 : 2;
          rrValue = dataView.getUint16(rrIndex, true);
          rrValue = Math.round((rrValue / 1024) * 1000); // Convertir a ms
        } else if (bpm > 0) {
          rrValue = Math.round(60000 / bpm);
        }

        this.processRealHardwareData(bpm, rrValue, this.currentPacket.gsrMicroSiemens);
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
                
                this.processRealHardwareData(bpm, rr, gsr);
              } catch (e) {}
            } else if (text.includes(',')) {
              const parts = text.split(',');
              const bpm = parseFloat(parts[0]) || 0;
              const rr = parseFloat(parts[1]) || (bpm > 0 ? 60000 / bpm : 0);
              const gsr = parseFloat(parts[2]) || this.currentPacket.gsrMicroSiemens;
              
              this.processRealHardwareData(bpm, rr, gsr);
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
           this.processRealHardwareData(bpm, rr, gsr);
         } catch(e) {}
      };
      this.webSocket.onerror = () => this.disconnect();
      this.webSocket.onclose = () => this.disconnect();
    } catch (e) {
      this.disconnect();
    }
  }

  // --------------------------------------------------------------------------
  // MOTOR DE CÁLCULO HRV REAL Y RESET POR FUERA DE RANGO
  // --------------------------------------------------------------------------
  private processRealHardwareData(bpm: number, rrMs: number, gsrValue: number) {
    // 🛡️ FILTRO 2: Si el pulso cae fuera del rango fisiológico (< 30 o > 220), forzar Flatline
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

    // Procesamiento de datos válidos con el anillo en el dedo
    this.rrHistoryMs.push(rrMs);
    if (this.rrHistoryMs.length > 30) this.rrHistoryMs.shift();

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
      rrIntervalMs: Math.round(rrMs),
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
      this.processRealHardwareData(simBpm, simRr, simGsr);
    }, 400);
  }

  // --------------------------------------------------------------------------
  // LIMPIEZA Y DESCONEXIÓN TOTAL
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
