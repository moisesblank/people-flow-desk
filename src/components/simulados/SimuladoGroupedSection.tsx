/**
 * 🎯 SIMULADOS — Componente de Seção Agrupada
 * Constituição SYNAPSE Ω v10.0
 * 
 * ⚡ PERFORMANCE-OPTIMIZED: Zero animações JS, CSS-only transitions
 * 🎨 Design Year 2300 Cinematic HUD + Netflix Ultra Premium
 */

import { memo, useState, useMemo, useCallback } from "react";
import { ChevronDown, Beaker, Calendar, Flame as FlameIcon, Atom, Zap, TestTube, BookOpen, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimuladoListItem } from "@/hooks/simulados/useSimuladosList";

// ============================================
// 🗂️ CONFIGURAÇÃO DOS GRUPOS - OTIMIZADO
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
  // Cores inline para evitar lookup
  iconColor: string;
  bgGradient: string;
  borderColor: string;
  hoverBorder: string;
  glowColor: string;
  badgeBg: string;
}

// Configuração estática - sem re-criação
const GROUP_CONFIGS: Record<SimuladoGroupId, GroupConfig> = {
  NIVELAMENTO: {
    id: "NIVELAMENTO",
    label: "Teste de Nivelamento",
    icon: Target,
    iconColor: "text-amber-400",
    bgGradient: "from-amber-500/8 via-yellow-500/4 to-orange-500/8",
    borderColor: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    glowColor: "hover:shadow-[0_0_25px_rgba(251,191,36,0.15)]",
    badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-400",
  },
  MESES_EXTENSIVO: {
    id: "MESES_EXTENSIVO",
    label: "Simulados - Meses Extensivo ENEM",
    icon: Calendar,
    iconColor: "text-blue-400",
    bgGradient: "from-blue-500/8 via-indigo-500/4 to-cyan-500/8",
    borderColor: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/40",
    glowColor: "hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]",
    badgeBg: "bg-gradient-to-r from-blue-500 to-cyan-400",
  },
  MESES_INTENSIVO: {
    id: "MESES_INTENSIVO",
    label: "Simulados - Meses Intensivos ENEM",
    icon: FlameIcon,
    iconColor: "text-orange-400",
    bgGradient: "from-orange-500/8 via-red-500/4 to-yellow-500/8",
    borderColor: "border-orange-500/20",
    hoverBorder: "hover:border-orange-500/40",
    glowColor: "hover:shadow-[0_0_25px_rgba(249,115,22,0.15)]",
    badgeBg: "bg-gradient-to-r from-orange-500 to-red-400",
  },
  QUIMICA_GERAL: {
    id: "QUIMICA_GERAL",
    label: "Química Geral (Inorgânica)",
    icon: Atom,
    iconColor: "text-emerald-400",
    bgGradient: "from-emerald-500/8 via-teal-500/4 to-green-500/8",
    borderColor: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    glowColor: "hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]",
    badgeBg: "bg-gradient-to-r from-emerald-500 to-teal-400",
  },
  FISICO_QUIMICA: {
    id: "FISICO_QUIMICA",
    label: "Físico-Química",
    icon: Zap,
    iconColor: "text-cyan-400",
    bgGradient: "from-cyan-500/8 via-blue-500/4 to-teal-500/8",
    borderColor: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/40",
    glowColor: "hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]",
    badgeBg: "bg-gradient-to-r from-cyan-500 to-blue-400",
  },
  QUIMICA_ORGANICA: {
    id: "QUIMICA_ORGANICA",
    label: "Química Orgânica",
    icon: TestTube,
    iconColor: "text-purple-400",
    bgGradient: "from-purple-500/8 via-violet-500/4 to-pink-500/8",
    borderColor: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/40",
    glowColor: "hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]",
    badgeBg: "bg-gradient-to-r from-purple-500 to-pink-400",
  },
  OUTROS: {
    id: "OUTROS",
    label: "Outros Simulados",
    icon: BookOpen,
    iconColor: "text-slate-400",
    bgGradient: "from-slate-500/8 via-gray-500/4 to-zinc-500/8",
    borderColor: "border-slate-500/20",
    hoverBorder: "hover:border-slate-500/40",
    glowColor: "",
    badgeBg: "bg-gradient-to-r from-slate-500 to-gray-400",
  },
};

// ============================================
// 🔍 MAPEAMENTO DE SLUGS → GRUPOS (ESTÁTICO)
// ============================================

const SLUG_MAPPINGS: Record<SimuladoGroupId, string[]> = {
  NIVELAMENTO: ["teste-nivelamento-eac0156d"],
  MESES_EXTENSIVO: [
    "marco-9b0aaa2c", "abril-4ae68da1", "maio-2ac43141", "junho-4c030952",
    "julho-8ffd0a7f", "agosto-a7a9c7d3", "setembro-de0b17b0", "outubro-08cb043e", "novembro-3e35f55e",
  ],
  MESES_INTENSIVO: [
    "mes-1-intensivo-187c9db6", "mes-2-intensivo-d8309b62", "mes-3-intensivo-78dccc3d",
    "mes-4-intensivo-0ef7e9b2", "mes-5-intensivo-800b31ce",
  ],
  QUIMICA_GERAL: [
    "introducao-a-inorganica-5b022a6a", "atomistica-3140a0aa", "tabela-periodica-80f88af8",
    "ligacoes-quimicas-bf415041", "nox-9313f9f6", "funcoes-inorganicas-8562aa6a",
    "balanceamento-26ef98ba", "reacoes-inorganicas-b7706728", "estequiometria-d52f0ad2",
    "gases-1cbb048b", "calculos-quimicos-2d163db4",
  ],
  FISICO_QUIMICA: [
    "solucoes-2289be7e", "termoquimica-4ec6f98a", "cinetica-quimica-637cbc46",
    "equilibrio-quimico-1e544890", "equilibrio-ionico-fb06313c", "solucao-tampao-c1fc11e2",
    "eletroquimica-2cb900ce", "hidrolise-a0106467", "kps-produto-de-solubilidade-77f2dc94",
    "radioatividade-d5ddbf83", "propriedades-coligativas-bb664bab",
  ],
  QUIMICA_ORGANICA: [
    "introducao-a-organica-a5d25c5b", "funcoes-organicas-50294a19", "isomeria-plana-fac8b087",
    "isomeria-espacial-9662a67f", "propriedades-coligativas-44a9803f", "reacoes-organicas-ba8153a6",
    "polimeros-9ec5b7ff",
  ],
  OUTROS: [],
};

// ============================================
// 🧮 FUNÇÃO DE CLASSIFICAÇÃO - OTIMIZADA
// ============================================

export function classifySimuladosByGroup(simulados: SimuladoListItem[]): Record<SimuladoGroupId, SimuladoListItem[]> {
  const groups: Record<SimuladoGroupId, SimuladoListItem[]> = {
    NIVELAMENTO: [], MESES_EXTENSIVO: [], MESES_INTENSIVO: [],
    QUIMICA_GERAL: [], FISICO_QUIMICA: [], QUIMICA_ORGANICA: [], OUTROS: [],
  };

  const assignedIds = new Set<string>();

  for (const [groupId, slugPatterns] of Object.entries(SLUG_MAPPINGS) as [SimuladoGroupId, string[]][]) {
    if (groupId === "OUTROS") continue;

    for (const simulado of simulados) {
      if (assignedIds.has(simulado.id) || !simulado.slug) continue;

      const matches = slugPatterns.some(pattern => 
        simulado.slug === pattern || simulado.slug?.startsWith(pattern)
      );

      if (matches) {
        groups[groupId].push(simulado);
        assignedIds.add(simulado.id);
      }
    }
  }

  for (const simulado of simulados) {
    if (!assignedIds.has(simulado.id)) {
      groups.OUTROS.push(simulado);
    }
  }

  return groups;
}

// ============================================
// 🎨 COMPONENTE DE GRUPO - PERFORMANCE MÁXIMA
// CSS-only transitions, zero JS animations
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
  defaultOpen = false,
}: SimuladoGroupSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);
  const config = GROUP_CONFIGS[groupId];
  
  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (newState && !hasOpened) setHasOpened(true);
      return newState;
    });
  }, [hasOpened]);

  if (simulados.length === 0) return null;

  const Icon = config.icon;

  return (
    <div className={cn(
      "group/section relative rounded-2xl overflow-hidden",
      "bg-gradient-to-br from-black/60 via-card/90 to-black/50",
      "border-2", config.borderColor, config.hoverBorder,
      "transition-[border-color,box-shadow] duration-300",
      isOpen && "shadow-[0_0_40px_rgba(255,255,255,0.08)]",
      config.glowColor
    )}>
      {/* 🌌 Background layers for depth */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary gradient overlay */}
        <div className={cn(
          "absolute inset-0 opacity-50",
          "bg-gradient-to-br", config.bgGradient
        )} />
        {/* Radial spotlight effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        {/* Bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
      
      {/* 🔲 Scanline texture - very subtle */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
      
      {/* ✨ Corner accents */}
      <div className={cn(
        "absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-40 group-hover/section:opacity-70 transition-opacity",
        "border-l-2 border-t-2 rounded-tl-2xl",
        config.borderColor.replace("border-", "border-l-").replace("/20", "/50"),
        config.borderColor.replace("border-", "border-t-").replace("/20", "/50")
      )} />
      <div className={cn(
        "absolute bottom-0 right-0 w-8 h-8 pointer-events-none opacity-40 group-hover/section:opacity-70 transition-opacity",
        "border-r-2 border-b-2 rounded-br-2xl",
        config.borderColor.replace("border-", "border-r-").replace("/20", "/50"),
        config.borderColor.replace("border-", "border-b-").replace("/20", "/50")
      )} />
      
      {/* Header */}
      <button
        onClick={handleToggle}
        className="relative w-full flex items-center justify-between p-4 md:p-5 transition-colors duration-200 hover:bg-white/[0.04] z-10"
      >
        {/* Left */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Icon with glowing container */}
          <div className={cn(
            "relative p-2.5 md:p-3 rounded-xl transition-all duration-300",
            "bg-gradient-to-br from-white/[0.1] via-white/[0.05] to-transparent",
            "border", config.borderColor,
            "group-hover/section:scale-110",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          )}>
            {/* Icon glow pulse */}
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-70",
              "bg-gradient-to-br", config.bgGradient
            )} />
            {/* Outer glow on hover */}
            <div className={cn(
              "absolute -inset-1 rounded-xl opacity-0 group-hover/section:opacity-100 transition-opacity duration-500 blur-md",
              "bg-gradient-to-br", config.bgGradient
            )} />
            <Icon className={cn("w-5 h-5 md:w-6 md:h-6 relative z-10 drop-shadow-lg", config.iconColor)} />
          </div>
          
          {/* Text */}
          <div className="text-left">
            <h3 className={cn(
              "font-bold text-base md:text-lg transition-all duration-200",
              "text-foreground group-hover/section:text-white",
              "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
            )}>
              {config.label}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground/60 group-hover/section:text-muted-foreground/80 transition-colors">
              {simulados.length} simulado{simulados.length > 1 ? "s" : ""} disponíve{simulados.length > 1 ? "is" : "l"}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Badge Count - Premium holographic */}
          <div className={cn(
            "hidden sm:flex items-center justify-center min-w-[2.5rem] h-9 px-3.5 rounded-full",
            config.badgeBg,
            "text-white font-bold text-sm",
            "shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
            "transition-all duration-300 group-hover/section:scale-110 group-hover/section:shadow-[0_6px_25px_rgba(0,0,0,0.5)]"
          )}>
            {simulados.length}
          </div>
          
          {/* Chevron - Elegant glass container */}
          <div className={cn(
            "p-2 md:p-2.5 rounded-xl transition-all duration-300",
            "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
            "border border-white/[0.1]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
            "group-hover/section:from-white/[0.12] group-hover/section:to-white/[0.04]",
            isOpen && "rotate-180 from-white/[0.12] to-white/[0.04]"
          )}>
            <ChevronDown className={cn("w-4 h-4 md:w-5 md:h-5 drop-shadow", config.iconColor)} />
          </div>
        </div>
        
        {/* Bottom accent line - animated gradient */}
        <div className={cn(
          "absolute bottom-0 left-4 right-4 h-[2px] rounded-full",
          "bg-gradient-to-r from-transparent", 
          config.badgeBg.replace("bg-gradient-to-r", "via-").replace("from-", "").split(" ")[0] + "/60",
          "to-transparent",
          "opacity-0 group-hover/section:opacity-100 transition-opacity duration-300",
          "shadow-[0_0_10px_rgba(255,255,255,0.2)]"
        )} />
      </button>

      {/* Content - Lazy + CSS collapse */}
      {hasOpened && (
        <div className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden">
            <div className="relative p-4 md:p-5 pt-0 z-10">
              {/* Separator with elegant gradient */}
              <div className={cn(
                "h-px mb-5 bg-gradient-to-r from-transparent to-transparent",
                config.badgeBg.replace("bg-gradient-to-r", "via-").replace("from-", "").split(" ")[0] + "/30"
              )} />
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {simulados.map((simulado, index) => renderCard(simulado, index))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const SimuladoGroupSection = memo(SimuladoGroupSectionInner);

// ============================================
// 🧪 GRUPO PAI "POR ASSUNTO" - PERFORMANCE MÁXIMA
// ============================================

interface SimuladosBySubjectSectionProps {
  groups: Record<SimuladoGroupId, SimuladoListItem[]>;
  renderCard: (simulado: SimuladoListItem, index: number) => React.ReactNode;
  shouldAnimate?: boolean;
}

export const SimuladosBySubjectSection = memo(function SimuladosBySubjectSection({
  groups,
  renderCard,
}: SimuladosBySubjectSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  
  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (newState && !hasOpened) setHasOpened(true);
      return newState;
    });
  }, [hasOpened]);

  const totalCount = useMemo(() => 
    (groups.QUIMICA_GERAL?.length || 0) + 
    (groups.FISICO_QUIMICA?.length || 0) + 
    (groups.QUIMICA_ORGANICA?.length || 0),
  [groups]);

  if (totalCount === 0) return null;

  return (
    <div className={cn(
      "group/parent relative rounded-2xl overflow-hidden",
      "bg-gradient-to-br from-black/60 via-card/90 to-black/50",
      "border-2 border-violet-500/25 hover:border-violet-500/50",
      "transition-[border-color,box-shadow] duration-300",
      isOpen && "shadow-[0_0_50px_rgba(139,92,246,0.15)]",
      "hover:shadow-[0_0_35px_rgba(139,92,246,0.12)]"
    )}>
      {/* 🌌 Background layers for depth */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-violet-500/12 via-purple-500/8 to-fuchsia-500/12" />
        {/* Radial spotlight effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.1)_0%,transparent_50%)]" />
        {/* Bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
      
      {/* 🔲 Scanline texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
      
      {/* ✨ Corner accents - Purple theme */}
      <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none opacity-50 group-hover/parent:opacity-80 transition-opacity border-l-2 border-t-2 border-violet-500/60 rounded-tl-2xl" />
      <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none opacity-50 group-hover/parent:opacity-80 transition-opacity border-r-2 border-b-2 border-fuchsia-500/60 rounded-br-2xl" />
      
      {/* Header */}
      <button
        onClick={handleToggle}
        className="relative w-full flex items-center justify-between p-5 md:p-6 transition-colors duration-200 hover:bg-white/[0.04] z-10"
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "relative p-3 md:p-4 rounded-xl transition-all duration-300",
            "bg-gradient-to-br from-white/[0.1] via-white/[0.05] to-transparent",
            "border border-violet-500/30",
            "group-hover/parent:scale-110",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          )}>
            {/* Icon glow */}
            <div className="absolute inset-0 rounded-xl opacity-70 bg-gradient-to-br from-violet-500/25 via-purple-500/20 to-fuchsia-500/25" />
            {/* Outer glow on hover */}
            <div className="absolute -inset-1 rounded-xl opacity-0 group-hover/parent:opacity-100 transition-opacity duration-500 blur-md bg-gradient-to-br from-violet-500/40 via-purple-500/30 to-fuchsia-500/40" />
            <Beaker className="w-6 h-6 md:w-7 md:h-7 text-violet-400 relative z-10 drop-shadow-lg" />
          </div>
          
          <div className="text-left">
            <h2 className={cn(
              "font-black text-lg md:text-xl lg:text-2xl transition-all duration-200",
              "text-violet-400 group-hover/parent:text-violet-300",
              "drop-shadow-[0_2px_4px_rgba(139,92,246,0.3)]"
            )}>
              Simulados por Assunto
            </h2>
            <p className="text-sm text-muted-foreground/60 group-hover/parent:text-muted-foreground/80 transition-colors">
              Pratique por área específica da Química
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "hidden sm:flex items-center gap-1.5 px-5 py-2.5 rounded-full",
            "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500",
            "text-white font-bold text-sm",
            "shadow-[0_4px_25px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
            "transition-all duration-300 group-hover/parent:scale-110 group-hover/parent:shadow-[0_6px_30px_rgba(139,92,246,0.5)]"
          )}>
            <span>{totalCount}</span>
            <span className="font-normal opacity-80">simulados</span>
          </div>
          
          <div className={cn(
            "p-2.5 md:p-3 rounded-xl transition-all duration-300",
            "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
            "border border-violet-500/25",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
            "group-hover/parent:from-white/[0.12] group-hover/parent:to-white/[0.04]",
            isOpen && "rotate-180 from-white/[0.12] to-white/[0.04]"
          )}>
            <ChevronDown className="w-5 h-5 text-violet-400 drop-shadow" />
          </div>
        </div>
        
        {/* Bottom accent line - animated gradient */}
        <div className={cn(
          "absolute bottom-0 left-5 right-5 h-[2px] rounded-full",
          "bg-gradient-to-r from-transparent via-violet-400/50 to-transparent",
          "opacity-0 group-hover/parent:opacity-100 transition-opacity duration-300",
          "shadow-[0_0_15px_rgba(139,92,246,0.4)]"
        )} />
      </button>

      {/* Subgroups - Lazy */}
      {hasOpened && (
        <div className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden">
            <div className="p-4 md:p-5 pt-0 space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
              
              {groups.QUIMICA_GERAL?.length > 0 && (
                <SimuladoGroupSection
                  groupId="QUIMICA_GERAL"
                  simulados={groups.QUIMICA_GERAL}
                  renderCard={renderCard}
                  defaultOpen={false}
                />
              )}

              {groups.FISICO_QUIMICA?.length > 0 && (
                <SimuladoGroupSection
                  groupId="FISICO_QUIMICA"
                  simulados={groups.FISICO_QUIMICA}
                  renderCard={renderCard}
                  defaultOpen={false}
                />
              )}

              {groups.QUIMICA_ORGANICA?.length > 0 && (
                <SimuladoGroupSection
                  groupId="QUIMICA_ORGANICA"
                  simulados={groups.QUIMICA_ORGANICA}
                  renderCard={renderCard}
                  defaultOpen={false}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export { GROUP_CONFIGS };
