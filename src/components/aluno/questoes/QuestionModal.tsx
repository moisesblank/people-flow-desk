// ============================================
// 📚 QUESTION MODAL - Componente de Resolução
// Extraído de AlunoQuestoes.tsx para otimização de build
// ============================================

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, CheckCircle2, XCircle, Clock, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionTextField from "@/components/shared/QuestionTextField";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { ReportQuestionError } from "@/components/shared/ReportQuestionError";
import { formatBancaHeader } from "@/lib/bancaNormalizer";

// ============================================
// TIPOS
// ============================================

export interface QuestionOption {
  id: string;
  text: string;
  image_url?: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type?: 'multiple_choice' | 'discursive' | 'outros';
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: "facil" | "medio" | "dificil";
  banca?: string | null;
  ano?: number | null;
  points: number;
  is_active: boolean;
  created_at: string;
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
  tags?: string[] | null;
  image_url?: string | null;
  image_urls?: any[] | null;
}

export interface QuestionAttempt {
  id?: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  selected_answer: string;
  xp_earned?: number;
  created_at?: string;
}

// ============================================
// CONSTANTES
// ============================================

const DIFFICULTY_COLORS = {
  facil: "bg-green-500/10 text-green-600 border-green-500/20",
  medio: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  dificil: "bg-red-500/10 text-red-600 border-red-500/20",
};

const DIFFICULTY_LABELS = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

// ============================================
// COMPONENTE
// ============================================

interface QuestionModalProps {
  open: boolean;
  onClose: () => void;
  question: Question | null;
  userAttempt: QuestionAttempt | null;
  onAnswer: (questionId: string, selectedAnswer: string) => void;
  isSubmitting: boolean;
}

export function QuestionModal({ open, onClose, question, userAttempt, onAnswer, isSubmitting }: QuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [discursiveAnswer, setDiscursiveAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const isDiscursive = question?.question_type === 'discursive';

  useEffect(() => {
    if (question && userAttempt) {
      setSelectedOption(userAttempt.selected_answer);
      setDiscursiveAnswer(userAttempt.selected_answer || '');
      setHasAnswered(true);
      setShowExplanation(true);
    } else {
      setSelectedOption(null);
      setDiscursiveAnswer('');
      setHasAnswered(false);
      setShowExplanation(false);
    }
  }, [question?.id, userAttempt]);

  const handleSubmitAnswer = () => {
    if (!question) return;
    
    if (isDiscursive) {
      if (!discursiveAnswer.trim()) return;
      onAnswer(question.id, discursiveAnswer);
    } else {
      if (!selectedOption) return;
      onAnswer(question.id, selectedOption);
    }
    
    setHasAnswered(true);
    setShowExplanation(true);
  };

  const isCorrect = hasAnswered && !isDiscursive && selectedOption === question?.correct_answer;

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Resolver Questão
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge className={DIFFICULTY_COLORS[question.difficulty]}>
                    {DIFFICULTY_LABELS[question.difficulty]}
                  </Badge>
                  <Badge variant="outline">
                    🏛️ {formatBancaHeader(question.banca, question.ano, question.question_text)}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    <Trophy className="h-3 w-3 mr-1" />
                    {question.points} pts
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
            {/* Enunciado */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <QuestionEnunciado
                questionText={question.question_text}
                imageUrl={question.image_url}
                imageUrls={question.image_urls}
                banca={question.banca}
                ano={question.ano}
                textSize="sm"
                showImageLabel
              />
            </div>

            {/* Alternativas ou Campo de Texto (Discursiva) */}
            {isDiscursive ? (
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  ✍️ Sua Resposta:
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Discursiva
                  </Badge>
                </Label>
                <Textarea
                  placeholder="Digite sua resposta aqui..."
                  value={discursiveAnswer}
                  onChange={(e) => setDiscursiveAnswer(e.target.value)}
                  disabled={hasAnswered}
                  className={cn(
                    "min-h-[200px] text-sm transition-all",
                    hasAnswered && "bg-muted/50 cursor-not-allowed"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Escreva sua resposta de forma completa. Será avaliada posteriormente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Alternativas:</Label>
                <RadioGroup
                  value={selectedOption || ""}
                  onValueChange={setSelectedOption}
                  disabled={hasAnswered}
                  className="space-y-2"
                >
                  {(question.options || []).map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrectOption = option.id === question.correct_answer;
                    
                    let optionClass = "border-muted-foreground/30 hover:border-primary/50";
                    if (hasAnswered) {
                      if (isCorrectOption) {
                        optionClass = "border-green-500 bg-green-500/10";
                      } else if (isSelected && !isCorrectOption) {
                        optionClass = "border-red-500 bg-red-500/10";
                      }
                    } else if (isSelected) {
                      optionClass = "border-primary bg-primary/10";
                    }

                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          optionClass,
                          hasAnswered && "cursor-not-allowed"
                        )}
                        onClick={() => !hasAnswered && setSelectedOption(option.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                          <Label
                            htmlFor={option.id}
                            className={cn(
                              "w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold text-sm cursor-pointer",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                              hasAnswered && isCorrectOption && "border-green-500 bg-green-500 text-white",
                              hasAnswered && isSelected && !isCorrectOption && "border-red-500 bg-red-500 text-white"
                            )}
                          >
                            {option.id.toUpperCase()}
                          </Label>
                          <QuestionTextField content={option.text} fieldType="alternativa" textSize="sm" className="flex-1" inline />
                          {hasAnswered && isCorrectOption && (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                          {hasAnswered && isSelected && !isCorrectOption && (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        {option.image_url && (
                          <img 
                            src={option.image_url} 
                            alt={`Imagem alternativa ${option.id.toUpperCase()}`}
                            className="max-h-[300px] w-auto object-contain rounded-lg ml-11"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
                
                {/* Reportar Erro */}
                <ReportQuestionError 
                  questionId={question.id}
                  sourcePage="questoes"
                />
              </div>
            )}

            {/* Resultado */}
            {hasAnswered && (
              <div
                className={cn(
                  "p-4 rounded-xl border-2",
                  isDiscursive
                    ? "bg-amber-500/10 border-amber-500"
                    : isCorrect 
                      ? "bg-green-500/10 border-green-500" 
                      : "bg-red-500/10 border-red-500"
                )}
              >
                <div className="flex items-center gap-3">
                  {isDiscursive ? (
                    <>
                      <Clock className="h-6 w-6 text-amber-500" />
                      <div>
                        <p className="font-bold text-amber-600">Resposta Enviada!</p>
                        <p className="text-sm text-muted-foreground">
                          ✍️ Sua resposta será avaliada pelo professor
                        </p>
                      </div>
                    </>
                  ) : isCorrect ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-bold text-green-600">Parabéns! Você acertou!</p>
                        <p className="text-sm text-muted-foreground">
                          🎯 Modo Treino - sem pontos
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-500" />
                      <div>
                        <p className="font-bold text-red-600">Resposta incorreta</p>
                        <p className="text-sm text-muted-foreground">
                          A resposta correta era: {question.correct_answer.toUpperCase()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Explicação */}
            {showExplanation && question.explanation && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <QuestionResolution
                  resolutionText={question.explanation}
                  banca={question.banca}
                  ano={question.ano}
                  difficulty={question.difficulty}
                  tema={question.tema}
                  macro={question.macro}
                  micro={question.micro}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {!hasAnswered && (
            <Button 
              onClick={handleSubmitAnswer}
              disabled={isDiscursive ? !discursiveAnswer.trim() || isSubmitting : !selectedOption || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {isDiscursive ? 'Enviar Resposta' : 'Confirmar Resposta'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
