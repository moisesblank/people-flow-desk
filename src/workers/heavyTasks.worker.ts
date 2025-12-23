// ============================================
// 🏛️ LEI I - WEB WORKER: TAREFAS PESADAS
// Processamento off-main-thread para UI fluida
// Suporte: 5000 usuários simultâneos
// ============================================

// Tipos de mensagens suportadas
type WorkerMessageType = 
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
  type: WorkerMessageType;
  payload: unknown;
}

interface WorkerResponse {
  id: string;
  type: 'result' | 'error' | 'progress';
  data?: unknown;
  error?: string;
  progress?: number;
}

// ============================================
// PROCESSADORES DE TAREFAS
// ============================================

/**
 * CSV Export - Processa grandes arrays em CSV
 */
function processCSVExport(data: { 
  headers: string[]; 
  rows: (string | number | null | undefined)[][]; 
}): string {
  const { headers, rows } = data;
  
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");
  
  // BOM para Excel
  return "\uFEFF" + csvContent;
}

/**
 * JSON Parse - Parse de JSON grandes com validação
 */
function processJSONParse(data: string): unknown {
  return JSON.parse(data);
}

/**
 * Data Filter - Filtro otimizado para listas grandes
 */
function processDataFilter<T extends Record<string, unknown>>(data: {
  items: T[];
  query: string;
  fields: string[];
}): T[] {
  const { items, query, fields } = data;
  
  if (!query.trim()) return items;
  
  const lowerQuery = query.toLowerCase();
  const queryTerms = lowerQuery.split(/\s+/).filter(Boolean);
  
  return items.filter(item => 
    queryTerms.every(term =>
      fields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term);
        }
        if (typeof value === 'number') {
          return value.toString().includes(term);
        }
        return false;
      })
    )
  );
}

/**
 * Data Sort - Ordenação otimizada multi-campo
 */
function processDataSort<T extends Record<string, unknown>>(data: {
  items: T[];
  sortBy: { field: string; direction: 'asc' | 'desc' }[];
}): T[] {
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
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      }
      
      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

/**
 * Hash Generate - SHA-256 para fingerprinting
 */
async function processHashGenerate(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * File to Base64 - Conversão de arquivos
 */
async function processFileToBase64(data: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(data);
  let binary = '';
  const chunkSize = 8192;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
}

/**
 * Statistics - Cálculos estatísticos em arrays grandes
 */
function processStatistics(data: number[]): {
  sum: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
  count: number;
} {
  if (data.length === 0) {
    return { sum: 0, avg: 0, min: 0, max: 0, median: 0, stdDev: 0, count: 0 };
  }
  
  const sorted = [...data].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / count;
  const min = sorted[0];
  const max = sorted[count - 1];
  
  // Mediana
  const mid = Math.floor(count / 2);
  const median = count % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
  
  // Desvio padrão
  const squaredDiffs = sorted.map(value => Math.pow(value - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return { sum, avg, min, max, median, stdDev, count };
}

/**
 * Bulk Transform - Transformações em massa
 */
function processBulkTransform<T, R>(data: {
  items: T[];
  transformFn: string; // Serialized function
}): R[] {
  const { items, transformFn } = data;
  
  // Reconstruir função a partir da string
  // eslint-disable-next-line no-new-func
  const fn = new Function('item', 'index', `return (${transformFn})(item, index)`) as (item: T, index: number) => R;
  
  return items.map((item, index) => fn(item, index));
}

// ============================================
// MESSAGE HANDLER
// ============================================

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  
  const respond = (data: unknown) => {
    self.postMessage({ id, type: 'result', data } as WorkerResponse);
  };
  
  const respondError = (error: string) => {
    self.postMessage({ id, type: 'error', error } as WorkerResponse);
  };
  
  const respondProgress = (progress: number) => {
    self.postMessage({ id, type: 'progress', progress } as WorkerResponse);
  };
  
  try {
    switch (type) {
      case 'CSV_EXPORT':
        respond(processCSVExport(payload as { headers: string[]; rows: (string | number | null | undefined)[][] }));
        break;
        
      case 'JSON_PARSE':
        respond(processJSONParse(payload as string));
        break;
        
      case 'DATA_FILTER':
        respond(processDataFilter(payload as { items: Record<string, unknown>[]; query: string; fields: string[] }));
        break;
        
      case 'DATA_SORT':
        respond(processDataSort(payload as { items: Record<string, unknown>[]; sortBy: { field: string; direction: 'asc' | 'desc' }[] }));
        break;
        
      case 'HASH_GENERATE':
        respond(await processHashGenerate(payload as string));
        break;
        
      case 'FILE_TO_BASE64':
        respond(await processFileToBase64(payload as ArrayBuffer));
        break;
        
      case 'STATISTICS':
        respond(processStatistics(payload as number[]));
        break;
        
      case 'BULK_TRANSFORM':
        respond(processBulkTransform(payload as { items: unknown[]; transformFn: string }));
        break;
        
      default:
        respondError(`Unknown task type: ${type}`);
    }
  } catch (error) {
    respondError(error instanceof Error ? error.message : String(error));
  }
};

// Marcar como module para TypeScript
export {};
