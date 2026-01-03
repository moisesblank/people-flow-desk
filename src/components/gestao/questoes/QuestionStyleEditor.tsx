// ============================================
// 🎨 EDITOR DE ESTILO DE QUESTÃO
// Permite correção manual do tipo de questão
// Múltipla Escolha | Discursiva | Outros
// ============================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  ListChecks,
  FileText,
  MoreHorizontal,
  Save,
  X,
  CheckCircle,
  Hash,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

type QuestionStyle = 'multiple_choice' | 'discursive' | 'outros';

interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionStyleEditorProps {
  questionId: string;
  currentType: string;
  currentOptions: QuestionOption[];
  currentCorrectAnswer: string;
  onUpdate: () => void;
}

interface OutrosConfig {
  subtype: 'somatorio' | 'vf' | 'associacao';
  quantidade?: number;
}

// ============================================
// CONSTANTES
// ============================================

const STYLE_OPTIONS: { value: QuestionStyle; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'multiple_choice',
    label: 'Múltipla Escolha',
    icon: <ListChecks className="h-5 w-5" />,
    description: 'Alternativas A, B, C, D, E',
  },
  {
    value: 'discursive',
    label: 'Discursiva',
    icon: <FileText className="h-5 w-5" />,
    description: 'Campo de texto livre para resposta',
  },
  {
    value: 'outros',
    label: 'Outros',
    icon: <MoreHorizontal className="h-5 w-5" />,
    description: 'Somatório, V/F, Associação',
  },
];

const OUTROS_SUBTYPES = [
  { value: 'somatorio', label: 'Somatório', description: 'Soma das alternativas corretas' },
  { value: 'vf', label: 'Verdadeiro/Falso', description: 'Cada item é V ou F' },
  { value: 'associacao', label: 'Associação', description: 'Relacionar colunas' },
];

const DEFAULT_OPTIONS: QuestionOption[] = [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
  { id: 'c', text: '' },
  { id: 'd', text: '' },
  { id: 'e', text: '' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function QuestionStyleEditor({
  questionId,
  currentType,
  currentOptions,
  currentCorrectAnswer,
  onUpdate,
}: QuestionStyleEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mapear tipo atual para estilo
  const mapTypeToStyle = (type: string): QuestionStyle => {
    if (type === 'discursive') return 'discursive';
    if (type === 'multiple_choice') return 'multiple_choice';
    return 'outros';
  };
  
  const [selectedStyle, setSelectedStyle] = useState<QuestionStyle>(mapTypeToStyle(currentType));
  const [options, setOptions] = useState<QuestionOption[]>(
    currentOptions.length > 0 ? currentOptions : DEFAULT_OPTIONS
  );
  const [correctAnswer, setCorrectAnswer] = useState(currentCorrectAnswer || 'a');
  const [outrosConfig, setOutrosConfig] = useState<OutrosConfig>({
    subtype: 'somatorio',
    quantidade: 5,
  });
  const [somatorioTotal, setSomatorioTotal] = useState<number>(0);

  // Reset ao abrir
  const handleOpen = useCallback(() => {
    setSelectedStyle(mapTypeToStyle(currentType));
    setOptions(currentOptions.length > 0 ? currentOptions : DEFAULT_OPTIONS);
    setCorrectAnswer(currentCorrectAnswer || 'a');
    setIsOpen(true);
  }, [currentType, currentOptions, currentCorrectAnswer]);

  // Salvar alterações
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      let updateData: Record<string, unknown> = {};

      if (selectedStyle === 'multiple_choice') {
        updateData = {
          question_type: 'multiple_choice',
          options: options,
          correct_answer: correctAnswer,
        };
      } else if (selectedStyle === 'discursive') {
        updateData = {
          question_type: 'discursive',
          options: [], // Sem alternativas
          correct_answer: '', // Gabarito manual
        };
      } else if (selectedStyle === 'outros') {
        // Para somatório, salvamos a soma correta
        if (outrosConfig.subtype === 'somatorio') {
          updateData = {
            question_type: 'somatorio',
            options: options,
            correct_answer: somatorioTotal.toString(),
          };
        } else {
          updateData = {
            question_type: outrosConfig.subtype,
            options: options,
            correct_answer: correctAnswer,
          };
        }
      }

      const { error } = await supabase
        .from('quiz_questions')
        .update(updateData)
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Estilo da questão atualizado!');
      setIsOpen(false);
      onUpdate();
    } catch (err) {
      console.error('Erro ao atualizar estilo:', err);
      toast.error('Erro ao atualizar estilo');
    } finally {
      setIsSaving(false);
    }
  }, [selectedStyle, options, correctAnswer, outrosConfig, somatorioTotal, questionId, onUpdate]);

  // Atualizar opção
  const updateOption = useCallback((index: number, text: string) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text };
      return updated;
    });
  }, []);

  // Adicionar opção (somatório)
  const addSomatorioOption = useCallback(() => {
    const nextValue = options.length > 0 
      ? Math.pow(2, options.length) // 1, 2, 4, 8, 16, 32...
      : 1;
    setOptions((prev) => [
      ...prev,
      { id: nextValue.toString().padStart(2, '0'), text: '' },
    ]);
  }, [options.length]);

  // Remover opção
  const removeOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Obter label do estilo atual
  const getCurrentStyleLabel = () => {
    const style = STYLE_OPTIONS.find((s) => s.value === mapTypeToStyle(currentType));
    return style?.label || currentType;
  };

  return (
    <>
      {/* Botão de Editar Estilo */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10"
      >
        <Palette className="h-4 w-4 text-purple-500" />
        <span>Editar Estilo</span>
        <Badge variant="secondary" className="ml-1 text-xs">
          {getCurrentStyleLabel()}
        </Badge>
      </Button>

      {/* Dialog de Edição */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Editor de Estilo da Questão
            </DialogTitle>
            <DialogDescription>
              Defina o tipo de resposta esperada para esta questão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Seleção de Estilo */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Questão</Label>
              <div className="grid grid-cols-3 gap-3">
                {STYLE_OPTIONS.map((style) => (
                  <motion.button
                    key={style.value}
                    type="button"
                    onClick={() => setSelectedStyle(style.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      selectedStyle === style.value
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border hover:border-purple-500/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        selectedStyle === style.value
                          ? "bg-purple-500 text-white"
                          : "bg-muted"
                      )}>
                        {style.icon}
                      </div>
                      {selectedStyle === style.value && (
                        <CheckCircle className="h-4 w-4 text-purple-500 ml-auto" />
                      )}
                    </div>
                    <p className="font-medium text-sm">{style.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {style.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Configuração baseada no estilo selecionado */}
            <AnimatePresence mode="wait">
              {selectedStyle === 'multiple_choice' && (
                <motion.div
                  key="multiple_choice"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Label className="text-sm font-medium">Alternativas</Label>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold uppercase",
                          correctAnswer === opt.id
                            ? "bg-green-500 text-white"
                            : "bg-muted"
                        )}>
                          {opt.id}
                        </span>
                        <Input
                          value={opt.text}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Texto da alternativa ${opt.id.toUpperCase()}`}
                          className="flex-1"
                        />
                        <Button
                          variant={correctAnswer === opt.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCorrectAnswer(opt.id)}
                          className={cn(
                            correctAnswer === opt.id && "bg-green-500 hover:bg-green-600"
                          )}
                        >
                          {correctAnswer === opt.id ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            "Correta"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {selectedStyle === 'discursive' && (
                <motion.div
                  key="discursive"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Label className="text-sm font-medium">Configuração Discursiva</Label>
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Campo de Texto Livre</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            O aluno terá um campo de texto livre para escrever sua resposta.
                            A correção será manual ou via IA.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-lg border border-dashed border-blue-500/30 bg-background">
                        <Textarea
                          placeholder="Área de resposta do aluno (preview)"
                          disabled
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {selectedStyle === 'outros' && (
                <motion.div
                  key="outros"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Label className="text-sm font-medium">Subtipo</Label>
                  <Select
                    value={outrosConfig.subtype}
                    onValueChange={(val) => setOutrosConfig((prev) => ({
                      ...prev,
                      subtype: val as OutrosConfig['subtype'],
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTROS_SUBTYPES.map((sub) => (
                        <SelectItem key={sub.value} value={sub.value}>
                          <div className="flex flex-col">
                            <span>{sub.label}</span>
                            <span className="text-xs text-muted-foreground">{sub.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Configuração de Somatório */}
                  {outrosConfig.subtype === 'somatorio' && (
                    <Card className="border-amber-500/30 bg-amber-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Hash className="h-4 w-4 text-amber-500" />
                          Configuração de Somatório
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Defina as proposições e marque as corretas. O somatório será calculado automaticamente.
                        </p>
                        
                        <div className="space-y-2">
                          {options.map((opt, idx) => {
                            const value = Math.pow(2, idx); // 01, 02, 04, 08, 16, 32...
                            const isChecked = (somatorioTotal & value) !== 0;
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-10 text-center font-mono text-sm text-amber-500">
                                  {value.toString().padStart(2, '0')}
                                </span>
                                <Input
                                  value={opt.text}
                                  onChange={(e) => updateOption(idx, e.target.value)}
                                  placeholder={`Proposição ${value.toString().padStart(2, '0')}`}
                                  className="flex-1"
                                />
                                <Button
                                  variant={isChecked ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    setSomatorioTotal((prev) => 
                                      isChecked ? prev - value : prev + value
                                    );
                                  }}
                                  className={cn(
                                    isChecked && "bg-green-500 hover:bg-green-600"
                                  )}
                                >
                                  {isChecked ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    "Correta"
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(idx)}
                                  className="text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addSomatorioOption}
                            className="gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar Proposição
                          </Button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Soma correta:</span>
                            <Badge variant="secondary" className="text-lg font-mono">
                              {somatorioTotal.toString().padStart(2, '0')}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Configuração V/F */}
                  {outrosConfig.subtype === 'vf' && (
                    <Card className="border-cyan-500/30 bg-cyan-500/5">
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Cada item terá opções Verdadeiro ou Falso.
                        </p>
                        <div className="space-y-2">
                          {['I', 'II', 'III', 'IV', 'V'].map((item) => (
                            <div key={item} className="flex items-center gap-3 p-2 rounded-lg bg-background">
                              <span className="font-mono font-bold w-8">{item}.</span>
                              <RadioGroup defaultValue="v" className="flex gap-4">
                                <div className="flex items-center gap-1">
                                  <RadioGroupItem value="v" id={`${item}-v`} />
                                  <Label htmlFor={`${item}-v`} className="text-sm">V</Label>
                                </div>
                                <div className="flex items-center gap-1">
                                  <RadioGroupItem value="f" id={`${item}-f`} />
                                  <Label htmlFor={`${item}-f`} className="text-sm">F</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Save className="h-4 w-4 mr-2" />
                </motion.div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Estilo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
