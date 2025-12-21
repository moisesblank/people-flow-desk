// ============================================
// MOISÉS MEDEIROS v25.0 - LANDING PAGE ÉPICA 2500
// ABERTURA CINEMATOGRÁFICA DISNEY/AVENGERS
// Centro Educacional Futurista Ultimate
// Spider-Man Theme: Vermelho Vinho + Azul
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Play, ChevronRight, Star, Zap, BookOpen, Video, MessageCircle, Check,
  ArrowRight, Sparkles, GraduationCap, Clock, Award, Brain, Atom,
  FlaskConical, ChevronDown, Menu, X, Trophy, Users, Target, Rocket,
  Shield, Crown, Heart, ExternalLink, Phone, Youtube, Instagram,
  Download, Smartphone, Globe, Headphones, FileText, BarChart3,
  Lightbulb, Beaker, TestTube, Volume2, VolumeX, MousePointer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Assets
import logoMoises from "@/assets/logo-moises-medeiros.png";
import arteAprovados from "@/assets/arte-aprovados.png";
import professorPalco from "@/assets/professor-palco.jpg";
import professorHero from "@/assets/professor-moises-hero.jpg";

// ============================================
// ABERTURA CINEMATOGRÁFICA DISNEY/AVENGERS
// ============================================

const CinematicIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [skipVisible, setSkipVisible] = useState(false);
  
  useEffect(() => {
    // Mostrar botão de pular após 1s
    const skipTimer = setTimeout(() => setSkipVisible(true), 1000);
    
    // Timeline da animação
    const timers = [
      setTimeout(() => setPhase(1), 500),    // Fade in partículas
      setTimeout(() => setPhase(2), 2000),   // Logo surge
      setTimeout(() => setPhase(3), 4000),   // Logo brilha
      setTimeout(() => setPhase(4), 5500),   // Texto aparece
      setTimeout(() => setPhase(5), 7000),   // Flash final
      setTimeout(() => onComplete(), 8000),  // Fim
    ];
    
    return () => {
      clearTimeout(skipTimer);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 5 ? 0 : 1 }}
      transition={{ duration: 1 }}
    >
      {/* Partículas Épicas */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#991b1b' : i % 3 === 1 ? '#1e40af' : '#fbbf24',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: phase >= 1 ? [0, 0.8, 0] : 0, 
              scale: phase >= 1 ? [0, 1.5, 0] : 0,
              y: phase >= 1 ? [0, -200] : 0
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Anéis Girando (Estilo Disney) */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full border border-red-500/30"
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ 
          scale: phase >= 2 ? 1 : 0, 
          rotate: phase >= 2 ? 360 : 0,
          opacity: phase >= 2 ? 0.5 : 0
        }}
        transition={{ duration: 3, ease: "easeOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full border border-blue-500/30"
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ 
          scale: phase >= 2 ? 1 : 0, 
          rotate: phase >= 2 ? -360 : 0,
          opacity: phase >= 2 ? 0.5 : 0
        }}
        transition={{ duration: 3, ease: "easeOut", delay: 0.2 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full border-2 border-amber-500/40"
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ 
          scale: phase >= 2 ? 1 : 0, 
          rotate: phase >= 2 ? 180 : 0,
          opacity: phase >= 2 ? 0.6 : 0
        }}
        transition={{ duration: 2.5, ease: "easeOut", delay: 0.4 }}
      />

      {/* Logo Central - Surge Épica */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0, opacity: 0, y: 50 }}
        animate={{ 
          scale: phase >= 2 ? 1 : 0, 
          opacity: phase >= 2 ? 1 : 0,
          y: phase >= 2 ? 0 : 50
        }}
        transition={{ 
          duration: 1.5, 
          type: "spring", 
          stiffness: 100,
          damping: 15
        }}
      >
        {/* Glow Atrás da Logo */}
        <motion.div
          className="absolute inset-0 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(153, 27, 27, 0.6) 0%, transparent 70%)'
          }}
          animate={{
            scale: phase >= 3 ? [1, 1.3, 1] : 1,
            opacity: phase >= 3 ? [0.6, 1, 0.6] : 0.6
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Logo */}
        <motion.img
          src={logoMoises}
          alt="Moisés Medeiros"
          className="w-80 md:w-96 relative z-10"
          animate={{
            filter: phase >= 3 ? [
              'brightness(1) drop-shadow(0 0 20px rgba(153, 27, 27, 0.5))',
              'brightness(1.3) drop-shadow(0 0 60px rgba(153, 27, 27, 0.8))',
              'brightness(1) drop-shadow(0 0 20px rgba(153, 27, 27, 0.5))'
            ] : 'brightness(1)'
          }}
          transition={{ duration: 1.5, repeat: phase >= 3 && phase < 5 ? Infinity : 0 }}
        />

        {/* Tagline */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 20 }}
          transition={{ duration: 0.8 }}
        >
          <motion.p 
            className="text-2xl md:text-3xl font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            O CURSO QUE MAIS APROVA
          </motion.p>
          <motion.p
            className="text-lg text-gray-400 mt-2 tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 4 ? 1 : 0 }}
            transition={{ delay: 0.3 }}
          >
            EM QUÍMICA NO BRASIL
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Flash Final */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 5 ? [0, 1, 0] : 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Botão Pular */}
      <AnimatePresence>
        {skipVisible && phase < 5 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
            className="absolute bottom-8 right-8 px-6 py-2 text-sm text-gray-500 hover:text-white border border-gray-700 hover:border-red-500/50 rounded-full transition-all bg-black/50 backdrop-blur-sm"
          >
            Pular Intro →
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================
// PARTÍCULAS CYBER MELHORADAS
// ============================================
const EnhancedParticles = () => {
  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    color: i % 4 === 0 ? '#991b1b' : i % 4 === 1 ? '#1e40af' : i % 4 === 2 ? '#fbbf24' : '#7c3aed'
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-[0.5px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`
          }}
          animate={{
            y: [0, -150, 0],
            x: [0, Math.random() * 60 - 30, 0],
            opacity: [0.1, 0.7, 0.1],
            scale: [1, 1.8, 1]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// BACKGROUND ANIMADO ULTRA
// ============================================
const UltraBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Base */}
    <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
    
    {/* Grid Holográfico */}
    <div 
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(153, 27, 27, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 64, 175, 0.2) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px'
      }}
    />
    
    {/* Orbe Vermelho */}
    <motion.div 
      className="absolute -left-40 top-1/4 w-[900px] h-[900px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(153, 27, 27, 0.3) 0%, rgba(153, 27, 27, 0.1) 30%, transparent 70%)',
        filter: 'blur(100px)'
      }}
      animate={{
        x: [0, 100, 0],
        y: [0, 80, 0],
        scale: [1, 1.2, 1]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Orbe Azul */}
    <motion.div 
      className="absolute -right-40 bottom-1/4 w-[800px] h-[800px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(30, 64, 175, 0.3) 0%, transparent 70%)',
        filter: 'blur(100px)'
      }}
      animate={{
        x: [0, -80, 0],
        y: [0, -100, 0],
        scale: [1, 1.3, 1]
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Orbe Dourado Central */}
    <motion.div 
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 60%)',
        filter: 'blur(120px)'
      }}
      animate={{
        scale: [1, 1.4, 1],
        opacity: [0.2, 0.4, 0.2]
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />

    <EnhancedParticles />
  </div>
);

// ============================================
// NAVBAR PREMIUM
// ============================================
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#metodo", label: "Método" },
    { href: "#aprovados", label: "Aprovados" },
    { href: "#cursos", label: "Cursos" },
    { href: "#depoimentos", label: "Depoimentos" },
    { href: "#app", label: "Aplicativo" },
  ];

  return (
    <motion.nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled 
          ? "bg-black/90 backdrop-blur-2xl border-b border-red-900/30 py-3" 
          : "bg-transparent py-6"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, type: "spring" }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <motion.img 
            src={logoMoises} 
            alt="Moisés Medeiros" 
            className="h-10 md:h-12 object-contain"
            whileHover={{ scale: 1.05 }}
          />
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors relative group tracking-wide"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-blue-600 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
              Área do Aluno
            </Button>
          </Link>
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 text-white border-0 shadow-lg shadow-red-500/30 px-6 font-bold">
                <span className="relative z-10 flex items-center gap-2">
                  Matricule-se
                  <Rocket className="w-4 h-4" />
                </span>
              </Button>
            </motion.div>
          </Link>
        </div>

        <button 
          className="lg:hidden p-2 text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/95 backdrop-blur-2xl border-b border-red-900/30"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white py-3 text-lg font-medium border-b border-gray-800"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to="/auth" className="w-full mt-4">
                <Button className="w-full bg-gradient-to-r from-red-700 to-red-600 text-white font-bold py-6">
                  Matricule-se Agora
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// ============================================
// HERO SECTION ÉPICA
// ============================================
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  
  const stats = [
    { value: "10.847+", label: "Aprovados", icon: GraduationCap, color: "from-red-600 to-red-700" },
    { value: "98%", label: "Taxa de Aprovação", icon: Trophy, color: "from-amber-500 to-amber-600" },
    { value: "15+", label: "Anos", icon: Award, color: "from-blue-600 to-blue-700" },
  ];

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      <motion.div style={{ y, opacity }} className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, type: "spring" }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-900/40 to-blue-900/40 border border-red-700/40 mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Atom className="w-5 h-5 text-red-400" />
              </motion.div>
              <span className="text-sm font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent tracking-wide">
                O CURSO QUE MAIS APROVA EM MEDICINA
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-6">
              <motion.span 
                className="block text-white"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Sua aprovação
              </motion.span>
              <motion.span 
                className="block bg-gradient-to-r from-red-600 via-red-500 to-amber-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                começa aqui!
              </motion.span>
            </h1>

            <motion.p 
              className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              O método que já aprovou <span className="text-red-400 font-bold">mais de 10.000 alunos</span> em 
              Medicina nas melhores universidades públicas do Brasil.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 text-white border-0 shadow-2xl shadow-red-600/40 px-8 h-16 text-lg font-bold group w-full sm:w-auto">
                    <span className="relative z-10 flex items-center gap-3">
                      QUERO SER APROVADO
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
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
                  className="border-2 border-gray-600 hover:border-red-600/50 bg-white/5 hover:bg-white/10 h-16 text-lg group w-full sm:w-auto"
                >
                  <Play className="w-5 h-5 mr-2 text-red-400 group-hover:scale-110 transition-transform" />
                  Ver Aula Grátis
                </Button>
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4 lg:gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-red-600/30 transition-all"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} mb-2`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Professor Image */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-red-600/30 via-purple-600/20 to-blue-600/30 rounded-3xl blur-3xl" />
              <div className="absolute -inset-1 bg-gradient-to-br from-red-600 to-blue-600 rounded-3xl opacity-20" />
              
              <motion.div 
                className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-gray-900 to-black"
                whileHover={{ scale: 1.02 }}
              >
                <img 
                  src={professorHero} 
                  alt="Professor Moisés Medeiros"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {/* Floating Card */}
                <motion.div
                  className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-red-600/30"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                      <FlaskConical className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">Prof. Moisés Medeiros</div>
                      <div className="text-gray-400 text-sm">Mestre em Química • 15+ anos</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </motion.div>
    </section>
  );
};

// ============================================
// SEÇÃO NÚMEROS (COUNTERS ANIMADOS)
// ============================================
const AnimatedCounter = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [isInView, value]);
  
  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const stats = [
    { value: 10847, suffix: "+", label: "Alunos Aprovados", icon: GraduationCap, color: "from-red-600 to-red-700" },
    { value: 98, suffix: "%", label: "Taxa de Aprovação", icon: Trophy, color: "from-amber-500 to-amber-600" },
    { value: 500, suffix: "+", label: "Horas de Conteúdo", icon: BookOpen, color: "from-blue-600 to-blue-700" },
    { value: 15, suffix: "+", label: "Anos de Experiência", icon: Award, color: "from-purple-600 to-purple-700" },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/10 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-red-600/30 transition-all group"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-black text-white mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// SEÇÃO FEATURES
// ============================================
const FeaturesSection = () => {
  const features = [
    { icon: Brain, title: "Metodologia Exclusiva", description: "Método desenvolvido ao longo de 15 anos, focado em aprendizagem acelerada." },
    { icon: BookOpen, title: "Material Completo", description: "Apostilas, exercícios resolvidos, simulados e mapas mentais atualizados." },
    { icon: Target, title: "Foco Total no ENEM", description: "Conteúdo direcionado para as questões mais cobradas no ENEM." },
    { icon: Users, title: "Comunidade VIP", description: "Grupo exclusivo com monitoria e suporte direto com o professor." },
    { icon: Zap, title: "Aulas Dinâmicas", description: "Vídeos objetivos e envolventes que tornam o aprendizado prazeroso." },
    { icon: Shield, title: "Garantia de 30 Dias", description: "Se não ver resultados, devolvemos 100% do seu investimento." },
  ];

  return (
    <section id="metodo" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/30 border border-red-700/40 mb-6"
          >
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Por que escolher nosso curso?</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white mb-6"
          >
            O Método que <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">Transforma</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-red-600/30 transition-all hover:shadow-xl hover:shadow-red-600/10"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600/20 to-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// SEÇÃO APLICATIVO
// ============================================
const AppSection = () => (
  <section id="app" className="relative py-24 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/20 to-transparent" />
    
    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/30 border border-red-700/40 mb-6">
            <Smartphone className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Exclusividade</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Único Curso de Química
            <span className="block bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
              Com Aplicativo Exclusivo
            </span>
          </h2>
          
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Estude onde quiser, quando quiser. Nosso aplicativo exclusivo está disponível 
            para iOS e Android, com todas as aulas, exercícios e material didático na palma da sua mão.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-6 py-4 bg-black border border-white/20 rounded-xl hover:border-red-600/50 transition-colors"
            >
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.9 17.39c-.26.8-.63 1.53-1.12 2.18-.69.91-1.25 1.54-1.68 1.88-.67.55-1.39.84-2.16.88-.55 0-1.22-.15-2-.46-.79-.31-1.51-.47-2.18-.47-.69 0-1.43.16-2.23.47-.8.31-1.44.47-1.94.49-.74.04-1.47-.25-2.21-.87-.46-.38-1.04-1.03-1.73-1.96-.74-1-1.36-2.17-1.84-3.49-.52-1.43-.78-2.81-.78-4.15 0-1.53.33-2.86.99-3.97.52-.89 1.21-1.59 2.08-2.1.87-.51 1.8-.77 2.81-.8.58 0 1.34.18 2.29.52.95.35 1.55.52 1.82.52.2 0 .87-.2 1.99-.6.96-.37 1.78-.52 2.44-.47 1.81.14 3.17.85 4.07 2.13-1.62.98-2.42 2.35-2.41 4.12.01 1.38.51 2.53 1.51 3.44.45.42.95.75 1.51.99l-.39 1.02z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">Disponível na</div>
                <div className="text-lg font-bold text-white">App Store</div>
              </div>
            </motion.a>
            
            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-6 py-4 bg-black border border-white/20 rounded-xl hover:border-red-600/50 transition-colors"
            >
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">Disponível no</div>
                <div className="text-lg font-bold text-white">Google Play</div>
              </div>
            </motion.a>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-blue-600/20 rounded-3xl blur-3xl" />
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-black/80 border border-white/10">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Video, label: "Aulas em HD", value: "500+" },
                { icon: FileText, label: "PDFs Exclusivos", value: "200+" },
                { icon: Headphones, label: "Suporte 24h", value: "WhatsApp" },
                { icon: BarChart3, label: "Progresso", value: "Acompanhe" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"
                >
                  <item.icon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ============================================
// SEÇÃO DEPOIMENTOS
// ============================================
const TestimonialsSection = () => {
  const testimonials = [
    { name: "Maria Clara", course: "Aprovada em Medicina - UFC", text: "O Professor Moisés mudou minha vida! Graças a ele, conquistei minha vaga em Medicina!" },
    { name: "Lucas Santos", course: "Aprovado em Medicina - UECE", text: "Em 6 meses, minha nota de Química no ENEM pulou de 550 para 850. Incrível!" },
    { name: "Ana Beatriz", course: "Aprovada em Farmácia - UNIFOR", text: "Química virou minha matéria favorita. As aulas são mágicas!" },
    { name: "Pedro Henrique", course: "Aprovado em Eng. Química - UFCG", text: "Tentei 3 vezes antes. Com o curso, passei de primeira!" },
    { name: "Julia Andrade", course: "Aprovada em Biomedicina", text: "Melhor investimento da minha vida. Suporte excepcional!" },
    { name: "Rafael Costa", course: "Aprovado em Medicina - UFPI", text: "Orgânica era meu pesadelo. Agora é minha maior aliada!" },
  ];

  return (
    <section id="depoimentos" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/30 border border-red-700/40 mb-6"
          >
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Depoimentos Reais</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white mb-6"
          >
            O que nossos <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">Alunos Dizem</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-red-600/30 transition-all group"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                <span className="text-lg text-white">"</span>
              </div>
              
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-gray-300 italic mb-6 leading-relaxed">"{t.text}"</p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-red-400">{t.course}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// SEÇÃO CTA FINAL
// ============================================
const CTASection = () => (
  <section className="relative py-32 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-red-950/50 via-black to-blue-950/30" />
    <EnhancedParticles />
    
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 mb-8 shadow-2xl shadow-red-600/40"
        >
          <Rocket className="w-10 h-10 text-white" />
        </motion.div>
        
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6">
          Pronto para
          <span className="block bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-clip-text text-transparent">
            Transformar Sua Vida?
          </span>
        </h2>
        
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Junte-se a mais de 10.000 alunos aprovados com o método do Professor Moisés Medeiros.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 text-white border-0 shadow-2xl shadow-red-600/40 px-10 h-16 text-lg font-bold">
                <Crown className="w-5 h-5 mr-2" />
                QUERO MINHA VAGA AGORA
              </Button>
            </motion.div>
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-900/30 border border-green-600/30"
        >
          <Shield className="w-5 h-5 text-green-400" />
          <span className="text-green-400">Garantia de 30 dias ou seu dinheiro de volta</span>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

// ============================================
// FOOTER
// ============================================
const Footer = () => (
  <footer className="relative py-16 border-t border-white/10 bg-black/50">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <div>
          <img src={logoMoises} alt="Moisés Medeiros" className="h-12 mb-6" />
          <p className="text-gray-400 mb-6">
            Transformando o ensino de Química no Brasil através de metodologia inovadora.
          </p>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/profmoisesmedeiros" target="_blank" rel="noopener noreferrer" 
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-600/50 transition-colors">
              <Instagram className="w-5 h-5 text-gray-400 hover:text-red-400" />
            </a>
            <a href="https://www.youtube.com/@ProfessorMoisesMedeiros" target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-600/50 transition-colors">
              <Youtube className="w-5 h-5 text-gray-400 hover:text-red-400" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-white">Cursos</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">ENEM Intensivo</a></li>
            <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Vestibular Medicina</a></li>
            <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Concursos Públicos</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-white">Institucional</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Sobre Nós</a></li>
            <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Depoimentos</a></li>
            <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Contato</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-white">Legal</h4>
          <ul className="space-y-3">
            <li><Link to="/politica-privacidade" className="text-gray-400 hover:text-red-400 transition-colors">Política de Privacidade</Link></li>
            <li><Link to="/termos-de-uso" className="text-gray-400 hover:text-red-400 transition-colors">Termos de Uso</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Moisés Medeiros. Todos os direitos reservados.
        </p>
        <p className="text-sm text-gray-500">
          🔥 Feito com dedicação para transformar vidas
        </p>
      </div>
    </div>
  </footer>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const Home = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setIntroComplete(true);
  }, []);

  // Skip intro if user already saw it (session storage)
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('intro_seen');
    if (hasSeenIntro) {
      setShowIntro(false);
      setIntroComplete(true);
    }
  }, []);

  useEffect(() => {
    if (!showIntro) {
      sessionStorage.setItem('intro_seen', 'true');
    }
  }, [showIntro]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Abertura Cinematográfica */}
      <AnimatePresence>
        {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>
      
      {/* Conteúdo Principal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <UltraBackground />
        <Navbar />
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <AppSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </motion.div>
    </div>
  );
};

export default Home;
