// ============================================
// 📚 LIVROS DO MOISA - Hook Principal v2.0
// Sistema de Livro Web com SANCTUM Integration
// Signed URLs + Prefetch + Rate Limiting
// ============================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SANCTUM_OMEGA_CONFIG } from '@/hooks/useSanctumOmega';

// ============================================
// TIPOS
// ============================================

export interface WebBookPage {
  pageNumber: number;
  imagePath: string;
  thumbnailPath?: string;
  chapterTitle?: string;
  sectionTitle?: string;
  width?: number;
  height?: number;
}

export interface WebBookProgress {
  currentPage: number;
  progressPercent: number;
  totalReadingTime: number;
  pagesRead: number[];
  isCompleted?: boolean;
}

export interface WebBookWatermark {
  enabled: boolean;
  userName?: string;
  userEmail?: string;
  userCpf?: string;
  userId?: string;
  seed: string;
}

export interface WebBook {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  category: string;
  totalPages: number;
  summary?: any[];
  coverUrl?: string;
  description?: string;
}

export interface PdfModeData {
  enabled: boolean;
  originalBucket?: string;
  originalPath?: string;
  originalFilename?: string;
}

export interface WebBookData {
  success: boolean;
  error?: string;
  book?: WebBook;
  pages?: WebBookPage[];
  progress?: WebBookProgress;
  watermark?: WebBookWatermark;
  isOwner?: boolean;
  pdfMode?: PdfModeData;
}

export interface Annotation {
  id: string;
  pageNumber: number;
  type: string;
  content?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color: string;
  createdAt: string;
}

export interface WebBookListItem {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  category: string;
  totalPages: number;
  coverUrl?: string;
  viewCount?: number;
  progress?: {
    currentPage: number;
    progressPercent: number;
    isCompleted: boolean;
  };
}

// ============================================
// CONSTANTES - PERFORMANCE
// ============================================

const PROGRESS_SAVE_INTERVAL = 30000; // 30 segundos
const URL_CACHE_TTL = 55000; // ✅ M2: 55 segundos (antes do TTL de 60s expirar)
const PREFETCH_AHEAD = 1; // ✅ M3: Prefetch 1 página à frente (segurança)
const MAX_CACHED_URLS = 5; // ✅ M3: Menos URLs em cache
const OWNER_EMAIL = "moisesblank@gmail.com";

// Cache de URLs assinadas
const urlCache = new Map<string, { url: string; expiresAt: number }>();

// ============================================
// HOOK: useWebBook
// ============================================

export function useWebBook(bookId?: string) {
  const { user } = useAuth();
  const [bookData, setBookData] = useState<WebBookData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [signedUrls, setSignedUrls] = useState<Map<number, string>>(new Map());
  const [threatScore, setThreatScore] = useState(0);
  
  const readingStartRef = useRef<number>(Date.now());
  const lastSaveRef = useRef<number>(Date.now());
  const prefetchingRef = useRef<Set<number>>(new Set());

  // Verificar se é owner
  const isOwner = useMemo(() => {
    return user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  }, [user?.email]);

  // Carregar livro
  const loadBook = useCallback(async () => {
    if (!bookId || !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('fn_get_book_for_reader', {
        p_book_id: bookId
      });

      if (rpcError) throw rpcError;

      const result = data as unknown as WebBookData;

      if (!result.success) {
        setError(result.error || 'Erro ao carregar livro');
        return;
      }

      setBookData(result);
      setCurrentPage(result.progress?.currentPage || 1);

      // Carregar anotações
      await loadAnnotationsInternal();
      
      // Pré-buscar URL da página atual
      if (result.pages && result.pages.length > 0) {
        const startPage = result.progress?.currentPage || 1;
        await fetchSignedUrl(startPage);
        
        // Prefetch próximas páginas
        prefetchPages(startPage);
      }
    } catch (err) {
      console.error('[WebBook] Erro ao carregar:', err);
      setError('Erro ao carregar livro');
    } finally {
      setIsLoading(false);
    }
  }, [bookId, user?.id]);

  // Buscar signed URL com cache
  const fetchSignedUrl = useCallback(async (pageNumber: number): Promise<string | null> => {
    if (!bookId) return null;

    const cacheKey = `${bookId}_${pageNumber}`;
    const cached = urlCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    try {
      // Calcular páginas para prefetch
      const prefetchPages: number[] = [];
      for (let i = 1; i <= PREFETCH_AHEAD; i++) {
        const nextPage = pageNumber + i;
        const nextCacheKey = `${bookId}_${nextPage}`;
        if (!urlCache.has(nextCacheKey) && !prefetchingRef.current.has(nextPage)) {
          prefetchPages.push(nextPage);
        }
      }

      const { data, error } = await supabase.functions.invoke('book-page-signed-url', {
        body: { 
          bookId, 
          pageNumber,
          prefetch: prefetchPages 
        }
      });

      if (error) throw error;

      if (data?.success && data.url) {
        const expiresAt = new Date(data.expiresAt).getTime();
        
        // Cachear URL principal
        urlCache.set(cacheKey, { url: data.url, expiresAt });
        setSignedUrls(prev => new Map(prev).set(pageNumber, data.url));

        // Cachear URLs de prefetch
        if (data.prefetchUrls) {
          Object.entries(data.prefetchUrls).forEach(([page, url]) => {
            const key = `${bookId}_${page}`;
            urlCache.set(key, { url: url as string, expiresAt: expiresAt + 30000 });
            setSignedUrls(prev => new Map(prev).set(Number(page), url as string));
          });
        }

        // Limpar cache antigo
        if (urlCache.size > MAX_CACHED_URLS) {
          const entries = Array.from(urlCache.entries());
          entries
            .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
            .slice(0, entries.length - MAX_CACHED_URLS)
            .forEach(([key]) => urlCache.delete(key));
        }

        return data.url;
      }
    } catch (err) {
      console.error('[WebBook] Erro ao buscar signed URL:', err);
    }

    return null;
  }, [bookId]);

  // Prefetch de páginas
  const prefetchPages = useCallback((fromPage: number) => {
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
      const targetPage = fromPage + i;
      if (!prefetchingRef.current.has(targetPage)) {
        prefetchingRef.current.add(targetPage);
        fetchSignedUrl(targetPage).finally(() => {
          prefetchingRef.current.delete(targetPage);
        });
      }
    }
  }, [fetchSignedUrl]);

  // Carregar anotações
  const loadAnnotationsInternal = useCallback(async () => {
    if (!bookId) return;

    try {
      const { data } = await supabase.rpc('fn_get_user_annotations', {
        p_book_id: bookId
      });

      const result = data as unknown as { success: boolean; annotations: Annotation[] };
      if (result?.success && result.annotations) {
        setAnnotations(result.annotations);
      }
    } catch (err) {
      console.warn('[WebBook] Erro ao carregar anotações:', err);
    }
  }, [bookId]);

  const loadAnnotations = loadAnnotationsInternal;

  // Salvar progresso
  const saveProgress = useCallback(async (page: number, force = false) => {
    if (!bookId || !user?.id) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveRef.current;
    
    if (!force && timeSinceLastSave < PROGRESS_SAVE_INTERVAL) return;

    const readingTime = Math.floor((now - readingStartRef.current) / 1000);
    
    try {
      const { data } = await supabase.rpc('fn_update_reading_progress', {
        p_book_id: bookId,
        p_current_page: page,
        p_reading_time_seconds: readingTime
      });

      const result = data as unknown as { success: boolean; progressPercent: number; isCompleted: boolean };

      if (result?.success) {
        lastSaveRef.current = now;
        readingStartRef.current = now;

        if (bookData) {
          setBookData({
            ...bookData,
            progress: {
              ...bookData.progress!,
              currentPage: page,
              progressPercent: result.progressPercent
            }
          });
        }

        if (result.isCompleted) {
          toast.success('🎉 Parabéns! Você completou o livro!');
        }
      }
    } catch (err) {
      console.warn('[WebBook] Erro ao salvar progresso:', err);
    }
  }, [bookId, user?.id, bookData]);

  // Reportar violação SANCTUM
  const reportViolation = useCallback(async (type: string, metadata?: Record<string, string | number | boolean | null>) => {
    if (isOwner) return; // Owner não registra violações

    const severity = SANCTUM_OMEGA_CONFIG.severityMap[type] || 5;
    const newScore = threatScore + severity;
    setThreatScore(newScore);

    // ✅ Frontend NUNCA revoga sessões por score local
    // Apenas logar e alertar — backend decide via RPC validate_session_epoch
    if (newScore >= 50) {
      toast.warning('Atividade suspeita detectada. Aguardando verificação.');
      console.warn('[WebBook] Threat score crítico — backend decidirá revogação');
      // NÃO fazer signOut() — backend é a autoridade
    }

    // Log da violação
    try {
      await supabase.from('book_access_logs').insert([{
        user_id: user?.id,
        user_email: user?.email,
        book_id: bookId,
        page_number: currentPage,
        event_type: 'violation',
        is_violation: true,
        violation_type: type,
        threat_score: newScore,
        metadata
      }]);
    } catch (err) {
      console.warn('[WebBook] Erro ao reportar violação:', err);
    }
  }, [bookId, currentPage, user, threatScore, isOwner]);

  // Navegar para página
  const goToPage = useCallback(async (page: number) => {
    if (!bookData?.book) return;
    
    const maxPage = bookData.book.totalPages;
    
    // ✅ P0: Quando totalPages=0 (modo PDF), permitir navegação livre
    // O WebBookViewer usa effectiveTotalPages (do pdfRenderer) para limitar
    const newPage = maxPage > 0 
      ? Math.max(1, Math.min(page, maxPage))
      : Math.max(1, page); // Modo PDF: não limita aqui
    
    setCurrentPage(newPage);
    
    // Buscar signed URL (só faz sentido se não estiver em modo PDF)
    if (maxPage > 0) {
      await fetchSignedUrl(newPage);
      prefetchPages(newPage);
    }
    
    // Salvar progresso
    saveProgress(newPage);
  }, [bookData, saveProgress, fetchSignedUrl, prefetchPages]);

  // Próxima página
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // Página anterior
  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Salvar anotação
  const saveAnnotation = useCallback(async (
    pageNumber: number,
    type: string,
    options: {
      content?: string;
      positionX?: number;
      positionY?: number;
      width?: number;
      height?: number;
      color?: string;
    } = {}
  ) => {
    if (!bookId) return null;

    try {
      const { data } = await supabase.rpc('fn_save_annotation', {
        p_book_id: bookId,
        p_page_number: pageNumber,
        p_annotation_type: type,
        p_content: options.content || null,
        p_position_x: options.positionX || null,
        p_position_y: options.positionY || null,
        p_width: options.width || null,
        p_height: options.height || null,
        p_color: options.color || '#FFD700'
      });

      const result = data as unknown as { success: boolean; annotationId: string };

      if (result?.success) {
        toast.success('Anotação salva');
        await loadAnnotations();
        return result.annotationId;
      }
    } catch (err) {
      console.error('[WebBook] Erro ao salvar anotação:', err);
      toast.error('Erro ao salvar anotação');
    }
    
    return null;
  }, [bookId, loadAnnotations]);

  // Deletar anotação
  const deleteAnnotation = useCallback(async (annotationId: string) => {
    try {
      const { data } = await supabase.rpc('fn_delete_annotation', {
        p_annotation_id: annotationId
      });

      const result = data as unknown as { success: boolean };

      if (result?.success) {
        toast.success('Anotação removida');
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      }
    } catch (err) {
      console.error('[WebBook] Erro ao deletar anotação:', err);
      toast.error('Erro ao remover anotação');
    }
  }, []);

  // Obter URL da página (usa signed URL ou fallback)
  const getPageUrl = useCallback((page: WebBookPage): string => {
    const signedUrl = signedUrls.get(page.pageNumber);
    if (signedUrl) return signedUrl;
    
    // Fallback para URL pública (owner only)
    if (isOwner) {
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/ena-assets-transmuted`;
      return `${baseUrl}/${page.imagePath}`;
    }
    
    return '';
  }, [signedUrls, isOwner]);

  // Obter URL da thumbnail
  const getThumbnailUrl = useCallback((page: WebBookPage): string => {
    if (page.thumbnailPath) {
      const signedUrl = signedUrls.get(page.pageNumber);
      if (signedUrl) return signedUrl.replace(page.imagePath, page.thumbnailPath);
    }
    return getPageUrl(page);
  }, [getPageUrl, signedUrls]);

  // Obter anotações da página atual
  const getPageAnnotations = useCallback((pageNumber: number): Annotation[] => {
    return annotations.filter(a => a.pageNumber === pageNumber);
  }, [annotations]);

  // Gerar texto de watermark com CPF COMPLETO + EMAIL - SEMPRE VISÍVEL (incluindo OWNER)
  const getWatermarkText = useCallback((): string => {
    // OWNER também vê watermark - sem exceções
    const w = bookData?.watermark;
    
    // CPF e Email do usuário logado
    const cpfDisplay = w?.userCpf || '***';
    const emailDisplay = w?.userEmail || user?.email || '';
    
    if (!cpfDisplay && !emailDisplay) return '';
    
    return `CPF: ${cpfDisplay} | ${emailDisplay}`;
  }, [bookData, user?.email]);

  // Efeito: carregar livro quando bookId mudar
  useEffect(() => {
    if (bookId && user?.id) {
      loadBook();
    }
  }, [bookId, user?.id, loadBook]);

  // Efeito: salvar progresso ao sair
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgress(currentPage, true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentPage, saveProgress]);

  // Efeito: auto-save periódico
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress(currentPage);
    }, PROGRESS_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentPage, saveProgress]);

  // Efeito: refresh de URL antes de expirar
  useEffect(() => {
    const interval = setInterval(() => {
      if (bookId && currentPage) {
        const cacheKey = `${bookId}_${currentPage}`;
        const cached = urlCache.get(cacheKey);
        
        if (cached && cached.expiresAt - Date.now() < URL_CACHE_TTL) {
          fetchSignedUrl(currentPage);
        }
      }
    }, URL_CACHE_TTL);

    return () => clearInterval(interval);
  }, [bookId, currentPage, fetchSignedUrl]);

  // Verificar se precisa de modo PDF direto (sem páginas pré-processadas)
  const needsPdfMode = useMemo(() => {
    // Usar flag do backend se disponível
    if (bookData?.pdfMode?.enabled) return true;
    // Fallback: verificar se não há páginas
    return bookData?.success && 
           (!bookData.pages || bookData.pages.length === 0) &&
           !!bookData.book;
  }, [bookData]);

  // Obter caminho do PDF original - agora usa dados do RPC
  const getOriginalPdfPath = useCallback(async (): Promise<string | null> => {
    // Primeiro: tentar usar dados do pdfMode (vem do RPC)
    if (bookData?.pdfMode?.originalPath) {
      return bookData.pdfMode.originalPath;
    }
    
    // Fallback: buscar do banco
    if (!bookId) return null;
    
    try {
      const { data } = await supabase
        .from('web_books')
        .select('original_path')
        .eq('id', bookId)
        .single();
      
      return data?.original_path || null;
    } catch {
      return null;
    }
  }, [bookId, bookData?.pdfMode?.originalPath]);

  return {
    // Estado
    bookData,
    currentPage,
    isLoading,
    error,
    annotations,
    threatScore,

    // Navegação
    goToPage,
    nextPage,
    previousPage,

    // Anotações
    saveAnnotation,
    deleteAnnotation,
    getPageAnnotations,

    // URLs
    getPageUrl,
    getThumbnailUrl,
    fetchSignedUrl,

    // Sanctum
    reportViolation,
    getWatermarkText,

    // Ações
    loadBook,
    saveProgress: () => saveProgress(currentPage, true),

    // Helpers
    totalPages: bookData?.book?.totalPages || 0,
    progressPercent: bookData?.progress?.progressPercent || 0,
    isOwner,
    watermark: bookData?.watermark,

    // Modo PDF direto
    needsPdfMode,
    getOriginalPdfPath,
    pdfModeData: bookData?.pdfMode
  };
}

// ============================================
// HOOK: useWebBookLibrary
// ============================================

export function useWebBookLibrary() {
  const { user } = useAuth();
  const [books, setBooks] = useState<WebBookListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = useCallback(async (category?: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('fn_list_books_for_category', {
        p_category: category || null,
      });

      if (rpcError) {
        console.error('[WebBookLibrary] RPC error:', rpcError);
        throw rpcError;
      }

      const result = data as unknown as { success: boolean; books: WebBookListItem[]; error?: string };

      if (result?.success) {
        setBooks(result.books || []);
      } else {
        console.error('[WebBookLibrary] RPC returned success=false:', result);
        setError(result?.error || 'Erro ao carregar livros');
      }
    } catch (err) {
      console.error('[WebBookLibrary] Erro:', err);
      const anyErr = err as any;
      setError(anyErr?.message || 'Erro ao carregar biblioteca');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadBooks();
    }
  }, [user?.id, loadBooks]);

  return {
    books,
    isLoading,
    error,
    loadBooks,
    refreshBooks: () => loadBooks()
  };
}

export default useWebBook;
