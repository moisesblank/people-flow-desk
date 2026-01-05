/**
 * 🎯 SIMULADOS — Tela REVIEW
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Gabarito liberado
 * Ação: Exibir respostas, correção e explicações
 * 
 * ATUALIZADO: Usa QuestionEnunciado + QuestionResolution + Vídeo
 */

import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  BookOpen, Play, ArrowLeft, Eye, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Simulado, 
  SimuladoResult, 
  SimuladoQuestion,
  SimuladoAnswer,
} from "@/components/simulados/types";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionResolution from "@/components/shared/QuestionResolution";
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

export function SimuladoReviewScreen({
  simulado,
  result,
  questions,
  answers,
  isRetake,
  onExit,
}: SimuladoReviewScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion?.id);

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

  const isCorrect = currentAnswer?.selectedOption === currentQuestion.correct_answer;
  const wasAnswered = currentAnswer?.selectedOption !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
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
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
              {result.correctAnswers} corretas
            </div>
            <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
              {result.wrongAnswers} erradas
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex">
        {/* Navegação lateral */}
        <div className="w-20 border-r border-border p-2 hidden md:block">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1">
              {questions.map((q, i) => {
                const ans = answers.get(q.id);
                const correct = ans?.selectedOption === q.correct_answer;
                const answered = ans?.selectedOption !== null;
                
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
          <div className="p-6">
            {/* Indicador de resultado */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4",
                wasAnswered && isCorrect && "bg-green-500/20 text-green-400",
                wasAnswered && !isCorrect && "bg-red-500/20 text-red-400",
                !wasAnswered && "bg-muted text-muted-foreground"
              )}
            >
              {wasAnswered ? (
                isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Resposta Correta
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Resposta Incorreta
                  </>
                )
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Não respondida
                </>
              )}
            </div>

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
              {Object.entries(currentQuestion.options || {}).map(([key, text]) => {
                const isSelected = currentAnswer?.selectedOption === key;
                const isCorrectOption = currentQuestion.correct_answer === key;
                
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
                      <p className="flex-1 pt-1">{text}</p>
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

            {/* Resolução Comentada - Usando componente padronizado */}
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

            {/* Vídeo de Resolução */}
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
