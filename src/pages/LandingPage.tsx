// ============================================
// MOISÉS MEDEIROS v5.0 - LANDING PAGE
// Curso de Química - Página de Vendas
// Design: Futurista Premium + Conversão
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import professorPhoto from "@/assets/professor-moises.jpg";

// Animated counter component
function AnimatedCounter({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [target, duration]);

  return <span className="counter-glow">{count.toLocaleString('pt-BR')}{suffix}</span>;
}

// Live class schedule data
const liveSchedule = [
  { day: "Segunda", time: "19h", subject: "Química Orgânica", status: "gravada" },
  { day: "Terça", time: "19h", subject: "Físico-Química", status: "em_breve" },
  { day: "Quarta", time: "19h", subject: "Química Geral", status: "ao_vivo" },
  { day: "Quinta", time: "19h", subject: "Bioquímica", status: "em_breve" },
  { day: "Sexta", time: "20h", subject: "Revisão Semanal", status: "em_breve" },
];

// Testimonials
const testimonials = [
  { name: "Ana Clara", course: "Medicina UFMG", text: "O professor Moisés foi fundamental para minha aprovação!", avatar: "AC" },
  { name: "Pedro Henrique", course: "Medicina USP", text: "Didática excepcional! Química virou minha melhor matéria.", avatar: "PH" },
  { name: "Maria Eduarda", course: "Medicina UERJ", text: "Os resumos e a metodologia são simplesmente perfeitos.", avatar: "ME" },
];

// Medical schools logos (simulated)
const medSchools = [
  "USP", "UNICAMP", "UFMG", "UFRJ", "UERJ", "UNESP", "UNIFESP", "PUC"
];

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">M</span>
              </div>
              <div>
                <p className="font-bold text-foreground hero-title">Prof. Moisés</p>
                <p className="text-xs text-muted-foreground">Química para Medicina</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sobre</a>
              <a href="#cursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cursos</a>
              <a href="#aprovados" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Aprovados</a>
              <a href="#cronograma" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cronograma</a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Entrar
                </Button>
              </Link>
              <a href="https://app.moisesmedeiros.com.br" target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Área do Aluno</span>
                  <span className="sm:hidden">Entrar</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 hero-gradient overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/10 via-transparent to-transparent" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-stats-blue/5 via-transparent to-transparent" />
          <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ repeat: Infinity, duration: 8 }}
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">#1 em Aprovações em Medicina</span>
              </motion.div>

              {/* Title */}
              <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight mb-6">
                O Professor que{" "}
                <span className="brand-text">Mais Aprova</span>
                {" "}em Medicina no Brasil
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                Química de alto nível com metodologia exclusiva. 
                Milhares de alunos aprovados nas melhores faculdades de Medicina do país.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="https://app.moisesmedeiros.com.br" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-14 px-8 text-lg shadow-xl shadow-primary/25 heroic-glow">
                    Começar Agora
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
                <a href="https://app.moisesmedeiros.com.br/black-friday-2025" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-stats-blue text-stats-blue bg-stats-blue/10 hover:bg-stats-blue/20 gap-2 rounded-xl h-14 px-8 text-lg">
                    <Zap className="h-5 w-5" />
                    Black Friday 2025
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-primary/20">
                <div className="text-center lg:text-left">
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    <AnimatedCounter target={12847} suffix="+" />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Alunos Ativos</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl md:text-4xl font-bold text-stats-blue">
                    <AnimatedCounter target={4892} suffix="+" />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Aprovados 2024</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl md:text-4xl font-bold text-stats-gold">
                    <AnimatedCounter target={98} suffix="%" />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Satisfação</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative">
                {/* Glow Effect - Vermelho Vinho + Azul */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-stats-blue/20 rounded-3xl blur-2xl" />
                
                {/* Card */}
                <div className="relative wine-card p-8 md:p-10">
                  {/* Professor Photo */}
                  <div className="relative mx-auto w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden border-4 border-primary/30 mb-6 shadow-2xl shadow-primary/20">
                    <img 
                      src={professorPhoto} 
                      alt="Professor Moisés Medeiros" 
                      className="w-full h-full object-cover object-top"
                    />
                    <motion.div
                      className="absolute -bottom-2 -right-2 bg-stats-green rounded-full p-3 shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <CheckCircle2 className="h-6 w-6 text-background" />
                    </motion.div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground hero-title mb-1">Prof. Moisés Medeiros</h3>
                    <p className="text-muted-foreground mb-4">Química para Medicina</p>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
                        +15 anos de experiência
                      </span>
                      <span className="px-3 py-1 rounded-full bg-stats-blue/20 text-stats-blue text-xs font-medium border border-stats-blue/30">
                        Método exclusivo
                      </span>
                    </div>

                    {/* Live Badge */}
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm font-medium text-red-400">Próxima aula: Quarta 19h</span>
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
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </div>
        </motion.div>
      </section>

      {/* Raio X Section */}
      <section className="py-20 relative" id="cursos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative premium-card p-8 md:p-12 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/10 to-transparent" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
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
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
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
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl">
                    Quero Participar
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, label: "50+ Aulas", desc: "Conteúdo completo" },
                  { icon: Award, label: "Certificado", desc: "Reconhecido" },
                  { icon: Users, label: "Mentoria", desc: "Suporte direto" },
                  { icon: Sparkles, label: "Material", desc: "Exclusivo" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <item.icon className="h-8 w-8 text-primary mb-3" />
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Schedule */}
      <section className="py-20 bg-card/30" id="cronograma">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="hero-title text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cronograma <span className="blue-text">da Semana</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Acompanhe as aulas ao vivo e não perca nenhum conteúdo importante
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4">
            {liveSchedule.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`premium-card p-6 text-center ${
                  item.status === "ao_vivo" ? "border-red-500/50 bg-red-500/5" : ""
                }`}
              >
                <p className="text-sm font-medium text-muted-foreground mb-1">{item.day}</p>
                <div className="flex items-center justify-center gap-1 text-foreground mb-3">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">{item.time}</span>
                </div>
                <p className="text-sm text-foreground font-medium mb-3">{item.subject}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === "ao_vivo" 
                    ? "bg-red-500/20 text-red-400" 
                    : item.status === "gravada"
                    ? "bg-stats-green/20 text-stats-green"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {item.status === "ao_vivo" && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                  {item.status === "ao_vivo" ? "AO VIVO" : item.status === "gravada" ? "GRAVADA" : "EM BREVE"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20" id="aprovados">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="hero-title text-3xl md:text-4xl font-bold text-foreground mb-4">
              Aprovados que <span className="gold-text">Realizaram o Sonho</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Veja o que nossos alunos dizem sobre a experiência de estudar com o Professor Moisés
            </p>
          </motion.div>

          {/* Medical Schools */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
            {medSchools.map((school, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-3 rounded-full bg-secondary/50 border border-border/50"
              >
                <span className="text-sm font-medium text-muted-foreground">{school}</span>
              </motion.div>
            ))}
          </div>

          {/* Testimonial Carousel */}
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="premium-card p-8 md:p-10 text-center"
              >
                <div className="flex justify-center mb-4">
                  {[1,2,3,4,5].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-foreground italic mb-6">
                  "{testimonials[currentTestimonial].text}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">{testimonials[currentTestimonial].avatar}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{testimonials[currentTestimonial].name}</p>
                    <p className="text-sm text-stats-green">{testimonials[currentTestimonial].course}</p>
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
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentTestimonial ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="hero-title text-3xl md:text-5xl font-bold text-foreground mb-6">
              Pronto para <span className="brand-text">Transformar</span> seu Futuro?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de alunos que conquistaram a aprovação em Medicina com a metodologia do Professor Moisés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://app.moisesmedeiros.com.br" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-14 px-10 text-lg shadow-2xl shadow-primary/30">
                  Acessar Área do Aluno
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://wa.me/5511999999999?text=Olá! Quero saber mais sobre os cursos do Professor Moisés" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 rounded-xl h-14 px-10 text-lg">
                  <MessageCircle className="h-5 w-5" />
                  Fale Conosco
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
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
                O professor que mais aprova em Medicina no Brasil.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Links Úteis</h4>
              <ul className="space-y-2">
                <li><a href="https://app.moisesmedeiros.com.br/aluno" target="_blank" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Área do Aluno</a></li>
                <li><a href="#cursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cursos</a></li>
                <li><a href="#aprovados" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Aprovados</a></li>
                <li><a href="#cronograma" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cronograma</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Redes Sociais</h4>
              <div className="flex gap-3">
                <a href="https://instagram.com/profmoisesmedeiros" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors" aria-label="Instagram do Professor Moisés">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                </a>
                <a href="https://youtube.com/@profmoisesmedeiros" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors" aria-label="YouTube do Professor Moisés">
                  <Youtube className="h-5 w-5 text-muted-foreground" />
                </a>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors" aria-label="WhatsApp do Professor Moisés">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 Prof. Moisés Medeiros. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <a href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</a>
                <span>•</span>
                <a href="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Desenvolvido com ❤️ por Moisés Medeiros
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
