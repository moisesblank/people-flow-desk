// ============================================
// 🔥 LOAD TEST SIMULATOR v1.0 - LEI I (Performance 3500/3G)
// Teste de carga simulado executável no browser
// Para validação rápida sem k6 externo
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { RATE_LIMIT_CONFIG } from "@/lib/rateLimiter";

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  successRate: number;
  errors: string[];
  passed: boolean;
  threshold: number;
}

export interface LoadTestReport {
  timestamp: string;
  duration: number;
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    overallScore: number;
  };
  lei1Compliance: boolean;
}

// ============================================
// THRESHOLDS (LEI I - Performance 3500/3G)
// ============================================
const THRESHOLDS = {
  // Queries leves < 100ms
  lightQuery: 100,
  // Queries médias < 300ms
  mediumQuery: 300,
  // Queries pesadas < 500ms
  heavyQuery: 500,
  // Rate limiter check < 50ms (local)
  rateLimitLocal: 50,
  // Rate limiter check < 200ms (backend)
  rateLimitBackend: 200,
  // Edge Function < 500ms
  edgeFunction: 500,
  // UI Render < 16ms (60fps)
  uiRender: 16,
};

// ============================================
// UTILITIES
// ============================================

function calculateP95(times: number[]): number {
  if (times.length === 0) return 0;
  const sorted = [...times].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[index] || sorted[sorted.length - 1];
}

async function measureAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T | null; time: number; error: string | null }> {
  const start = performance.now();
  try {
    const result = await fn();
    return { result, time: performance.now() - start, error: null };
  } catch (err) {
    return { result: null, time: performance.now() - start, error: String(err) };
  }
}

function measureSync<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now();
  const result = fn();
  return { result, time: performance.now() - start };
}

// ============================================
// BENCHMARK: QUERIES LEVES
// ============================================
async function benchmarkLightQueries(iterations: number = 10): Promise<BenchmarkResult> {
  const times: number[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const { time, error } = await measureAsync(async () => {
      // Query leve: count de tabela pequena
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      return count;
    });
    
    times.push(time);
    if (error) errors.push(error);
    
    // Pequeno delay para não sobrecarregar
    await new Promise(r => setTimeout(r, 50));
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    name: 'Light Queries (categories count)',
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p95Time: calculateP95(times),
    successRate: ((iterations - errors.length) / iterations) * 100,
    errors,
    passed: avgTime < THRESHOLDS.lightQuery,
    threshold: THRESHOLDS.lightQuery,
  };
}

// ============================================
// BENCHMARK: QUERIES MÉDIAS
// ============================================
async function benchmarkMediumQueries(iterations: number = 5): Promise<BenchmarkResult> {
  const times: number[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      // Query média: lista paginada
      const query = supabase.from('courses').select('id, name, is_active').limit(20);
      await (query as any);
      times.push(performance.now() - start);
    } catch (err) {
      times.push(performance.now() - start);
      errors.push(String(err));
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    name: 'Medium Queries (courses list)',
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p95Time: calculateP95(times),
    successRate: ((iterations - errors.length) / iterations) * 100,
    errors,
    passed: avgTime < THRESHOLDS.mediumQuery,
    threshold: THRESHOLDS.mediumQuery,
  };
}

// ============================================
// BENCHMARK: RATE LIMITER LOCAL
// ============================================
function benchmarkRateLimiterLocal(iterations: number = 100): BenchmarkResult {
  const times: number[] = [];
  const errors: string[] = [];
  
  // Simula verificação local de rate limit
  const cache = new Map<string, { count: number; resetAt: number }>();
  
  for (let i = 0; i < iterations; i++) {
    const { time } = measureSync(() => {
      const key = `test-endpoint-${i % 10}`;
      const now = Date.now();
      const cached = cache.get(key);
      
      if (cached && cached.resetAt > now) {
        if (cached.count >= 30) {
          return false; // blocked
        }
        cached.count++;
      } else {
        cache.set(key, { count: 1, resetAt: now + 60000 });
      }
      return true;
    });
    
    times.push(time);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    name: 'Rate Limiter (local check)',
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p95Time: calculateP95(times),
    successRate: 100,
    errors,
    passed: avgTime < THRESHOLDS.rateLimitLocal,
    threshold: THRESHOLDS.rateLimitLocal,
  };
}

// ============================================
// BENCHMARK: RATE LIMITER BACKEND
// ============================================
async function benchmarkRateLimiterBackend(iterations: number = 3): Promise<BenchmarkResult> {
  const times: number[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const { time, error } = await measureAsync(async () => {
      const { data } = await supabase.functions.invoke('rate-limit-gateway', {
        body: { endpoint: 'benchmark-test', action: 'check' }
      });
      return data;
    });
    
    times.push(time);
    if (error) errors.push(error);
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    name: 'Rate Limiter (backend check)',
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p95Time: calculateP95(times),
    successRate: ((iterations - errors.length) / iterations) * 100,
    errors,
    passed: avgTime < THRESHOLDS.rateLimitBackend,
    threshold: THRESHOLDS.rateLimitBackend,
  };
}

// ============================================
// BENCHMARK: UI RENDER PERFORMANCE
// ============================================
function benchmarkUIRender(iterations: number = 50): BenchmarkResult {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const { time } = measureSync(() => {
      // Simula operações de render
      const elements = [];
      for (let j = 0; j < 100; j++) {
        elements.push({
          id: `item-${j}`,
          content: `Content ${j}`,
          timestamp: Date.now(),
        });
      }
      // Simula virtual DOM diff
      const filtered = elements.filter(e => e.id.includes('5'));
      const mapped = filtered.map(e => ({ ...e, processed: true }));
      return mapped;
    });
    
    times.push(time);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    name: 'UI Render Simulation (100 items)',
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p95Time: calculateP95(times),
    successRate: 100,
    errors: [],
    passed: avgTime < THRESHOLDS.uiRender,
    threshold: THRESHOLDS.uiRender,
  };
}

// ============================================
// BENCHMARK: MEMORY STRESS
// ============================================
function benchmarkMemoryStress(): BenchmarkResult {
  const times: number[] = [];
  const iterations = 10;
  
  for (let i = 0; i < iterations; i++) {
    const { time } = measureSync(() => {
      // Cria e descarta arrays grandes
      const largeArray = new Array(10000).fill(null).map((_, idx) => ({
        id: idx,
        data: `message-${idx}`,
        timestamp: Date.now(),
        metadata: { processed: false, priority: idx % 5 }
      }));
      
      // Operações em memória
      const sorted = largeArray.sort((a, b) => b.timestamp - a.timestamp);
      const sliced = sorted.slice(0, 150);
      
      return sliced.length;
    });
    
    times.push(time);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    name: 'Memory Stress (10k items sort/slice)',
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p95Time: calculateP95(times),
    successRate: 100,
    errors: [],
    passed: avgTime < 50, // 50ms threshold
    threshold: 50,
  };
}

// ============================================
// BENCHMARK: CONCURRENT REQUESTS SIMULATION
// ============================================
async function benchmarkConcurrentSimulation(concurrency: number = 5): Promise<BenchmarkResult> {
  const times: number[] = [];
  const errors: string[] = [];
  
  const start = performance.now();
  
  // Simula N requisições concorrentes
  const promises = Array(concurrency).fill(null).map(async (_, idx) => {
    const queryStart = performance.now();
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .limit(5);
      times.push(performance.now() - queryStart);
      return data;
    } catch (err) {
      times.push(performance.now() - queryStart);
      errors.push(`Request ${idx}: ${err}`);
      return null;
    }
  });
  
  await Promise.all(promises);
  
  const totalTime = performance.now() - start;
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    name: `Concurrent Requests (${concurrency} simultaneous)`,
    iterations: concurrency,
    totalTime,
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p95Time: calculateP95(times),
    successRate: ((concurrency - errors.length) / concurrency) * 100,
    errors,
    passed: avgTime < THRESHOLDS.mediumQuery,
    threshold: THRESHOLDS.mediumQuery,
  };
}

// ============================================
// MAIN: RUN ALL BENCHMARKS
// ============================================
export async function runLoadTestSimulation(
  onProgress?: (message: string, percent: number) => void
): Promise<LoadTestReport> {
  const startTime = performance.now();
  const results: BenchmarkResult[] = [];
  
  onProgress?.('Iniciando benchmark...', 0);
  
  // 1. Light Queries
  onProgress?.('Testando queries leves...', 10);
  results.push(await benchmarkLightQueries(10));
  
  // 2. Medium Queries
  onProgress?.('Testando queries médias...', 25);
  results.push(await benchmarkMediumQueries(5));
  
  // 3. Rate Limiter Local
  onProgress?.('Testando rate limiter local...', 40);
  results.push(benchmarkRateLimiterLocal(100));
  
  // 4. Rate Limiter Backend
  onProgress?.('Testando rate limiter backend...', 55);
  results.push(await benchmarkRateLimiterBackend(3));
  
  // 5. UI Render
  onProgress?.('Testando render UI...', 70);
  results.push(benchmarkUIRender(50));
  
  // 6. Memory Stress
  onProgress?.('Testando stress de memória...', 80);
  results.push(benchmarkMemoryStress());
  
  // 7. Concurrent
  onProgress?.('Testando requisições concorrentes...', 90);
  results.push(await benchmarkConcurrentSimulation(5));
  
  onProgress?.('Finalizando...', 100);
  
  const duration = performance.now() - startTime;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  const report: LoadTestReport = {
    timestamp: new Date().toISOString(),
    duration,
    results,
    summary: {
      totalTests: results.length,
      passed,
      failed,
      overallScore: Math.round((passed / results.length) * 100),
    },
    lei1Compliance: passed === results.length,
  };
  
  console.log('📊 Load Test Report:', report);
  
  return report;
}

// ============================================
// QUICK TEST (para validação rápida)
// ============================================
export async function runQuickBenchmark(): Promise<{ passed: boolean; score: number; message: string }> {
  try {
    const report = await runLoadTestSimulation();
    
    return {
      passed: report.lei1Compliance,
      score: report.summary.overallScore,
      message: report.lei1Compliance 
        ? `✅ LEI I OK: ${report.summary.passed}/${report.summary.totalTests} testes passaram`
        : `⚠️ LEI I ATENÇÃO: ${report.summary.failed} testes falharam`
    };
  } catch (err) {
    return {
      passed: false,
      score: 0,
      message: `❌ Erro no benchmark: ${err}`
    };
  }
}

export default runLoadTestSimulation;
