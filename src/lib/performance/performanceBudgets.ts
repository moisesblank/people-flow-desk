// ============================================
// ⚡ DOGMA IX: A PEREGRINAÇÃO AO 3G ⚡
// ============================================
// Para alcançar o paraíso da performance,
// é preciso primeiro caminhar pelo inferno da conectividade ruim.

// ============================================
// PERFORMANCE BUDGETS - Orçamentos Sagrados
// ============================================

export const PERFORMANCE_BUDGETS = {
  // Bundle size limits (gzipped bytes)
  bundle: {
    mainJs: 100 * 1024,      // 100KB - JavaScript principal
    mainCss: 30 * 1024,      // 30KB - CSS principal
    totalInitial: 200 * 1024, // 200KB - Total inicial
    maxChunk: 50 * 1024,     // 50KB - Chunk máximo
    maxAsset: 300 * 1024,    // 300KB - Asset máximo (imagens, etc)
  },
  
  // Core Web Vitals targets
  vitals: {
    LCP: 2500,   // Largest Contentful Paint: < 2.5s
    FID: 100,    // First Input Delay: < 100ms
    CLS: 0.1,    // Cumulative Layout Shift: < 0.1
    FCP: 1800,   // First Contentful Paint: < 1.8s
    TTFB: 600,   // Time to First Byte: < 600ms
    TTI: 3800,   // Time to Interactive: < 3.8s
  },
  
  // Resource counts
  resources: {
    maxRequests: 50,        // Máximo de requisições
    maxDomNodes: 1500,      // Máximo de nós DOM
    maxJsHeap: 50 * 1024 * 1024, // 50MB heap máximo
  },
  
  // 3G simulation thresholds
  slowNetwork: {
    maxLoadTime: 5000,      // 5s em 3G
    maxTTI: 8000,           // 8s para interatividade em 3G
  },
};

// ============================================
// BUDGET CHECKER
// ============================================

interface BudgetResult {
  passed: boolean;
  metric: string;
  actual: number;
  budget: number;
  unit: string;
  severity: 'pass' | 'warning' | 'error';
}

export function checkBudget(
  metric: string,
  actual: number,
  budget: number,
  unit: string = ''
): BudgetResult {
  const passed = actual <= budget;
  const ratio = actual / budget;
  
  let severity: BudgetResult['severity'] = 'pass';
  if (ratio > 1) severity = 'error';
  else if (ratio > 0.8) severity = 'warning';
  
  return { passed, metric, actual, budget, unit, severity };
}

export function runBudgetAudit(): BudgetResult[] {
  const results: BudgetResult[] = [];
  
  // Check resource timing
  if (typeof performance !== 'undefined') {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Count requests
    results.push(checkBudget(
      'Total Requests',
      resources.length,
      PERFORMANCE_BUDGETS.resources.maxRequests,
      'requests'
    ));
    
    // Check JS size
    const jsResources = resources.filter(r => r.initiatorType === 'script');
    const totalJsSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    results.push(checkBudget(
      'JavaScript Total',
      totalJsSize,
      PERFORMANCE_BUDGETS.bundle.mainJs * 2,
      'bytes'
    ));
    
    // Check CSS size
    const cssResources = resources.filter(r => r.initiatorType === 'link' || r.name.endsWith('.css'));
    const totalCssSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    results.push(checkBudget(
      'CSS Total',
      totalCssSize,
      PERFORMANCE_BUDGETS.bundle.mainCss * 2,
      'bytes'
    ));
  }
  
  // Check DOM nodes
  if (typeof document !== 'undefined') {
    results.push(checkBudget(
      'DOM Nodes',
      document.querySelectorAll('*').length,
      PERFORMANCE_BUDGETS.resources.maxDomNodes,
      'nodes'
    ));
  }
  
  // Check memory
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    results.push(checkBudget(
      'JS Heap Size',
      (performance as any).memory.usedJSHeapSize,
      PERFORMANCE_BUDGETS.resources.maxJsHeap,
      'bytes'
    ));
  }
  
  return results;
}

// ============================================
// 3G SIMULATION DETECTOR
// ============================================

export interface NetworkCondition {
  type: 'fast' | 'slow-3g' | 'fast-3g' | 'offline';
  downlink: number;
  rtt: number;
  effectiveType: string;
}

export function detectNetworkCondition(): NetworkCondition {
  const connection = (navigator as any).connection;
  
  if (!connection) {
    return { type: 'fast', downlink: 10, rtt: 50, effectiveType: '4g' };
  }
  
  const { effectiveType, downlink, rtt } = connection;
  
  let type: NetworkCondition['type'] = 'fast';
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    type = 'slow-3g';
  } else if (effectiveType === '3g') {
    type = 'fast-3g';
  } else if (!navigator.onLine) {
    type = 'offline';
  }
  
  return { type, downlink: downlink || 0, rtt: rtt || 0, effectiveType: effectiveType || 'unknown' };
}

// ============================================
// ADAPTIVE LOADING BASED ON NETWORK
// ============================================

export function getLoadingStrategy(): {
  images: 'high' | 'medium' | 'low' | 'none';
  prefetch: boolean;
  animations: boolean;
  lazyThreshold: number;
} {
  const network = detectNetworkCondition();
  
  switch (network.type) {
    case 'offline':
      return { images: 'none', prefetch: false, animations: false, lazyThreshold: 0 };
    case 'slow-3g':
      return { images: 'low', prefetch: false, animations: false, lazyThreshold: 100 };
    case 'fast-3g':
      return { images: 'medium', prefetch: true, animations: false, lazyThreshold: 200 };
    default:
      return { images: 'high', prefetch: true, animations: true, lazyThreshold: 500 };
  }
}

// ============================================
// PERFORMANCE BUDGET ENFORCER
// ============================================

export class BudgetEnforcer {
  private violations: BudgetResult[] = [];
  private observers: PerformanceObserver[] = [];

  start(): void {
    // Monitor long tasks
    if (typeof PerformanceObserver !== 'undefined') {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`[DOGMA IX] ⚠️ Long Task detected: ${entry.duration.toFixed(0)}ms`);
          }
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        // longtask not supported
      }
      
      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.transferSize > PERFORMANCE_BUDGETS.bundle.maxChunk) {
            this.violations.push({
              passed: false,
              metric: `Large Resource: ${resource.name}`,
              actual: resource.transferSize,
              budget: PERFORMANCE_BUDGETS.bundle.maxChunk,
              unit: 'bytes',
              severity: 'warning',
            });
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
    
    console.log('[DOGMA IX] ⚡ Budget Enforcer ativado');
  }

  stop(): void {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
  }

  getViolations(): BudgetResult[] {
    return [...this.violations];
  }

  generateReport(): string {
    const audit = runBudgetAudit();
    const allResults = [...audit, ...this.violations];
    
    const passed = allResults.filter(r => r.severity === 'pass').length;
    const warnings = allResults.filter(r => r.severity === 'warning').length;
    const errors = allResults.filter(r => r.severity === 'error').length;
    
    let report = `\n╔══════════════════════════════════════╗\n`;
    report += `║  DOGMA IX - PERFORMANCE BUDGET REPORT ║\n`;
    report += `╠══════════════════════════════════════╣\n`;
    report += `║  ✅ Passed:   ${passed.toString().padStart(3)}                     ║\n`;
    report += `║  ⚠️ Warnings: ${warnings.toString().padStart(3)}                     ║\n`;
    report += `║  ❌ Errors:   ${errors.toString().padStart(3)}                     ║\n`;
    report += `╚══════════════════════════════════════╝\n`;
    
    if (errors > 0 || warnings > 0) {
      report += '\nDetails:\n';
      allResults
        .filter(r => r.severity !== 'pass')
        .forEach(r => {
          const icon = r.severity === 'error' ? '❌' : '⚠️';
          report += `${icon} ${r.metric}: ${formatValue(r.actual, r.unit)} / ${formatValue(r.budget, r.unit)}\n`;
        });
    }
    
    return report;
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === 'bytes') {
    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`;
    return `${value}B`;
  }
  return `${value}${unit}`;
}

export const budgetEnforcer = new BudgetEnforcer();

console.log('[DOGMA IX] ⚡ Sistema de Performance Budgets carregado');
