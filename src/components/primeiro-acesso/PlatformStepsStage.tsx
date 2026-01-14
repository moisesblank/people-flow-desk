// ============================================
// ETAPA 1: PASSOS DA PLATAFORMA
// 6 passos obrigatórios para entender o sistema
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, 
  BookOpen, 
  FileQuestion, 
  ClipboardList, 
  Trophy, 
  CalendarCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PlatformStepsStageProps {
  onComplete: () => void;
}

// ============================================
// PASSOS REAIS DA PLATAFORMA - Áreas principais
// Cada passo representa uma seção real do portal
// ============================================
const PLATFORM_STEPS = [
  {
    id: 1,
    icon: Video,
    title: "Videoaulas",
    description: "Assista aulas completas organizadas por assunto. Use o player inteligente com velocidade ajustável e marque seu progresso automaticamente.",
    tip: "Acesse em /alunos/videoaulas — Clique em 'Minhas Aulas' no menu lateral",
    color: "from-purple-500 to-pink-500",
    route: "/alunos/videoaulas",
  },
  {
    id: 2,
    icon: BookOpen,
    title: "Materiais e Livros",
    description: "Biblioteca digital com PDFs, apostilas e livros interativos. Leia online com proteção anti-pirataria e faça anotações que ficam salvas.",
    tip: "Acesse em /alunos/materiais e /alunos/livro-web — Use os Flash Cards para revisar!",
    color: "from-blue-500 to-cyan-500",
    route: "/alunos/materiais",
  },
  {
    id: 3,
    icon: ClipboardList,
    title: "Simulados",
    description: "Faça simulados cronometrados estilo ENEM e vestibulares. Cada acerto vale XP e te coloca no ranking competitivo da plataforma!",
    tip: "Acesse em /alunos/simulados — Primeiro acerto em cada questão vale 10 XP",
    color: "from-orange-500 to-amber-500",
    route: "/alunos/simulados",
  },
  {
    id: 4,
    icon: FileQuestion,
    title: "Banco de Questões",
    description: "Pratique com milhares de questões organizadas por tema e dificuldade. Modo treino para evoluir sem pressão do tempo.",
    tip: "Acesse em /alunos/questoes — Modo treino não afeta seu ranking",
    color: "from-green-500 to-emerald-500",
    route: "/alunos/questoes",
  },
  {
    id: 5,
    icon: Trophy,
    title: "Ranking e XP",
    description: "Veja sua posição entre todos os alunos! Ganhe XP nos simulados, suba de nível e conquiste o pódio semanal ou global.",
    tip: "Acesse em /alunos/ranking — Quanto mais simulados, mais XP!",
    color: "from-yellow-500 to-orange-500",
    route: "/alunos/ranking",
  },
  {
    id: 6,
    icon: CalendarCheck,
    title: "Planejamento de Estudos",
    description: "Organize sua rotina com cronograma personalizado, tutoria e acesso rápido a todas as áreas. Seu hub central de estudos.",
    tip: "Acesse em /alunos/planejamento — É seu painel de controle!",
    color: "from-indigo-500 to-violet-500",
    route: "/alunos/planejamento",
  },
];

export function PlatformStepsStage({ onComplete }: PlatformStepsStageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = PLATFORM_STEPS[currentStep];
  const progress = ((currentStep + 1) / PLATFORM_STEPS.length) * 100;
  const isLastStep = currentStep === PLATFORM_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const Icon = step.icon;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Conheça a Plataforma
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Passo {currentStep + 1} de {PLATFORM_STEPS.length}
        </h2>
        <p className="text-muted-foreground">
          Veja o que você pode fazer aqui
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 mb-8"
        >
          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6`}>
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-foreground text-center mb-4">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-center text-lg mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Tip */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-primary text-center">
              💡 <span className="font-medium">Dica:</span> {step.tip}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step indicators - SEM CLIQUE, apenas visual */}
      <div className="flex justify-center gap-2 mb-8">
        {PLATFORM_STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-3 rounded-full transition-all ${
              index === currentStep
                ? 'bg-primary w-8'
                : index < currentStep
                ? 'bg-primary/50 w-3'
                : 'bg-muted w-3'
            }`}
            aria-label={`Passo ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <Button
          onClick={handleNext}
          className="gap-2 min-w-[140px]"
        >
          {isLastStep ? 'Continuar' : 'Próximo'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
