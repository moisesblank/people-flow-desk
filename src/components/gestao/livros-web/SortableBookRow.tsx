// ============================================
// 📚 SortableBookRow - Linha arrastável para reordenar livros
// ============================================

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, BookOpen, Eye, Edit, Archive, Trash2, CheckCircle, MoreVertical, Image as ImageIcon, XCircle } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InlineEditableCell } from './index';

// ============================================
// 🖼️ CAPAS PERMANENTES DOS LIVROS (por CATEGORIA)
// ============================================
import capa1RevisaoCiclica from '@/assets/book-covers/capa-1-revisao-ciclica.png';
import capa2FisicoQuimica from '@/assets/book-covers/capa-2-fisico-quimica.png';
import capa3PrevisaoFinal from '@/assets/book-covers/capa-3-previsao-final.png';
import capa4QuimicaOrganica from '@/assets/book-covers/capa-4-quimica-organica.png';
import capa5QuimicaGeral from '@/assets/book-covers/capa-5-quimica-geral.png';

// Mapeamento por CATEGORIA → Capa correspondente
const BOOK_COVERS_BY_CATEGORY: Record<string, string> = {
  quimica_geral: capa5QuimicaGeral,
  quimica_organica: capa4QuimicaOrganica,
  fisico_quimica: capa2FisicoQuimica,
  revisao_ciclica: capa1RevisaoCiclica,
  previsao_final: capa3PrevisaoFinal,
};

interface WebBookAdmin {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  status: string;
  total_pages: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  unique_readers: number;
  cover_url?: string | null;
  cover_path?: string | null;
  position?: number;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface StatusInfo {
  label: string;
  color: string;
  icon: React.ElementType;
}

interface SortableBookRowProps {
  book: WebBookAdmin;
  coverIndex?: number;
  categories: CategoryOption[];
  statusMap: Record<string, StatusInfo>;
  isSelected?: boolean;
  onToggleSelect?: (bookId: string) => void;
  onInlineUpdate: (bookId: string, field: string, value: any) => Promise<void>;
  onPreview: (bookId: string) => void;
  onEdit: (book: WebBookAdmin) => void;
  onPublish: (bookId: string) => void;
  onArchive: (bookId: string) => void;
  onAnnihilate: (book: WebBookAdmin) => void;
  onUploadCover: (bookId: string, file: File) => Promise<void>;
  onRemoveCover: (bookId: string) => Promise<void>;
}

export const SortableBookRow = memo(function SortableBookRow({
  book,
  coverIndex,
  categories,
  statusMap,
  isSelected = false,
  onToggleSelect,
  onInlineUpdate,
  onPreview,
  onEdit,
  onPublish,
  onArchive,
  onAnnihilate,
  onUploadCover,
  onRemoveCover,
}: SortableBookRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const status = statusMap[book.status] || statusMap.draft;
  const StatusIcon = status.icon;
  const category = categories.find(c => c.value === book.category);
  const bookPosition = book.position ?? 999;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50 bg-muted/50',
        isSelected && 'bg-primary/5',
        'group'
      )}
    >
      {/* COLUNA CHECKBOX */}
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect?.(book.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Selecionar ${book.title}`}
        />
      </TableCell>

      {/* COLUNA DRAG HANDLE */}
      <TableCell className="w-12">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className={cn(
            "p-2 rounded cursor-grab active:cursor-grabbing",
            "touch-none select-none",
            "opacity-60 group-hover:opacity-100 transition-opacity",
            "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
          title="Arraste para reordenar"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>

      {/* COLUNA LIVRO — Título e Subtítulo Editáveis */}
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Capa: Prioridade: 1) Upload manual, 2) Categoria, 3) Placeholder */}
          <div className="relative flex-shrink-0">
            {(book.cover_url || BOOK_COVERS_BY_CATEGORY[book.category]) ? (
              <img
                src={book.cover_url || BOOK_COVERS_BY_CATEGORY[book.category]}
                alt={book.title}
                className="w-12 h-16 object-cover rounded shadow-md"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
            )}

            {/* Upload / Remover */}
            <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
              <input
                id={`cover-upload-${book.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.currentTarget.files?.[0];
                  // permite re-selecionar o mesmo arquivo
                  e.currentTarget.value = '';
                  if (file) await onUploadCover(book.id, file);
                }}
              />
              <label
                htmlFor={`cover-upload-${book.id}`}
                className={cn(
                  'h-7 w-7 inline-flex items-center justify-center rounded-full border bg-background shadow-sm',
                  'hover:bg-accent cursor-pointer'
                )}
                title="Enviar/alterar capa"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageIcon className="w-4 h-4 text-foreground" />
              </label>

              {book.cover_url && (
                <button
                  type="button"
                  className={cn(
                    'h-7 w-7 inline-flex items-center justify-center rounded-full border bg-background shadow-sm',
                    'hover:bg-accent'
                  )}
                  title="Remover capa"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onRemoveCover(book.id);
                  }}
                >
                  <XCircle className="w-4 h-4 text-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            {/* Título Editável */}
            <InlineEditableCell
              value={book.title}
              onSave={async (val) => {
                await onInlineUpdate(book.id, 'title', val);
              }}
              placeholder="Título do livro"
              className="font-medium"
              minWidth="180px"
            />
            {/* Subtítulo Editável */}
            <InlineEditableCell
              value={book.subtitle || ''}
              onSave={async (val) => {
                await onInlineUpdate(book.id, 'subtitle', val);
              }}
              placeholder="Adicionar subtítulo..."
              className="text-muted-foreground"
              minWidth="160px"
            />
          </div>
        </div>
      </TableCell>

      {/* COLUNA CATEGORIA — Editável via Select */}
      <TableCell>
        <InlineEditableCell
          value={book.category}
          displayValue={category?.label || book.category}
          onSave={async (val) => {
            await onInlineUpdate(book.id, 'category', val);
          }}
          type="select"
          options={categories}
          minWidth="140px"
        />
      </TableCell>

      {/* COLUNA STATUS — Editável via Select */}
      <TableCell>
        <InlineEditableCell
          value={book.status}
          displayValue={
            <Badge className={cn("gap-1", status.color)}>
              <StatusIcon className={cn("w-3 h-3", book.status === 'processing' && 'animate-spin')} />
              {status.label}
            </Badge>
          }
          onSave={async (val) => {
            await onInlineUpdate(book.id, 'status', val);
          }}
          type="select"
          options={[
            { value: 'draft', label: '📝 Rascunho' },
            { value: 'queued', label: '⏳ Na fila' },
            { value: 'ready', label: '✅ Publicado' },
            { value: 'archived', label: '📦 Arquivado' },
          ]}
          minWidth="120px"
        />
      </TableCell>

      {/* COLUNA PÁGINAS */}
      <TableCell>{book.total_pages || 0}</TableCell>

      {/* COLUNA LEITORES */}
      <TableCell>{book.unique_readers || 0}</TableCell>

      {/* COLUNA DATA */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(book.created_at), "dd/MM/yy", { locale: ptBR })}
        </span>
      </TableCell>

      {/* COLUNA AÇÕES */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(book.id)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(book)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            {(book.status === 'draft' || book.status === 'queued') && (
              <DropdownMenuItem onClick={() => onPublish(book.id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {book.status === 'queued' ? 'Forçar Publicação' : 'Publicar'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onArchive(book.id)}
              className="text-amber-600"
            >
              <Archive className="w-4 h-4 mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAnnihilate(book)}
              className="text-destructive font-semibold"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              🔥 Aniquilar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
