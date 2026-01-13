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
 * 
 * DESIGN: Year 2300 Cinematic HUD + Performance Tiering
 */

import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  BookOpen, Play, ArrowLeft, Eye, Video, Info, Clock, Award, Hash,
  Sparkles, Zap, Target, Trophy, Activity, FileText
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
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

interface SimuladoReviewScreenProps {
  simulado: Simulado;
  result: SimuladoResult;
  questions: SimuladoQuestion[];
  answers: Map<string, SimuladoAnswer>;
  isRetake: boolean;
  onExit?: () => void;
}

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
function VideoPlayer({ url, isLowEnd }: { url: string; isLowEnd: boolean }) {
  const type = getVideoType(url);
  const videoId = getVideoId(url);
  
  const containerClass = cn(
    "aspect-video rounded-xl overflow-hidden relative",
    !isLowEnd && "shadow-[0_0_30px_rgba(168,85,247,0.3)]"
  );
  
  const borderClass = cn(
    "absolute inset-0 rounded-xl pointer-events-none z-10",
    !isLowEnd && "border border-purple-500/50"
  );
  
  return (
    <div className={containerClass}>
      <div className={borderClass} />
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
 * Converte índice numérico (0, 1, 2...) para letra (a, b, c...)
 */
function convertIndexToLetter(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (isNaN(Number(value))) return value.toLowerCase();
  return String.fromCharCode(97 + Number(value));
}

/**
 * Componente de metadados COMPLETOS da questão - HUD Style
 */
function QuestionMetadata({ question, isLowEnd }: { question: SimuladoQuestion; isLowEnd: boolean }) {
  const hasMeta = question.banca || question.ano || question.difficulty || 
                  question.macro || question.micro || question.tema || question.subtema;
  
  if (!hasMeta) return null;
  
  const difficultyConfig: Record<string, { label: string; class: string; glow: string }> = {
    facil: { label: 'Fácil', class: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
    medio: { label: 'Médio', class: 'border-amber-500/50 text-amber-400 bg-amber-500/10', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
    dificil: { label: 'Difícil', class: 'border-red-500/50 text-red-400 bg-red-500/10', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' },
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
    <div className="space-y-3 mb-6">
      {/* LINHA 1: Difficulty | Banca | Ano | Macro */}
      <div className="flex flex-wrap items-center gap-2">
        {diff && (
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium px-3 py-1", diff.class, !isLowEnd && diff.glow)}
          >
            <Zap className="w-3 h-3 mr-1" />
            {diff.label}
          </Badge>
        )}
        {question.banca && (
          <Badge variant="outline" className="text-xs px-3 py-1 border-slate-500/50 text-slate-300 bg-slate-500/10">
            🏛 {question.banca}
          </Badge>
        )}
        {question.ano && (
          <Badge variant="outline" className="text-xs px-3 py-1 border-slate-500/50 text-slate-300 bg-slate-500/10">
            📅 {question.ano}
          </Badge>
        )}
        {question.macro && macro && (
          <Badge variant="outline" className={cn("text-xs font-medium px-3 py-1", macro.class)}>
            {macro.icon} {question.macro}
          </Badge>
        )}
      </div>
      
      {/* LINHA 2: Micro | Tema | Subtema */}
      {(question.micro || question.tema || question.subtema) && (
        <div className="flex flex-wrap items-center gap-2">
          {question.micro && (
            <Badge className="text-xs px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              📚 {question.micro}
            </Badge>
          )}
          {question.tema && (
            <Badge className="text-xs px-3 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/40">
              🎯 {question.tema}
            </Badge>
          )}
          {question.subtema && (
            <Badge className="text-xs px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
              🔹 {question.subtema}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente de informações da resposta do usuário - HUD Card
 */
function AnswerInfo({ 
  answer, 
  isCorrect, 
  questionId,
  pointsPerQuestion,
  isLowEnd,
}: { 
  answer: SimuladoAnswer | undefined; 
  isCorrect: boolean;
  questionId: string;
  pointsPerQuestion: number;
  isLowEnd: boolean;
}) {
  const wasAnswered = answer?.selectedOption !== null && answer?.selectedOption !== undefined;
  
  return (
    <div className={cn(
      "relative rounded-xl p-4 mb-6 border overflow-hidden",
      wasAnswered && isCorrect && "bg-emerald-500/10 border-emerald-500/50",
      wasAnswered && !isCorrect && "bg-red-500/10 border-red-500/50",
      !wasAnswered && "bg-slate-500/10 border-slate-500/50",
      !isLowEnd && wasAnswered && isCorrect && "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      !isLowEnd && wasAnswered && !isCorrect && "shadow-[0_0_20px_rgba(239,68,68,0.2)]"
    )}>
      {/* HUD corner accents */}
      {!isLowEnd && (
        <>
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-current opacity-40 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-current opacity-40 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-current opacity-40 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-current opacity-40 rounded-br-xl" />
        </>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {wasAnswered ? (
            isCorrect ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/20",
                  !isLowEnd && "animate-pulse"
                )}>
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-lg">Correto!</span>
                  <p className="text-xs text-emerald-400/70">Excelente resposta</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-lg">Incorreto</span>
                  <p className="text-xs text-red-400/70">Revise a resolução</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-500/20">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <span className="font-bold text-lg">Não Respondida</span>
                <p className="text-xs text-slate-400/70">Questão em branco</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stat orbs */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            wasAnswered && isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
          )}>
            <Award className="h-4 w-4" />
            <span className="font-bold">{wasAnswered && isCorrect ? `+${pointsPerQuestion}` : '0'}</span>
            <span className="text-xs opacity-70">pts</span>
          </div>
          
          {answer?.timeSpentSeconds !== undefined && answer.timeSpentSeconds > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400">
              <Clock className="h-4 w-4" />
              <span className="font-bold">{Math.round(answer.timeSpentSeconds)}s</span>
            </div>
          )}
          
          {/* ID mini */}
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-xs">
            <Hash className="h-3 w-3" />
            <span className="font-mono">{questionId.slice(0, 8)}</span>
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
  const { isLowEnd, shouldShowGradients, shouldAnimate } = useConstitutionPerformance();
  
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : undefined;

  const goToNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (!currentQuestion) return null;

  const studentAnswerLetter = convertIndexToLetter(currentAnswer?.selectedOption);
  const correctAnswerLetter = currentQuestion.correct_answer?.toLowerCase();
  const isCorrect = studentAnswerLetter === correctAnswerLetter;
  const wasAnswered = currentAnswer?.selectedOption !== null && currentAnswer?.selectedOption !== undefined;

  // Use percentage from result (already calculated by server) or calculate from questions array
  const percentage = result.percentage ?? (
    questions.length > 0 
      ? Math.round((result.correctAnswers / questions.length) * 100) 
      : 0
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      {!isLowEnd && shouldShowGradients && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.1),transparent_50%)]" />
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        </>
      )}

      {/* Header HUD */}
      <div className="relative z-10 border-b border-purple-500/30 bg-slate-900/80 backdrop-blur-sm">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              {onExit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onExit}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <FileText className={cn(
                    "h-5 w-5 text-purple-400",
                    !isLowEnd && shouldAnimate && "animate-pulse"
                  )} />
                  <h2 className="font-bold text-lg text-white">{simulado.title}</h2>
                </div>
                <p className="text-sm text-slate-400">
                  Revisão do Gabarito — Questão {currentIndex + 1} de {questions.length}
                </p>
              </div>
            </div>
            
            {/* Right: Result Stats HUD */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Percentage orb */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border",
                percentage >= 70 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                percentage >= 50 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
                "bg-red-500/20 border-red-500/50 text-red-400",
                !isLowEnd && "shadow-lg"
              )}>
                <Trophy className="h-4 w-4" />
                <span className="font-bold text-lg">{percentage}%</span>
              </div>
              
              {/* Stat pills */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400",
                !isLowEnd && "shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              )}>
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-bold">{result.correctAnswers}</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-400",
                !isLowEnd && "shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              )}>
                <XCircle className="h-4 w-4" />
                <span className="font-bold">{result.wrongAnswers}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/20 border border-slate-500/50 text-slate-400">
                <Eye className="h-4 w-4" />
                <span className="font-bold">{result.unanswered}</span>
              </div>
              
              {isRetake && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium text-sm">Prática</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Question Navigator Sidebar */}
        <div className="w-20 border-r border-purple-500/20 bg-slate-900/50 hidden md:block">
          <ScrollArea className="h-full py-2">
            <div className="flex flex-col gap-1.5 px-2">
              {questions.map((q, i) => {
                const ans = answers.get(q.id);
                const ansLetter = convertIndexToLetter(ans?.selectedOption);
                const correctLetter = q.correct_answer?.toLowerCase();
                const correct = ansLetter === correctLetter;
                const answered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-full h-12 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 relative overflow-hidden",
                      i === currentIndex && "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900",
                      answered && correct && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50",
                      answered && !correct && "bg-red-500/20 text-red-400 border border-red-500/50",
                      !answered && "bg-slate-800/50 text-slate-400 border border-slate-700/50",
                      "hover:scale-105"
                    )}
                  >
                    {i + 1}
                    {answered && (
                      correct ? 
                        <CheckCircle2 className="h-3.5 w-3.5" /> : 
                        <XCircle className="h-3.5 w-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Question Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Question Header HUD */}
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-purple-500/50",
                !isLowEnd && "shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              )}>
                <span className="text-2xl font-black text-white">{currentIndex + 1}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">Questão {currentIndex + 1}</span>
                  {!isLowEnd && <Sparkles className="h-4 w-4 text-purple-400" />}
                </div>
                <p className="text-sm text-slate-400">de {questions.length} questões</p>
              </div>
            </div>
            
            {/* Metadados */}
            <QuestionMetadata question={currentQuestion} isLowEnd={isLowEnd} />
            
            {/* Informações da resposta */}
            <AnswerInfo 
              answer={currentAnswer} 
              isCorrect={isCorrect}
              questionId={currentQuestion.id}
              pointsPerQuestion={simulado.points_per_question || 10}
              isLowEnd={isLowEnd}
            />

            {/* Enunciado Card */}
            <div className={cn(
              "relative rounded-xl border bg-slate-800/50 p-6 mb-6",
              !isLowEnd ? "border-slate-600/50 shadow-[0_0_30px_rgba(0,0,0,0.3)]" : "border-slate-700"
            )}>
              <QuestionEnunciado
                questionText={currentQuestion.question_text}
                imageUrl={currentQuestion.image_url}
                imageUrls={currentQuestion.image_urls}
                banca={currentQuestion.banca}
                ano={currentQuestion.ano}
                textSize="lg"
              />
            </div>

            {/* Alternativas HUD */}
            <div className="space-y-3 mb-8">
              {Object.entries(currentQuestion.options || {}).map(([key, optionValue]) => {
                const keyAsLetter = convertIndexToLetter(key);
                const isSelected = studentAnswerLetter === keyAsLetter;
                const isCorrectOption = correctAnswerLetter === keyAsLetter;
                
                const rawText: unknown =
                  typeof optionValue === "string"
                    ? optionValue
                    : (optionValue as { text?: unknown })?.text ?? optionValue;
                
                const optionText =
                  typeof rawText === "string" ? rawText : rawText == null ? "" : String(rawText);
                
                return (
                  <div
                    key={key}
                    className={cn(
                      "relative p-4 rounded-xl border transition-all",
                      isCorrectOption && "bg-emerald-500/10 border-emerald-500/50",
                      isSelected && !isCorrectOption && "bg-red-500/10 border-red-500/50",
                      !isSelected && !isCorrectOption && "bg-slate-800/30 border-slate-700/50",
                      !isLowEnd && isCorrectOption && "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                      !isLowEnd && isSelected && !isCorrectOption && "shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Letter Badge */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all",
                          isCorrectOption && "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg",
                          isSelected && !isCorrectOption && "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg",
                          !isSelected && !isCorrectOption && "bg-slate-700 text-slate-300"
                        )}
                      >
                        {key.toUpperCase()}
                      </div>
                      
                      {/* Option text */}
                      <QuestionTextField content={optionText} fieldType="alternativa" className="flex-1 pt-2 text-slate-200" />
                      
                      {/* Status icon */}
                      {isCorrectOption && (
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 shrink-0",
                          !isLowEnd && shouldAnimate && "animate-pulse"
                        )}>
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                      )}
                      {isSelected && !isCorrectOption && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20 shrink-0">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Indicator labels */}
                    {isCorrectOption && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-medium">
                          <Target className="w-3 h-3 inline mr-1" />
                          Gabarito Oficial
                        </div>
                      </div>
                    )}
                    {isSelected && !isCorrectOption && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-medium">
                          Sua resposta
                        </div>
                      </div>
                    )}
                    {isSelected && isCorrectOption && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-medium">
                          ✓ Você acertou!
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resolução Comentada HUD */}
            {currentQuestion.explanation && (
              <div className={cn(
                "relative rounded-xl border bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-6 mb-6",
                !isLowEnd ? "border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]" : "border-purple-500/30"
              )}>
                {/* HUD corners */}
                {!isLowEnd && (
                  <>
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-500/50 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-500/50 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-500/50 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-500/50 rounded-br-xl" />
                  </>
                )}
                
                <div className="flex items-center gap-3 text-purple-400 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20",
                    !isLowEnd && "shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  )}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-lg text-white">Resolução Comentada</span>
                    <p className="text-xs text-purple-400/70">Análise detalhada da questão</p>
                  </div>
                  {!isLowEnd && <Sparkles className="h-4 w-4 text-purple-400/50 ml-auto" />}
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
              <div className="mb-6 p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-400">
                  <Info className="h-5 w-5" />
                  <span>Resolução comentada não disponível para esta questão.</span>
                </div>
              </div>
            )}

            {/* Vídeo de Resolução HUD */}
            {currentQuestion.video_url && (
              <div className={cn(
                "relative rounded-xl border bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6",
                !isLowEnd ? "border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]" : "border-cyan-500/30"
              )}>
                <div className="flex items-center gap-3 text-cyan-400 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/20",
                    !isLowEnd && "shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  )}>
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-lg text-white">Vídeo de Resolução</span>
                    <p className="text-xs text-cyan-400/70">Explicação em vídeo pelo professor</p>
                  </div>
                </div>
                <VideoPlayer url={currentQuestion.video_url} isLowEnd={isLowEnd} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer Navigation HUD */}
      <div className="relative z-10 border-t border-purple-500/30 bg-slate-900/80 backdrop-blur-sm p-4">
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={cn(
              "border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30",
              !isLowEnd && "shadow-lg"
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-1">
              {questions.slice(
                Math.max(0, currentIndex - 2),
                Math.min(questions.length, currentIndex + 3)
              ).map((_, i) => {
                const actualIndex = Math.max(0, currentIndex - 2) + i;
                return (
                  <div
                    key={actualIndex}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      actualIndex === currentIndex ? "w-6 bg-purple-500" : "bg-slate-600"
                    )}
                  />
                );
              })}
            </div>
            <span className="text-sm font-bold text-slate-300 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
            className={cn(
              "border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30",
              !isLowEnd && "shadow-lg"
            )}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
