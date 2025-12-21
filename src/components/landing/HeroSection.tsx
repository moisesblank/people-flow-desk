// ============================================
// HERO SECTION ÉPICA 2500 - ULTRA PERFORMANCE
// Otimizado para máxima performance
// ============================================

import { useState, useEffect, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, ChevronDown, ArrowRight, Rocket, Atom, 
  FlaskConical, Zap, Star, Sparkles, Shield, 
  Trophy, Users, BookOpen, Crown, Target, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMoises from "@/assets/logo-moises-medeiros.png";

// Partículas ESTÁTICAS - sem animação JS, apenas CSS
const HeroParticles = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#dc2626', '#1e40af', '#fbbf24'][i % 3],
      size: Math.random() * 3 + 2,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: 0.4,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
});

HeroParticles.displayName = 'HeroParticles';

// Grid holográfico ESTÁTICO - sem animação JS
const HolographicBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Grid principal com perspectiva */}
    <div 
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `
          linear-gradient(rgba(220, 38, 38, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 64, 175, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        transform: 'perspective(1000px) rotateX(60deg)',
        transformOrigin: 'center bottom',
      }}
    />
    
    {/* Gradientes estáticos */}
    <div
      className="absolute inset-0 opacity-20"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)',
      }}
    />
    
    <div
      className="absolute inset-0 opacity-15"
      style={{
        background: 'radial-gradient(ellipse at 80% 80%, rgba(30, 64, 175, 0.3) 0%, transparent 50%)',
      }}
    />
  </div>
));

HolographicBackground.displayName = 'HolographicBackground';

// Badge animado futurista ultra premium
const FuturisticBadge = () => (
  <motion.div 
    initial={{ opacity: 0, y: 30, scale: 0.9 }} 
    animate={{ opacity: 1, y: 0, scale: 1 }} 
    transition={{ delay: 0.3, type: "spring" }}
    className="relative inline-flex items-center gap-3"
  >
    {/* Glow pulsante de fundo */}
    <motion.div
      className="absolute -inset-3 rounded-full"
      style={{
        background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.4), rgba(251, 191, 36, 0.4), rgba(30, 64, 175, 0.4))',
        filter: 'blur(20px)',
      }}
      animate={{ 
        opacity: [0.4, 0.8, 0.4],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    <div className="relative px-8 py-4 rounded-full bg-gradient-to-r from-red-900/60 via-amber-900/40 to-blue-900/60 border border-red-500/50 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center gap-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Atom className="w-6 h-6 text-red-400" />
        </motion.div>
        <span className="text-base font-black bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent tracking-wide">
          O CURSO QUE MAIS APROVA EM MEDICINA
        </span>
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <motion.div
            className="absolute inset-0 rounded-full bg-green-400"
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </div>
  </motion.div>
);

// Contador animado com estilo futurista épico
const EpicCounter = ({ value, label, icon: Icon, gradient, glow }: { 
  value: string; 
  label: string; 
  icon: any;
  gradient: string;
  glow: string;
}) => (
  <motion.div
    className="relative group cursor-pointer"
    whileHover={{ scale: 1.05, y: -3 }}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring" }}
  >
    {/* Glow de fundo */}
    <motion.div 
      className="absolute -inset-1 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity"
      style={{ background: glow }}
    />
    
    <div className="relative p-3 md:p-4 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-xl group-hover:border-white/20 transition-all">
      <motion.div 
        className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${gradient} mb-2 md:mb-3`}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ boxShadow: `0 8px 30px ${glow}` }}
      >
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </motion.div>
      <div className="text-2xl md:text-3xl font-black text-white mb-0.5">{value}</div>
      <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  </motion.div>
);

// Card do professor flutuante premium
const ProfessorCard = () => (
  <motion.div 
    className="absolute -bottom-6 -left-6 right-6 p-6 rounded-3xl bg-black/95 backdrop-blur-3xl border border-red-500/50 shadow-2xl shadow-red-500/20"
    initial={{ opacity: 0, y: 60, scale: 0.9 }} 
    animate={{ opacity: 1, y: 0, scale: 1 }} 
    transition={{ delay: 1, type: "spring" }}
    whileHover={{ scale: 1.02, y: -3 }}
  >
    <div className="flex items-center gap-5">
      <motion.div 
        className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center"
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
        style={{ boxShadow: '0 15px 50px rgba(220, 38, 38, 0.4)' }}
      >
        <FlaskConical className="w-10 h-10 text-white" />
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 border-3 border-black flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <CheckCircle className="w-4 h-4 text-white" />
        </motion.div>
      </motion.div>
      <div className="flex-1">
        <div className="text-white font-black text-xl">Prof. Moisés Medeiros</div>
        <div className="text-gray-400 text-sm mb-2">Mestre em Química • 15+ anos de experiência</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
            ))}
          </div>
          <span className="text-sm text-amber-400 font-bold">4.9/5</span>
          <span className="text-xs text-gray-500">(2.847 avaliações)</span>
        </div>
      </div>
    </div>
    
    {/* Badges de conquistas */}
    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
        <Crown className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-amber-400 font-bold">#1 Brasil</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
        <Trophy className="w-4 h-4 text-green-400" />
        <span className="text-xs text-green-400 font-bold">10.847+ Aprovados</span>
      </div>
    </div>
  </motion.div>
);

// Anéis orbitais ESTÁTICOS - sem animação pesada
const OrbitalRings = memo(() => (
  <>
    {[220, 300].map((size, i) => (
      <div
        key={size}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          border: `${2 - i * 0.5}px solid ${i === 0 ? 'rgba(220, 38, 38, 0.3)' : 'rgba(30, 64, 175, 0.2)'}`,
        }}
      />
    ))}
  </>
));

OrbitalRings.displayName = 'OrbitalRings';

export const HeroSection = memo(() => {
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
    }, 70);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { value: "10.847+", label: "Aprovados", icon: Trophy, gradient: "from-red-600 to-red-700", glow: "rgba(220, 38, 38, 0.4)" },
    { value: "98%", label: "Aprovação", icon: Target, gradient: "from-amber-500 to-amber-600", glow: "rgba(245, 158, 11, 0.4)" },
    { value: "500+", label: "Horas", icon: BookOpen, gradient: "from-blue-600 to-blue-700", glow: "rgba(37, 99, 235, 0.4)" },
  ];

  return (
    <section className="relative min-h-[100svh] flex items-center pt-20 md:pt-24 pb-8 md:pb-16 overflow-hidden">
      <HolographicBackground />
      <HeroParticles />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Coluna esquerda - Conteúdo */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, type: "spring" }}
            className="text-center lg:text-left"
          >
            <FuturisticBadge />
            
            {/* Headline principal épica */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] mt-6 md:mt-10 mb-6 md:mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <span className="text-white block drop-shadow-2xl">{typedText.split('começa')[0]}</span>
              <motion.span 
                className="block mt-2 md:mt-3"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 20%, #fbbf24 50%, #f59e0b 70%, #dc2626 100%)',
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
                className="inline-block w-1 h-10 md:h-16 bg-gradient-to-b from-red-500 to-amber-500 ml-2 rounded-full"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              O método que já aprovou <span className="text-red-400 font-black">mais de 10.000 alunos</span> em Medicina nas melhores universidades do Brasil.
            </motion.p>

            {/* CTAs épicos */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start mb-8 md:mb-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link to="/auth">
                <motion.div 
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative group"
                >
                  <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-xl blur-md"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <Button 
                    size="lg" 
                    className="relative bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-xl shadow-red-600/40 px-6 md:px-10 h-12 md:h-14 text-sm md:text-base font-black w-full sm:w-auto rounded-xl border-0"
                  >
                    <Rocket className="w-5 h-5 mr-2 animate-bounce" />
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
                  className="border-2 border-gray-600 hover:border-red-500/60 bg-white/5 hover:bg-white/10 h-12 md:h-14 text-sm md:text-base w-full sm:w-auto rounded-xl backdrop-blur-sm px-6 md:px-8"
                >
                  <motion.div
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-red-500/20 flex items-center justify-center mr-2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="w-4 h-4 text-red-400" fill="currentColor" />
                  </motion.div>
                  Ver Aula Grátis
                </Button>
              </motion.a>
            </motion.div>

            {/* Mini stats épicos */}
            <motion.div 
              className="grid grid-cols-3 gap-2 md:gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              {stats.map((stat, i) => (
                <EpicCounter key={stat.label} {...stat} />
              ))}
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 mt-6 md:mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {[
                { icon: Shield, label: "Garantia 30 dias", color: "text-green-400" },
                { icon: Zap, label: "Acesso imediato", color: "text-amber-400" },
                { icon: Sparkles, label: "IA integrada", color: "text-purple-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Coluna direita - Visual épico */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" }}
            className="relative hidden lg:block"
          >
            {/* Glow de fundo massivo */}
            <motion.div 
              className="absolute -inset-16"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.4) 0%, rgba(30, 64, 175, 0.3) 50%, transparent 70%)',
                filter: 'blur(80px)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            
            {/* Container do visual principal */}
            <motion.div 
              className="relative rounded-[40px] overflow-hidden border-2 border-white/10 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-3xl"
              whileHover={{ scale: 1.01 }}
              style={{ boxShadow: '0 50px 100px rgba(220, 38, 38, 0.2)' }}
            >
              {/* Imagem ou placeholder visual futurista */}
              <div className="aspect-[4/5] relative">
                {/* Grid futurista interno */}
                <div 
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(220, 38, 38, 0.4) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(30, 64, 175, 0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: '35px 35px',
                  }}
                />
                
                {/* Logo centralizado com efeitos */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      y: [0, -15, 0],
                      rotateY: [0, 5, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="relative"
                  >
                    {/* Glow atrás do logo */}
                    <motion.div
                      className="absolute -inset-20 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.5) 0%, transparent 60%)',
                        filter: 'blur(40px)',
                      }}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    
                    <motion.img 
                      src={logoMoises} 
                      alt="Moisés Medeiros"
                      className="w-72 md:w-96 relative z-10"
                      animate={{
                        filter: [
                          'drop-shadow(0 0 40px rgba(220, 38, 38, 0.6))',
                          'drop-shadow(0 0 80px rgba(220, 38, 38, 0.9))',
                          'drop-shadow(0 0 40px rgba(220, 38, 38, 0.6))',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
                
                {/* Anéis orbitais decorativos */}
                <OrbitalRings />
                
                {/* Gradiente de sobreposição */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              </div>
              
              {/* Card do professor */}
              <ProfessorCard />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator épico */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2"
          style={{ boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}
        >
          <motion.div
            className="w-1.5 h-3 rounded-full bg-gradient-to-b from-red-500 to-amber-500"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <span className="text-xs text-gray-500 uppercase tracking-[0.4em]">Scroll</span>
      </motion.div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';
