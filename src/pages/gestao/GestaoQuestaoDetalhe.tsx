// ============================================
// 📋 PRONTUÁRIO DA QUESTÃO - /gestaofc/questoes/:id
// Identidade completa: enunciado, alternativas, resolução,
// competências, pegadinhas, dicas, gabarito
// Visual Futurístico Ano 2300
// ============================================

import { memo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Brain,
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  Archive,
  Clock,
  Tag,
  Target,
  Zap,
  FileQuestion,
  Loader2,
  ExternalLink,
  Calendar,
  Sparkles,
  BookOpen,
  Share2,
  Check,
  AlertCircle,
  Video,
  ImageOff,
  Image as ImageIcon,
} from 'lucide-react';
import { useQuestionImageAnnihilation, invalidateAllQuestionCaches } from '@/hooks/useQuestionImageAnnihilation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import QuestionEnunciado, { getAllQuestionImages } from '@/components/shared/QuestionEnunciado';
import QuestionResolution from '@/components/shared/QuestionResolution';
import QuestionTextField from '@/components/shared/QuestionTextField';
import QuestionAILogButton from '@/components/gestao/questoes/QuestionAILogButton';
import ChemicalImageExtractorButton from '@/components/gestao/questoes/ChemicalImageExtractorButton';
import { useQuestionAILogs } from '@/hooks/useQuestionAILogs';
import QuestionTaxonomyEditor from '@/components/gestao/questoes/QuestionTaxonomyEditor';
import QuestionStyleEditor from '@/components/gestao/questoes/QuestionStyleEditor';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getBancaLabel } from '@/constants/bancas';
import { formatBancaHeader } from '@/lib/bancaNormalizer';

// ============================================
// TIPOS
// ============================================

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
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
  points: number;
  is_active: boolean;
  status_revisao?: string | null;
  origem?: string | null;
  nivel_cognitivo?: string | null;
  tempo_medio_segundos?: number | null;
  competencia_enem?: string | null;
  habilidade_enem?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  facil: { label: 'Fácil', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  medio: { label: 'Médio', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  dificil: { label: 'Difícil', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function GestaoQuestaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const [removeImageConfirm, setRemoveImageConfirm] = useState(false);

  // Hook de aniquilação de imagens
  const { annihilateAllImages } = useQuestionImageAnnihilation();

  // AI Logs: Buscar logs para exibir no botão com summary
  const { data: aiLogs, isLoading: isLoadingAILogs } = useQuestionAILogs(id);
  const aiLogSummary = aiLogs && aiLogs.length > 0 ? {
    question_id: id || '',
    log_count: aiLogs.length,
    last_intervention_at: aiLogs[0]?.created_at || '',
    intervention_types: [...new Set(aiLogs.map(l => l.intervention_type))] as import('@/hooks/useQuestionAILogs').AIInterventionType[],
  } : null;

  // Carregar questão
  const loadQuestion = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Debug forense: garantir que explanation existe e é string
      console.log('[GestaoQuestaoDetalhe] loaded question', {
        id: data?.id,
        explanationType: typeof (data as any)?.explanation,
        explanationLen: typeof (data as any)?.explanation === 'string' ? (data as any).explanation.length : null,
        hasExplanation: (data as any)?.explanation !== null && (data as any)?.explanation !== undefined,
      });

      setQuestion({
        ...data,
        options: (Array.isArray(data.options) ? data.options : []) as unknown as QuestionOption[],
      } as Question);
    } catch (err) {
      console.error('Erro ao carregar questão:', err);
      toast.error('Questão não encontrada');
      navigate('/gestaofc/questoes');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // Copiar URL
  const copyUrl = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Toggle ativo
  const handleToggleActive = useCallback(async () => {
    if (!question) return;

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .update({ is_active: !question.is_active })
        .eq('id', question.id);

      if (error) throw error;

      // PROPAGAÇÃO GLOBAL
      invalidateAllQuestionCaches(queryClient, question.id);
      toast.success(question.is_active ? 'Questão desativada' : 'Questão ativada');
      loadQuestion();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao alterar status');
    }
  }, [question, loadQuestion, queryClient]);

  // Duplicar
  const handleDuplicate = useCallback(async () => {
    if (!question) return;

    try {
      const { id: _, created_at, updated_at, ...rest } = question;
      const { error } = await supabase
        .from('quiz_questions')
        .insert([{
          ...rest,
          question_text: `[CÓPIA] ${rest.question_text}`,
          is_active: false,
          status_revisao: 'rascunho',
        } as any]);

      if (error) throw error;

      // PROPAGAÇÃO GLOBAL
      invalidateAllQuestionCaches(queryClient);
      toast.success('Questão duplicada');
      navigate('/gestaofc/questoes');
    } catch (err) {
      console.error('Erro ao duplicar:', err);
      toast.error('Erro ao duplicar');
    }
  }, [question, navigate, queryClient]);

  // Excluir
  const handleDelete = useCallback(async () => {
    if (!question) return;

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', question.id);

      if (error) throw error;

      // PROPAGAÇÃO GLOBAL
      invalidateAllQuestionCaches(queryClient, question.id);
      toast.success('Questão excluída');
      navigate('/gestaofc/questoes');
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao excluir');
    }
  }, [question, navigate, queryClient]);

  // Remover todas as imagens (ANIQUILAÇÃO TOTAL)
  const handleRemoveAllImages = useCallback(async () => {
    if (!question?.id) return;

    setIsRemovingImage(true);
    try {
      const result = await annihilateAllImages(question.id);

      if (result.success) {
        toast.success('Imagens removidas permanentemente');
        setRemoveImageConfirm(false);
        // Recarregar questão para refletir mudança
        loadQuestion();
      } else {
        toast.error(result.error || 'Erro ao remover imagens');
      }
    } catch (err) {
      console.error('Erro ao remover imagens:', err);
      toast.error('Erro ao remover imagens');
    } finally {
      setIsRemovingImage(false);
    }
  }, [question?.id, annihilateAllImages, loadQuestion]);

  // Verificar se questão tem imagens
  const hasImages = question && (
    ((question as any).image_urls && Array.isArray((question as any).image_urls) && (question as any).image_urls.length > 0) ||
    question.image_url
  );

  // Obter todas as URLs de imagens para extração química
  const allImageUrls = question 
    ? getAllQuestionImages(question.question_text, question.image_url, (question as any).image_urls)
    : [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
  if (!question) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold">Questão não encontrada</h2>
        <p className="text-muted-foreground mb-4">
          O ID informado não corresponde a nenhuma questão.
        </p>
        <Button onClick={() => navigate('/gestaofc/questoes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para listagem
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/gestaofc/questoes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Prontuário da Questão
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              ID: {question.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={copyUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar URL da questão</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* AI LOG BUTTON - Componente com visibilidade global */}
          <QuestionAILogButton
            questionId={id || ''}
            summary={aiLogSummary}
            isLoading={isLoadingAILogs}
            variant="full"
          />

          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>

          <Button variant="outline" size="sm" onClick={handleToggleActive}>
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
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </motion.div>

      {/* Status Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        <Badge variant={question.is_active ? "default" : "secondary"}>
          {question.is_active ? 'Ativa' : 'Inativa'}
        </Badge>
        {question.status_revisao && (
          <Badge variant="outline" className="capitalize">
            {question.status_revisao}
          </Badge>
        )}
        {question.difficulty && (
          <Badge className={cn("border", DIFFICULTY_MAP[question.difficulty]?.color)}>
            {DIFFICULTY_MAP[question.difficulty]?.label}
          </Badge>
        )}
        {/* BANCA + ANO UNIFICADOS (NORMALIZAÇÃO PADRÃO) */}
        <Badge variant="outline">
          🏛️ {formatBancaHeader(question.banca, question.ano, question.question_text)}
        </Badge>
        {question.origem && (
          <Badge variant="outline">
            📌 {question.origem}
          </Badge>
        )}
      </motion.div>

      {/* Enunciado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Enunciado
            </CardTitle>
            {/* Botões de ação de imagem */}
            {hasImages && (
              <div className="flex items-center gap-2">
                {/* Botão de Extração Química - Política v1.0 */}
                <ChemicalImageExtractorButton
                  imageUrls={allImageUrls}
                  questionId={question?.id}
                  onExtracted={(formattedOutput) => {
                    toast.success('Dados químicos extraídos com sucesso');
                    console.log('[CHEMICAL_EXTRACTION] Output:', formattedOutput);
                  }}
                />
                
                {/* Botão de remoção de imagem */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRemoveImageConfirm(true)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <ImageOff className="h-4 w-4 mr-2" />
                        Remover Imagem
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove TODAS as imagens desta questão permanentemente</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Enunciado com Imagem - Componente Universal */}
            <QuestionEnunciado
              questionText={question.question_text}
              imageUrl={question.image_url}
              imageUrls={(question as any).image_urls}
              banca={question.banca}
              ano={question.ano}
              textSize="base"
              showImageLabel
              maxImageHeight="max-h-[1200px]"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Alternativas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Alternativas
            </CardTitle>
            <CardDescription>
              Resposta correta: <strong className="text-green-500 uppercase">{question.correct_answer}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {question.options.map((opt) => (
              <div
                key={opt.id}
                className={cn(
                  "p-3 rounded-lg border flex flex-col gap-2",
                  opt.id === question.correct_answer
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-muted/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "font-bold uppercase w-6 h-6 flex items-center justify-center rounded-full text-sm flex-shrink-0",
                      opt.id === question.correct_answer
                        ? "bg-green-500 text-white"
                        : "bg-muted"
                    )}
                  >
                    {opt.id}
                  </span>
                  <QuestionTextField content={opt.text} fieldType="alternativa" className="flex-1" emptyText="vazio" emptyAsItalic inline />
                  {opt.id === question.correct_answer && (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                {(opt as any).image_url && (
                  <img 
                    src={(opt as any).image_url} 
                    alt={`Imagem alternativa ${opt.id.toUpperCase()}`}
                    className="min-h-[300px] max-h-[800px] w-auto object-contain rounded-lg ml-9"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Resolução + Editor de Estilo */}
      {question.explanation !== null && question.explanation !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-emerald-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-emerald-500">
                <Sparkles className="h-5 w-5" />
                Resolução Comentada
              </CardTitle>
              {/* EDITOR DE ESTILO — Correção Manual do Tipo de Questão */}
              <QuestionStyleEditor
                questionId={question.id}
                currentType={question.question_type}
                currentOptions={question.options}
                currentCorrectAnswer={question.correct_answer}
                onUpdate={loadQuestion}
              />
            </CardHeader>
            <CardContent>
              {String(question.explanation).trim().length > 0 ? (
                <QuestionResolution
                  resolutionText={String(question.explanation)}
                  banca={question.banca}
                  ano={question.ano}
                  difficulty={question.difficulty}
                  tema={question.tema}
                  macro={question.macro}
                  micro={question.micro}
                  competenciaEnem={question.competencia_enem}
                  habilidadeEnem={question.habilidade_enem}
                />
              ) : (
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20 text-sm text-muted-foreground">
                  Sem resolução cadastrada para esta questão.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Vídeo Resolução */}
      {question.video_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-500">
                <Video className="h-5 w-5" />
                Vídeo da Resolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={question.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {question.video_url}
              </a>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* EDITOR DE TAXONOMIA — OWNER CONTROL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <QuestionTaxonomyEditor
          questionId={question.id}
          currentMacro={question.macro}
          currentMicro={question.micro}
          currentTema={question.tema}
          currentSubtema={question.subtema}
          onUpdate={loadQuestion}
        />
      </motion.div>

      {/* Metadados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Outros Metadados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Competência ENEM</p>
                <p className="font-medium">{question.competencia_enem || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Habilidade ENEM</p>
                <p className="font-medium">{question.habilidade_enem || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nível Cognitivo</p>
                <p className="font-medium capitalize">{question.nivel_cognitivo || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tempo Médio</p>
                <p className="font-medium">{question.tempo_medio_segundos ? `${question.tempo_medio_segundos}s` : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pontos</p>
                <p className="font-medium">{question.points}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {format(new Date(question.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">
                  {format(new Date(question.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>

            {question.tags && question.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-muted-foreground text-sm mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A questão será permanentemente excluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Remoção de Imagem */}
      <Dialog open={removeImageConfirm} onOpenChange={setRemoveImageConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ImageOff className="h-5 w-5" />
              Remover Imagens da Questão
            </DialogTitle>
            {/* P0 FIX: DialogDescription renderiza <p> - ul não pode estar dentro de <p> (React #61) */}
            <div className="text-sm text-muted-foreground">
              <strong className="text-destructive">ATENÇÃO:</strong> Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Deletar TODAS as imagens do storage</li>
                <li>Remover referências do banco de dados</li>
                <li>Propagar imediatamente para simulados e modo treino</li>
                <li>Esta ação é <strong>IRREVERSÍVEL</strong></li>
              </ul>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRemoveImageConfirm(false)}
              disabled={isRemovingImage}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveAllImages}
              disabled={isRemovingImage}
            >
              {isRemovingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <ImageOff className="h-4 w-4 mr-2" />
                  Confirmar Remoção
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default memo(GestaoQuestaoDetalhe);
