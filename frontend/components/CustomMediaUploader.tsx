// ============================================================================
// AMIE CLINICAL COPILOT - GESTOR DE ESCENARIOS MULTIMEDIA MÉDICOS 360°
// frontend/components/CustomMediaUploader.tsx
// ============================================================================

import React, { useState, useRef } from 'react';
import { VrControlService } from '../services/vrControlService';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Video, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  FolderPlus,
  Eye,
  Trash2
} from 'lucide-react';

interface Props {
  patientId: string;
}

export const CustomMediaUploader: React.FC<Props> = ({ patientId }) => {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [scenarioName, setScenarioName] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manejo de carga de archivo local desde la PC del terapeuta
  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');

    if (mediaType === 'image' && !isImageFile) {
      setStatusMsg({ type: 'error', text: 'El archivo seleccionado no es una imagen válida (JPEG, PNG, WEBP).' });
      return;
    }

    if (mediaType === 'video' && !isVideoFile) {
      setStatusMsg({ type: 'error', text: 'El archivo seleccionado no es un video válido (MP4, WEBM).' });
      return;
    }

    // Generar URL Blob local accesible en memoria
    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
    setSelectedFileName(file.name);
    if (!scenarioName.trim()) {
      setScenarioName(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

    setStatusMsg({
      type: 'success',
      text: `Archivo local cargado: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`
    });
  };

  // Proyección inmediata hacia el casco Pico 3 Pro
  const handleDeployToVisor = () => {
    if (!mediaUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Introduce una URL o selecciona un archivo 360° antes de proyectar.' });
      return;
    }

    VrControlService.sendCommand({
      type: 'LOAD_CUSTOM_MEDIA',
      mediaUrl: mediaUrl.trim(),
      mediaType,
      scenarioName: scenarioName.trim() || (mediaType === 'video' ? 'Video 360 Personalizado' : 'Entorno 360 Personalizado'),
      patientId,
      timestamp: Date.now()
    });

    setStatusMsg({
      type: 'success',
      text: `Proyectando ${mediaType === 'video' ? 'Video 360' : 'Imagen 360'} "${scenarioName || 'Personalizado'}" en el visor Pico.`
    });

    setTimeout(() => {
      setStatusMsg(null);
    }, 4500);
  };

  // Restaurar escenario clínico original por defecto
  const handleResetToDefaultEcosystem = () => {
    setMediaUrl('');
    setSelectedFileName(null);
    setScenarioName('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    VrControlService.sendCommand({
      type: 'LOAD_CUSTOM_MEDIA',
      mediaUrl: '',
      mediaType: 'image',
      scenarioName: 'Consultorio Clínico Base',
      patientId,
      timestamp: Date.now()
    });

    setStatusMsg({ type: 'success', text: 'Visor restablecido al entorno clínico original.' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-4 font-sans">
      
      {/* Cabecera del Módulo de Carga */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950 border border-indigo-500/40 rounded-xl text-indigo-400">
            <UploadCloud className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              GESTOR DE ESCENARIOS MULTIMEDIA MÉDICOS (360° 6DoF)
              <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-mono">
                PICO NEO 3 PRO / QUEST
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Proyección directa de material audiovisual personalizado para desensibilización sistemática</p>
          </div>
        </div>

        {/* Selector de Tipo: Foto vs Video */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMediaType('image');
              setSelectedFileName(null);
              setMediaUrl('');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              mediaType === 'image' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto 360°</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setMediaType('video');
              setSelectedFileName(null);
              setMediaUrl('');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              mediaType === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video 360°</span>
          </button>
        </div>
      </div>

      {/* Formulario de Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
        
        {/* Título o Etiqueta Clínica */}
        <div className="md:col-span-4">
          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
            Nombre del Escenario / Estímulo
          </label>
          <input
            type="text"
            placeholder="Ej: Habitación del paciente / Vuelo comercial"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* URL Directa o Archivo Seleccionado */}
        <div className="md:col-span-5">
          <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
            URL Directa (HTTPS / CDN / S3) o Archivo Local
          </label>
          <input
            type="text"
            placeholder={mediaType === 'video' ? 'https://servidor.com/video_360.mp4' : 'https://servidor.com/foto_360.jpg'}
            value={selectedFileName ? `[Archivo Local]: ${selectedFileName}` : mediaUrl}
            onChange={(e) => {
              setSelectedFileName(null);
              setMediaUrl(e.target.value);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 font-mono text-[11px] transition"
          />
        </div>

        {/* Botón de Carga de Archivo */}
        <div className="md:col-span-3 flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLocalFileChange}
            accept={mediaType === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>Examinar PC</span>
          </button>
        </div>

      </div>

      {/* Botonera de Acción y Requisitos */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="text-[10.5px] text-slate-500 font-mono space-y-0.5">
          <div>• Proporción: <strong>2:1 Equirrectangular</strong> (4096×2048 o 2048×1024).</div>
          <div>• Formatos: {mediaType === 'video' ? 'MP4 H.264/H.265 con audio AAC' : 'JPEG/PNG RGB estándar'}.</div>
        </div>

        <div className="flex items-center gap-2">
          {mediaUrl && (
            <button
              type="button"
              onClick={handleResetToDefaultEcosystem}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Volver a los entornos nativos del sistema"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDeployToVisor}
            disabled={!mediaUrl.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Proyectar en Pico 3 Pro</span>
          </button>
        </div>
      </div>

      {/* Mensajes de Estado */}
      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

    </div>
  );
};

export default CustomMediaUploader;
