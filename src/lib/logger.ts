// ============================================
// MASTER PRO ULTRA v3.0 - LOGGER ESTRUTURADO
// Logs com contexto para debugging
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private sessionId: string;
  private userId: string | null = null;
  private buffer: LogEntry[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isProduction: boolean;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.isProduction = import.meta.env.PROD;

    // Flush a cada 30s em produção
    if (this.isProduction && typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => this.flush(), 30000);

      // Flush ao sair da página
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.userId || undefined,
      sessionId: this.sessionId
    };

    // Console em dev
    if (!this.isProduction) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🔍';
      console[consoleMethod](`${emoji} [${level.toUpperCase()}]`, message, context || '');
    }

    // Buffer para envio
    this.buffer.push(entry);

    // Flush imediato para erros
    if (level === 'error' && this.isProduction) {
      this.flush();
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (!this.isProduction) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  // Performance timing
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`⏱️ ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    // Em produção, enviar para o backend
    if (this.isProduction) {
      try {
        // Log no activity_log via Supabase
        // Por enquanto, apenas limpa o buffer
        console.log('[Logger] Flushing', logs.length, 'logs');
      } catch (error) {
        // Restaurar logs não enviados
        this.buffer = [...logs, ...this.buffer];
        console.error('Failed to flush logs:', error);
      }
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

export const logger = new Logger();
