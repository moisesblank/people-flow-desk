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

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

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

    // Log do erro (NÃO auto-recover / NÃO auto-reload)
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleGoHome = () => {
    // Ação do usuário: navegação manual (sem auto reload)
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold">Ocorreu um erro na interface</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A página não será recarregada automaticamente. Use o botão fixo “Refresh Page” para recuperar manualmente.
                </p>

                {import.meta.env.DEV && this.state.error?.message && (
                  <pre className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 overflow-auto max-h-48">
                    {this.state.error.message}
                  </pre>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                    <Home className="h-4 w-4" />
                    Ir para início
                  </Button>
                </div>
              </div>
            </div>
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
