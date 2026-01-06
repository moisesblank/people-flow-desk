// ============================================
// MOISÉS MEDEIROS - Mobile Bottom Navigation
// ÁREA /gestaofc INVISÍVEL - só aparece quando acessada manualmente
// ============================================

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Wallet,
  Calendar,
  Users,
  MoreHorizontal,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Settings,
  GraduationCap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

// ============================================
// REGRA ABSOLUTA: Navegação mobile só aparece
// se o usuário está DENTRO de /gestaofc
// ============================================

// Menu de gestão (só visível dentro de /gestaofc)
const gestaoNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/gestaofc" },
  { icon: Wallet, label: "Finanças", path: "/gestaofc/financas-empresa" },
  { icon: Calendar, label: "Agenda", path: "/gestaofc/calendario" },
  { icon: CheckSquare, label: "Tarefas", path: "/gestaofc/tarefas" },
];

const gestaoMoreItems: NavItem[] = [
  { icon: Users, label: "Funcionários", path: "/gestaofc/funcionarios" },
  { icon: GraduationCap, label: "Alunos", path: "/gestaofc/gestao-alunos" },
  { icon: MessageSquare, label: "WhatsApp", path: "/gestaofc/central-whatsapp" },
  { icon: BarChart3, label: "Relatórios", path: "/gestaofc/relatorios" },
  { icon: Settings, label: "Config", path: "/gestaofc/configuracoes" },
];

// Menu de alunos (para área /alunos)
const alunosNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/alunos/dashboard" },
  { icon: GraduationCap, label: "Aulas", path: "/alunos/aulas" },
  { icon: Calendar, label: "Agenda", path: "/alunos/calendario" },
  { icon: CheckSquare, label: "Atividades", path: "/alunos/atividades" },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Detectar área atual
  const isGestaoArea = location.pathname.startsWith("/gestaofc");
  const isAlunosArea = location.pathname.startsWith("/alunos");

  // ============================================
  // REGRA: Se não está em /gestaofc nem /alunos,
  // NÃO RENDERIZA o nav mobile
  // ============================================
  if (!isGestaoArea && !isAlunosArea) {
    return null;
  }

  // Selecionar itens baseado na área
  const mainNavItems = isGestaoArea ? gestaoNavItems : alunosNavItems;
  const moreNavItems = isGestaoArea ? gestaoMoreItems : [];

  const isActive = (path: string) => {
    if (path === "/gestaofc" || path === "/alunos") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                className={`p-1.5 rounded-xl transition-colors ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Menu - só para gestão */}
        {isGestaoArea && moreNavItems.length > 0 && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-full">
                <div className="p-1.5 rounded-xl">
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-[10px] mt-0.5 font-medium text-muted-foreground">
                  Mais
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Menu Rápido</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-4 py-6">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMoreOpen(false);
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
