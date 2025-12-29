// ============================================
// ETAPA 1: PASSOS DA PLATAFORMA
// 6 passos obrigatórios para entender o sistema
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Video, 
  MessageSquare, 
  Trophy, 
  Users, 
  Shield,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PlatformStepsStageProps {
  onComplete: () => void;
}

const PLATFORM_STEPS = [
  {
    id: 1,
    icon: BookOpen,
    title: "Materiais de Estudo",
    description: "Acesse livros digitais, apostilas e materiais exclusivos organizados por tema. Tudo pensado para otimizar seu aprendizado.",
    tip: "Use os filtros para encontrar conteúdos específicos",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    icon: Video,
    title: "Videoaulas",
    description: "Assista às aulas gravadas no seu ritmo. Marque como assistida, faça anotações e acompanhe seu progresso.",
    tip: "Você pode ajustar a velocidade de reprodução",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    icon: MessageSquare,
    title: "Suporte e Dúvidas",
    description: "Tire suas dúvidas diretamente com nossa equipe via WhatsApp ou através do chat da plataforma.",
    tip: "Respostas em até 24 horas úteis",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: 4,
    icon: Trophy,
    title: "Sistema de Progresso",
    description: "Ganhe XP, suba de nível e desbloqueie conquistas conforme avança nos estudos. Acompanhe sua evolução!",
    tip: "Cada aula concluída vale pontos de experiência",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: 5,
    icon: Users,
    title: "Comunidade",
    description: "Participe da nossa comunidade exclusiva, interaja com outros alunos e compartilhe experiências.",
    tip: "Networking é parte do aprendizado",
    color: "from-red-500 to-rose-500",
  },
  {
    id: 6,
    icon: Shield,
    title: "Segurança da Conta",
    description: "Sua conta está protegida com autenticação em duas etapas. Mantenha seus dados de acesso sempre seguros.",
    tip: "Nunca compartilhe sua senha com ninguém",
    color: "from-indigo-500 to-violet-500",
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
