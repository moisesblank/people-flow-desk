// ============================================
// MOISÉS MEDEIROS - Mobile Bottom Navigation
// Navegação otimizada para celular
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

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Wallet, label: "Finanças", path: "/financas-empresa" },
  { icon: Calendar, label: "Agenda", path: "/calendario" },
  { icon: CheckSquare, label: "Tarefas", path: "/tarefas" },
];

const moreNavItems: NavItem[] = [
  { icon: Users, label: "Funcionários", path: "/funcionarios" },
  { icon: GraduationCap, label: "Alunos", path: "/alunos" },
  { icon: MessageSquare, label: "WhatsApp", path: "/central-whatsapp" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
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

        {/* More Menu */}
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
      </div>
    </nav>
  );
}
