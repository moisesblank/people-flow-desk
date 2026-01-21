// ============================================
// ⚡ DOGMA X: A VIGÍLIA ETERNA DA OTIMIZAÇÃO ⚡
// ============================================
// A performance não é um projeto com início e fim.
// É uma vigília constante.

import { supabase } from '@/integrations/supabase/client';

// ============================================
// CORE WEB VITALS COLLECTION
// ============================================

interface WebVitalsMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface RUMPayload {
  sessionId: string;
  url: string;
  timestamp: string;
  metrics: WebVitalsMetric[];
  device: {
    type: string;
    browser: string;
    os: string;
    viewport: { width: number; height: number };
    connection?: string;
  };
  performance: {
    domNodes: number;
    jsHeapSize?: number;
    resourceCount: number;
    totalTransferSize: number;
  };
}

// ============================================
// THRESHOLDS (Based on Google's Core Web Vitals)
// ============================================

const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: keyof typeof VITALS_THRESHOLDS, value: number): WebVitalsMetric['rating'] {
  const threshold = VITALS_THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// ============================================
// REAL USER MONITORING CLASS
// ============================================

class RealUserMonitor {
  private sessionId: string;
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private reportTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    // 🔒 P0 FIX: Usar UUID válido para analytics_metrics.session_id
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback para browsers antigos
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Observe Paint Timing (FCP)
    this.observePaint();
    
    // Observe Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // Observe First Input Delay (FID)
    this.observeFID();
    
    // Observe Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // Observe Interaction to Next Paint (INP)
    this.observeINP();

    // Report on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.report();
      }
    });

    // Also report before unload
    window.addEventListener('beforeunload', () => this.report());

    console.log('[DOGMA X] ⚡ Real User Monitoring inicializado');
  }

  private observePaint(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[RUM] Paint observer not supported');
    }
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordMetric('LCP', lastEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[RUM] LCP observer not supported');
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          if (fidEntry.processingStart) {
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.recordMetric('FID', fid);
          }
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[RUM] FID observer not supported');
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            clsEntries.push(entry);
            clsValue += layoutShift.value;
            this.recordMetric('CLS', clsValue);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[RUM] CLS observer not supported');
    }
  }

  private observeINP(): void {
    try {
      let maxINP = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as PerformanceEventTiming;
          const inp = eventEntry.duration;
          if (inp > maxINP) {
            maxINP = inp;
            this.recordMetric('INP', inp);
          }
        }
      });
      observer.observe({ entryTypes: ['event'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[RUM] INP observer not supported');
    }
  }

  private recordMetric(name: WebVitalsMetric['name'], value: number): void {
    const existing = this.metrics.get(name);
    const metric: WebVitalsMetric = {
      name,
      value,
      rating: getRating(name, value),
      delta: existing ? value - existing.value : value,
      id: `${name}_${Date.now()}`,
    };
    this.metrics.set(name, metric);

    // Log in development
    if (import.meta.env.DEV) {
      const color = metric.rating === 'good' ? '#0f0' : metric.rating === 'poor' ? '#f00' : '#ff0';
      console.log(`%c[RUM] ${name}: ${value.toFixed(2)} (${metric.rating})`, `color: ${color}`);
    }

    // Schedule report
    this.scheduleReport();
  }

  private scheduleReport(): void {
    if (this.reportTimeout) clearTimeout(this.reportTimeout);
    this.reportTimeout = setTimeout(() => this.report(), 5000);
  }

  private getDeviceInfo(): RUMPayload['device'] {
    const ua = navigator.userAgent;
    const connection = (navigator as any).connection;
    
    return {
      type: /Mobile|Android|iPhone|iPad/.test(ua) ? 'mobile' : 'desktop',
      browser: this.detectBrowser(ua),
      os: this.detectOS(ua),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      connection: connection?.effectiveType,
    };
  }

  private detectBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private detectOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Other';
  }

  private getPerformanceInfo(): RUMPayload['performance'] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const memory = (performance as any).memory;
    
    return {
      domNodes: document.querySelectorAll('*').length,
      jsHeapSize: memory?.usedJSHeapSize,
      resourceCount: resources.length,
      totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    };
  }

  async report(): Promise<void> {
    if (this.metrics.size === 0) return;

    const payload: RUMPayload = {
      sessionId: this.sessionId,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      metrics: Array.from(this.metrics.values()),
      device: this.getDeviceInfo(),
      performance: this.getPerformanceInfo(),
    };

    // Log report
    console.log('[DOGMA X] 📊 RUM Report:', payload);

    // Send to analytics_metrics table
    try {
      await supabase.from('analytics_metrics').insert([{
        metric_type: 'rum_vitals',
        page_path: window.location.pathname,
        session_id: this.sessionId,
        device_type: payload.device.type,
        browser: payload.device.browser,
        metadata: {
          metrics: payload.metrics,
          device: payload.device,
          performance: payload.performance,
        } as any,
      }]);
    } catch (error) {
      console.warn('[RUM] Failed to send metrics:', error);
    }
  }

  getMetrics(): Map<string, WebVitalsMetric> {
    return new Map(this.metrics);
  }

  getScore(): number {
    let score = 100;
    
    this.metrics.forEach((metric) => {
      if (metric.rating === 'poor') score -= 20;
      else if (metric.rating === 'needs-improvement') score -= 10;
    });
    
    return Math.max(0, score);
  }

  destroy(): void {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    if (this.reportTimeout) clearTimeout(this.reportTimeout);
  }
}

export const rum = new RealUserMonitor();

// ============================================
// LIGHTHOUSE CI CONFIG (for reference)
// ============================================

export const LIGHTHOUSE_CI_CONFIG = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

// ============================================
// INIT ON LOAD
// ============================================

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => rum.init());
  } else {
    rum.init();
  }
}

console.log('[DOGMA X] ⚡ Sistema de Real User Monitoring carregado');
