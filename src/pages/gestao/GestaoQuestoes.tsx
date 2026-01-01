// ============================================
// 📝 GESTÃO DE QUESTÕES - Área Administrativa
// Gerenciamento completo do banco de questões
// Visual Futurístico Ano 2300 - Enterprise Card Layout
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionEnunciado from '@/components/shared/QuestionEnunciado';
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
  Image as ImageIcon
} from 'lucide-react';
import { 
  QuestionImageUploader, 
  SingleImageUploader,
  type QuestionImage 
} from '@/components/gestao/questoes/QuestionImageUploader';
import { QuestionImportDialog } from '@/components/gestao/questoes/QuestionImportDialog';
import { Button } from '@/components/ui/button';
import { TaxonomyManager } from '@/components/gestao/questoes/TaxonomyManager';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, getBancaLabel } from '@/constants/bancas';
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
    ano: new Date().getFullYear(),
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
        ano: question.ano || new Date().getFullYear(),
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
        // Imagens do enunciado
        images: ((question as any).images || []) as QuestionImage[],
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
        ano: new Date().getFullYear(),
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
        // Imagens do enunciado
        images: form.images.map(img => ({
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
                onChange={(e) => setForm(f => ({ ...f, ano: parseInt(e.target.value) || 2024 }))}
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
  const [macroAreaFilter, setMacroAreaFilter] = useState<'all' | 'organica' | 'fisico_quimica' | 'geral'>('all');
  const [microFilter, setMicroFilter] = useState<string>('all');
  
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

  const { clearQueryCache } = useCacheManager();
  const { isOwner } = useRolePermissions();

  // Carregar questões
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear para o tipo Question com fallbacks seguros
      const mapped = (data || []).map(q => ({
        ...q,
        options: (Array.isArray(q.options) ? q.options : []) as unknown as QuestionOption[],
        difficulty: q.difficulty || 'medio',
        points: q.points || 10,
        is_active: q.is_active ?? true,
      })) as unknown as Question[];

      setQuestions(mapped);
    } catch (err) {
      console.error('Erro ao carregar questões:', err);
      toast.error('Erro ao carregar questões');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Helper: classificar macro em grande área - TAXONOMIA OFICIAL (MACRO → MICRO → TEMA)
  const classifyMacroArea = useCallback((macro: string | null | undefined): 'organica' | 'fisico_quimica' | 'geral' => {
    if (!macro) return 'geral';
    const m = macro.toLowerCase();
    
    // Química Orgânica: funções orgânicas, isomeria, reações orgânicas, polímeros, bioquímica
    if (m.includes('orgânica') || m.includes('organica') || m.includes('polímero') || m.includes('polimero') || 
        m.includes('isomeria') || m.includes('bioquímica') || m.includes('bioquimica') || m.includes('hidrocarboneto') ||
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
        m.includes('reacoes') || m.includes('ambiental') || m.includes('estequiometria')) {
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
        'organica': 'quimica_organica',
        'fisico_quimica': 'fisico_quimica',
        'geral': 'quimica_geral',
      };
      const macroValue = areaToMacroValue[macroAreaFilter];
      const taxonomyMicros = getMicrosForSelect(macroValue);
      if (taxonomyMicros.length > 0) {
        return taxonomyMicros.map(m => m.label);
      }
      // Fallback: filtrar por classificação e extrair micros dos dados
      const filtered = questions.filter(q => classifyMacroArea(q.macro) === macroAreaFilter);
      const micros = filtered.map(q => q.micro).filter(Boolean) as string[];
      return [...new Set(micros)].sort();
    }
    // Sem filtro: mostrar todos os micros únicos dos dados
    const micros = questions.map(q => q.micro).filter(Boolean) as string[];
    return [...new Set(micros)].sort();
  }, [questions, macroAreaFilter, getMicrosForSelect, classifyMacroArea]);

  // Estatísticas por Grande Área
  const macroAreaStats = useMemo(() => {
    return {
      organica: questions.filter(q => classifyMacroArea(q.macro) === 'organica').length,
      fisico_quimica: questions.filter(q => classifyMacroArea(q.macro) === 'fisico_quimica').length,
      geral: questions.filter(q => classifyMacroArea(q.macro) === 'geral').length,
    };
  }, [questions, classifyMacroArea]);

  // Handler SINCRONIZADO para cards e dropdown (toggle + sync)
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
  }, [macroAreaFilter]);

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
  const stats: QuestionStats = useMemo(() => {
    const active = questions.filter(q => q.is_active);
    return {
      total: questions.length,
      active: active.length,
      byDifficulty: {
        facil: questions.filter(q => q.difficulty === 'facil').length,
        medio: questions.filter(q => q.difficulty === 'medio').length,
        dificil: questions.filter(q => q.difficulty === 'dificil').length,
      },
      byArea: {},
    };
  }, [questions]);

  // Questões filtradas e ordenadas
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Filtro por aba
    if (activeTab === 'ativas') {
      filtered = filtered.filter(q => q.is_active);
    } else if (activeTab === 'inativas') {
      filtered = filtered.filter(q => !q.is_active);
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

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term) ||
        q.macro?.toLowerCase().includes(term) ||
        q.micro?.toLowerCase().includes(term) ||
        q.tema?.toLowerCase().includes(term)
      );
    }

    // Ordenação
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

    return filtered;
  }, [questions, activeTab, difficultyFilter, bancaFilter, macroFilter, anoFilter, searchTerm, sortOrder, macroAreaFilter, microFilter, classifyMacroArea]);

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
          <Button variant="outline" size="sm" onClick={loadQuestions}>
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
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-500"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          {isOwner && questions.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setDeleteAllConfirm(true)}
              className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Todas ({questions.length})
            </Button>
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

            {/* Linha 2: Filtros em grid organizado */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. Macroassuntos - SINCRONIZADO com os cards do topo */}
              <Select 
                value={macroAreaFilter} 
                onValueChange={(value) => {
                  // Set direto sem toggle (dropdown não é toggle)
                  setMacroAreaFilter(value as 'all' | 'organica' | 'fisico_quimica' | 'geral');
                  const areaToMacro: Record<string, string> = {
                    'organica': 'quimica_organica',
                    'fisico_quimica': 'fisico_quimica',
                    'geral': 'quimica_geral',
                    'all': 'all'
                  };
                  setMacroFilter(areaToMacro[value] || 'all');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Macroassuntos" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Macroassuntos: Todos</SelectItem>
                  <SelectItem value="organica">Química Orgânica</SelectItem>
                  <SelectItem value="fisico_quimica">Físico-Química</SelectItem>
                  <SelectItem value="geral">Química Geral</SelectItem>
                </SelectContent>
              </Select>

              {/* 2. Micro Assunto */}
              <Select 
                value={microFilter} 
                onValueChange={setMicroFilter}
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

              {/* 3. Ano */}
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

              {/* Botão Limpar Filtros */}
              {(difficultyFilter !== 'all' || bancaFilter !== 'all' || macroFilter !== 'all' || anoFilter !== 'all' || macroAreaFilter !== 'all' || microFilter !== 'all' || searchTerm.trim()) && (
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
              <div className="space-y-3">
                {filteredQuestions.map((question, index) => {
                  const area = classifyMacroArea(question.macro);
                  const areaConfig = {
                    organica: { 
                      bg: 'from-purple-500/5 to-pink-500/5', 
                      border: 'border-l-purple-500',
                      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                      icon: '🧪',
                      label: 'Química Orgânica'
                    },
                    fisico_quimica: { 
                      bg: 'from-cyan-500/5 to-blue-500/5', 
                      border: 'border-l-cyan-500',
                      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                      icon: '⚡',
                      label: 'Físico-Química'
                    },
                    geral: { 
                      bg: 'from-amber-500/5 to-orange-500/5', 
                      border: 'border-l-amber-500',
                      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                      icon: '⚗️',
                      label: 'Química Geral'
                    },
                  };
                  const config = areaConfig[area];
                  
                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "group relative rounded-lg border-l-4 bg-gradient-to-r p-4 transition-all hover:shadow-lg",
                        config.border,
                        config.bg,
                        "border border-border/50 hover:border-border"
                      )}
                    >
                    {/* ══════════════════════════════════════════════════════════════
                        BARRA DE BADGES - Visibilidade Organizacional Expandida
                        Exibe: Status | Publicado | Dificuldade | Banca | Ano | Tipo | Área
                    ══════════════════════════════════════════════════════════════ */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-3 pb-3 border-b border-border/30">
                        {/* Grupo Central: Dificuldade + Banca + Ano */}
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "text-sm px-4 py-1.5 border-0 font-semibold text-white",
                            question.difficulty === 'facil' && 'bg-green-500',
                            question.difficulty === 'medio' && 'bg-yellow-500',
                            question.difficulty === 'dificil' && 'bg-red-500',
                          )}>
                            {question.difficulty === 'facil' && 'Fácil'}
                            {question.difficulty === 'medio' && 'Médio'}
                            {question.difficulty === 'dificil' && 'Difícil'}
                          </Badge>
                          
                          {question.banca && (
                            <Badge className="text-sm px-4 py-1.5 bg-muted text-foreground border border-border/50 font-medium flex items-center gap-1">
                              🏛 {getBancaLabel(question.banca)}
                            </Badge>
                          )}
                          
                          {question.ano && (
                            <Badge className="text-sm px-4 py-1.5 bg-muted text-foreground border border-border/50 font-medium flex items-center gap-1">
                              📅 {question.ano}
                            </Badge>
                          )}
                        </div>

                        {/* Grupo Direito: Tipo + Macro + Micro */}
                        <div className="flex items-center gap-2">
                          <Badge className="text-sm px-4 py-1.5 bg-primary/80 text-primary-foreground border-0 font-semibold flex items-center gap-1">
                            ⭐ {question.question_type === 'multiple_choice' ? 'Múltipla Escolha' : 'Discursiva'}
                          </Badge>
                          <Badge className={cn("text-sm px-4 py-1.5 border-0 font-bold", config.badge)}>
                            {config.icon} {config.label}
                          </Badge>
                          {question.micro && (
                            <Badge className="text-sm px-4 py-1.5 bg-muted text-foreground border border-border/50 font-medium">
                              📚 {question.micro.length > 20 ? question.micro.substring(0, 20) + '...' : question.micro}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: ID + Enunciado */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                              #{String(index + 1).padStart(3, '0')}
                            </span>
                          </div>
                          
                          {/* Enunciado com Imagem - Componente Universal */}
                          <QuestionEnunciado
                            questionText={question.question_text}
                            imageUrl={question.image_url}
                            textSize="sm"
                            compact
                            showImageLabel={false}
                            className="mb-3"
                          />
                          
                          {/* Badges de Associação: QUESTION_DOMAIN (SIMULADO ou TREINO) */}
                          <div className="flex items-center justify-between text-sm">
                            {question.tags?.includes('SIMULADOS') ? (
                              <Badge className="px-4 py-1.5 bg-red-600 text-white border-0 font-bold">
                                🎯 Simulados
                              </Badge>
                            ) : question.tags?.includes('MODO_TREINO') ? (
                              <Badge className="px-4 py-1.5 bg-purple-600 text-white border-0 font-bold">
                                💪 Treino
                              </Badge>
                            ) : (
                              <Badge className="px-4 py-1.5 bg-muted text-muted-foreground border border-border/50 font-medium">
                                📋 Sem grupo
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Right: Ações Rápidas - Sempre visíveis */}
                        <div className="flex items-center gap-1 shrink-0">
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
                            onClick={() => handleEdit(question)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Mais opções"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={4}>
                              <DropdownMenuItem onClick={() => handleDuplicate(question)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(question.id, question.is_active)}>
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
                                onClick={() => setDeleteConfirm(question.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Footer: Tags + Metadata */}
                      {(question.tags && question.tags.length > 0) && (
                        <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2">
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
                              <span className="text-[10px] text-muted-foreground">+{question.tags.length - 5} mais</span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
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
    </div>
  );
}

export default memo(GestaoQuestoes);
