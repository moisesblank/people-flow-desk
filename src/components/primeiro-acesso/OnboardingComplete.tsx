// ============================================
// ONBOARDING COMPLETO - TELA FINAL
// Celebração e liberação da plataforma
// ============================================

import { motion } from "framer-motion";
import { CheckCircle, Rocket, PartyPopper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
interface OnboardingCompleteProps {
  onFinish: () => void;
}

export function OnboardingComplete({ onFinish }: OnboardingCompleteProps) {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
        className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-500" />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <PartyPopper className="w-6 h-6 text-yellow-500" />
          <h2 className="text-3xl font-bold text-foreground">
            Tudo Pronto!
          </h2>
          <PartyPopper className="w-6 h-6 text-yellow-500 scale-x-[-1]" />
        </div>

        <p className="text-lg text-muted-foreground mb-8">
          Sua conta está configurada e pronta para uso. 
          Agora você tem acesso completo à plataforma!
        </p>
      </motion.div>

      {/* Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-6 mb-8 text-left"
      >
        <h3 className="font-semibold text-foreground mb-4">
          O que foi configurado:
        </h3>
        <div className="space-y-3">
          {[
            "Você conheceu os recursos da plataforma",
            "Tema visual personalizado",
            "Senha segura definida",
            "Dispositivo de acesso configurado",
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-3 text-sm"
            >
              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              </div>
              <span className="text-muted-foreground">{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={onFinish}
          size="lg"
          className="h-14 px-8 text-lg gap-3"
        >
          <Rocket className="w-5 h-5" />
          Acessar a Plataforma
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs text-muted-foreground mt-8"
      >
        Bem-vindo! Bons estudos 🎓
      </motion.p>
    </div>
  );
}
