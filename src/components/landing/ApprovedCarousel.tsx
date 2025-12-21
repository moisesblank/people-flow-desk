// ============================================
// APPROVED STUDENTS CAROUSEL - HALL OF FAME 2300
// Carrossel cinematográfico estilo Marvel dos aprovados
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Trophy,
  Star,
  Sparkles,
  GraduationCap,
  Zap,
  Award
} from "lucide-react";

// Import approved students images
import aprovado1 from "@/assets/aprovados/aprovado-1.png";
import aprovado2 from "@/assets/aprovados/aprovado-2.png";
import aprovado3 from "@/assets/aprovados/aprovado-3.png";
import aprovado4 from "@/assets/aprovados/aprovado-4.png";
import aprovado5 from "@/assets/aprovados/aprovado-5.png";
import aprovado6 from "@/assets/aprovados/aprovado-6.png";
import aprovado7 from "@/assets/aprovados/aprovado-7.png";
import aprovado8 from "@/assets/aprovados/aprovado-8.png";
import aprovado9 from "@/assets/aprovados/aprovado-9.png";
import aprovado10 from "@/assets/aprovados/aprovado-10.png";

// Lista de alunos aprovados
const approvedStudents = [
  { id: 1, image: aprovado1, nome: "Ailton Filho", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "O Professor Moisés mudou minha vida! Aprovei em 1º lugar!" },
  { id: 2, image: aprovado2, nome: "Artur Leal", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Método incrível, didática perfeita!" },
  { id: 3, image: aprovado3, nome: "Carlos Cauã Cavalvanti", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "A plataforma é sensacional, IA me ajudou muito!" },
  { id: 4, image: aprovado4, nome: "Arthur Sodré", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Gratidão eterna ao Prof. Moisés!" },
  { id: 5, image: aprovado5, nome: "Beatriz Mamede", curso: "Medicina", universidade: "UFCG", ano: "2K24", feedback: "Sonho realizado graças a essa metodologia!" },
  { id: 6, image: aprovado6, nome: "Arthur Antônio", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Melhor investimento da minha vida!" },
  { id: 7, image: aprovado7, nome: "Ana Clara Muniz", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Do zero à aprovação em medicina federal!" },
  { id: 8, image: aprovado8, nome: "Maria Clara", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Prof. Moisés é simplesmente o melhor!" },
  { id: 9, image: aprovado9, nome: "Ana Clara Nóbrega", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "A IA do curso me deu um diferencial imenso!" },
  { id: 10, image: aprovado10, nome: "Ana Beatriz Aires", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Recomendo de olhos fechados!" },
];

// Card de aluno aprovado
const ApprovedCard = ({ 
  student, 
  index,
  isActive
}: { 
  student: typeof approvedStudents[0]; 
  index: number;
  isActive: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isActive ? 1 : 0.6, 
        scale: isActive ? 1 : 0.85,
        y: isActive ? 0 : 20
      }}
      transition={{ duration: 0.5 }}
      className={`flex-shrink-0 w-[300px] md:w-[350px] cursor-pointer group relative ${isActive ? 'z-20' : 'z-10'}`}
    >
      {/* Cinematic Glow - only for active */}
      {isActive && (
        <>
          <motion.div
            className="absolute -inset-4 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.4) 0%, rgba(147,51,234,0.4) 50%, rgba(59,130,246,0.4) 100%)',
              filter: 'blur(30px)',
            }}
            animate={{ 
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {/* Rotating Border */}
          <motion.div
            className="absolute -inset-1 rounded-3xl overflow-hidden"
            style={{
              background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #ec4899)',
              padding: '2px'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}

      <div className={`relative rounded-3xl overflow-hidden border-2 ${isActive ? 'border-transparent' : 'border-white/10'} bg-black/90 transition-all duration-500`}>
        {/* Image Container */}
        <div className="aspect-square relative overflow-hidden">
          <img
            src={student.image}
            alt={student.nome}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Cinematic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          
          {/* Holographic Effect */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(45deg, transparent 40%, rgba(236,72,153,0.3) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
            }}
            animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Trophy Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 right-4 p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/50"
          >
            <Trophy className="w-6 h-6 text-white" fill="currentColor" />
          </motion.div>

          {/* Year Badge */}
          <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-pink-500/50 text-sm font-black text-pink-400">
            {student.ano}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-6 bg-gradient-to-b from-black/90 to-black relative">
          {/* Scan Lines Effect */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }} />

          <div className="relative z-10">
            {/* Name */}
            <h3 className="text-xl font-black text-white mb-1">{student.nome}</h3>
            
            {/* University */}
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-pink-500" />
              <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                {student.curso} - {student.universidade}
              </span>
            </div>

            {/* Feedback */}
            <p className="text-sm text-gray-400 italic line-clamp-2">
              "{student.feedback}"
            </p>

            {/* Stars */}
            <div className="flex items-center gap-1 mt-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" />
              ))}
              <span className="text-xs text-gray-400 ml-2">Verificado</span>
            </div>
          </div>

          {/* Animated Border Bottom */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: isActive ? '100%' : '0%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Componente principal
export const ApprovedCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % approvedStudents.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  // Scroll to active card
  useEffect(() => {
    if (containerRef.current) {
      const cardWidth = 370; // card width + gap
      const scrollPosition = activeIndex * cardWidth - (containerRef.current.clientWidth / 2) + (cardWidth / 2);
      containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [activeIndex]);

  const navigate = (direction: 'prev' | 'next') => {
    setIsAutoPlay(false);
    if (direction === 'prev') {
      setActiveIndex((prev) => (prev - 1 + approvedStudents.length) % approvedStudents.length);
    } else {
      setActiveIndex((prev) => (prev + 1) % approvedStudents.length);
    }
  };

  return (
    <section id="aprovados-carousel" className="relative py-24 overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-pink-500/50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Cinematic Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-pink-500/20 border border-yellow-500/30 mb-8"
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-400">HALL OF FAME 2024</span>
            <Sparkles className="w-5 h-5 text-pink-400" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6"
          >
            <span className="text-white">Nossos </span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Aprovados
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-400 max-w-3xl mx-auto flex items-center justify-center gap-3"
          >
            <Award className="w-6 h-6 text-pink-500" />
            Conheça os guerreiros que conquistaram a tão sonhada vaga em Medicina
            <Zap className="w-6 h-6 text-purple-500" />
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-10 inline-flex items-center gap-8 px-8 py-4 rounded-2xl bg-black/50 border border-white/10"
          >
            <div className="text-center">
              <div className="text-3xl font-black text-pink-500">2.847+</div>
              <div className="text-xs text-gray-400">Aprovados Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-black text-purple-500">98%</div>
              <div className="text-xs text-gray-400">Satisfação</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-black text-blue-500">#1</div>
              <div className="text-xs text-gray-400">Em Aprovação</div>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="container mx-auto px-4 flex justify-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('prev')}
            className="p-4 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white hover:border-pink-500 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('next')}
            className="p-4 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white hover:border-pink-500 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Carousel */}
        <div 
          ref={containerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-8 items-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {approvedStudents.map((student, index) => (
            <ApprovedCard
              key={student.id}
              student={student}
              index={index}
              isActive={index === activeIndex}
            />
          ))}
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {approvedStudents.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlay(false);
                setActiveIndex(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'w-8 bg-gradient-to-r from-pink-500 to-purple-500' 
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Auto-play indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <motion.div
            className={`w-2 h-2 rounded-full ${isAutoPlay ? 'bg-green-500' : 'bg-gray-500'}`}
            animate={isAutoPlay ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs text-gray-400">
            {isAutoPlay ? 'Reprodução automática' : 'Pausado'}
          </span>
        </div>
      </div>
    </section>
  );
};
