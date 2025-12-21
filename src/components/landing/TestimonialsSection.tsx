// ============================================
// DEPOIMENTOS IMERSIVOS - VERSÃO 2500
// Histórias de transformação épicas
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Quote, ChevronLeft, ChevronRight, Play, 
  GraduationCap, Award, TrendingUp, Sparkles, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "Maria Clara Santos",
    course: "Medicina - UFMG",
    initials: "MC",
    rating: 5,
    text: "O curso do Professor Moisés foi divisor de águas na minha preparação. A metodologia é incrível, as aulas são envolventes e o material é completo. Passei em Medicina na UFMG no meu terceiro ano de cursinho! A IA TRAMON me ajudou demais nas revisões.",
    highlight: "826 pontos no ENEM",
    gradient: "from-red-600 to-red-700",
    glow: "rgba(220, 38, 38, 0.4)",
    before: "600 pts",
    after: "826 pts",
  },
  {
    id: 2,
    name: "João Pedro Oliveira",
    course: "Medicina - USP",
    initials: "JP",
    rating: 5,
    text: "Química sempre foi meu ponto fraco até conhecer o Professor Moisés. Ele transforma assuntos complexos em algo simples de entender. Resultado: 98% de aproveitamento em Química no ENEM! Recomendo para todos.",
    highlight: "98% em Química",
    gradient: "from-blue-600 to-blue-700",
    glow: "rgba(37, 99, 235, 0.4)",
    before: "45%",
    after: "98%",
  },
  {
    id: 3,
    name: "Ana Beatriz Lima",
    course: "Farmácia - UNICAMP",
    initials: "AB",
    rating: 5,
    text: "A IA do curso é fantástica! O TRAMON me ajudou a entender conceitos que eu não conseguia de jeito nenhum. O suporte é excelente e o aplicativo facilita muito estudar em qualquer lugar. Aprovada em 1ª chamada!",
    highlight: "Aprovada em 1ª chamada",
    gradient: "from-purple-600 to-purple-700",
    glow: "rgba(147, 51, 234, 0.4)",
    before: "Reprovada 2x",
    after: "1ª Chamada",
  },
  {
    id: 4,
    name: "Lucas Mendes",
    course: "Engenharia Química - UFRJ",
    initials: "LM",
    rating: 5,
    text: "O método ENA é revolucionário. Em 6 meses, minha nota em Química subiu de 600 para 850 pontos. O investimento se paga com a primeira aprovação! O professor é sensacional.",
    highlight: "250 pontos a mais",
    gradient: "from-amber-500 to-amber-600",
    glow: "rgba(245, 158, 11, 0.4)",
    before: "600 pts",
    after: "850 pts",
  },
  {
    id: 5,
    name: "Fernanda Costa",
    course: "Medicina - UFBA",
    initials: "FC",
    rating: 5,
    text: "Estudei sozinha por 2 anos sem sucesso. Com o Professor Moisés, em apenas 1 ano consegui minha aprovação. A didática dele é incomparável! Melhor investimento que já fiz.",
    highlight: "Aprovada em 1 ano",
    gradient: "from-green-600 to-green-700",
    glow: "rgba(34, 197, 94, 0.4)",
    before: "2 anos sem sucesso",
    after: "Aprovada em 1 ano",
  },
];

const TestimonialCard = ({ 
  testimonial, 
  isActive 
}: { 
  testimonial: typeof testimonials[0];
  isActive: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
      animate={{ 
        opacity: isActive ? 1 : 0.4, 
        scale: isActive ? 1 : 0.85,
        y: isActive ? 0 : 30,
        rotateY: isActive ? 0 : -5,
      }}
      transition={{ duration: 0.6, type: "spring" }}
      className={`relative ${isActive ? 'z-10' : 'z-0'}`}
    >
      {/* Glow de fundo */}
      <motion.div
        className="absolute -inset-4 rounded-3xl blur-2xl"
        style={{ background: testimonial.glow }}
        animate={{ opacity: isActive ? 0.3 : 0 }}
      />
      
      <div className={`relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-white/[0.1] to-white/[0.02] border border-white/10 backdrop-blur-2xl ${isActive ? 'shadow-2xl' : ''}`}>
        {/* Quote icon flutuante */}
        <motion.div 
          className="absolute -top-6 -left-2"
          animate={{ y: isActive ? [0, -5, 0] : 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${testimonial.gradient} shadow-lg`}
            style={{ boxShadow: `0 10px 40px ${testimonial.glow}` }}
          >
            <Quote className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        {/* Rating com brilho */}
        <div className="flex items-center gap-1.5 mb-6 justify-end">
          {[...Array(testimonial.rating)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Star className="w-5 h-5 text-amber-400" fill="currentColor" />
            </motion.div>
          ))}
        </div>

        {/* Texto do depoimento */}
        <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-8 italic">
          "{testimonial.text}"
        </p>

        {/* Highlight badge */}
        <motion.div
          className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r ${testimonial.gradient} mb-8`}
          animate={isActive ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="w-5 h-5 text-white" />
          <span className="text-base font-bold text-white">{testimonial.highlight}</span>
        </motion.div>

        {/* Before/After visual */}
        <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Antes</div>
            <div className="text-lg font-bold text-gray-400">{testimonial.before}</div>
          </div>
          <motion.div
            className={`p-2 rounded-full bg-gradient-to-r ${testimonial.gradient}`}
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <TrendingUp className="w-4 h-4 text-white" />
          </motion.div>
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Depois</div>
            <div className="text-lg font-bold text-white">{testimonial.after}</div>
          </div>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-4">
          <motion.div 
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center`}
            style={{ boxShadow: `0 5px 30px ${testimonial.glow}` }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <span className="text-xl font-bold text-white">{testimonial.initials}</span>
          </motion.div>
          <div>
            <h4 className="text-white font-bold text-lg">{testimonial.name}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <GraduationCap className="w-4 h-4" />
              {testimonial.course}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section id="depoimentos" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" />
        
        {/* Orbe de energia */}
        <motion.div
          className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(30, 64, 175, 0.12) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 80, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-900/30 border border-blue-700/40 mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-5 h-5 text-red-400" fill="currentColor" />
            </motion.div>
            <span className="text-sm font-bold text-blue-400 tracking-wide">HISTÓRIAS REAIS DE TRANSFORMAÇÃO</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6"
          >
            Histórias de <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Sucesso</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Mais de 10.000 histórias de aprovação. Estas são apenas algumas delas.
          </motion.p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <TestimonialCard
              key={testimonials[activeIndex].id}
              testimonial={testimonials[activeIndex]}
              isActive={true}
            />
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 w-12 h-12"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </motion.div>

            <div className="flex items-center gap-3">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveIndex(i);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 w-10 h-3' 
                      : 'bg-white/20 hover:bg-white/40 w-3 h-3'
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 w-12 h-12"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </motion.div>
          </div>

          {/* Auto-play indicator */}
          <motion.div
            className="flex items-center justify-center gap-3 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
            >
              {isAutoPlaying ? (
                <>
                  <motion.div
                    className="relative"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-green-500"
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                  <span>Reprodução automática ativa</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Retomar reprodução automática</span>
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Stats abaixo dos depoimentos */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20"
        >
          {[
            { value: "10.847+", label: "Alunos Aprovados", icon: GraduationCap },
            { value: "4.9/5", label: "Avaliação Média", icon: Star },
            { value: "98%", label: "Recomendam", icon: Heart },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label} 
              className="text-center"
              whileHover={{ y: -5 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 mb-4"
                whileHover={{ rotate: [0, -5, 5, 0] }}
              >
                <stat.icon className="w-7 h-7 text-blue-400" />
              </motion.div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
