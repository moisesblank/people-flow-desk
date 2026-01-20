// ============================================
// PROFESSOR SECTION 2300 - ULTRA COMPACTA E FUTURISTA
// 🚀 P0 FIX: OptimizedImage + Lazy Loading
// Design: 2300 | Performance: 3500
// ============================================

import { motion } from "framer-motion";
import { useState, memo } from "react";
import { 
  Award, 
  Star, 
  Sparkles, 
  GraduationCap,
  Trophy,
  Instagram,
  Youtube,
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Zap
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

// Import professor images - FOTOS REAIS
import professorImage1 from "@/assets/professor-moises-1.jpg";
import professorImage2 from "@/assets/professor-moises-2.jpg";
import professorImageNovo from "@/assets/professor-moises-novo.png";
import logoMoises from "@/assets/logo-moises-medeiros.png";

// Array com metadados para otimização
const professorImages = [
  { src: professorImageNovo, color: "#1a0a0a" },
  { src: professorImage1, color: "#0a1a1a" },
  { src: professorImage2, color: "#1a1a0a" }
];

export const ProfessorSection = () => {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % professorImages.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + professorImages.length) % professorImages.length);

  return (
    <section id="professor" className="relative py-16 md:py-20 overflow-hidden">
      {/* Background minimalista */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.08)_0%,transparent_60%)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header compacto */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-4"
          >
            <Award className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">Seu Mentor</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black">
            <span className="text-white">Prof. </span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Moisés Medeiros
            </span>
          </h2>
        </motion.div>

        {/* Layout compacto em grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          {/* Coluna esquerda - Imagem e Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="relative"
          >
            {/* Glow sutil */}
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-50" />
            
            {/* Container principal */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/80 backdrop-blur-xl">
              {/* Galeria de imagens - aspect ratio reduzido */}
              <div className="aspect-[4/4] relative">
                {professorImages.map((imgData, idx) => (
                  <div 
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-500 ${idx === currentImage ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <OptimizedImage
                      src={imgData.src}
                      alt={`Prof. Moisés Medeiros - Foto ${idx + 1}`}
                      aspectRatio="square"
                      objectFit="cover"
                      objectPosition="top"
                      placeholderColor={imgData.color}
                      priority={idx === 0} // Primeira imagem prioritária
                      className="object-top"
                    />
                  </div>
                ))}
                
                {/* Navigation */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 z-10">
                  <motion.button 
                    onClick={prevImage}
                    className="p-2 rounded-full bg-black/70 border border-white/20 text-white hover:bg-pink-500/60 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                  <motion.button 
                    onClick={nextImage}
                    className="p-2 rounded-full bg-black/70 border border-white/20 text-white hover:bg-pink-500/60 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Dots */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {professorImages.map((imgData, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`h-1.5 rounded-full transition-all ${idx === currentImage ? 'bg-pink-500 w-6' : 'bg-white/40 w-1.5'}`}
                    />
                  ))}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                
                {/* Badge TOP 1 - sem animação */}
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Star className="w-3 h-3" fill="white" />
                  TOP 1 ENEM
                </div>
              </div>

              {/* Card info compacto */}
              <div className="p-4 bg-gradient-to-b from-black to-slate-950">
                <div className="flex items-center gap-3">
                  {/* Logo - sem animação */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                      <img src={logoMoises} alt="Logo" width={36} height={36} className="w-9 h-9 object-contain" loading="lazy" decoding="async" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-black">
                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white truncate">Prof. Moisés Medeiros</h3>
                    <p className="text-gray-400 text-xs">15+ anos de experiência</p>
                    
                    {/* Rating inline */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className="w-3 h-3 text-amber-400" fill="rgba(251,191,36,1)" />
                        ))}
                      </div>
                      <span className="text-amber-400 font-bold text-xs">4.9/5</span>
                    </div>
                  </div>
                </div>
                
                {/* Badges inline - sem animação */}
                <div className="flex gap-2 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[10px] font-bold">
                    <Trophy className="w-2.5 h-2.5" />
                    #1 Brasil
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white text-[10px] font-bold">
                    <GraduationCap className="w-2.5 h-2.5" />
                    10.847+ Aprovados
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Coluna direita - Conteúdo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <p className="text-gray-300 text-base leading-relaxed font-semibold">
              PROFESSOR DE QUÍMICA E MÉDICO
            </p>
            
            <p className="text-gray-300 text-base leading-relaxed">
              Moisés Medeiros é proprietário do maior curso de Química da Paraíba e, por muitos alunos, o melhor do BRASIL. Coleciona inúmeras aprovações COMPROVADAS, dentre elas vários primeiros lugares em federais para medicina.
            </p>

            <p className="text-gray-400 text-sm leading-relaxed">
              Ele é especialista no Enem e vestibulares tradicionais de todo o Brasil. Atualmente seu curso conta com milhares de alunos, compondo a maior comunidade de Química ativa do Brasil. Em 2024 realizou o SESSÃO ENEM o maior aulão de Química do BRASIL.
            </p>

            {/* Stats compactos */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { number: "15+", label: "Anos" },
                { number: "50k+", label: "Seguidores" },
                { number: "1M+", label: "Views" },
                { number: "#1", label: "Brasil" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:border-pink-500/30 transition-colors"
                >
                  <div className="text-xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              <motion.a
                href="https://www.instagram.com/moises.profaprova"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 transition-all text-sm"
                whileHover={{ scale: 1.03 }}
              >
                <Instagram className="w-4 h-4" />
                <span className="font-medium">Instagram</span>
              </motion.a>
              <motion.a
                href="https://www.youtube.com/@moisesmedeiros"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm"
                whileHover={{ scale: 1.03 }}
              >
                <Youtube className="w-4 h-4" />
                <span className="font-medium">YouTube</span>
              </motion.a>
            </div>

            {/* CTA */}
            <motion.a
              href="https://youtu.be/aOzCtPc7byY"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-pink-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-4 h-4" />
              Assistir Aula Grátis
              <Zap className="w-4 h-4" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
