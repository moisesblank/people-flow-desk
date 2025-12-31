// ============================================
// FLASHCARDS TAB - Cards de memorização
// Integrado com banco de dados via useLessonAI
// ANTES: Usava SAMPLE_DATA estático
// DEPOIS: Busca flashcards reais + fallback IA
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RotateCcw, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Sparkles, Loader2, Brain, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLessonAI } from '@/hooks/ai/useLessonAI';
import { useQuery } from '@tanstack/react-query';
import type { FlashcardSimple, FlashcardDifficulty } from '@/types/flashcards';

interface FlashcardsTabProps {
  lessonId: string;
}

// Flashcards de fallback quando não há dados
const FALLBACK_FLASHCARDS: FlashcardSimple[] = [
  {
    id: 'fallback-1',
    front: 'O que é o Ponto Triplo?',
    back: 'É a condição única de temperatura e pressão onde as três fases (sólido, líquido e gás) coexistem em equilíbrio.',
    difficulty: 'medium'
  },
  {
    id: 'fallback-2',
    front: 'O que acontece no Ponto Crítico?',
    back: 'Acima do ponto crítico, não existe mais distinção entre líquido e gás - a substância está em estado supercrítico.',
    difficulty: 'hard'
  },
  {
    id: 'fallback-3',
    front: 'Por que o gelo flutua na água?',
    back: 'Porque o gelo é menos denso que a água líquida devido à estrutura cristalina formada pelas ligações de hidrogênio.',
    difficulty: 'easy'
  },
];

function FlashcardsTab({ lessonId }: FlashcardsTabProps) {
  const { user } = useAuth();
  const { generateContent, getCachedContent, isLoading: isGenerating } = useLessonAI();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState(0);
  const [flashcards, setFlashcards] = useState<FlashcardSimple[]>([]);

  // 1. Buscar flashcards do banco (study_flashcards) vinculados à aula
  const { data: dbFlashcards, isLoading: isLoadingDB } = useQuery({
    queryKey: ['lesson-flashcards', lessonId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('study_flashcards')
        .select('id, question, answer, difficulty')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .limit(20);

      if (error) {
        console.error('Erro ao buscar flashcards:', error);
        return [];
      }

      // Converter para FlashcardSimple
      return (data || []).map(card => ({
        id: card.id,
        front: card.question,
        back: card.answer,
        difficulty: mapDifficulty(card.difficulty),
        lessonId,
      }));
    },
    enabled: !!user?.id && !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // 2. Buscar flashcards do cache IA
  const { data: aiFlashcards, isLoading: isLoadingAI } = useQuery({
    queryKey: ['lesson-ai-flashcards', lessonId],
    queryFn: async () => {
      const cached = await getCachedContent(lessonId, 'flashcards');
      if (cached?.content) {
        // Parsear conteúdo IA
        return parseAIFlashcards(cached.content);
      }
      return [];
    },
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 30, // 30 min
  });

  // Combinar flashcards: DB primeiro, depois IA, depois fallback
  useEffect(() => {
    const combined: FlashcardSimple[] = [];
    
    // Adicionar do banco
    if (dbFlashcards && dbFlashcards.length > 0) {
      combined.push(...dbFlashcards);
    }
    
    // Adicionar da IA (sem duplicatas)
    if (aiFlashcards && aiFlashcards.length > 0) {
      const existingIds = new Set(combined.map(c => c.id));
      aiFlashcards.forEach(card => {
        if (!existingIds.has(card.id)) {
          combined.push(card);
        }
      });
    }
    
    // Se não tem nada, usar fallback
    if (combined.length === 0) {
      combined.push(...FALLBACK_FLASHCARDS);
    }

    setFlashcards(combined);
  }, [dbFlashcards, aiFlashcards]);

  const isLoading = isLoadingDB || isLoadingAI;
  const card = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((knownCards.size) / flashcards.length) * 100 : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, flashcards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleKnown = useCallback(() => {
    if (card) {
      setKnownCards(prev => new Set([...prev, card.id]));
      handleNext();
    }
  }, [card, handleNext]);

  const handleNotKnown = useCallback(() => {
    if (card) {
      setKnownCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(card.id);
        return newSet;
      });
      handleNext();
    }
  }, [card, handleNext]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  }, []);

  const handleGenerateAI = useCallback(async () => {
    const content = await generateContent(lessonId, 'flashcards');
    if (content) {
      const newCards = parseAIFlashcards(content);
      if (newCards.length > 0) {
        setFlashcards(prev => [...prev, ...newCards]);
      }
    }
  }, [lessonId, generateContent]);

  const difficultyColors: Record<FlashcardDifficulty, string> = {
    easy: 'bg-green-500/10 text-green-500 border-green-500/30',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    hard: 'bg-red-500/10 text-red-500 border-red-500/30'
  };

  const difficultyLabels: Record<FlashcardDifficulty, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil'
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando flashcards...</p>
        </div>
      </div>
    );
  }

  // Empty state (mesmo com fallback, não deveria acontecer)
  if (!card || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Nenhum flashcard disponível</p>
        <Button onClick={handleGenerateAI} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Gerar com IA
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold">Flashcards</h3>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} de {flashcards.length} • {knownCards.size} memorizados
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGenerateAI}
            disabled={isGenerating}
            title="Gerar mais flashcards com IA"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{knownCards.size}/{flashcards.length} memorizados</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card Container */}
      <div className="relative h-[280px] perspective-1000">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={card.id + (isFlipped ? '-back' : '-front')}
            custom={direction}
            initial={{ 
              opacity: 0, 
              x: direction > 0 ? 100 : direction < 0 ? -100 : 0,
              rotateY: isFlipped ? 180 : 0 
            }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ 
              opacity: 0, 
              x: direction > 0 ? -100 : direction < 0 ? 100 : 0 
            }}
            transition={{ duration: 0.3 }}
            onClick={handleFlip}
            className={cn(
              "absolute inset-0 cursor-pointer",
              "rounded-2xl border-2 p-6",
              "flex flex-col items-center justify-center text-center",
              "transition-all duration-300",
              isFlipped 
                ? "bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/30" 
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            {/* Difficulty Badge */}
            <Badge 
              variant="outline" 
              className={cn("absolute top-4 right-4", difficultyColors[card.difficulty])}
            >
              {difficultyLabels[card.difficulty]}
            </Badge>

            {/* Card indicator */}
            <Badge variant="outline" className="absolute top-4 left-4">
              {isFlipped ? '📝 Resposta' : '❓ Pergunta'}
            </Badge>

            {/* Content */}
            <p className={cn(
              "text-lg font-medium leading-relaxed max-w-[90%]",
              isFlipped && "text-foreground"
            )}>
              {isFlipped ? card.back : card.front}
            </p>

            {/* Flip hint */}
            {!isFlipped && (
              <p className="absolute bottom-4 text-xs text-muted-foreground">
                Clique para ver a resposta
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Know/Don't Know buttons */}
        {isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Button 
              variant="outline" 
              onClick={handleNotKnown}
              className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <ThumbsDown className="h-4 w-4" />
              Não sei
            </Button>
            <Button 
              onClick={handleKnown}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="h-4 w-4" />
              Sei
            </Button>
          </motion.div>
        )}

        <Button 
          variant="outline" 
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* XP indicator */}
      <div className="flex justify-center">
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          +5 XP por card memorizado
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Mapeia difficulty numérica para string
 */
function mapDifficulty(value: number | null): FlashcardDifficulty {
  if (value === null || value === undefined) return 'medium';
  if (value < 0.4) return 'easy';
  if (value > 0.7) return 'hard';
  return 'medium';
}

/**
 * Parseia flashcards gerados pela IA
 */
function parseAIFlashcards(content: unknown): FlashcardSimple[] {
  try {
    // Se já é um array de cards
    if (Array.isArray(content)) {
      return content.map((item, idx) => ({
        id: `ai-${idx}-${Date.now()}`,
        front: item.front || item.question || item.pergunta || '',
        back: item.back || item.answer || item.resposta || '',
        difficulty: item.difficulty || 'medium',
      })).filter(c => c.front && c.back);
    }
    
    // Se é um objeto com cards
    if (typeof content === 'object' && content !== null) {
      const obj = content as Record<string, unknown>;
      if (Array.isArray(obj.cards)) {
        return parseAIFlashcards(obj.cards);
      }
      if (Array.isArray(obj.flashcards)) {
        return parseAIFlashcards(obj.flashcards);
      }
    }
    
    return [];
  } catch {
    console.error('Erro ao parsear flashcards IA:', content);
    return [];
  }
}

export default FlashcardsTab;
