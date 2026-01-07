// ============================================
// VIRTUALIZED STUDENT QUESTION LIST v2.0
// Year 2300 Cinematic Design + Performance Tiering
// Renderiza apenas itens visíveis para performance
// ============================================

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle2, XCircle, ChevronRight, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import { QuestionBadgesCompact } from '@/components/shared/QuestionMetadataBadges';
import { cleanQuestionText } from '@/components/shared/QuestionEnunciado';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';

// Configuração de virtualização
const ITEM_HEIGHT = 180; // Altura ligeiramente aumentada para o novo design
const OVERSCAN = 5;
const CONTAINER_HEIGHT = 'calc(100vh - 500px)';

interface QuestionOption {
  id: string;
  text: string;
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
}

interface AttemptData {
  is_correct: boolean;
  selected_answer: string;
}

interface VirtualizedStudentQuestionListProps {
  questions: Question[];
  attemptsByQuestion: Map<string, AttemptData>;
  onOpenQuestion: (question: Question) => void;
  onResetAttempt?: (questionId: string) => Promise<void>;
  isResetting?: string | null;
}

// ============================================
// QUESTION ITEM — Year 2300 Design
// ============================================
const QuestionItem = memo(function QuestionItem({
  question,
  attempt,
  onOpen,
  onReset,
  isResetting,
  isHighEnd,
}: {
  question: Question;
  attempt: AttemptData | undefined;
  onOpen: (q: Question) => void;
  onReset?: (questionId: string) => void;
  isResetting?: boolean;
  isHighEnd: boolean;
}) {
  const hasAttempt = !!attempt;
  const isCorrect = attempt?.is_correct;

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReset) {
      onReset(question.id);
    }
  };

  // Cores dinâmicas baseadas no estado
  const borderGradient = hasAttempt
    ? isCorrect
      ? "from-green-500/40 via-emerald-500/20 to-green-500/40"
      : "from-red-500/40 via-rose-500/20 to-red-500/40"
    : "from-amber-500/20 via-yellow-500/10 to-amber-500/20";

  const borderColor = hasAttempt
    ? isCorrect
      ? "border-l-green-500"
      : "border-l-red-500"
    : "border-l-amber-500/50";

  return (
    <div className="relative group">
      {/* Glow effect (high-end only) */}
      {isHighEnd && hasAttempt && (
        <div className={cn(
          "absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md",
          isCorrect ? "bg-green-500/20" : "bg-red-500/20"
        )} />
      )}
      
      <Card 
        className={cn(
          "relative overflow-hidden cursor-pointer h-full border-l-4",
          borderColor,
          isHighEnd 
            ? "bg-gradient-to-r from-slate-900/80 via-background/60 to-slate-900/80 border-slate-700/50 hover:border-amber-500/30 transition-all duration-200" 
            : "bg-card hover:shadow-md transition-shadow"
        )}
        onClick={() => onOpen(question)}
      >
        {/* Linha superior luminosa (high-end) */}
        {isHighEnd && (
          <div className={cn(
            "absolute top-0 left-0 right-0 h-px bg-gradient-to-r",
            borderGradient
          )} />
        )}
        
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Tags de taxonomia com estilo premium */}
            <div className={cn(
              "pb-2 border-b",
              isHighEnd ? "border-slate-700/30" : "border-border/30"
            )}>
              <QuestionBadgesCompact 
                question={question}
                className=""
              />
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-1">
                {/* Badges de status */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Pontos */}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "gap-1",
                      isHighEnd 
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300" 
                        : ""
                    )}
                  >
                    <Trophy className="h-3 w-3" />
                    {question.points} pts
                  </Badge>
                  
                  {/* Status de acerto/erro */}
                  {hasAttempt && (
                    <Badge 
                      className={cn(
                        "gap-1",
                        isCorrect 
                          ? isHighEnd 
                            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30" 
                            : "bg-green-500/10 text-green-600 border-green-500/30"
                          : isHighEnd
                            ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                      )}
                    >
                      {isCorrect ? (
                        <><CheckCircle2 className="w-3 h-3" /> Acertou</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Errou</>
                      )}
                    </Badge>
                  )}
                  
                  {/* Badge Treino */}
                  <Badge className={cn(
                    "px-2 py-0.5 text-xs font-semibold border-0",
                    isHighEnd 
                      ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-500/30" 
                      : "bg-purple-600 text-white"
                  )}>
                    💪 Treino
                  </Badge>
                </div>
                
                {/* Texto da questão */}
                <p className={cn(
                  "text-sm line-clamp-2",
                  isHighEnd ? "text-slate-200" : ""
                )}>
                  {cleanQuestionText(question.question_text)}
                </p>
              </div>
              
              {/* Botões de ação */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* Botão Revisar/Resolver */}
                <div className="relative group/btn">
                  {isHighEnd && !hasAttempt && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-md blur opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  )}
                  <Button 
                    variant={hasAttempt ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "relative font-semibold min-w-[100px]",
                      hasAttempt 
                        ? isHighEnd 
                          ? "border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 hover:border-amber-500/30 text-slate-200 transition-all" 
                          : ""
                        : isHighEnd 
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-lg shadow-amber-500/20 transition-all" 
                          : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {hasAttempt ? (
                      <>
                        Revisar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        {isHighEnd && <Sparkles className="w-3 h-3 mr-1" />}
                        Resolver
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Botão Tentar do Zero */}
                {hasAttempt && onReset && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "text-xs h-8",
                      isHighEnd 
                        ? "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                    onClick={handleReset}
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3 mr-1" />
                    )}
                    Tentar do Zero
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// ============================================
// VIRTUALIZED LIST CONTAINER
// ============================================
export function VirtualizedStudentQuestionList({
  questions,
  attemptsByQuestion,
  onOpenQuestion,
  onResetAttempt,
  isResetting,
}: VirtualizedStudentQuestionListProps) {
  // Performance Tiering
  const perf = useConstitutionPerformance();
  const isHighEnd = !perf.isLowEnd;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [questions.length]);

  // Cálculos de virtualização
  const totalHeight = questions.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    questions.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visibleQuestions = questions.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

  if (questions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "overflow-auto rounded-lg",
        isHighEnd && "scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent"
      )}
      style={{ 
        height: CONTAINER_HEIGHT,
        minHeight: '400px',
        maxHeight: '70vh'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {visibleQuestions.map((question) => (
            <div 
              key={question.id}
              style={{ height: ITEM_HEIGHT - 16 }}
            >
              <QuestionItem
                question={question}
                attempt={attemptsByQuestion.get(question.id)}
                onOpen={onOpenQuestion}
                onReset={onResetAttempt ? (id) => onResetAttempt(id) : undefined}
                isResetting={isResetting === question.id}
                isHighEnd={isHighEnd}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedStudentQuestionList;
