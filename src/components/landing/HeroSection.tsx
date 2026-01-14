// ============================================
// HERO SECTION 2500 - ULTRA PERFORMANCE
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, ArrowRight, Rocket, Atom, 
  Zap, Star, Shield, Trophy, BookOpen, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePerformance } from "@/hooks/usePerformance";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

// ============================================
// BACKGROUND ESTÁTICO - Zero animações pesadas
// ============================================
const HeroBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
    
    {/* Grid holográfico estático */}
    <div 
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `
          linear-gradient(rgba(220, 38, 38, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 64, 175, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
    
    {/* Orbes estáticos */}
    <div
      className="absolute -left-32 top-1/4 w-[400px] h-[400px] rounded-full opacity-30"
      style={{
        background: "radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, transparent 70%)",
        filter: "blur(60px)",
      }}
    />
    <div
      className="absolute -right-32 bottom-1/4 w-[300px] h-[300px] rounded-full opacity-25"
      style={{
        background: "radial-gradient(circle, rgba(30, 64, 175, 0.4) 0%, transparent 70%)",
        filter: "blur(60px)",
      }}
    />
  </div>
));

HeroBackground.displayName = "HeroBackground";

// ============================================
// STAT CARD SIMPLES - Sem animações pesadas
// ============================================
const StatCard = memo(({ value, label, icon: Icon, gradient }: {
  value: string;
  label: string;
  icon: any;
  gradient: string;
}) => (
  <div className="relative p-3 md:p-4 rounded-xl bg-white/[0.06] border border-white/10 text-center hover:bg-white/[0.1] transition-colors">
    <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${gradient} mb-2`}>
      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
    </div>
    <div className="text-xl md:text-2xl font-black text-white">{value}</div>
    <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">{label}</div>
  </div>
));

StatCard.displayName = "StatCard";

// ============================================
// BADGE PRINCIPAL
// ============================================
const HeroBadge = memo(({ animate }: { animate: boolean }) => {
  if (!animate) {
    return (
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-red-900/50 to-blue-900/50 border border-red-500/30">
        <Atom className="w-5 h-5 text-red-400" />
        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
          O CURSO QUE MAIS APROVA EM MEDICINA
        </span>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-red-900/50 to-blue-900/50 border border-red-500/30"
    >
      <Atom className="w-5 h-5 text-red-400" />
      <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
        O CURSO QUE MAIS APROVA EM MEDICINA
      </span>
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
    </motion.div>
  );
});

HeroBadge.displayName = "HeroBadge";

// ============================================
// HERO SECTION PRINCIPAL
// ============================================
export const HeroSection = memo(() => {
  const { isMobile, disableAnimations } = usePerformance();
  const { gpuAnimationProps, shouldAnimate, throttle } = useQuantumReactivity();
  const [typedText, setTypedText] = useState("");
  const fullText = "Sua aprovação começa aqui!";

  // Efeito de digitação - mais rápido em mobile
  useEffect(() => {
    if (disableAnimations) {
      setTypedText(fullText);
      return;
    }

    let i = 0;
    const speed = isMobile ? 50 : 70;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [isMobile, disableAnimations]);

  const stats = [
    { value: "10.847+", label: "Aprovados", icon: Trophy, gradient: "from-red-600 to-red-700" },
    { value: "98%", label: "Aprovação", icon: Target, gradient: "from-amber-500 to-amber-600" },
    { value: "500+", label: "Horas", icon: BookOpen, gradient: "from-blue-600 to-blue-700" },
  ];

  const trustItems = [
    { icon: Shield, label: "Garantia 30 dias", color: "text-green-400" },
    { icon: Zap, label: "Acesso imediato", color: "text-amber-400" },
    { icon: Star, label: "4.9/5 avaliações", color: "text-purple-400" },
  ];

  // Versão sem animações para 3G/mobile lento
  if (disableAnimations) {
    return (
      <section className="relative min-h-[100svh] flex items-center pt-20 pb-8 overflow-hidden">
        <HeroBackground />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <HeroBadge animate={false} />
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mt-6 mb-6">
              <span className="text-white">{fullText.split("começa")[0]}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-red-500">
                começa aqui!
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              O método que já aprovou <span className="text-red-400 font-bold">mais de 10.000 alunos</span> em Medicina.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 h-12 font-bold w-full sm:w-auto">
                  <Rocket className="w-5 h-5 mr-2" />
                  QUERO SER APROVADO
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#video">
                <Button size="lg" variant="outline" className="border-gray-600 bg-white/5 h-12 w-full sm:w-auto">
                  <Play className="w-4 h-4 mr-2 text-red-400" />
                  Ver Aula Grátis
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Versão com animações suaves
  return (
    <section className="relative min-h-[100svh] flex items-center pt-20 md:pt-24 pb-8 md:pb-16 overflow-hidden">
      <HeroBackground />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center lg:text-left lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          
          {/* Conteúdo principal - GPU-ONLY animation */}
          <motion.div
            {...gpuAnimationProps.fadeUp}
            className="text-center lg:text-left"
          >
            <HeroBadge animate={true} />
            
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mt-6 md:mt-8 mb-6">
              <span className="text-white block">{typedText.split("começa")[0]}</span>
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-red-500">
                começa aqui!
              </span>
              {shouldAnimate && (
                <motion.span
                  className="inline-block w-1 h-10 md:h-14 bg-gradient-to-b from-red-500 to-amber-500 ml-1 rounded-full will-change-transform transform-gpu"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </h1>

            {/* Subheadline - GPU-ONLY */}
            <motion.p
              {...gpuAnimationProps.fadeIn}
              className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              O método que já aprovou <span className="text-red-400 font-black">mais de 10.000 alunos</span> em Medicina nas melhores universidades do Brasil.
            </motion.p>

            {/* CTAs - GPU-ONLY */}
            <motion.div
              {...gpuAnimationProps.fadeUp}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start mb-8"
            >
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 px-6 md:px-10 h-12 md:h-14 font-black w-full sm:w-auto hover:shadow-red-600/50 transition-shadow"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  QUERO SER APROVADO
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#video">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-600 hover:border-red-500/50 bg-white/5 hover:bg-white/10 h-12 md:h-14 w-full sm:w-auto"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-2">
                    <Play className="w-4 h-4 text-red-400" fill="currentColor" />
                  </div>
                  Ver Aula Grátis
                </Button>
              </a>
            </motion.div>

            {/* Stats - GPU-ONLY */}
            <motion.div
              {...gpuAnimationProps.fadeIn}
              className="grid grid-cols-3 gap-2 md:gap-4 mb-6"
            >
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </motion.div>

            {/* Trust indicators - GPU-ONLY */}
            <motion.div
              {...gpuAnimationProps.fadeIn}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6"
            >
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual lateral - GPU-ONLY slideIn */}
          <motion.div
            {...gpuAnimationProps.slideIn}
            className="hidden lg:block relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-gray-900/80 to-black/80 aspect-[4/5]">
              {/* Foto do Professor */}
              <img 
                src="/professor-moises-novo.png" 
                alt="Professor Moisés Medeiros" 
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="lazy"
              />
              
              {/* Grid de fundo */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(220, 38, 38, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(30, 64, 175, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: "30px 30px",
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - GPU-ONLY transform */}
      {shouldAnimate && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 will-change-transform transform-gpu"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <motion.div
              className="w-1 h-2 bg-red-500 rounded-full will-change-transform transform-gpu"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}
    </section>
  );
});

HeroSection.displayName = "HeroSection";
