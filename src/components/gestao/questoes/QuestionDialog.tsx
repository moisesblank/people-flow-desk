// ============================================
// 📝 QUESTION DIALOG - Criar/Editar Questão
// Extraído de GestaoQuestoes.tsx para reduzir build time
// ============================================

import { memo, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle, Video, Image as ImageIcon, ChevronRight, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';
import { BANCAS } from '@/constants/bancas';
import { 
  QuestionImageUploader, 
  SingleImageUploader,
  type QuestionImage 
} from '@/components/gestao/questoes/QuestionImageUploader';
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
  image?: QuestionOptionImage | null;
}

export interface Question {
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

export interface QuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question?: Question | null;
}

// ============================================
// CONSTANTES
// ============================================

const COMPETENCIAS_ENEM = [
  { value: 'C1', label: 'C1 - Compreender as ciências naturais' },
  { value: 'C2', label: 'C2 - Identificar a presença da química' },
  { value: 'C3', label: 'C3 - Associar intervenções' },
  { value: 'C4', label: 'C4 - Compreender interações' },
  { value: 'C5', label: 'C5 - Entender métodos e procedimentos' },
  { value: 'C6', label: 'C6 - Apropriar-se de conhecimentos' },
  { value: 'C7', label: 'C7 - Avaliar propostas de intervenção' },
];

const ANOS_DISPONIVEIS = Array.from({ length: 30 }, (_, i) => 2025 - i);

// ============================================
// DIALOG COMPONENT
// ============================================

export const QuestionDialog = memo(function QuestionDialog({ 
  open, 
  onClose, 
  onSuccess, 
  question 
}: QuestionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
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
    ano: null as number | null,
    tags: [] as string[],
    points: 10,
    is_active: true,
    macro: '',
    micro: '',
    tema: '',
    subtema: '',
    orgao_cargo: '',
    has_video_resolution: false,
    video_provider: '' as '' | 'youtube' | 'panda',
    video_url: '',
    is_multidisciplinar: false,
    competencia: '' as '' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7',
    habilidade: '',
    tipo_pedagogico: 'direta' as 'direta' | 'contextualizada',
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
        ano: question.ano ?? null,
        tags: question.tags || [],
        points: question.points || 10,
        is_active: question.is_active ?? true,
        macro: (question as any).macro || '',
        micro: (question as any).micro || '',
        tema: (question as any).tema || '',
        subtema: (question as any).subtema || '',
        orgao_cargo: (question as any).orgao_cargo || '',
        has_video_resolution: (question as any).has_video_resolution || false,
        video_provider: (question as any).video_provider || '',
        video_url: (question as any).video_url || '',
        is_multidisciplinar: (question as any).is_multidisciplinar || false,
        competencia: (question as any).competencia || '',
        habilidade: (question as any).habilidade || '',
        tipo_pedagogico: (question as any).tipo_pedagogico || 'direta',
        images: ((question as any).image_urls || []) as QuestionImage[],
      });
    } else {
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
        macro: '',
        micro: '',
        tema: '',
        subtema: '',
        orgao_cargo: '',
        has_video_resolution: false,
        video_provider: '',
        video_url: '',
        is_multidisciplinar: false,
        competencia: '',
        habilidade: '',
        tipo_pedagogico: 'direta',
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

    const filledOptions = form.options.filter(o => o.text.trim());
    if (filledOptions.length < 2) {
      toast.error('Preencha pelo menos 2 alternativas');
      return;
    }

    const correctOption = form.options.find(o => o.id === form.correct_answer);
    if (!correctOption?.text.trim()) {
      toast.error('A alternativa correta precisa ter texto');
      return;
    }

    setIsSubmitting(true);
    try {
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
        macro: form.macro || null,
        micro: form.micro || null,
        tema: form.tema || null,
        subtema: form.subtema || null,
        orgao_cargo: form.orgao_cargo || null,
        has_video_resolution: form.has_video_resolution,
        video_provider: form.has_video_resolution && form.video_provider ? form.video_provider : null,
        video_url: form.has_video_resolution && form.video_url ? form.video_url.trim() : null,
        image_urls: form.images.map(img => ({
          id: img.id, url: img.url, path: img.path, name: img.name, size: img.size, position: img.position
        })) as unknown as Record<string, unknown>[],
      };

      if (question?.id) {
        const { error } = await supabase
          .from('quiz_questions')
          .update({ ...payload, updated_at: new Date().toISOString() } as any)
          .eq('id', question.id);

        if (error) throw error;
        toast.success('Questão atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert([payload as any]);

        if (error) throw error;
        toast.success('Questão criada com sucesso!');
      }

      invalidateAllQuestionCaches(queryClient);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar questão:', error);
      toast.error(error.message || 'Erro ao salvar questão');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Micros filtrados pelo macro selecionado
  const availableMicros = form.macro ? getMicrosForSelect(form.macro) : [];
  const availableTemas = form.micro ? getTemasForSelect(form.micro) : [];
  const availableSubtemas = form.tema ? getSubtemasForSelect(form.tema) : [];

  // Handler para mudar macro (resetar campos filhos)
  const handleMacroChange = (value: string) => {
    setForm(f => ({ ...f, macro: value, micro: '', tema: '', subtema: '' }));
  };

  const handleMicroChange = (value: string) => {
    setForm(f => ({ ...f, micro: value, tema: '', subtema: '' }));
  };

  const handleTemaChange = (value: string) => {
    setForm(f => ({ ...f, tema: value, subtema: '' }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {question ? 'Editar Questão' : 'Nova Questão'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {question ? 'Atualize os dados da questão' : 'Preencha os campos para criar uma nova questão'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enunciado */}
          <div className="space-y-2">
            <Label className="text-white">Enunciado *</Label>
            <Textarea
              value={form.question_text}
              onChange={(e) => setForm(f => ({ ...f, question_text: e.target.value }))}
              placeholder="Digite o enunciado da questão..."
              className="min-h-[120px] bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Imagens do Enunciado */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imagens do Enunciado
            </Label>
            <QuestionImageUploader
              images={form.images}
              onChange={(images) => setForm(f => ({ ...f, images }))}
            />
          </div>

          {/* Alternativas */}
          <div className="space-y-3">
            <Label className="text-white">Alternativas *</Label>
            {form.options.map((option, index) => (
              <div key={option.id} className="flex items-start gap-3">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 mt-1",
                  form.correct_answer === option.id 
                    ? "bg-green-500/20 text-green-500 border border-green-500/30" 
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                )}>
                  {option.id.toUpperCase()}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Alternativa ${option.id.toUpperCase()}`}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <SingleImageUploader
                    image={option.image ? { 
                      id: option.image.id, 
                      url: option.image.url, 
                      path: option.image.path, 
                      name: option.image.name,
                      size: 0,
                      position: 0
                    } : null}
                    onChange={(img) => {
                      const newOptions = [...form.options];
                      newOptions[index] = { ...newOptions[index], image: img ? { id: img.id, url: img.url, path: img.path, name: img.name } : null };
                      setForm(f => ({ ...f, options: newOptions }));
                    }}
                    label="Imagem da alternativa"
                  />
                </div>
                <Button
                  type="button"
                  variant={form.correct_answer === option.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "shrink-0 mt-1",
                    form.correct_answer === option.id && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => setForm(f => ({ ...f, correct_answer: option.id }))}
                >
                  {form.correct_answer === option.id ? 'Correta' : 'Marcar'}
                </Button>
              </div>
            ))}
          </div>

          {/* Explicação */}
          <div className="space-y-2">
            <Label className="text-white">Explicação (Resolução)</Label>
            <Textarea
              value={form.explanation}
              onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))}
              placeholder="Explicação detalhada da resposta correta..."
              className="min-h-[80px] bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Grid de Configurações */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Dificuldade */}
            <div className="space-y-2">
              <Label className="text-white">Dificuldade</Label>
              <Select value={form.difficulty} onValueChange={(v) => setForm(f => ({ ...f, difficulty: v as any }))}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Banca */}
            <div className="space-y-2">
              <Label className="text-white">Banca</Label>
              <Select value={form.banca} onValueChange={(v) => setForm(f => ({ ...f, banca: v }))}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {BANCAS.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <Label className="text-white">Ano</Label>
              <Select 
                value={form.ano?.toString() || ''} 
                onValueChange={(v) => setForm(f => ({ ...f, ano: v ? parseInt(v) : null }))}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Sem ano" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="">Sem ano</SelectItem>
                  {ANOS_DISPONIVEIS.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pontos */}
            <div className="space-y-2">
              <Label className="text-white">Pontos</Label>
              <Input
                type="number"
                value={form.points}
                onChange={(e) => setForm(f => ({ ...f, points: parseInt(e.target.value) || 10 }))}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Taxonomia Hierárquica */}
          <div className="space-y-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              Classificação Taxonômica
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Macro */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs">MACRO (Área)</Label>
                <Select value={form.macro} onValueChange={handleMacroChange} disabled={taxonomyLoading}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {macros.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Micro */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs">MICRO (Assunto)</Label>
                <Select 
                  value={form.micro} 
                  onValueChange={handleMicroChange}
                  disabled={!form.macro || availableMicros.length === 0}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder={form.macro ? "Selecione..." : "Selecione macro primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMicros.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tema */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs">TEMA</Label>
                <Select 
                  value={form.tema} 
                  onValueChange={handleTemaChange}
                  disabled={!form.micro || availableTemas.length === 0}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder={form.micro ? "Selecione..." : "Selecione micro primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemas.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subtema */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs">SUBTEMA</Label>
                <Select 
                  value={form.subtema} 
                  onValueChange={(v) => setForm(f => ({ ...f, subtema: v }))}
                  disabled={!form.tema || availableSubtemas.length === 0}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder={form.tema ? "Selecione..." : "Selecione tema primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubtemas.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vídeo Resolução */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="text-white flex items-center gap-2">
                <Video className="h-4 w-4" />
                Resolução em Vídeo
              </Label>
              <Switch
                checked={form.has_video_resolution}
                onCheckedChange={(checked) => setForm(f => ({ 
                  ...f, 
                  has_video_resolution: checked,
                  video_provider: checked ? f.video_provider : '',
                  video_url: checked ? f.video_url : ''
                }))}
              />
            </div>
            
            {form.has_video_resolution && (
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  value={form.video_provider} 
                  onValueChange={(v) => setForm(f => ({ ...f, video_provider: v as any }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Provedor de vídeo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="panda">Panda Video</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm(f => ({ ...f, video_url: e.target.value }))}
                  placeholder="URL do vídeo"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <Label className="text-white">Questão Ativa</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm(f => ({ ...f, is_active: checked }))}
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

export default QuestionDialog;
