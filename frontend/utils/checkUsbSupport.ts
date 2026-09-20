// ============================================================================
// AMIE CLINICAL HARDWARE - CAPTURA MULTISENSORIAL Y COMPATIBILIDAD USB / EEG
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
  eegChannelsRaw?: number[];     // Transmisión directa para el módulo qEEG / NeuroSensoryModule
}

/**
 * Filtros de Vendor ID para hardware biomédico, tarjetas EEG y convertidores serie comunes
 */
export const BIOMEDICAL_USB_VENDOR_FILTERS = [
  { usbVendorId: 0x0403 }, // FTDI (OpenBCI Cyton/Ganglion, BITalino)
  { usbVendorId: 0x10c4 }, // CP210x Silicon Labs (ESP32, módulos EEG/GSR)
  { usbVendorId: 0x2341 }, // Arduino (Kits de estimulación psicofisiológica)
  { usbVendorId: 0x0483 }  // STM32 Microelectronics (Kits de telemetría clínica)
];

/**
 * Evalúa si el navegador y el entorno ejecutan una conexión segura para USB directo
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
    recommendedBrowser: "Google Chrome, Microsoft Edge o Brave (Desktop v89+)",
    details: isCompatible 
      ? "Dispositivos USB de Telemetría Neuromotora y qEEG listos para captura en milisegundos."
      : "Se requiere un entorno HTTPS seguro y un navegador basado en Chromium para la captura directa USB."
  };
};

/**
 * Escucha eventos de conexión y desconexión física de hardware en tiempo real (Hot-Plugging)
 */
export const subscribeUsbDeviceEvents = (
  onDeviceConnected: (deviceName: string) => void,
  onDeviceDisconnected: (deviceName: string) => void
): (() => void) => {
  if (typeof navigator === 'undefined') return () => {};

  const handleConnect = (event: any) => {
    const name = event.device?.productName || 'Dispositivo Biomédico / Sensor USB';
    onDeviceConnected(name);
  };

  const handleDisconnect = (event: any) => {
    const name = event.device?.productName || 'Dispositivo Biomédico USB';
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
 * Abre puerto WebSerial y transmite muestras biométricas/EEG directamente al estado del paciente
 */
export const connectSerialNeuromotorSensor = async (
  onSample: (sample: NeuromotorTelemetrySample) => void,
  baudRate: number = 115200
): Promise<() => Promise<void>> => {
  if (!('serial' in navigator)) {
    throw new Error('WebSerial no está soportado en este navegador.');
  }

  const port = await (navigator as any).serial.requestPort({
    filters: BIOMEDICAL_USB_VENDOR_FILTERS
  });

  await port.open({ baudRate });

  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  let keepReading = true;

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
            // Trama JSON: { "rt": 240, "grip": 35.2, "eeg": [12.4, 45.1, 8.2, 19.3] }
            const json = JSON.parse(cleanLine);
            onSample({
              timestamp: Date.now(),
              reactionTimeMs: json.rt,
              handGripPressureKg: json.grip,
              touchTapLatencyMs: json.tap,
              eegChannelsRaw: Array.isArray(json.eeg) ? json.eeg : undefined
            });
          } catch {
            // Trama CSV simple: "240,35.2,180"
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

  return async () => {
    keepReading = false;
    await reader.cancel();
    await readableStreamClosed.catch(() => {});
    await port.close();
  };
};
