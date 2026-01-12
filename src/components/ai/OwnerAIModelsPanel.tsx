// ============================================
// MOISÉS MEDEIROS v10.0 - PAINEL DE IAs DO OWNER
// Botões flutuantes para todos os modelos de IA
// EXCLUSIVO: moisesblank@gmail.com
// ============================================

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Sparkles, 
  Brain, 
  Zap, 
  Rocket, 
  ChevronUp, 
  ChevronDown,
  Crown,
  Cpu,
  Atom,
  Wand2,
  Image,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGodMode } from "@/stores/godModeStore";

// ============================================
// MODELOS DE IA DISPONÍVEIS (Lovable AI Gateway)
// ============================================
const AI_MODELS = [
  // Google Gemini
  { 
    id: "google/gemini-2.5-pro", 
    name: "Gemini 2.5 Pro", 
    shortName: "G-Pro",
    icon: Brain, 
    color: "from-blue-500 to-cyan-500",
    tier: "premium",
    description: "Top-tier: imagem+texto, contexto grande, raciocínio complexo"
  },
  { 
    id: "google/gemini-3-pro-preview", 
    name: "Gemini 3 Pro Preview", 
    shortName: "G3-Pro",
    icon: Atom, 
    color: "from-indigo-500 to-purple-500",
    tier: "premium",
    description: "Next-gen Gemini, mais avançado"
  },
  { 
    id: "google/gemini-3-flash-preview", 
    name: "Gemini 3 Flash Preview", 
    shortName: "G3-Flash",
    icon: Zap, 
    color: "from-yellow-500 to-orange-500",
    tier: "balanced",
    description: "Rápido, equilibrado entre velocidade e capacidade"
  },
  { 
    id: "google/gemini-2.5-flash", 
    name: "Gemini 2.5 Flash", 
    shortName: "G-Flash",
    icon: Zap, 
    color: "from-amber-500 to-yellow-500",
    tier: "balanced",
    description: "Menos custo que Pro, bom para multimodal"
  },
  { 
    id: "google/gemini-2.5-flash-lite", 
    name: "Gemini 2.5 Flash Lite", 
    shortName: "G-Lite",
    icon: Rocket, 
    color: "from-green-500 to-emerald-500",
    tier: "fast",
    description: "Mais rápido e barato, ideal para tarefas simples"
  },
  { 
    id: "google/gemini-3-pro-image-preview", 
    name: "Gemini 3 Pro Image", 
    shortName: "G3-Img",
    icon: Image, 
    color: "from-pink-500 to-rose-500",
    tier: "image",
    description: "Geração de imagens next-gen"
  },
  // OpenAI GPT
  { 
    id: "openai/gpt-5", 
    name: "GPT-5", 
    shortName: "GPT5",
    icon: Sparkles, 
    color: "from-emerald-500 to-teal-500",
    tier: "premium",
    description: "Raciocínio excelente, contexto longo, multimodal"
  },
  { 
    id: "openai/gpt-5-mini", 
    name: "GPT-5 Mini", 
    shortName: "GPT5m",
    icon: Cpu, 
    color: "from-teal-500 to-cyan-500",
    tier: "balanced",
    description: "Custo menor, mantém força de raciocínio"
  },
  { 
    id: "openai/gpt-5-nano", 
    name: "GPT-5 Nano", 
    shortName: "GPT5n",
    icon: Zap, 
    color: "from-slate-500 to-gray-500",
    tier: "fast",
    description: "Velocidade e economia, tarefas simples"
  },
  { 
    id: "openai/gpt-5.2", 
    name: "GPT-5.2", 
    shortName: "GPT5.2",
    icon: Crown, 
    color: "from-purple-600 to-pink-600",
    tier: "premium",
    description: "Mais recente da OpenAI, raciocínio avançado"
  },
] as const;

type AIModel = typeof AI_MODELS[number];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const OwnerAIModelsPanel = memo(function OwnerAIModelsPanel() {
  const { isOwner } = useGodMode();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  // 🔒 APENAS OWNER
  if (!isOwner) return null;

  const handleModelClick = (model: AIModel) => {
    setSelectedModel(model);
    // Aqui você pode integrar com o AIAssistant ou abrir um modal específico
    console.log(`[OWNER AI] Modelo selecionado: ${model.id}`);
  };

  const tierColors = {
    premium: "border-purple-500/50 bg-purple-500/10",
    balanced: "border-amber-500/50 bg-amber-500/10",
    fast: "border-green-500/50 bg-green-500/10",
    image: "border-pink-500/50 bg-pink-500/10",
  };

  const tierLabels = {
    premium: "Premium",
    balanced: "Balanced",
    fast: "Fast",
    image: "Image",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-24 right-6 z-[9998]"
    >
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl transition-all duration-300",
          "bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white",
          "border border-purple-400/30 backdrop-blur-sm"
        )}
        style={{
          boxShadow: "0 0 30px rgba(168, 85, 247, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)"
        }}
      >
        <Crown className="h-4 w-4 text-yellow-300" />
        <span className="font-bold text-sm">IAs Owner</span>
        <Badge variant="secondary" className="bg-white/20 text-white text-xs">
          {AI_MODELS.length}
        </Badge>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </motion.button>

      {/* Panel com todos os modelos */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "absolute bottom-14 right-0 w-80 max-h-[70vh] overflow-hidden",
              "rounded-2xl shadow-2xl border border-purple-500/30",
              "bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-xl"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-purple-600/20 to-pink-500/20">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Bot className="h-5 w-5 text-purple-400" />
                </motion.div>
                <h3 className="font-bold text-foreground">Modelos de IA</h3>
                <Badge className="bg-purple-500/20 text-purple-300 text-xs ml-auto">
                  OWNER ONLY
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lovable AI Gateway • Todos os modelos disponíveis
              </p>
            </div>

            {/* Model List */}
            <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {/* Categorias */}
              {(["premium", "balanced", "fast", "image"] as const).map((tier) => {
                const modelsInTier = AI_MODELS.filter(m => m.tier === tier);
                if (modelsInTier.length === 0) return null;
                
                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", tierColors[tier])}
                      >
                        {tierLabels[tier]}
                      </Badge>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    
                    {modelsInTier.map((model) => {
                      const Icon = model.icon;
                      const isSelected = selectedModel?.id === model.id;
                      
                      return (
                        <Tooltip key={model.id}>
                          <TooltipTrigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleModelClick(model)}
                              className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-lg transition-all",
                                "hover:bg-accent/50 group",
                                isSelected && "bg-accent ring-2 ring-purple-500/50"
                              )}
                            >
                              <div className={cn(
                                "p-2 rounded-lg bg-gradient-to-br",
                                model.color,
                                "shadow-lg"
                              )}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                  {model.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {model.id}
                                </p>
                              </div>
                              <MessageSquare className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="font-medium">{model.name}</p>
                            <p className="text-xs text-muted-foreground">{model.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border/50 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wand2 className="h-3 w-3" />
                  Gateway: ai.gateway.lovable.dev
                </span>
                <span className="text-purple-400 font-medium">
                  v10.0
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default OwnerAIModelsPanel;
