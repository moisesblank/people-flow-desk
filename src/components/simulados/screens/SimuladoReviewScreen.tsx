/**
 * 🎯 SIMULADOS — Tela REVIEW (Pós-Finalização)
 * Constituição SYNAPSE Ω v10.4 | AGENT_EXECUTION
 * 
 * REGRAS OBRIGATÓRIAS:
 * - CADA questão renderiza SUA resolução (question_id binding)
 * - NÃO há reuso de resoluções entre questões
 * - NÃO há cálculo de score no frontend (apenas exibição do servidor)
 * - Histórico de tentativas por questão (visual apenas)
 * - Metadados completos: macro, micro, banca, ano, difficulty
 */

import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  BookOpen, Play, ArrowLeft, Eye, Video, Info, Clock, Award, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Simulado, 
  SimuladoResult, 
  SimuladoQuestion,
  SimuladoAnswer,
} from "@/components/simulados/types";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionResolution from "@/components/shared/QuestionResolution";
import QuestionTextField from "@/components/shared/QuestionTextField";
import { cn } from "@/lib/utils";

interface SimuladoReviewScreenProps {
  simulado: Simulado;
  result: SimuladoResult;
  questions: SimuladoQuestion[];
  answers: Map<string, SimuladoAnswer>;
  isRetake: boolean;
  onExit?: () => void;
}

/**
 * Detecta o tipo de vídeo pela URL
 */
function getVideoType(url: string): 'panda' | 'youtube' | 'vimeo' | 'unknown' {
  if (url.includes('pandavideo') || url.includes('player-vz')) return 'panda';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'unknown';
}

/**
 * Extrai YouTube Video ID
 */
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
  return match ? match[1] : null;
}

/**
 * Componente de vídeo universal
 */
function VideoPlayer({ url }: { url: string }) {
  const type = getVideoType(url);
  
  if (type === 'youtube') {
    const videoId = getYouTubeId(url);
    if (!videoId) return null;
    
    return (
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Vídeo de Resolução"
        />
      </div>
    );
  }
  
  if (type === 'panda') {
    return (
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        <iframe
          src={url}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Vídeo de Resolução"
        />
      </div>
    );
  }
  
  if (type === 'vimeo') {
    return (
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        <iframe
          src={url.replace('vimeo.com', 'player.vimeo.com/video')}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Vídeo de Resolução"
        />
      </div>
    );
  }
  
  // Fallback: link direto
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-primary hover:underline"
    >
      <Play className="h-4 w-4" />
      Assistir Vídeo de Resolução
    </a>
  );
}

/**
 * Componente de metadados COMPLETOS da questão
 * TEMPORAL TRUTH RULE: Exibe TODOS os campos do banco, sem omissão
 */
function QuestionMetadata({ question }: { question: SimuladoQuestion }) {
  const hasMeta = question.banca || question.ano || question.difficulty || 
                  question.macro || question.micro || question.tema || question.subtema;
  
  if (!hasMeta) return null;
  
  // Configurações visuais
  const difficultyConfig: Record<string, { label: string; class: string }> = {
    facil: { label: 'Fácil', class: 'border-green-500/50 text-green-500' },
    medio: { label: 'Médio', class: 'border-amber-500/50 text-amber-500' },
    dificil: { label: 'Difícil', class: 'border-red-500/50 text-red-500' },
  };

  const macroConfig: Record<string, { icon: string; class: string }> = {
    'Química Geral': { icon: '⚗️', class: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    'Química Orgânica': { icon: '🧪', class: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
    'Físico-Química': { icon: '📊', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
    'Química Ambiental': { icon: '🌍', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    'Bioquímica': { icon: '🧬', class: 'bg-pink-500/20 text-pink-400 border-pink-500/40' },
  };

  const diff = question.difficulty ? difficultyConfig[question.difficulty] : null;
  const macro = question.macro ? macroConfig[question.macro] || { icon: '⚗️', class: 'bg-amber-500/20 text-amber-400 border-amber-500/40' } : null;
  
  return (
    <div className="space-y-2 mb-4">
      {/* LINHA 1: Difficulty | Banca | Ano | Macro */}
      <div className="flex flex-wrap items-center gap-2">
        {diff && (
          <Badge variant="outline" className={cn("text-xs font-medium", diff.class)}>
            {diff.label}
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
  pointsPerQuestion,
}: { 
  answer: SimuladoAnswer | undefined; 
  isCorrect: boolean;
  questionId: string;
  pointsPerQuestion: number;
}) {
  const wasAnswered = answer?.selectedOption !== null && answer?.selectedOption !== undefined;
  
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
              <Eye className="h-5 w-5" />
              <span className="font-medium">Não respondida</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {/* Pontuação */}
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span>{wasAnswered && isCorrect ? `+${pointsPerQuestion}` : '0'} pts</span>
          </div>
          
          {/* Tempo gasto */}
          {answer?.timeSpentSeconds !== undefined && answer.timeSpentSeconds > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.round(answer.timeSpentSeconds)}s</span>
            </div>
          )}
          
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

export function SimuladoReviewScreen({
  simulado,
  result,
  questions,
  answers,
  isRetake,
  onExit,
}: SimuladoReviewScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // BINDING EXPLÍCITO: currentQuestion vinculada ao índice atual
  const currentQuestion = questions[currentIndex];
  
  // BINDING EXPLÍCITO: currentAnswer vinculada ao question_id
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : undefined;

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

  // CÁLCULO LOCAL apenas para display - score real vem do servidor (result)
  const isCorrect = currentAnswer?.selectedOption === currentQuestion.correct_answer;
  const wasAnswered = currentAnswer?.selectedOption !== null && currentAnswer?.selectedOption !== undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            {onExit && (
              <Button variant="ghost" size="sm" onClick={onExit}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            <div>
              <h2 className="font-semibold">{simulado.title}</h2>
              <p className="text-sm text-muted-foreground">
                Revisão — Questão {currentIndex + 1} de {questions.length}
              </p>
            </div>
          </div>
          
          {/* Resumo do resultado (do SERVIDOR) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
              {result.correctAnswers} corretas
            </div>
            <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
              {result.wrongAnswers} erradas
            </div>
            <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
              {result.unanswered} em branco
            </div>
            {isRetake && (
              <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                Prática
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navegação lateral */}
        <div className="w-20 border-r border-border p-2 hidden md:block">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1">
              {questions.map((q, i) => {
                // BINDING: ans vinculado ao q.id específico
                const ans = answers.get(q.id);
                const correct = ans?.selectedOption === q.correct_answer;
                const answered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                
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
              answer={currentAnswer} 
              isCorrect={isCorrect}
              questionId={currentQuestion.id}
              pointsPerQuestion={simulado.points_per_question || 10}
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
              {Object.entries(currentQuestion.options || {}).map(([key, optionValue]) => {
                const isSelected = currentAnswer?.selectedOption === key;
                const isCorrectOption = currentQuestion.correct_answer === key;
                
                // Extrair texto: pode ser string ou objeto {id, text}
                const rawText: unknown =
                  typeof optionValue === "string"
                    ? optionValue
                    : (optionValue as { text?: unknown })?.text ?? optionValue;
                
                // Garantia anti-"React child object": sempre coerção para string
                const optionText =
                  typeof rawText === "string" ? rawText : rawText == null ? "" : String(rawText);
                
                return (
                  <div
                    key={key}
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
                        {key}
                      </div>
                      <QuestionTextField content={optionText} fieldType="alternativa" className="flex-1 pt-1" />
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

          <Button
            variant="outline"
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}