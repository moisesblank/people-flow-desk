import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
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
}

const searchItems: SearchItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Visão geral do sistema",
    path: "/",
    icon: LayoutDashboard,
    keywords: ["início", "home", "visão", "geral"],
    category: "Principal",
  },
  {
    id: "calendario",
    title: "Calendário",
    description: "Gerenciar tarefas e eventos",
    path: "/calendario",
    icon: Calendar,
    keywords: ["agenda", "tarefas", "eventos", "compromissos"],
    category: "Principal",
  },
  {
    id: "funcionarios",
    title: "Funcionários",
    description: "Gestão da equipe",
    path: "/funcionarios",
    icon: Users,
    keywords: ["equipe", "time", "colaboradores", "pessoas"],
    category: "Principal",
  },
  {
    id: "gestao-equipe",
    title: "Gestão de Equipe",
    description: "Administrar equipe e permissões",
    path: "/gestao-equipe",
    icon: Users,
    keywords: ["admin", "permissões", "roles"],
    category: "Principal",
  },
  {
    id: "financas-pessoais",
    title: "Finanças Pessoais",
    description: "Controle de gastos pessoais",
    path: "/financas-pessoais",
    icon: Wallet,
    keywords: ["gastos", "despesas", "pessoal", "dinheiro"],
    category: "Finanças",
  },
  {
    id: "financas-empresa",
    title: "Finanças da Empresa",
    description: "Controle financeiro empresarial",
    path: "/financas-empresa",
    icon: Building2,
    keywords: ["empresa", "corporativo", "gastos"],
    category: "Finanças",
  },
  {
    id: "entradas",
    title: "Entradas",
    description: "Registrar receitas",
    path: "/entradas",
    icon: TrendingUp,
    keywords: ["receitas", "ganhos", "faturamento"],
    category: "Finanças",
  },
  {
    id: "pagamentos",
    title: "Pagamentos",
    description: "Gerenciar pagamentos",
    path: "/pagamentos",
    icon: CreditCard,
    keywords: ["contas", "boletos", "pagar"],
    category: "Finanças",
  },
  {
    id: "contabilidade",
    title: "Contabilidade",
    description: "Controle contábil completo",
    path: "/contabilidade",
    icon: Calculator,
    keywords: ["impostos", "roi", "cac", "ltv"],
    category: "Finanças",
  },
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Análises e relatórios",
    path: "/relatorios",
    icon: FileText,
    keywords: ["análise", "métricas", "gráficos"],
    category: "Finanças",
  },
  {
    id: "afiliados",
    title: "Afiliados",
    description: "Gerenciar afiliados",
    path: "/afiliados",
    icon: Handshake,
    keywords: ["parceiros", "comissões", "vendas"],
    category: "Negócio",
  },
  {
    id: "alunos",
    title: "Alunos",
    description: "Gestão de alunos",
    path: "/alunos",
    icon: GraduationCap,
    keywords: ["estudantes", "cursos", "matriculas"],
    category: "Negócio",
  },
  {
    id: "portal-aluno",
    title: "Portal do Aluno",
    description: "Área do aluno",
    path: "/portal-aluno",
    icon: BookOpen,
    keywords: ["portal", "acesso"],
    category: "Negócio",
  },
  {
    id: "area-professor",
    title: "Área do Professor",
    description: "Checklists e tarefas dos professores",
    path: "/area-professor",
    icon: BookOpen,
    keywords: ["professor", "docente", "checklist"],
    category: "Negócio",
  },
  {
    id: "gestao-site",
    title: "Gestão do Site",
    description: "Pendências e tarefas do site",
    path: "/gestao-site",
    icon: Globe,
    keywords: ["website", "web", "pendências"],
    category: "Negócio",
  },
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Configurações do sistema",
    path: "/configuracoes",
    icon: Settings,
    keywords: ["config", "preferências", "sistema"],
    category: "Sistema",
  },
  {
    id: "guia",
    title: "Guia do Sistema",
    description: "Manual de uso",
    path: "/guia",
    icon: BookOpen,
    keywords: ["ajuda", "help", "tutorial", "manual"],
    category: "Sistema",
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

  const filteredItems = useMemo(() => {
    if (!query.trim()) return searchItems;
    
    const lowerQuery = query.toLowerCase();
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.keywords.some((k) => k.includes(lowerQuery))
    );
  }, [query]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      navigate(item.path);
      onClose();
      setQuery("");
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    },
    [filteredItems, selectedIndex, handleSelect]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <div className="glass-card rounded-2xl shadow-2xl overflow-hidden mx-4">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar páginas, funcionalidades..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/60"
                />
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-secondary rounded text-muted-foreground">
                    ESC
                  </kbd>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <p className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">
                      {category}
                    </p>
                    {items.map((item) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const Icon = item.icon;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                            globalIndex === selectedIndex
                              ? "bg-primary/10 text-foreground"
                              : "hover:bg-secondary/50 text-muted-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              globalIndex === selectedIndex
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              globalIndex === selectedIndex
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-2"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}

                {filteredItems.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-secondary rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-secondary rounded">↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-secondary rounded">↵</kbd>
                    selecionar
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded">Ctrl</kbd>
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded">K</kbd>
                  busca
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
