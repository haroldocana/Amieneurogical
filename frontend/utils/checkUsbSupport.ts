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
  reactionTimeMs?: number;
  handGripPressureKg?: number;
  touchTapLatencyMs?: number;
  rawAdc?: number;
  eegChannelsRaw?: number[];
}

export const BIOMEDICAL_USB_VENDOR_FILTERS = [
  { usbVendorId: 0x0403 }, // FTDI
  { usbVendorId: 0x10c4 }, // CP210x Silicon Labs
  { usbVendorId: 0x2341 }, // Arduino
  { usbVendorId: 0x0483 }  // STM32
];

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
      ? "Dispositivos USB de Telemetría Neuromotora y qEEG listos."
      : "Se requiere un entorno HTTPS y navegador basado en Chromium."
  };
};

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

export const requestUsbDevicePermission = async (): Promise<string | null> => {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as any;

  try {
    if ('serial' in nav) {
      const port = await nav.serial.requestPort({ filters: BIOMEDICAL_USB_VENDOR_FILTERS });
      const info = port.getInfo();
      return info.usbVendorId 
        ? `Sensor Serie USB (VID: 0x${info.usbVendorId.toString(16)})` 
        : 'Sensor Serie USB';
    }
  } catch (e) {
    console.warn('Conexión WebSerial omitida o cancelada por el usuario.');
  }

  try {
    if ('usb' in nav) {
      const device = await nav.usb.requestDevice({ filters: BIOMEDICAL_USB_VENDOR_FILTERS });
      return device.productName || `Dispositivo USB (VID: 0x${device.vendorId.toString(16)})`;
    }
  } catch (e) {
    console.warn('Conexión WebUSB omitida o cancelada por el usuario.');
  }

  return null;
};

export const connectSerialNeuromotorSensor = async (
  onSample: (sample: NeuromotorTelemetrySample) => void,
  baudRate: number = 115200
): Promise<() => Promise<void>> => {
  if (!('serial' in navigator)) {
    throw new Error('WebSerial no está soportado en este navegador.');
  }

  const port = await (navigator as any).serial.requestPort({ filters: BIOMEDICAL_USB_VENDOR_FILTERS });
  await port.open({ baudRate });

  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  let keepReading = true;

  (async () => {
    let buffer = '';
    while (keepReading) {
      try {
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
              const json = JSON.parse(cleanLine);
              onSample({
                timestamp: Date.now(),
                reactionTimeMs: json.rt,
                handGripPressureKg: json.grip,
                touchTapLatencyMs: json.tap,
                eegChannelsRaw: Array.isArray(json.eeg) ? json.eeg : undefined
              });
            } catch {
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
      } catch (err) {
        console.warn('Lectura de flujo de datos terminada o interrumpida:', err);
        break;
      }
    }
  })();

  return async () => {
    keepReading = false;
    try {
      await reader.cancel();
      await readableStreamClosed.catch(() => {});
      await port.close();
    } catch (e) {
      console.warn('Error al cerrar puerto serie:', e);
    }
  };
};
