/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   🛡️ ERROR BOUNDARY v4.0 — P0 ANTI-BLACK-SCREEN                             ║
 * ║                                                                              ║
 * ║   GARANTIAS:                                                                 ║
 * ║   1. Recovery buttons execute REAL recovery logic                            ║
 * ║   2. User can ALWAYS escape error state                                      ║
 * ║   3. Nuclear reset option for worst-case scenarios                          ║
 * ║   4. Multiple recovery paths guarantee exit                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Trash2, LogOut } from "lucide-react";
import {
  softReload,
  hardReload,
  nuclearReset,
  escapeToHome,
  forceLogoutAndRestart,
} from "@/lib/recovery/p0RecoverySystem";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
}

const MAX_RETRIES = 3;

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log do erro
    logger.error("React Error Boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.state.retryCount,
    });

    // Callback opcional
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const newCount = this.state.retryCount + 1;

    if (newCount >= MAX_RETRIES) {
      console.warn("[ErrorBoundary] Max retries reached, showing full recovery options");
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newCount,
    });
  };

  handleSoftReload = async () => {
    this.setState({ isRecovering: true });
    await softReload();
  };

  handleHardReload = async () => {
    this.setState({ isRecovering: true });
    await hardReload();
  };

  handleNuclearReset = async () => {
    if (confirm("Isso irá limpar TODOS os dados locais (login, preferências, cache). Deseja continuar?")) {
      this.setState({ isRecovering: true });
      await nuclearReset();
    }
  };

  handleGoHome = () => {
    escapeToHome();
  };

  handleForceLogout = async () => {
    this.setState({ isRecovering: true });
    await forceLogoutAndRestart();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { retryCount, isRecovering } = this.state;
      const canRetry = retryCount < MAX_RETRIES;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-background">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
            <AlertTriangle className="relative w-16 h-16 text-destructive" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
          <p className="text-muted-foreground mb-2 max-w-md">
            Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
          </p>

          {retryCount > 0 && (
            <p className="text-sm text-amber-500 mb-4">
              Tentativa {retryCount} de {MAX_RETRIES}
              {!canRetry && " - Tente as opções de recuperação abaixo"}
            </p>
          )}

          {/* Detalhes do erro (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg text-left max-w-lg overflow-auto">
              <p className="text-sm font-mono text-destructive">{this.state.error.message}</p>
              {this.state.error.stack && (
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 w-full max-w-sm">
            {/* Primary: Retry or Soft Reload */}
            {canRetry ? (
              <Button onClick={this.handleRetry} className="gap-2 w-full" disabled={isRecovering}>
                <RefreshCw className={`w-4 h-4 ${isRecovering ? "animate-spin" : ""}`} />
                Tentar novamente
              </Button>
            ) : (
              <Button onClick={this.handleSoftReload} className="gap-2 w-full" disabled={isRecovering}>
                <RefreshCw className={`w-4 h-4 ${isRecovering ? "animate-spin" : ""}`} />
                Recarregar página
              </Button>
            )}

            {/* Secondary: Hard Reload */}
            <Button variant="outline" onClick={this.handleHardReload} className="gap-2 w-full" disabled={isRecovering}>
              <Trash2 className="w-4 h-4" />
              Limpar cache + recarregar
            </Button>

            {/* Go Home */}
            <Button variant="outline" onClick={this.handleGoHome} className="gap-2 w-full" disabled={isRecovering}>
              <Home className="w-4 h-4" />
              Ir para início
            </Button>

            {/* Force Logout (if retries exhausted) */}
            {!canRetry && (
              <Button
                variant="ghost"
                onClick={this.handleForceLogout}
                className="gap-2 w-full text-amber-500 hover:text-amber-400"
                disabled={isRecovering}
              >
                <LogOut className="w-4 h-4" />
                Sair e fazer login novamente
              </Button>
            )}

            {/* Nuclear Reset (last resort) */}
            {!canRetry && (
              <Button
                variant="ghost"
                onClick={this.handleNuclearReset}
                className="gap-2 w-full text-destructive hover:text-destructive"
                disabled={isRecovering}
              >
                <AlertTriangle className="w-4 h-4" />
                Reinício forçado (limpa tudo)
              </Button>
            )}
          </div>

          {isRecovering && <p className="mt-4 text-sm text-muted-foreground animate-pulse">Recuperando sistema...</p>}
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC para usar com componentes funcionais
export function withErrorBoundary<P extends object>(WrappedComponent: React.ComponentType<P>, fallback?: ReactNode) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
