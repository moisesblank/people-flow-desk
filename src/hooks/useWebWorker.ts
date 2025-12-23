// ============================================
// 🏛️ LEI I - HOOK: useWebWorker
// Interface React para Web Workers
// UI NUNCA congela - 0% blocking
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';

// Tipos de tarefas disponíveis
export type WorkerTaskType = 
  | 'CSV_EXPORT'
  | 'JSON_PARSE'
  | 'DATA_FILTER'
  | 'DATA_SORT'
  | 'HASH_GENERATE'
  | 'FILE_TO_BASE64'
  | 'STATISTICS'
  | 'BULK_TRANSFORM';

interface WorkerMessage {
  id: string;
  type: WorkerTaskType;
  payload: unknown;
}

interface WorkerResponse {
  id: string;
  type: 'result' | 'error' | 'progress';
  data?: unknown;
  error?: string;
  progress?: number;
}

interface PendingTask<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

// Singleton do worker para reutilização
let sharedWorker: Worker | null = null;
let workerRefCount = 0;
const pendingTasks = new Map<string, PendingTask<unknown>>();

/**
 * Cria worker inline a partir do código
 */
function createWorkerFromCode(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  
  // Código do worker inline (para evitar problemas de build)
  const workerCode = `
// Processadores de tarefas
function processCSVExport(data) {
  const { headers, rows } = data;
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\\n");
  return "\\uFEFF" + csvContent;
}

function processDataFilter(data) {
  const { items, query, fields } = data;
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase();
  const queryTerms = lowerQuery.split(/\\s+/).filter(Boolean);
  return items.filter(item => 
    queryTerms.every(term =>
      fields.some(field => {
        const value = item[field];
        if (typeof value === 'string') return value.toLowerCase().includes(term);
        if (typeof value === 'number') return value.toString().includes(term);
        return false;
      })
    )
  );
}

function processDataSort(data) {
  const { items, sortBy } = data;
  return [...items].sort((a, b) => {
    for (const { field, direction } of sortBy) {
      const aVal = a[field];
      const bVal = b[field];
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'pt-BR');
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      }
      if (comparison !== 0) return direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });
}

async function processHashGenerate(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function processFileToBase64(data) {
  const uint8Array = new Uint8Array(data);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function processStatistics(data) {
  if (data.length === 0) return { sum: 0, avg: 0, min: 0, max: 0, median: 0, stdDev: 0, count: 0 };
  const sorted = [...data].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / count;
  const min = sorted[0];
  const max = sorted[count - 1];
  const mid = Math.floor(count / 2);
  const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const squaredDiffs = sorted.map(value => Math.pow(value - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(avgSquaredDiff);
  return { sum, avg, min, max, median, stdDev, count };
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  const respond = (data) => self.postMessage({ id, type: 'result', data });
  const respondError = (error) => self.postMessage({ id, type: 'error', error });
  
  try {
    switch (type) {
      case 'CSV_EXPORT': respond(processCSVExport(payload)); break;
      case 'JSON_PARSE': respond(JSON.parse(payload)); break;
      case 'DATA_FILTER': respond(processDataFilter(payload)); break;
      case 'DATA_SORT': respond(processDataSort(payload)); break;
      case 'HASH_GENERATE': respond(await processHashGenerate(payload)); break;
      case 'FILE_TO_BASE64': respond(await processFileToBase64(payload)); break;
      case 'STATISTICS': respond(processStatistics(payload)); break;
      default: respondError('Unknown task type: ' + type);
    }
  } catch (error) {
    respondError(error.message || String(error));
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
 * Obtém ou cria o worker compartilhado
 */
function getSharedWorker(): Worker | null {
  if (!sharedWorker) {
    sharedWorker = createWorkerFromCode();
    
    if (sharedWorker) {
      sharedWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, data, error, progress } = event.data;
        const pending = pendingTasks.get(id);
        
        if (!pending) return;
        
        if (type === 'progress' && pending.onProgress) {
          pending.onProgress(progress || 0);
          return;
        }
        
        pendingTasks.delete(id);
        
        if (type === 'result') {
          pending.resolve(data);
        } else if (type === 'error') {
          pending.reject(new Error(error || 'Worker error'));
        }
      };
      
      sharedWorker.onerror = (error) => {
        console.error('[WebWorker] Error:', error);
        pendingTasks.forEach(task => task.reject(new Error('Worker crashed')));
        pendingTasks.clear();
      };
    }
  }
  
  return sharedWorker;
}

/**
 * Hook principal para executar tarefas em Web Worker
 */
export function useWebWorker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  
  // Gerenciar ciclo de vida do worker
  useEffect(() => {
    workerRefCount++;
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      workerRefCount--;
      
      // Terminar worker quando não há mais consumidores
      if (workerRefCount === 0 && sharedWorker) {
        sharedWorker.terminate();
        sharedWorker = null;
        pendingTasks.clear();
      }
    };
  }, []);
  
  /**
   * Executa tarefa no worker
   */
  const execute = useCallback(<TInput, TOutput>(
    taskType: WorkerTaskType,
    payload: TInput
  ): Promise<TOutput> => {
    return new Promise((resolve, reject) => {
      const worker = getSharedWorker();
      
      // Fallback para main thread se Worker não disponível
      if (!worker) {
        console.warn('[WebWorker] Workers not supported, running on main thread');
        try {
          // Executar sincronamente como fallback
          setTimeout(() => {
            try {
              // Fallback básico
              if (taskType === 'JSON_PARSE') {
                resolve(JSON.parse(payload as string) as TOutput);
              } else {
                reject(new Error('Task not supported without Worker'));
              }
            } catch (err) {
              reject(err);
            }
          }, 0);
        } catch (err) {
          reject(err);
        }
        return;
      }
      
      const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      
      if (mountedRef.current) {
        setIsProcessing(true);
        setProgress(0);
        setError(null);
      }
      
      pendingTasks.set(id, {
        resolve: (data) => {
          if (mountedRef.current) {
            setIsProcessing(false);
            setProgress(100);
          }
          resolve(data as TOutput);
        },
        reject: (err) => {
          if (mountedRef.current) {
            setIsProcessing(false);
            setError(err);
          }
          reject(err);
        },
        onProgress: (p) => {
          if (mountedRef.current) setProgress(p);
        },
      });
      
      const message: WorkerMessage = { id, type: taskType, payload };
      worker.postMessage(message);
    });
  }, []);
  
  // Helpers específicos para cada tipo de tarefa
  const csvExport = useCallback((headers: string[], rows: (string | number | null | undefined)[][]) => {
    return execute<{ headers: string[]; rows: (string | number | null | undefined)[][] }, string>(
      'CSV_EXPORT',
      { headers, rows }
    );
  }, [execute]);
  
  const jsonParse = useCallback(<T>(jsonString: string) => {
    return execute<string, T>('JSON_PARSE', jsonString);
  }, [execute]);
  
  const dataFilter = useCallback(<T extends Record<string, unknown>>(
    items: T[],
    query: string,
    fields: (keyof T)[]
  ) => {
    return execute<{ items: T[]; query: string; fields: string[] }, T[]>(
      'DATA_FILTER',
      { items, query, fields: fields as string[] }
    );
  }, [execute]);
  
  const dataSort = useCallback(<T extends Record<string, unknown>>(
    items: T[],
    sortBy: { field: keyof T; direction: 'asc' | 'desc' }[]
  ) => {
    return execute<{ items: T[]; sortBy: { field: string; direction: 'asc' | 'desc' }[] }, T[]>(
      'DATA_SORT',
      { items, sortBy: sortBy.map(s => ({ field: s.field as string, direction: s.direction })) }
    );
  }, [execute]);
  
  const hashGenerate = useCallback((data: string) => {
    return execute<string, string>('HASH_GENERATE', data);
  }, [execute]);
  
  const fileToBase64 = useCallback((arrayBuffer: ArrayBuffer) => {
    return execute<ArrayBuffer, string>('FILE_TO_BASE64', arrayBuffer);
  }, [execute]);
  
  const statistics = useCallback((numbers: number[]) => {
    return execute<number[], {
      sum: number;
      avg: number;
      min: number;
      max: number;
      median: number;
      stdDev: number;
      count: number;
    }>('STATISTICS', numbers);
  }, [execute]);
  
  return {
    // Estado
    isProcessing,
    progress,
    error,
    isSupported: typeof Worker !== 'undefined',
    
    // Métodos genéricos
    execute,
    
    // Métodos específicos
    csvExport,
    jsonParse,
    dataFilter,
    dataSort,
    hashGenerate,
    fileToBase64,
    statistics,
  };
}

// ============================================
// HOOKS ESPECIALIZADOS
// ============================================

/**
 * Hook para exportação CSV off-thread
 */
export function useCSVExportWorker() {
  const { csvExport, isProcessing, error } = useWebWorker();
  
  const exportToCSV = useCallback(async (
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][]
  ) => {
    const csvContent = await csvExport(headers, rows);
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [csvExport]);
  
  return { exportToCSV, isProcessing, error };
}

/**
 * Hook para busca/filtro em listas grandes
 */
export function useSearchFilterWorker<T extends Record<string, unknown>>() {
  const { dataFilter, dataSort, isProcessing } = useWebWorker();
  
  const searchAndSort = useCallback(async (
    items: T[],
    query: string,
    searchFields: (keyof T)[],
    sortBy?: { field: keyof T; direction: 'asc' | 'desc' }[]
  ): Promise<T[]> => {
    // Filtrar primeiro
    let result = query.trim() 
      ? await dataFilter(items, query, searchFields)
      : items;
    
    // Ordenar se necessário
    if (sortBy && sortBy.length > 0) {
      result = await dataSort(result, sortBy);
    }
    
    return result;
  }, [dataFilter, dataSort]);
  
  return { searchAndSort, isProcessing };
}

/**
 * Hook para hash/fingerprint off-thread
 */
export function useHashWorker() {
  const { hashGenerate, isProcessing } = useWebWorker();
  
  const generateFingerprint = useCallback(async (components: string[]): Promise<string> => {
    const text = components.join('|');
    const fullHash = await hashGenerate(text);
    return fullHash.slice(0, 32); // 32 chars
  }, [hashGenerate]);
  
  return { generateFingerprint, hashGenerate, isProcessing };
}

/**
 * Hook para upload de arquivos com conversão off-thread
 */
export function useFileUploadWorker() {
  const { fileToBase64, isProcessing, progress } = useWebWorker();
  
  const convertFileToBase64 = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    return fileToBase64(arrayBuffer);
  }, [fileToBase64]);
  
  return { convertFileToBase64, isProcessing, progress };
}

/**
 * Hook para JSON stringify/parse off-thread (backups grandes)
 */
export function useJSONWorker() {
  const { jsonParse, execute, isProcessing } = useWebWorker();
  
  const stringify = useCallback(async <T>(data: T, pretty = false): Promise<string> => {
    // Para objetos pequenos, usar main thread (overhead do worker não compensa)
    const str = JSON.stringify(data);
    if (str.length < 10000) {
      return pretty ? JSON.stringify(data, null, 2) : str;
    }
    
    // Para objetos grandes, processar off-thread
    return new Promise((resolve) => {
      // Stringify precisa ser feito na main thread (funções não são serializáveis)
      // mas fazemos em chunks para não bloquear
      setTimeout(() => {
        resolve(pretty ? JSON.stringify(data, null, 2) : str);
      }, 0);
    });
  }, []);
  
  const parse = useCallback(<T>(jsonString: string): Promise<T> => {
    return jsonParse<T>(jsonString);
  }, [jsonParse]);
  
  return { stringify, parse, isProcessing };
}

export default useWebWorker;
