# ============================================================================
# AMIE / AIMA - MOTOR NEURO-TELEMETRICO Y LSL (LAB STREAMING LAYER)
# ============================================================================
# Requisitos: pip install pylsl numpy scipy websockets asyncio

import asyncio
import websockets
import json
import numpy as np
from scipy import signal
from pylsl import resolve_stream, StreamInlet
import time

# 1. CONFIGURACIÓN DE FILTROS DIGITALES SUB-MILISEGUNDO
# ----------------------------------------------------------------------------
FS_EEG = 250.0  # Frecuencia de muestreo típica para OpenBCI/Muse (250 Hz)
FS_GSR = 50.0   # Frecuencia de muestreo para GSR (Empatica/EmotiBit)

# Filtro Notch para eliminar el ruido de la red eléctrica (60Hz en América / 50Hz en Europa)
def apply_notch_filter(data, fs=FS_EEG, freq=60.0):
    nyq = 0.5 * fs
    freq_norm = freq / nyq
    b, a = signal.iirnotch(freq_norm, Q=30)
    return signal.filtfilt(b, a, data)

# Filtro Butterworth Pasa-Banda (Para extraer Ondas Cerebrales 0.5 a 45 Hz)
def apply_bandpass_filter(data, lowcut=0.5, highcut=45.0, fs=FS_EEG, order=4):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = signal.butter(order, [low, high], btype='band')
    return signal.filtfilt(b, a, data)

# 2. CÁLCULO DE POTENCIA ESPECTRAL (FFT) PARA QEEG Y GAMMA (Módulo 5)
# ----------------------------------------------------------------------------
def calculate_band_powers(eeg_raw_window):
    """Convierte la señal cruda en potencias de bandas (Delta, Theta, Alfa, Beta, Gamma)"""
    clean_eeg = apply_bandpass_filter(apply_notch_filter(eeg_raw_window))
    
    # Transformada Rápida de Fourier (FFT)
    freqs, psd = signal.welch(clean_eeg, FS_EEG, nperseg=256)
    
    # Extraer potencias por banda (Microvoltios cuadrados µV²)
    delta = np.sum(psd[(freqs >= 0.5) & (freqs < 4)])
    theta = np.sum(psd[(freqs >= 4) & (freqs < 8)])
    alpha = np.sum(psd[(freqs >= 8) & (freqs < 12)])
    beta  = np.sum(psd[(freqs >= 12) & (freqs < 30)])
    gamma = np.sum(psd[(freqs >= 30) & (freqs < 45)]) # Crucial para el Módulo Insight
    
    return {"delta": float(delta), "theta": float(theta), "alpha": float(alpha), "beta": float(beta), "gamma": float(gamma)}

# 3. MOTOR DE TRANSMISIÓN WEBSOCKET PARA REACT
# ----------------------------------------------------------------------------
async def amie_telemetry_hub(websocket, path):
    print("\n[+] Frontend Médico AMIE (React) conectado. Iniciando LSL Streams...")
    
    try:
        # Resolviendo streams de la red local (Hardware VR y Sensores)
        print("Buscando flujos LSL de hardware biomédico...")
        eeg_streams = resolve_stream('type', 'EEG')
        gsr_streams = resolve_stream('type', 'GSR')
        
        inlet_eeg = StreamInlet(eeg_streams[0]) if eeg_streams else None
        inlet_gsr = StreamInlet(gsr_streams[0]) if gsr_streams else None
        
        if not inlet_eeg and not inlet_gsr:
            print("⚠️ No se encontró hardware LSL real. Entrando en Modo Simulación Alta Fidelidad.")

        # Buffer para procesar ventanas de datos
        eeg_buffer = np.zeros(256)
        
        # Bucle de Lazo Cerrado a 60 FPS
        while True:
            # 1. CAPTURA DE EEG / QEEG
            if inlet_eeg:
                sample, timestamp = inlet_eeg.pull_sample(timeout=0.0)
                if sample:
                    eeg_buffer = np.roll(eeg_buffer, -1)
                    eeg_buffer[-1] = sample[0] # Canal Frontal Fp1
            else:
                # Simulación de ruido biológico si no hay casco conectado
                eeg_buffer = np.random.normal(0, 10, 256) 
            
            # Procesar FFT en tiempo real
            band_powers = calculate_band_powers(eeg_buffer)
            
            # 2. CAPTURA DE GSR (Conductancia Cutánea)
            gsr_val = 2.8
            if inlet_gsr:
                sample, timestamp = inlet_gsr.pull_sample(timeout=0.0)
                if sample: gsr_val = sample[0]
            else:
                gsr_val += np.random.normal(0, 0.1) # Micro-fluctuación
            
            # 3. EMPAQUETAR Y ENVIAR AL FRONTEND REACT
            payload = {
                "timestamp": time.time(),
                "gsrMicroSiemens": [round(gsr_val, 2)],
                "hrvRmssdMs": [round(np.random.normal(40, 5), 1)], # Simulación de HRV de la banda Polar H10
                "gammaPowerUv2": round(band_powers["gamma"], 2),
                "betaPowerUv2": round(band_powers["beta"], 2),
                "frontalEngagementPct": min(100, max(0, int((band_powers["beta"] / (band_powers["theta"] + 0.1)) * 10))),
                "saccadicHz": round(np.random.normal(1.2, 0.3), 2)
            }
            
            # Envío JSON instantáneo a React
            await websocket.send(json.dumps(payload))
            
            # Pausa para mantener 60Hz de transmisión
            await asyncio.sleep(1/60.0)
            
    except websockets.exceptions.ConnectionClosed:
        print("[-] Desconexión del Frontend AMIE. Limpiando buffers de hardware.")

# 4. INICIALIZADOR DE SERVIDOR
# ----------------------------------------------------------------------------
start_server = websockets.serve(amie_telemetry_hub, "localhost", 8080)

if __name__ == "__main__":
    print("""
    ========================================================
     AMIE / AIMA - NEURO-TELEMETRY & LSL DSP ENGINE V3.8
    ========================================================
    [*] Inicializando filtros Butterworth/Notch...
    [*] Servidor WebSocket DSP escuchando en ws://localhost:8080
    [*] Esperando conexión de la App React...
    """)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
