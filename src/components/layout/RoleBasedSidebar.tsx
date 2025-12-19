// ============================================
// MOISÉS MEDEIROS v10.1 - ROLE-BASED SIDEBAR
// Sidebar com menu filtrado por cargo
// + MODO MASTER: editar títulos e reordenar/realocar itens e categorias
// ============================================

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Building2,
  TrendingUp,
  Handshake,
  GraduationCap,
  FileText,
  LogOut,
  Settings,
  UserCog,
  BookOpen,
  Calendar,
  CreditCard,
  Calculator,
  Globe,
  ClipboardCheck,
  UserCheck,
  Brain,
  Link2,
  Shield,
  PlayCircle,
  Megaphone,
  Rocket,
  BarChart3,
  FolderOpen,
  PenTool,
  Monitor,
  MapPin,
  Code,
  User,
  Heart,
  Gauge,
  Activity,
  Zap,
  Crown,
  Sparkles,
  MessageSquareText,
  Stethoscope,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions, type SystemArea } from "@/hooks/useRolePermissions";
import { useGodMode } from "@/contexts/GodModeContext";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { supabase } from "@/integrations/supabase/client";
import { StorageAndBackupWidget } from "./StorageAndBackupWidget";
import { SidebarNavDnd, type MenuGroup as DndMenuGroup } from "./SidebarNavDnd";

// Imagens
import dashboardImg from "@/assets/dashboard-chemistry-hero.jpg";
import marketingImg from "@/assets/marketing-module-cover.jpg";
import calendarImg from "@/assets/calendar-module-cover.jpg";
import financeImg from "@/assets/finance-module-cover.jpg";
import studentsImg from "@/assets/students-module-cover.jpg";
import teamImg from "@/assets/team-module-cover.jpg";
import devImg from "@/assets/dev-module-cover.jpg";
import personalLifeImg from "@/assets/personal-life-cover.jpg";
import godModeImg from "@/assets/god-mode-cover.jpg";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  area: SystemArea;
  badge?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  image: string;
  color: string;
  items: MenuItem[];
}

// Definição dos menus com suas áreas correspondentes
const menuGroups: MenuGroup[] = [
  {
    id: "principal",
    label: "Principal",
    image: dashboardImg,
    color: "from-primary/80",
    items: [
      { title: "Central de Comando", url: "/", icon: Brain, area: "dashboard" },
      { title: "Dashboard Executivo", url: "/dashboard-executivo", icon: Gauge, area: "dashboard-executivo" },
      { title: "Tarefas", url: "/tarefas", icon: ClipboardCheck, area: "tarefas" },
      { title: "Integrações", url: "/integracoes", icon: Link2, area: "integracoes" },
      { title: "Calendário", url: "/calendario", icon: Calendar, area: "calendario" },
      { title: "Área Professor", url: "/area-professor", icon: ClipboardCheck, area: "area-professor" },
      { title: "Gestão Equipe", url: "/gestao-equipe", icon: UserCog, area: "gestao-equipe" },
    ],
  },
  {
    id: "empresas",
    label: "EMPRESAS",
    image: financeImg,
    color: "from-purple-600/80",
    items: [
      { title: "Dashboard Empresarial", url: "/empresas/dashboard", icon: Building2, area: "dashboard-empresarial", badge: "ERP" },
      { title: "Finanças Empresa", url: "/financas-empresa", icon: Wallet, area: "financas-empresa" },
      { title: "Entradas", url: "/entradas", icon: TrendingUp, area: "entradas" },
      { title: "Pagamentos", url: "/pagamentos", icon: CreditCard, area: "pagamentos" },
      { title: "Contabilidade", url: "/contabilidade", icon: Calculator, area: "contabilidade" },
      { title: "Funcionários (RH)", url: "/empresas/rh", icon: Users, area: "rh-funcionarios" },
      { title: "Arquivos Empresariais", url: "/empresas/arquivos", icon: FolderOpen, area: "arquivos-empresariais" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Lançamento",
    image: marketingImg,
    color: "from-orange-600/80",
    items: [
      { title: "Central de Métricas", url: "/central-metricas", icon: Activity, area: "metricas", badge: "LIVE" },
      { title: "Marketing", url: "/marketing", icon: Megaphone, area: "marketing" },
      { title: "Lançamento", url: "/lancamento", icon: Rocket, area: "lancamento" },
      { title: "Métricas", url: "/metricas", icon: BarChart3, area: "metricas" },
      { title: "Arquivos", url: "/arquivos", icon: FolderOpen, area: "arquivos" },
    ],
  },
  {
    id: "aulas",
    label: "Aulas & Turmas",
    image: calendarImg,
    color: "from-blue-600/80",
    items: [
      { title: "Planejamento de Aula", url: "/planejamento-aula", icon: PenTool, area: "planejamento-aula" },
      { title: "Turmas Online", url: "/turmas-online", icon: Monitor, area: "turmas-online" },
      { title: "Turmas Presenciais", url: "/turmas-presenciais", icon: MapPin, area: "turmas-presenciais" },
    ],
  },
  {
    id: "financas",
    label: "Finanças",
    image: financeImg,
    color: "from-green-600/80",
    items: [
      { title: "Finanças Pessoais", url: "/financas-pessoais", icon: Wallet, area: "financas-pessoais" },
      { title: "Finanças Empresa", url: "/financas-empresa", icon: Building2, area: "financas-empresa" },
      { title: "Entradas", url: "/entradas", icon: TrendingUp, area: "entradas" },
      { title: "Pagamentos", url: "/pagamentos", icon: CreditCard, area: "pagamentos" },
      { title: "Contabilidade", url: "/contabilidade", icon: Calculator, area: "contabilidade" },
    ],
  },
  {
    id: "negocios",
    label: "Negócios",
    image: studentsImg,
    color: "from-purple-600/80",
    items: [
      { title: "Cursos", url: "/cursos", icon: PlayCircle, area: "cursos" },
      { title: "Simulados", url: "/simulados", icon: Brain, area: "simulados" },
      { title: "Afiliados", url: "/afiliados", icon: Handshake, area: "afiliados" },
      { title: "Alunos", url: "/alunos", icon: GraduationCap, area: "alunos" },
      { title: "Portal Aluno", url: "/portal-aluno", icon: UserCheck, area: "portal-aluno" },
      { title: "Gestão Site", url: "/gestao-site", icon: Globe, area: "gestao-site" },
      { title: "Relatórios", url: "/relatorios", icon: FileText, area: "relatorios" },
      { title: "Guia", url: "/guia", icon: BookOpen, area: "guia" },
    ],
  },
  {
    id: "laboratorio",
    label: "Laboratório",
    image: devImg,
    color: "from-cyan-600/80",
    items: [
      { title: "Laboratório", url: "/laboratorio", icon: Zap, area: "laboratorio" },
      { title: "Site/Programador", url: "/site-programador", icon: Code, area: "site-programador" },
    ],
  },
  {
    id: "pessoal",
    label: "Vida Pessoal",
    image: personalLifeImg,
    color: "from-pink-600/80",
    items: [
      { title: "Pessoal", url: "/pessoal", icon: User, area: "pessoal" },
      { title: "Vida Pessoal", url: "/vida-pessoal", icon: Heart, area: "vida-pessoal" },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    image: teamImg,
    color: "from-slate-600/80",
    items: [
      { title: "Permissões", url: "/permissoes", icon: Shield, area: "permissoes" },
      { title: "Configurações", url: "/configuracoes", icon: Settings, area: "configuracoes" },
    ],
  },
  {
    id: "owner",
    label: "Modo Master",
    image: godModeImg,
    color: "from-purple-600/80 via-pink-600/80",
    items: [
      { title: "Monitoramento", url: "/monitoramento", icon: Activity, area: "monitoramento", badge: "MASTER" },
      { title: "Central WhatsApp", url: "/central-whatsapp", icon: MessageSquareText, area: "central-whatsapp", badge: "LIVE" },
      { title: "Diagnóstico WhatsApp", url: "/diagnostico-whatsapp", icon: Stethoscope, area: "diagnostico-whatsapp" },
      { title: "Auditoria Acessos", url: "/auditoria-acessos", icon: Shield, area: "auditoria-acessos", badge: "AUDIT" },
      { title: "Central Monitoramento", url: "/central-monitoramento", icon: Activity, area: "central-monitoramento", badge: "REAL-TIME" },
      { title: "Central IAs", url: "/central-ias", icon: Brain, area: "central-ias", badge: "AI" },
    ],
  },
];

export function RoleBasedSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { getContent, updateContent, isActive: isGodModeActive, isOwner: isGodModeOwner } = useGodMode();
  const { role, isGodMode, hasAccess, roleLabel, roleColor } = useRolePermissions();
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      const metaName = user.user_metadata?.nome;
      if (metaName) setUserName(metaName);

      const { data } = await supabase.from("profiles").select("nome, avatar_url").eq("id", user.id).single();
      if (data?.nome) setUserName(data.nome);
      if (data?.avatar_url) setUserAvatar(data.avatar_url);
    };

    fetchUserProfile();
  }, [user?.id, user?.user_metadata?.nome]);

  const filteredMenuGroups = useMemo(() => {
    return menuGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(item.area)) }))
      .filter((group) => group.items.length > 0);
  }, [hasAccess]);

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string | undefined | null, email: string | undefined) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (!email) return "MM";
    return email.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className={`flex flex-col gap-2 ${collapsed ? "items-center" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl brand-gradient shrink-0">
              <span className="text-sm font-bold text-primary-foreground">MM</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">Moisés Medeiros</span>
                <span className="text-xs text-muted-foreground">Curso de Química v10.1</span>
              </div>
            )}
          </div>

          {!collapsed && role && (
            <div className="mt-2 flex flex-col gap-1">
              <span className="text-sm font-bold text-foreground">{userName}</span>
              <Badge className={`${roleColor} text-xs px-2 py-0.5 w-fit`}>
                {isGodMode && <Crown className="w-3 h-3 mr-1" />}
                {roleLabel}
              </Badge>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarNavDnd
          collapsed={collapsed}
          groups={filteredMenuGroups as unknown as DndMenuGroup[]}
          canEditLayout={isGodModeOwner}
          getContent={getContent}
          updateContent={updateContent}
          isActive={isActive}
        />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <StorageAndBackupWidget collapsed={collapsed} />

        <div className={`flex items-center gap-3 p-2 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            {userAvatar ? <AvatarImage src={userAvatar} alt={userName || "User"} /> : null}
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {getInitials(userName, user?.email)}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName || user?.email?.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sair</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
