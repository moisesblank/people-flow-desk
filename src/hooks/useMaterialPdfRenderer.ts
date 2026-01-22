// ============================================
// 📄 MATERIAL PDF RENDERER v2.0
// Renderizador com URLs ASSINADAS (bucket privado)
// P0 FIX: Migrado de getPublicUrl → createSignedUrl
// ============================================

import { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';

// Configurar worker do PDF.js
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

export interface MaterialPdfRendererState {
  isLoading: boolean;
  pdfLoaded: boolean;
  totalPages: number;
  error: string | null;
  currentPageData: PdfPageRender | null;
}

// ============================================
// CONSTANTES
// ============================================

const BUCKET_NAME = 'materiais';
const RENDER_SCALE = 1.5;
const JPEG_QUALITY = 0.85;
const PAGE_CACHE_SIZE = 10;
const SIGNED_URL_TTL = 3600; // 1 hora

// ============================================
// HOOK: useMaterialPdfRenderer
// ============================================

export function useMaterialPdfRenderer(filePath?: string) {
  const [state, setState] = useState<MaterialPdfRendererState>({
    isLoading: false,
    pdfLoaded: false,
    totalPages: 0,
    error: null,
    currentPageData: null,
  });

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pageCache = useRef<Map<number, PdfPageRender>>(new Map());
  const signedUrlCache = useRef<{ url: string; expiresAt: number } | null>(null);

  // 🛡️ P0 FIX: Obter URL ASSINADA do PDF (bucket privado)
  const getPdfUrl = useCallback(async (): Promise<string | null> => {
    if (!filePath) return null;
    
    // Verificar cache de URL assinada (com margem de 5 min antes de expirar)
    const now = Date.now();
    if (signedUrlCache.current && signedUrlCache.current.expiresAt > now + 300000) {
      return signedUrlCache.current.url;
    }
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_TTL);
    
    if (error || !data?.signedUrl) {
      console.error('[MaterialPdfRenderer] Erro ao gerar URL assinada:', error);
      return null;
    }
    
    // Cachear URL assinada
    signedUrlCache.current = {
      url: data.signedUrl,
      expiresAt: now + (SIGNED_URL_TTL * 1000),
    };
    
    return data.signedUrl;
  }, [filePath]);

  // Carregar documento PDF
  const loadPdf = useCallback(async () => {
    if (!filePath) {
      setState(s => ({ ...s, error: 'Caminho do PDF não fornecido' }));
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      // 🛡️ P0 FIX: Agora usa URL assinada (async)
      const url = await getPdfUrl();
      if (!url) throw new Error('Não foi possível obter URL assinada do PDF');

      console.log('[MaterialPdfRenderer] Carregando PDF com URL assinada...', filePath);

      const loadingTask = pdfjsLib.getDocument({ url });
      const pdf = await loadingTask.promise;
      
      pdfDocRef.current = pdf;

      setState(s => ({
        ...s,
        isLoading: false,
        pdfLoaded: true,
        totalPages: pdf.numPages,
        error: null,
      }));

      console.log('[MaterialPdfRenderer] PDF carregado:', pdf.numPages, 'páginas');

    } catch (error: any) {
      console.error('[MaterialPdfRenderer] Erro ao carregar PDF:', error);
      setState(s => ({
        ...s,
        isLoading: false,
        error: error.message || 'Erro ao carregar PDF',
      }));
    }
  }, [filePath, getPdfUrl]);

  // Renderizar página específica
  const renderPage = useCallback(async (pageNumber: number) => {
    const pdf = pdfDocRef.current;
    if (!pdf || pageNumber < 1 || pageNumber > pdf.numPages) return;

    // Verificar cache
    const cached = pageCache.current.get(pageNumber);
    if (cached) {
      setState(s => ({ ...s, currentPageData: cached }));
      return;
    }

    setState(s => ({ ...s, isLoading: true }));

    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context não disponível');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

      const pageData: PdfPageRender = {
        pageNumber,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
      };

      // Adicionar ao cache (com limite)
      if (pageCache.current.size >= PAGE_CACHE_SIZE) {
        const firstKey = pageCache.current.keys().next().value;
        if (firstKey !== undefined) {
          pageCache.current.delete(firstKey);
        }
      }
      pageCache.current.set(pageNumber, pageData);

      setState(s => ({
        ...s,
        isLoading: false,
        currentPageData: pageData,
      }));

    } catch (error: any) {
      console.error('[MaterialPdfRenderer] Erro ao renderizar página:', error);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  // Prefetch páginas adjacentes
  const prefetchPages = useCallback(async (currentPage: number) => {
    const pdf = pdfDocRef.current;
    if (!pdf) return;

    const pagesToPrefetch = [currentPage - 1, currentPage + 1].filter(
      p => p >= 1 && p <= pdf.numPages && !pageCache.current.has(p)
    );

    for (const pageNum of pagesToPrefetch) {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          renderPage(pageNum);
        });
      } else {
        setTimeout(() => {
          renderPage(pageNum);
        }, 100);
      }
    }
  }, [renderPage]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
    pageCache.current.clear();
    setState({
      isLoading: false,
      pdfLoaded: false,
      totalPages: 0,
      error: null,
      currentPageData: null,
    });
  }, []);

  return {
    ...state,
    loadPdf,
    renderPage,
    prefetchPages,
    cleanup,
  };
}

export default useMaterialPdfRenderer;
