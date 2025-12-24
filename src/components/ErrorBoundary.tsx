// ============================================
// MASTER PRO ULTRA v3.0 - ERROR BOUNDARY
// Captura de erros com logging
// ============================================

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log do erro
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    // Callback opcional
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  // ⚡ SYNAPSE v7.0: Black Screen Gate - Recarregar sem cache
  handleReloadNoCache = async () => {
    try {
      // Limpar todos os caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      
      // Limpar Service Workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      
      // Recarregar com kill-switch
      const url = new URL(window.location.href);
      url.searchParams.set('nocache', '1');
      url.searchParams.set('ts', Date.now().toString());
      window.location.replace(url.toString());
    } catch {
      // Fallback: reload simples
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
            <AlertTriangle className="relative w-16 h-16 text-destructive" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
          </p>

          {/* Detalhes do erro (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg text-left max-w-lg overflow-auto">
              <p className="text-sm font-mono text-destructive">
                {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={this.handleRetry} 
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={this.handleGoHome}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Ir para início
            </Button>
            {/* ⚡ SYNAPSE v7.0: Black Screen Gate */}
            <Button 
              variant="destructive" 
              onClick={this.handleReloadNoCache}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpar cache e recarregar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC para usar com componentes funcionais
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
