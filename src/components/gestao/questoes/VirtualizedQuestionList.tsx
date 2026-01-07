// ============================================
// 🚀 VIRTUALIZED QUESTION LIST
// Renderiza apenas itens visíveis na viewport
// Suporte: 45.000+ questões sem travamentos
// Permanente: Arquitetura definitiva v1.0
// ============================================

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Eye,
  Edit,
  MoreVertical,
  Copy,
  Archive,
  CheckCircle,
  Trash2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import QuestionEnunciado from '@/components/shared/QuestionEnunciado';
import { QuestionMetadataBadges, QuestionModeBadge } from '@/components/shared/QuestionMetadataBadges';
import QuestionAILogButton from '@/components/gestao/questoes/QuestionAILogButton';
import { formatBancaHeader } from '@/lib/bancaNormalizer';

// ============================================
// TIPOS
// ============================================

interface QuestionOption {
  id: string;
  text: string;
  image?: { id: string; url: string; path: string; name: string } | null;
}

interface Question {
  id: string;
  area_id?: string | null;
  lesson_id?: string | null;
  quiz_id?: string | null;
  question_text: string;
  question_type: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: string;
  banca?: string | null;
  ano?: number | null;
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
  tags?: string[] | null;
  image_url?: string | null;
  points: number;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VirtualizedQuestionListProps {
  questions: Question[];
  startIndex: number; // Para numeração global (ex: (currentPage - 1) * ITEMS_PER_PAGE)
  aiLogsSummaryMap?: Map<string, any>;
  isLoadingAILogs?: boolean;
  duplicateQuestionIds: Set<string>;
  getGroupNumber: (id: string) => number;
  getGroupMembers: (id: string) => string[];
  onEdit: (question: Question) => void;
  onDuplicate: (question: Question) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

// ============================================
// CONSTANTES DE VIRTUALIZAÇÃO
// ============================================

const ITEM_HEIGHT = 260; // Altura compacta - enunciado mínimo + tags visíveis
const OVERSCAN = 5; // Itens extras acima/abaixo da viewport
const CONTAINER_HEIGHT = 'calc(100vh - 400px)'; // Altura do container scrollável

// ============================================
// COMPONENTE DO ITEM (Memoizado)
// ============================================

interface QuestionItemProps {
  question: Question;
  globalIndex: number;
  aiLogsSummary?: any;
  isLoadingAILogs?: boolean;
  isDuplicate: boolean;
  groupNumber: number;
  groupMemberCount: number;
  onEdit: (question: Question) => void;
  onDuplicate: (question: Question) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

const QuestionItem = memo(function QuestionItem({
  question,
  globalIndex,
  aiLogsSummary,
  isLoadingAILogs,
  isDuplicate,
  groupNumber,
  groupMemberCount,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: QuestionItemProps) {
  const navigate = useNavigate();

  return (
    <div
      className="group relative rounded-lg border-l-4 border-l-primary/50 bg-card p-4 transition-all hover:shadow-lg border border-border/50 hover:border-border"
      style={{ height: ITEM_HEIGHT - 12, overflow: 'hidden' }}
    >
      {/* Barra de Metadados */}
      <QuestionMetadataBadges
        question={question}
        variant="full"
        formatBancaHeader={formatBancaHeader}
        className="mb-3 pb-3 border-b border-border/30"
      />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: ID + Enunciado */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
              #{String(globalIndex + 1).padStart(3, '0')}
            </span>
            {isDuplicate && (
              <span
                className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30"
                title={`Grupo ${groupNumber} - ${groupMemberCount} questões idênticas`}
              >
                🔁 GRUPO {groupNumber} ({groupMemberCount}x)
              </span>
            )}
          </div>

          {/* Enunciado MÍNIMO - apenas preview */}
          <QuestionEnunciado
            questionText={question.question_text}
            imageUrl={question.image_url}
            imageUrls={(question as any).image_urls}
            banca={question.banca}
            ano={question.ano}
            textSize="sm"
            compact={true}
            hideHeader={true}
            maxImageHeight="max-h-16"
            showImageLabel={false}
            className="mb-2 line-clamp-2"
          />

          {/* Badge de Modo (Tags cinza) - SEMPRE VISÍVEL */}
          <div className="mt-auto pt-2">
            <QuestionModeBadge tags={question.tags} />
          </div>
        </div>

        {/* Right: Ações Rápidas */}
        <div className="flex items-center gap-1 shrink-0">
          <QuestionAILogButton
            questionId={question.id}
            summary={aiLogsSummary}
            isLoading={isLoadingAILogs}
            variant="icon"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
            onClick={() => navigate(`/gestaofc/questoes/${question.id}`)}
            title="Ver Detalhe"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-400"
            onClick={() => onEdit(question)}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem onClick={() => onDuplicate(question)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(question.id, question.is_active)}>
                {question.is_active ? (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(question.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Footer: Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {question.tags.slice(0, 5).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/50"
              >
                {tag}
              </span>
            ))}
            {question.tags.length > 5 && (
              <span className="text-[10px] text-muted-foreground">
                +{question.tags.length - 5} mais
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================
// COMPONENTE PRINCIPAL (VIRTUALIZADO)
// ============================================

export const VirtualizedQuestionList = memo(function VirtualizedQuestionList({
  questions,
  startIndex,
  aiLogsSummaryMap,
  isLoadingAILogs,
  duplicateQuestionIds,
  getGroupNumber,
  getGroupMembers,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: VirtualizedQuestionListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Observar altura do container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handler de scroll otimizado
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calcular itens visíveis
  const totalHeight = questions.length * ITEM_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(
    questions.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visibleItems = questions.slice(startIdx, endIdx);
  const offsetY = startIdx * ITEM_HEIGHT;

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Nenhuma questão encontrada
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-auto"
      style={{ height: CONTAINER_HEIGHT, minHeight: '400px' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {visibleItems.map((question, idx) => {
            const globalIndex = startIndex + startIdx + idx;
            const isDuplicate = duplicateQuestionIds.has(question.id);
            const groupMembers = isDuplicate ? getGroupMembers(question.id) : [];

            return (
              <QuestionItem
                key={question.id}
                question={question}
                globalIndex={globalIndex}
                aiLogsSummary={aiLogsSummaryMap?.get(question.id)}
                isLoadingAILogs={isLoadingAILogs}
                isDuplicate={isDuplicate}
                groupNumber={isDuplicate ? getGroupNumber(question.id) : 0}
                groupMemberCount={groupMembers.length}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>

      {/* Indicador de posição */}
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent pt-4 pb-2">
        <div className="text-center text-xs text-muted-foreground">
          Visualizando {startIdx + 1} - {Math.min(endIdx, questions.length)} de {questions.length} questões
        </div>
      </div>
    </div>
  );
});

export default VirtualizedQuestionList;
