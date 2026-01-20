// ============================================
// MOISÉS MEDEIROS v7.0 - LANDING PAGE
// Curso de Química - Página de Vendas
// Design: Spider-Man Theme (Vermelho Vinho + Azul)
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  GraduationCap, 
  Trophy, 
  Users, 
  Play, 
  ExternalLink, 
  ChevronRight,
  Calendar,
  Clock,
  Star,
  Sparkles,
  Instagram,
  Youtube,
  MessageCircle,
  ArrowRight,
  Zap,
  Target,
  Award,
  BookOpen,
  CheckCircle2,
  ArrowUpRight,
  Atom,
  FlaskConical,
  Brain,
  Flame,
  Shield,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import professorPhoto from "@/assets/professor-moises-real.jpg";
import heroChemistryBanner from "@/assets/hero-chemistry-banner.jpg";
import { useEditableContent } from "@/hooks/useEditableContent";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { EditableLink } from "@/components/editor/EditableLink";
import { EditModeToggle } from "@/components/editor/EditModeToggle";
import { SacredImage } from "@/components/performance/SacredImage";

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
function AnimatedCounter({ 
  target, 
  duration = 2000, 
  suffix = "" 
}: { 
  target: number; 
  duration?: number; 
  suffix?: string 
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * easeOut));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, isInView]);

  return (
    <span ref={ref} className="counter-glow">
      {count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

// ============================================
// DATA
// ============================================
const liveSchedule = [
  { day: "Segunda", time: "19h", subject: "Química Orgânica", status: "gravada", icon: FlaskConical },
  { day: "Terça", time: "19h", subject: "Físico-Química", status: "em_breve", icon: Atom },
  { day: "Quarta", time: "19h", subject: "Química Geral", status: "ao_vivo", icon: Brain },
  { day: "Quinta", time: "19h", subject: "Bioquímica", status: "em_breve", icon: Flame },
  { day: "Sexta", time: "19h", subject: "Química Ambiental", status: "em_breve", icon: Target },
  { day: "Sábado", time: "10h", subject: "Revisão Semanal", status: "em_breve", icon: Target },
];

const testimonials = [
  { 
    name: "Ana Clara", 
    course: "Medicina UFMG", 
    text: "O professor Moisés foi fundamental para minha aprovação! A didática dele transforma química em algo fascinante.", 
    avatar: "AC",
    rating: 5
  },
  { 
    name: "Pedro Henrique", 
    course: "Medicina USP", 
    text: "Didática excepcional! Química virou minha melhor matéria. Recomendo para todos os vestibulandos.", 
    avatar: "PH",
    rating: 5
  },
  { 
    name: "Maria Eduarda", 
    course: "Medicina UERJ", 
    text: "Os resumos e a metodologia são simplesmente perfeitos. Material de altíssima qualidade!", 
    avatar: "ME",
    rating: 5
  },
  { 
    name: "Lucas Oliveira", 
    course: "Medicina UNICAMP", 
    text: "Depois de 2 anos tentando, finalmente passei! Todo o diferencial foi o curso do Prof. Moisés.", 
    avatar: "LO",
    rating: 5
  },
];

const medSchools = [
  "USP", "UNICAMP", "UFMG", "UFRJ", "UERJ", "UNESP", "UNIFESP", "PUC", "FMUSP", "UFPR"
];

const features = [
  { 
    icon: BookOpen, 
    title: "500+ Videoaulas", 
    desc: "Conteúdo completo e atualizado",
    color: "text-primary"
  },
  { 
    icon: Target, 
    title: "Exercícios Focados", 
    desc: "Questões de vestibulares reais",
    color: "text-secondary"
  },
  { 
    icon: Users, 
    title: "Mentoria Exclusiva", 
    desc: "Suporte direto com o professor",
    color: "text-stats-blue"
  },
  { 
    icon: Award, 
    title: "Certificado", 
    desc: "Reconhecimento do seu esforço",
    color: "text-stats-gold"
  },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Sistema de edição inline
  const { 
    isEditMode, 
    canEdit, 
    toggleEditMode, 
    getValue, 
    updateValue, 
    uploadImage 
  } = useEditableContent("landing");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden dark">
      {/* Botão de Modo Edição (só aparece para owner) */}
      <EditModeToggle 
        isEditMode={isEditMode} 
        canEdit={canEdit} 
        onToggle={toggleEditMode} 
      />
      {/* ============================================
          NAVIGATION
          ============================================ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'backdrop-blur-xl bg-background/90 border-b border-border/50 shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-wine">
                <span className="text-primary-foreground font-bold text-lg">M</span>
              </div>
              <div>
                <EditableText
                  value={getValue("nav_brand", "Prof. Moisés")}
                  onSave={(v) => updateValue("nav_brand", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                  className="font-bold text-foreground hero-title"
                  as="p"
                />
                <EditableText
                  value={getValue("nav_subtitle", "Química para Medicina")}
                  onSave={(v) => updateValue("nav_subtitle", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                  className="text-xs text-muted-foreground"
                  as="p"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#sobre" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sobre</a>
              <a href="#cursos" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cursos</a>
              <a href="#aprovados" className="text-sm text-muted-foreground hover:text-primary transition-colors">Aprovados</a>
              <a href="#cronograma" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cronograma</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2 rounded-xl shadow-wine">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Área do Aluno</span>
                  <span className="sm:hidden">Entrar</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 hero-gradient overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroChemistryBanner})` }}
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Primary Glow */}
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-radial from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
          {/* Secondary Glow */}
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-gradient-radial from-secondary/10 via-transparent to-transparent rounded-full blur-3xl" />
          
          {/* Animated Orb */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          />
          
          {/* Secondary Orb */}
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-secondary/15 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6"
              >
                <Trophy className="h-4 w-4 text-primary" />
                <EditableText
                  value={getValue("hero_badge", "#1 em Aprovações em Medicina")}
                  onSave={(v) => updateValue("hero_badge", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                  className="text-sm font-medium text-primary"
                />
              </motion.div>

              {/* Title */}
              <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight mb-6">
                <EditableText
                  value={getValue("hero_title_1", "O Professor que")}
                  onSave={(v) => updateValue("hero_title_1", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                />{" "}
                <span className="brand-text">
                  <EditableText
                    value={getValue("hero_title_highlight", "Mais Aprova")}
                    onSave={(v) => updateValue("hero_title_highlight", v)}
                    isEditMode={isEditMode}
                    canEdit={canEdit}
                  />
                </span>{" "}
                <EditableText
                  value={getValue("hero_title_2", "em Medicina no Brasil")}
                  onSave={(v) => updateValue("hero_title_2", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                />
              </h1>

              {/* Subtitle */}
              <div className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                <EditableText
                  value={getValue("hero_subtitle", "Química de alto nível com metodologia exclusiva. Milhares de alunos aprovados nas melhores faculdades de Medicina do país.")}
                  onSave={(v) => updateValue("hero_subtitle", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                  multiline
                />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <EditableLink
                  href={getValue("cta_area_aluno", "https://app.moisesmedeiros.com.br")}
                  onSave={(v) => updateValue("cta_area_aluno", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                >
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground gap-2 rounded-xl h-14 px-8 text-lg heroic-glow press-effect"
                  >
                    <EditableText
                      value={getValue("hero_cta_primary", "Começar Agora")}
                      onSave={(v) => updateValue("hero_cta_primary", v)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                    />
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </EditableLink>
                <EditableLink
                  href={getValue("cta_black_friday", "https://app.moisesmedeiros.com.br/black-friday-2025")}
                  onSave={(v) => updateValue("cta_black_friday", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-secondary bg-secondary/20 hover:bg-secondary/30 text-foreground gap-2 rounded-xl h-14 px-8 text-lg"
                  >
                    <Zap className="h-5 w-5 text-stats-blue" />
                    <EditableText
                      value={getValue("hero_cta_secondary", "Black Friday 2025")}
                      onSave={(v) => updateValue("hero_cta_secondary", v)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                    />
                  </Button>
                </EditableLink>
              </div>

              {/* Stats - Valores fixos para garantir carregamento correto */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-primary/20">
                <motion.div 
                  className="text-center lg:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    <AnimatedCounter target={12847} suffix="+" />
                  </p>
                  <EditableText
                    value={getValue("hero_stat_1_label", "Alunos Ativos")}
                    onSave={(v) => updateValue("hero_stat_1_label", v)}
                    isEditMode={isEditMode}
                    canEdit={canEdit}
                    className="text-sm text-muted-foreground mt-1"
                    as="p"
                  />
                </motion.div>
                <motion.div 
                  className="text-center lg:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <p className="text-3xl md:text-4xl font-bold text-stats-blue">
                    <AnimatedCounter target={4892} suffix="+" />
                  </p>
                  <EditableText
                    value={getValue("hero_stat_2_label", "Aprovados 2024")}
                    onSave={(v) => updateValue("hero_stat_2_label", v)}
                    isEditMode={isEditMode}
                    canEdit={canEdit}
                    className="text-sm text-muted-foreground mt-1"
                    as="p"
                  />
                </motion.div>
                <motion.div 
                  className="text-center lg:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-3xl md:text-4xl font-bold text-stats-green">
                    <AnimatedCounter target={98} suffix="%" />
                  </p>
                  <EditableText
                    value={getValue("hero_stat_3_label", "Satisfação")}
                    onSave={(v) => updateValue("hero_stat_3_label", v)}
                    isEditMode={isEditMode}
                    canEdit={canEdit}
                    className="text-sm text-muted-foreground mt-1"
                    as="p"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Right Content - Professor Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
                
                {/* Card */}
                <div className="relative wine-card p-8 md:p-10">
                  {/* Professor Photo */}
                  <div className="relative mx-auto w-72 h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden border-4 border-primary/40 mb-6 shadow-2xl shadow-primary/30">
                    <SacredImage 
                      src={professorPhoto} 
                      alt="Professor Moisés Medeiros" 
                      className="w-full h-full"
                      objectFit="cover"
                      priority
                    />
                    <motion.div
                      className="absolute -bottom-2 -right-2 bg-stats-green rounded-full p-3 shadow-lg border-2 border-background"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <CheckCircle2 className="h-6 w-6 text-background" />
                    </motion.div>
                  </div>

                  <div className="text-center">
                    <EditableText
                      value={getValue("professor_name", "Prof. Moisés Medeiros")}
                      onSave={(v) => updateValue("professor_name", v)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                      className="text-2xl font-bold text-foreground hero-title mb-1"
                      as="h3"
                    />
                    <EditableText
                      value={getValue("professor_title", "Especialista em Química para Medicina")}
                      onSave={(v) => updateValue("professor_title", v)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                      className="text-muted-foreground mb-4"
                      as="p"
                    />
                    
                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
                        <EditableText
                          value={getValue("professor_badge_1", "+15 anos de experiência")}
                          onSave={(v) => updateValue("professor_badge_1", v)}
                          isEditMode={isEditMode}
                          canEdit={canEdit}
                        />
                      </span>
                      <span className="px-3 py-1 rounded-full bg-secondary/30 text-stats-blue text-xs font-medium border border-secondary/40">
                        <EditableText
                          value={getValue("professor_badge_2", "Método exclusivo")}
                          onSave={(v) => updateValue("professor_badge_2", v)}
                          isEditMode={isEditMode}
                          canEdit={canEdit}
                        />
                      </span>
                    </div>

                    {/* Live Badge */}
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                      <EditableText
                        value={getValue("professor_live", "Próxima aula: Quarta 19h")}
                        onSave={(v) => updateValue("professor_live", v)}
                        isEditMode={isEditMode}
                        canEdit={canEdit}
                        className="text-sm font-medium text-primary"
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
            <motion.div 
              className="w-1 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </motion.div>
      </section>

      {/* ============================================
          MEDICAL SCHOOLS BANNER
          ============================================ */}
      <section className="py-8 border-y border-border/30 bg-card/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Nossos alunos foram aprovados nas melhores faculdades de Medicina
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {medSchools.map((school, i) => (
              <motion.span
                key={school}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-xl md:text-2xl font-bold text-muted-foreground/50 hover:text-primary transition-colors cursor-default"
              >
                {school}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          RAIO X SECTION
          ============================================ */}
      <section className="py-20 relative" id="cursos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative spider-card p-8 md:p-12 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/10 to-transparent" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-secondary/5 to-transparent" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">Destaque</span>
                </div>
                <h2 className="hero-title text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Revisão <span className="brand-text">RAIO X</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  7 semanas intensivas de revisão completa de Química para vestibulares de Medicina. 
                  Método comprovado com milhares de aprovações.
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Semana 3 de 7</span>
                    <span className="text-sm font-medium text-primary">43%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full brand-gradient"
                      initial={{ width: 0 }}
                      whileInView={{ width: "43%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>

                <a href="https://app.moisesmedeiros.com.br" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2 rounded-xl press-effect">
                    Quero Participar
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {features.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover-lift"
                  >
                    <item.icon className={`h-8 w-8 ${item.color} mb-3`} />
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          LIVE SCHEDULE
          ============================================ */}
      <section className="py-20 bg-card/30" id="cronograma">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Cronograma Semanal</span>
            </div>
            <h2 className="hero-title text-3xl md:text-4xl font-bold text-foreground mb-4">
              Aulas <span className="brand-text">Ao Vivo</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Participe das aulas ao vivo e tire suas dúvidas diretamente com o professor.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {liveSchedule.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 hover-lift ${
                  item.status === "ao_vivo" 
                    ? "bg-primary/10 border-primary/40 shadow-wine" 
                    : "bg-card/50 border-border/50 hover:border-primary/30"
                }`}
              >
                {item.status === "ao_vivo" && (
                  <motion.div
                    className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    AO VIVO
                  </motion.div>
                )}
                
                <item.icon className={`h-8 w-8 mb-4 ${item.status === "ao_vivo" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-bold text-foreground mb-1">{item.day}</p>
                <p className="text-sm text-muted-foreground mb-2">{item.time}</p>
                <p className={`text-sm font-medium ${item.status === "ao_vivo" ? "text-primary" : "text-foreground"}`}>
                  {item.subject}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <section className="py-20 relative" id="aprovados">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stats-green/10 border border-stats-green/20 mb-4">
              <Trophy className="h-4 w-4 text-stats-green" />
              <span className="text-sm font-medium text-stats-green">Depoimentos Reais</span>
            </div>
            <h2 className="hero-title text-3xl md:text-4xl font-bold text-foreground mb-4">
              Histórias de <span className="brand-text">Sucesso</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Veja o que nossos alunos aprovados têm a dizer sobre a experiência.
            </p>
          </motion.div>

          {/* Testimonial Cards */}
          <div className="relative max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="spider-card p-8 md:p-10"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-stats-gold text-stats-gold" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-xl md:text-2xl text-foreground text-center mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-lg font-bold text-primary">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">{testimonials[currentTestimonial].name}</p>
                    <p className="text-sm text-primary">{testimonials[currentTestimonial].course}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentTestimonial 
                      ? "w-8 bg-primary" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Ver depoimento ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
            </motion.div>

            <h2 className="hero-title text-3xl md:text-5xl font-bold text-foreground mb-6">
              Pronto para sua <span className="brand-text">Aprovação</span>?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de alunos que conquistaram sua vaga em Medicina. 
              Sua jornada de sucesso começa agora.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://app.moisesmedeiros.com.br" target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2 rounded-xl h-14 px-10 text-lg heroic-glow press-effect"
                >
                  Comece Sua Jornada
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://wa.me/5531999999999" target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-border bg-card/50 hover:bg-card text-foreground gap-2 rounded-xl h-14 px-10 text-lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  Falar no WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-12 border-t border-border/30 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">M</span>
                </div>
                <div>
                  <p className="font-bold text-foreground hero-title">Prof. Moisés Medeiros</p>
                  <p className="text-xs text-muted-foreground">Química para Medicina</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm max-w-md">
                Transformando sonhos em aprovações há mais de 15 anos. 
                O método mais eficaz para vestibulares de Medicina do Brasil.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Links Úteis</h4>
              <ul className="space-y-2">
                <li><a href="#cursos" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cursos</a></li>
                <li><a href="#cronograma" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cronograma</a></li>
                <li><a href="#aprovados" className="text-sm text-muted-foreground hover:text-primary transition-colors">Aprovados</a></li>
                <li><Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">Área do Aluno</Link></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Redes Sociais</h4>
              <div className="flex gap-3">
                <a 
                  href="https://instagram.com/moisesmedeiros" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://youtube.com/@moisesmedeiros" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a 
                  href="https://wa.me/5531999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Prof. Moisés Medeiros. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link to="/politica-privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos-de-uso" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}