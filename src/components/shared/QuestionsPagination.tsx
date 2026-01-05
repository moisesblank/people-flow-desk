// ============================================
// 📊 COMPONENTE: QuestionsPagination
// UI de paginação reutilizável para questões
// ============================================

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  className?: string;
}

export function QuestionsPagination({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  isLoading,
  onPageChange,
  onFirstPage,
  onLastPage,
  onNextPage,
  onPreviousPage,
  className,
}: QuestionsPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  if (totalCount === 0) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {/* Info de contagem */}
      <p className="text-sm text-muted-foreground">
        Mostrando <strong>{startItem.toLocaleString('pt-BR')}</strong> a <strong>{endItem.toLocaleString('pt-BR')}</strong> de{' '}
        <strong>{totalCount.toLocaleString('pt-BR')}</strong> questões
      </p>

      {/* Controles de navegação */}
      <div className="flex items-center gap-2">
        {/* Primeira página */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFirstPage}
          disabled={currentPage === 1 || isLoading}
          className="hidden sm:flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Anterior</span>
        </Button>

        {/* Indicador de página */}
        <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {currentPage}
          </span>
          <span className="text-sm text-muted-foreground">
            / {totalPages}
          </span>
        </div>

        {/* Próxima página */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={currentPage === totalPages || isLoading}
        >
          <span className="hidden sm:inline mr-1">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="sm"
          onClick={onLastPage}
          disabled={currentPage === totalPages || isLoading}
          className="hidden sm:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
