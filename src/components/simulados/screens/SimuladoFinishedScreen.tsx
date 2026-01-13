/**
 * 🎯 SIMULADOS — Tela FINISHED
 * Design: Year 2300 Victory Screen + Performance Optimized
 * 
 * Estado: Simulado finalizado
 * Exibição: Score do SERVIDOR com visual épico cinematográfico
 * 
 * v3.0: Year 2300 Cinematic HUD Design + Performance Tiering
 */

import React from "react";
import { 
  Trophy, Clock, Calendar, CheckCircle2, XCircle, Minus, Star, 
  Award, Target, TrendingUp, Info, Zap, Sparkles, Crown, Medal,
  Flame, Shield, BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Simulado, SimuladoResult, SimuladoQuestion, SimuladoAnswer, formatTime } from "@/components/simulados/types";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";
import QuestionTextField from "@/components/shared/QuestionTextField";

interface SimuladoFinishedScreenProps {
  simulado: Simulado;
  result: SimuladoResult;
  isRetake: boolean;
  gabaritoReleasedAt?: string;
  gabaritoIn?: number;
  questions?: SimuladoQuestion[];
  answers?: Map<string, SimuladoAnswer>;
  onReview?: () => void;
  onExit?: () => void;
}

export function SimuladoFinishedScreen({
  simulado,
  result,
  isRetake,
  gabaritoReleasedAt,
  gabaritoIn,
  questions = [],
  answers,
  onReview,
  onExit,
}: SimuladoFinishedScreenProps) {
  const { 
    shouldAnimate, 
    shouldBlur, 
    shouldShowShadows,
    shouldShowGradients,
    isLowEnd,
    getBlurClass
  } = useConstitutionPerformance();
  
  const gabaritoDate = gabaritoReleasedAt ? new Date(gabaritoReleasedAt) : null;
  const isGabaritoAvailable = !gabaritoIn || gabaritoIn <= 0;

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { 
      label: "LENDÁRIO!", 
      sublabel: "Performance Excepcional",
      icon: Crown,
      gradient: "from-amber-400 via-yellow-300 to-amber-400",
      textGlow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]",
      ringColor: "border-amber-400/60",
      bgGlow: "bg-amber-500/20",
      particleColor: "bg-amber-400"
    };
    if (percentage >= 70) return { 
      label: "EXCELENTE!", 
      sublabel: "Acima da Média",
      icon: Trophy,
      gradient: "from-emerald-400 via-green-300 to-emerald-400",
      textGlow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]",
      ringColor: "border-emerald-400/60",
      bgGlow: "bg-emerald-500/20",
      particleColor: "bg-emerald-400"
    };
    if (percentage >= 50) return { 
      label: "BOM TRABALHO!", 
      sublabel: "Na Média",
      icon: Star,
      gradient: "from-blue-400 via-cyan-300 to-blue-400",
      textGlow: "drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]",
      ringColor: "border-blue-400/60",
      bgGlow: "bg-blue-500/20",
      particleColor: "bg-blue-400"
    };
    return { 
      label: "CONTINUE!", 
      sublabel: "Próxima Vez Melhor",
      icon: Target,
      gradient: "from-orange-400 via-amber-300 to-orange-400",
      textGlow: "drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]",
      ringColor: "border-orange-400/60",
      bgGlow: "bg-orange-500/20",
      particleColor: "bg-orange-400"
    };
  };

  const performance = getPerformanceLevel(result.percentage);
  const PerformanceIcon = performance.icon;

  return (
    <div className="relative flex flex-col items-center justify-start min-h-full overflow-hidden">
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          🌌 BACKGROUND EFFECTS — Victory Celebration (Performance Tiered)
      ═══════════════════════════════════════════════════════════════════════════ */}
      {!isLowEnd && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Ambient celebration glows */}
          <div className={cn(
            "absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20",
            shouldAnimate && "animate-pulse",
            performance.bgGlow
          )} />
          <div className={cn(
            "absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15",
            shouldAnimate && "animate-pulse",
            performance.bgGlow
          )} style={{ animationDelay: '1.5s' }} />
          
          {/* Victory particles - only on passed */}
          {result.passed && (
            <>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute w-2 h-2 rounded-full",
                    performance.particleColor,
                    shouldAnimate && "animate-float-slow"
                  )}
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 0.5}s`,
                    opacity: 0.4 + (i * 0.1)
                  }}
                />
              ))}
            </>
          )}
          
          {/* Holographic grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          🏆 VICTORY HERO SECTION — Trophy + Score
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full max-w-3xl px-4 py-6 space-y-6">
        
        {/* Main Victory Card */}
        <div className={cn(
          "relative rounded-3xl border overflow-hidden",
          shouldShowShadows && "shadow-2xl",
          performance.ringColor,
          shouldBlur ? "bg-card/60 backdrop-blur-xl" : "bg-card/90"
        )}>
          
          {/* Card glow border effect */}
          {!isLowEnd && shouldShowGradients && (
            <div className={cn(
              "absolute inset-0 rounded-3xl opacity-30",
              `bg-gradient-to-br ${performance.gradient}`
            )} style={{ padding: '1px' }}>
              <div className="absolute inset-[1px] bg-card rounded-3xl" />
            </div>
          )}
          
          <div className="relative p-6 md:p-8">
            {/* Trophy Row */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
              
              {/* Trophy Container with Rings */}
              <div className="relative">
                {/* Outer rotating ring - only on high-end */}
                {!isLowEnd && (
                  <div className={cn(
                    "absolute -inset-6 rounded-full border-2 border-dashed opacity-30",
                    performance.ringColor,
                    shouldAnimate && "animate-spin-slow"
                  )} />
                )}
                
                {/* Middle pulsing ring */}
                <div className={cn(
                  "absolute -inset-4 rounded-full border",
                  performance.ringColor,
                  shouldAnimate && "animate-pulse"
                )} />
                
                {/* Inner ring */}
                <div className={cn(
                  "absolute -inset-2 rounded-full border-2",
                  performance.ringColor
                )} />
                
                {/* Core trophy container */}
                <div className={cn(
                  "relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center",
                  "border-2",
                  performance.ringColor,
                  shouldShowGradients 
                    ? `bg-gradient-to-br ${performance.gradient}` 
                    : performance.bgGlow
                )}>
                  <PerformanceIcon className={cn(
                    "h-14 w-14 md:h-16 md:w-16 text-white",
                    !isLowEnd && performance.textGlow
                  )} />
                </div>
                
                {/* XP Badge - Premium styling */}
                {result.xpAwarded > 0 && result.isScoredForRanking && (
                  <div className={cn(
                    "absolute -bottom-3 left-1/2 -translate-x-1/2",
                    "px-4 py-1.5 rounded-full",
                    "bg-gradient-to-r from-primary via-violet-500 to-primary",
                    "text-white text-sm font-bold",
                    "flex items-center gap-1.5 border border-white/20",
                    shouldShowShadows && "shadow-lg shadow-primary/50"
                  )}>
                    <Zap className="h-4 w-4" />
                    +{result.xpAwarded} XP
                    {!isLowEnd && <Sparkles className="h-3 w-3 opacity-60" />}
                  </div>
                )}
              </div>

              {/* Score Display */}
              <div className="text-center md:text-left">
                {/* Performance Label */}
                <h1 className={cn(
                  "text-3xl md:text-4xl font-black tracking-tight mb-1",
                  "bg-clip-text text-transparent",
                  shouldShowGradients ? `bg-gradient-to-r ${performance.gradient}` : "text-foreground",
                  !isLowEnd && performance.textGlow
                )}>
                  {performance.label}
                </h1>
                <p className="text-sm text-muted-foreground mb-4">{performance.sublabel}</p>
                
                {/* Main Percentage Display */}
                <div className="relative inline-block">
                  <span className={cn(
                    "text-7xl md:text-8xl font-black tracking-tighter",
                    "bg-clip-text text-transparent",
                    shouldShowGradients 
                      ? `bg-gradient-to-b ${result.passed ? "from-emerald-300 via-emerald-400 to-emerald-600" : "from-amber-300 via-amber-400 to-amber-600"}`
                      : result.passed ? "text-emerald-400" : "text-amber-400",
                    !isLowEnd && (result.passed ? "drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" : "drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]")
                  )}>
                    {result.percentage}
                  </span>
                  <span className={cn(
                    "text-3xl md:text-4xl font-bold",
                    result.passed ? "text-emerald-400/70" : "text-amber-400/70"
                  )}>%</span>
                </div>
                
                {/* Score Details */}
                <p className="text-muted-foreground mt-2">
                  <span className="font-semibold text-foreground">{result.score}</span>
                  <span className="mx-1">/</span>
                  <span>{simulado.total_questions * (simulado.points_per_question || 10)} pts</span>
                </p>
                
                {/* Simulado Title */}
                <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center md:justify-start gap-2">
                  <Medal className="h-4 w-4" />
                  {simulado.title}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            📊 STATS HUD — Holographic Statistics
        ═══════════════════════════════════════════════════════════════════════════ */}
        
        {/* Retake Warning Badge */}
        {isRetake && (
          <div className={cn(
            "flex items-center justify-center gap-2 px-5 py-3 rounded-2xl",
            "bg-amber-500/10 border border-amber-500/40",
            !isLowEnd && "shadow-lg shadow-amber-500/10",
            shouldAnimate && "animate-fade-in"
          )}>
            <Info className="h-5 w-5 text-amber-400" />
            <span className="text-amber-400 font-medium">Modo Prática — Não pontua no ranking</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-3",
          shouldAnimate && "animate-fade-in"
        )}>
          <StatCardHUD
            icon={<CheckCircle2 className="h-8 w-8" />}
            value={result.correctAnswers}
            label="ACERTOS"
            color="emerald"
            isLowEnd={isLowEnd}
            shouldBlur={shouldBlur}
            shouldShowShadows={shouldShowShadows}
          />
          <StatCardHUD
            icon={<XCircle className="h-8 w-8" />}
            value={result.wrongAnswers}
            label="ERROS"
            color="red"
            isLowEnd={isLowEnd}
            shouldBlur={shouldBlur}
            shouldShowShadows={shouldShowShadows}
          />
          <StatCardHUD
            icon={<Minus className="h-8 w-8" />}
            value={result.unanswered}
            label="PULOU"
            color="muted"
            isLowEnd={isLowEnd}
            shouldBlur={shouldBlur}
            shouldShowShadows={shouldShowShadows}
          />
          <StatCardHUD
            icon={<Clock className="h-8 w-8" />}
            value={formatTime(result.timeSpentSeconds)}
            label="Tempo"
            color="blue"
            isLowEnd={isLowEnd}
            shouldBlur={shouldBlur}
            shouldShowShadows={shouldShowShadows}
            isText
          />
        </div>

        {/* Info Row */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-3",
          shouldAnimate && "animate-fade-in"
        )}>
          {/* Ranking Status */}
          <div className={cn(
            "flex items-center gap-3 px-5 py-4 rounded-2xl border",
            "bg-card/60 border-border/50",
            shouldBlur && "backdrop-blur-sm"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              result.isScoredForRanking ? "bg-emerald-500/20" : "bg-muted/50"
            )}>
              <TrendingUp className={cn(
                "h-5 w-5",
                result.isScoredForRanking ? "text-emerald-400" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium text-sm">
                {result.isScoredForRanking ? "Ranking Atualizado" : "Modo Prática"}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.isScoredForRanking ? "Sua posição foi recalculada" : "Resultado não afeta ranking"}
              </p>
            </div>
          </div>

          {/* Passing Score */}
          {simulado.passing_score && (
            <div className={cn(
              "flex items-center gap-3 px-5 py-4 rounded-2xl border",
              result.passed 
                ? "bg-emerald-500/10 border-emerald-500/40" 
                : "bg-amber-500/10 border-amber-500/40"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                result.passed ? "bg-emerald-500/20" : "bg-amber-500/20"
              )}>
                {result.passed ? (
                  <Shield className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Target className="h-5 w-5 text-amber-400" />
                )}
              </div>
              <div>
                <p className={cn(
                  "font-medium text-sm",
                  result.passed ? "text-emerald-400" : "text-amber-400"
                )}>
                  {result.passed ? "Aprovado!" : "Meta não atingida"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Mínimo exigido: {simulado.passing_score}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            📅 GABARITO SECTION — Countdown or Available
        ═══════════════════════════════════════════════════════════════════════════ */}
        {gabaritoDate && gabaritoIn && gabaritoIn > 0 ? (
          <div className={cn(
            "relative rounded-2xl overflow-hidden border border-primary/40",
            shouldShowShadows && "shadow-lg shadow-primary/20",
            shouldAnimate && "animate-fade-in"
          )}>
            {/* Gradient background */}
            {shouldShowGradients && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10" />
            )}
            
            <div className="relative p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-3">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Gabarito será liberado em:</span>
              </div>
              <div className={cn(
                "text-4xl md:text-5xl font-mono font-bold text-primary mb-2",
                !isLowEnd && "drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              )}>
                {formatTime(gabaritoIn)}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(gabaritoDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        ) : isGabaritoAvailable ? (
          <div className={cn(
            "flex items-center justify-center gap-3 px-6 py-4 rounded-2xl",
            "bg-emerald-500/10 border border-emerald-500/40",
            !isLowEnd && "shadow-lg shadow-emerald-500/10",
            shouldAnimate && "animate-fade-in"
          )}>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-emerald-400">Gabarito Comentado Disponível!</p>
              <p className="text-xs text-emerald-400/70">Clique para ver as resoluções detalhadas</p>
            </div>
            {!isLowEnd && <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />}
          </div>
        ) : null}

        {/* ═══════════════════════════════════════════════════════════════════════════
            📋 QUESTIONS SUMMARY — Gabarito Grid
        ═══════════════════════════════════════════════════════════════════════════ */}
        {questions.length > 0 && (
          <div className={cn(
            "rounded-2xl border border-border/50 overflow-hidden",
            shouldBlur ? "bg-card/60 backdrop-blur-sm" : "bg-card/90",
            shouldAnimate && "animate-fade-in"
          )}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Resumo das Questões</h3>
                  <p className="text-xs text-muted-foreground">Gabarito Oficial</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">{result.correctAnswers} ✓</span>
                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400">{result.wrongAnswers} ✗</span>
              </div>
            </div>
            
            {/* Questions List */}
            <ScrollArea className="max-h-[350px]">
              <div className="p-4 space-y-2">
                {questions.map((question, index) => {
                  const rawStudentAnswer = answers?.get(question.id)?.selectedOption;
                  const correctAnswer = question.correct_answer?.toLowerCase();
                  
                  const studentAnswerAsLetter = rawStudentAnswer !== undefined && rawStudentAnswer !== null
                    ? (isNaN(Number(rawStudentAnswer)) 
                        ? rawStudentAnswer.toLowerCase()
                        : String.fromCharCode(97 + Number(rawStudentAnswer)))
                    : null;
                  
                  const isCorrect = studentAnswerAsLetter === correctAnswer;
                  const wasAnswered = !!rawStudentAnswer;
                  
                  return (
                    <QuestionSummaryCard
                      key={question.id}
                      index={index}
                      question={question}
                      correctAnswer={correctAnswer}
                      studentAnswer={studentAnswerAsLetter}
                      rawAnswer={rawStudentAnswer}
                      isCorrect={isCorrect}
                      wasAnswered={wasAnswered}
                      isLowEnd={isLowEnd}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════
            🎯 ACTION BUTTONS — Premium CTAs
        ═══════════════════════════════════════════════════════════════════════════ */}
        <div className={cn(
          "flex flex-col sm:flex-row gap-3 pt-2",
          shouldAnimate && "animate-fade-in"
        )}>
          {isGabaritoAvailable && onReview && (
            <Button 
              onClick={onReview} 
              size="lg"
              className={cn(
                "flex-1 h-14 text-base font-semibold",
                "bg-gradient-to-r from-primary via-violet-500 to-primary hover:opacity-90",
                "border border-white/10",
                shouldShowShadows && "shadow-xl shadow-primary/40"
              )}
            >
              <Award className="h-5 w-5 mr-2" />
              Ver Gabarito Comentado
              {!isLowEnd && <Sparkles className="h-4 w-4 ml-2 opacity-60" />}
            </Button>
          )}
          {onExit && (
            <Button 
              onClick={onExit} 
              variant="outline" 
              size="lg"
              className={cn(
                "sm:flex-none sm:min-w-[180px] h-14",
                "border-2 hover:bg-muted/50"
              )}
            >
              Voltar aos Simulados
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   🎴 STAT CARD HUD — Holographic Statistics Card
═══════════════════════════════════════════════════════════════════════════════ */
function StatCardHUD({
  icon,
  value,
  label,
  color,
  isLowEnd = false,
  shouldBlur = true,
  shouldShowShadows = true,
  isText = false,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: "emerald" | "red" | "muted" | "blue";
  isLowEnd?: boolean;
  shouldBlur?: boolean;
  shouldShowShadows?: boolean;
  isText?: boolean;
}) {
  const colorConfig = {
    emerald: {
      border: "border-emerald-500/40 hover:border-emerald-500/60",
      bg: "bg-emerald-500/10",
      icon: "text-emerald-400",
      glow: "shadow-emerald-500/20"
    },
    red: {
      border: "border-red-500/40 hover:border-red-500/60",
      bg: "bg-red-500/10",
      icon: "text-red-400",
      glow: "shadow-red-500/20"
    },
    muted: {
      border: "border-border/50 hover:border-border",
      bg: "bg-muted/30",
      icon: "text-muted-foreground",
      glow: ""
    },
    blue: {
      border: "border-blue-500/40 hover:border-blue-500/60",
      bg: "bg-blue-500/10",
      icon: "text-blue-400",
      glow: "shadow-blue-500/20"
    },
  };

  const config = colorConfig[color];

  return (
    <div className={cn(
      "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200",
      config.border,
      shouldBlur ? "bg-card/60 backdrop-blur-sm" : "bg-card/90",
      shouldShowShadows && !isLowEnd && `shadow-lg ${config.glow}`
    )}>
      {/* Icon container */}
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center",
        config.bg
      )}>
        <div className={config.icon}>{icon}</div>
      </div>
      
      {/* Value - ULTRA EVIDENT */}
      <span className={cn(
        "font-black tracking-tight",
        isText ? "text-2xl" : "text-4xl"
      )}>
        {value}
      </span>
      
      {/* Label - ULTRA EVIDENT */}
      <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   📝 QUESTION SUMMARY CARD — Individual Question Result
═══════════════════════════════════════════════════════════════════════════════ */
function QuestionSummaryCard({
  index,
  question,
  correctAnswer,
  studentAnswer,
  rawAnswer,
  isCorrect,
  wasAnswered,
  isLowEnd,
}: {
  index: number;
  question: SimuladoQuestion;
  correctAnswer?: string;
  studentAnswer: string | null;
  rawAnswer?: string | number;
  isCorrect: boolean;
  wasAnswered: boolean;
  isLowEnd: boolean;
}) {
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      isCorrect 
        ? "border-emerald-500/40 bg-emerald-500/5" 
        : wasAnswered 
          ? "border-red-500/30 bg-red-500/5"
          : "border-border/50 bg-card/50"
    )}>
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
          isCorrect 
            ? "bg-emerald-500/20 text-emerald-400"
            : wasAnswered
              ? "bg-red-500/20 text-red-400"
              : "bg-muted text-muted-foreground"
        )}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <QuestionTextField 
            content={question.question_text} 
            fieldType="enunciado"
            className="text-sm text-muted-foreground line-clamp-2"
          />
        </div>
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isCorrect ? "bg-emerald-500/20" : wasAnswered ? "bg-red-500/20" : "bg-muted/50"
        )}>
          {isCorrect ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : wasAnswered ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : (
            <Minus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          🏷️ TAXONOMIA: Macro | Micro | Nível
          Constituição SYNAPSE Ω v10.4 | QUESTION IDENTITY
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2 mb-3 pl-11">
        {question.macro && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {question.macro}
          </span>
        )}
        {question.micro && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {question.micro}
          </span>
        )}
        {question.difficulty && (
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
            question.difficulty === 'facil' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            question.difficulty === 'medio' && "bg-amber-500/20 text-amber-400 border-amber-500/30",
            question.difficulty === 'dificil' && "bg-red-500/20 text-red-400 border-red-500/30"
          )}>
            {question.difficulty === 'facil' ? '🟢 Fácil' : question.difficulty === 'medio' ? '🟡 Médio' : '🔴 Difícil'}
          </span>
        )}
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          🎯 RESPOSTA DO ALUNO (SEMPRE VISÍVEL) — Registro Permanente
          Constituição SYNAPSE Ω v10.4 | TEMPORAL TRUTH BINDING
          ═══════════════════════════════════════════════════════════════════════ */}
      
      {/* Student's Answer - SEMPRE EXIBIDA (acerto ou erro) */}
      {wasAnswered && studentAnswer && question.options && (
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          isCorrect 
            ? "bg-cyan-500/10 border-cyan-500/30"
            : "bg-red-500/10 border-red-500/30"
        )}>
          <span className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase",
            isCorrect 
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
              : "bg-red-500/30 text-red-400"
          )}>
            {studentAnswer}
          </span>
          <QuestionTextField 
            content={question.options[studentAnswer] || question.options[rawAnswer!] || ""} 
            fieldType="alternativa"
            className={cn(
              "text-sm flex-1",
              isCorrect ? "text-cyan-400" : "text-red-400/70 line-through"
            )}
          />
          <div className="flex flex-col items-end gap-1">
            <span className={cn(
              "text-[10px] uppercase tracking-wider font-medium",
              isCorrect ? "text-cyan-400" : "text-red-400/70"
            )}>
              Você marcou
            </span>
            {isCorrect && (
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            )}
            {!isCorrect && (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
          </div>
        </div>
      )}
      
      {/* Correct Answer Display (Gabarito) */}
      {correctAnswer && question.options && (
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30",
          wasAnswered ? "mt-2" : ""
        )}>
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold uppercase shadow-lg shadow-emerald-500/30">
            {correctAnswer}
          </span>
          <QuestionTextField 
            content={question.options[correctAnswer] || ""} 
            fieldType="alternativa"
            className="text-sm text-emerald-400 flex-1"
          />
          <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-medium">Gabarito</span>
        </div>
      )}
      
      {/* Not Answered Indicator */}
      {!wasAnswered && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-500/10 border border-zinc-500/30 mt-2">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-500/30 text-zinc-400 flex items-center justify-center text-xs font-bold">
            —
          </span>
          <span className="text-sm text-zinc-400 flex-1 italic">Questão não respondida</span>
          <span className="text-[10px] text-zinc-400/70 uppercase tracking-wider">Em branco</span>
        </div>
      )}
    </div>
  );
}
