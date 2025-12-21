// ============================================
// MOISÉS MEDEIROS v30.0 - LANDING PAGE ÉPICA 2500
// ABERTURA CINEMATOGRÁFICA MARVEL SUPREME
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, ChevronRight, ChevronDown, Menu, X, Rocket, ArrowRight,
  Atom, FlaskConical, GraduationCap, Trophy, Award, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Components
import { CinematicIntro } from "@/components/landing/CinematicIntro";
import { RealtimeStats } from "@/components/landing/RealtimeStats";
import { AIAutomationsSection } from "@/components/landing/AIAutomationsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CoursesSection } from "@/components/landing/CoursesSection";
import { EpicCTASection } from "@/components/landing/EpicCTASection";
import { FuturisticFooter } from "@/components/landing/FuturisticFooter";

// Assets
import logoMoises from "@/assets/logo-moises-medeiros.png";
import professorHero from "@/assets/professor-moises-hero.jpg";

// ============================================
// BACKGROUND ANIMADO
// ============================================
const UltraBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
    <div className="absolute inset-0 opacity-20" style={{
      backgroundImage: `linear-gradient(rgba(220,38,38,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.2) 1px, transparent 1px)`,
      backgroundSize: '80px 80px'
    }} />
    <motion.div className="absolute -left-40 top-1/4 w-[900px] h-[900px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)', filter: 'blur(100px)' }} animate={{ x: [0, 100, 0], y: [0, 80, 0] }} transition={{ duration: 20, repeat: Infinity }} />
    <motion.div className="absolute -right-40 bottom-1/4 w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.3) 0%, transparent 70%)', filter: 'blur(100px)' }} animate={{ x: [0, -80, 0], y: [0, -100, 0] }} transition={{ duration: 18, repeat: Infinity }} />
  </div>
);

// ============================================
// NAVBAR
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
    { href: "#cursos", label: "Cursos" },
    { href: "#depoimentos", label: "Depoimentos" },
  ];

  return (
    <motion.nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/90 backdrop-blur-2xl border-b border-red-900/30 py-3" : "bg-transparent py-6"}`} initial={{ y: -100 }} animate={{ y: 0 }}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/"><motion.img src={logoMoises} alt="Moisés Medeiros" className="h-10 md:h-12" whileHover={{ scale: 1.05 }} /></Link>
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className="text-sm font-semibold text-gray-300 hover:text-white transition-colors relative group">{link.label}<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-blue-600 group-hover:w-full transition-all duration-300" /></a>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/auth"><Button variant="ghost" className="text-gray-300 hover:text-white">Área do Aluno</Button></Link>
          <Link to="/auth"><motion.div whileHover={{ scale: 1.05 }}><Button className="bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-500/30 px-6 font-bold"><Rocket className="w-4 h-4 mr-2" />Matricule-se</Button></motion.div></Link>
        </div>
        <button className="lg:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}</button>
      </div>
    </motion.nav>
  );
};

// ============================================
// HERO SECTION
// ============================================
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      <motion.div style={{ y, opacity }} className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }} className="text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-900/40 to-blue-900/40 border border-red-700/40 mb-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}><Atom className="w-5 h-5 text-red-400" /></motion.div>
              <span className="text-sm font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">O CURSO QUE MAIS APROVA EM MEDICINA</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="text-white">Sua aprovação</span>
              <span className="block bg-gradient-to-r from-red-600 via-red-500 to-amber-500 bg-clip-text text-transparent">começa aqui!</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0">O método que já aprovou <span className="text-red-400 font-bold">mais de 10.000 alunos</span> em Medicina nas melhores universidades.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link to="/auth"><motion.div whileHover={{ scale: 1.03 }}><Button size="lg" className="bg-gradient-to-r from-red-700 to-red-600 text-white shadow-2xl shadow-red-600/40 px-8 h-16 text-lg font-bold w-full sm:w-auto">QUERO SER APROVADO<ArrowRight className="w-5 h-5 ml-2" /></Button></motion.div></Link>
              <motion.a href="#video" whileHover={{ scale: 1.03 }}><Button size="lg" variant="outline" className="border-2 border-gray-600 hover:border-red-600/50 bg-white/5 h-16 text-lg w-full sm:w-auto"><Play className="w-5 h-5 mr-2 text-red-400" />Ver Aula Grátis</Button></motion.a>
            </div>
            <RealtimeStats variant="hero" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="relative hidden lg:block">
            <div className="absolute -inset-4 bg-gradient-to-br from-red-600/30 via-purple-600/20 to-blue-600/30 rounded-3xl blur-3xl" />
            <motion.div className="relative rounded-3xl overflow-hidden border-2 border-white/10" whileHover={{ scale: 1.02 }}>
              <img src={professorHero} alt="Professor Moisés" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <motion.div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-red-600/30" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center"><FlaskConical className="w-7 h-7 text-white" /></div>
                  <div><div className="text-white font-bold text-lg">Prof. Moisés Medeiros</div><div className="text-gray-400 text-sm">Mestre em Química • 15+ anos</div></div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </motion.div>
    </section>
  );
};

// ============================================
// MAIN HOME COMPONENT
// ============================================
const Home = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const introSeen = sessionStorage.getItem("intro_seen_v30");
    if (introSeen) { setShowIntro(false); setIsLoaded(true); }
  }, []);

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem("intro_seen_v30", "true");
    setShowIntro(false);
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      {!showIntro && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: isLoaded ? 1 : 0 }} transition={{ duration: 0.5 }}>
          <UltraBackground />
          <Navbar />
          <HeroSection />
          <RealtimeStats variant="section" />
          <AIAutomationsSection />
          <CoursesSection />
          <TestimonialsSection />
          <EpicCTASection />
          <FuturisticFooter />
        </motion.div>
      )}
    </div>
  );
};

export default Home;
