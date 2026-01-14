// ============================================
// 📅 CRONOGRAMA SELECTOR - Seleção de Cronogramas
// Layout estilo módulos com 5 cards
// CSS-only animations (Year 2300 standard)
// ============================================

import { Calendar, Sparkles, ChevronRight, Lightbulb, CheckCircle2, ArrowDown } from "lucide-react";
import { DateLock } from "@/components/ui/chronolock";

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
      <div className="mb-6 text-center">
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

      {/* 🎯 ORIENTAÇÕES INICIAIS — Passos Leigos */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-holo-cyan/5 p-5 md:p-6 overflow-hidden">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-primary/40 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-holo-cyan/40 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-holo-purple/40 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-primary/40 rounded-br-2xl" />
          
          {/* Header da seção de orientações */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
              <Lightbulb className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Como funciona?</h2>
              <p className="text-xs text-muted-foreground">Passos simples para começar</p>
            </div>
          </div>
          
          {/* Grid de passos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Passo 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/30">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Escolha seu Card</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Clique no cronograma de acordo com sua data de início dos estudos
                </p>
              </div>
            </div>
            
            {/* Passo 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Assista as Aulas</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Siga o plano semanal com vídeo-aulas e materiais organizados
                </p>
              </div>
            </div>
            
            {/* Passo 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-500/30">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Pratique</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Faça simulados e questões para fixar o conteúdo
                </p>
              </div>
            </div>
          </div>
          
          {/* Dica extra */}
          <div className="mt-4 flex items-center gap-2 text-xs text-primary/80">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-muted-foreground">
              <strong className="text-emerald-400">Dica:</strong> O cronograma de <strong className="text-primary">Fevereiro</strong> já está liberado e pronto para você começar!
            </span>
          </div>
        </div>
        
        {/* Seta indicando os cards */}
        <div className="flex justify-center mt-4">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">Selecione abaixo</span>
            <ArrowDown className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Cards Grid - 5 cards responsivos, estilo módulos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 max-w-7xl mx-auto">
        {cronogramas.map((cronograma, index) => {
          // Fevereiro (primeiro card) é liberado, os demais são bloqueados até 31/01
          const isLocked = cronograma.id !== 'fevereiro';
          
          const cardContent = (
            <button
              key={cronograma.id}
              onClick={() => !isLocked && onSelect(cronograma.id)}
              style={{ animationDelay: `${index * 100}ms` }}
              className={`group relative aspect-[3/4] rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50 animate-fade-in transform-gpu transition-transform duration-300 ${
                isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
              }`}
            >
              {/* Background Image */}
              <img
                src={cronograma.image}
                alt={cronograma.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay Gradient - Apenas se NÃO estiver bloqueado (DateLock já tem overlay) */}
              {!isLocked && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
              )}

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
                {!isLocked && (
                  <div className="flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Selecionar</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Corner Accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white/30 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white/30 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          );

          // Se bloqueado, envolve com DateLock
          if (isLocked) {
            return (
              <DateLock key={cronograma.id} releaseDate="31/01">
                {cardContent}
              </DateLock>
            );
          }

          return cardContent;
        })}
      </div>
    </div>
  );
}

export default CronogramaSelector;
