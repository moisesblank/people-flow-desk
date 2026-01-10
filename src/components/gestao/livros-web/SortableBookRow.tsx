// ============================================
// 📚 SortableBookRow - Linha arrastável para reordenar livros
// ============================================

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, BookOpen, Eye, Edit, Archive, Trash2, CheckCircle, MoreVertical } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InlineEditableCell, InlinePositionEditor } from './index';

// Capas modelo (ordem CANÔNICA 01-05)
// 01: Química Geral
// 02: Química Orgânica
// 03: Físico-Química
// 04: Revisão Cíclica
// 05: Previsão Final
import capa1 from '@/assets/book-covers/capa-5-quimica-geral.png';
import capa2 from '@/assets/book-covers/capa-4-quimica-organica.png';
import capa3 from '@/assets/book-covers/capa-2-fisico-quimica.png';
import capa4 from '@/assets/book-covers/capa-1-revisao-ciclica.png';
import capa5 from '@/assets/book-covers/capa-3-previsao-final.png';

const COVER_MODELS = [capa1, capa2, capa3, capa4, capa5];

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
  cover_url?: string;
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
  onInlineUpdate: (bookId: string, field: string, value: any) => Promise<void>;
  onPreview: (bookId: string) => void;
  onEdit: (book: WebBookAdmin) => void;
  onPublish: (bookId: string) => void;
  onArchive: (bookId: string) => void;
  onAnnihilate: (book: WebBookAdmin) => void;
}

export const SortableBookRow = memo(function SortableBookRow({
  book,
  coverIndex,
  categories,
  statusMap,
  onInlineUpdate,
  onPreview,
  onEdit,
  onPublish,
  onArchive,
  onAnnihilate,
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
        'group'
      )}
    >
      {/* COLUNA DRAG HANDLE + POSIÇÃO */}
      <TableCell className="w-20">
        <div className="flex items-center gap-1">
          {/* Handle para arrastar */}
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            className={cn(
              "p-3 rounded cursor-grab active:cursor-grabbing",
              "touch-none select-none",
              "opacity-60 group-hover:opacity-100 transition-opacity",
              "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50",
              "border border-transparent hover:border-primary/30"
            )}
            title="Arraste para reordenar"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              console.log('[DnD] MouseDown no handle');
            }}
          >
            <GripVertical className="w-5 h-5 text-primary" />
          </button>
          
          {/* Posição editável */}
          <InlinePositionEditor
            position={bookPosition}
            coverIndex={coverIndex}
            onSave={async (newPos) => {
              await onInlineUpdate(book.id, 'position', newPos);
            }}
          />
        </div>
      </TableCell>

      {/* COLUNA LIVRO — Título e Subtítulo Editáveis */}
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Miniatura da Capa Modelo (01-05) */}
          {coverIndex !== undefined ? (
            <div className="relative flex-shrink-0">
              <img
                src={COVER_MODELS[coverIndex - 1]}
                alt={`Capa ${coverIndex}`}
                className="w-12 h-16 object-cover rounded shadow-md ring-2 ring-red-500/50"
              />
            </div>
          ) : book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-10 h-14 object-cover rounded"
            />
          ) : (
            <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
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
