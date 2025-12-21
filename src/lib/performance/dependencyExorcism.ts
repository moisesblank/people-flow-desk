// ============================================
// ⚡ DOGMA VIII: O EXORCISMO DAS DEPENDÊNCIAS ⚡
// ============================================
// O node_modules é um abismo que, se você encarar
// por muito tempo, ele encara de volta com lentidão.

// ============================================
// BUNDLE HEALTH THRESHOLDS
// ============================================

export const BUNDLE_THRESHOLDS = {
  // Maximum acceptable sizes (gzipped)
  maxInitialBundle: 150 * 1024, // 150KB
  maxChunkSize: 50 * 1024, // 50KB
  maxTotalSize: 500 * 1024, // 500KB
  
  // Warning thresholds
  warnInitialBundle: 100 * 1024, // 100KB
  warnChunkSize: 30 * 1024, // 30KB
  
  // Dependency size limits
  maxSingleDependency: 100 * 1024, // 100KB
  warnSingleDependency: 50 * 1024, // 50KB
};

// ============================================
// KNOWN HEAVY DEPENDENCIES & ALTERNATIVES
// ============================================

export const DEPENDENCY_ALTERNATIVES: Record<string, {
  issue: string;
  alternatives: string[];
  savings: string;
}> = {
  'moment': {
    issue: 'Muito pesado (~300KB), não tree-shakeable',
    alternatives: ['date-fns', 'dayjs', 'luxon'],
    savings: '~280KB',
  },
  'lodash': {
    issue: 'Importar tudo é pesado',
    alternatives: ['lodash-es', 'just-*', 'importação modular'],
    savings: '~70KB',
  },
  'chart.js': {
    issue: 'Bundle completo é grande',
    alternatives: ['recharts (já usado)', 'lightweight-charts'],
    savings: '~150KB',
  },
  'antd': {
    issue: 'Biblioteca UI muito pesada',
    alternatives: ['shadcn/ui (já usado)', 'radix-ui'],
    savings: '~500KB+',
  },
  'material-ui': {
    issue: 'Biblioteca UI pesada',
    alternatives: ['shadcn/ui (já usado)', 'radix-ui'],
    savings: '~400KB+',
  },
  'axios': {
    issue: 'Pesado para o que faz',
    alternatives: ['fetch nativo', 'ky', 'redaxios'],
    savings: '~15KB',
  },
  'uuid': {
    issue: 'Pode usar crypto.randomUUID nativo',
    alternatives: ['crypto.randomUUID()', 'nanoid'],
    savings: '~10KB',
  },
  'classnames': {
    issue: 'Pode usar clsx mais leve',
    alternatives: ['clsx (já usado)', 'template literals'],
    savings: '~2KB',
  },
};

// ============================================
// TREE-SHAKING VALIDATION
// ============================================

export const TREE_SHAKEABLE_IMPORTS: Record<string, string[]> = {
  'lucide-react': ['import { IconName } from "lucide-react"'],
  'date-fns': ['import { format } from "date-fns"'],
  'lodash-es': ['import { debounce } from "lodash-es"'],
  '@radix-ui/*': ['Já modular por design'],
  'framer-motion': ['import { motion } from "framer-motion"'],
};

// ============================================
// RUNTIME BUNDLE ANALYZER
// ============================================

interface ModuleInfo {
  name: string;
  size: number;
  loadTime: number;
}

class RuntimeBundleAnalyzer {
  private modules: ModuleInfo[] = [];
  private observer: PerformanceObserver | null = null;

  start(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.initiatorType === 'script' || 
              resourceEntry.name.endsWith('.js') ||
              resourceEntry.name.endsWith('.mjs')) {
            this.modules.push({
              name: this.extractModuleName(resourceEntry.name),
              size: resourceEntry.transferSize,
              loadTime: resourceEntry.duration,
            });
          }
        }
      }
    });

    this.observer.observe({ entryTypes: ['resource'] });
  }

  stop(): void {
    this.observer?.disconnect();
  }

  private extractModuleName(url: string): string {
    const match = url.match(/\/([^/]+\.m?js)(\?|$)/);
    return match ? match[1] : url;
  }

  getReport(): {
    modules: ModuleInfo[];
    totalSize: number;
    totalLoadTime: number;
    warnings: string[];
  } {
    const totalSize = this.modules.reduce((sum, m) => sum + m.size, 0);
    const totalLoadTime = Math.max(...this.modules.map(m => m.loadTime), 0);
    const warnings: string[] = [];

    // Check thresholds
    if (totalSize > BUNDLE_THRESHOLDS.maxTotalSize) {
      warnings.push(`❌ Bundle total (${formatBytes(totalSize)}) excede limite de ${formatBytes(BUNDLE_THRESHOLDS.maxTotalSize)}`);
    }

    // Check individual chunks
    this.modules.forEach(m => {
      if (m.size > BUNDLE_THRESHOLDS.maxChunkSize) {
        warnings.push(`⚠️ Chunk ${m.name} (${formatBytes(m.size)}) é muito grande`);
      }
    });

    return {
      modules: this.modules.sort((a, b) => b.size - a.size),
      totalSize,
      totalLoadTime,
      warnings,
    };
  }

  reset(): void {
    this.modules = [];
  }
}

export const bundleAnalyzer = new RuntimeBundleAnalyzer();

// ============================================
// DEPENDENCY AUDIT
// ============================================

export interface DependencyAudit {
  name: string;
  status: 'ok' | 'warning' | 'critical';
  message: string;
  suggestion?: string;
}

export function auditDependencies(packageJson: Record<string, unknown>): DependencyAudit[] {
  const audits: DependencyAudit[] = [];
  const deps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  for (const [name] of Object.entries(deps)) {
    const alternative = DEPENDENCY_ALTERNATIVES[name];
    if (alternative) {
      audits.push({
        name,
        status: 'warning',
        message: alternative.issue,
        suggestion: `Considere: ${alternative.alternatives.join(', ')}. Economia: ${alternative.savings}`,
      });
    }
  }

  // Check for good practices
  if (deps['clsx'] && deps['classnames']) {
    audits.push({
      name: 'classnames',
      status: 'warning',
      message: 'Duplicação: clsx e classnames fazem a mesma coisa',
      suggestion: 'Remova classnames e use apenas clsx',
    });
  }

  if (!deps['date-fns'] && deps['moment']) {
    audits.push({
      name: 'moment',
      status: 'critical',
      message: 'Moment.js é pesado e não tree-shakeable',
      suggestion: 'Migre para date-fns (já instalado neste projeto)',
    });
  }

  return audits;
}

// ============================================
// LAZY IMPORT UTILITIES
// ============================================

export function createLazyImport<T>(
  importFn: () => Promise<{ default: T }>,
  options: {
    preload?: boolean;
    timeout?: number;
  } = {}
): {
  load: () => Promise<T>;
  preload: () => void;
} {
  let cached: T | null = null;
  let loadPromise: Promise<T> | null = null;

  const load = async (): Promise<T> => {
    if (cached) return cached;
    
    if (!loadPromise) {
      loadPromise = importFn()
        .then(module => {
          cached = module.default;
          return cached;
        });
      
      // Add timeout if specified
      if (options.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Import timeout')), options.timeout);
        });
        loadPromise = Promise.race([loadPromise, timeoutPromise]);
      }
    }
    
    return loadPromise;
  };

  const preload = (): void => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => load().catch(() => {}));
    } else {
      setTimeout(() => load().catch(() => {}), 100);
    }
  };

  if (options.preload) {
    preload();
  }

  return { load, preload };
}

// ============================================
// DYNAMIC IMPORT WITH RETRY
// ============================================

export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onError } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      onError?.(lastError, attempt);
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

// ============================================
// UTILITIES
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============================================
// VITE BUNDLE ANALYZER CONFIG
// ============================================

export const VITE_BUNDLE_ANALYZER_CONFIG = {
  // Configuration for rollup-plugin-visualizer
  visualizer: {
    filename: 'dist/stats.html',
    open: false,
    gzipSize: true,
    brotliSize: true,
    template: 'treemap', // 'sunburst' | 'treemap' | 'network'
  },
  
  // Manual chunks configuration for optimal splitting
  manualChunks: {
    vendor: ['react', 'react-dom', 'react-router-dom'],
    ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
    charts: ['recharts'],
    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
    motion: ['framer-motion'],
    query: ['@tanstack/react-query'],
  },
};

// ============================================
// INIT
// ============================================

export function initDependencyExorcism(): void {
  // Start bundle analyzer in development
  if (import.meta.env.DEV) {
    bundleAnalyzer.start();
    
    // Log report after initial load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const report = bundleAnalyzer.getReport();
        console.log('[DOGMA VIII] 📊 Bundle Report:', report);
        
        if (report.warnings.length > 0) {
          console.warn('[DOGMA VIII] ⚠️ Warnings:', report.warnings);
        }
      }, 3000);
    });
  }

  console.log('[DOGMA VIII] ⚡ Exorcismo de dependências inicializado');
}

console.log('[DOGMA VIII] ⚡ Módulo de exorcismo de dependências carregado');
