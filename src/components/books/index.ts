// ============================================
// 📚 LIVROS DO MOISA - Exports
// ============================================

export { WebBookViewer } from './WebBookViewer';
export { WebBookLibrary } from './WebBookLibrary';
export { PdfPageViewer } from './PdfPageViewer';
export { useWebBook, useWebBookLibrary } from '@/hooks/useWebBook';
export { usePdfRenderer } from '@/hooks/usePdfRenderer';

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
