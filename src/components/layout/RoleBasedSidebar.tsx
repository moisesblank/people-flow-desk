// ============================================
// MOISÉS MEDEIROS v10.0 - ROLE-BASED SIDEBAR
// Sidebar com menu filtrado por cargo
// MODO MASTER para Owner
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Users, Wallet, Building2, TrendingUp, Handshake,
  GraduationCap, FileText, LogOut, Settings, UserCog, BookOpen,
  Calendar, CreditCard, Calculator, Globe, ClipboardCheck, UserCheck,
  Brain, Link2, Shield, PlayCircle, Megaphone, Rocket, BarChart3,
  FolderOpen, PenTool, Monitor, MapPin, Code, User, Heart, FlaskConical,
  Gauge, Activity, Zap, Crown, Sparkles, MessageSquareText, Stethoscope, GripVertical
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions, ROLE_LABELS, ROLE_COLORS, type SystemArea } from "@/hooks/useRolePermissions";
import { useGodMode } from "@/contexts/GodModeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StorageAndBackupWidget } from "./StorageAndBackupWidget";

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
      { title: "Funcionários", url: "/funcionarios", icon: Users, area: "funcionarios" },
      { title: "Área Professor", url: "/area-professor", icon: ClipboardCheck, area: "area-professor" },
      { title: "Gestão Equipe", url: "/gestao-equipe", icon: UserCog, area: "gestao-equipe" },
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
      { title: "Arquivos Importantes", url: "/arquivos", icon: FolderOpen, area: "arquivos" },
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
      { title: "Auditoria Acessos", url: "/auditoria-acessos", icon: Shield, area: "monitoramento", badge: "AUDIT" },
      { title: "Central Monitoramento", url: "/central-monitoramento", icon: Activity, area: "monitoramento", badge: "REAL-TIME" },
      { title: "Central IAs", url: "/central-ias", icon: Brain, area: "monitoramento", badge: "AI" },
    ],
  },
];

function DraggableReorderItem(props: {
  value: string;
  onCommit: () => void;
  children: (startDrag: (e: React.PointerEvent) => void) => React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={props.value}
      dragListener={false}
      dragControls={controls}
      onDragEnd={props.onCommit}
      className="select-none"
    >
      {props.children((e) => controls.start(e))}
    </Reorder.Item>
  );
}

function SidebarMenuReorderable(props: {
  groupId: string;
  items: MenuItem[];
  collapsed: boolean;
  isGodModeActive: boolean;
  isActive: (path: string) => boolean;
  getContent: (key: string, fallback?: string) => string;
  onPersistOrder: (orderedAreas: string[]) => Promise<void>;
}) {
  const { groupId, items, collapsed, isGodModeActive, isActive, getContent, onPersistOrder } = props;

  const orderKey = `nav_group_${groupId}_order`;
  const persisted = getContent(orderKey, "");

  const computeOrder = useCallback(() => {
    const base = items.map((i) => i.area as string);
    if (!persisted) return base;
    try {
      const parsed = JSON.parse(persisted);
      if (!Array.isArray(parsed)) return base;
      const valid = parsed.filter((a: unknown) => typeof a === "string" && base.includes(a)) as string[];
      const rest = base.filter((a) => !valid.includes(a));
      return [...valid, ...rest];
    } catch {
      return base;
    }
  }, [items, persisted]);

  const [orderedAreas, setOrderedAreas] = useState<string[]>(computeOrder());

  useEffect(() => {
    setOrderedAreas(computeOrder());
  }, [computeOrder]);

  const orderedItems = useMemo(() => {
    const byArea = new Map<string, MenuItem>(items.map((i) => [i.area as string, i] as const));
    return orderedAreas.map((a) => byArea.get(a)).filter(Boolean) as MenuItem[];
  }, [items, orderedAreas]);

  const persist = useCallback(async (next: string[]) => {
    if (!isGodModeActive) return;
    await onPersistOrder(next);
  }, [isGodModeActive, onPersistOrder]);

  const renderItem = (item: MenuItem, isDraggable: boolean, startDrag?: (e: React.PointerEvent) => void) => (
    <SidebarMenuItem key={item.area}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
        <NavLink
          to={item.url}
          end
          className="flex items-center gap-3"
          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span className="flex items-center gap-2 min-w-0">
              {isDraggable && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startDrag?.(e);
                  }}
                  className="inline-flex items-center justify-center rounded-md px-1.5 py-1 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60"
                  aria-label="Arrastar item"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              )}
              <span className="truncate" data-editable-key={`nav_${item.area}_title`}>
                {getContent(`nav_${item.area}_title`, item.title)}
              </span>
              {item.badge && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {item.badge}
                </Badge>
              )}
            </span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  // Drag só faz sentido no modo expandido (com texto)
  const canDrag = isGodModeActive && !collapsed;

  if (!canDrag) {
    return <>{orderedItems.map((item) => renderItem(item, false))}</>;
  }

  return (
    <Reorder.Group axis="y" values={orderedAreas} onReorder={setOrderedAreas} className="space-y-1">
      {orderedItems.map((item) => {
        const area = item.area as string;
        return (
          <DraggableReorderItem
            key={area}
            value={area}
            onCommit={() => persist([...orderedAreas])}
          >
            {(startDrag) => renderItem(item, true, startDrag)}
          </DraggableReorderItem>
        );
      })}
    </Reorder.Group>
  );
}


function SidebarGroupsReorderable(props: {
  collapsed: boolean;
  groups: MenuGroup[];
  canReorder: boolean;
  getContent: (key: string, fallback?: string) => string;
  updateContent: (key: string, value: string, type?: string) => Promise<boolean>;
  isActive: (path: string) => boolean;
  isGodModeActive: boolean;
  isGodModeOwner: boolean;
}) {
  const { collapsed, groups, canReorder, getContent, updateContent, isActive, isGodModeActive, isGodModeOwner } = props;

  const persistedGroups = getContent('nav_groups_order', '');

  const computeGroupOrder = useCallback(() => {
    const ids = groups.map((g) => g.id);
    if (!persistedGroups) return ids;
    try {
      const parsed = JSON.parse(persistedGroups);
      if (!Array.isArray(parsed)) return ids;
      const valid = parsed.filter((id: unknown) => typeof id === 'string' && ids.includes(id)) as string[];
      const rest = ids.filter((id) => !valid.includes(id));
      return [...valid, ...rest];
    } catch {
      return ids;
    }
  }, [groups, persistedGroups]);

  const [groupOrder, setGroupOrder] = useState<string[]>(computeGroupOrder());

  useEffect(() => {
    setGroupOrder(computeGroupOrder());
  }, [computeGroupOrder]);

  const groupsById = useMemo(() => new Map(groups.map((g) => [g.id, g] as const)), [groups]);
  const orderedGroups = groupOrder.map((id) => groupsById.get(id)).filter(Boolean) as MenuGroup[];

  const persistGroups = useCallback(
    async (next: string[]) => {
      if (!canReorder) return;
      await updateContent('nav_groups_order', JSON.stringify(next), 'json');
    },
    [canReorder, updateContent]
  );

  const renderGroup = (group: MenuGroup, groupIndex: number, startDrag?: (e: React.PointerEvent) => void) => (
    <motion.div
      key={group.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: groupIndex * 0.05 }}
    >
      <SidebarGroup>
        {!collapsed && (
          <div className="relative mb-2 rounded-lg overflow-hidden h-12 group">
            <img
              src={group.image}
              alt={group.label}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${group.color} to-transparent flex items-center px-3`}>
              {canReorder && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startDrag?.(e);
                  }}
                  className="mr-2 inline-flex items-center justify-center rounded-md px-1.5 py-1 text-white/80 hover:text-white hover:bg-white/10"
                  aria-label="Arrastar categoria"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              )}
              <span className="text-xs font-bold text-white drop-shadow-lg">{group.label}</span>
              {group.id === "owner" && <Sparkles className="w-3 h-3 ml-1 text-yellow-300" />}
            </div>
          </div>
        )}
        <SidebarGroupLabel className={collapsed ? "" : "sr-only"}>{group.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuReorderable
              groupId={group.id}
              items={group.items}
              collapsed={collapsed}
              isGodModeActive={isGodModeActive && isGodModeOwner}
              isActive={isActive}
              getContent={getContent}
              onPersistOrder={async (orderedAreas) => {
                const key = `nav_group_${group.id}_order`;
                await updateContent(key, JSON.stringify(orderedAreas), 'json');
              }}
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </motion.div>
  );

  if (!canReorder) {
    return <AnimatePresence>{orderedGroups.map((g, idx) => renderGroup(g, idx))}</AnimatePresence>;
  }

  return (
    <Reorder.Group axis="y" values={groupOrder} onReorder={setGroupOrder} className="space-y-2">
      {orderedGroups.map((group, idx) => (
        <DraggableReorderItem
          key={group.id}
          value={group.id}
          onCommit={async () => {
            await persistGroups([...groupOrder]);
          }}
        >
          {(startDrag) => renderGroup(group, idx, startDrag)}
        </DraggableReorderItem>
      ))}
    </Reorder.Group>
  );
}

export function RoleBasedSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { getContent, updateContent, isActive: isGodModeActive, isOwner: isGodModeOwner } = useGodMode();
  const { role, isOwner, isGodMode, hasAccess, roleLabel, roleColor } = useRolePermissions();
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Buscar nome do usuário do perfil
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      const metaName = user.user_metadata?.nome;
      if (metaName) setUserName(metaName);
      
      const { data } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data?.nome) setUserName(data.nome);
      if (data?.avatar_url) setUserAvatar(data.avatar_url);
    };
    
    fetchUserProfile();
  }, [user?.id, user?.user_metadata?.nome]);

  // Filtra os grupos de menu baseado nas permissões do usuário
  const filteredMenuGroups = useMemo(() => {
    const groups = menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => hasAccess(item.area))
      }))
      .filter(group => group.items.length > 0);

    const persisted = getContent('nav_groups_order', '');
    if (!persisted) return groups;

    try {
      const parsed = JSON.parse(persisted);
      if (!Array.isArray(parsed)) return groups;
      const ids = groups.map(g => g.id);
      const valid = parsed.filter((id: unknown) => typeof id === 'string' && ids.includes(id)) as string[];
      const rest = ids.filter(id => !valid.includes(id));
      const finalOrder = [...valid, ...rest];
      const byId = new Map(groups.map(g => [g.id, g] as const));
      return finalOrder.map(id => byId.get(id)).filter(Boolean) as typeof groups;
    } catch {
      return groups;
    }
  }, [hasAccess, getContent]);

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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
                <span className="text-xs text-muted-foreground">Curso de Química v10.0</span>
              </div>
            )}
          </div>
          
          {/* Badge do cargo do usuário */}
          {!collapsed && role && (
            <div className="mt-2 flex flex-col gap-1">
              <span className="text-sm font-bold text-foreground">
                {userName}
              </span>
              <Badge className={`${roleColor} text-xs px-2 py-0.5 w-fit`}>
                {isGodMode && <Crown className="w-3 h-3 mr-1" />}
                {roleLabel}
              </Badge>
            </div>
          )}
        </div>
      </SidebarHeader>


      <SidebarContent className="px-2">
        <SidebarGroupsReorderable
          collapsed={collapsed}
          groups={filteredMenuGroups}
          canReorder={isGodModeActive && isGodModeOwner && !collapsed}
          getContent={getContent}
          updateContent={updateContent}
          isActive={isActive}
          isGodModeActive={isGodModeActive}
          isGodModeOwner={isGodModeOwner}
        />
      </SidebarContent>


      <SidebarFooter className="p-2">
        {/* Storage & Backup Widget */}
        <StorageAndBackupWidget collapsed={collapsed} />
        
        <div className={`flex items-center gap-3 p-2 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            {userAvatar ? (
              <AvatarImage src={userAvatar} alt={userName || 'User'} />
            ) : null}
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {getInitials(userName, user?.email)}
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userName || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
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
