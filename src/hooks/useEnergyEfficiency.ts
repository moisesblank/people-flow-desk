// ============================================
// ⚡ TESE 4: PROTOCOLO DE EFICIÊNCIA ENERGÉTICA
// O sistema se adapta às condições do usuário
// 3G ≠ Fibra | Hardware fraco ≠ Hardware potente
// ============================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConstitution, ConstitutionTier } from './useConstitution';

// ============================================
// TESE 4.1: MODO DE BAIXOS DADOS (SOBREVIVÊNCIA 3G)
// ============================================

/**
 * Configurações adaptativas por tier
 */
const ADAPTIVE_CONFIG: Record<ConstitutionTier, {
  imageQuality: number;
  maxImageWidth: number;
  videoAutoplay: boolean;
  animations: boolean;
  backgroundEffects: boolean;
  staleTimeMultiplier: number;
  prefetchEnabled: boolean;
  blurEffects: boolean;
  gradients: boolean;
  shadows: boolean;
}> = {
  critical: {
    imageQuality: 30,
    maxImageWidth: 480,
    videoAutoplay: false,
    animations: false,
    backgroundEffects: false,
    staleTimeMultiplier: 10,
    prefetchEnabled: false,
    blurEffects: false,
    gradients: false,
    shadows: false,
  },
  legacy: {
    imageQuality: 45,
    maxImageWidth: 640,
    videoAutoplay: false,
    animations: false,
    backgroundEffects: false,
    staleTimeMultiplier: 5,
    prefetchEnabled: false,
    blurEffects: false,
    gradients: false,
    shadows: true,
  },
  standard: {
    imageQuality: 60,
    maxImageWidth: 800,
    videoAutoplay: false,
    animations: true,
    backgroundEffects: false,
    staleTimeMultiplier: 3,
    prefetchEnabled: true,
    blurEffects: false,
    gradients: true,
    shadows: true,
  },
  enhanced: {
    imageQuality: 75,
    maxImageWidth: 1024,
    videoAutoplay: true,
    animations: true,
    backgroundEffects: true,
    staleTimeMultiplier: 2,
    prefetchEnabled: true,
    blurEffects: true,
    gradients: true,
    shadows: true,
  },
  neural: {
    imageQuality: 85,
    maxImageWidth: 1280,
    videoAutoplay: true,
    animations: true,
    backgroundEffects: true,
    staleTimeMultiplier: 1,
    prefetchEnabled: true,
    blurEffects: true,
    gradients: true,
    shadows: true,
  },
  quantum: {
    imageQuality: 95,
    maxImageWidth: 1920,
    videoAutoplay: true,
    animations: true,
    backgroundEffects: true,
    staleTimeMultiplier: 1,
    prefetchEnabled: true,
    blurEffects: true,
    gradients: true,
    shadows: true,
  },
};

/**
 * Hook principal de Eficiência Energética
 * TESE 4.1: Adapta-se automaticamente às condições do usuário
 */
export function useEnergyEfficiency() {
  const constitution = useConstitution();
  const { tier, isDataSaver, isSlowConnection, prefersReducedMotion } = constitution;
  
  const config = useMemo(() => ADAPTIVE_CONFIG[tier], [tier]);
  
  // ========== HELPERS ADAPTATIVOS ==========
  
  /**
   * Retorna URL de imagem com qualidade adaptada
   */
  const getAdaptiveImageUrl = useCallback((
    originalUrl: string,
    options?: { width?: number; quality?: number }
  ): string => {
    if (!originalUrl) return originalUrl;
    
    const maxWidth = options?.width 
      ? Math.min(options.width, config.maxImageWidth)
      : config.maxImageWidth;
    
    const quality = options?.quality ?? config.imageQuality;
    
    // Supabase Storage
    if (originalUrl.includes('supabase.co/storage')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}width=${maxWidth}&quality=${quality}`;
    }
    
    // Cloudinary
    if (originalUrl.includes('cloudinary.com')) {
      return originalUrl.replace('/upload/', `/upload/w_${maxWidth},q_${quality}/`);
    }
    
    // Imgix
    if (originalUrl.includes('imgix.net')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}w=${maxWidth}&q=${quality}&auto=compress`;
    }
    
    return originalUrl;
  }, [config]);
  
  /**
   * Verifica se vídeo pode dar autoplay
   */
  const canAutoplay = useMemo(() => {
    if (isDataSaver) return false;
    if (isSlowConnection) return false;
    if (prefersReducedMotion) return false;
    return config.videoAutoplay;
  }, [config, isDataSaver, isSlowConnection, prefersReducedMotion]);
  
  /**
   * Retorna srcset adaptativo para imagens responsivas
   */
  const getAdaptiveSrcSet = useCallback((baseUrl: string): string => {
    const widths = tier === 'critical' || tier === 'legacy'
      ? [320, 480, 640] // 3G: poucos tamanhos, menores
      : [320, 640, 768, 1024, 1280, 1920]; // 4G+: todos os tamanhos
    
    return widths
      .filter(w => w <= config.maxImageWidth)
      .map(w => `${getAdaptiveImageUrl(baseUrl, { width: w })} ${w}w`)
      .join(', ');
  }, [tier, config, getAdaptiveImageUrl]);
  
  /**
   * Retorna props de vídeo adaptativas
   */
  const getVideoProps = useCallback((options?: { muted?: boolean }) => ({
    autoPlay: canAutoplay,
    muted: options?.muted ?? true,
    loop: canAutoplay,
    playsInline: true,
    preload: isSlowConnection ? 'none' as const : 'metadata' as const,
    controls: !canAutoplay, // Se não pode autoplay, mostra controles
  }), [canAutoplay, isSlowConnection]);
  
  /**
   * Retorna configuração de cache adaptativa
   */
  const getAdaptiveCacheConfig = useCallback((baseStaleTime: number = 30000) => ({
    staleTime: baseStaleTime * config.staleTimeMultiplier,
    gcTime: baseStaleTime * config.staleTimeMultiplier * 10,
    refetchOnWindowFocus: tier === 'quantum' || tier === 'neural',
    refetchOnMount: tier !== 'critical' && tier !== 'legacy',
    refetchOnReconnect: tier !== 'critical',
  }), [config, tier]);
  
  // ========== RETURN ==========
  
  return {
    // Core
    tier,
    config,
    
    // Flags adaptativas
    canAutoplay,
    canAnimate: config.animations && !prefersReducedMotion,
    canUseBlur: config.blurEffects,
    canUseGradients: config.gradients,
    canUseShadows: config.shadows,
    canUseBackgroundEffects: config.backgroundEffects,
    shouldPrefetch: config.prefetchEnabled,
    
    // Funções
    getAdaptiveImageUrl,
    getAdaptiveSrcSet,
    getVideoProps,
    getAdaptiveCacheConfig,
    
    // CSS classes helper
    adaptiveClasses: useMemo(() => {
      const classes: string[] = [];
      if (!config.animations) classes.push('no-animations');
      if (!config.blurEffects) classes.push('no-blur');
      if (!config.gradients) classes.push('no-gradients');
      if (!config.shadows) classes.push('no-shadows');
      if (!config.backgroundEffects) classes.push('no-bg-effects');
      return classes.join(' ');
    }, [config]),
  };
}

// ============================================
// TESE 4.2: OTIMIZAÇÃO DE CPU (WEB WORKERS)
// ============================================

type WorkerTask<TInput, TOutput> = (input: TInput) => TOutput;

interface WorkerMessage<TInput> {
  id: string;
  type: 'execute';
  fn: string;
  input: TInput;
}

interface WorkerResponse<TOutput> {
  id: string;
  type: 'result' | 'error';
  output?: TOutput;
  error?: string;
}

/**
 * Cria um Web Worker inline a partir de uma função
 */
function createInlineWorker<TInput, TOutput>(fn: WorkerTask<TInput, TOutput>): Worker | null {
  if (typeof Worker === 'undefined') return null;
  
  const workerCode = `
    self.onmessage = function(e) {
      const { id, input } = e.data;
      try {
        const fn = ${fn.toString()};
        const result = fn(input);
        self.postMessage({ id, type: 'result', output: result });
      } catch (error) {
        self.postMessage({ id, type: 'error', error: error.message });
      }
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  
  // Limpar URL após criação
  URL.revokeObjectURL(url);
  
  return worker;
}

/**
 * Hook para executar tarefas pesadas em Web Workers
 * TESE 4.2: Não congela a interface
 */
export function useWorkerTask<TInput, TOutput>(
  taskFn: WorkerTask<TInput, TOutput>
) {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, {
    resolve: (value: TOutput) => void;
    reject: (error: Error) => void;
  }>>(new Map());
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Criar worker na montagem
  useEffect(() => {
    workerRef.current = createInlineWorker(taskFn);
    
    if (workerRef.current) {
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse<TOutput>>) => {
        const { id, type, output, error } = e.data;
        const pending = pendingRef.current.get(id);
        
        if (pending) {
          pendingRef.current.delete(id);
          
          if (type === 'result' && output !== undefined) {
            pending.resolve(output);
          } else if (type === 'error') {
            pending.reject(new Error(error || 'Worker error'));
          }
          
          // Verificar se ainda há tarefas pendentes
          if (pendingRef.current.size === 0) {
            setIsProcessing(false);
          }
        }
      };
      
      workerRef.current.onerror = (e) => {
        setError(new Error(e.message));
        setIsProcessing(false);
      };
    }
    
    return () => {
      workerRef.current?.terminate();
      pendingRef.current.clear();
    };
  }, [taskFn]);
  
  /**
   * Executa a tarefa no worker
   */
  const execute = useCallback((input: TInput): Promise<TOutput> => {
    return new Promise((resolve, reject) => {
      // Fallback se Worker não disponível
      if (!workerRef.current) {
        try {
          const result = taskFn(input);
          resolve(result);
        } catch (err) {
          reject(err);
        }
        return;
      }
      
      const id = `task_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      pendingRef.current.set(id, { resolve, reject });
      setIsProcessing(true);
      setError(null);
      
      workerRef.current.postMessage({ id, input });
    });
  }, [taskFn]);
  
  return {
    execute,
    isProcessing,
    error,
    isSupported: typeof Worker !== 'undefined',
  };
}

/**
 * Worker para processamento de arquivos antes do upload
 */
export function useFileProcessorWorker() {
  return useWorkerTask<
    { base64: string; maxWidth: number; quality: number },
    { base64: string; width: number; height: number; size: number }
  >((input) => {
    // Esta função roda no worker - não tem acesso a DOM!
    // Para processamento real de imagem, precisaria de canvas no worker (OffscreenCanvas)
    // Aqui fazemos uma simulação para demonstrar a estrutura
    return {
      base64: input.base64, // Em produção, redimensionaria aqui
      width: input.maxWidth,
      height: Math.round(input.maxWidth * 0.75), // Assumindo 4:3
      size: Math.round(input.base64.length * (input.quality / 100)),
    };
  });
}

/**
 * Worker para cálculos matemáticos pesados
 */
export function useHeavyCalculationWorker() {
  return useWorkerTask<number[], { sum: number; avg: number; max: number; min: number }>((numbers) => {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return {
      sum,
      avg: sum / numbers.length,
      max: Math.max(...numbers),
      min: Math.min(...numbers),
    };
  });
}

/**
 * Worker para parsing de CSV/JSON grandes
 */
export function useDataParserWorker() {
  return useWorkerTask<{ data: string; type: 'csv' | 'json' }, unknown[]>((input) => {
    if (input.type === 'json') {
      return JSON.parse(input.data);
    }
    
    // CSV simples
    const lines = input.data.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i]?.trim();
        return obj;
      }, {} as Record<string, string>);
    });
  });
}

/**
 * Worker para filtro/busca em listas grandes
 */
export function useSearchWorker<T extends Record<string, unknown>>() {
  return useWorkerTask<
    { items: T[]; query: string; fields: (keyof T)[] },
    T[]
  >((input) => {
    const { items, query, fields } = input;
    const lowerQuery = query.toLowerCase();
    
    return items.filter(item => 
      fields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        if (typeof value === 'number') {
          return value.toString().includes(query);
        }
        return false;
      })
    );
  });
}

// ============================================
// HOOK COMBINADO
// ============================================

/**
 * Hook completo de Eficiência Energética
 * Combina detecção de rede + Web Workers
 */
export function useFullEnergyEfficiency() {
  const adaptive = useEnergyEfficiency();
  const fileProcessor = useFileProcessorWorker();
  const heavyCalc = useHeavyCalculationWorker();
  const dataParser = useDataParserWorker();
  
  return {
    ...adaptive,
    workers: {
      fileProcessor,
      heavyCalc,
      dataParser,
    },
  };
}

console.log('[TESE 4] ⚡ Protocolo de Eficiência Energética ativado');
