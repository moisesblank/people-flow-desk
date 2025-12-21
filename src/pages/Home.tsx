// ============================================
// MOISÉS MEDEIROS v20.0 - LANDING PAGE ÉPICA 2500
// Centro Educacional Futurista Ultimate
// Spider-Man Theme: Vermelho + Azul Degradê
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, 
  ChevronRight, 
  Star, 
  Zap, 
  BookOpen, 
  Video, 
  MessageCircle,
  Check,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Clock,
  Award,
  Brain,
  Atom,
  FlaskConical,
  ChevronDown,
  Menu,
  X,
  Trophy,
  Users,
  Target,
  Rocket,
  Shield,
  Crown,
  Heart,
  ExternalLink,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useGodMode } from "@/contexts/GodModeContext";

// Assets
import logoOficial from "@/assets/logo-oficial.png";
import arteAprovados from "@/assets/arte-aprovados.png";
import professorPalco from "@/assets/professor-palco.jpg";
import professorHero from "@/assets/professor-moises-hero.jpg";

// ============================================
// CYBER PARTICLES - Partículas Holográficas
// ============================================
const CyberParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0 
              ? 'linear-gradient(135deg, #dc2626, #ef4444)' 
              : 'linear-gradient(135deg, #2563eb, #3b82f6)',
            boxShadow: i % 2 === 0 
              ? '0 0 10px rgba(220, 38, 38, 0.6)' 
              : '0 0 10px rgba(37, 99, 235, 0.6)',
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-20, 20, -20],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// HOLOGRAPHIC GRID - Grid Futurista
// ============================================
const HolographicGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center top',
        }}
      />
    </div>
  );
};

// ============================================
// ANIMATED BACKGROUND - Ultra Futurista
// ============================================
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black" />
      
      {/* Red orb - left */}
      <motion.div 
        className="absolute -left-40 top-1/4 w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.25) 0%, rgba(220, 38, 38, 0.1) 30%, transparent 70%)',
          filter: 'blur(80px)'
        }}
        animate={{
          x: [0, 80, 0],
          y: [0, 60, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Blue orb - right */}
      <motion.div 
        className="absolute -right-40 bottom-1/4 w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.1) 30%, transparent 70%)',
          filter: 'blur(80px)'
        }}
        animate={{
          x: [0, -60, 0],
          y: [0, -80, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Central purple glow */}
      <motion.div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 60%)',
          filter: 'blur(100px)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <CyberParticles />
      <HolographicGrid />
    </div>
  );
};

// ============================================
// NAVBAR - Ultra Futurista
// ============================================
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#metodo", label: "Método" },
    { href: "#aprovados", label: "Aprovados" },
    { href: "#cursos", label: "Cursos" },
    { href: "#depoimentos", label: "Depoimentos" },
  ];

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-black/80 backdrop-blur-2xl border-b border-red-500/20 py-3" 
          : "bg-transparent py-6"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, type: "spring" }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img 
            src={logoOficial} 
            alt="Moisés Medeiros" 
            className="h-12 md:h-14 object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors relative group tracking-wide"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-blue-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
              Área do Aluno
            </Button>
          </Link>
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-red-500/30 px-6 font-bold">
                <span className="relative z-10 flex items-center gap-2">
                  Matricule-se
                  <Rocket className="w-4 h-4" />
                </span>
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/95 backdrop-blur-2xl border-b border-red-500/20"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white py-3 text-lg font-medium border-b border-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to="/auth" className="w-full mt-4">
                <Button className="w-full bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold py-6">
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
// HERO SECTION - Épico 2500
// ============================================
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  
  const stats = [
    { value: "10.847+", label: "Aprovados em Medicina", icon: GraduationCap, color: "from-red-500 to-red-600" },
    { value: "98%", label: "Taxa de Aprovação", icon: Trophy, color: "from-blue-500 to-blue-600" },
    { value: "15+", label: "Anos de Experiência", icon: Award, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500/20 to-blue-500/20 border border-red-500/30 mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Atom className="w-5 h-5 text-red-400" />
              </motion.div>
              <span className="text-sm font-bold bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent tracking-wide">
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
                className="block bg-gradient-to-r from-red-500 via-red-400 to-blue-500 bg-clip-text text-transparent"
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
              Medicina nas melhores universidades públicas do Brasil. Chegou a sua vez!
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
                  <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white border-0 shadow-2xl shadow-red-500/40 px-8 h-16 text-lg font-bold group w-full sm:w-auto">
                    <span className="relative z-10 flex items-center gap-3">
                      QUERO SER APROVADO
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                  className="border-2 border-gray-600 hover:border-red-500/50 bg-white/5 hover:bg-white/10 h-16 text-lg group w-full sm:w-auto"
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
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(220, 38, 38, 0.3)' }}
                  transition={{ type: "spring", stiffness: 300 }}
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
            className="relative"
          >
            <div className="relative">
              {/* Glow effects */}
              <div className="absolute -inset-4 bg-gradient-to-br from-red-500/30 via-purple-500/20 to-blue-500/30 rounded-3xl blur-3xl" />
              <div className="absolute -inset-1 bg-gradient-to-br from-red-500 to-blue-500 rounded-3xl opacity-20" />
              
              {/* Image container */}
              <motion.div 
                className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-gray-900 to-black"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <img 
                  src={professorHero} 
                  alt="Professor Moisés Medeiros"
                  className="w-full h-auto object-cover"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {/* Info card */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center">
                      <FlaskConical className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Prof. Moisés Medeiros</h3>
                      <p className="text-sm text-gray-400">Especialista em Química para Medicina</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/50"
                animate={{ y: [-8, 8, -8], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Atom className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 flex items-center gap-3 shadow-2xl shadow-blue-500/50"
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-bold text-white">AO VIVO Agora</span>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -left-8 px-4 py-2 rounded-xl bg-black/90 border border-red-500/30 flex items-center gap-2"
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-white">4.9/5</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-8 h-14 rounded-full border-2 border-gray-600 flex items-start justify-center p-2">
          <motion.div 
            className="w-2 h-2 rounded-full bg-gradient-to-b from-red-500 to-blue-500"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

// ============================================
// VIDEO SECTION - YouTube Embed
// ============================================
const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="video" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold mb-4">
            <Video className="w-4 h-4" />
            AULA GRATUITA
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">Assista uma </span>
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">aula grátis</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Experimente o método que está revolucionando a preparação para Medicina
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-red-500/30 via-purple-500/20 to-blue-500/30 rounded-3xl blur-2xl" />
          
          <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-black aspect-video">
            {!isPlaying ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <img 
                  src={professorPalco} 
                  alt="Professor Moisés no palco"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(true)}
                  className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-red-500/50 group"
                >
                  <Play className="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform" fill="white" />
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                </motion.button>
              </div>
            ) : (
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Aula Grátis - Prof. Moisés Medeiros"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// APPROVED STUDENTS SECTION - Mural de Aprovados
// ============================================
const ApprovedSection = () => {
  return (
    <section id="aprovados" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-blue-500/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold mb-4">
            <Trophy className="w-4 h-4" />
            RESULTADOS COMPROVADOS
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">Nada fala mais alto que o </span>
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">RESULTADO!</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            O curso de Química que mais aprova em Medicina em universidades públicas no Brasil
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto"
        >
          {[
            { value: "10.847+", label: "Aprovados", color: "from-red-500 to-red-600" },
            { value: "98%", label: "Aprovação", color: "from-blue-500 to-blue-600" },
            { value: "50+", label: "Universidades", color: "from-purple-500 to-purple-600" },
            { value: "15+", label: "Anos", color: "from-green-500 to-green-600" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Approved Students Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 via-purple-500/10 to-blue-500/20 rounded-3xl blur-2xl" />
          <div className="relative rounded-3xl overflow-hidden border-2 border-white/10">
            <img 
              src={arteAprovados} 
              alt="Mural de Aprovados em Medicina"
              className="w-full h-auto"
            />
          </div>
        </motion.div>

        {/* Universities Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <p className="text-center text-gray-500 mb-6">Aprovações em:</p>
          <div className="relative overflow-hidden">
            <div className="flex animate-marquee space-x-8">
              {[...["USP", "UNICAMP", "UNESP", "UNIFESP", "UFMG", "UFRJ", "UNB", "UFBA", "UFPE", "UFPR", "UFRGS", "UFC", "UFPB", "UFCG", "UERN", "FAMENE"], ...["USP", "UNICAMP", "UNESP", "UNIFESP", "UFMG", "UFRJ", "UNB", "UFBA", "UFPE", "UFPR", "UFRGS", "UFC", "UFPB", "UFCG", "UERN", "FAMENE"]].map((uni, index) => (
                <div
                  key={`${uni}-${index}`}
                  className="flex-shrink-0 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold tracking-wide"
                >
                  {uni}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// FEATURES SECTION - Método
// ============================================
const FeaturesSection = () => {
  const features = [
    {
      icon: Video,
      title: "Aulas ao Vivo",
      description: "Interação em tempo real com o professor. Tire dúvidas na hora!",
      gradient: "from-red-500 to-red-600"
    },
    {
      icon: BookOpen,
      title: "Material Exclusivo",
      description: "PDFs, resumos e exercícios desenvolvidos especialmente para você.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: MessageCircle,
      title: "Grupo VIP WhatsApp",
      description: "Suporte exclusivo com monitores e o próprio professor.",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: Brain,
      title: "Método Aprovado",
      description: "Técnicas que já aprovaram mais de 10.000 alunos.",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: Clock,
      title: "Acesso Ilimitado",
      description: "Assista quantas vezes quiser. Todas as aulas ficam gravadas.",
      gradient: "from-orange-500 to-orange-600"
    },
    {
      icon: Award,
      title: "Certificado",
      description: "Receba seu certificado reconhecido ao concluir.",
      gradient: "from-cyan-500 to-cyan-600"
    }
  ];

  return (
    <section id="metodo" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-4">
            <Zap className="w-4 h-4" />
            METODOLOGIA EXCLUSIVA
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">Por que o método </span>
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">funciona?</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Tudo que você precisa para dominar Química e conquistar sua vaga em Medicina
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <motion.div 
                className="h-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// TESTIMONIALS SECTION
// ============================================
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Bruno Mozart",
      role: "Aprovado em Medicina - UFCG",
      content: "O Professor Moisés mudou minha vida! A didática dele é incrível. Passei em Medicina na primeira tentativa!",
      avatar: "BM"
    },
    {
      name: "Maria Clara",
      role: "Aprovada em Medicina - USP",
      content: "Depois de 2 anos tentando, finalmente consegui minha vaga. O método realmente funciona!",
      avatar: "MC"
    },
    {
      name: "Lucas Heitor",
      role: "Aprovado em Medicina - UFRN",
      content: "As aulas ao vivo são sensacionais! Poder tirar dúvidas em tempo real fez toda a diferença.",
      avatar: "LH"
    },
    {
      name: "Ryan Araújo",
      role: "Aprovado em Medicina - UNIFIP",
      content: "O suporte no WhatsApp é incrível. Sempre que precisei, alguém estava lá para ajudar!",
      avatar: "RA"
    },
    {
      name: "Mariana Feitosa",
      role: "Aprovada em Medicina - FACISA",
      content: "Material completo, professor dedicado e método eficiente. Receita perfeita para aprovação!",
      avatar: "MF"
    },
    {
      name: "Yasmin Cordeiro",
      role: "Aprovada em Medicina - UFPB",
      content: "Estudei por 6 meses e consegui! O Moisés ensina de um jeito que qualquer pessoa entende.",
      avatar: "YC"
    }
  ];

  return (
    <section id="depoimentos" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold mb-4">
            <Star className="w-4 h-4 fill-yellow-400" />
            4.9/5 DE AVALIAÇÃO
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">O que nossos </span>
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">alunos dizem</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div 
                className="h-full p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-red-500/30 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white">{testimonial.name}</p>
                    <p className="text-sm text-green-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// COURSES SECTION
// ============================================
const CoursesSection = () => {
  const courses = [
    {
      title: "Química Completa",
      subtitle: "ENEM e Vestibulares",
      price: "12x R$ 97",
      originalPrice: "R$ 1.497",
      features: [
        "500+ horas de aulas",
        "Aulas ao vivo semanais",
        "Material em PDF",
        "Simulados exclusivos",
        "Grupo VIP WhatsApp",
        "Certificado"
      ],
      popular: true,
      gradient: "from-red-600 to-blue-600"
    },
    {
      title: "Intensivo Medicina",
      subtitle: "Revisão Rápida",
      price: "12x R$ 67",
      originalPrice: "R$ 997",
      features: [
        "100+ horas focadas",
        "Resumos objetivos",
        "Exercícios resolvidos",
        "Material PDF",
        "1 ano de acesso"
      ],
      popular: false,
      gradient: "from-purple-600 to-blue-600"
    },
    {
      title: "Mentoria Premium",
      subtitle: "Acompanhamento VIP",
      price: "Consultar",
      originalPrice: "",
      features: [
        "Tudo do Completa",
        "Mentoria individual",
        "Plano personalizado",
        "Correção de redação",
        "Suporte 24h",
        "Garantia de resultado"
      ],
      popular: false,
      gradient: "from-blue-600 to-cyan-600"
    }
  ];

  return (
    <section id="cursos" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold mb-4">
            <Crown className="w-4 h-4" />
            ESCOLHA SEU PLANO
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-white">Invista no seu </span>
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">futuro</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {courses.map((course, index) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${course.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {course.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-red-500 to-blue-600 text-white text-sm font-bold z-10 shadow-lg">
                  🔥 MAIS POPULAR
                </div>
              )}

              <motion.div 
                className={`h-full p-8 rounded-3xl border ${
                  course.popular 
                    ? 'bg-gradient-to-b from-red-500/10 to-blue-500/10 border-red-500/30' 
                    : 'bg-white/5 border-white/10'
                } backdrop-blur-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-white mb-1">{course.title}</h3>
                  <p className="text-gray-400">{course.subtitle}</p>
                </div>

                <div className="text-center mb-8">
                  <div className={`text-4xl font-black bg-gradient-to-r ${course.gradient} bg-clip-text text-transparent`}>
                    {course.price}
                  </div>
                  {course.originalPrice && (
                    <p className="text-gray-500 line-through mt-1">{course.originalPrice}</p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {course.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/auth" className="block">
                  <Button 
                    className={`w-full h-14 font-bold text-lg ${
                      course.popular 
                        ? `bg-gradient-to-r ${course.gradient} hover:opacity-90 text-white border-0 shadow-lg shadow-red-500/30` 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    Matricular Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA SECTION
// ============================================
const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-purple-500/10 to-blue-500/10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 100 100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2210%22 height=%2210%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 10 0 L 0 0 0 10%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.02)%22 stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22/%3E%3C/svg%3E')]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/50">
              <Rocket className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Pronto para </span>
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">conquistar sua vaga?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Junte-se a mais de <span className="text-red-400 font-bold">10.000 alunos aprovados</span> e transforme seu sonho em realidade!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/auth">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white border-0 shadow-2xl shadow-red-500/40 px-10 h-16 text-lg font-bold w-full sm:w-auto">
                  QUERO MINHA VAGA
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </Link>
            <a href="https://wa.me/5583999999999" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-2 border-green-500 text-green-400 hover:bg-green-500/10 h-16 text-lg font-bold w-full sm:w-auto">
                <Phone className="w-5 h-5 mr-2" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              Garantia de 7 dias
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Acesso imediato
            </span>
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Suporte 24h
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// FOOTER
// ============================================
const Footer = () => {
  return (
    <footer className="py-16 border-t border-white/10 bg-black/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo */}
          <div className="md:col-span-2">
            <img src={logoOficial} alt="Moisés Medeiros" className="h-16 mb-6" />
            <p className="text-gray-400 max-w-md leading-relaxed">
              O método mais eficiente para você dominar Química e garantir sua aprovação em Medicina.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-colors">
                <Play className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4">Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#metodo" className="hover:text-white transition-colors">Método</a></li>
              <li><a href="#aprovados" className="hover:text-white transition-colors">Aprovados</a></li>
              <li><a href="#cursos" className="hover:text-white transition-colors">Cursos</a></li>
              <li><a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Moisés Medeiros. Todos os direitos reservados.
          </p>
          <p className="text-sm text-gray-500">
            MMM CURSO DE QUÍMICA LTDA • CNPJ: 53.829.761/0001-17
          </p>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// POPUP COMPONENT
// ============================================
const WelcomePopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-gray-900 to-black border-red-500/30 p-0 overflow-hidden">
        <DialogTitle className="sr-only">Oferta Especial</DialogTitle>
        <div className="relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-blue-500/20" />
          
          <div className="relative p-8 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <h3 className="text-2xl font-black text-white mb-3">
              🔥 OFERTA ESPECIAL!
            </h3>
            <p className="text-gray-400 mb-6">
              Ganhe <span className="text-red-400 font-bold">30% de desconto</span> na sua matrícula agora!
            </p>

            <Link to="/auth" onClick={onClose}>
              <Button className="w-full bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold h-14 text-lg">
                QUERO MINHA VAGA COM DESCONTO
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <p className="text-xs text-gray-500 mt-4">
              *Oferta válida por tempo limitado
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// GOD MODE INDICATOR
// ============================================
const GodModeIndicator = () => {
  const { isActive, isOwner } = useGodMode();

  if (!isOwner || !isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold shadow-2xl shadow-red-500/50"
    >
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
        <span>MODO MASTER ATIVO</span>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Home() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup after 5 seconds
    const timer = setTimeout(() => {
      const hasSeenPopup = sessionStorage.getItem('hasSeenPopup');
      if (!hasSeenPopup) {
        setShowPopup(true);
        sessionStorage.setItem('hasSeenPopup', 'true');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <AnimatedBackground />
      <Navbar />
      <HeroSection />
      <VideoSection />
      <ApprovedSection />
      <FeaturesSection />
      <CoursesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      
      <WelcomePopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
      <GodModeIndicator />
      
      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
