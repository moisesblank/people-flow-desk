// ============================================
// 📚 FLASHCARDS TUTORIAL - Onboarding Year 2300
// Guia interativo para o sistema de Flashcards FSRS
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  RotateCcw,
  Zap,
  Target,
  Clock,
  ChartBar,
  BookOpen,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface FlashcardsTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'Bem-vindo ao Oráculo da Memória',
    subtitle: 'Sistema de Flashcards com Inteligência Artificial',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    content: [
      'Os flashcards usam o algoritmo FSRS (Free Spaced Repetition Scheduler) — a mesma tecnologia do Anki, só que turbinada.',
      'O sistema aprende o SEU ritmo de memorização e otimiza automaticamente quando você deve revisar cada card.'
    ],
    tip: '🧠 A repetição espaçada aumenta a retenção de longo prazo em até 200%!'
  },
  {
    id: 'how-it-works',
    title: 'Como Funciona?',
    subtitle: 'O ciclo de aprendizado perfeito',
    icon: RotateCcw,
    color: 'from-cyan-500 to-blue-600',
    content: [
      '1️⃣ Você vê a PERGUNTA e tenta lembrar a resposta',
      '2️⃣ Clica para REVELAR e confere se acertou',
      '3️⃣ Avalia sua resposta: Esqueci, Difícil, Bom ou Fácil',
      '4️⃣ O algoritmo calcula quando você deve revisar novamente'
    ],
    tip: '💡 Quanto mais fácil for lembrar, mais tempo até a próxima revisão!'
  },
  {
    id: 'ratings',
    title: 'Os 4 Botões de Avaliação',
    subtitle: 'Cada botão afeta o agendamento de forma diferente',
    icon: Target,
    color: 'from-amber-500 to-orange-600',
    content: [
      '😓 ESQUECI → Revisa em menos de 1 minuto (o card "volta" para o início)',
      '😅 DIFÍCIL → Revisa em ~1 dia (lembrou, mas com dificuldade)',
      '😊 BOM → Revisa em ~3 dias (lembrou bem!)',
      '🤩 FÁCIL → Revisa em ~7+ dias (lembrou instantaneamente)'
    ],
    tip: '⚠️ Seja honesto! Marcar "Fácil" quando não foi pode prejudicar sua memória.'
  },
  {
    id: 'modes',
    title: 'Modos de Estudo',
    subtitle: 'Escolha o modo ideal para cada momento',
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    content: [
      '📅 REVISÃO DIÁRIA → Cards agendados pelo algoritmo (recomendado!)',
      '📚 FLASHCARDS PRONTOS → +620 cards prontos para estudar',
      '⚡ MODO CRAM → Revise todos de uma vez (véspera de prova)'
    ],
    tip: '🎯 A Revisão Diária é o modo mais eficiente para memória de longo prazo.'
  },
  {
    id: 'stats',
    title: 'Estatísticas FSRS',
    subtitle: 'Acompanhe sua evolução em tempo real',
    icon: ChartBar,
    color: 'from-pink-500 to-rose-600',
    content: [
      '📊 TAXA DE RETENÇÃO → Porcentagem de acertos (meta: 85-95%)',
      '🔥 STREAK → Dias consecutivos estudando',
      '📈 PREVISÃO → Quantos cards terá para revisar nos próximos dias',
      '🗓️ HEATMAP → Visualize sua consistência de estudo'
    ],
    tip: '🏆 As estatísticas ficam abertas por padrão para você acompanhar!'
  },
  {
    id: 'create',
    title: 'Crie Seus Próprios Cards',
    subtitle: 'Personalize seu aprendizado',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    content: [
      '✏️ Clique em "Criar Flashcard" para adicionar seus próprios cards',
      '🎨 Adicione imagens, fórmulas e formatação',
      '🏷️ Organize por tags e macros de Química'
    ],
    tip: '✨ Cards criados por você são mais fáceis de lembrar!'
  }
];

export function FlashcardsTutorial({ onComplete, onSkip, className }: FlashcardsTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const Icon = step.icon;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 100 : -100, opacity: 0 })
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl',
        'shadow-2xl shadow-primary/10',
        className
      )}
    >
      {/* Background gradient */}
      <div className={cn(
        'absolute inset-0 opacity-10 bg-gradient-to-br',
        step.color
      )} />

      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
        aria-label="Pular tutorial"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {TUTORIAL_STEPS.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              idx === currentStep 
                ? 'w-6 bg-primary' 
                : idx < currentStep 
                  ? 'bg-primary/50' 
                  : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative px-6 pb-6 pt-2 min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={cn(
                  'inline-flex p-4 rounded-2xl bg-gradient-to-br',
                  step.color
                )}
              >
                <Icon className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
                <p className="text-muted-foreground text-sm">{step.subtitle}</p>
              </div>
            </div>

            {/* Content list */}
            <motion.ul className="space-y-3">
              {step.content.map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{item}</span>
                </motion.li>
              ))}
            </motion.ul>

            {/* Tip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20"
            >
              <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-primary/90 font-medium">{step.tip}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-muted/20">
        <Button
          variant="ghost"
          onClick={goPrev}
          disabled={isFirst}
          className={cn(isFirst && 'invisible')}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentStep + 1} de {TUTORIAL_STEPS.length}
        </span>

        <Button
          onClick={goNext}
          className={cn(
            'bg-gradient-to-r hover:opacity-90 transition-opacity',
            step.color
          )}
        >
          {isLast ? (
            <>
              Começar!
              <GraduationCap className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export default FlashcardsTutorial;
