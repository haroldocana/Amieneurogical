import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isComponentLevel?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🛡️ [AMIE Escudo Clínico] Crash interceptado:', error, errorInfo);
    this.setState({ errorInfo });

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (loggingErr) {
        console.warn('Fallo al reportar error al servicio de telemetría:', loggingErr);
      }
    }
  }

  // Reintento suave sin recargar toda la página web
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  // Limpieza selectiva de caché que preserva la sesión médica
  private handleSafeResetAndReload = () => {
    try {
      const keysToPreserve = [
        'amie_auth_token',
        'amie_user_session',
        'amie_doctor_colegiado',
        'amie_institutional_license'
      ];

      const backup: Record<string, string> = {};
      keysToPreserve.forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) backup[key] = val;
      });

      // Limpiar datos temporales o corruptos
      localStorage.clear();

      // Restaurar credenciales esenciales
      Object.entries(backup).forEach(([key, val]) => {
        localStorage.setItem(key, val);
      });
    } catch (e) {
      console.warn('Aviso al purgar caché selectiva:', e);
    }

    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // 1. Fallback personalizado si se suministra vía prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || this.state.error?.toString() || 'Excepción no identificada';
      const isCompact = Boolean(this.props.isComponentLevel);

      // 2. Vista reducida para widgets o tarjetas modulares dentro del dashboard
      if (isCompact) {
        return (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Módulo Interceptado por Escudo Clínico
              </span>
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Reintentar
              </button>
            </div>
            <p className="text-[11px] text-slate-300 font-mono line-clamp-2">
              {errorMessage}
            </p>
          </div>
        );
      }

      // 3. Vista principal para fallos a nivel de aplicación completa
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-100">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl shadow-rose-500/10 space-y-4">
            
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white uppercase tracking-wider">
                  Escudo de Seguridad AMIE • Excepción Interceptada
                </h1>
                <p className="text-xs text-slate-400">
                  Se ha detenido el colapso del árbol de componentes antes de comprometer la estabilidad del sistema.
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Un componente intentó acceder a una propiedad no definida en el expediente clínico o telemetría. Puede intentar un reensamblado suave o una recarga con purga de caché selectiva (sus credenciales y licencias se mantendrán intactas).
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] text-rose-300 overflow-auto max-h-52 border border-slate-800 space-y-2">
              <strong className="text-rose-400 block">{errorMessage}</strong>
              {this.state.errorInfo?.componentStack && (
                <div className="text-[10px] text-slate-400 whitespace-pre-wrap leading-tight opacity-80 border-t border-slate-800/80 pt-2">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                Reintentar Renderizado
              </button>

              <button
                type="button"
                onClick={this.handleSafeResetAndReload}
                className="flex-1 w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Purgar Caché &amp; Reiniciar
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
