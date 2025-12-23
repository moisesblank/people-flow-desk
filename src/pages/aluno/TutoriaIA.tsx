// ============================================
// TUTORIA IA - Full Page 2300
// Performance-first: lazy sections, GPU animations
// Mobile-first: 3G optimized
// ============================================

import { memo, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";
import { TutoriaHero } from "@/components/tutoria/TutoriaHero";
import { TutoriaModeSelector } from "@/components/tutoria/TutoriaModeSelector";
import { TutoriaChat } from "@/components/tutoria/TutoriaChat";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet";

type AIMode = "tutor" | "redacao" | "flashcards" | "cronograma";

// Minimal skeleton for 3G
const ChatSkeleton = memo(() => (
  <div className="h-[500px] md:h-[600px] rounded-2xl bg-ai-surface/50 border border-ai-border/50 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-holo-cyan/50 border-t-holo-cyan rounded-full animate-spin" />
  </div>
));
ChatSkeleton.displayName = "ChatSkeleton";

const TutoriaIA = memo(function TutoriaIA() {
  const ui = useFuturisticUI();
  const { user } = useAuth();
  const [mode, setMode] = useState<AIMode>("tutor");
  
  // Get user's first name
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || 
                   user?.email?.split("@")[0];
  
  // Container animation (GPU-only)
  const containerAnim = ui.shouldAnimate ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: ui.animationDuration(0.3) },
  } : {};
  
  return (
    <>
      <Helmet>
        <title>Tutor IA | Química ENEM - Prof. Moisés Medeiros</title>
        <meta name="description" content="Seu assistente de Química 24/7. Tire dúvidas, gere flashcards, corrija redações e monte cronogramas com IA." />
      </Helmet>
      
      <motion.div 
        className="container mx-auto px-4 py-6 space-y-6 max-w-4xl"
        {...containerAnim}
      >
        {/* Ambient FX - Top gradient (feature flag controlled) */}
        {ui.enableAmbient && (
          <div className="fixed top-0 left-0 right-0 h-40 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-holo-cyan/5 via-holo-purple/3 to-transparent" />
          </div>
        )}
        
        {/* Hero Section */}
        <TutoriaHero userName={userName} />
        
        {/* Mode Selector */}
        <motion.div
          initial={ui.shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={ui.shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Escolha o modo
          </h2>
          <TutoriaModeSelector selectedMode={mode} onModeChange={setMode} />
        </motion.div>
        
        {/* Chat Section */}
        <motion.div
          initial={ui.shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={ui.shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2 }}
        >
          <Suspense fallback={<ChatSkeleton />}>
            <TutoriaChat mode={mode} />
          </Suspense>
        </motion.div>
        
        {/* Footer info */}
        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={ui.shouldAnimate ? { opacity: 0 } : undefined}
          animate={ui.shouldAnimate ? { opacity: 1 } : undefined}
          transition={{ delay: 0.3 }}
        >
          Tutor IA treinado em conteúdo de Química ENEM • Respostas podem conter imprecisões
        </motion.p>
      </motion.div>
    </>
  );
});

TutoriaIA.displayName = "TutoriaIA";

export default TutoriaIA;
