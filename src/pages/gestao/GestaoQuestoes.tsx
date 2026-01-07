// ============================================
// 📝 GESTÃO DE QUESTÕES - Área Administrativa
// Gerenciamento completo do banco de questões
// Visual Futurístico Ano 2300 - Enterprise Card Layout
// ============================================

import { memo, useState, useCallback, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionEnunciado from '@/components/shared/QuestionEnunciado';
import { QuestionMetadataBadges, QuestionModeBadge } from '@/components/shared/QuestionMetadataBadges';
import QuestionAILogButton from '@/components/gestao/questoes/QuestionAILogButton';
import GlobalAILogButton from '@/components/gestao/questoes/GlobalAILogButton';
import { useQuestionsWithAILogs, useGlobalAILogsSummary } from '@/hooks/useQuestionAILogs';
import { 
  Brain, 
  Plus, 
  Edit, 
  Archive, 
  Eye, 
  Trash2,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Tag,
  Target,
  Zap,
  BarChart3,
  FileQuestion,
  Copy,
  Download,
  Upload,
  Settings2,
  TrendingUp,
  FolderTree,
  Video,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  QuestionImageUploader, 
  SingleImageUploader,
  type QuestionImage 
} from '@/components/gestao/questoes/QuestionImageUploader';
import { QuestionImportDialog } from '@/components/gestao/questoes/QuestionImportDialog';
import { QuestionImportHistory } from '@/components/gestao/questoes/QuestionImportHistory';
import { VirtualizedQuestionList } from '@/components/gestao/questoes/VirtualizedQuestionList';
import { Button } from '@/components/ui/button';
import { TaxonomyManager } from '@/components/gestao/questoes/TaxonomyManager';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, getBancaLabel } from '@/constants/bancas';
import { formatBancaHeader } from '@/lib/bancaNormalizer';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCacheManager } from '@/hooks/useCacheManager';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { invalidateAllQuestionCaches } from '@/hooks/useQuestionImageAnnihilation';

// ============================================
// TIPOS
// ============================================

interface QuestionOptionImage {
  id: string;
  url: string;
  path: string;
  name: string;
}

interface QuestionOption {
  id: string;
  text: string;
  image?: QuestionOptionImage | null; // Imagem opcional da alternativa
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
  image_url?: string | null; // URL da imagem do enunciado
  points: number;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuestionStats {
  total: number;
  active: number;
  byDifficulty: { facil: number; medio: number; dificil: number };
  byArea: Record<string, number>;
}

// ============================================
// CONSTANTES
// ============================================

// Taxonomia hierárquica agora é dinâmica via useQuestionTaxonomy hook
// Sincronizada em tempo real com o TaxonomyManager

// BANCAS importado de @/constants/bancas (fonte única de verdade)

const DIFFICULTY_MAP = {
  facil: { label: 'Fácil', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  medio: { label: 'Médio', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  dificil: { label: 'Difícil', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
};

// ============================================
// DIALOG: CRIAR/EDITAR QUESTÃO
// ============================================

interface QuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question?: Question | null;
}

const QuestionDialog = memo(function QuestionDialog({ 
  open, 
  onClose, 
  onSuccess, 
  question 
}: QuestionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Hook dinâmico com Realtime - sincronizado com TaxonomyManager
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();
  const [form, setForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
      { id: 'e', text: '' },
    ] as QuestionOption[],
    correct_answer: 'a',
    explanation: '',
    difficulty: 'medio' as 'facil' | 'medio' | 'dificil',
    banca: 'enem',
    ano: null as number | null, // NOVA REGRA: Questões sem ano ficam SEM ANO
    tags: [] as string[],
    points: 10,
    is_active: true,
    // Estrutura hierárquica
    macro: '',
    micro: '',
    tema: '',
    subtema: '',
    orgao_cargo: '',
    // Resolução em vídeo
    has_video_resolution: false,
    video_provider: '' as '' | 'youtube' | 'panda',
    video_url: '',
    // Multidisciplinar
    is_multidisciplinar: false,
    // Competências e Habilidades (Matriz ENEM)
    competencia: '' as '' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7',
    habilidade: '',
    // Tipo Pedagógico
    tipo_pedagogico: 'direta' as 'direta' | 'contextualizada',
    // Imagens do enunciado
    images: [] as QuestionImage[],
  });

  // Preencher form ao editar
  useEffect(() => {
    if (question) {
      setForm({
        question_text: question.question_text || '',
        question_type: question.question_type || 'multiple_choice',
        options: question.options?.length ? question.options : [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
          { id: 'c', text: '' },
          { id: 'd', text: '' },
          { id: 'e', text: '' },
        ],
        correct_answer: question.correct_answer || 'a',
        explanation: question.explanation || '',
        difficulty: (question.difficulty as 'facil' | 'medio' | 'dificil') || 'medio',
        banca: question.banca || 'enem',
        ano: question.ano ?? null, // NOVA REGRA: Preservar null se não tiver ano
        tags: question.tags || [],
        points: question.points || 10,
        is_active: question.is_active ?? true,
        // Estrutura hierárquica
        macro: (question as any).macro || '',
        micro: (question as any).micro || '',
        tema: (question as any).tema || '',
        subtema: (question as any).subtema || '',
        orgao_cargo: (question as any).orgao_cargo || '',
        // Resolução em vídeo
        has_video_resolution: (question as any).has_video_resolution || false,
        video_provider: (question as any).video_provider || '',
        video_url: (question as any).video_url || '',
        // Multidisciplinar
        is_multidisciplinar: (question as any).is_multidisciplinar || false,
        // Competências e Habilidades
        competencia: (question as any).competencia || '',
        habilidade: (question as any).habilidade || '',
        // Tipo Pedagógico
        tipo_pedagogico: (question as any).tipo_pedagogico || 'direta',
        // Imagens do enunciado - usando image_urls (nome correto da coluna no banco)
        images: ((question as any).image_urls || []) as QuestionImage[],
      });
    } else {
      // Reset para nova questão
      setForm({
        question_text: '',
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
          { id: 'c', text: '' },
          { id: 'd', text: '' },
          { id: 'e', text: '' },
        ],
        correct_answer: 'a',
        explanation: '',
        difficulty: 'medio',
        banca: 'enem',
        ano: null,
        tags: [],
        points: 10,
        is_active: true,
        // Estrutura hierárquica
        macro: '',
        micro: '',
        tema: '',
        subtema: '',
        orgao_cargo: '',
        // Resolução em vídeo
        has_video_resolution: false,
        video_provider: '',
        video_url: '',
        // Multidisciplinar
        is_multidisciplinar: false,
        // Competências e Habilidades
        competencia: '',
        habilidade: '',
        // Tipo Pedagógico
        tipo_pedagogico: 'direta',
        // Imagens do enunciado
        images: [],
      });
    }
  }, [question, open]);

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...form.options];
    newOptions[index] = { ...newOptions[index], text };
    setForm(f => ({ ...f, options: newOptions }));
  };

  const handleSubmit = async () => {
    if (!form.question_text.trim()) {
      toast.error('Digite o enunciado da questão');
      return;
    }

    // Verificar se tem pelo menos 2 alternativas preenchidas
    const filledOptions = form.options.filter(o => o.text.trim());
    if (filledOptions.length < 2) {
      toast.error('Preencha pelo menos 2 alternativas');
      return;
    }

    // Verificar se a resposta correta tem texto
    const correctOption = form.options.find(o => o.id === form.correct_answer);
    if (!correctOption?.text.trim()) {
      toast.error('A alternativa correta precisa ter texto');
      return;
    }

    setIsSubmitting(true);
    try {
      // Serializar options para JSON (compatível com Supabase)
      const optionsJson = form.options
        .filter(o => o.text.trim())
        .map(o => ({
          id: o.id,
          text: o.text,
          ...(o.image ? { image: { id: o.image.id, url: o.image.url, path: o.image.path, name: o.image.name } } : {})
        }));

      const payload = {
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        options: optionsJson as unknown as Record<string, unknown>[],
        correct_answer: form.correct_answer,
        explanation: form.explanation.trim() || null,
        difficulty: form.difficulty,
        banca: form.banca,
        ano: form.ano,
        tags: form.tags,
        points: form.points,
        is_active: form.is_active,
        // Estrutura hierárquica
        macro: form.macro || null,
        micro: form.micro || null,
        tema: form.tema || null,
        subtema: form.subtema || null,
        orgao_cargo: form.orgao_cargo || null,
        // Resolução em vídeo
        has_video_resolution: form.has_video_resolution,
        video_provider: form.has_video_resolution && form.video_provider ? form.video_provider : null,
        video_url: form.has_video_resolution && form.video_url ? form.video_url.trim() : null,
        // Imagens do enunciado - usando image_urls (nome correto da coluna no banco)
        image_urls: form.images.map(img => ({
          id: img.id, url: img.url, path: img.path, name: img.name, size: img.size, position: img.position
        })) as unknown as Record<string, unknown>[],
      };

      if (question?.id) {
        // Atualizar
        const { error } = await supabase
          .from('quiz_questions')
          .update({ ...payload, updated_at: new Date().toISOString() } as any)
          .eq('id', question.id);

        if (error) throw error;
        toast.success('Questão atualizada com sucesso!');
      } else {
        // Criar nova
        const { error } = await supabase
          .from('quiz_questions')
          .insert([payload as any]);

        if (error) throw error;
        toast.success('Questão criada com sucesso!');
      }

      // PROPAGAÇÃO GLOBAL - Invalida todos os caches de questões
      invalidateAllQuestionCaches(queryClient, question?.id);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar questão:', err);
      toast.error('Erro ao salvar questão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {question ? 'Editar Questão' : 'Nova Questão'}
          </DialogTitle>
          <DialogDescription>
            {question ? 'Edite os campos da questão' : 'Preencha os campos para criar uma nova questão'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* ============================================ */}
          {/* ESTRUTURA HIERÁRQUICA: MACRO → MICRO → TEMA → SUBTEMA */}
          {/* ============================================ */}
          <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <Label className="font-semibold text-primary">Classificação Hierárquica</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* MACRO */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Macro</Label>
                <Select 
                  value={form.macro} 
                  onValueChange={(v) => setForm(f => ({ ...f, macro: v, micro: '', tema: '', subtema: '' }))}
                  disabled={taxonomyLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={taxonomyLoading ? "Carregando..." : "Selecione..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {macros.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MICRO */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Micro</Label>
                <Select 
                  value={form.micro} 
                  onValueChange={(v) => setForm(f => ({ ...f, micro: v, tema: '', subtema: '' }))}
                  disabled={!form.macro || taxonomyLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getMicrosForSelect(form.macro).map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TEMA */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tema</Label>
                <Select 
                  value={form.tema} 
                  onValueChange={(v) => setForm(f => ({ ...f, tema: v, subtema: '' }))}
                  disabled={!form.micro || taxonomyLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getTemasForSelect(form.micro).map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SUBTEMA */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Subtema</Label>
                <Select 
                  value={form.subtema} 
                  onValueChange={(v) => setForm(f => ({ ...f, subtema: v }))}
                  disabled={!form.tema || taxonomyLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubtemasForSelect(form.tema).map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resolução em Vídeo */}
          <div className="space-y-4 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <Switch
                id="has_video_resolution"
                checked={form.has_video_resolution}
                onCheckedChange={(checked) => setForm(f => ({ 
                  ...f, 
                  has_video_resolution: checked,
                  video_provider: checked ? f.video_provider || 'youtube' : '',
                  video_url: checked ? f.video_url : ''
                }))}
              />
              <Label htmlFor="has_video_resolution" className="font-semibold text-amber-600 dark:text-amber-400 cursor-pointer flex items-center gap-2">
                <Video className="h-4 w-4" />
                Tem Resolução em Vídeo
              </Label>
            </div>
            
            {form.has_video_resolution && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Provedor</Label>
                  <Select 
                    value={form.video_provider} 
                    onValueChange={(v: 'youtube' | 'panda') => setForm(f => ({ ...f, video_provider: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500">▶</span> YouTube
                        </span>
                      </SelectItem>
                      <SelectItem value="panda">
                        <span className="flex items-center gap-2">
                          <span className="text-green-500">🐼</span> Panda Video
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {form.video_provider === 'youtube' ? 'URL ou ID do YouTube' : 'ID do Panda Video'}
                  </Label>
                  <Input
                    placeholder={form.video_provider === 'youtube' 
                      ? 'https://youtube.com/watch?v=... ou ID do vídeo' 
                      : 'ID do vídeo no Panda'
                    }
                    value={form.video_url}
                    onChange={(e) => setForm(f => ({ ...f, video_url: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.video_provider === 'youtube' 
                      ? 'Cole a URL completa ou apenas o ID do vídeo' 
                      : 'Cole o ID do vídeo da plataforma Panda'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Formato da Questão */}
          <div className="space-y-2">
            <Label>Formato da Questão *</Label>
            <Select
              value={form.question_type}
              onValueChange={(v) => setForm(f => ({ ...f, question_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">📝 Múltipla Escolha (A, B, C, D, E)</SelectItem>
                <SelectItem value="discursive">✍️ Discursiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo Pedagógico */}
          <div className="space-y-2">
            <Label>Tipo da Questão (Pedagógico)</Label>
            <Select
              value={form.tipo_pedagogico}
              onValueChange={(v: 'direta' | 'contextualizada') => setForm(f => ({ ...f, tipo_pedagogico: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direta">
                  <div className="flex flex-col">
                    <span>🎯 Direta</span>
                    <span className="text-xs text-muted-foreground">Objetiva, foco conceitual ou cálculo simples</span>
                  </div>
                </SelectItem>
                <SelectItem value="contextualizada">
                  <div className="flex flex-col">
                    <span>📊 Contextualizada</span>
                    <span className="text-xs text-muted-foreground">Situação-problema, interpretação de texto/gráfico</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enunciado */}
          <div className="space-y-2">
            <Label>Enunciado da Questão *</Label>
            <Textarea
              placeholder="Digite o enunciado completo da questão..."
              value={form.question_text}
              onChange={(e) => setForm(f => ({ ...f, question_text: e.target.value }))}
              className="min-h-[120px]"
            />
          </div>

          {/* Upload de Imagens do Enunciado */}
          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-blue-400" />
              <Label className="font-semibold text-blue-400">Imagens do Enunciado</Label>
            </div>
            <QuestionImageUploader
              images={form.images}
              onChange={(images) => setForm(f => ({ ...f, images }))}
              maxImages={5}
              description="Adicione gráficos, tabelas ou ilustrações à questão"
            />
          </div>

          {/* Alternativas - Apenas para Múltipla Escolha */}
          {form.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              <Label>Alternativas *</Label>
              <RadioGroup
                value={form.correct_answer}
                onValueChange={(v) => setForm(f => ({ ...f, correct_answer: v }))}
              >
                {form.options.map((option, idx) => (
                  <div key={option.id} className="flex items-center gap-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label 
                      htmlFor={option.id}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold text-sm cursor-pointer",
                        form.correct_answer === option.id 
                          ? "border-green-500 bg-green-500/20 text-green-500" 
                          : "border-muted-foreground/30"
                      )}
                    >
                      {option.id.toUpperCase()}
                    </Label>
                    <Input
                      placeholder={`Alternativa ${option.id.toUpperCase()}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1"
                    />
                    {/* Upload de imagem na alternativa */}
                    <SingleImageUploader
                      image={option.image ? { ...option.image, size: 0, position: 0 } : null}
                      onChange={(img) => {
                        const newOptions = [...form.options];
                        newOptions[idx] = { ...newOptions[idx], image: img ? { id: img.id, url: img.url, path: img.path, name: img.name } : undefined };
                        setForm(f => ({ ...f, options: newOptions }));
                      }}
                      compact
                    />
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Selecione o radio button para marcar a alternativa correta. Clique no ícone 📷 para adicionar imagem à alternativa.
              </p>
            </div>
          )}

          {/* Gabarito Discursivo - Apenas para Discursiva */}
          {form.question_type === 'discursive' && (
            <div className="space-y-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <Label className="text-amber-400">Gabarito / Resposta Esperada</Label>
              <Textarea
                placeholder="Descreva a resposta esperada para a questão discursiva..."
                value={form.correct_answer}
                onChange={(e) => setForm(f => ({ ...f, correct_answer: e.target.value }))}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Insira a resposta modelo que será usada como referência na correção
              </p>
            </div>
          )}

          {/* Grid 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select 
                value={form.difficulty} 
                onValueChange={(v: 'facil' | 'medio' | 'dificil') => setForm(f => ({ ...f, difficulty: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">🟢 Fácil</SelectItem>
                  <SelectItem value="medio">🟡 Médio</SelectItem>
                  <SelectItem value="dificil">🔴 Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Banca</Label>
              <Select 
                value={form.banca} 
                onValueChange={(v) => setForm(f => ({ ...f, banca: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(BANCAS_POR_CATEGORIA).map(([categoria, bancas]) => (
                    <div key={categoria}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS]}
                      </div>
                      {bancas.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Input
                type="number"
                min={2000}
                max={2030}
                value={form.ano}
                onChange={(e) => setForm(f => ({ ...f, ano: e.target.value ? parseInt(e.target.value) : null }))}
              />
            </div>
          </div>

          {/* Grid 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pontuação</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.points}
                onChange={(e) => setForm(f => ({ ...f, points: parseInt(e.target.value) || 10 }))}
              />
            </div>

            <div className="space-y-2 flex items-center justify-between pt-6">
              <Label>Questão Ativa</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))}
              />
            </div>

            <div className="space-y-2 flex items-center justify-between pt-2">
              <div>
                <Label>Multidisciplinar</Label>
                <p className="text-xs text-muted-foreground">Envolve mais de uma área</p>
              </div>
              <Switch
                checked={form.is_multidisciplinar}
                onCheckedChange={(v) => setForm(f => ({ ...f, is_multidisciplinar: v }))}
              />
            </div>
          </div>

          {/* Competências e Habilidades ENEM */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Target className="h-4 w-4" />
              <span className="text-sm font-semibold">Competências e Habilidades (Matriz ENEM)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Competência (Ciências da Natureza)</Label>
                <Select
                  value={form.competencia || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, competencia: (v === '__none__' ? '' : (v as any)) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    <SelectItem value="C1">C1 - Compreender ciências naturais e tecnologias</SelectItem>
                    <SelectItem value="C2">C2 - Identificar situações-problema</SelectItem>
                    <SelectItem value="C3">C3 - Associar conhecimentos</SelectItem>
                    <SelectItem value="C4">C4 - Avaliar propostas de intervenção</SelectItem>
                    <SelectItem value="C5">C5 - Fenômenos naturais e processos tecnológicos</SelectItem>
                    <SelectItem value="C6">C6 - Apropriar-se de conhecimentos da Química</SelectItem>
                    <SelectItem value="C7">C7 - Apropriar-se de conhecimentos da Biologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Habilidade</Label>
                <Select
                  value={form.habilidade || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, habilidade: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">C1 - Habilidades</div>
                    <SelectItem value="H1">H1</SelectItem>
                    <SelectItem value="H2">H2</SelectItem>
                    <SelectItem value="H3">H3</SelectItem>
                    <SelectItem value="H4">H4</SelectItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">C2 - Habilidades</div>
                    <SelectItem value="H5">H5</SelectItem>
                    <SelectItem value="H6">H6</SelectItem>
                    <SelectItem value="H7">H7</SelectItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">C3 - Habilidades</div>
                    <SelectItem value="H8">H8</SelectItem>
                    <SelectItem value="H9">H9</SelectItem>
                    <SelectItem value="H10">H10</SelectItem>
                    <SelectItem value="H11">H11</SelectItem>
                    <SelectItem value="H12">H12</SelectItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">C4 - Habilidades</div>
                    <SelectItem value="H13">H13</SelectItem>
                    <SelectItem value="H14">H14</SelectItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">C5 - Habilidades</div>
                    <SelectItem value="H15">H15</SelectItem>
                    <SelectItem value="H16">H16</SelectItem>
                    <SelectItem value="H17">H17</SelectItem>
                    <SelectItem value="H18">H18</SelectItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">C6 - Habilidades</div>
                    <SelectItem value="H19">H19</SelectItem>
                    <SelectItem value="H20">H20</SelectItem>
                    <SelectItem value="H21">H21</SelectItem>
                    <SelectItem value="H22">H22</SelectItem>
                    <SelectItem value="H23">H23</SelectItem>
                    <SelectItem value="H24">H24</SelectItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">C7 - Habilidades</div>
                    <SelectItem value="H25">H25</SelectItem>
                    <SelectItem value="H26">H26</SelectItem>
                    <SelectItem value="H27">H27</SelectItem>
                    <SelectItem value="H28">H28</SelectItem>
                    <SelectItem value="H29">H29</SelectItem>
                    <SelectItem value="H30">H30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Resolução da Questão</Label>
            <Textarea
              placeholder="Explique o raciocínio e a resolução passo a passo..."
              value={form.explanation}
              onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {question ? 'Atualizar' : 'Criar Questão'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function GestaoQuestoes() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [bancaFilter, setBancaFilter] = useState<string>('all');
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [anoFilter, setAnoFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [activeTab, setActiveTab] = useState('todas');
  const [simuladosFilter, setSimuladosFilter] = useState(false);
  const [macroAreaFilter, setMacroAreaFilter] = useState<'all' | 'organica' | 'fisico_quimica' | 'geral'>('all');
  const [microFilter, setMicroFilter] = useState<string>('all');
  const [temaFilter, setTemaFilter] = useState<string>('all');
  const [subtemaFilter, setSubtemaFilter] = useState<string>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all' | 'multiple_choice' | 'discursive' | 'outros'>('all');
  const [estiloEnemFilter, setEstiloEnemFilter] = useState(false);
  
  // Dialog states
  const [questionDialog, setQuestionDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [annihilationConfirmText, setAnnihilationConfirmText] = useState('');
  const [annihilationCheckbox, setAnnihilationCheckbox] = useState(false);
  const [taxonomyManagerOpen, setTaxonomyManagerOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importHistoryOpen, setImportHistoryOpen] = useState(false);
  
  // MODO TREINO deletion states
  const [deleteTreinoConfirm, setDeleteTreinoConfirm] = useState(false);
  const [isDeletingTreino, setIsDeletingTreino] = useState(false);
  const [treinoConfirmText, setTreinoConfirmText] = useState('');
  
  // SEM GRUPO deletion states
  const [deleteSemGrupoConfirm, setDeleteSemGrupoConfirm] = useState(false);
  const [isDeletingSemGrupo, setIsDeletingSemGrupo] = useState(false);
  const [semGrupoConfirmText, setSemGrupoConfirmText] = useState('');
  
  // SIMULADOS deletion states
  const [deleteSimuladosConfirm, setDeleteSimuladosConfirm] = useState(false);
  const [isDeletingSimulados, setIsDeletingSimulados] = useState(false);
  const [simuladosConfirmText, setSimuladosConfirmText] = useState('');
  
  // PAGINATION: 25 itens por página (otimizado para performance)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const { clearQueryCache } = useCacheManager();
  const { isOwner } = useRolePermissions();
  const queryClient = useQueryClient();

  // ═══════════════════════════════════════════════════════════════
  // 📋 ESCALA 45K: CARREGAMENTO EM LOTES (BATCHING) + PAGINAÇÃO CLIENT-SIDE
  // LEI CONSTITUCIONAL - AUDIT_ESCALA_45K_LIMITS.ts
  // Carrega TODAS as questões em lotes de 1000 via .range()
  // Paginação visual é feita no cliente (100 itens por página)
  // ═══════════════════════════════════════════════════════════════
  
  // Query que carrega TUDO em lotes para estatísticas precisas
  const { 
    data: allQuestionsData, 
    isLoading: questionsQueryLoading, 
    refetch: refetchQuestions 
  } = useQuery({
    queryKey: ['quiz-questions-all-batched'],
    queryFn: async () => {
      const BATCH_SIZE = 1000;
      const MAX_RECORDS = 45000;
      let allData: any[] = [];
      let hasMore = true;
      let offset = 0;

      // COUNT forense primeiro
      const { count: totalCount, error: countError } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('[BATCHING] Erro no COUNT:', countError);
        throw countError;
      }

      console.log(`[BATCHING] Total no banco: ${totalCount}`);

      // Carregar em lotes de 1000
      while (hasMore && offset < MAX_RECORDS) {
        const { data: batch, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
          console.error(`[BATCHING] Erro no lote ${offset}:`, error);
          throw error;
        }

        if (batch && batch.length > 0) {
          allData = [...allData, ...batch];
          offset += BATCH_SIZE;
          hasMore = batch.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      console.log(`[BATCHING] Carregados: ${allData.length} de ${totalCount}`);

      // Verificação forense: alertar divergência
      if (totalCount && allData.length !== totalCount) {
        console.warn(`[FORENSE] DIVERGÊNCIA! Esperado: ${totalCount}, Carregado: ${allData.length}`);
        toast.warning(`Divergência detectada: ${allData.length} de ${totalCount} questões carregadas`);
      }

      // Mapear para o tipo Question com fallbacks seguros
      const mapped = allData.map(q => ({
        ...q,
        options: (Array.isArray(q.options) ? q.options : []) as unknown as QuestionOption[],
        difficulty: q.difficulty || 'medio',
        points: q.points || 10,
        is_active: q.is_active ?? true,
      })) as unknown as Question[];

      return { data: mapped, count: totalCount || allData.length };
    },
    staleTime: 60_000, // 1 min cache (dados completos)
  });

  // Compatibilidade: manter setQuestions funcionando
  useEffect(() => {
    if (allQuestionsData?.data) {
      setQuestions(allQuestionsData.data);
    }
  }, [allQuestionsData]);

  // Total real do banco (para display)
  const totalCount = allQuestionsData?.count || 0;

  // Loading state combinado
  useEffect(() => {
    setIsLoading(questionsQueryLoading);
  }, [questionsQueryLoading]);

  // Wrapper para refetch (compatibilidade)
  const loadQuestions = useCallback(() => {
    refetchQuestions();
  }, [refetchQuestions]);


  // Após importar: recarrega e zera filtros para garantir visibilidade imediata
  // BLINDADO: Este callback SEMPRE é chamado pelo QuestionImportDialog.onSuccess
  const handleImportSuccess = useCallback((importedCount?: number) => {
    // 1. Resetar todos os filtros para exibir TODAS as questões
    setActiveTab('todas');
    setSearchTerm('');
    setDifficultyFilter('all');
    setBancaFilter('all');
    setMacroFilter('all');
    setAnoFilter('all');
    setSortOrder('newest');
    setMacroAreaFilter('all');
    setMicroFilter('all');
    setTemaFilter('all');
    setSubtemaFilter('all');
    
    // 2. Forçar reload do banco (ignora cache)
    loadQuestions();
    
    // 3. Toast informativo com quantidade (se disponível)
    if (importedCount && importedCount > 0) {
      toast.success(`${importedCount} questões importadas e visíveis na lista!`);
    }
  }, [loadQuestions]);

  // MACROs CANÔNICOS da taxonomia (quimica_geral, quimica_organica, fisico_quimica)
  const { macros: taxonomyMacros, getMicrosForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();
  
  // Extrair valores únicos de macro das questões (para fallback/debug)
  const uniqueMacros = useMemo(() => {
    const macros = questions.map(q => q.macro).filter(Boolean) as string[];
    return [...new Set(macros)].sort();
  }, [questions]);

  const uniqueAnos = useMemo(() => {
    const anos = questions.map(q => q.ano).filter(Boolean) as number[];
    return [...new Set(anos)].sort((a, b) => b - a);
  }, [questions]);

  // Nota: loadQuestions agora é gerenciado pelo useQuery - não precisa de useEffect inicial

  // Helper: classificar macro em grande área - TAXONOMIA OFICIAL 5 MACROS
  const classifyMacroArea = useCallback((macro: string | null | undefined): 'organica' | 'fisico_quimica' | 'geral' | 'ambiental' | 'bioquimica' => {
    if (!macro) return 'geral';
    const m = macro.toLowerCase();
    
    // Química Ambiental (verificar primeiro por especificidade)
    if (m.includes('ambiental') || m.includes('poluição') || m.includes('poluicao') || 
        m.includes('estufa') || m.includes('ozônio') || m.includes('ozonio') ||
        m.includes('chuva ácida') || m.includes('chuva acida') || m.includes('sustentabilidade') ||
        m.includes('reciclagem') || m.includes('efeito estufa') || m.includes('efluente')) {
      return 'ambiental';
    }
    
    // Bioquímica (verificar antes de orgânica)
    if (m.includes('bioquímica') || m.includes('bioquimica') || m.includes('carboidrato') ||
        m.includes('lipídio') || m.includes('lipidio') || m.includes('proteína') || m.includes('proteina') ||
        m.includes('aminoácido') || m.includes('aminoacido') || m.includes('enzima') ||
        m.includes('dna') || m.includes('rna') || m.includes('metabolismo') ||
        m.includes('vitamina') || m.includes('hormônio') || m.includes('hormonio') ||
        m.includes('nucleotídeo') || m.includes('nucleotideo')) {
      return 'bioquimica';
    }
    
    // Química Orgânica: funções orgânicas, isomeria, reações orgânicas, polímeros
    if (m.includes('orgânica') || m.includes('organica') || m.includes('polímero') || m.includes('polimero') || 
        m.includes('isomeria') || m.includes('hidrocarboneto') ||
        m.includes('álcool') || m.includes('alcool') || m.includes('éster') || m.includes('ester') ||
        m.includes('amina') || m.includes('amida') || m.includes('aldeído') || m.includes('aldeido') ||
        m.includes('cetona') || m.includes('ácido carboxílico') || m.includes('acido carboxilico') ||
        m.includes('fenol') || m.includes('éter') || m.includes('eter') || m.includes('aromático') ||
        m.includes('aromatico') || m.includes('funcional') || m.includes('butano') || m.includes('hexano')) {
      return 'organica';
    }
    
    // Físico-Química: termoquímica, cinética, equilíbrio, eletroquímica, soluções, gases, nuclear, radioatividade
    if (m.includes('físico') || m.includes('fisico') || m.includes('termo') || m.includes('cinética') || 
        m.includes('cinetica') || m.includes('equilíbrio') || m.includes('equilibrio') || m.includes('gase') ||
        m.includes('eletroquímica') || m.includes('eletroquimica') || m.includes('pilha') || m.includes('eletrólise') ||
        m.includes('eletrolise') || m.includes('soluç') || m.includes('soluc') || m.includes('coligativa') ||
        m.includes('ph') || m.includes('poh') || m.includes('hidrólise') || m.includes('hidrolise') ||
        m.includes('tampão') || m.includes('tampao') || m.includes('oxidação') || m.includes('oxidacao') ||
        m.includes('redução') || m.includes('reducao') || m.includes('nox') || m.includes('galvân') ||
        m.includes('galvan') || m.includes('potencial') || m.includes('velocidade') || m.includes('oxi') ||
        m.includes('nuclear') || m.includes('radioativ') || m.includes('entalpia') || m.includes('entropia') ||
        m.includes('calor') || m.includes('reação') || m.includes('reacao') || m.includes('reações') ||
        m.includes('reacoes') || m.includes('estequiometria')) {
      return 'fisico_quimica';
    }
    
    // Química Geral: atomística, tabela periódica, ligações, separação misturas, propriedades da matéria
    return 'geral';
  }, []);

  // Micros filtrados pelo macroAreaFilter selecionado - SINCRONIZADO com cards
  const uniqueMicros = useMemo(() => {
    // Se filtro macro ativo, filtrar micros por área classificada
    if (macroAreaFilter !== 'all') {
      // Primeiro tenta buscar da taxonomia (mapeando area para macro value)
      const areaToMacroValue: Record<string, string> = {
        'organica': 'Química Orgânica',
        'fisico_quimica': 'Físico-Química',
        'geral': 'Química Geral',
        'ambiental': 'Química Ambiental',
        'bioquimica': 'Bioquímica',
      };
      const macroValue = areaToMacroValue[macroAreaFilter];
      const taxonomyMicros = getMicrosForSelect(macroValue);
      if (taxonomyMicros.length > 0) {
        return taxonomyMicros.map(m => m.label);
      }
      // Fallback: filtrar por classificação e extrair micros dos dados
      const filtered = questions.filter(q => classifyMacroArea(q.macro) === macroAreaFilter);
      const micros = filtered.map(q => q.micro).filter(Boolean) as string[];
      return [...new Set(micros)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }
    // Sem filtro: mostrar todos os micros únicos dos dados
    const micros = questions.map(q => q.micro).filter(Boolean) as string[];
    return [...new Set(micros)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [questions, macroAreaFilter, getMicrosForSelect, classifyMacroArea]);

  // TEMAs filtrados pelo microFilter selecionado (MACRO → MICRO → TEMA)
  const uniqueTemas = useMemo(() => {
    // Se filtro micro ativo, filtrar temas das questões com esse micro
    if (microFilter !== 'all') {
      const filtered = questions.filter(q => q.micro?.includes(microFilter.replace('...', '')));
      const temas = filtered.map(q => q.tema).filter(Boolean) as string[];
      return [...new Set(temas)].sort();
    }
    // Se filtro macro ativo (mas micro = all), mostrar temas da área
    if (macroAreaFilter !== 'all') {
      const filtered = questions.filter(q => classifyMacroArea(q.macro) === macroAreaFilter);
      const temas = filtered.map(q => q.tema).filter(Boolean) as string[];
      return [...new Set(temas)].sort();
    }
    // Sem filtro: mostrar todos os temas únicos dos dados
    const temas = questions.map(q => q.tema).filter(Boolean) as string[];
    return [...new Set(temas)].sort();
  }, [questions, microFilter, macroAreaFilter, classifyMacroArea]);

  // SUBTEMAs filtrados pelo temaFilter selecionado (MACRO → MICRO → TEMA → SUBTEMA)
  const uniqueSubtemas = useMemo(() => {
    // Se filtro tema ativo, filtrar subtemas das questões com esse tema
    if (temaFilter !== 'all') {
      const filtered = questions.filter(q => q.tema?.includes(temaFilter.replace('...', '')));
      const subtemas = filtered.map(q => q.subtema).filter(Boolean) as string[];
      return [...new Set(subtemas)].sort();
    }
    // Se filtro micro ativo (mas tema = all), mostrar subtemas do micro
    if (microFilter !== 'all') {
      const filtered = questions.filter(q => q.micro?.includes(microFilter.replace('...', '')));
      const subtemas = filtered.map(q => q.subtema).filter(Boolean) as string[];
      return [...new Set(subtemas)].sort();
    }
    // Se filtro macro ativo (mas micro e tema = all), mostrar subtemas da área
    if (macroAreaFilter !== 'all') {
      const filtered = questions.filter(q => classifyMacroArea(q.macro) === macroAreaFilter);
      const subtemas = filtered.map(q => q.subtema).filter(Boolean) as string[];
      return [...new Set(subtemas)].sort();
    }
    // Sem filtro: mostrar todos os subtemas únicos dos dados
    const subtemas = questions.map(q => q.subtema).filter(Boolean) as string[];
    return [...new Set(subtemas)].sort();
  }, [questions, temaFilter, microFilter, macroAreaFilter, classifyMacroArea]);

  // Estatísticas por Grande Área
  const macroAreaStats = useMemo(() => {
    return {
      organica: questions.filter(q => classifyMacroArea(q.macro) === 'organica').length,
      fisico_quimica: questions.filter(q => classifyMacroArea(q.macro) === 'fisico_quimica').length,
      geral: questions.filter(q => classifyMacroArea(q.macro) === 'geral').length,
    };
  }, [questions, classifyMacroArea]);

  // Handler SINCRONIZADO para cards e dropdown (toggle + sync + reset filhos)
  const handleMacroAreaFilterChange = useCallback((area: 'all' | 'organica' | 'fisico_quimica' | 'geral') => {
    // Toggle: se já está selecionado, volta para 'all'
    const newArea = macroAreaFilter === area ? 'all' : area;
    setMacroAreaFilter(newArea);
    
    // Sincroniza macroFilter para filtros legados
    const areaToMacro: Record<string, string> = {
      'organica': 'quimica_organica',
      'fisico_quimica': 'fisico_quimica',
      'geral': 'quimica_geral',
      'all': 'all'
    };
    setMacroFilter(areaToMacro[newArea] || 'all');
    
    // CASCATA: resetar filtros filhos (MICRO → TEMA → SUBTEMA)
    setMicroFilter('all');
    setTemaFilter('all');
    setSubtemaFilter('all');
  }, [macroAreaFilter]);

  // Handler para MICRO que reseta TEMA e SUBTEMA quando muda
  const handleMicroFilterChange = useCallback((micro: string) => {
    setMicroFilter(micro);
    // CASCATA: resetar tema e subtema quando micro muda
    setTemaFilter('all');
    setSubtemaFilter('all');
  }, []);

  // Handler para TEMA que reseta SUBTEMA quando muda
  const handleTemaFilterChange = useCallback((tema: string) => {
    setTemaFilter(tema);
    // CASCATA: resetar subtema quando tema muda
    setSubtemaFilter('all');
  }, []);

  // Top Micro Assuntos (filtrados por macroAreaFilter se ativo)
  const topMicroAssuntos = useMemo(() => {
    let filteredByArea = questions;
    if (macroAreaFilter !== 'all') {
      filteredByArea = questions.filter(q => classifyMacroArea(q.macro) === macroAreaFilter);
    }
    
    const microCounts: Record<string, number> = {};
    filteredByArea.forEach(q => {
      if (q.micro) {
        // Truncar micro longo para agrupamento
        const microKey = q.micro.length > 50 ? q.micro.substring(0, 50) + '...' : q.micro;
        microCounts[microKey] = (microCounts[microKey] || 0) + 1;
      }
    });
    
    return Object.entries(microCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([micro, count]) => ({ micro, count }));
  }, [questions, macroAreaFilter, classifyMacroArea]);

  // Estatísticas
  const stats = useMemo(() => {
    const active = questions.filter(q => q.is_active);
    const simulados = questions.filter(q => q.tags?.includes('SIMULADOS'));
    const modoTreino = questions.filter(q => q.tags?.includes('MODO_TREINO'));
    // NÃO ASSOCIADA: questões que NÃO têm MACRO e MICRO juntos
    const naoAssociada = questions.filter(q => !q.macro || !q.micro);
    // SEM GRUPO: questões que NÃO têm SIMULADOS nem MODO_TREINO nas tags
    const semGrupo = questions.filter(q => {
      const tags = q.tags || [];
      return !tags.includes('SIMULADOS') && !tags.includes('MODO_TREINO');
    });
    // ESTILO ENEM: questões com características ENEM
    const estiloEnem = questions.filter(q => {
      const qAny = q as any;
      if (qAny.is_estilo_enem === true) return true;
      if (qAny.tem_situacao_problema === true) return true;
      if (qAny.tem_texto_base === true) return true;
      if (qAny.tipo_estrutura === 'situacao_problema') return true;
      if (qAny.tipo_estrutura === 'interpretacao_texto') return true;
      if (qAny.demanda_cognitiva === 'alta' || qAny.demanda_cognitiva === 'muito_alta') return true;
      if (qAny.habilidades_enem?.length > 0) return true;
      if (q.question_text && q.question_text.length > 500) return true;
      return false;
    });
    return {
      total: questions.length,
      active: active.length,
      simulados: simulados.length,
      modoTreino: modoTreino.length,
      naoAssociada: naoAssociada.length,
      estiloEnem: estiloEnem.length,
      semGrupo: semGrupo.length,
      byDifficulty: {
        facil: questions.filter(q => q.difficulty === 'facil').length,
        medio: questions.filter(q => q.difficulty === 'medio').length,
        dificil: questions.filter(q => q.difficulty === 'dificil').length,
      },
      byArea: {},
    };
  }, [questions]);

  // DETECÇÃO DE QUESTÕES REPETIDAS (baseado no enunciado normalizado)
  // Mapa de duplicatas: ID → grupo de IDs duplicados (para agrupamento visual)
  const { duplicateQuestionIds, duplicateGroups, getGroupNumber, getGroupMembers } = useMemo(() => {
    // Normaliza o enunciado: lowercase, trim, remove espaços múltiplos
    const normalizeText = (text: string) => 
      text.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Mapa de enunciado normalizado → array de IDs
    const enunciadoMap = new Map<string, string[]>();
    
    questions.forEach(q => {
      const normalized = normalizeText(q.question_text);
      const existing = enunciadoMap.get(normalized) || [];
      existing.push(q.id);
      enunciadoMap.set(normalized, existing);
    });
    
    // Coleta IDs que aparecem mais de uma vez (todas as ocorrências são duplicatas)
    const duplicateIds = new Set<string>();
    // Mapa: ID → array de IDs no mesmo grupo (incluindo a própria)
    const groups = new Map<string, string[]>();
    // Mapa: ID → número do grupo (para ordenação)
    const idToGroupNumber = new Map<string, number>();
    
    let groupNumber = 1;
    enunciadoMap.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach(id => {
          duplicateIds.add(id);
          groups.set(id, ids);
          idToGroupNumber.set(id, groupNumber);
        });
        groupNumber++;
      }
    });
    
    return {
      duplicateQuestionIds: duplicateIds,
      duplicateGroups: groups,
      getGroupNumber: (id: string) => idToGroupNumber.get(id) || 0,
      getGroupMembers: (id: string) => groups.get(id) || [],
    };
  }, [questions]);

  // Função helper para verificar se uma questão é duplicata
  const isDuplicateQuestion = useCallback((questionId: string) => {
    return duplicateQuestionIds.has(questionId);
  }, [duplicateQuestionIds]);

  // Questões filtradas e ordenadas
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Filtro por aba
    if (activeTab === 'ativas') {
      filtered = filtered.filter(q => q.is_active);
    } else if (activeTab === 'inativas') {
      filtered = filtered.filter(q => !q.is_active);
    } else if (activeTab === 'simulados') {
      filtered = filtered.filter(q => q.tags?.includes('SIMULADOS'));
    } else if (activeTab === 'modo_treino') {
      filtered = filtered.filter(q => q.tags?.includes('MODO_TREINO'));
    } else if (activeTab === 'repetidas') {
      filtered = filtered.filter(q => duplicateQuestionIds.has(q.id));
    } else if (activeTab === 'nao_associada') {
      // NÃO ASSOCIADA: questões sem MACRO e/ou MICRO
      filtered = filtered.filter(q => !q.macro || !q.micro);
    }

    // Filtro por dificuldade
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Filtro por banca
    if (bancaFilter !== 'all') {
      filtered = filtered.filter(q => q.banca === bancaFilter);
    }

    // Filtro por macro CANÔNICO (área de conhecimento)
    // Mapeia macro filter para classifyMacroArea se for valor canônico
    if (macroFilter !== 'all') {
      const macroToAreaMap: Record<string, 'organica' | 'fisico_quimica' | 'geral'> = {
        'quimica_organica': 'organica',
        'fisico_quimica': 'fisico_quimica',
        'quimica_geral': 'geral',
      };
      const targetArea = macroToAreaMap[macroFilter];
      if (targetArea) {
        // Usar classificação inteligente
        filtered = filtered.filter(q => classifyMacroArea(q.macro) === targetArea);
      } else {
        // Fallback: match direto
        filtered = filtered.filter(q => q.macro === macroFilter);
      }
    }

    // Filtro por ano
    if (anoFilter !== 'all') {
      filtered = filtered.filter(q => q.ano === parseInt(anoFilter));
    }

    // Filtro por Grande Área (macro agrupada)
    if (macroAreaFilter !== 'all') {
      filtered = filtered.filter(q => classifyMacroArea(q.macro) === macroAreaFilter);
    }

    // Filtro por Micro Assunto
    if (microFilter !== 'all') {
      filtered = filtered.filter(q => q.micro?.includes(microFilter.replace('...', '')));
    }

    // Filtro por Tema (MACRO → MICRO → TEMA)
    if (temaFilter !== 'all') {
      filtered = filtered.filter(q => q.tema?.includes(temaFilter.replace('...', '')));
    }

    // Filtro por Subtema (MACRO → MICRO → TEMA → SUBTEMA)
    if (subtemaFilter !== 'all') {
      filtered = filtered.filter(q => q.subtema?.includes(subtemaFilter.replace('...', '')));
    }

    // Filtro por Estilo da Questão (múltipla escolha, discursiva ou outros)
    if (questionTypeFilter !== 'all') {
      if (questionTypeFilter === 'outros') {
        // Outros: V/F, soma de itens, etc (não é múltipla escolha nem discursiva)
        filtered = filtered.filter(q => 
          q.question_type !== 'multiple_choice' && 
          q.question_type !== 'discursive'
        );
      } else {
        filtered = filtered.filter(q => q.question_type === questionTypeFilter);
      }
    }

    // ==========================================
    // FILTRO ESTILO ENEM (Enterprise-Level)
    // Questões com características ENEM: situação-problema, texto-base, contexto
    // ==========================================
    if (estiloEnemFilter) {
      filtered = filtered.filter(q => {
        const qAny = q as any;
        // Verifica flag explícita
        if (qAny.is_estilo_enem === true) return true;
        // Verifica características ENEM (heurística)
        if (qAny.tem_situacao_problema === true) return true;
        if (qAny.tem_texto_base === true) return true;
        if (qAny.tipo_estrutura === 'situacao_problema') return true;
        if (qAny.tipo_estrutura === 'interpretacao_texto') return true;
        if (qAny.tipo_estrutura === 'analise_dados') return true;
        if (qAny.demanda_cognitiva === 'alta' || qAny.demanda_cognitiva === 'muito_alta') return true;
        if (qAny.habilidades_enem?.length > 0) return true;
        // Heurística por tamanho do enunciado (>500 chars = provavelmente contextualizada)
        if (q.question_text && q.question_text.length > 500) return true;
        return false;
      });
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term) ||
        q.macro?.toLowerCase().includes(term) ||
        q.micro?.toLowerCase().includes(term) ||
        q.tema?.toLowerCase().includes(term) ||
        q.subtema?.toLowerCase().includes(term)
      );
    }

    // Ordenação especial para aba "Repetidas": agrupa duplicatas juntas
    if (activeTab === 'repetidas') {
      // Ordenar por número do grupo, depois por data de criação
      filtered.sort((a, b) => {
        const groupA = getGroupNumber(a.id);
        const groupB = getGroupNumber(b.id);
        if (groupA !== groupB) {
          return groupA - groupB; // Agrupa por número do grupo
        }
        // Dentro do mesmo grupo, ordena por data (mais antiga primeiro)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } else {
      // Ordenação padrão
      switch (sortOrder) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'ano_desc':
          filtered.sort((a, b) => (b.ano || 0) - (a.ano || 0));
          break;
        case 'ano_asc':
          filtered.sort((a, b) => (a.ano || 0) - (b.ano || 0));
          break;
        case 'difficulty_asc':
          const diffOrder = { facil: 1, medio: 2, dificil: 3 };
          filtered.sort((a, b) => (diffOrder[a.difficulty as keyof typeof diffOrder] || 2) - (diffOrder[b.difficulty as keyof typeof diffOrder] || 2));
          break;
        case 'difficulty_desc':
          const diffOrderDesc = { facil: 1, medio: 2, dificil: 3 };
          filtered.sort((a, b) => (diffOrderDesc[b.difficulty as keyof typeof diffOrderDesc] || 2) - (diffOrderDesc[a.difficulty as keyof typeof diffOrderDesc] || 2));
          break;
        case 'alphabetical':
          filtered.sort((a, b) => a.question_text.localeCompare(b.question_text));
          break;
      }
    }

    return filtered;
  }, [questions, activeTab, difficultyFilter, bancaFilter, macroFilter, anoFilter, searchTerm, sortOrder, macroAreaFilter, microFilter, temaFilter, subtemaFilter, classifyMacroArea, duplicateQuestionIds, getGroupNumber, questionTypeFilter, estiloEnemFilter]);

  // PAGINATION: Calcular total de páginas e slice da página atual
  const totalPages = useMemo(() => Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE), [filteredQuestions.length, ITEMS_PER_PAGE]);
  
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredQuestions.slice(startIndex, endIndex);
  }, [filteredQuestions, currentPage, ITEMS_PER_PAGE]);

  // AI LOGS: Buscar resumos de logs para as questões paginadas (visibilidade global)
  const paginatedQuestionIds = useMemo(() => paginatedQuestions.map(q => q.id), [paginatedQuestions]);
  const { data: aiLogsSummaryMap, isLoading: isLoadingAILogs } = useQuestionsWithAILogs(paginatedQuestionIds);

  // Reset página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, difficultyFilter, bancaFilter, macroFilter, anoFilter, searchTerm, macroAreaFilter, microFilter, temaFilter, subtemaFilter, estiloEnemFilter]);

  // Handlers
  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Questão excluída');
      setDeleteConfirm(null);
      loadQuestions();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao excluir questão');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isActive ? 'Questão desativada' : 'Questão ativada');
      loadQuestions();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDuplicate = async (question: Question) => {
    try {
      const { id, created_at, updated_at, options, ...rest } = question;
      // Serializar options para compatibilidade com Supabase
      const optionsJson = (options || []).map(o => ({
        id: o.id,
        text: o.text,
        ...(o.image ? { image: o.image } : {})
      }));
      const { error } = await supabase
        .from('quiz_questions')
        .insert([{ 
          ...rest, 
          options: optionsJson,
          question_text: `[CÓPIA] ${rest.question_text}`,
          is_active: false 
        } as any]);

      if (error) throw error;
      
      toast.success('Questão duplicada');
      loadQuestions();
    } catch (err) {
      console.error('Erro ao duplicar:', err);
      toast.error('Erro ao duplicar questão');
    }
  };

  // ANIQUILAÇÃO TOTAL - Exclui TODAS as questões via RPC com CASCADE
  const handleDeleteAllQuestions = async () => {
    if (!isOwner) {
      toast.error('Apenas o Owner pode executar esta ação');
      return;
    }

    // Validar confirmação por texto
    if (annihilationConfirmText !== 'CONFIRMAR EXCLUSÃO TOTAL') {
      toast.error('Digite exatamente: CONFIRMAR EXCLUSÃO TOTAL');
      return;
    }

    if (!annihilationCheckbox) {
      toast.error('Marque a caixa de confirmação');
      return;
    }

    setIsDeletingAll(true);
    
    try {
      // Chamar função RPC com CASCADE
      const { data, error } = await supabase.rpc('annihilate_all_questions');

      if (error) throw error;

      // Limpar cache
      clearQueryCache();
      
      // Atualizar estado local
      setQuestions([]);
      
      const result = data as { annihilated?: { quiz_questions?: number; question_attempts?: number; quiz_answers?: number } };
      
      toast.success('🔥 ANIQUILAÇÃO TOTAL CONCLUÍDA', {
        description: `Questões: ${result?.annihilated?.quiz_questions || 0} | Attempts: ${result?.annihilated?.question_attempts || 0} | Answers: ${result?.annihilated?.quiz_answers || 0}`,
        duration: 8000,
      });
      
      // Reset do modal
      setDeleteAllConfirm(false);
      setAnnihilationConfirmText('');
      setAnnihilationCheckbox(false);
    } catch (err) {
      console.error('Erro na aniquilação:', err);
      toast.error('Erro na aniquilação: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Resetar campos quando fechar modal
  const handleCloseAnnihilationModal = (open: boolean) => {
    setDeleteAllConfirm(open);
    if (!open) {
      setAnnihilationConfirmText('');
      setAnnihilationCheckbox(false);
    }
  };

  // EXCLUIR APENAS MODO TREINO
  const handleDeleteTreinoQuestions = async () => {
    if (!isOwner) {
      toast.error('Apenas o Owner pode executar esta ação');
      return;
    }

    if (treinoConfirmText !== 'EXCLUIR TREINO') {
      toast.error('Digite exatamente: EXCLUIR TREINO');
      return;
    }

    setIsDeletingTreino(true);
    
    try {
      // ESCALA 45K: Batching via range() para superar default 1000
      const BATCH_SIZE = 1000;
      const MAX = 45000;
      let from = 0;
      let allTreino: any[] = [];

      while (from < MAX) {
        const to = Math.min(from + BATCH_SIZE - 1, MAX - 1);

        const { data: batch, error: fetchError } = await supabase
          .from('quiz_questions')
          .select('id, tags')
          .contains('tags', ['MODO_TREINO'])
          .range(from, to);

        if (fetchError) throw fetchError;

        allTreino = allTreino.concat(batch || []);

        if ((batch || []).length < BATCH_SIZE) break;
        from += BATCH_SIZE;
      }

      const treinoQuestions = allTreino;
      
      if (!treinoQuestions || treinoQuestions.length === 0) {
        toast.info('Nenhuma questão do Modo Treino encontrada');
        setDeleteTreinoConfirm(false);
        setIsDeletingTreino(false);
        return;
      }

      console.log(`[EXCLUIR_TREINO] Encontradas ${treinoQuestions.length} questões com MODO_TREINO no banco`);

      // Questões que têm APENAS MODO_TREINO (ou MODO_TREINO + tags vazias)
      const toDelete = treinoQuestions.filter(q => {
        const otherTags = ((q.tags as string[]) || []).filter(t => t !== 'MODO_TREINO');
        return otherTags.length === 0;
      });

      // Questões que têm MODO_TREINO + outras tags (ex: SIMULADOS)
      const toUpdate = treinoQuestions.filter(q => {
        const otherTags = ((q.tags as string[]) || []).filter(t => t !== 'MODO_TREINO');
        return otherTags.length > 0;
      });

      console.log(`[EXCLUIR_TREINO] Para deletar: ${toDelete.length}, Para atualizar: ${toUpdate.length}`);

      let deletedCount = 0;
      let updatedCount = 0;
      const deletedRequestedIds: string[] = [];
      const updatedRequestedIds: string[] = [];

      // 1. Deletar questões que têm APENAS MODO_TREINO (em batches para evitar URL muito longa)
      if (toDelete.length > 0) {
        const deleteIds = toDelete.map(q => q.id);
        deletedRequestedIds.push(...deleteIds);

        // Batch de 500 IDs por vez para evitar Bad Request (URL muito longa)
        const DELETE_BATCH_SIZE = 500;
        let allDeletedRows: any[] = [];

        for (let i = 0; i < deleteIds.length; i += DELETE_BATCH_SIZE) {
          const batchIds = deleteIds.slice(i, i + DELETE_BATCH_SIZE);
          console.log(`[EXCLUIR_TREINO] Deletando batch ${Math.floor(i / DELETE_BATCH_SIZE) + 1}/${Math.ceil(deleteIds.length / DELETE_BATCH_SIZE)} (${batchIds.length} IDs)`);

          const { data: deletedRows, error } = await supabase
            .from('quiz_questions')
            .delete()
            .in('id', batchIds)
            .select('id');

          if (error) {
            console.error('[EXCLUIR_TREINO] Erro ao deletar batch:', error);
            throw error;
          }

          allDeletedRows = allDeletedRows.concat(deletedRows || []);
        }

        deletedCount = allDeletedRows.length;

        if (deletedCount === 0 && deleteIds.length > 0) {
          throw new Error('Nenhuma questão foi excluída (provável bloqueio de permissão).');
        }

        if (deletedCount !== deleteIds.length) {
          console.warn(`[EXCLUIR_TREINO] Deleção parcial: solicitado=${deleteIds.length}, efetivado=${deletedCount}`);
        }

        console.log(`[EXCLUIR_TREINO] ${deletedCount} questões deletadas com sucesso`);
      }

      // 2. Atualizar questões removendo apenas a tag MODO_TREINO
      if (toUpdate.length > 0) {
        for (const q of toUpdate) {
          updatedRequestedIds.push(q.id);
          const newTags = ((q.tags as string[]) || []).filter(t => t !== 'MODO_TREINO');

          const { data: updatedRows, error } = await supabase
            .from('quiz_questions')
            .update({ tags: newTags, updated_at: new Date().toISOString() })
            .eq('id', q.id)
            .select('id');

          if (error) {
            console.error(`[EXCLUIR_TREINO] Erro ao atualizar ${q.id}:`, error);
            throw error;
          }

          if (!updatedRows || updatedRows.length === 0) {
            throw new Error(`Questão ${q.id} não foi atualizada (provável bloqueio de permissão).`);
          }

          updatedCount++;
        }
        console.log(`[EXCLUIR_TREINO] ${updatedCount} questões atualizadas com sucesso`);
      }

      // 3. Validação pós-ação (sem isso, é PROIBIDO mostrar sucesso)
      // - Deletadas: não podem mais existir
      // - Atualizadas: não podem mais conter MODO_TREINO
      if (deletedRequestedIds.length > 0) {
        const { data: stillExists, error } = await supabase
          .from('quiz_questions')
          .select('id')
          .in('id', deletedRequestedIds);

        if (error) throw error;
        if (stillExists && stillExists.length > 0) {
          throw new Error(`Validação falhou: ${stillExists.length} questões que deveriam ser ANIQUILADAS ainda existem.`);
        }
      }

      if (updatedRequestedIds.length > 0) {
        const { data: updatedNow, error } = await supabase
          .from('quiz_questions')
          .select('id, tags')
          .in('id', updatedRequestedIds);

        if (error) throw error;

        const stillHasTreino = (updatedNow || []).filter(r => (r.tags as string[] | null)?.includes('MODO_TREINO'));
        if (stillHasTreino.length > 0) {
          throw new Error(`Validação falhou: ${stillHasTreino.length} questões ainda estão marcadas como MODO_TREINO.`);
        }
      }

      // Limpar cache e recarregar
      clearQueryCache();
      await loadQuestions();
      
      toast.success(`💪 Modo Treino processado!`, {
        description: `${deletedCount} excluídas | ${updatedCount} atualizadas (mantiveram SIMULADOS)`,
        duration: 5000,
      });
      
      // Reset do modal
      setDeleteTreinoConfirm(false);
      setTreinoConfirmText('');
    } catch (err) {
      console.error('Erro ao processar modo treino:', err);
      toast.error('Erro: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeletingTreino(false);
    }
  };

  // Resetar campos quando fechar modal de Treino
  const handleCloseTreinoModal = (open: boolean) => {
    setDeleteTreinoConfirm(open);
    if (!open) {
      setTreinoConfirmText('');
    }
  };

  // Resetar campos quando fechar modal de Sem Grupo
  const handleCloseSemGrupoModal = (open: boolean) => {
    setDeleteSemGrupoConfirm(open);
    if (!open) {
      setSemGrupoConfirmText('');
    }
  };

  // Handler para excluir questões SEM GRUPO (não têm SIMULADOS nem MODO_TREINO)
  const handleDeleteSemGrupoQuestions = async () => {
    setIsDeletingSemGrupo(true);
    
    try {
      console.log('[EXCLUIR_SEM_GRUPO] Iniciando busca de questões sem grupo no banco...');
      
      // Buscar TODAS as questões do banco e filtrar sem grupo
      const { data: allQuestions, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('id, tags');
        
      if (fetchError) {
        console.error('[EXCLUIR_SEM_GRUPO] Erro ao buscar:', fetchError);
        throw fetchError;
      }

      // Filtrar questões SEM GRUPO (não têm SIMULADOS nem MODO_TREINO)
      const semGrupoQuestions = (allQuestions || []).filter(q => {
        const tags = (q.tags as string[]) || [];
        return !tags.includes('SIMULADOS') && !tags.includes('MODO_TREINO');
      });

      if (semGrupoQuestions.length === 0) {
        toast.info('Nenhuma questão sem grupo encontrada');
        setDeleteSemGrupoConfirm(false);
        setIsDeletingSemGrupo(false);
        return;
      }

      console.log(`[EXCLUIR_SEM_GRUPO] Encontradas ${semGrupoQuestions.length} questões sem grupo no banco`);

      const deleteIds = semGrupoQuestions.map(q => q.id);

      // Batch de 500 IDs por vez para evitar Bad Request (URL muito longa)
      const DELETE_BATCH_SIZE = 500;
      let totalDeletedCount = 0;

      for (let i = 0; i < deleteIds.length; i += DELETE_BATCH_SIZE) {
        const batchIds = deleteIds.slice(i, i + DELETE_BATCH_SIZE);
        console.log(`[EXCLUIR_SEM_GRUPO] Deletando batch ${Math.floor(i / DELETE_BATCH_SIZE) + 1}/${Math.ceil(deleteIds.length / DELETE_BATCH_SIZE)} (${batchIds.length} IDs)`);

        const { data: deletedRows, error } = await supabase
          .from('quiz_questions')
          .delete()
          .in('id', batchIds)
          .select('id');

        if (error) {
          console.error('[EXCLUIR_SEM_GRUPO] Erro ao deletar batch:', error);
          throw error;
        }

        totalDeletedCount += (deletedRows || []).length;
      }

      if (totalDeletedCount === 0 && deleteIds.length > 0) {
        throw new Error('Nenhuma questão foi excluída (provável bloqueio de permissão).');
      }

      console.log(`[EXCLUIR_SEM_GRUPO] ${totalDeletedCount} questões deletadas com sucesso`);

      // Validação pós-ação
      const { data: stillExists, error: valError } = await supabase
        .from('quiz_questions')
        .select('id')
        .in('id', deleteIds.slice(0, 100)); // Sample check

      if (valError) throw valError;
      
      // Se alguma ainda existe do sample, alertar
      if (stillExists && stillExists.length > 0) {
        console.warn(`[EXCLUIR_SEM_GRUPO] Algumas questões ainda existem: ${stillExists.length}`);
      }

      // Limpar cache e recarregar
      clearQueryCache();
      await loadQuestions();
      
      toast.success(`🗑️ Questões sem grupo excluídas!`, {
        description: `${totalDeletedCount} questões removidas`,
        duration: 5000,
      });
      
      // Reset do modal
      setDeleteSemGrupoConfirm(false);
      setSemGrupoConfirmText('');
    } catch (err) {
      console.error('Erro ao excluir questões sem grupo:', err);
      toast.error('Erro: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeletingSemGrupo(false);
    }
  };

  // Resetar campos quando fechar modal de Simulados
  const handleCloseSimuladosModal = (open: boolean) => {
    setDeleteSimuladosConfirm(open);
    if (!open) {
      setSimuladosConfirmText('');
    }
  };

  // Handler para excluir questões SIMULADOS
  const handleDeleteSimuladosQuestions = async () => {
    if (!isOwner) {
      toast.error('Apenas o Owner pode executar esta ação');
      return;
    }

    if (simuladosConfirmText !== 'EXCLUIR SIMULADOS') {
      toast.error('Digite exatamente: EXCLUIR SIMULADOS');
      return;
    }

    setIsDeletingSimulados(true);
    
    try {
      // ESCALA 45K: Batching via range() para superar default 1000
      const BATCH_SIZE = 1000;
      const MAX = 45000;
      let from = 0;
      let allSimulados: any[] = [];

      while (from < MAX) {
        const to = Math.min(from + BATCH_SIZE - 1, MAX - 1);

        const { data: batch, error: fetchError } = await supabase
          .from('quiz_questions')
          .select('id, tags')
          .contains('tags', ['SIMULADOS'])
          .range(from, to);

        if (fetchError) throw fetchError;

        allSimulados = allSimulados.concat(batch || []);

        if ((batch || []).length < BATCH_SIZE) break;
        from += BATCH_SIZE;
      }

      const simuladosQuestions = allSimulados;
      
      if (!simuladosQuestions || simuladosQuestions.length === 0) {
        toast.info('Nenhuma questão de Simulados encontrada');
        setDeleteSimuladosConfirm(false);
        setIsDeletingSimulados(false);
        return;
      }

      console.log(`[EXCLUIR_SIMULADOS] Encontradas ${simuladosQuestions.length} questões com SIMULADOS no banco`);

      // Questões que têm APENAS SIMULADOS (ou SIMULADOS + tags vazias)
      const toDelete = simuladosQuestions.filter(q => {
        const otherTags = ((q.tags as string[]) || []).filter(t => t !== 'SIMULADOS');
        return otherTags.length === 0;
      });

      // Questões que têm SIMULADOS + outras tags (ex: MODO_TREINO)
      const toUpdate = simuladosQuestions.filter(q => {
        const otherTags = ((q.tags as string[]) || []).filter(t => t !== 'SIMULADOS');
        return otherTags.length > 0;
      });

      console.log(`[EXCLUIR_SIMULADOS] Para deletar: ${toDelete.length}, Para atualizar: ${toUpdate.length}`);

      let deletedCount = 0;
      let updatedCount = 0;
      const deletedRequestedIds: string[] = [];
      const updatedRequestedIds: string[] = [];

      // 1. Deletar questões que têm APENAS SIMULADOS (em batches para evitar URL muito longa)
      if (toDelete.length > 0) {
        const deleteIds = toDelete.map(q => q.id);
        deletedRequestedIds.push(...deleteIds);

        // Batch de 500 IDs por vez para evitar Bad Request (URL muito longa)
        const DELETE_BATCH_SIZE = 500;
        let allDeletedRows: any[] = [];

        for (let i = 0; i < deleteIds.length; i += DELETE_BATCH_SIZE) {
          const batchIds = deleteIds.slice(i, i + DELETE_BATCH_SIZE);
          console.log(`[EXCLUIR_SIMULADOS] Deletando batch ${Math.floor(i / DELETE_BATCH_SIZE) + 1}/${Math.ceil(deleteIds.length / DELETE_BATCH_SIZE)} (${batchIds.length} IDs)`);

          const { data: deletedRows, error } = await supabase
            .from('quiz_questions')
            .delete()
            .in('id', batchIds)
            .select('id');

          if (error) {
            console.error('[EXCLUIR_SIMULADOS] Erro ao deletar batch:', error);
            throw error;
          }

          allDeletedRows = allDeletedRows.concat(deletedRows || []);
        }

        deletedCount = allDeletedRows.length;

        if (deletedCount === 0 && deleteIds.length > 0) {
          throw new Error('Nenhuma questão foi excluída (provável bloqueio de permissão).');
        }

        if (deletedCount !== deleteIds.length) {
          console.warn(`[EXCLUIR_SIMULADOS] Deleção parcial: solicitado=${deleteIds.length}, efetivado=${deletedCount}`);
        }

        console.log(`[EXCLUIR_SIMULADOS] ${deletedCount} questões deletadas com sucesso`);
      }

      // 2. Atualizar questões removendo apenas a tag SIMULADOS
      if (toUpdate.length > 0) {
        for (const q of toUpdate) {
          updatedRequestedIds.push(q.id);
          const newTags = ((q.tags as string[]) || []).filter(t => t !== 'SIMULADOS');

          const { data: updatedRows, error } = await supabase
            .from('quiz_questions')
            .update({ tags: newTags, updated_at: new Date().toISOString() })
            .eq('id', q.id)
            .select('id');

          if (error) {
            console.error(`[EXCLUIR_SIMULADOS] Erro ao atualizar ${q.id}:`, error);
            throw error;
          }

          if (!updatedRows || updatedRows.length === 0) {
            throw new Error(`Questão ${q.id} não foi atualizada (provável bloqueio de permissão).`);
          }

          updatedCount++;
        }
        console.log(`[EXCLUIR_SIMULADOS] ${updatedCount} questões atualizadas com sucesso`);
      }

      // 3. Validação pós-ação
      if (deletedRequestedIds.length > 0) {
        const { data: stillExists, error } = await supabase
          .from('quiz_questions')
          .select('id')
          .in('id', deletedRequestedIds);

        if (error) throw error;
        if (stillExists && stillExists.length > 0) {
          throw new Error(`Validação falhou: ${stillExists.length} questões que deveriam ser ANIQUILADAS ainda existem.`);
        }
      }

      if (updatedRequestedIds.length > 0) {
        const { data: updatedNow, error } = await supabase
          .from('quiz_questions')
          .select('id, tags')
          .in('id', updatedRequestedIds);

        if (error) throw error;

        const stillHasSimulados = (updatedNow || []).filter(r => (r.tags as string[] | null)?.includes('SIMULADOS'));
        if (stillHasSimulados.length > 0) {
          throw new Error(`Validação falhou: ${stillHasSimulados.length} questões ainda estão marcadas como SIMULADOS.`);
        }
      }

      // Limpar cache e recarregar
      clearQueryCache();
      await loadQuestions();
      
      toast.success(`🎯 Simulados processados!`, {
        description: `${deletedCount} excluídas | ${updatedCount} atualizadas (mantiveram MODO_TREINO)`,
        duration: 5000,
      });
      
      // Reset do modal
      setDeleteSimuladosConfirm(false);
      setSimuladosConfirmText('');
    } catch (err) {
      console.error('Erro ao processar simulados:', err);
      toast.error('Erro: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeletingSimulados(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Banco de Questões
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas questões de Química
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÃO AI LOG GLOBAL - Visibilidade de todas as intervenções de IA */}
          <GlobalAILogButton />
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              // Limpar TODOS os filtros
              setActiveTab('todas');
              setMacroAreaFilter('all');
              setMacroFilter('all');
              setMicroFilter('all');
              setTemaFilter('all');
              setSubtemaFilter('all');
              setDifficultyFilter('all');
              setBancaFilter('all');
              setAnoFilter('all');
              setQuestionTypeFilter('all');
              setEstiloEnemFilter(false);
              setSearchTerm('');
              setSortOrder('newest');
              // Recarregar dados
              loadQuestions();
            }}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {isOwner && (
            <Button 
              variant="outline"
              onClick={() => setTaxonomyManagerOpen(true)}
              className="gap-2"
            >
              <FolderTree className="h-4 w-4" />
              Gerenciar Taxonomia
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => setImportHistoryOpen(true)}
            className="gap-2 border-purple-500/50 text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
          >
            <Clock className="h-4 w-4" />
            Histórico
          </Button>
          <Button 
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-500"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          {/* ═══════════════════════════════════════════════════════════════
              🔴 MENU DROPDOWN DE EXCLUSÃO (OWNER ONLY)
              ═══════════════════════════════════════════════════════════════ */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Exclusão
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={() => setDeleteSemGrupoConfirm(true)}
                  disabled={stats.semGrupo === 0}
                  className="gap-2 text-gray-400 focus:text-gray-300 focus:bg-gray-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Sem Grupo ({stats.semGrupo})
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteTreinoConfirm(true)}
                  disabled={stats.modoTreino === 0}
                  className="gap-2 text-orange-500 focus:text-orange-400 focus:bg-orange-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Treino ({stats.modoTreino})
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteSimuladosConfirm(true)}
                  disabled={stats.simulados === 0}
                  className="gap-2 text-blue-500 focus:text-blue-400 focus:bg-blue-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Simulados ({stats.simulados})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteAllConfirm(true)}
                  disabled={questions.length === 0}
                  className="gap-2 text-red-500 focus:text-red-400 focus:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Todas ({questions.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button 
            onClick={() => {
              setSelectedQuestion(null);
              setQuestionDialog(true);
            }}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Questão
          </Button>
        </div>

        {/* Import Dialog */}
        <QuestionImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={handleImportSuccess}
        />

        {/* Import History Dialog */}
        <QuestionImportHistory
          open={importHistoryOpen}
          onClose={() => setImportHistoryOpen(false)}
        />
      </motion.div>

      {/* Taxonomy Manager - OWNER ONLY */}
      {isOwner && (
        <TaxonomyManager
          open={taxonomyManagerOpen}
          onClose={() => setTaxonomyManagerOpen(false)}
        />
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FileQuestion className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400/10 to-lime-500/10 border-green-400/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-400/20">
              <Target className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byDifficulty.facil}</p>
              <p className="text-xs text-muted-foreground">Fáceis</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byDifficulty.medio}</p>
              <p className="text-xs text-muted-foreground">Médias</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byDifficulty.dificil}</p>
              <p className="text-xs text-muted-foreground">Difíceis</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards de Controle por Grande Área */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Química Orgânica */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.02] border-2",
            macroAreaFilter === 'organica' 
              ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500" 
              : "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/50"
          )}
          onClick={() => handleMacroAreaFilterChange('organica')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <FolderTree className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-300">Química Orgânica</p>
                  <p className="text-xs text-muted-foreground">Funções, Isomeria, Reações, Polímeros</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-400">{macroAreaStats.organica}</p>
                <p className="text-xs text-muted-foreground">questões</p>
              </div>
            </div>
            {macroAreaFilter === 'organica' && (
              <Badge className="mt-2 bg-purple-500/30 text-purple-300">Filtrando</Badge>
            )}
          </CardContent>
        </Card>

        {/* Físico-Química */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.02] border-2",
            macroAreaFilter === 'fisico_quimica' 
              ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500" 
              : "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 hover:border-cyan-500/50"
          )}
          onClick={() => handleMacroAreaFilterChange('fisico_quimica')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/20">
                  <BarChart3 className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-cyan-300">Físico-Química</p>
                  <p className="text-xs text-muted-foreground">Termoquímica, Cinética, Equilíbrio, Eletroquímica</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-cyan-400">{macroAreaStats.fisico_quimica}</p>
                <p className="text-xs text-muted-foreground">questões</p>
              </div>
            </div>
            {macroAreaFilter === 'fisico_quimica' && (
              <Badge className="mt-2 bg-cyan-500/30 text-cyan-300">Filtrando</Badge>
            )}
          </CardContent>
        </Card>

        {/* Química Geral */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.02] border-2",
            macroAreaFilter === 'geral' 
              ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500" 
              : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/50"
          )}
          onClick={() => handleMacroAreaFilterChange('geral')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Brain className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-300">Química Geral</p>
                  <p className="text-xs text-muted-foreground">Atomística, Tabela Periódica, Ligações, Estequiometria</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-400">{macroAreaStats.geral}</p>
                <p className="text-xs text-muted-foreground">questões</p>
              </div>
            </div>
            {macroAreaFilter === 'geral' && (
              <Badge className="mt-2 bg-amber-500/30 text-amber-300">Filtrando</Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards de Micro Assuntos (Top 8) */}
      <AnimatePresence>
        {topMicroAssuntos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: 0.18 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">
                      Micro Assuntos {macroAreaFilter !== 'all' && (
                        <span className="text-muted-foreground font-normal">
                          ({macroAreaFilter === 'organica' ? 'Química Orgânica' : macroAreaFilter === 'fisico_quimica' ? 'Físico-Química' : 'Química Geral'})
                        </span>
                      )}
                    </CardTitle>
                  </div>
                  {microFilter !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMicroFilter('all')}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar micro
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {topMicroAssuntos.map(({ micro, count }) => (
                    <Badge
                      key={micro}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all hover:scale-105 px-3 py-1.5",
                        microFilter === micro
                          ? "bg-primary/20 text-primary border-primary"
                          : "hover:bg-muted hover:border-primary/50"
                      )}
                      onClick={() => setMicroFilter(microFilter === micro ? 'all' : micro)}
                    >
                      <span className="text-xs font-medium mr-2">
                        {micro.length > 35 ? micro.substring(0, 35) + '...' : micro}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        microFilter === micro
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20"
                      )}>
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros Avançados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Linha 1: Tabs + Busca */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="todas">Todas ({stats.total})</TabsTrigger>
                  <TabsTrigger value="ativas">Ativas ({stats.active})</TabsTrigger>
                  <TabsTrigger value="inativas">Inativas ({stats.total - stats.active})</TabsTrigger>
                  <TabsTrigger value="simulados" className="text-primary">Simulados ({stats.simulados})</TabsTrigger>
                  <TabsTrigger value="modo_treino" className="text-purple-500">Modo Treino ({stats.modoTreino})</TabsTrigger>
                  <TabsTrigger value="repetidas" className="text-red-500">Repetidas ({duplicateQuestionIds.size})</TabsTrigger>
                  <TabsTrigger value="nao_associada" className="text-orange-500 font-bold animate-pulse">⚠️ Não Associada ({stats.naoAssociada})</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Busca */}
              <div className="relative flex-1 md:flex-none md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por enunciado, banca, tema..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Linha 2: Filtros hierárquicos MACRO → MICRO → TEMA + outros */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* 1. Macro - SINCRONIZADO com os cards do topo */}
              <Select 
                value={macroAreaFilter} 
                onValueChange={(value) => {
                  // Set direto com cascata (reseta micro e tema)
                  const newArea = value as 'all' | 'organica' | 'fisico_quimica' | 'geral';
                  setMacroAreaFilter(newArea);
                  const areaToMacro: Record<string, string> = {
                    'organica': 'quimica_organica',
                    'fisico_quimica': 'fisico_quimica',
                    'geral': 'quimica_geral',
                    'all': 'all'
                  };
                  setMacroFilter(areaToMacro[value] || 'all');
                  // CASCATA: reset filhos
                  setMicroFilter('all');
                  setTemaFilter('all');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Macro" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Macro: Todos</SelectItem>
                  <SelectItem value="bioquimica">Bioquímica</SelectItem>
                  <SelectItem value="fisico_quimica">Físico-Química</SelectItem>
                  <SelectItem value="geral">Química Geral</SelectItem>
                  <SelectItem value="ambiental">Química Ambiental</SelectItem>
                  <SelectItem value="organica">Química Orgânica</SelectItem>
                </SelectContent>
              </Select>

              {/* 2. Micro Assunto */}
              <Select 
                value={microFilter} 
                onValueChange={handleMicroFilterChange}
                disabled={uniqueMicros.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Micro" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Micro: Todos</SelectItem>
                  {uniqueMicros.map(micro => (
                    <SelectItem key={micro} value={micro}>
                      {micro.length > 30 ? micro.substring(0, 30) + '...' : micro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 3. Tema (MACRO → MICRO → TEMA) */}
              <Select 
                value={temaFilter} 
                onValueChange={handleTemaFilterChange}
                disabled={uniqueTemas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tema" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Tema: Todos</SelectItem>
                  {uniqueTemas.map(tema => (
                    <SelectItem key={tema} value={tema}>
                      {tema.length > 35 ? tema.substring(0, 35) + '...' : tema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 4. Subtema (MACRO → MICRO → TEMA → SUBTEMA) */}
              <Select 
                value={subtemaFilter} 
                onValueChange={setSubtemaFilter}
                disabled={uniqueSubtemas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subtema" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Subtema: Todos</SelectItem>
                  {uniqueSubtemas.map(subtema => (
                    <SelectItem key={subtema} value={subtema}>
                      {subtema.length > 30 ? subtema.substring(0, 30) + '...' : subtema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 4. Ano */}
              <Select value={anoFilter} onValueChange={setAnoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ano: Todos</SelectItem>
                  {uniqueAnos.map(ano => (
                    <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 4. Banca */}
              <Select value={bancaFilter} onValueChange={setBancaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Banca" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Banca: Todas</SelectItem>
                  {Object.entries(BANCAS_POR_CATEGORIA).map(([categoria, bancas]) => (
                    <div key={categoria}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS]}
                      </div>
                      {bancas.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {/* 5. Dificuldade */}
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Dificuldade: Todas</SelectItem>
                  <SelectItem value="facil">🟢 Fácil</SelectItem>
                  <SelectItem value="medio">🟡 Médio</SelectItem>
                  <SelectItem value="dificil">🔴 Difícil</SelectItem>
                </SelectContent>
              </Select>

              {/* 6. Ordenação (Mais recentes) */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">📅 Mais recentes</SelectItem>
                  <SelectItem value="oldest">📅 Mais antigas</SelectItem>
                  <SelectItem value="ano_desc">🗓️ Ano ↓</SelectItem>
                  <SelectItem value="ano_asc">🗓️ Ano ↑</SelectItem>
                  <SelectItem value="difficulty_asc">📊 Fácil → Difícil</SelectItem>
                  <SelectItem value="difficulty_desc">📊 Difícil → Fácil</SelectItem>
                  <SelectItem value="alphabetical">🔤 Alfabética</SelectItem>
                </SelectContent>
              </Select>

              {/* 7. Estilo da Questão */}
              <Select value={questionTypeFilter} onValueChange={(v) => setQuestionTypeFilter(v as 'all' | 'multiple_choice' | 'discursive' | 'outros')}>
                <SelectTrigger>
                  <SelectValue placeholder="Estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Estilo: Todos</SelectItem>
                  <SelectItem value="multiple_choice">✅ Múltipla Escolha (A,B,C,D,E)</SelectItem>
                  <SelectItem value="discursive">✍️ Discursiva</SelectItem>
                  <SelectItem value="outros">🔢 Outros (V/F, Soma)</SelectItem>
                </SelectContent>
              </Select>

              {/* 8. ESTILO ENEM - Toggle Filter (Enterprise) */}
              <Button
                variant={estiloEnemFilter ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[ESTILO ENEM] Clicado! Estado atual:', estiloEnemFilter, '→ Novo:', !estiloEnemFilter);
                  setEstiloEnemFilter(prev => !prev);
                }}
                className={cn(
                  "h-10 gap-2 font-semibold transition-all cursor-pointer",
                  estiloEnemFilter 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/30" 
                    : "border-blue-500/50 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500"
                )}
              >
                <Sparkles className={cn("h-4 w-4", estiloEnemFilter && "animate-pulse")} />
                ESTILO ENEM
                <Badge className={cn(
                  "ml-1 border-0 text-[10px] px-1.5 font-bold",
                  estiloEnemFilter 
                    ? "bg-white/20 text-white" 
                    : "bg-blue-500/20 text-blue-400"
                )}>
                  {stats.estiloEnem}
                </Badge>
              </Button>

              {/* Botão Limpar Filtros */}
              {(difficultyFilter !== 'all' || bancaFilter !== 'all' || macroFilter !== 'all' || anoFilter !== 'all' || macroAreaFilter !== 'all' || microFilter !== 'all' || temaFilter !== 'all' || subtemaFilter !== 'all' || questionTypeFilter !== 'all' || estiloEnemFilter || searchTerm.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDifficultyFilter('all');
                    setBancaFilter('all');
                    setMacroFilter('all');
                    setAnoFilter('all');
                    setMacroAreaFilter('all');
                    setMicroFilter('all');
                    setTemaFilter('all');
                    setSubtemaFilter('all');
                    setQuestionTypeFilter('all');
                    setEstiloEnemFilter(false);
                    setSearchTerm('');
                    setSortOrder('newest');
                  }}
                  className="h-10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Indicador de filtros ativos */}
            {(difficultyFilter !== 'all' || bancaFilter !== 'all' || macroFilter !== 'all' || anoFilter !== 'all' || microFilter !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>
                  Exibindo <strong className="text-foreground">{filteredQuestions.length}</strong> de {questions.length} questões
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabela de Questões */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Nenhuma questão encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || difficultyFilter !== 'all' || bancaFilter !== 'all' || macroFilter !== 'all' || anoFilter !== 'all'
                    ? 'Tente ajustar os filtros'
                    : 'Clique em "Nova Questão" para começar'}
                </p>
                <Button onClick={() => {
                  setSelectedQuestion(null);
                  setQuestionDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Questão
                </Button>
              </div>
            ) : (
              <>
                {/* 🚀 LISTA VIRTUALIZADA - Performance para 45k+ questões */}
                <VirtualizedQuestionList
                  questions={paginatedQuestions}
                  startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
                  aiLogsSummaryMap={aiLogsSummaryMap}
                  isLoadingAILogs={isLoadingAILogs}
                  duplicateQuestionIds={duplicateQuestionIds}
                  getGroupNumber={getGroupNumber}
                  getGroupMembers={getGroupMembers}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onToggleActive={handleToggleActive}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              
                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Exibindo {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)} de {filteredQuestions.length} questões
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm font-medium px-3 py-1 bg-muted rounded">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de Questão */}
      <QuestionDialog
        open={questionDialog}
        onClose={() => {
          setQuestionDialog(false);
          setSelectedQuestion(null);
        }}
        onSuccess={loadQuestions}
        question={selectedQuestion}
      />

      {/* Dialog de Confirmação de Exclusão Individual */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A questão será permanentemente excluída do banco de dados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Questão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de ANIQUILAÇÃO TOTAL */}
      <Dialog open={deleteAllConfirm} onOpenChange={handleCloseAnnihilationModal}>
        <DialogContent className="border-red-500/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500 text-xl">
              <AlertCircle className="h-6 w-6" />
              🔥 ANIQUILAÇÃO TOTAL
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg">
                <p className="text-red-400 font-bold text-lg mb-2">
                  ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
                </p>
                <p className="text-foreground">
                  Você está prestes a excluir permanentemente <strong className="text-red-400">{questions.length} questões</strong>.
                </p>
              </div>
              
              <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Todas as questões serão removidas do sistema
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Todas as tentativas de resposta (question_attempts) serão excluídas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Todas as respostas de quiz (quiz_answers) serão excluídas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Estatísticas de desempenho serão invalidadas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  Esta ação NÃO pode ser revertida
                </li>
              </ul>

              {/* Confirmação por digitação */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Digite <code className="bg-red-500/20 px-2 py-1 rounded text-red-400">CONFIRMAR EXCLUSÃO TOTAL</code> para continuar:
                </label>
                <Input 
                  value={annihilationConfirmText}
                  onChange={(e) => setAnnihilationConfirmText(e.target.value)}
                  placeholder="CONFIRMAR EXCLUSÃO TOTAL"
                  className="border-red-500/50 focus:border-red-500"
                  disabled={isDeletingAll}
                />
              </div>

              {/* Checkbox de confirmação */}
              <div className="flex items-start gap-3 bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                <input 
                  type="checkbox" 
                  id="annihilation-confirm"
                  checked={annihilationCheckbox}
                  onChange={(e) => setAnnihilationCheckbox(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-red-500"
                  disabled={isDeletingAll}
                />
                <label htmlFor="annihilation-confirm" className="text-sm text-foreground">
                  Eu entendo que esta ação excluirá <strong>PERMANENTEMENTE</strong> todas as questões e dados relacionados, 
                  e que esta operação <strong>NÃO PODE SER DESFEITA</strong>.
                </label>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleCloseAnnihilationModal(false)} 
              disabled={isDeletingAll}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllQuestions}
              disabled={isDeletingAll || annihilationConfirmText !== 'CONFIRMAR EXCLUSÃO TOTAL' || !annihilationCheckbox}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ANIQUILANDO...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  CONFIRMAR EXCLUSÃO TOTAL
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de EXCLUSÃO MODO TREINO */}
      <Dialog open={deleteTreinoConfirm} onOpenChange={handleCloseTreinoModal}>
        <DialogContent className="border-purple-500/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-500 text-xl">
              <Trash2 className="h-6 w-6" />
              💪 Excluir Modo Treino
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="bg-purple-500/20 border border-purple-500/50 p-4 rounded-lg">
                <p className="text-purple-400 font-bold text-lg mb-2">
                  ⚠️ Esta ação remove apenas questões de TREINO
                </p>
                <p className="text-foreground">
                  Você está prestes a excluir <strong className="text-purple-400">{stats.modoTreino} questões</strong> do Modo Treino.
                </p>
              </div>
              
              <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✗</span>
                  Questões com tag MODO_TREINO serão removidas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Questões de SIMULADOS permanecerão intactas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Questões sem grupo também permanecerão
                </li>
              </ul>

              {/* Confirmação por digitação */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Digite <code className="bg-purple-500/20 px-2 py-1 rounded text-purple-400">EXCLUIR TREINO</code> para continuar:
                </label>
                <Input 
                  value={treinoConfirmText}
                  onChange={(e) => setTreinoConfirmText(e.target.value)}
                  placeholder="EXCLUIR TREINO"
                  className="border-purple-500/50 focus-visible:ring-purple-500"
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleCloseTreinoModal(false)} 
              disabled={isDeletingTreino}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteTreinoQuestions}
              disabled={isDeletingTreino || treinoConfirmText !== 'EXCLUIR TREINO'}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isDeletingTreino ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Modo Treino
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de EXCLUSÃO SEM GRUPO */}
      <Dialog open={deleteSemGrupoConfirm} onOpenChange={handleCloseSemGrupoModal}>
        <DialogContent className="border-gray-500/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-400 text-xl">
              <Trash2 className="h-6 w-6" />
              🗑️ Excluir Sem Grupo
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="bg-gray-500/20 border border-gray-500/50 p-4 rounded-lg">
                <p className="text-gray-400 font-bold text-lg mb-2">
                  ⚠️ Esta ação remove questões SEM grupo definido
                </p>
                <p className="text-foreground">
                  Você está prestes a excluir <strong className="text-gray-400">{stats.semGrupo} questões</strong> que não possuem SIMULADOS nem MODO_TREINO.
                </p>
              </div>
              
              <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
                <li className="flex items-center gap-2">
                  <span className="text-gray-500">✗</span>
                  Questões SEM tags SIMULADOS e MODO_TREINO serão removidas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Questões de SIMULADOS permanecerão intactas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Questões de MODO_TREINO permanecerão intactas
                </li>
              </ul>

              {/* Confirmação por digitação */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Digite <code className="bg-gray-500/20 px-2 py-1 rounded text-gray-400">EXCLUIR SEM GRUPO</code> para continuar:
                </label>
                <Input 
                  value={semGrupoConfirmText}
                  onChange={(e) => setSemGrupoConfirmText(e.target.value)}
                  placeholder="EXCLUIR SEM GRUPO"
                  className="border-gray-500/50 focus-visible:ring-gray-500"
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleCloseSemGrupoModal(false)} 
              disabled={isDeletingSemGrupo}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteSemGrupoQuestions}
              disabled={isDeletingSemGrupo || semGrupoConfirmText !== 'EXCLUIR SEM GRUPO'}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              {isDeletingSemGrupo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Sem Grupo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de EXCLUSÃO SIMULADOS */}
      <Dialog open={deleteSimuladosConfirm} onOpenChange={handleCloseSimuladosModal}>
        <DialogContent className="border-blue-500/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-500 text-xl">
              <Trash2 className="h-6 w-6" />
              🎯 Excluir Simulados
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-lg">
                <p className="text-blue-400 font-bold text-lg mb-2">
                  ⚠️ Esta ação remove apenas questões de SIMULADOS
                </p>
                <p className="text-foreground">
                  Você está prestes a excluir <strong className="text-blue-400">{stats.simulados} questões</strong> de Simulados.
                </p>
              </div>
              
              <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✗</span>
                  Questões com tag SIMULADOS serão removidas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Questões de MODO_TREINO permanecerão intactas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Questões sem grupo também permanecerão
                </li>
              </ul>

              {/* Confirmação por digitação */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Digite <code className="bg-blue-500/20 px-2 py-1 rounded text-blue-400">EXCLUIR SIMULADOS</code> para continuar:
                </label>
                <Input 
                  value={simuladosConfirmText}
                  onChange={(e) => setSimuladosConfirmText(e.target.value)}
                  placeholder="EXCLUIR SIMULADOS"
                  className="border-blue-500/50 focus-visible:ring-blue-500"
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleCloseSimuladosModal(false)} 
              disabled={isDeletingSimulados}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteSimuladosQuestions}
              disabled={isDeletingSimulados || simuladosConfirmText !== 'EXCLUIR SIMULADOS'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isDeletingSimulados ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Simulados
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Error Boundary para capturar erros de renderização
class GestaoQuestoesErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GestaoQuestoes] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-6 space-y-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-500 mb-2">Erro ao carregar a página</h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro ao renderizar o Banco de Questões.
            </p>
            <pre className="bg-background/50 p-3 rounded text-sm overflow-auto max-h-48 text-red-400">
              {this.state.error?.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper com Error Boundary
function GestaoQuestoesWithErrorBoundary() {
  return (
    <GestaoQuestoesErrorBoundary>
      <GestaoQuestoes />
    </GestaoQuestoesErrorBoundary>
  );
}

export default memo(GestaoQuestoesWithErrorBoundary);
