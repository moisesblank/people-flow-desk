// ============================================
// DEPOIMENTOS REAIS - VERSÃO 2500 ULTRA
// Feedbacks reais de WhatsApp + Carousel
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { 
  Star, Quote, ChevronLeft, ChevronRight, Play, 
  GraduationCap, Award, TrendingUp, Sparkles, Heart,
  MessageCircle, CheckCheck, Trophy, Flame, Crown,
  Instagram, Youtube, Users, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Imagens reais de depoimentos
import depoimentoWhatsapp1 from "@/assets/testimonials/depoimento-whatsapp-1.jpg";
import feedbacksReais from "@/assets/testimonials/feedbacks-reais.png";

// Depoimentos baseados nos prints reais
const realTestimonials = [
  {
    id: 1,
    type: 'whatsapp',
    name: "Aluno ENEM 2026",
    course: "ENEM - Química",
    text: "ANO PASSADO 4 QUESTÕES DE QUÍMICA. ESSE ANO 14. Errei só a do alumínio, pq esqueci dos 10% a mais. EVOLUÇÃO ABSURDA NO ENEM!",
    highlight: "4 → 14 questões certas",
    subText: "UECE acertei TODAS de química. URCA acertei TODAS de química. ENEM 14/15!",
    gradient: "from-green-600 to-emerald-500",
    glow: "rgba(34, 197, 94, 0.5)",
    emoji: "🔥",
    verified: true,
  },
  {
    id: 2,
    type: 'whatsapp',
    name: "Aluno Agradecido",
    course: "Bolsista",
    text: "Eu só tenho a agradecer ao senhor por ter mudado minha forma de ver a química!!! Só eu sei o peso de 8 anos de cursinho nas costas, quando ninguém mais lhe apoia e o senhor me apoiou e deixou o processo muito mais leve !!!",
    highlight: "8 anos de luta → APROVAÇÃO",
    subText: "Muito muito obrigado novamente! Quero lhe dar essa aprovação!",
    gradient: "from-purple-600 to-violet-500",
    glow: "rgba(147, 51, 234, 0.5)",
    emoji: "🙏",
    verified: true,
  },
  {
    id: 3,
    type: 'whatsapp',
    name: "Aluna Moisa",
    course: "Vestibular",
    text: "13/15 em química!! Agora é esperar a TRI e a nota da redação. Mais uma vez muito obrigado pelos ensinamentos, você é brabo!! 👏",
    highlight: "13/15 em Química",
    subText: "Gratidão, Deus....",
    gradient: "from-red-600 to-pink-500",
    glow: "rgba(220, 38, 38, 0.5)",
    emoji: "❤️",
    verified: true,
  },
  {
    id: 4,
    type: 'whatsapp',
    name: "Aluno Global",
    course: "ENEM",
    text: "Falaaaa moisa, errei só 2, uma foi a global (errei por besteira) e uma de esteq (besteira tbm kkkkkk), mas faz parte, feliz pelo resultado. Obrigado por tudo, esse resultado é nosso!",
    highlight: "Errei só 2 questões!",
    subText: "E as piadas caem até na prova, química do carbono tá aí pra comprovar 😂",
    gradient: "from-blue-600 to-cyan-500",
    glow: "rgba(37, 99, 235, 0.5)",
    emoji: "💪",
    verified: true,
  },
  {
    id: 5,
    type: 'whatsapp',
    name: "Aluna Memória",
    course: "Química",
    text: "EU AMEI QUÍMICA HJ, ainda não corrigi a prova, mas todas as questões de química eu lembrei das aulas, sem palavras, gostei de verdade. Deus quiser 🙏",
    highlight: "Lembrou de TUDO na prova",
    subText: "Teve uma específica que eu lembrei automaticamente do projeto raio x",
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245, 158, 11, 0.5)",
    emoji: "✨",
    verified: true,
  },
  {
    id: 6,
    type: 'whatsapp',
    name: "Aluna Grata",
    course: "Química",
    text: "Moisa, cada questão que eu fazia de química só lembrava de vc e das suas aulas. De verdade, química foi mais fácil por conta sua. Obrigada Moisaaaaaa ❤️",
    highlight: "Química mais fácil!",
    subText: "Cada questão lembrava das aulas",
    gradient: "from-pink-600 to-rose-500",
    glow: "rgba(236, 72, 153, 0.5)",
    emoji: "💖",
    verified: true,
  },
];

// Stats épicos
const epicStats = [
  { value: "10.847+", label: "Alunos Transformados", icon: GraduationCap, color: "from-green-500 to-emerald-400" },
  { value: "98%", label: "Taxa de Aprovação", icon: Trophy, color: "from-amber-500 to-orange-400" },
  { value: "4.9/5", label: "Avaliação Média", icon: Star, color: "from-purple-500 to-violet-400" },
  { value: "24/7", label: "Suporte IA", icon: Zap, color: "from-blue-500 to-cyan-400" },
];

// Componente de mensagem estilo WhatsApp
const WhatsAppMessage = ({ testimonial, isActive }: { testimonial: typeof realTestimonials[0]; isActive: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5, 
        scale: isActive ? 1 : 0.9,
        y: isActive ? 0 : 20,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="relative max-w-2xl mx-auto"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-4 rounded-3xl blur-2xl"
        style={{ background: testimonial.glow }}
        animate={{ opacity: isActive ? 0.4 : 0.1 }}
      />

      {/* Card principal estilo WhatsApp */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1f0a] via-[#0d2b0d] to-[#0a1f0a] border border-green-500/20 shadow-2xl">
        {/* Header do WhatsApp */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-b border-green-500/20">
          <motion.div 
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-2xl`}
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {testimonial.emoji}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{testimonial.name}</span>
              {testimonial.verified && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCheck className="w-5 h-5 text-green-400" />
                </motion.div>
              )}
            </div>
            <span className="text-green-400/80 text-sm">{testimonial.course}</span>
          </div>
          <MessageCircle className="w-5 h-5 text-green-400/60" />
        </div>

        {/* Corpo da mensagem */}
        <div className="p-6 space-y-4">
          {/* Mensagem principal */}
          <motion.div 
            className="relative p-5 rounded-2xl bg-gradient-to-br from-green-900/30 to-green-950/50 border border-green-500/10"
            whileHover={{ scale: 1.01 }}
          >
            <p className="text-gray-200 text-lg leading-relaxed">
              {testimonial.text}
            </p>
            <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
              <span>Hoje</span>
              <CheckCheck className="w-4 h-4 text-blue-400" />
            </div>
          </motion.div>

          {/* Sub mensagem */}
          {testimonial.subText && (
            <motion.div 
              className="p-4 rounded-xl bg-green-950/40 border border-green-500/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-gray-400 text-sm italic">"{testimonial.subText}"</p>
            </motion.div>
          )}

          {/* Highlight badge */}
          <motion.div
            className={`inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r ${testimonial.gradient}`}
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: `0 10px 40px ${testimonial.glow}` }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="text-base font-bold text-white">{testimonial.highlight}</span>
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
        </div>

        {/* Decoração */}
        <motion.div
          className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full"
          style={{ background: `radial-gradient(circle, ${testimonial.glow} 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
};

// Galeria de prints reais
const RealFeedbacksGallery = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-20"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-900/30 border border-green-700/40 mb-6"
          animate={{ boxShadow: ["0 0 20px rgba(34,197,94,0.2)", "0 0 40px rgba(34,197,94,0.4)", "0 0 20px rgba(34,197,94,0.2)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <MessageCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-bold text-green-400 tracking-wide">PRINTS REAIS DO WHATSAPP</span>
        </motion.div>
        
        <h3 className="text-3xl font-black text-white mb-4">
          Feedbacks <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">100% Autênticos</span>
        </h3>
      </div>

      {/* Imagem grande com efeitos */}
      <motion.div
        className="relative rounded-3xl overflow-hidden border border-green-500/20"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        {/* Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-green-600/20 blur-2xl" />
        
        <div className="relative">
          <img 
            src={feedbacksReais} 
            alt="Feedbacks reais de alunos no WhatsApp"
            className="w-full h-auto rounded-3xl"
          />
          
          {/* Overlay com gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badge verificado */}
          <motion.div
            className="absolute bottom-6 left-6 flex items-center gap-3 px-5 py-3 rounded-full bg-green-600/90 backdrop-blur-xl"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCheck className="w-5 h-5 text-white" />
            <span className="text-white font-bold">Mensagens Reais Verificadas</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Print individual grande */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-10 grid md:grid-cols-2 gap-8"
      >
        {/* Print WhatsApp */}
        <div className="relative rounded-3xl overflow-hidden border border-green-500/20 group">
          <motion.div
            className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"
          />
          <img 
            src={depoimentoWhatsapp1} 
            alt="Depoimento real de aluno aprovado"
            className="relative w-full h-auto rounded-3xl"
          />
        </div>

        {/* Info card */}
        <div className="flex flex-col justify-center space-y-6">
          <motion.div
            className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h4 className="text-2xl font-black text-white">Histórias Reais</h4>
                <p className="text-purple-400">Transformações que inspiram</p>
              </div>
            </div>

            <ul className="space-y-4">
              {[
                "Alunos de 8 anos de cursinho aprovados",
                "De 4 para 14 questões certas no ENEM",
                "13/15 e 14/15 em química",
                "100% em UECE e URCA",
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="p-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <CheckCheck className="w-4 h-4 text-white" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex -space-x-3">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-black flex items-center justify-center text-xs font-bold text-white"
                >
                  {["MC", "JP", "AB", "LM", "FC"][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white font-semibold">+10.000 alunos aprovados</p>
              <p className="text-gray-400 text-sm">Junte-se à nossa comunidade</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente principal
export const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % realTestimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + realTestimonials.length) % realTestimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % realTestimonials.length);
  };

  return (
    <section id="depoimentos" ref={sectionRef} className="relative py-32 overflow-hidden">
      {/* Background épico */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/10 to-transparent" />
        
        {/* Orbes de energia */}
        <motion.div
          className="absolute left-0 top-1/4 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{ scale: [1, 1.3, 1], x: [0, 100, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-0 bottom-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{ y: [0, -80, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header épico */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-700/40 mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-5 h-5 text-red-400" fill="currentColor" />
            </motion.div>
            <span className="text-sm font-bold text-green-400 tracking-wide">DEPOIMENTOS 100% REAIS</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6"
          >
            Histórias de{" "}
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Sucesso
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            Prints reais do WhatsApp. Resultados reais. Transformações que mudam vidas.
          </motion.p>
        </div>

        {/* Stats épicos */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16"
        >
          {epicStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="relative group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-30 blur-lg group-hover:opacity-50 transition-opacity"
                style={{ background: `linear-gradient(to right, ${stat.color.replace('from-', '').replace('to-', ', ')})` }}
              />
              <div className="relative p-5 rounded-2xl bg-black/50 border border-white/10 text-center backdrop-blur-xl">
                <motion.div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-3`}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div className="text-2xl md:text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Carousel de depoimentos */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <WhatsAppMessage
              key={realTestimonials[activeIndex].id}
              testimonial={realTestimonials[activeIndex]}
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
                className="rounded-full border-green-500/30 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50 w-14 h-14"
              >
                <ChevronLeft className="w-6 h-6 text-green-400" />
              </Button>
            </motion.div>

            <div className="flex items-center gap-3">
              {realTestimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveIndex(i);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-12 h-3' 
                      : 'bg-white/20 hover:bg-white/40 w-3 h-3'
                  }`}
                  whileHover={{ scale: 1.3 }}
                />
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full border-green-500/30 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50 w-14 h-14"
              >
                <ChevronRight className="w-6 h-6 text-green-400" />
              </Button>
            </motion.div>
          </div>

          {/* Auto-play indicator */}
          <motion.div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-400 transition-colors"
            >
              {isAutoPlaying ? (
                <>
                  <motion.div
                    className="relative"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-green-500"
                      animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                  <span>Reprodução automática</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Retomar reprodução</span>
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Galeria de prints reais */}
        <RealFeedbacksGallery />

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-center gap-6 mt-16"
        >
          <span className="text-gray-400">Siga nas redes:</span>
          <div className="flex gap-4">
            <motion.a
              href="https://www.instagram.com/stories/highlights/18159508996361307/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-semibold"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(236, 72, 153, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Instagram className="w-5 h-5" />
              Instagram Stories
            </motion.a>
            <motion.a
              href="https://www.youtube.com/@moisesmedeirosquim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(220, 38, 38, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Youtube className="w-5 h-5" />
              YouTube
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
