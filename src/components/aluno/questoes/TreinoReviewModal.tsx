/**
 * 🎯 TREINO REVIEW MODAL — Revisão Educacional Pós-Treino
 * Constituição SYNAPSE Ω v10.4 | AGENT_EXECUTION
 * 
 * REGRAS OBRIGATÓRIAS:
 * - CADA questão renderiza SUA resolução (question_id binding)
 * - NÃO há reuso de resoluções entre questões
 * - NÃO há cálculo de score (apenas exibição das respostas)
 * - Metadados completos: macro, micro, banca, ano, difficulty
 * - Modo TREINO: 0 XP sempre
 */

import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  BookOpen, ArrowLeft, Clock, Award, Hash, Info, Video, Play, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { cn } from "@/lib/utils";
import QuestionTextField from "@/components/shared/QuestionTextField";

interface QuestionOption {
  id: string;
  text: string;
  image_url?: string;
}

interface Question {
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
  video_url?: string | null;
}

interface TreinoAnswer {
  answer: string;
  isCorrect: boolean;
}

interface TreinoReviewModalProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  answers: Record<string, TreinoAnswer>;
  results: { correct: number; total: number };
}

const DIFFICULTY_COLORS: Record<string, string> = {
  facil: "border-green-500/50 text-green-500",
  medio: "border-amber-500/50 text-amber-500",
  dificil: "border-red-500/50 text-red-500",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

import { OmegaFortressPlayer } from "@/components/video/OmegaFortressPlayer";

// ✅ PADRÃO SOBERANO v2400 — Importar função centralizada
import { detectVideoProviderFromUrl } from "@/lib/video/detectVideoProvider";

/**
 * Detecta o tipo de vídeo pela URL (usa função centralizada)
 */
function getVideoType(url: string): 'panda' | 'youtube' | 'vimeo' | 'unknown' {
  return detectVideoProviderFromUrl(url);
}

/**
 * Extrai Video ID universal
 */
function getVideoId(url: string): string {
  const type = getVideoType(url);
  
  if (type === 'youtube') {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
    return match ? match[1] : url;
  }
  
  // Panda e Vimeo: retornar URL inteira para o player processar
  return url;
}

/**
 * 🔒 Componente de vídeo com OVERLAY OBRIGATÓRIO
 * Usa OmegaFortressPlayer para garantir disclaimer em todos os vídeos
 */
function VideoPlayer({ url }: { url: string }) {
  const type = getVideoType(url);
  const videoId = getVideoId(url);
  
  return (
    <div className="aspect-video rounded-lg overflow-hidden border border-border">
      <OmegaFortressPlayer
        videoId={videoId}
        type={type === 'unknown' ? 'youtube' : type}
        title="Vídeo de Resolução"
        showSecurityBadge={false}
        showWatermark
        autoplay={false}
      />
    </div>
  );
}

/**
 * Componente de metadados COMPLETOS da questão
 * TEMPORAL TRUTH RULE: Exibe TODOS os campos do banco, sem omissão
 */
function QuestionMetadata({ question }: { question: Question }) {
  const hasMeta = question.banca || question.ano || question.difficulty || 
                  question.macro || question.micro || question.tema || question.subtema;
  
  if (!hasMeta) return null;

  // Configurações visuais para macros
  const macroConfig: Record<string, { icon: string; class: string }> = {
    'Química Geral': { icon: '⚗️', class: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    'Química Orgânica': { icon: '🧪', class: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
    'Físico-Química': { icon: '📊', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
    'Química Ambiental': { icon: '🌍', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    'Bioquímica': { icon: '🧬', class: 'bg-pink-500/20 text-pink-400 border-pink-500/40' },
  };

  const macro = question.macro ? macroConfig[question.macro] || { icon: '⚗️', class: 'bg-amber-500/20 text-amber-400 border-amber-500/40' } : null;
  
  return (
    <div className="space-y-2 mb-4">
      {/* LINHA 1: Difficulty | Banca | Ano | Macro */}
      <div className="flex flex-wrap items-center gap-2">
        {question.difficulty && (
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium", DIFFICULTY_COLORS[question.difficulty])}
          >
            {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
          </Badge>
        )}
        {question.banca && (
          <Badge variant="outline" className="text-xs">
            🏛 {question.banca}
          </Badge>
        )}
        {question.ano && (
          <Badge variant="outline" className="text-xs">
            {question.ano}
          </Badge>
        )}
        {question.macro && macro && (
          <Badge variant="outline" className={cn("text-xs font-medium", macro.class)}>
            {macro.icon} {question.macro}
          </Badge>
        )}
      </div>
      
      {/* LINHA 2: Micro | Tema | Subtema (camadas transversais) */}
      {(question.micro || question.tema || question.subtema) && (
        <div className="flex flex-wrap items-center gap-2">
          {question.micro && (
            <Badge className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              📚 Micro: {question.micro}
            </Badge>
          )}
          {question.tema && (
            <Badge className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/40">
              🎯 Tema: {question.tema}
            </Badge>
          )}
          {question.subtema && (
            <Badge className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
              🔹 Subtema: {question.subtema}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente de informações da resposta do usuário
 */
function AnswerInfo({ 
  answer, 
  isCorrect, 
  questionId,
}: { 
  answer: string | undefined; 
  isCorrect: boolean;
  questionId: string;
}) {
  const wasAnswered = answer !== null && answer !== undefined;
  
  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {wasAnswered ? (
            isCorrect ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Resposta Correta</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Resposta Incorreta</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="h-5 w-5" />
              <span className="font-medium">Não respondida</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {/* Badge Treino (0 XP) */}
          <Badge className="bg-purple-600 text-white border-0">
            💪 Treino (0 XP)
          </Badge>
          
          {/* ID para auditoria */}
          <div className="flex items-center gap-1 opacity-50">
            <Hash className="h-3 w-3" />
            <span className="font-mono text-xs">{questionId.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TreinoReviewModal({
  open,
  onClose,
  questions,
  answers,
  results,
}: TreinoReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // BINDING EXPLÍCITO: currentQuestion vinculada ao índice atual
  const currentQuestion = questions[currentIndex];
  
  // BINDING EXPLÍCITO: currentAnswer vinculada ao question_id
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentQuestion) {
    return null;
  }

  const isCorrect = currentAnswer?.isCorrect ?? false;
  const wasAnswered = currentAnswer?.answer !== null && currentAnswer?.answer !== undefined;
  const progressPercentage = Math.round((results.correct / results.total) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header fixo */}
        <DialogHeader className="p-4 pb-3 border-b">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">
                    Revisão do Treino
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Questão {currentIndex + 1} de {questions.length}
                  </DialogDescription>
                </div>
              </div>
            </div>
            
            {/* Resumo do resultado */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                {results.correct} corretas
              </div>
              <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                {results.total - results.correct} erradas
              </div>
              <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold">
                {progressPercentage}%
              </div>
            </div>
          </div>
          <Progress value={(currentIndex + 1) / questions.length * 100} className="h-1.5 mt-3" />
        </DialogHeader>

        {/* Conteúdo scrollável */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navegação lateral */}
          <div className="w-16 border-r border-border p-2 hidden md:block">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-1">
                {questions.map((q, i) => {
                  // BINDING: ans vinculado ao q.id específico
                  const ans = answers[q.id];
                  const correct = ans?.isCorrect ?? false;
                  const answered = ans?.answer !== null && ans?.answer !== undefined;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        "w-full h-10 rounded text-sm font-medium transition-all flex items-center justify-center gap-1",
                        i === currentIndex && "ring-2 ring-primary",
                        answered && correct && "bg-green-500/20 text-green-400",
                        answered && !correct && "bg-red-500/20 text-red-400",
                        !answered && "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {i + 1}
                      {answered && (
                        correct ? 
                          <CheckCircle2 className="h-3 w-3" /> : 
                          <XCircle className="h-3 w-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Questão */}
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-4xl mx-auto">
              {/* Metadados da questão */}
              <QuestionMetadata question={currentQuestion} />
              
              {/* Informações da resposta do usuário */}
              <AnswerInfo 
                answer={currentAnswer?.answer} 
                isCorrect={isCorrect}
                questionId={currentQuestion.id}
              />

              {/* Enunciado - Usando componente padronizado */}
              <div className="mb-6">
                <QuestionEnunciado
                  questionText={currentQuestion.question_text}
                  imageUrl={currentQuestion.image_url}
                  imageUrls={currentQuestion.image_urls}
                  banca={currentQuestion.banca}
                  ano={currentQuestion.ano}
                  textSize="lg"
                />
              </div>

              {/* Alternativas */}
              <div className="space-y-3 mb-6">
                {(currentQuestion.options || []).map((option) => {
                  const isSelected = currentAnswer?.answer === option.id;
                  const isCorrectOption = currentQuestion.correct_answer === option.id;
                  
                  // Extrair texto: pode ser string ou objeto {id, text}
                  const rawText: unknown =
                    typeof option.text === "string"
                      ? option.text
                      : (option as { text?: unknown })?.text ?? option;
                  
                  // Garantia anti-"React child object": sempre coerção para string
                  const optionText =
                    typeof rawText === "string" ? rawText : rawText == null ? "" : String(rawText);
                  
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        isCorrectOption && "bg-green-500/10 border-green-500/50",
                        isSelected && !isCorrectOption && "bg-red-500/10 border-red-500/50",
                        !isSelected && !isCorrectOption && "bg-muted/20 border-border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            isCorrectOption && "bg-green-500 text-white",
                            isSelected && !isCorrectOption && "bg-red-500 text-white",
                            !isSelected && !isCorrectOption && "bg-muted text-muted-foreground"
                          )}
                        >
                          {option.id.toUpperCase()}
                        </div>
                        <QuestionTextField content={optionText} fieldType="alternativa" className="flex-1 pt-1" inline />
                        {isCorrectOption && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        )}
                        {isSelected && !isCorrectOption && (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resolução Comentada - BINDING EXPLÍCITO: currentQuestion.explanation */}
              {currentQuestion.explanation && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <BookOpen className="h-5 w-5" />
                    <span className="font-medium text-lg">Resolução Comentada</span>
                  </div>
                  <QuestionResolution
                    resolutionText={currentQuestion.explanation}
                    banca={currentQuestion.banca}
                    ano={currentQuestion.ano}
                    difficulty={currentQuestion.difficulty}
                    macro={currentQuestion.macro}
                    micro={currentQuestion.micro}
                  />
                </div>
              )}
              
              {/* Aviso se não há resolução */}
              {!currentQuestion.explanation && (
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-5 w-5" />
                    <span>Resolução comentada não disponível para esta questão.</span>
                  </div>
                </div>
              )}

              {/* Vídeo de Resolução - BINDING EXPLÍCITO: currentQuestion.video_url */}
              {currentQuestion.video_url && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <Video className="h-5 w-5" />
                    <span className="font-medium text-lg">Vídeo de Resolução</span>
                  </div>
                  <VideoPlayer url={currentQuestion.video_url} />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer navegação */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </span>

            {currentIndex === questions.length - 1 ? (
              <Button onClick={onClose}>
                Concluir Revisão
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={goToNext}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
