// ============================================
// APPROVED STUDENTS CAROUSEL - PERFORMANCE OPTIMIZED
// ============================================

import { useState, useEffect, useRef, memo, useCallback } from "react";
import { Trophy, Star, Sparkles, GraduationCap, Award, ChevronLeft, ChevronRight } from "lucide-react";

// Import apenas 10 imagens para performance
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

const approvedStudents = [
  { id: 1, image: aprovado1, nome: "Ailton Filho", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "O Professor Moisés mudou minha vida!" },
  { id: 2, image: aprovado2, nome: "Artur Leal", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Método incrível!" },
  { id: 3, image: aprovado3, nome: "Carlos Cauã", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Plataforma sensacional!" },
  { id: 4, image: aprovado4, nome: "Arthur Sodré", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Gratidão eterna!" },
  { id: 5, image: aprovado5, nome: "Beatriz Mamede", curso: "Medicina", universidade: "UFCG", ano: "2K24", feedback: "Sonho realizado!" },
  { id: 6, image: aprovado6, nome: "Arthur Antônio", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Melhor investimento!" },
  { id: 7, image: aprovado7, nome: "Ana Clara Muniz", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Do zero à aprovação!" },
  { id: 8, image: aprovado8, nome: "Maria Clara", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Prof. Moisés é o melhor!" },
  { id: 9, image: aprovado9, nome: "Ana Clara Nóbrega", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "IA do curso é incrível!" },
  { id: 10, image: aprovado10, nome: "Ana Beatriz Aires", curso: "Medicina", universidade: "UFPB", ano: "2K24", feedback: "Recomendo!" },
];

const ApprovedCard = memo(({ student, isActive }: { student: typeof approvedStudents[0]; isActive: boolean }) => (
  <div className={`flex-shrink-0 w-[280px] md:w-[320px] transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}>
    <div className={`rounded-2xl overflow-hidden border-2 ${isActive ? 'border-pink-500/50' : 'border-white/10'} bg-black/90`}>
      <div className="aspect-square relative overflow-hidden">
        <img src={student.image} alt={student.nome} className="w-full h-full object-cover object-top" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute top-3 right-3 p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600">
          <Trophy className="w-5 h-5 text-white" fill="currentColor" />
        </div>
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/70 border border-pink-500/50 text-sm font-bold text-pink-400">
          {student.ano}
        </div>
      </div>
      <div className="p-4 bg-black">
        <h3 className="text-lg font-bold text-white mb-1">{student.nome}</h3>
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-medium text-pink-400">{student.curso} - {student.universidade}</span>
        </div>
        <p className="text-sm text-gray-400 italic">"{student.feedback}"</p>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-500" fill="currentColor" />)}
        </div>
      </div>
    </div>
  </div>
));

ApprovedCard.displayName = 'ApprovedCard';

export const ApprovedCarousel = memo(() => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => setActiveIndex((prev) => (prev + 1) % approvedStudents.length), 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  useEffect(() => {
    if (containerRef.current) {
      const cardWidth = 340;
      const scrollPosition = activeIndex * cardWidth - (containerRef.current.clientWidth / 2) + (cardWidth / 2);
      containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [activeIndex]);

  const navigate = useCallback((dir: 'prev' | 'next') => {
    setIsAutoPlay(false);
    setActiveIndex((prev) => dir === 'prev' ? (prev - 1 + approvedStudents.length) % approvedStudents.length : (prev + 1) % approvedStudents.length);
  }, []);

  return (
    <section id="aprovados-carousel" className="relative py-16 overflow-hidden bg-gradient-to-b from-black via-slate-950 to-black">
      <div className="container mx-auto px-4 text-center mb-12">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-6">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-bold text-yellow-400">HALL OF FAME 2024</span>
          <Sparkles className="w-5 h-5 text-pink-400" />
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-4">
          <span className="text-white">Nossos </span>
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Aprovados</span>
        </h2>
        <p className="text-lg text-gray-400 flex items-center justify-center gap-2">
          <Award className="w-5 h-5 text-pink-500" />
          Guerreiros que conquistaram a vaga em Medicina
        </p>
      </div>

      <div className="relative">
        <button onClick={() => navigate('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/80 border border-white/20 text-white hover:bg-pink-500/20">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={() => navigate('next')} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/80 border border-white/20 text-white hover:bg-pink-500/20">
          <ChevronRight className="w-6 h-6" />
        </button>
        <div ref={containerRef} className="flex gap-6 overflow-x-auto scrollbar-hide px-[calc(50%-160px)] py-4" style={{ scrollbarWidth: 'none' }}>
          {approvedStudents.map((student, index) => (
            <ApprovedCard key={student.id} student={student} isActive={index === activeIndex} />
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-8">
        {approvedStudents.map((_, index) => (
          <button key={index} onClick={() => { setIsAutoPlay(false); setActiveIndex(index); }} className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-pink-500' : 'w-2 bg-white/30'}`} />
        ))}
      </div>
    </section>
  );
});

ApprovedCarousel.displayName = 'ApprovedCarousel';
