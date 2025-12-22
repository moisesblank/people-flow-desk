// ============================================
// 📚 LIVROS DO MOISA - Hook Principal
// Sistema de Livro Web Interativo
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export interface WebBookData {
  success: boolean;
  error?: string;
  book?: WebBook;
  pages?: WebBookPage[];
  progress?: WebBookProgress;
  watermark?: WebBookWatermark;
  isOwner?: boolean;
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
// CONSTANTES
// ============================================

const PROGRESS_SAVE_INTERVAL = 30000; // 30 segundos
const BUCKET_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/ena-assets-transmuted`;

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
  
  const readingStartRef = useRef<number>(Date.now());
  const lastSaveRef = useRef<number>(Date.now());

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
    } catch (err) {
      console.error('[WebBook] Erro ao carregar:', err);
      setError('Erro ao carregar livro');
    } finally {
      setIsLoading(false);
    }
  }, [bookId, user?.id]);

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
    
    // Só salvar se passou tempo suficiente ou é forçado
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

  // Navegar para página
  const goToPage = useCallback((page: number) => {
    if (!bookData?.book) return;
    
    const maxPage = bookData.book.totalPages;
    const newPage = Math.max(1, Math.min(page, maxPage));
    
    setCurrentPage(newPage);
    saveProgress(newPage);
  }, [bookData, saveProgress]);

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

  // Obter URL da página
  const getPageUrl = useCallback((page: WebBookPage): string => {
    return `${BUCKET_URL}/${page.imagePath}`;
  }, []);

  // Obter URL da thumbnail
  const getThumbnailUrl = useCallback((page: WebBookPage): string => {
    if (page.thumbnailPath) {
      return `${BUCKET_URL}/${page.thumbnailPath}`;
    }
    return getPageUrl(page);
  }, [getPageUrl]);

  // Obter anotações da página atual
  const getPageAnnotations = useCallback((pageNumber: number): Annotation[] => {
    return annotations.filter(a => a.pageNumber === pageNumber);
  }, [annotations]);

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

  return {
    // Estado
    bookData,
    currentPage,
    isLoading,
    error,
    annotations,

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

    // Ações
    loadBook,
    saveProgress: () => saveProgress(currentPage, true),

    // Helpers
    totalPages: bookData?.book?.totalPages || 0,
    progressPercent: bookData?.progress?.progressPercent || 0,
    isOwner: bookData?.isOwner || false,
    watermark: bookData?.watermark
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
      const { data } = await supabase.rpc('fn_list_books_for_category', {
        p_category: category || null
      });

      const result = data as unknown as { success: boolean; books: WebBookListItem[] };

      if (result?.success) {
        setBooks(result.books || []);
      } else {
        setError('Erro ao carregar livros');
      }
    } catch (err) {
      console.error('[WebBookLibrary] Erro:', err);
      setError('Erro ao carregar biblioteca');
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
