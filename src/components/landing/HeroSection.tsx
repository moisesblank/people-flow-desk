// ============================================
// HERO SECTION ÉPICA 2500 - ULTRA FUTURISTA
// Impacto visual máximo + conversão
// ============================================

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, ChevronDown, ArrowRight, Rocket, Atom, 
  FlaskConical, Zap, Star, Sparkles, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMoises from "@/assets/logo-moises-medeiros.png";

// Partículas flutuantes no hero
const HeroParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          background: i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#1e40af' : '#fbbf24',
          boxShadow: `0 0 ${10 + Math.random() * 10}px currentColor`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.8, 0.3],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// Grid holográfico de fundo
const HolographicBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Grid principal */}
    <div 
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `
          linear-gradient(rgba(220, 38, 38, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 64, 175, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }}
    />
    
    {/* Ondas de energia */}
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 30% 30%, rgba(220, 38, 38, 0.2) 0%, transparent 50%)',
      }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 5, repeat: Infinity }}
    />
    
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 70% 70%, rgba(30, 64, 175, 0.2) 0%, transparent 50%)',
      }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1.1, 1, 1.1],
      }}
      transition={{ duration: 6, repeat: Infinity }}
    />
  </div>
);

// Badge animado futurista
const FuturisticBadge = () => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay: 0.3 }}
    className="relative inline-flex items-center gap-3"
  >
    {/* Glow de fundo */}
    <motion.div
      className="absolute -inset-2 rounded-full"
      style={{
        background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.3), rgba(30, 64, 175, 0.3))',
        filter: 'blur(15px)',
      }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    <div className="relative px-6 py-3 rounded-full bg-gradient-to-r from-red-900/50 to-blue-900/50 border border-red-500/40 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Atom className="w-5 h-5 text-red-400" />
        </motion.div>
        <span className="text-sm font-bold bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent tracking-wide">
          O CURSO QUE MAIS APROVA EM MEDICINA
        </span>
        <motion.div
          className="w-2 h-2 rounded-full bg-green-400"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
  </motion.div>
);

// Contador animado com estilo futurista
const FuturisticCounter = ({ value, label }: { value: string; label: string }) => (
  <motion.div
    className="relative group"
    whileHover={{ scale: 1.05, y: -2 }}
  >
    <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="text-2xl md:text-3xl font-black text-white">{value}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  </motion.div>
);

// Card do professor flutuante
const ProfessorCard = () => (
  <motion.div 
    className="absolute -bottom-4 -left-4 right-4 p-5 rounded-2xl bg-black/90 backdrop-blur-2xl border border-red-500/40"
    initial={{ opacity: 0, y: 50 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay: 1 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center gap-4">
      <motion.div 
        className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center"
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        <FlaskConical className="w-8 h-8 text-white" />
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <div>
        <div className="text-white font-bold text-lg">Prof. Moisés Medeiros</div>
        <div className="text-gray-400 text-sm">Mestre em Química • 15+ anos de experiência</div>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 text-amber-400" fill="currentColor" />
          ))}
          <span className="text-xs text-gray-500 ml-1">4.9/5</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export const HeroSection = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.9]);

  const [typedText, setTypedText] = useState("");
  const fullText = "Sua aprovação começa aqui!";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
      <HolographicBackground />
      <HeroParticles />
      
      <motion.div style={{ y, opacity, scale }} className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Coluna esquerda - Conteúdo */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <FuturisticBadge />
            
            {/* Headline principal */}
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.9] mt-8 mb-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-white block">{typedText.split('começa')[0]}</span>
              <motion.span 
                className="block mt-2"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #fbbf24 50%, #f59e0b 75%, #dc2626 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                começa aqui!
              </motion.span>
              <motion.span
                className="inline-block w-1 h-12 md:h-16 bg-red-500 ml-1"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              O método que já aprovou <span className="text-red-400 font-bold">mais de 10.000 alunos</span> em Medicina nas melhores universidades do Brasil.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link to="/auth">
                <motion.div 
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                  <Button 
                    size="lg" 
                    className="relative bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-2xl shadow-red-600/40 px-10 h-16 text-lg font-bold w-full sm:w-auto rounded-xl border-0"
                  >
                    <Rocket className="w-5 h-5 mr-2 animate-pulse" />
                    QUERO SER APROVADO
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
              
              <motion.a 
                href="#video" 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-gray-600 hover:border-red-500/60 bg-white/5 hover:bg-white/10 h-16 text-lg w-full sm:w-auto rounded-xl backdrop-blur-sm"
                >
                  <Play className="w-5 h-5 mr-2 text-red-400" />
                  Ver Aula Grátis
                </Button>
              </motion.a>
            </motion.div>

            {/* Mini stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <FuturisticCounter value="10.847+" label="Aprovados" />
              <FuturisticCounter value="98%" label="Aprovação" />
              <FuturisticCounter value="500+" label="Horas" />
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Garantia 30 dias</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Acesso imediato</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>IA integrada</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Coluna direita - Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative hidden lg:block"
          >
            {/* Glow de fundo */}
            <motion.div 
              className="absolute -inset-8"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.3) 0%, rgba(30, 64, 175, 0.2) 50%, transparent 70%)',
                filter: 'blur(60px)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            
            {/* Container do visual */}
            <motion.div 
              className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl"
              whileHover={{ scale: 1.01 }}
            >
              {/* Imagem ou placeholder visual futurista */}
              <div className="aspect-[4/5] relative">
                {/* Grid futurista interno */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(220, 38, 38, 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(30, 64, 175, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />
                
                {/* Logo centralizado */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      rotateY: [0, 5, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <motion.img 
                      src={logoMoises} 
                      alt="Moisés Medeiros"
                      className="w-64 md:w-80"
                      style={{
                        filter: 'drop-shadow(0 0 40px rgba(220, 38, 38, 0.5))',
                      }}
                      animate={{
                        filter: [
                          'drop-shadow(0 0 40px rgba(220, 38, 38, 0.5))',
                          'drop-shadow(0 0 60px rgba(220, 38, 38, 0.8))',
                          'drop-shadow(0 0 40px rgba(220, 38, 38, 0.5))',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
                
                {/* Anéis orbitais decorativos */}
                {[200, 280, 360].map((size, i) => (
                  <motion.div
                    key={size}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{
                      width: size,
                      height: size,
                      borderColor: i === 0 ? 'rgba(220, 38, 38, 0.3)' : i === 1 ? 'rgba(30, 64, 175, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                  />
                ))}
                
                {/* Gradiente de sobreposição */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
              </div>
              
              {/* Card do professor */}
              <ProfessorCard />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs text-gray-500 uppercase tracking-[0.3em]">Scroll</span>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </motion.div>
    </section>
  );
};
