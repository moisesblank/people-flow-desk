// ============================================
// MOISÉS MEDEIROS v15.0 - LANDING PAGE ÉPICA
// Centro Educacional Futurista
// Inspirado em: MedGrupo, ElevenLabs, Black Friday
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import professorHero from "@/assets/professor-moises-hero.jpg";

// ============================================
// ANIMATED BACKGROUND - Partículas e Grid
// ============================================
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid futurista */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(rgba(236, 72, 153, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(236, 72, 153, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>
      
      {/* Orbs flutuantes */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Partículas flutuantes */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-pink-500/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// NAVBAR FUTURISTA
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
    { href: "#cursos", label: "Cursos" },
    { href: "#metodo", label: "Método" },
    { href: "#resultados", label: "Resultados" },
    { href: "#depoimentos", label: "Depoimentos" },
  ];

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-3" 
          : "bg-transparent py-6"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Atom className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground tracking-tight">MOISÉS</span>
            <span className="text-xs text-pink-500 font-medium -mt-1">MEDEIROS</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Entrar
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/25">
              Começar Agora
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to="/auth" className="w-full">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600">
                  Começar Agora
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
// HERO SECTION - Épico e Impactante
// ============================================
const HeroSection = () => {
  const stats = [
    { value: "10.000+", label: "Alunos Aprovados", icon: GraduationCap },
    { value: "98%", label: "Taxa de Aprovação", icon: Trophy },
    { value: "500+", label: "Horas de Conteúdo", icon: Video },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50" />
      
      {/* Efeito de luz no topo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-pink-500/10 via-purple-500/5 to-transparent blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Conteúdo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-pink-400">Química que Aprova</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
              <span className="block">Domine a Química</span>
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                e Conquiste sua Vaga
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              O método mais eficiente para você dominar Química e garantir sua aprovação em vestibulares e concursos. Aulas ao vivo, material completo e suporte exclusivo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-pink-500/30 px-8 h-14 text-lg group">
                  Começar Agora
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border/50 hover:bg-muted/50 h-14 text-lg group"
              >
                <Play className="w-5 h-5 mr-2 text-pink-500" />
                Ver Aula Grátis
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 lg:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-5 h-5 text-pink-500 mr-2" />
                    <span className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</span>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Imagem do Professor */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-3xl blur-3xl transform scale-110" />
              
              {/* Image container */}
              <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur">
                <img 
                  src={professorHero} 
                  alt="Professor Moisés Medeiros"
                  className="w-full h-auto object-cover"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                
                {/* Info card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <FlaskConical className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Prof. Moisés Medeiros</h3>
                      <p className="text-sm text-muted-foreground">Especialista em Química para Vestibulares</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-pink-500/30"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Atom className="w-10 h-10 text-white" />
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl bg-background/90 backdrop-blur border border-border/50 flex items-center gap-2 shadow-xl"
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Aula ao Vivo Agora</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8 text-muted-foreground/50" />
      </motion.div>
    </section>
  );
};

// ============================================
// FEATURES SECTION - Cards Futuristas
// ============================================
const FeaturesSection = () => {
  const features = [
    {
      icon: Video,
      title: "Aulas ao Vivo",
      description: "Interação em tempo real com o professor. Tire dúvidas na hora e aprenda de forma dinâmica.",
      color: "from-pink-500 to-rose-600"
    },
    {
      icon: BookOpen,
      title: "Material Completo",
      description: "PDFs, resumos, exercícios e simulados. Tudo que você precisa em um só lugar.",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: MessageCircle,
      title: "Suporte Exclusivo",
      description: "Grupo VIP no WhatsApp com monitores e o próprio professor para tirar suas dúvidas.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Brain,
      title: "Método Aprovado",
      description: "Técnicas de estudo comprovadas que já aprovaram mais de 10.000 alunos.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Clock,
      title: "Flexibilidade Total",
      description: "Assista quando e onde quiser. Todas as aulas ficam gravadas para você rever.",
      color: "from-orange-500 to-amber-600"
    },
    {
      icon: Award,
      title: "Certificado",
      description: "Receba seu certificado de conclusão reconhecido em todo o Brasil.",
      color: "from-pink-500 to-purple-600"
    }
  ];

  return (
    <section id="metodo" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Por que escolher o Moisés Medeiros?
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que você precisa para
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> aprovar</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um método completo desenvolvido por quem já aprovou milhares de alunos em vestibulares de medicina e concursos públicos.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative h-full p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-pink-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-pink-500/5">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// RESULTS SECTION - Números Impactantes
// ============================================
const ResultsSection = () => {
  const results = [
    { value: "10.847", label: "Alunos Aprovados", suffix: "+" },
    { value: "98", label: "Taxa de Aprovação", suffix: "%" },
    { value: "15", label: "Anos de Experiência", suffix: "+" },
    { value: "4.9", label: "Nota dos Alunos", suffix: "/5" },
  ];

  const universities = [
    "USP", "UNICAMP", "UNESP", "UNIFESP", "UFMG", "UFRJ", "UNB", "UFBA",
    "UFPE", "UFPR", "UFRGS", "UFC", "UFF", "UFSC", "UFG", "UFES"
  ];

  return (
    <section id="resultados" className="py-24 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-pink-500/5 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12">
            Números que
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> impressionam</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {results.map((result, index) => (
              <motion.div
                key={result.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card/30 border border-border/50 backdrop-blur"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
                  {result.value}{result.suffix}
                </div>
                <p className="text-muted-foreground">{result.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Universities Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">Alunos aprovados nas principais universidades do Brasil</p>
          <div className="relative overflow-hidden">
            <div className="flex animate-marquee space-x-8">
              {[...universities, ...universities].map((uni, index) => (
                <div
                  key={`${uni}-${index}`}
                  className="flex-shrink-0 px-6 py-3 rounded-xl bg-muted/30 border border-border/30 text-muted-foreground font-medium"
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
// TESTIMONIALS SECTION
// ============================================
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Maria Clara",
      role: "Aprovada em Medicina - USP",
      content: "O Professor Moisés mudou minha vida! Depois de 2 anos tentando, finalmente passei em medicina graças ao método dele.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "João Pedro",
      role: "Aprovado em Medicina - UNICAMP",
      content: "As aulas são incríveis! Ele explica de um jeito que faz a química parecer fácil. Recomendo demais!",
      rating: 5,
      avatar: "JP"
    },
    {
      name: "Ana Beatriz",
      role: "Aprovada em Farmácia - UNESP",
      content: "O suporte no WhatsApp é sensacional. Sempre que tinha dúvida, alguém respondia rapidinho.",
      rating: 5,
      avatar: "AB"
    },
    {
      name: "Lucas Santos",
      role: "Aprovado em Engenharia Química - UFRJ",
      content: "Material completo, aulas didáticas e um professor que realmente se importa com os alunos.",
      rating: 5,
      avatar: "LS"
    },
    {
      name: "Fernanda Lima",
      role: "Aprovada em Biomedicina - UFMG",
      content: "Estudei sozinha por muito tempo sem resultado. Com o Moisés, em 6 meses eu consegui minha vaga!",
      rating: 5,
      avatar: "FL"
    },
    {
      name: "Rafael Costa",
      role: "Aprovado em Medicina - UNIFESP",
      content: "As lives são o diferencial! Poder tirar dúvidas ao vivo fez toda a diferença na minha preparação.",
      rating: 5,
      avatar: "RC"
    }
  ];

  return (
    <section id="depoimentos" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
            <Star className="w-4 h-4 fill-green-400" />
            Avaliação 4.9/5
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            O que nossos
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> alunos dizem</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur hover:border-pink-500/30 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              <p className="text-foreground mb-6">"{testimonial.content}"</p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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
        "500+ horas de aulas gravadas",
        "Aulas ao vivo semanais",
        "Material em PDF",
        "Simulados exclusivos",
        "Grupo VIP WhatsApp",
        "Certificado de conclusão"
      ],
      popular: true,
      color: "from-pink-500 to-purple-600"
    },
    {
      title: "Química Intensivo",
      subtitle: "Revisão Rápida",
      price: "12x R$ 67",
      originalPrice: "R$ 997",
      features: [
        "100+ horas de aulas",
        "Resumos objetivos",
        "Exercícios resolvidos",
        "Material em PDF",
        "Acesso por 1 ano"
      ],
      popular: false,
      color: "from-purple-500 to-violet-600"
    },
    {
      title: "Mentoria Premium",
      subtitle: "Acompanhamento Individual",
      price: "Consultar",
      originalPrice: "",
      features: [
        "Tudo do Química Completa",
        "Mentoria individual",
        "Plano de estudos personalizado",
        "Correção de redação",
        "Suporte prioritário 24h",
        "Garantia de resultado"
      ],
      popular: false,
      color: "from-blue-500 to-cyan-600"
    }
  ];

  return (
    <section id="cursos" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Escolha seu
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> plano</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Invista no seu futuro com o método que já aprovou milhares de alunos
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {courses.map((course, index) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                course.popular 
                  ? 'bg-gradient-to-b from-pink-500/10 to-purple-500/10 border-pink-500/30' 
                  : 'bg-card/50 border-border/50'
              } backdrop-blur`}
            >
              {course.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-1">{course.title}</h3>
                <p className="text-muted-foreground">{course.subtitle}</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {course.price}
                </div>
                {course.originalPrice && (
                  <p className="text-muted-foreground line-through">{course.originalPrice}</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {course.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth" className="block">
                <Button 
                  className={`w-full h-12 ${
                    course.popular 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Começar Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// FAQ SECTION
// ============================================
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Por quanto tempo tenho acesso ao curso?",
      answer: "Você terá acesso ao curso por 12 meses a partir da data da compra. Depois, pode renovar com condições especiais."
    },
    {
      question: "As aulas ficam gravadas?",
      answer: "Sim! Todas as aulas ao vivo ficam gravadas e disponíveis na plataforma para você assistir quantas vezes quiser."
    },
    {
      question: "Posso assistir no celular?",
      answer: "Claro! Nossa plataforma é 100% responsiva. Você pode estudar no computador, tablet ou celular."
    },
    {
      question: "Existe garantia?",
      answer: "Sim! Oferecemos garantia incondicional de 7 dias. Se não gostar, devolvemos 100% do seu dinheiro."
    },
    {
      question: "Como funciona o suporte?",
      answer: "Você terá acesso a um grupo VIP no WhatsApp com monitores e o próprio professor para tirar dúvidas."
    },
    {
      question: "O certificado é reconhecido?",
      answer: "Sim! Nosso certificado é válido em todo o território nacional como curso livre."
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Perguntas
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> Frequentes</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-foreground">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
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
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Pronto para
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> conquistar sua vaga?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 10.000 alunos que já transformaram seus sonhos em realidade com o método Moisés Medeiros.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-pink-500/30 px-8 h-14 text-lg">
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 text-lg">
              Falar no WhatsApp
              <MessageCircle className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Garantia de 7 dias • Acesso imediato • Suporte 24h
          </p>
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
    <footer className="py-12 border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Atom className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold">MOISÉS MEDEIROS</span>
                <span className="text-xs text-pink-500">Centro Educacional</span>
              </div>
            </div>
            <p className="text-muted-foreground max-w-md">
              O método mais eficiente para você dominar Química e garantir sua aprovação.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#cursos" className="hover:text-foreground transition-colors">Cursos</a></li>
              <li><a href="#metodo" className="hover:text-foreground transition-colors">Método</a></li>
              <li><a href="#resultados" className="hover:text-foreground transition-colors">Resultados</a></li>
              <li><a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Moisés Medeiros. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            MMM CURSO DE QUÍMICA LTDA • CNPJ: 53.829.761/0001-17
          </p>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <AnimatedBackground />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ResultsSection />
      <CoursesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      
      {/* CSS for marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
