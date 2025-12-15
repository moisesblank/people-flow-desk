// ============================================
// SYNAPSE v14.0 - SIDEBAR NAVIGATION
// Sistema de Navegação com suporte a Owner Mode
// ============================================

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
  Clock,
  Gauge,
  MessageSquare,
  Activity,
  Zap,
  Eye
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const mainMenuItems = [
  { title: "Central de Comando", url: "/", icon: Brain },
  { title: "Dashboard Executivo", url: "/dashboard-executivo", icon: Gauge },
  { title: "Integrações", url: "/integracoes", icon: Link2 },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Funcionários", url: "/funcionarios", icon: Users },
  { title: "Ponto Eletrônico", url: "/ponto-eletronico", icon: Clock },
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

const siteMenuItems = [
  { title: "Site/Programador", url: "/site-programador", icon: Code },
];

const pessoalMenuItems = [
  { title: "Pessoal", url: "/pessoal", icon: User },
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

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (email: string | undefined) => {
    if (!email) return "MM";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
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
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Principal</SidebarGroupLabel>
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
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Marketing & Lançamento</SidebarGroupLabel>
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
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Aulas & Turmas</SidebarGroupLabel>
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
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Finanças</SidebarGroupLabel>
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
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Negócios</SidebarGroupLabel>
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

        {/* Site/Programador Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Desenvolvimento</SidebarGroupLabel>
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

        {/* Pessoal Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Vida Pessoal</SidebarGroupLabel>
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
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
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
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email?.split("@")[0]}
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
