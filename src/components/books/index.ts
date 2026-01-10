// ============================================
// 📚 LIVROS DO MOISA - Exports
// ============================================

export { WebBookViewer } from './WebBookViewer';
export { default as WebBookLibrary } from './WebBookLibrary';
export { PdfPageViewer } from './PdfPageViewer';
export { CategoryImageManager } from './CategoryImageManager';
export { FuturisticCategoryFilter } from './FuturisticCategoryFilter';
export { useWebBook, useWebBookLibrary } from '@/hooks/useWebBook';
export { usePdfRenderer } from '@/hooks/usePdfRenderer';
export { useBookCategories } from '@/hooks/useBookCategories';

export type {
  WebBook,
  WebBookPage,
  WebBookData,
  WebBookProgress,
  WebBookWatermark,
  WebBookListItem,
  Annotation
} from '@/hooks/useWebBook';

export type { PdfPageRender } from '@/hooks/usePdfRenderer';
export type { BookCategory, CategoryWithFallback } from '@/hooks/useBookCategories';
