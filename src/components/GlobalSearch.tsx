// ============================================
// 🔍 GLOBAL SEARCH v2.0
// ATUALIZADO: Apenas rotas públicas/alunos
// /gestaofc é SECRETO - não aparece na busca
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  Building2,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  Globe,
  Settings,
  BookOpen,
  Calculator,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  keywords: string[];
  category: string;
  /** Se true, só aparece quando usuário está em /gestaofc */
  gestaoOnly?: boolean;
}

// ============================================
// ITENS DE BUSCA PÚBLICOS (aparecem para todos)
// ============================================
const publicSearchItems: SearchItem[] = [
  {
    id: "home",
    title: "Início",
    description: "Página inicial",
    path: "/",
    icon: LayoutDashboard,
    keywords: ["início", "home", "principal"],
    category: "Principal",
  },
  {
    id: "comunidade",
    title: "Comunidade",
    description: "Acesse a comunidade",
    path: "/comunidade",
    icon: Users,
    keywords: ["comunidade", "forum", "grupo"],
    category: "Principal",
  },
  {
    id: "alunos-area",
    title: "Área do Aluno",
    description: "Acesse seus cursos",
    path: "/alunos",
    icon: GraduationCap,
    keywords: ["aluno", "cursos", "aulas"],
    category: "Alunos",
  },
];

// ============================================
// ITENS DE BUSCA GESTÃO (só aparecem em /gestaofc)
// ============================================
const gestaoSearchItems: SearchItem[] = [
  {
    id: "gestao-dashboard",
    title: "Dashboard",
    description: "Visão geral do sistema",
    path: "/gestaofc/dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "visão", "geral", "painel"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-calendario",
    title: "Calendário",
    description: "Gerenciar tarefas e eventos",
    path: "/gestaofc/calendario",
    icon: Calendar,
    keywords: ["agenda", "tarefas", "eventos", "compromissos"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-funcionarios",
    title: "Funcionários",
    description: "Gestão da equipe",
    path: "/gestaofc/funcionarios",
    icon: Users,
    keywords: ["equipe", "time", "colaboradores", "pessoas"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-financas",
    title: "Finanças",
    description: "Controle financeiro",
    path: "/gestaofc/financas-empresa",
    icon: Wallet,
    keywords: ["gastos", "despesas", "receitas", "dinheiro"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-entradas",
    title: "Entradas",
    description: "Registrar receitas",
    path: "/gestaofc/entradas",
    icon: TrendingUp,
    keywords: ["receitas", "ganhos", "faturamento"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-contabilidade",
    title: "Contabilidade",
    description: "Controle contábil",
    path: "/gestaofc/contabilidade",
    icon: Calculator,
    keywords: ["impostos", "roi", "cac", "ltv"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-relatorios",
    title: "Relatórios",
    description: "Análises e relatórios",
    path: "/gestaofc/relatorios",
    icon: FileText,
    keywords: ["análise", "métricas", "gráficos"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-afiliados",
    title: "Afiliados",
    description: "Gerenciar afiliados",
    path: "/gestaofc/afiliados",
    icon: Handshake,
    keywords: ["parceiros", "comissões", "vendas"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-alunos",
    title: "Gestão de Alunos",
    description: "Administrar alunos (lista unificada)",
    path: "/gestaofc/gestao-alunos",
    icon: GraduationCap,
    keywords: ["estudantes", "cursos", "matriculas", "beta", "gratuito"],
    category: "Gestão",
    gestaoOnly: true,
  },
  {
    id: "gestao-configuracoes",
    title: "Configurações",
    description: "Configurações do sistema",
    path: "/gestaofc/configuracoes",
    icon: Settings,
    keywords: ["config", "preferências", "sistema"],
    category: "Gestão",
    gestaoOnly: true,
  },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================
  // DECISÃO: Quais itens mostrar?
  // Se está em /gestaofc → mostra tudo
  // Se NÃO está → mostra só públicos
  // ============================================
  const isInGestao = location.pathname.startsWith('/gestaofc');
  
  const searchItems = useMemo(() => {
    if (isInGestao) {
      // Em /gestaofc: mostra itens de gestão + públicos
      return [...gestaoSearchItems, ...publicSearchItems];
    }
    // Fora de /gestaofc: NUNCA mostra itens de gestão
    return publicSearchItems;
  }, [isInGestao]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return searchItems;
    
    const lowerQuery = query.toLowerCase();
    return searchItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }, [query, searchItems]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Reset query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = useCallback((item: SearchItem) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [filteredItems, selectedIndex, handleSelect, onClose]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Calculate flat index for selection
  const getFlatIndex = useCallback((category: string, itemIndex: number) => {
    let flatIndex = 0;
    for (const [cat, items] of Object.entries(groupedItems)) {
      if (cat === category) {
        return flatIndex + itemIndex;
      }
      flatIndex += items.length;
    }
    return 0;
  }, [groupedItems]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg mx-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar..."
                className="border-0 bg-transparent focus-visible:ring-0 text-lg p-0 h-auto"
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhum resultado encontrado</p>
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {category}
                    </div>
                    {items.map((item, itemIndex) => {
                      const flatIndex = getFlatIndex(category, itemIndex);
                      const isSelected = flatIndex === selectedIndex;
                      const Icon = item.icon;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                            isSelected 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            isSelected ? "bg-primary/20" : "bg-muted"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </div>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            isSelected ? "translate-x-1" : ""
                          )} />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">↑↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">↵</kbd>
                    selecionar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">esc</kbd>
                    fechar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
