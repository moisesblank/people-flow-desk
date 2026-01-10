// ============================================
// 📄 PDF RENDERER v1.0 — Renderização Client-Side
// Usa PDF.js para renderizar PDFs diretamente
// Suporta livros sem páginas pré-processadas
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configurar worker do PDF.js (bundled — sem CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ============================================
// TIPOS
// ============================================

export interface PdfPageRender {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

// ✅ Sumário inteligente extraído do PDF
export interface PdfOutlineItem {
  title: string;
  pageNumber: number;
  level: number;
  children?: PdfOutlineItem[];
}

export interface PdfRendererState {
  isLoading: boolean;
  pdfLoaded: boolean;
  totalPages: number;
  error: string | null;
  currentPageData: PdfPageRender | null;
  outline: PdfOutlineItem[];
}

// ============================================
// CONSTANTES — OTIMIZADAS PARA PERFORMANCE
// ============================================

const RAW_BUCKET = 'ena-assets-raw';
const RENDER_SCALE = 1.5; // ✅ Otimizado: 1.5 (boa qualidade, 44% mais rápido que 2)
const JPEG_QUALITY = 0.85; // ✅ Otimizado: compressão mais rápida
const PAGE_CACHE_SIZE = 20; // ✅ Ampliado: menos re-renderizações
const PREFETCH_PAGES = 1; // ✅ M3: Prefetch de 1 página apenas (segurança)
const URL_EXPIRY_SECONDS = 3600; // 1 hora

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Parsear outline recursivamente e resolver página de destino
async function parseOutline(
  pdf: pdfjsLib.PDFDocumentProxy,
  items: any[],
  level: number
): Promise<PdfOutlineItem[]> {
  const result: PdfOutlineItem[] = [];

  for (const item of items) {
    let pageNumber = 1;

    // Resolver destino para número de página
    try {
      if (item.dest) {
        let dest = item.dest;
        // Se for string, resolver via getDestination
        if (typeof dest === 'string') {
          dest = await pdf.getDestination(dest);
        }
        if (dest && Array.isArray(dest)) {
          const ref = dest[0];
          if (ref) {
            pageNumber = await pdf.getPageIndex(ref) + 1;
          }
        }
      }
    } catch (err) {
      console.warn('[parseOutline] Erro ao resolver destino:', item.title, err);
    }

    const outlineItem: PdfOutlineItem = {
      title: item.title || 'Sem título',
      pageNumber,
      level,
    };

    // Processar filhos recursivamente
    if (item.items && item.items.length > 0) {
      outlineItem.children = await parseOutline(pdf, item.items, level + 1);
    }

    result.push(outlineItem);
  }

  return result;
}

// ============================================
// HOOK: usePdfRenderer
// ============================================

export function usePdfRenderer(bookId?: string, originalPath?: string) {
  const [state, setState] = useState<PdfRendererState>({
    isLoading: false,
    pdfLoaded: false,
    totalPages: 0,
    error: null,
    currentPageData: null,
    outline: []
  });

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pageCache = useRef<Map<number, PdfPageRender>>(new Map());
  const signedUrlRef = useRef<{ url: string; expiresAt: number } | null>(null);

  // Buscar URL assinada do PDF original (via backend function — evita depender de policy client-side)
  const fetchPdfUrl = useCallback(async (): Promise<string | null> => {
    if (!originalPath || !bookId) return null;

    // Verificar cache
    if (signedUrlRef.current && signedUrlRef.current.expiresAt > Date.now()) {
      return signedUrlRef.current.url;
    }

    try {
      const { data, error } = await supabase.functions.invoke('book-original-signed-url', {
        body: {
          bookId,
          // enviado como fallback, mas a função valida/deriva do banco
          originalPath,
        }
      });

      if (error) throw error;

      if (data?.success && data?.signedUrl) {
        signedUrlRef.current = {
          url: data.signedUrl,
          expiresAt: Date.now() + (URL_EXPIRY_SECONDS - 60) * 1000,
        };
        return data.signedUrl;
      }

      console.error('[PdfRenderer] Resposta inválida:', data);
    } catch (err) {
      console.error('[PdfRenderer] Erro ao buscar URL:', err);
    }

    return null;
  }, [bookId, originalPath]);

  // Carregar documento PDF
  const loadPdf = useCallback(async () => {
    if (!originalPath) {
      setState(s => ({ ...s, error: 'Caminho do PDF não fornecido' }));
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      const url = await fetchPdfUrl();
      if (!url) throw new Error('Não foi possível obter URL do PDF');

      console.log('[PdfRenderer] Carregando PDF...', bookId);

      // ✅ Worker local já configurado acima; não depender de cMap CDN
      const loadingTask = pdfjsLib.getDocument({ url });

      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;

      console.log(`[PdfRenderer] PDF carregado: ${pdf.numPages} páginas`);

      // ✅ OTIMIZAÇÃO: Liberar UI imediatamente, extrair outline em background
      setState(s => ({
        ...s,
        isLoading: false,
        pdfLoaded: true,
        totalPages: pdf.numPages,
        outline: [] // Outline carrega depois
      }));

      // ✅ Extrair sumário em BACKGROUND (não bloqueia UI)
      (async () => {
        try {
          const rawOutline = await pdf.getOutline();
          if (rawOutline && rawOutline.length > 0) {
            const extractedOutline = await parseOutline(pdf, rawOutline, 0);
            console.log(`[PdfRenderer] Sumário extraído: ${extractedOutline.length} itens`);
            setState(s => ({ ...s, outline: extractedOutline }));
          }
        } catch (outlineErr) {
          console.warn('[PdfRenderer] Erro ao extrair sumário:', outlineErr);
        }
      })();

      // ✅ P0: Atualizar total_pages no banco SEMPRE que carrega (sem filtro de total_pages=0)
      // Isso corrige livros que foram publicados com 0 páginas
      if (bookId && pdf.numPages > 0) {
        console.log(`[PdfRenderer] Atualizando total_pages no banco: ${pdf.numPages}`);
        const { error: updateError } = await supabase
          .from('web_books')
          .update({ 
            total_pages: pdf.numPages,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookId);
        
        if (updateError) {
          console.warn('[PdfRenderer] Erro ao atualizar total_pages:', updateError);
        } else {
          console.log('[PdfRenderer] total_pages atualizado com sucesso');
        }
      }

    } catch (err) {
      console.error('[PdfRenderer] Erro ao carregar PDF:', err);
      setState(s => ({
        ...s,
        isLoading: false,
        error: 'Erro ao carregar o PDF. Verifique se o arquivo existe.'
      }));
    }
  }, [bookId, originalPath, fetchPdfUrl]);

  // Renderizar página específica
  const renderPage = useCallback(async (pageNumber: number): Promise<PdfPageRender | null> => {
    const pdf = pdfDocRef.current;
    if (!pdf) return null;

    // Verificar cache
    const cached = pageCache.current.get(pageNumber);
    if (cached) {
      setState(s => ({ ...s, currentPageData: cached }));
      return cached;
    }

    // Validar número da página
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      console.warn(`[PdfRenderer] Página ${pageNumber} fora do range`);
      return null;
    }

    try {
      setState(s => ({ ...s, isLoading: true }));

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      // Criar canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Não foi possível criar contexto 2D');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Renderizar página
      await page.render({
        canvasContext: context,
        viewport
      }).promise;

      // Converter para data URL
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

      const pageData: PdfPageRender = {
        pageNumber,
        dataUrl,
        width: viewport.width,
        height: viewport.height
      };

      // Adicionar ao cache
      pageCache.current.set(pageNumber, pageData);

      // Limitar tamanho do cache
      if (pageCache.current.size > PAGE_CACHE_SIZE) {
        const firstKey = pageCache.current.keys().next().value;
        if (firstKey !== undefined) {
          pageCache.current.delete(firstKey);
        }
      }

      setState(s => ({ 
        ...s, 
        isLoading: false,
        currentPageData: pageData 
      }));

      return pageData;

    } catch (err) {
      console.error(`[PdfRenderer] Erro ao renderizar página ${pageNumber}:`, err);
      setState(s => ({ ...s, isLoading: false }));
      return null;
    }
  }, []);

  // ✅ Prefetch paralelo de páginas adjacentes
  const prefetchPages = useCallback(async (currentPage: number) => {
    const pdf = pdfDocRef.current;
    if (!pdf) return;

    // Prefetch em paralelo (não sequencial)
    const pagesToPrefetch: number[] = [];
    for (let i = 1; i <= PREFETCH_PAGES; i++) {
      const nextPage = currentPage + i;
      if (nextPage <= pdf.numPages && !pageCache.current.has(nextPage)) {
        pagesToPrefetch.push(nextPage);
      }
    }
    
    // Executar todos em paralelo sem aguardar
    pagesToPrefetch.forEach(page => {
      renderPage(page);
    });
  }, [renderPage]);

  // Limpar recursos
  const cleanup = useCallback(() => {
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
    pageCache.current.clear();
    signedUrlRef.current = null;
    setState({
      isLoading: false,
      pdfLoaded: false,
      totalPages: 0,
      error: null,
      currentPageData: null,
      outline: []
    });
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    ...state,
    loadPdf,
    renderPage,
    prefetchPages,
    cleanup,
    isPdfMode: true
  };
}

export default usePdfRenderer;
