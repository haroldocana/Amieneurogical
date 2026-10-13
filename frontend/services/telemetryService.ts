// ============================================================================
// AMIE TELEMETRY SERVICE - WATCHDOG DE TRÁFICO Y AUTO-TRIGGER COLMI/GEOID
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
  signalQualityPct?: number;
  isSyntheticFallback?: boolean;
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
  private serialReadableStreamClosed: Promise<void> | null = null;

  private bleDevice: any = null;
  private bleServer: any = null;
  private hrCharacteristic: any = null;
  private onCharacteristicValueChangedBound: ((e: any) => void) | null = null;
  private onGattDisconnectedBound: (() => void) | null = null;

  private webSocket: WebSocket | null = null;
  
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private lastPacketTime: number = 0;

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
    timestamp: Date.now(),
    signalQualityPct: 0,
    isSyntheticFallback: false
  };

  public subscribeData(callback: TelemetryCallback): () => void {
    this.dataListeners.add(callback);
    try {
      callback(this.currentPacket);
    } catch (e) {
      console.warn('[AMIE Telemetry] Error en suscriptor de datos inicial:', e);
    }
    return () => this.dataListeners.delete(callback);
  }

  public subscribeStatus(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    this.notifyStatus();
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus() {
    const statusPayload = {
      protocol: this.activeProtocol,
      connected: this.isConnected,
      deviceName: this.deviceName,
      profile: this.activeProfile
    };
    this.statusListeners.forEach(fn => {
      try {
        fn(statusPayload);
      } catch (err) {
        console.error('[AMIE Telemetry] Error notificando estado:', err);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 1. ENLACE BLUETOOTH CON WATCHDOG DE TRÁFICO ADAPTATIVO
  // --------------------------------------------------------------------------
  public async connectBluetooth(): Promise<boolean> {
    if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
      console.warn('[AMIE Telemetry] Navegador incompatible con Web Bluetooth API.');
      this.activeProtocol = 'DISCONNECTED';
      this.isConnected = false;
      this.deviceName = 'Web Bluetooth No Soportado';
      this.notifyStatus();
      return false;
    }

    try {
      await this.disconnect();

      const bleDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate',
          0x180D,
          '0000180d-0000-1000-8000-00805f9b34fb',
          'device_information',
          0x180A,
          'battery_service',
          0x180F,
          0xFFE0,
          '0000ffe0-0000-1000-8000-00805f9b34fb',
          0xFEE7,
          '0000fee7-0000-1000-8000-00805f9b34fb'
        ]
      });

      this.bleServer = await bleDevice.gatt.connect();
      this.bleDevice = bleDevice;
      this.activeProtocol = 'BLUETOOTH';
      this.isConnected = true;
      const rawName = (bleDevice.name || 'Sensor BLE').toUpperCase();
      this.deviceName = bleDevice.name || 'Sensor BLE';

      if (rawName.includes('GEOID') || rawName.includes('HS500') || rawName.includes('POLAR')) {
        this.activeProfile = 'GEOID_ECG';
      } else if (rawName.includes('COLMI') || rawName.includes('RING') || rawName.includes('R10') || rawName.includes('R02') || rawName.includes('SMART')) {
        this.activeProfile = 'COLMI_RING';
      } else {
        this.activeProfile = 'GENERIC_BLE';
      }

      this.notifyStatus();

      // Búsqueda del servicio de frecuencia cardíaca estándar o vendor
      let service: any = null;
      try {
        service = await this.bleServer.getPrimaryService('heart_rate');
      } catch {
        try {
          service = await this.bleServer.getPrimaryService(0x180D);
        } catch {
          const allServices = await this.bleServer.getPrimaryServices().catch(() => []);
          service = allServices.find((s: any) => s.uuid.toLowerCase().includes('180d')) || allServices[0];
        }
      }

      if (service) {
        let characteristic: any = null;
        try {
          characteristic = await service.getCharacteristic('heart_rate_measurement');
        } catch {
          try {
            characteristic = await service.getCharacteristic(0x2A37);
          } catch {
            const chars = await service.getCharacteristics().catch(() => []);
            characteristic = chars.find((c: any) => c.properties.notify || c.properties.indicate);
          }
        }

        if (characteristic) {
          await characteristic.startNotifications();
          this.hrCharacteristic = characteristic;

          this.onCharacteristicValueChangedBound = (e: any) => {
            this.lastPacketTime = Date.now();
            const dataView: DataView = e.target.value;
            if (!dataView || dataView.byteLength < 2) return;

            if (this.activeProfile === 'GEOID_ECG') {
              this.parseGeoidEcgPacket(dataView);
            } else if (this.activeProfile === 'COLMI_RING') {
              this.parseColmiRingPacket(dataView);
            } else {
              this.parseGenericBlePacket(dataView);
            }
          };

          characteristic.addEventListener('characteristicvaluechanged', this.onCharacteristicValueChangedBound);
        }
      }

      // Despertador y activación de streaming para anillos inteligentes Colmi
      if (this.activeProfile === 'COLMI_RING') {
        await this.tryWakeUpColmiRing();
      }

      this.onGattDisconnectedBound = () => {
        console.warn('[AMIE Telemetry] Servidor GATT desconectado.');
        this.disconnect();
      };
      bleDevice.addEventListener('gattserverdisconnected', this.onGattDisconnectedBound);

      this.startWatchdog();
      return true;
    } catch (err: any) {
      console.warn('[AMIE Telemetry] Enlace Bluetooth cancelado o no completado:', err);
      await this.disconnect();
      return false;
    }
  }

  /**
   * Intenta emitir tramas de inicio de pulso a anillos Colmi si el servicio propietario existe
   */
  private async tryWakeUpColmiRing() {
    if (!this.bleServer) return;
    try {
      const vendorService = await this.bleServer.getPrimaryService(0xFFE0).catch(() => null) ||
                            await this.bleServer.getPrimaryService(0xFEE7).catch(() => null);
      if (vendorService) {
        const chars = await vendorService.getCharacteristics().catch(() => []);
        const writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
        if (writeChar) {
          // Comando estándar de activación de monitor de pulso en tiempo real (0x03, 0xA1)
          const startCmd = new Uint8Array([0x03, 0xA1, 0x01, 0x00]);
          await writeChar.writeValue(startCmd).catch(() => {});
        }
      }
    } catch {
      // Si el anillo utiliza perfiles estándar, se mantiene sobre HR Measurement
    }
  }

  // --------------------------------------------------------------------------
  // WATCHDOG: SUPERVISIÓN DE TRÁFICO ADAPTATIVO CON INDICADOR DE CALIDAD
  // --------------------------------------------------------------------------
  private startWatchdog() {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.lastPacketTime = Date.now();

    this.watchdogTimer = setInterval(() => {
      if (!this.isConnected || this.activeProtocol === 'SIMULATED') return;

      const elapsed = Date.now() - this.lastPacketTime;
      
      // Si transcurren más de 2.5 segundos sin paquetes entrantes de la pila GATT
      if (elapsed > 2500) {
        const baseBpm = 72 + Math.sin(Date.now() / 1500) * 5;
        const rrMs = Math.round(60000 / baseBpm);
        const gsr = Math.max(0.5, Number((this.currentPacket.gsrMicroSiemens || 2.4).toFixed(2)));

        // Se interpola marcando degradación de señal para evitar diagnósticos falsos
        this.processRealHardwareData(baseBpm, [rrMs], gsr, {
          signalQualityPct: Math.max(20, 100 - Math.min(80, Math.floor((elapsed - 2500) / 100))),
          isSyntheticFallback: true
        });
      }
    }, 500);
  }

  private parseGeoidEcgPacket(dataView: DataView) {
    const flags = dataView.getUint8(0);
    const hrFormat16Bit = (flags & 0x01) !== 0;
    const sensorContactStatus = (flags >> 1) & 0x03;
    const energyPresent = (flags >> 3) & 0x01;
    const rrPresent = (flags >> 4) & 0x01;

    // Contacto perdido con la piel
    if (sensorContactStatus === 2) {
      this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens, { signalQualityPct: 0 });
      return;
    }

    const bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
    let offset = hrFormat16Bit ? 3 : 2;
    if (energyPresent) offset += 2;

    const rrValues: number[] = [];
    if (rrPresent) {
      while (offset + 1 < dataView.byteLength) {
        const rr1024 = dataView.getUint16(offset, true);
        const rrMs = Math.round((rr1024 / 1024) * 1000);
        if (rrMs >= 300 && rrMs <= 2000) rrValues.push(rrMs);
        offset += 2;
      }
    }

    if (rrValues.length === 0 && bpm > 30) {
      rrValues.push(Math.round(60000 / bpm));
    }

    this.processRealHardwareData(bpm, rrValues, this.currentPacket.gsrMicroSiemens, {
      signalQualityPct: sensorContactStatus === 3 ? 98 : 85,
      isSyntheticFallback: false
    });
  }

  private parseColmiRingPacket(dataView: DataView) {
    const flags = dataView.getUint8(0);
    const hrFormat16Bit = (flags & 0x01) !== 0;
    const bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);

    if (bpm < 35 || bpm > 220) {
      this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens, { signalQualityPct: 15 });
      return;
    }

    this.processRealHardwareData(bpm, [Math.round(60000 / bpm)], this.currentPacket.gsrMicroSiemens, {
      signalQualityPct: 92,
      isSyntheticFallback: false
    });
  }

  private parseGenericBlePacket(dataView: DataView) {
    const flags = dataView.getUint8(0);
    const hrFormat16Bit = (flags & 0x01) !== 0;
    const bpm = hrFormat16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
    
    if (bpm < 30 || bpm > 220) {
      this.processRealHardwareData(0, [], this.currentPacket.gsrMicroSiemens, { signalQualityPct: 10 });
      return;
    }

    this.processRealHardwareData(bpm, [Math.round(60000 / bpm)], this.currentPacket.gsrMicroSiemens, {
      signalQualityPct: 90,
      isSyntheticFallback: false
    });
  }

  // --------------------------------------------------------------------------
  // 2. ENLACE USB CON LIBERACIÓN CONTROLADA DE STREAMS (WEB SERIAL API)
  // --------------------------------------------------------------------------
  public async connectUsb(): Promise<boolean> {
    if (typeof window === 'undefined' || !(navigator as any).serial) {
      console.warn('[AMIE Telemetry] Web Serial API no soportada en este entorno.');
      return false;
    }

    try {
      await this.disconnect();
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });

      this.activeProtocol = 'USB';
      this.isConnected = true;
      this.deviceName = 'Microcontrolador ESP32 (USB)';
      this.notifyStatus();

      this.startSerialReadLoop();
      return true;
    } catch (err) {
      console.warn('[AMIE Telemetry] Conexión USB cancelada o no disponible:', err);
      await this.disconnect();
      return false;
    }
  }

  private async startSerialReadLoop() {
    if (!this.serialPort || !this.serialPort.readable) return;

    try {
      const textDecoder = new TextDecoderStream();
      this.serialReadableStreamClosed = this.serialPort.readable.pipeTo(textDecoder.writable);
      this.serialReader = textDecoder.readable.getReader();

      let buffer = '';
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
            this.parseSerialLine(text);
          }
        }
      }
    } catch (err: any) {
      if (this.isConnected) {
        console.warn('[AMIE Telemetry] Interrupción en bucle de lectura serial:', err);
        await this.disconnect();
      }
    }
  }

  private parseSerialLine(text: string) {
    this.lastPacketTime = Date.now();
    try {
      if (text.startsWith('{')) {
        const json = JSON.parse(text);
        const bpm = Number(json.bpm || json.hr || json.heartRate) || 0;
        const rr = Number(json.rr || json.ibi) || (bpm > 0 ? 60000 / bpm : 0);
        const gsr = typeof json.gsr === 'number' ? json.gsr : this.currentPacket.gsrMicroSiemens;
        const grip = typeof json.grip === 'number' ? json.grip : (typeof json.pressure === 'number' ? json.pressure : undefined);
        const rt = typeof json.rt === 'number' ? json.rt : (typeof json.reactionTime === 'number' ? json.reactionTime : undefined);

        this.processRealHardwareData(bpm, [rr], gsr, {
          gripKg: grip,
          reactionTimeMs: rt,
          signalQualityPct: 99,
          isSyntheticFallback: false
        });
      } else if (text.includes(',')) {
        const parts = text.split(',');
        const bpm = parseFloat(parts[0]) || 0;
        const rr = parseFloat(parts[1]) || (bpm > 0 ? 60000 / bpm : 0);
        const gsr = parts.length > 2 ? (parseFloat(parts[2]) || this.currentPacket.gsrMicroSiemens) : this.currentPacket.gsrMicroSiemens;
        const grip = parts.length > 3 ? parseFloat(parts[3]) : undefined;

        this.processRealHardwareData(bpm, [rr], gsr, {
          gripKg: grip,
          signalQualityPct: 99,
          isSyntheticFallback: false
        });
      }
    } catch {
      // Ignorar fragmentos corruptos de línea
    }
  }

  // --------------------------------------------------------------------------
  // 3. ENLACE TCP/IP (WIFI WEBSOCKET)
  // --------------------------------------------------------------------------
  public async connectWifi(ipAddress: string): Promise<void> {
    await this.disconnect();
    try {
      this.webSocket = new WebSocket(`ws://${ipAddress}:8080`);
      this.webSocket.onopen = () => {
        this.activeProtocol = 'WIFI';
        this.isConnected = true;
        this.deviceName = `Módulo TCP/IP (${ipAddress})`;
        this.notifyStatus();
      };

      this.webSocket.onmessage = (event) => {
        this.lastPacketTime = Date.now();
        try {
          const json = JSON.parse(event.data);
          const bpm = Number(json.bpm || json.hr) || 0;
          const rr = Number(json.rr || json.ibi) || (bpm > 0 ? 60000 / bpm : 0);
          const gsr = typeof json.gsr === 'number' ? json.gsr : this.currentPacket.gsrMicroSiemens;
          const grip = typeof json.grip === 'number' ? json.grip : undefined;
          const rt = typeof json.rt === 'number' ? json.rt : undefined;

          this.processRealHardwareData(bpm, [rr], gsr, {
            gripKg: grip,
            reactionTimeMs: rt,
            signalQualityPct: 98,
            isSyntheticFallback: false
          });
        } catch {}
      };

      this.webSocket.onerror = () => this.disconnect();
      this.webSocket.onclose = () => this.disconnect();
    } catch {
      await this.disconnect();
    }
  }

  // --------------------------------------------------------------------------
  // 4. PROCESAMIENTO CENTRAL CON APLICACIÓN DE TARA Y CÁLCULO ESTRICTO DE HRV
  // --------------------------------------------------------------------------
  private processRealHardwareData(
    bpm: number, 
    rrMsInput: number | number[], 
    gsrValue: number,
    extra?: {
      gripKg?: number;
      reactionTimeMs?: number;
      signalQualityPct?: number;
      isSyntheticFallback?: boolean;
    }
  ) {
    if (bpm < 30 || bpm > 220) {
      this.rrHistoryMs = [];
      this.currentPacket = {
        ...this.currentPacket,
        heartRateBpm: 0,
        rrIntervalMs: 0,
        hrvRmssdMs: 0,
        signalQualityPct: extra?.signalQualityPct ?? 0,
        isSyntheticFallback: extra?.isSyntheticFallback ?? false,
        timestamp: Date.now()
      };
      this.emitData();
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

    // Cálculo estricto de RMSSD sin enmascaramiento con valores fijos
    let rmssd = 0;
    if (this.rrHistoryMs.length > 2) {
      let sumSquaredDiffs = 0;
      for (let i = 0; i < this.rrHistoryMs.length - 1; i++) {
        const diff = this.rrHistoryMs[i + 1] - this.rrHistoryMs[i];
        sumSquaredDiffs += diff * diff;
      }
      rmssd = Math.round(Math.sqrt(sumSquaredDiffs / (this.rrHistoryMs.length - 1)));
    }

    // Aplicación estricta de la tara en dinamometría manual
    let finalGrip = this.currentPacket.handGripPressureKg;
    if (typeof extra?.gripKg === 'number') {
      finalGrip = Math.max(0, Number((extra.gripKg - this.gripZeroOffsetKg).toFixed(2)));
    }

    this.currentPacket = {
      ...this.currentPacket,
      heartRateBpm: Math.round(bpm),
      rrIntervalMs: lastValidRR,
      hrvRmssdMs: rmssd,
      gsrMicroSiemens: Number(Math.max(0, gsrValue).toFixed(2)),
      handGripPressureKg: finalGrip,
      reactionTimeMs: typeof extra?.reactionTimeMs === 'number' ? extra.reactionTimeMs : this.currentPacket.reactionTimeMs,
      signalQualityPct: extra?.signalQualityPct ?? 100,
      isSyntheticFallback: extra?.isSyntheticFallback ?? false,
      timestamp: Date.now()
    };

    this.emitData();
  }

  private emitData() {
    this.dataListeners.forEach(fn => {
      try {
        fn(this.currentPacket);
      } catch (err) {
        console.error('[AMIE Telemetry] Error en listener de datos:', err);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. GENERADOR SINTÉTICO Y CICLO DE CIERRE / TARA
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
      this.processRealHardwareData(simBpm, [simRr], simGsr, {
        signalQualityPct: 100,
        isSyntheticFallback: true
      });
    }, 400);
  }

  public async disconnect(): Promise<void> {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    // 1. Liberación limpia de Web Serial Reader y Stream
    if (this.serialReader) {
      try {
        await this.serialReader.cancel();
      } catch {}
      try {
        this.serialReader.releaseLock();
      } catch {}
      this.serialReader = null;
    }
    if (this.serialReadableStreamClosed) {
      try {
        await this.serialReadableStreamClosed;
      } catch {}
      this.serialReadableStreamClosed = null;
    }
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {}
      this.serialPort = null;
    }

    // 2. Liberación limpia de Web Bluetooth
    if (this.hrCharacteristic) {
      if (this.onCharacteristicValueChangedBound) {
        try {
          this.hrCharacteristic.removeEventListener('characteristicvaluechanged', this.onCharacteristicValueChangedBound);
        } catch {}
      }
      try {
        await this.hrCharacteristic.stopNotifications();
      } catch {}
      this.hrCharacteristic = null;
    }
    this.onCharacteristicValueChangedBound = null;

    if (this.bleDevice && this.onGattDisconnectedBound) {
      try {
        this.bleDevice.removeEventListener('gattserverdisconnected', this.onGattDisconnectedBound);
      } catch {}
      this.onGattDisconnectedBound = null;
    }

    if (this.bleServer && this.bleServer.connected) {
      try {
        this.bleServer.disconnect();
      } catch {}
      this.bleServer = null;
    }
    this.bleDevice = null;

    // 3. Cierre de WebSocket
    if (this.webSocket) {
      try {
        this.webSocket.close();
      } catch {}
      this.webSocket = null;
    }

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
      timestamp: Date.now(),
      signalQualityPct: 0,
      isSyntheticFallback: false
    };
    
    this.rrHistoryMs = [];

    this.notifyStatus();
    this.emitData();
  }

  public executeZeroTare(): number {
    this.gripZeroOffsetKg = this.currentPacket.handGripPressureKg + this.gripZeroOffsetKg;
    this.currentPacket.handGripPressureKg = 0;
    this.emitData();
    return this.gripZeroOffsetKg;
  }

  public getCurrentPacket(): PrecisionTelemetryPacket {
    return this.currentPacket;
  }
}

export const telemetryService = new TelemetryManager();
