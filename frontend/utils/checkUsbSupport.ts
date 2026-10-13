// ============================================================================
// AMIE CLINICAL HARDWARE - CAPTURA MULTISENSORIAL Y COMPATIBILIDAD USB / EEG
// frontend/utils/checkUsbSupport.ts
// ============================================================================

export interface UsbCompatibilityResult {
  isCompatible: boolean;
  webHID: boolean;
  webSerial: boolean;
  webUSB: boolean;
  isHttps: boolean;
  recommendedBrowser: string;
  details: string;
}

export interface NeuromotorTelemetrySample {
  timestamp: number;
  reactionTimeMs?: number;
  handGripPressureKg?: number;
  touchTapLatencyMs?: number;
  gsrMicroSiemens?: number;
  rawAdc?: number;
  eegChannelsRaw?: number[];
}

// Filtros específicos para WebSerial (W3C Web Serial API: usbVendorId)
export const SERIAL_VENDOR_FILTERS = [
  { usbVendorId: 0x0403 }, // FTDI (OpenBCI / Convertidores Industriales)
  { usbVendorId: 0x10c4 }, // Silicon Labs CP210x (Biopac / Shimmer)
  { usbVendorId: 0x2341 }, // Arduino (Dinamómetros / Pedales de reacción)
  { usbVendorId: 0x0483 }, // STM32 ST-Link / Custom Biomedical MCUs
  { usbVendorId: 0x1a86 }, // CH340 (Módulos USB de bajo coste)
  { usbVendorId: 0x2e8a }  // Raspberry Pi RP2040 Pico
];

// Filtros específicos para WebUSB (W3C WebUSB API: vendorId estricto)
export const USB_VENDOR_FILTERS = [
  { vendorId: 0x0403 },
  { vendorId: 0x10c4 },
  { vendorId: 0x2341 },
  { vendorId: 0x0483 },
  { vendorId: 0x1a86 },
  { vendorId: 0x2e8a }
];

// Alias para compatibilidad con llamadas previas
export const BIOMEDICAL_USB_VENDOR_FILTERS = SERIAL_VENDOR_FILTERS;

/**
 * Evalúa compatibilidad del navegador y contexto seguro (HTTPS / Localhost)
 */
export const checkUsbCompatibility = (): UsbCompatibilityResult => {
  const isWebHIDSupported = typeof navigator !== 'undefined' && 'hid' in navigator;
  const isWebSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;
  const isWebUSBSupported = typeof navigator !== 'undefined' && 'usb' in navigator;
  
  const isSecureContext = typeof window !== 'undefined' ? (window.isSecureContext ?? false) : false;
  const isCompatible = (isWebHIDSupported || isWebSerialSupported || isWebUSBSupported) && isSecureContext;

  return {
    isCompatible,
    webHID: isWebHIDSupported,
    webSerial: isWebSerialSupported,
    webUSB: isWebUSBSupported,
    isHttps: isSecureContext,
    recommendedBrowser: "Google Chrome, Microsoft Edge o Brave (Chromium v89+)",
    details: isCompatible 
      ? "Soporte WebBiomedical activo. Listo para captura sensorial de alta frecuencia."
      : "Se requiere un entorno HTTPS seguro y navegador basado en Chromium."
  };
};

/**
 * Suscribe listeners para inserción y extracción física de cables USB
 */
export const subscribeUsbDeviceEvents = (
  onDeviceConnected: (deviceName: string) => void,
  onDeviceDisconnected: (deviceName: string) => void
): (() => void) => {
  if (typeof navigator === 'undefined') return () => {};

  const handleConnect = (event: any) => {
    const name = event.device?.productName || event.device?.name || 'Sensor USB Biomédico';
    onDeviceConnected(name);
  };

  const handleDisconnect = (event: any) => {
    const name = event.device?.productName || event.device?.name || 'Dispositivo USB';
    onDeviceDisconnected(name);
  };

  const nav = navigator as any;

  if ('usb' in nav) {
    nav.usb.addEventListener('connect', handleConnect);
    nav.usb.addEventListener('disconnect', handleDisconnect);
  }
  if ('hid' in nav) {
    nav.hid.addEventListener('connect', handleConnect);
    nav.hid.addEventListener('disconnect', handleDisconnect);
  }
  if ('serial' in nav) {
    nav.serial.addEventListener('connect', handleConnect);
    nav.serial.addEventListener('disconnect', handleDisconnect);
  }

  return () => {
    if ('usb' in nav) {
      nav.usb.removeEventListener('connect', handleConnect);
      nav.usb.removeEventListener('disconnect', handleDisconnect);
    }
    if ('hid' in nav) {
      nav.hid.removeEventListener('connect', handleConnect);
      nav.hid.removeEventListener('disconnect', handleDisconnect);
    }
    if ('serial' in nav) {
      nav.serial.removeEventListener('connect', handleConnect);
      nav.serial.removeEventListener('disconnect', handleDisconnect);
    }
  };
};

/**
 * Conecta automáticamente puertos seriales previamente autorizados por el médico
 */
export const autoConnectKnownSerialDevice = async (
  onSample: (sample: NeuromotorTelemetrySample) => void,
  baudRate: number = 115200
): Promise<(() => Promise<void>) | null> => {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) return null;

  try {
    const ports = await (navigator as any).serial.getPorts();
    if (ports && ports.length > 0) {
      const knownPort = ports[0];
      return await openSerialPortStream(knownPort, onSample, baudRate);
    }
  } catch (err) {
    console.warn('[AMIE Hardware] No fue posible reconectar automáticamente el puerto serie:', err);
  }
  return null;
};

/**
 * Solicita autorización interactiva para vincular sensores biomédicos
 */
export const requestUsbDevicePermission = async (): Promise<string | null> => {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as any;

  // 1. Prioridad: WebSerial
  try {
    if ('serial' in nav) {
      const port = await nav.serial.requestPort({ filters: SERIAL_VENDOR_FILTERS });
      const info = port.getInfo();
      return info.usbVendorId 
        ? `Sensor Serie USB (VID: 0x${info.usbVendorId.toString(16)})` 
        : 'Sensor Serie USB Conectado';
    }
  } catch (e: any) {
    if (e.name !== 'NotFoundError') {
      console.warn('Fallo en solicitud WebSerial:', e);
    }
  }

  // 2. Fallback: WebUSB (usa vendorId para cumplir con la norma)
  try {
    if ('usb' in nav) {
      const device = await nav.usb.requestDevice({ filters: USB_VENDOR_FILTERS });
      return device.productName || `Dispositivo USB (VID: 0x${device.vendorId.toString(16)})`;
    }
  } catch (e: any) {
    if (e.name !== 'NotFoundError') {
      console.warn('Fallo en solicitud WebUSB:', e);
    }
  }

  return null;
};

/**
 * Inicia la captura continua por puerto serie sin bloqueos de hilo
 */
export const connectSerialNeuromotorSensor = async (
  onSample: (sample: NeuromotorTelemetrySample) => void,
  baudRate: number = 115200
): Promise<() => Promise<void>> => {
  if (!('serial' in navigator)) {
    throw new Error('WebSerial no está soportado en este navegador.');
  }

  const port = await (navigator as any).serial.requestPort({ filters: SERIAL_VENDOR_FILTERS });
  return await openSerialPortStream(port, onSample, baudRate);
};

/**
 * Gestión interna de apertura, decodificación y desconexión segura mediante AbortController
 */
const openSerialPortStream = async (
  port: any,
  onSample: (sample: NeuromotorTelemetrySample) => void,
  baudRate: number
): Promise<() => Promise<void>> => {
  await port.open({ 
    baudRate,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    bufferSize: 16384 // Búfer de 16 KB para prevenir pérdidas en alta frecuencia
  });

  const abortController = new AbortController();
  const textDecoder = new TextDecoderStream();

  // Pipe enlazado a señal de interrupción para evitar deadlock al cerrar
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable, {
    signal: abortController.signal
  });
  
  const reader = textDecoder.readable.getReader();

  (async () => {
    let buffer = '';
    while (true) {
      try {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Conserva el fragmento incompleto

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            parseBiomedicalPayload(cleanLine, onSample);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        console.warn('[AMIE Hardware] Flujo de lectura finalizado:', err.message);
        break;
      }
    }
  })();

  // Función de desconexión segura que previene errores de stream locked
  return async () => {
    try {
      abortController.abort();
      await reader.cancel().catch(() => {});
      reader.releaseLock();
      await readableStreamClosed.catch(() => {});
      await port.close();
      console.log('✅ [AMIE Hardware] Puerto serie liberado y cerrado con éxito.');
    } catch (e: any) {
      console.warn('Aviso al cerrar puerto serie:', e.message);
    }
  };
};

/**
 * Parser de telemetría multiformato (JSON, Clave:Valor, CSV)
 */
const parseBiomedicalPayload = (
  rawLine: string,
  onSample: (sample: NeuromotorTelemetrySample) => void
) => {
  const now = Date.now();

  // 1. JSON estructurado
  try {
    const json = JSON.parse(rawLine);
    onSample({
      timestamp: now,
      reactionTimeMs: typeof json.rt === 'number' ? json.rt : undefined,
      handGripPressureKg: typeof json.grip === 'number' ? json.grip : undefined,
      touchTapLatencyMs: typeof json.tap === 'number' ? json.tap : undefined,
      gsrMicroSiemens: typeof json.gsr === 'number' ? json.gsr : undefined,
      rawAdc: typeof json.adc === 'number' ? json.adc : undefined,
      eegChannelsRaw: Array.isArray(json.eeg) ? json.eeg : undefined
    });
    return;
  } catch {
    // Continuar a formatos alternativos si no es JSON
  }

  // 2. Clave=Valor o Clave:Valor (ej: RT:240,GRIP:35.2,GSR:3.4)
  if (rawLine.includes('=') || rawLine.includes(':')) {
    const tokens = rawLine.split(/[,;\s]+/);
    const sample: NeuromotorTelemetrySample = { timestamp: now };
    let found = false;

    for (const token of tokens) {
      const [k, v] = token.split(/[:=]/);
      if (!k || !v) continue;
      const key = k.trim().toUpperCase();
      const val = parseFloat(v.trim());
      if (isNaN(val)) continue;

      if (key === 'RT') { sample.reactionTimeMs = val; found = true; }
      else if (key === 'GRIP') { sample.handGripPressureKg = val; found = true; }
      else if (key === 'TAP') { sample.touchTapLatencyMs = val; found = true; }
      else if (key === 'GSR') { sample.gsrMicroSiemens = val; found = true; }
      else if (key === 'ADC') { sample.rawAdc = val; found = true; }
    }

    if (found) {
      onSample(sample);
      return;
    }
  }

  // 3. CSV plano por comas (ej: 240, 35.2, 2.8)
  const parts = rawLine.split(',').map(s => parseFloat(s.trim()));
  const validParts = parts.filter(n => !isNaN(n));
  if (validParts.length >= 2) {
    onSample({
      timestamp: now,
      reactionTimeMs: validParts[0],
      handGripPressureKg: validParts[1],
      touchTapLatencyMs: validParts[2] ?? validParts[0],
      gsrMicroSiemens: validParts[3]
    });
  }
};
