// ============================================
// 📝 GESTÃO DE QUESTÕES - Área Administrativa
// Gerenciamento completo do banco de questões
// Visual Futurístico Ano 2300
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  tags?: string[] | null;
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
                  value={form.competencia}
                  onValueChange={(v) => setForm(f => ({ ...f, competencia: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
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
                  value={form.habilidade}
                  onValueChange={(v) => setForm(f => ({ ...f, habilidade: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="">Nenhuma</SelectItem>
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [bancaFilter, setBancaFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('todas');
  
  // Dialog states
  const [questionDialog, setQuestionDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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

  // Questões filtradas
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

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [questions, activeTab, difficultyFilter, bancaFilter, searchTerm]);

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
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
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
          onSuccess={loadQuestions}
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

      {/* Tabs e Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="ativas">Ativas</TabsTrigger>
                  <TabsTrigger value="inativas">Inativas</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar questões..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="facil">🟢 Fácil</SelectItem>
                    <SelectItem value="medio">🟡 Médio</SelectItem>
                    <SelectItem value="dificil">🔴 Difícil</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={bancaFilter} onValueChange={setBancaFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Banca" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">Todas</SelectItem>
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
            </div>
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
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Nenhuma questão encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || difficultyFilter !== 'all' || bancaFilter !== 'all'
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Enunciado</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>Banca</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-md">
                          <p className="line-clamp-2 text-sm">
                            {question.question_text}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border", DIFFICULTY_MAP[question.difficulty]?.color)}>
                          {DIFFICULTY_MAP[question.difficulty]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BANCAS.find(b => b.value === question.banca)?.label || question.banca}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.ano}</TableCell>
                      <TableCell>
                        <Badge variant={question.is_active ? "default" : "secondary"}>
                          {question.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={4}>
                            <DropdownMenuItem onClick={() => handleEdit(question)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

      {/* Dialog de Confirmação de Exclusão */}
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
    </div>
  );
}

export default memo(GestaoQuestoes);
