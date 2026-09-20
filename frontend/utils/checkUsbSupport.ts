// ============================================================================
// AMIE CLINICAL HARDWARE - MÓDULO DE TELEMETRÍA Y COMPATIBILIDAD USB
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
  reactionTimeMs?: number;       // Mapeado a patient.neuromotorBiomarkers.reactionTimeMs
  handGripPressureKg?: number;   // Mapeado a patient.multisensoryHardware.handGripPressureKg
  touchTapLatencyMs?: number;    // Mapeado a patient.multisensoryHardware.touchTapLatencyCompensatedMs
  rawAdc?: number;
}

/**
  * Filtros de Vendor ID para hardware biomédico y convertidores serie comunes
  */
export const BIOMEDICAL_USB_VENDOR_FILTERS = [
  { usbVendorId: 0x0403 }, // FTDI (OpenBCI, BITalino)
  { usbVendorId: 0x10c4 }, // CP210x Silicon Labs (ESP32 / Módulos ECG/GSR)
  { usbVendorId: 0x2341 }, // Arduino (Kits de estimulación y respuesta)
  { usbVendorId: 0x0483 }  // STM32 Microelectronics
];

/**
  * Evalúa si el navegador y entorno actual soportan la captura directa de hardware USB
  */
export const checkUsbCompatibility = (): UsbCompatibilityResult => {
  const isWebHIDSupported = typeof navigator !== 'undefined' && 'hid' in navigator;
  const isWebSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;
  const isWebUSBSupported = typeof navigator !== 'undefined' && 'usb' in navigator;
  
  // Garantiza que la ejecución esté en un contexto seguro (HTTPS o localhost)
  const isSecureContext = typeof window !== 'undefined' ? (window.isSecureContext ?? false) : false;
  
  const isCompatible = (isWebHIDSupported || isWebSerialSupported || isWebUSBSupported) && isSecureContext;

  return {
    isCompatible,
    webHID: isWebHIDSupported,
    webSerial: isWebSerialSupported,
    webUSB: isWebUSBSupported,
    isHttps: isSecureContext,
    recommendedBrowser: "Google Chrome, Microsoft Edge o Brave (Desktop v89+)",
    details: isCompatible 
      ? "Dispositivos USB de Telemetría Neuromotora listos para captura en milisegundos."
      : "Se requiere un entorno HTTPS seguro y un navegador basado en Chromium para la captura directa USB."
  };
};

/**
  * Escucha eventos de conexión y desconexión física de hardware en tiempo real
  */
export const subscribeUsbDeviceEvents = (
  onDeviceConnected: (deviceName: string) => void,
  onDeviceDisconnected: (deviceName: string) => void
): (() => void) => {
  if (typeof navigator === 'undefined') return () => {};

  const handleConnect = (event: any) => {
    const name = event.device?.productName || event.port?.info?.usbVendorId ? 'Dispositivo Biomédico USB' : 'Sensor Neuromotor';
    onDeviceConnected(name);
  };

  const handleDisconnect = (event: any) => {
    const name = event.device?.productName || 'Sensor Neuromotor';
    onDeviceDisconnected(name);
  };

  if ('hid' in navigator) {
    (navigator as any).hid.addEventListener('connect', handleConnect);
    (navigator as any).hid.addEventListener('disconnect', handleDisconnect);
  }

  if ('serial' in navigator) {
    (navigator as any).serial.addEventListener('connect', handleConnect);
    (navigator as any).serial.addEventListener('disconnect', handleDisconnect);
  }

  // Cleanup de listeners
  return () => {
    if ('hid' in navigator) {
      (navigator as any).hid.removeEventListener('connect', handleConnect);
      (navigator as any).hid.removeEventListener('disconnect', handleDisconnect);
    }
    if ('serial' in navigator) {
      (navigator as any).serial.removeEventListener('connect', handleConnect);
      (navigator as any).serial.removeEventListener('disconnect', handleDisconnect);
    }
  };
};

/**
  * Abre puerto WebSerial y transmite muestras biométricas directamente al estado del paciente
  */
export const connectSerialNeuromotorSensor = async (
  onSample: (sample: NeuromotorTelemetrySample) => void,
  baudRate: number = 115200
): Promise<() => Promise<void>> => {
  if (!('serial' in navigator)) {
    throw new Error('WebSerial no está soportado en este navegador.');
  }

  // Solicita interacción de usuario para seleccionar el sensor
  const port = await (navigator as any).serial.requestPort({
    filters: BIOMEDICAL_USB_VENDOR_FILTERS
  });

  await port.open({ baudRate });

  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  let keepReading = true;

  // Bucle de lectura asíncrona de tramas serie
  (async () => {
    let buffer = '';
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          try {
            // Intenta parsear JSON directo del hardware { "rt": 240, "grip": 35.2 }
            const json = JSON.parse(cleanLine);
            onSample({
              timestamp: Date.now(),
              reactionTimeMs: json.rt,
              handGripPressureKg: json.grip,
              touchTapLatencyMs: json.tap
            });
          } catch {
            // Fallback para tramas CSV simples: "240,35.2,180"
            const parts = cleanLine.split(',').map(Number);
            if (parts.length >= 2) {
              onSample({
                timestamp: Date.now(),
                reactionTimeMs: parts[0],
                handGripPressureKg: parts[1],
                touchTapLatencyMs: parts[2] || parts[0]
              });
            }
          }
        }
      }
    }
  })();

  // Función de desconexión segura
  return async () => {
    keepReading = false;
    await reader.cancel();
    await readableStreamClosed.catch(() => {});
    await port.close();
  };
};
