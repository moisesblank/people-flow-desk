// ============================================
// ETAPA 5: ONBOARDING COMPLETO - INSTRUÇÕES FINAIS
// Celebração e liberação da plataforma
// ============================================

import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Rocket, 
  PartyPopper, 
  ArrowRight,
  BookOpen,
  Video,
  MessageCircle,
  Award,
  Calendar,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingCompleteProps {
  onFinish: () => void;
}

const PLATFORM_FEATURES = [
  {
    icon: Video,
    title: "Videoaulas",
    description: "Acesse todas as aulas gravadas a qualquer momento",
  },
  {
    icon: BookOpen,
    title: "Materiais",
    description: "PDFs, livros e materiais complementares",
  },
  {
    icon: MessageCircle,
    title: "Comunidade",
    description: "Tire dúvidas e conecte-se com outros alunos",
  },
  {
    icon: Award,
    title: "Certificados",
    description: "Receba seu certificado ao completar os módulos",
  },
  {
    icon: Calendar,
    title: "Agenda",
    description: "Acompanhe lives e eventos exclusivos",
  },
  {
    icon: HelpCircle,
    title: "Suporte",
    description: "Equipe pronta para ajudar sempre que precisar",
  },
];

export function OnboardingComplete({ onFinish }: OnboardingCompleteProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-4">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
        className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
      >
        <CheckCircle className="w-10 h-10 text-green-500" />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <PartyPopper className="w-5 h-5 text-yellow-500" />
          <h2 className="text-2xl font-bold text-foreground">
            Tudo Pronto!
          </h2>
          <PartyPopper className="w-5 h-5 text-yellow-500 scale-x-[-1]" />
        </div>

        <p className="text-muted-foreground mb-6">
          Sua conta está configurada. Veja o que você pode fazer na plataforma:
        </p>
      </motion.div>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
      >
        {PLATFORM_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.08 }}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Checklist resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-muted/30 border border-border rounded-xl p-4 mb-6 text-left"
      >
        <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Configurações concluídas:
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Plataforma conhecida",
            "Tema personalizado",
            "Senha segura definida",
            "Dispositivo registrado",
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.08 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-2.5 h-2.5 text-green-500" />
              </div>
              {item}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <Button
          onClick={onFinish}
          size="lg"
          className="h-12 px-6 text-base gap-2"
        >
          <Rocket className="w-5 h-5" />
          Acessar Portal do Aluno
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-xs text-muted-foreground mt-6"
      >
        Bem-vindo! Bons estudos 🎓
      </motion.p>
    </div>
  );
}