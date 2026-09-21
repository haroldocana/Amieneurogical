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
 * Filtros de Vendor ID (VID) para hardware biomédico, tarjetas EEG y convertidores serie comunes
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
 * Escucha eventos de conexión y desconexión física de hardware en tiempo real (Hot-Plugging WebUSB / WebSerial / WebHID)
 */
export const subscribeUsbDeviceEvents = (
  onDeviceConnected: (deviceName: string) => void,
  onDeviceDisconnected: (deviceName: string) => void
): (() => void) => {
  if (typeof navigator === 'undefined') return () => {};

  const handleConnect = (event: any) => {
    const name = event.device?.productName || event.device?.name || 'Dispositivo Biomédico / Sensor USB';
    onDeviceConnected(name);
  };

  const handleDisconnect = (event: any) => {
    const name = event.device?.productName || event.device?.name || 'Dispositivo Biomédico USB';
    onDeviceDisconnected(name);
  };

  const nav = navigator as any;

  // Suscripción a los 3 protocolos WebUSB, WebSerial y WebHID
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
 * Solicita emparejamiento explícito con un dispositivo biomédico vía WebSerial, WebUSB o WebHID
 * (Requerido por UsbHardwareDiagnosticModal.tsx)
 */
export const requestUsbDevicePermission = async (): Promise<string | null> => {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as any;

  // 1. Intentar por WebSerial
  if ('serial' in nav) {
    try {
      const port = await nav.serial.requestPort({
        filters: BIOMEDICAL_USB_VENDOR_FILTERS
      });
      const info = port.getInfo();
      return info.usbVendorId 
        ? `Sensor Biomédico Serie USB (VID: 0x${info.usbVendorId.toString(16)})` 
        : 'Sensor Biomédico Serie USB';
    } catch (e: any) {
      if (e.name === 'NotFoundError') return null; // El usuario canceló la selección
    }
  }

  // 2. Intentar por WebUSB
  if ('usb' in nav) {
    try {
      const device = await nav.usb.requestDevice({
        filters: BIOMEDICAL_USB_VENDOR_FILTERS
      });
      return device.productName || `Dispositivo USB Biomédico (VID: 0x${device.vendorId.toString(16)})`;
    } catch (e: any) {
      if (e.name === 'NotFoundError') return null;
    }
  }

  // 3. Intentar por WebHID
  if ('hid' in nav) {
    try {
      const devices = await nav.hid.requestDevice({
        filters: BIOMEDICAL_USB_VENDOR_FILTERS
      });
      if (devices && devices.length > 0) {
        return devices[0].productName || 'Sensor HID Biomédico';
      }
    } catch (e: any) {
      if (e.name === 'NotFoundError') return null;
    }
  }

  return null;
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
