// ============================================
// 📅 CRONOGRAMA SELECTOR - Seleção de Cronogramas
// Layout estilo módulos com 5 cards
// ============================================

import { motion } from "framer-motion";
import { Calendar, Sparkles, ChevronRight } from "lucide-react";

// Imagens dos cronogramas
import capaFevereiro from "@/assets/cronograma/capa-fevereiro.png";
import capaMarco from "@/assets/cronograma/capa-marco.png";
import capaAbril from "@/assets/cronograma/capa-abril.png";
import capaMaio from "@/assets/cronograma/capa-maio.png";
import capaMonteSeu from "@/assets/cronograma/capa-monte-seu.png";

export type CronogramaType = 'fevereiro' | 'marco' | 'abril' | 'maio' | 'inteligente' | null;

interface CronogramaSelectorProps {
  onSelect: (type: CronogramaType) => void;
}

const cronogramas = [
  {
    id: 'fevereiro' as CronogramaType,
    title: 'CRONOGRAMA EXTENSIVO FEVEREIRO',
    highlight: '39 SEMANAS',
    image: capaFevereiro,
  },
  {
    id: 'marco' as CronogramaType,
    title: 'CRONOGRAMA EXTENSIVO MARÇO',
    highlight: '35 SEMANAS',
    image: capaMarco,
  },
  {
    id: 'abril' as CronogramaType,
    title: 'CRONOGRAMA EXTENSIVO ABRIL',
    highlight: '30 SEMANAS',
    image: capaAbril,
  },
  {
    id: 'maio' as CronogramaType,
    title: 'CRONOGRAMA EXTENSIVO MAIO',
    highlight: '26 SEMANAS',
    image: capaMaio,
  },
  {
    id: 'inteligente' as CronogramaType,
    title: 'CRONOGRAMA INTELIGENTE',
    highlight: 'MONTE O SEU',
    image: capaMonteSeu,
  },
];

export function CronogramaSelector({ onSelect }: CronogramaSelectorProps) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-holo-purple/10 border border-primary/30">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
            Escolha seu Cronograma
          </h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Selecione o cronograma ideal para você com base na sua data de início
        </p>
      </div>

      {/* Cards Grid - 5 cards responsivos, estilo módulos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 max-w-7xl mx-auto">
        {cronogramas.map((cronograma, index) => (
          <motion.button
            key={cronograma.id}
            onClick={() => onSelect(cronograma.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {/* Background Image */}
            <img
              src={cronograma.image}
              alt={cronograma.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

            {/* Holographic Border on Hover */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/60 transition-all duration-300 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              {/* Highlight Badge */}
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/90 text-primary-foreground text-xs md:text-sm font-black rounded-full shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                  {cronograma.highlight}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-white text-sm md:text-base font-bold leading-tight mb-2 drop-shadow-lg line-clamp-2">
                {cronograma.title}
              </h3>

              {/* CTA Arrow */}
              <div className="flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <span>Selecionar</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white/30 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white/30 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default CronogramaSelector;
