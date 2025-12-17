// ============================================
// SYNAPSE v14.0 - SIDEBAR NAVIGATION
// Sistema de Navegação com suporte a Owner Mode
// ============================================

import { useState, useEffect } from "react";
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
  Trophy,
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
  Gamepad2,
  Car,
  ShoppingCart,
  
  Gauge,
  MessageSquare,
  Activity,
  Zap,
  Eye,
  Heart,
  FlaskConical
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Imagens para os grupos do sidebar
import dashboardImg from "@/assets/dashboard-chemistry-hero.jpg";
import marketingImg from "@/assets/marketing-module-cover.jpg";
import calendarImg from "@/assets/calendar-module-cover.jpg";
import financeImg from "@/assets/finance-module-cover.jpg";
import studentsImg from "@/assets/students-module-cover.jpg";
import teamImg from "@/assets/team-module-cover.jpg";
import devImg from "@/assets/dev-module-cover.jpg";
import personalLifeImg from "@/assets/personal-life-cover.jpg";
import godModeImg from "@/assets/god-mode-cover.jpg";

const mainMenuItems = [
  { title: "Central de Comando", url: "/", icon: Brain },
  { title: "Dashboard Executivo", url: "/dashboard-executivo", icon: Gauge },
  { title: "Tarefas", url: "/tarefas", icon: ClipboardCheck },
  { title: "Documentos", url: "/documentos", icon: FolderOpen },
  { title: "Leads WhatsApp", url: "/leads-whatsapp", icon: MessageSquare },
  { title: "Integrações", url: "/integracoes", icon: Link2 },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Funcionários", url: "/funcionarios", icon: Users },
  
  { title: "Área Professor", url: "/area-professor", icon: ClipboardCheck },
  { title: "Gestão Equipe", url: "/gestao-equipe", icon: UserCog },
];

const marketingMenuItems = [
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Lançamento", url: "/lancamento", icon: Rocket },
  { title: "Métricas", url: "/metricas", icon: BarChart3 },
  { title: "Arquivos Importantes", url: "/arquivos", icon: FolderOpen },
];

const classMenuItems = [
  { title: "Planejamento de Aula", url: "/planejamento-aula", icon: PenTool },
  { title: "Turmas Online", url: "/turmas-online", icon: Monitor },
  { title: "Turmas Presenciais", url: "/turmas-presenciais", icon: MapPin },
];

const financeMenuItems = [
  { title: "Finanças Pessoais", url: "/financas-pessoais", icon: Wallet },
  { title: "Finanças Empresa", url: "/financas-empresa", icon: Building2 },
  { title: "Entradas", url: "/entradas", icon: TrendingUp },
  { title: "Pagamentos", url: "/pagamentos", icon: CreditCard },
  { title: "Contabilidade", url: "/contabilidade", icon: Calculator },
];

const businessMenuItems = [
  { title: "Cursos", url: "/cursos", icon: PlayCircle },
  { title: "Simulados", url: "/simulados", icon: Brain },
  { title: "Afiliados", url: "/afiliados", icon: Handshake },
  { title: "Alunos", url: "/alunos", icon: GraduationCap },
  { title: "Portal Aluno", url: "/portal-aluno", icon: UserCheck },
  { title: "Gestão Site", url: "/gestao-site", icon: Globe },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Guia", url: "/guia", icon: BookOpen },
];

// NOVO: Menu Laboratório
const laboratorioMenuItems = [
  { title: "Laboratório", url: "/laboratorio", icon: Zap },
];

const siteMenuItems = [
  { title: "Site/Programador", url: "/site-programador", icon: Code },
];

// ATUALIZADO: Menu Vida Pessoal (apenas owner)
const pessoalMenuItems = [
  { title: "Pessoal", url: "/pessoal", icon: User },
  { title: "Vida Pessoal", url: "/vida-pessoal", icon: Heart },
];

const adminMenuItems = [
  { title: "Permissões", url: "/permissoes", icon: Shield },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

// Menu exclusivo do OWNER
const ownerMenuItems = [
  { title: "Monitoramento", url: "/monitoramento", icon: Activity, badge: "DEUS" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isOwner } = useAdminCheck();
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Buscar nome do usuário do perfil
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      // Primeiro tenta do user_metadata
      const metaName = user.user_metadata?.nome;
      if (metaName) {
        setUserName(metaName);
      }
      
      // Depois busca do profiles para ter dados atualizados
      const { data } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data?.nome) {
        setUserName(data.nome);
      }
      if (data?.avatar_url) {
        setUserAvatar(data.avatar_url);
      }
    };
    
    fetchUserProfile();
  }, [user?.id, user?.user_metadata?.nome]);

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string | undefined | null, email: string | undefined) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (!email) return "MM";
    return email.substring(0, 2).toUpperCase();
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
                <span className="text-xs text-muted-foreground">Curso de Química v7.0</span>
              </div>
            )}
          </div>
          {/* Nome do usuário logado em destaque */}
          {!collapsed && userName && (
            <div className="mt-1 px-1">
              <span className="text-sm font-bold text-red-400 tracking-wide">
                {userName}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Menu */}
        <SidebarGroup>
          {!collapsed && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
              <img 
                src={dashboardImg} 
                alt="Principal" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center px-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">Principal</span>
              </div>
            </div>
          )}
          <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Marketing Menu */}
        <SidebarGroup>
          {!collapsed && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
              <img 
                src={marketingImg} 
                alt="Marketing" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-transparent flex items-center px-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">Marketing & Lançamento</span>
              </div>
            </div>
          )}
          <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>Marketing & Lançamento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {marketingMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Class Menu */}
        <SidebarGroup>
          {!collapsed && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
              <img 
                src={calendarImg} 
                alt="Aulas" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-transparent flex items-center px-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">Aulas & Turmas</span>
              </div>
            </div>
          )}
          <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>Aulas & Turmas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {classMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Menu */}
        <SidebarGroup>
          {!collapsed && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
              <img 
                src={financeImg} 
                alt="Finanças" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/80 to-transparent flex items-center px-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">Finanças</span>
              </div>
            </div>
          )}
          <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>Finanças</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business Menu */}
        <SidebarGroup>
          {!collapsed && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
              <img 
                src={studentsImg} 
                alt="Negócios" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-transparent flex items-center px-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">Negócios</span>
              </div>
            </div>
          )}
          <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>Negócios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Site/Programador Menu - DESENVOLVIMENTO */}
        <SidebarGroup>
          {!collapsed && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
              <img 
                src={devImg} 
                alt="Desenvolvimento" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/80 to-transparent flex items-center px-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">Desenvolvimento</span>
              </div>
            </div>
          )}
          <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>Desenvolvimento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {siteMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pessoal Menu - VIDA PESSOAL */}
        <SidebarGroup>
          {!collapsed && (
            <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
              <img 
                src={personalLifeImg} 
                alt="Vida Pessoal" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/80 to-transparent flex items-center px-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">Vida Pessoal</span>
              </div>
            </div>
          )}
          <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>Vida Pessoal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pessoalMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Owner-Only Menu - MODO DEUS */}
        {isOwner && (
          <SidebarGroup>
            {!collapsed && (
              <div className="relative mb-2 rounded-lg overflow-hidden h-16 group">
                <img 
                  src={godModeImg} 
                  alt="Modo Deus" 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/80 via-purple-600/60 to-transparent flex items-center px-3">
                  <Zap className="w-4 h-4 text-amber-300 mr-2 animate-pulse" />
                  <span className="text-sm font-bold text-white drop-shadow-lg">MODO DEUS</span>
                </div>
              </div>
            )}
            <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>
              <span className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-purple-500" />
                MODO DEUS
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ownerMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="group"
                    >
                      <NavLink 
                        to={item.url} 
                        end 
                        className="flex items-center gap-3 relative"
                        activeClassName="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-purple-500" />
                        {!collapsed && (
                          <>
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-9 w-9 shrink-0">
            {userAvatar && <AvatarImage src={userAvatar} alt={userName || "Avatar"} />}
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {getInitials(userName, user?.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userName || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
