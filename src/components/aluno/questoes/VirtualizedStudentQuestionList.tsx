// ============================================
// VIRTUALIZED STUDENT QUESTION LIST v1.0
// Renderiza apenas itens visíveis para performance
// Padrão permanente para /alunos/questoes
// ============================================

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { QuestionBadgesCompact } from '@/components/shared/QuestionMetadataBadges';
import { cleanQuestionText } from '@/components/shared/QuestionEnunciado';

// Configuração de virtualização
const ITEM_HEIGHT = 160; // Altura aproximada de cada card de questão do aluno
const OVERSCAN = 5; // Itens extras renderizados acima/abaixo
const CONTAINER_HEIGHT = 'calc(100vh - 500px)'; // Altura do container

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
}

// Item individual memoizado
const QuestionItem = memo(function QuestionItem({
  question,
  attempt,
  onOpen,
}: {
  question: Question;
  attempt: AttemptData | undefined;
  onOpen: (q: Question) => void;
}) {
  const hasAttempt = !!attempt;
  const isCorrect = attempt?.is_correct;

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md cursor-pointer h-full",
        hasAttempt && isCorrect && "border-l-4 border-l-green-500",
        hasAttempt && !isCorrect && "border-l-4 border-l-red-500"
      )}
      onClick={() => onOpen(question)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <QuestionBadgesCompact 
            question={question}
            className="pb-2 border-b border-border/30"
          />
          
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  {question.points} pts
                </Badge>
                {hasAttempt && (
                  <Badge variant={isCorrect ? "default" : "destructive"}>
                    {isCorrect ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Acertou</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Errou</>
                    )}
                  </Badge>
                )}
                <Badge className="px-2 py-0.5 bg-purple-600 text-white border-0 text-xs font-medium">
                  💪 Treino
                </Badge>
              </div>
              <p className="text-sm line-clamp-2">{cleanQuestionText(question.question_text)}</p>
            </div>
            <Button variant={hasAttempt ? "outline" : "default"} size="sm">
              {hasAttempt ? "Revisar" : "Resolver"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export function VirtualizedStudentQuestionList({
  questions,
  attemptsByQuestion,
  onOpenQuestion,
}: VirtualizedStudentQuestionListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Observer para detectar mudanças de altura do container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handler de scroll otimizado
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll quando questões mudam
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
      className="overflow-auto"
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
              style={{ height: ITEM_HEIGHT - 16 }} // Desconta o gap
            >
              <QuestionItem
                question={question}
                attempt={attemptsByQuestion.get(question.id)}
                onOpen={onOpenQuestion}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedStudentQuestionList;
