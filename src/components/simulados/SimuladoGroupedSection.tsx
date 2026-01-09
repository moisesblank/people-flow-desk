/**
 * 🎯 SIMULADOS — Componente de Seção Agrupada
 * Constituição SYNAPSE Ω v10.0
 * 
 * Renderiza simulados organizados em grupos colapsáveis
 * com design Year 2300 Cinematic HUD + Netflix Ultra Premium
 */

import { memo, useState, useMemo } from "react";
import { ChevronDown, Beaker, Calendar, Flame as FlameIcon, Atom, Zap, TestTube, BookOpen, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SimuladoListItem } from "@/hooks/simulados/useSimuladosList";

// ============================================
// 🗂️ CONFIGURAÇÃO DOS GRUPOS
// ============================================

export type SimuladoGroupId = 
  | "NIVELAMENTO"
  | "MESES_EXTENSIVO"
  | "MESES_INTENSIVO"
  | "QUIMICA_GERAL"
  | "FISICO_QUIMICA"
  | "QUIMICA_ORGANICA"
  | "OUTROS";

interface GroupConfig {
  id: SimuladoGroupId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  hoverColorClass: string;
  bgClass: string;
  borderClass: string;
  hoverBorderClass: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
  isSubgroup?: boolean;
  parentGroup?: string;
}

const GROUP_CONFIGS: Record<SimuladoGroupId, GroupConfig> = {
  NIVELAMENTO: {
    id: "NIVELAMENTO",
    label: "Teste de Nivelamento",
    icon: Target,
    colorClass: "text-amber-400",
    hoverColorClass: "group-hover:text-amber-300",
    bgClass: "from-amber-500/10 via-yellow-500/5 to-orange-500/10",
    borderClass: "border-amber-500/20",
    hoverBorderClass: "hover:border-amber-500/50",
    glowColor: "rgba(251,191,36,0.3)",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-400",
  },
  MESES_EXTENSIVO: {
    id: "MESES_EXTENSIVO",
    label: "Simulados - Meses Extensivo ENEM",
    icon: Calendar,
    colorClass: "text-blue-400",
    hoverColorClass: "group-hover:text-blue-300",
    bgClass: "from-blue-500/10 via-indigo-500/5 to-cyan-500/10",
    borderClass: "border-blue-500/20",
    hoverBorderClass: "hover:border-blue-500/50",
    glowColor: "rgba(59,130,246,0.3)",
    gradientFrom: "from-blue-500",
    gradientTo: "to-cyan-400",
  },
  MESES_INTENSIVO: {
    id: "MESES_INTENSIVO",
    label: "Simulados - Meses Intensivos ENEM",
    icon: FlameIcon,
    colorClass: "text-orange-400",
    hoverColorClass: "group-hover:text-orange-300",
    bgClass: "from-orange-500/10 via-red-500/5 to-yellow-500/10",
    borderClass: "border-orange-500/20",
    hoverBorderClass: "hover:border-orange-500/50",
    glowColor: "rgba(249,115,22,0.3)",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-400",
  },
  QUIMICA_GERAL: {
    id: "QUIMICA_GERAL",
    label: "Química Geral (Inorgânica)",
    icon: Atom,
    colorClass: "text-emerald-400",
    hoverColorClass: "group-hover:text-emerald-300",
    bgClass: "from-emerald-500/10 via-teal-500/5 to-green-500/10",
    borderClass: "border-emerald-500/20",
    hoverBorderClass: "hover:border-emerald-500/50",
    glowColor: "rgba(16,185,129,0.25)",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-400",
    isSubgroup: true,
    parentGroup: "POR_ASSUNTO",
  },
  FISICO_QUIMICA: {
    id: "FISICO_QUIMICA",
    label: "Físico-Química",
    icon: Zap,
    colorClass: "text-cyan-400",
    hoverColorClass: "group-hover:text-cyan-300",
    bgClass: "from-cyan-500/10 via-blue-500/5 to-teal-500/10",
    borderClass: "border-cyan-500/20",
    hoverBorderClass: "hover:border-cyan-500/50",
    glowColor: "rgba(6,182,212,0.25)",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-blue-400",
    isSubgroup: true,
    parentGroup: "POR_ASSUNTO",
  },
  QUIMICA_ORGANICA: {
    id: "QUIMICA_ORGANICA",
    label: "Química Orgânica",
    icon: TestTube,
    colorClass: "text-purple-400",
    hoverColorClass: "group-hover:text-purple-300",
    bgClass: "from-purple-500/10 via-violet-500/5 to-pink-500/10",
    borderClass: "border-purple-500/20",
    hoverBorderClass: "hover:border-purple-500/50",
    glowColor: "rgba(168,85,247,0.25)",
    gradientFrom: "from-purple-500",
    gradientTo: "to-pink-400",
    isSubgroup: true,
    parentGroup: "POR_ASSUNTO",
  },
  OUTROS: {
    id: "OUTROS",
    label: "Outros Simulados",
    icon: BookOpen,
    colorClass: "text-slate-400",
    hoverColorClass: "group-hover:text-slate-300",
    bgClass: "from-slate-500/10 via-gray-500/5 to-zinc-500/10",
    borderClass: "border-slate-500/20",
    hoverBorderClass: "hover:border-slate-500/50",
    glowColor: "rgba(148,163,184,0.2)",
    gradientFrom: "from-slate-500",
    gradientTo: "to-gray-400",
  },
};

// ============================================
// 🔍 MAPEAMENTO DE SLUGS → GRUPOS
// Slugs reais do banco de dados (Auditoria 2026-01-09)
// ============================================

const SLUG_MAPPINGS: Record<SimuladoGroupId, string[]> = {
  NIVELAMENTO: [
    "teste-nivelamento-eac0156d",
  ],
  MESES_EXTENSIVO: [
    "marco-9b0aaa2c",
    "abril-4ae68da1",
    "maio-2ac43141",
    "junho-4c030952",
    "julho-8ffd0a7f",
    "agosto-a7a9c7d3",
    "setembro-de0b17b0",
    "outubro-08cb043e",
    "novembro-3e35f55e",
  ],
  MESES_INTENSIVO: [
    "mes-1-intensivo-187c9db6",
    "mes-2-intensivo-d8309b62",
    "mes-3-intensivo-78dccc3d",
    "mes-4-intensivo-0ef7e9b2",
    "mes-5-intensivo-800b31ce",
  ],
  QUIMICA_GERAL: [
    "introducao-a-inorganica-5b022a6a",
    "atomistica-3140a0aa",
    "tabela-periodica-80f88af8",
    "ligacoes-quimicas-bf415041",
    "nox-9313f9f6",
    "funcoes-inorganicas-8562aa6a",
    "balanceamento-26ef98ba",
    "reacoes-inorganicas-b7706728",
    "estequiometria-d52f0ad2",
    "gases-1cbb048b",
    "calculos-quimicos-2d163db4",
  ],
  FISICO_QUIMICA: [
    "solucoes-2289be7e",
    "termoquimica-4ec6f98a",
    "cinetica-quimica-637cbc46",
    "equilibrio-quimico-1e544890",
    "equilibrio-ionico-fb06313c",
    "solucao-tampao-c1fc11e2",
    "eletroquimica-2cb900ce",
    "hidrolise-a0106467",
    "kps-produto-de-solubilidade-77f2dc94",
    "radioatividade-d5ddbf83",
    "propriedades-coligativas-bb664bab",
  ],
  QUIMICA_ORGANICA: [
    "introducao-a-organica-a5d25c5b",
    "funcoes-organicas-50294a19",
    "isomeria-plana-fac8b087",
    "isomeria-espacial-9662a67f",
    "propriedades-coligativas-44a9803f",
    "reacoes-organicas-ba8153a6",
    "polimeros-9ec5b7ff",
  ],
  OUTROS: [],
};

// ============================================
// 🧮 FUNÇÃO DE CLASSIFICAÇÃO
// ============================================

export function classifySimuladosByGroup(simulados: SimuladoListItem[]): Record<SimuladoGroupId, SimuladoListItem[]> {
  const groups: Record<SimuladoGroupId, SimuladoListItem[]> = {
    NIVELAMENTO: [],
    MESES_EXTENSIVO: [],
    MESES_INTENSIVO: [],
    QUIMICA_GERAL: [],
    FISICO_QUIMICA: [],
    QUIMICA_ORGANICA: [],
    OUTROS: [],
  };

  const assignedIds = new Set<string>();

  // Iterar sobre cada grupo e mapear simulados
  for (const [groupId, slugPatterns] of Object.entries(SLUG_MAPPINGS) as [SimuladoGroupId, string[]][]) {
    if (groupId === "OUTROS") continue;

    for (const simulado of simulados) {
      if (assignedIds.has(simulado.id)) continue;
      if (!simulado.slug) continue;

      // Verificar se o slug corresponde ao padrão
      const matches = slugPatterns.some(pattern => {
        // Match exato ou prefixo
        return simulado.slug === pattern || simulado.slug?.startsWith(pattern);
      });

      if (matches) {
        groups[groupId].push(simulado);
        assignedIds.add(simulado.id);
      }
    }
  }

  // Colocar simulados não classificados em "OUTROS"
  for (const simulado of simulados) {
    if (!assignedIds.has(simulado.id)) {
      groups.OUTROS.push(simulado);
    }
  }

  return groups;
}

// ============================================
// 🎨 COMPONENTE DE GRUPO COLAPSÁVEL - NETFLIX ULTRA PREMIUM
// ============================================

interface SimuladoGroupSectionProps {
  groupId: SimuladoGroupId;
  simulados: SimuladoListItem[];
  renderCard: (simulado: SimuladoListItem, index: number) => React.ReactNode;
  shouldAnimate?: boolean;
  defaultOpen?: boolean;
}

function SimuladoGroupSectionInner({
  groupId,
  simulados,
  renderCard,
  shouldAnimate = true,
  defaultOpen = false,
}: SimuladoGroupSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);
  const config = GROUP_CONFIGS[groupId];
  
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState && !hasOpened) {
      setHasOpened(true);
    }
  };

  if (simulados.length === 0) return null;

  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "group/section rounded-2xl overflow-hidden transition-all duration-500 ease-out",
        "bg-gradient-to-br", config.bgClass,
        "border-2 backdrop-blur-sm",
        config.borderClass,
        config.hoverBorderClass,
        isOpen && "shadow-[0_0_40px_var(--glow-color)]",
        !isOpen && "hover:shadow-[0_0_25px_var(--glow-color)]",
        shouldAnimate && "animate-fade-in"
      )}
      style={{ "--glow-color": config.glowColor } as React.CSSProperties}
    >
      {/* 🔲 Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)] z-0" />
      
      {/* Header Clicável - Netflix Premium */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative w-full flex items-center justify-between p-4 md:p-5",
          "transition-all duration-300 z-10"
        )}
      >
        {/* Left Content */}
        <div className="flex items-center gap-4">
          {/* Icon Container - Holographic */}
          <div className={cn(
            "relative p-3 rounded-xl transition-all duration-500",
            "bg-gradient-to-br", config.bgClass,
            "border", config.borderClass,
            "group-hover/section:scale-110"
          )}>
            {/* Icon Glow Pulse */}
            <div 
              className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover/section:opacity-100 transition-opacity duration-500",
                "animate-pulse"
              )}
              style={{ 
                background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)` 
              }}
            />
            <Icon className={cn(
              "w-5 h-5 md:w-6 md:h-6 relative z-10 transition-all duration-300",
              config.colorClass,
              config.hoverColorClass
            )} />
          </div>
          
          {/* Text Content */}
          <div className="text-left">
            <h3 className={cn(
              "font-bold text-base md:text-lg lg:text-xl transition-all duration-300",
              "bg-clip-text text-transparent",
              "bg-gradient-to-r from-white via-white to-white/80",
              "group-hover/section:from-white group-hover/section:via-white/90",
              config.colorClass.replace("text-", "group-hover/section:to-")
            )}>
              {config.label}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground/70 group-hover/section:text-muted-foreground transition-colors">
              {simulados.length} simulado{simulados.length > 1 ? "s" : ""} disponíve{simulados.length > 1 ? "is" : "l"}
            </p>
          </div>
        </div>

        {/* Right Content - Badge + Chevron */}
        <div className="flex items-center gap-3">
          {/* Count Badge - Holographic */}
          <div className={cn(
            "hidden sm:flex items-center justify-center min-w-[2.5rem] h-8 px-3 rounded-full",
            "bg-gradient-to-r", config.gradientFrom, config.gradientTo,
            "text-white font-bold text-sm",
            "shadow-lg transition-all duration-300",
            "group-hover/section:scale-110 group-hover/section:shadow-xl"
          )}
          style={{ 
            boxShadow: `0 4px 15px ${config.glowColor}` 
          }}
          >
            {simulados.length}
          </div>
          
          {/* Chevron - Animated */}
          <div className={cn(
            "p-2 rounded-xl transition-all duration-500",
            "bg-white/5 border border-white/10",
            "group-hover/section:bg-white/10 group-hover/section:border-white/20",
            isOpen && "rotate-180 bg-white/10"
          )}>
            <ChevronDown className={cn(
              "w-5 h-5 transition-colors duration-300",
              config.colorClass,
              "group-hover/section:text-white"
            )} />
          </div>
        </div>
        
        {/* ✨ Hover Gradient Line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500",
          "bg-gradient-to-r", config.gradientFrom, "via-white/50", config.gradientTo,
          "opacity-0 group-hover/section:opacity-100",
          "transform scale-x-0 group-hover/section:scale-x-100"
        )} />
      </button>

      {/* Conteúdo - LAZY RENDERING */}
      {hasOpened && (
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="p-4 md:p-5 pt-0">
            {/* Separator Line */}
            <div className={cn(
              "h-px mb-5 transition-all duration-300",
              "bg-gradient-to-r from-transparent", 
              config.gradientFrom.replace("from-", "via-") + "/30",
              "to-transparent"
            )} />
            <div className="grid gap-4 md:gap-5 grid-cols-1 lg:grid-cols-2">
              {simulados.map((simulado, index) => renderCard(simulado, index))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export memoized version
export const SimuladoGroupSection = memo(SimuladoGroupSectionInner);

// ============================================
// 🧪 COMPONENTE GRUPO PAI "POR ASSUNTO" - NETFLIX ULTRA PREMIUM
// ============================================

interface SimuladosBySubjectSectionProps {
  groups: Record<SimuladoGroupId, SimuladoListItem[]>;
  renderCard: (simulado: SimuladoListItem, index: number) => React.ReactNode;
  shouldAnimate?: boolean;
}

export const SimuladosBySubjectSection = memo(function SimuladosBySubjectSection({
  groups,
  renderCard,
  shouldAnimate = true,
}: SimuladosBySubjectSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState && !hasOpened) {
      setHasOpened(true);
    }
  };

  const totalCount = useMemo(() => {
    return (groups.QUIMICA_GERAL?.length || 0) + 
           (groups.FISICO_QUIMICA?.length || 0) + 
           (groups.QUIMICA_ORGANICA?.length || 0);
  }, [groups]);

  if (totalCount === 0) return null;

  return (
    <div 
      className={cn(
        "group/parent rounded-2xl overflow-hidden transition-all duration-500 ease-out",
        "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10",
        "border-2 border-violet-500/20 hover:border-violet-500/50 backdrop-blur-sm",
        isOpen && "shadow-[0_0_50px_rgba(139,92,246,0.25)]",
        !isOpen && "hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]",
        shouldAnimate && "animate-fade-in"
      )}
    >
      {/* 🔲 Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)] z-0" />
      
      {/* Header Principal */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative w-full flex items-center justify-between p-5 md:p-6",
          "transition-all duration-300 z-10"
        )}
      >
        {/* Left Content */}
        <div className="flex items-center gap-4">
          {/* Icon Container - Holographic Premium */}
          <div className={cn(
            "relative p-3.5 rounded-xl transition-all duration-500",
            "bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
            "border border-violet-500/30",
            "group-hover/parent:scale-110"
          )}>
            {/* Icon Glow Pulse */}
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-0 group-hover/parent:opacity-100 transition-opacity duration-500",
              "animate-pulse bg-[radial-gradient(circle,rgba(139,92,246,0.4)_0%,transparent_70%)]"
            )} />
            <Beaker className="w-6 h-6 md:w-7 md:h-7 text-violet-400 group-hover/parent:text-violet-300 relative z-10 transition-all duration-300" />
          </div>
          
          {/* Text Content */}
          <div className="text-left">
            <h2 className={cn(
              "font-black text-lg md:text-xl lg:text-2xl transition-all duration-300",
              "bg-clip-text text-transparent",
              "bg-gradient-to-r from-violet-400 via-purple-300 to-fuchsia-400",
              "group-hover/parent:from-violet-300 group-hover/parent:via-white group-hover/parent:to-fuchsia-300"
            )}>
              Simulados por Assunto
            </h2>
            <p className="text-sm text-muted-foreground/70 group-hover/parent:text-muted-foreground transition-colors">
              Pratique por área específica da Química
            </p>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex items-center gap-3">
          {/* Count Badge - Premium Holographic */}
          <div className={cn(
            "hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full",
            "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500",
            "text-white font-bold text-sm",
            "shadow-lg transition-all duration-300",
            "group-hover/parent:scale-110 group-hover/parent:shadow-xl"
          )}
          style={{ 
            boxShadow: "0 4px 20px rgba(139,92,246,0.4)" 
          }}
          >
            <span>{totalCount}</span>
            <span className="font-normal opacity-90">simulados</span>
          </div>
          
          {/* Chevron */}
          <div className={cn(
            "p-2.5 rounded-xl transition-all duration-500",
            "bg-violet-500/10 border border-violet-500/20",
            "group-hover/parent:bg-violet-500/20 group-hover/parent:border-violet-500/40",
            isOpen && "rotate-180 bg-violet-500/20"
          )}>
            <ChevronDown className="w-5 h-5 text-violet-400 group-hover/parent:text-white transition-colors duration-300" />
          </div>
        </div>
        
        {/* ✨ Hover Gradient Line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500",
          "bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-500",
          "opacity-0 group-hover/parent:opacity-100",
          "transform scale-x-0 group-hover/parent:scale-x-100"
        )} />
      </button>

      {/* Subgrupos - LAZY RENDERING */}
      {hasOpened && (
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isOpen ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="p-4 md:p-5 pt-0 space-y-4">
            {/* Separator Line */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            
            {/* Química Geral */}
            {groups.QUIMICA_GERAL?.length > 0 && (
              <SimuladoGroupSection
                groupId="QUIMICA_GERAL"
                simulados={groups.QUIMICA_GERAL}
                renderCard={renderCard}
                shouldAnimate={shouldAnimate}
                defaultOpen={false}
              />
            )}

            {/* Físico-Química */}
            {groups.FISICO_QUIMICA?.length > 0 && (
              <SimuladoGroupSection
                groupId="FISICO_QUIMICA"
                simulados={groups.FISICO_QUIMICA}
                renderCard={renderCard}
                shouldAnimate={shouldAnimate}
                defaultOpen={false}
              />
            )}

            {/* Química Orgânica */}
            {groups.QUIMICA_ORGANICA?.length > 0 && (
              <SimuladoGroupSection
                groupId="QUIMICA_ORGANICA"
                simulados={groups.QUIMICA_ORGANICA}
                renderCard={renderCard}
                shouldAnimate={shouldAnimate}
                defaultOpen={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export { GROUP_CONFIGS };
