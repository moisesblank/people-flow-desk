/**
 * 🎯 SIMULADOS — Tela REVIEW
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Gabarito liberado
 * Ação: Exibir respostas, correção e explicações
 */

import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  BookOpen, Play, ArrowLeft, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Simulado, 
  SimuladoResult, 
  SimuladoQuestion,
  SimuladoAnswer,
} from "@/components/simulados/types";
import { cn } from "@/lib/utils";

interface SimuladoReviewScreenProps {
  simulado: Simulado;
  result: SimuladoResult;
  questions: SimuladoQuestion[];
  answers: Map<string, SimuladoAnswer>;
  isRetake: boolean;
  onExit?: () => void;
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
        <div className="flex-1 p-6 overflow-y-auto">
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

          {/* Enunciado */}
          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-lg whitespace-pre-wrap">
              {currentQuestion.question_text}
            </p>
            {currentQuestion.image_url && (
              <img
                src={currentQuestion.image_url}
                alt="Imagem da questão"
                className="max-h-[400px] rounded-lg mt-4"
              />
            )}
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

          {/* Explicação */}
          {currentQuestion.explanation && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Explicação</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
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
