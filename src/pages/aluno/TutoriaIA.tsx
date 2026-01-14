// ============================================
// TUTORIA IA - Full Page 2300
// Performance-first: lazy sections, GPU animations
// Mobile-first: 3G optimized
// ============================================

import { memo, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";
import { TutoriaHero } from "@/components/tutoria/TutoriaHero";
import { TutoriaModeSelector } from "@/components/tutoria/TutoriaModeSelector";
import { TutoriaChat } from "@/components/tutoria/TutoriaChat";
import { AmbientGlow } from "@/components/ui/ambient-glow";
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
        {/* Ambient FX - Controlled by feature flag */}
        <AmbientGlow variant="top" intensity="subtle" color="holo" />
        
        {/* Hero Section */}
        <TutoriaHero userName={userName} />
        
        {/* ══════════════════════════════════════════════════════════════
            GUIDANCE SECTION - Orientações para Leigos (Year 2300)
        ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={ui.shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={ui.shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-holo-cyan/30 bg-gradient-to-br from-holo-cyan/5 via-background to-holo-purple/5 p-5 shadow-xl shadow-holo-cyan/5"
        >
          {/* Efeitos holográficos */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-cyan/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-purple/30 to-transparent" />
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-holo-cyan/40 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-holo-cyan/40 rounded-tr-xl" />
          
          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-holo-cyan animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-holo-cyan/80">Como Usar o Tutor IA</span>
              <div className="flex-1 h-px bg-gradient-to-r from-holo-cyan/30 to-transparent" />
            </div>
            
            {/* 3 Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-holo-cyan/10 to-cyan-600/5 border border-holo-cyan/20 hover:border-holo-cyan/40 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-holo-cyan to-cyan-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-holo-cyan/30">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-holo-cyan flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Escolha o Modo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    <span className="text-cyan-300">Tutor</span> para dúvidas, <span className="text-cyan-300">Redação</span> para feedback, <span className="text-cyan-300">Flashcards</span> para memorização ou <span className="text-cyan-300">Cronograma</span> para planejar.
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 hover:border-green-400/40 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-500/30">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-green-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Pergunte ao Tutor
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Digite sua <span className="text-green-300">dúvida de Química</span> no campo abaixo ou clique nas <span className="text-green-300">sugestões rápidas</span> para começar.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-600/5 border border-purple-500/20 hover:border-purple-400/40 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/30">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-purple-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Aprenda e Pratique
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    A IA responde em segundos! Peça <span className="text-purple-300">questões de fixação</span>, <span className="text-purple-300">resumos</span> ou <span className="text-purple-300">explicações passo a passo</span>.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Dica extra */}
            <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-holo-cyan/10 border border-holo-cyan/20">
              <Lightbulb className="w-4 h-4 text-holo-cyan flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-holo-cyan">Dica:</span> O Tutor IA está disponível 24/7 e é treinado especialmente para Química ENEM. Use sem moderação! 🚀
              </p>
            </div>
          </div>
        </motion.div>
        
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
