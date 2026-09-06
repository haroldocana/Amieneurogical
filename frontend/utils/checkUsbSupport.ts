export interface UsbCompatibilityResult {
  isCompatible: boolean;
  webHID: boolean;
  webSerial: boolean;
  isHttps: boolean;
  recommendedBrowser: string;
  details: string;
}

export const checkUsbCompatibility = (): UsbCompatibilityResult => {
  const isWebHIDSupported = typeof navigator !== 'undefined' && 'hid' in navigator;
  const isWebSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;
  const isCompatible = (isWebHIDSupported || isWebSerialSupported) && isSecureContext;

  return {
    isCompatible,
    webHID: isWebHIDSupported,
    webSerial: isWebSerialSupported,
    isHttps: isSecureContext,
    recommendedBrowser: "Google Chrome o Microsoft Edge (Desktop v89+)",
    details: isCompatible 
      ? "Dispositivos USB de Telemetría Neuromotora listos para captura en milisegundos."
      : "Se requiere un entorno HTTPS seguro y navegador basado en Chromium para captura directa USB."
  };
};
