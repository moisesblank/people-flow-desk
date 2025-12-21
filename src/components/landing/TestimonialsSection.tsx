// ============================================
// SEÇÃO DEPOIMENTOS IMERSIVOS
// Histórias de transformação reais
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Play, GraduationCap, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "Maria Clara Santos",
    course: "Medicina - UFMG",
    photo: null,
    initials: "MC",
    rating: 5,
    text: "O curso do Professor Moisés foi divisor de águas na minha preparação. A metodologia é incrível, as aulas são envolventes e o material é completo. Passei em Medicina na UFMG no meu terceiro ano de cursinho!",
    highlight: "826 pontos no ENEM",
    color: "from-red-600 to-red-700",
  },
  {
    id: 2,
    name: "João Pedro Oliveira",
    course: "Medicina - USP",
    photo: null,
    initials: "JP",
    rating: 5,
    text: "Química sempre foi meu ponto fraco até conhecer o Professor Moisés. Ele transforma assuntos complexos em algo simples de entender. Resultado: 98% de aproveitamento em Química no ENEM!",
    highlight: "98% em Química",
    color: "from-blue-600 to-blue-700",
  },
  {
    id: 3,
    name: "Ana Beatriz Lima",
    course: "Farmácia - UNICAMP",
    photo: null,
    initials: "AB",
    rating: 5,
    text: "A IA do curso é fantástica! O TRAMON me ajudou a entender conceitos que eu não conseguia de jeito nenhum. O suporte é excelente e o aplicativo facilita muito estudar em qualquer lugar.",
    highlight: "Aprovada em 1ª chamada",
    color: "from-purple-600 to-purple-700",
  },
  {
    id: 4,
    name: "Lucas Mendes",
    course: "Engenharia Química - UFRJ",
    photo: null,
    initials: "LM",
    rating: 5,
    text: "O método ENA é revolucionário. Em 6 meses, minha nota em Química subiu de 600 para 850 pontos. O investimento se paga com a primeira aprovação!",
    highlight: "250 pontos a mais",
    color: "from-amber-500 to-amber-600",
  },
  {
    id: 5,
    name: "Fernanda Costa",
    course: "Medicina - UFBA",
    photo: null,
    initials: "FC",
    rating: 5,
    text: "Estudei sozinha por 2 anos sem sucesso. Com o Professor Moisés, em apenas 1 ano consegui minha aprovação. A didática dele é incomparável!",
    highlight: "Aprovada em 1 ano",
    color: "from-green-600 to-green-700",
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5, 
        scale: isActive ? 1 : 0.85,
        y: isActive ? 0 : 20,
      }}
      transition={{ duration: 0.5 }}
      className={`relative ${isActive ? 'z-10' : 'z-0'}`}
    >
      <div className={`relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl ${isActive ? 'shadow-2xl shadow-red-500/10' : ''}`}>
        {/* Quote icon */}
        <div className="absolute -top-4 -left-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${testimonial.color}`}>
            <Quote className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4 justify-end">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
          ))}
        </div>

        {/* Text */}
        <p className="text-lg text-gray-300 leading-relaxed mb-6 italic">
          "{testimonial.text}"
        </p>

        {/* Highlight */}
        <motion.div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${testimonial.color} mb-6`}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white">{testimonial.highlight}</span>
        </motion.div>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center`}>
            <span className="text-lg font-bold text-white">{testimonial.initials}</span>
          </div>
          <div>
            <h4 className="text-white font-bold">{testimonial.name}</h4>
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
    }, 5000);

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
    <section id="depoimentos" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" />
        <motion.div
          className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(30, 64, 175, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-700/40 mb-6"
          >
            <Award className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">Depoimentos Reais</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white mb-6"
          >
            Histórias de <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Sucesso</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Mais de 10.000 histórias de aprovação. Essas são apenas algumas delas.
          </motion.p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main testimonial */}
          <AnimatePresence mode="wait">
            <TestimonialCard
              key={testimonials[activeIndex].id}
              testimonial={testimonials[activeIndex]}
              isActive={true}
            />
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveIndex(i);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === activeIndex 
                      ? 'bg-red-500 w-8' 
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/50"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Auto-play indicator */}
          <motion.div
            className="flex items-center justify-center gap-2 mt-6"
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
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span>Reprodução automática</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Retomar reprodução</span>
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Stats below testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-16"
        >
          {[
            { value: "10.847+", label: "Aprovados" },
            { value: "4.9/5", label: "Avaliação Média" },
            { value: "98%", label: "Recomendam" },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
