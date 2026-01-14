// ============================================
// 🚨 QUESTÕES COM ERROS DO MOISA
// Página para corrigir questões problemáticas
// Critério: sem enunciado OU qualquer alternativa (A-E) vazia
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Pencil,
  RefreshCw,
  FileWarning
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface OptionsType {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  [key: string]: string | undefined;
}

interface QuestionWithErrors {
  id: string;
  question_text: string | null;
  options: OptionsType | null;
  correct_answer: string | null;
  macro: string | null;
  micro: string | null;
  difficulty: string | null;
  banca: string | null;
  ano: number | null;
  created_at: string;
  error_types: string[];
}

// ============================================
// FUNÇÕES DE DETECÇÃO DE ERROS
// ============================================

function detectErrors(question: any): string[] {
  const errors: string[] = [];
  
  // Verifica enunciado
  if (!question.question_text || question.question_text.trim() === '') {
    errors.push('SEM_ENUNCIADO');
  }
  
  // Verifica alternativas
  const options = question.options || {};
  const alternatives = ['A', 'B', 'C', 'D', 'E'];
  
  for (const alt of alternatives) {
    const value = options[alt];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`SEM_ALTERNATIVA_${alt}`);
    }
  }
  
  return errors;
}

function getErrorBadgeColor(error: string): string {
  if (error === 'SEM_ENUNCIADO') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (error.startsWith('SEM_ALTERNATIVA')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
}

function getErrorLabel(error: string): string {
  if (error === 'SEM_ENUNCIADO') return '❌ Sem Enunciado';
  if (error.startsWith('SEM_ALTERNATIVA_')) {
    const letter = error.replace('SEM_ALTERNATIVA_', '');
    return `⚠️ Alt. ${letter} vazia`;
  }
  return error;
}

// ============================================
// COMPONENTE DE CÉLULA EDITÁVEL
// ============================================

interface InlineEditCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

function InlineEditCell({ value, onSave, placeholder = 'Clique para editar', multiline = false, className }: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '');
    }
  }, [value, isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      toast.success('Salvo com sucesso!');
    } catch (err) {
      console.error('[InlineEditCell] Erro ao salvar:', err);
      toast.error('Erro ao salvar');
      setEditValue(value || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="min-h-[100px] text-sm"
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="h-8 text-sm"
            placeholder={placeholder}
            autoFocus
          />
        )}
        <div className="flex flex-col gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const isEmpty = !value || value.trim() === '';
  
  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "group flex items-start gap-1.5 cursor-pointer rounded px-2 py-1 transition-colors hover:bg-muted/50 min-h-[32px]",
        isEmpty && "bg-red-500/10 border border-red-500/30",
        className
      )}
      title="Clique para editar"
    >
      {isEmpty ? (
        <span className="text-sm text-red-400 italic">{placeholder}</span>
      ) : (
        <span className="text-sm line-clamp-3">{value}</span>
      )}
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function GestaoQuestoesErrosMoisa() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ============================================
  // QUERY: Buscar questões problemáticas
  // ============================================
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['questoes-erros-moisa', page],
    queryFn: async () => {
      // Buscar questões que atendem aos critérios de erro
      const { data: questions, error, count } = await supabase
        .from('quiz_questions')
        .select('id, question_text, options, correct_answer, macro, micro, difficulty, banca, ano, created_at', { count: 'exact' })
        .or(`question_text.is.null,question_text.eq.,options.is.null,options->A.is.null,options->B.is.null,options->C.is.null,options->D.is.null,options->E.is.null`)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      // Filtrar no frontend para pegar também alternativas vazias (não null)
      // e adicionar tipos de erro
      const questionsWithErrors: QuestionWithErrors[] = (questions || [])
        .map(q => {
          const optionsObj = (typeof q.options === 'object' && q.options !== null) 
            ? q.options as OptionsType 
            : null;
          return {
            id: q.id,
            question_text: q.question_text,
            options: optionsObj,
            correct_answer: q.correct_answer,
            macro: q.macro,
            micro: q.micro,
            difficulty: q.difficulty,
            banca: q.banca,
            ano: q.ano,
            created_at: q.created_at,
            error_types: detectErrors({ ...q, options: optionsObj })
          };
        })
        .filter(q => q.error_types.length > 0);

      return {
        questions: questionsWithErrors,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    staleTime: 0, // Sempre buscar dados frescos
  });

  // ============================================
  // MUTATION: Atualizar questão
  // ============================================

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      let updateData: any = {};
      
      if (field === 'question_text') {
        updateData.question_text = value;
      } else if (field.startsWith('option_')) {
        const letter = field.replace('option_', '');
        // Buscar options atuais
        const { data: current } = await supabase
          .from('quiz_questions')
          .select('options')
          .eq('id', id)
          .single();
        
        const currentOptions = (typeof current?.options === 'object' && current?.options !== null) 
          ? current.options as OptionsType
          : {};
        updateData.options = {
          ...currentOptions,
          [letter]: value
        };
      } else {
        updateData[field] = value;
      }

      const { error } = await supabase
        .from('quiz_questions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questoes-erros-moisa'] });
      // Também invalida cache de questões para refletir em todo o sistema
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['quiz_questions'] });
    },
    onError: (error) => {
      console.error('[GestaoQuestoesErrosMoisa] Erro ao atualizar:', error);
      toast.error('Erro ao salvar alteração');
    }
  });

  const handleSave = useCallback(async (id: string, field: string, value: string) => {
    await updateMutation.mutateAsync({ id, field, value });
  }, [updateMutation]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/20">
            <FileWarning className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Questões com Erros</h1>
            <p className="text-sm text-muted-foreground">
              {data?.totalCount || 0} questões precisam de correção
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Critérios */}
      <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span><strong>Critérios de erro:</strong> Sem enunciado OU qualquer alternativa (A, B, C, D ou E) vazia</span>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Lista de Questões */}
      {!isLoading && data?.questions && (
        <div className="space-y-4">
          {data.questions.length === 0 ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="py-10 text-center">
                <Check className="w-12 h-12 mx-auto text-green-400 mb-3" />
                <h3 className="text-lg font-semibold text-green-400">Nenhuma questão com erro!</h3>
                <p className="text-sm text-muted-foreground">Todas as questões estão com dados completos.</p>
              </CardContent>
            </Card>
          ) : (
            data.questions.map((question, index) => (
              <Card key={question.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{(page - 1) * pageSize + index + 1}
                      </Badge>
                      {question.error_types.map(error => (
                        <Badge key={error} className={cn("text-xs", getErrorBadgeColor(error))}>
                          {getErrorLabel(error)}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {question.banca && <span>{question.banca}</span>}
                      {question.ano && <span>{question.ano}</span>}
                      {question.macro && (
                        <Badge variant="secondary" className="text-xs">
                          {question.macro}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enunciado */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">ENUNCIADO</label>
                    <InlineEditCell
                      value={question.question_text || ''}
                      onSave={(value) => handleSave(question.id, 'question_text', value)}
                      placeholder="⚠️ Enunciado vazio - clique para adicionar"
                      multiline
                    />
                  </div>

                  {/* Alternativas */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map(letter => {
                      const optionValue = question.options?.[letter] || '';
                      const isCorrect = question.correct_answer === letter;
                      const isEmpty = !optionValue || optionValue.trim() === '';
                      
                      return (
                        <div key={letter}>
                          <label className={cn(
                            "text-xs font-medium mb-1 block",
                            isCorrect ? "text-green-400" : "text-muted-foreground"
                          )}>
                            {letter}) {isCorrect && '✓ CORRETA'}
                          </label>
                          <InlineEditCell
                            value={optionValue}
                            onSave={(value) => handleSave(question.id, `option_${letter}`, value)}
                            placeholder={`Alt. ${letter} vazia`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Página {page} de {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
