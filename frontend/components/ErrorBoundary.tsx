import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Error capturado por el escudo:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-red-950/40 border-2 border-red-500/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl shadow-red-500/10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-bold text-red-400">Crash de Renderizado Interceptado</h1>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Un componente interno intentó leer un dato que no existe (undefined). En lugar de mostrar una pantalla negra, el escudo ha detenido el colapso.
            </p>
            
            <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-red-300 overflow-auto mb-6 max-h-64 border border-red-900/50">
              <strong className="text-red-400 text-sm">{this.state.error?.toString()}</strong>
              <div className="mt-2 whitespace-pre-wrap opacity-80">
                {this.state.errorInfo?.componentStack}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.clear(); // Limpiamos caché por si hay datos corruptos
                window.location.reload();
              }}
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold transition"
            >
              <RefreshCcw className="w-4 h-4" />
              Limpiar Caché y Reiniciar App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
