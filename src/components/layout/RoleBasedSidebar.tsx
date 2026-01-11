// ============================================
// MOISÉS MEDEIROS v10.3 - ROLE-BASED SIDEBAR
// Sidebar com menu filtrado por cargo
// + Integração com useMenuConfig (banco de dados)
// + Fallback para dados hardcoded se banco vazio
// + MODO MASTER: editar títulos e reordenar/realocar itens e categorias
// ============================================

import { useEffect, useMemo, useState, forwardRef } from "react";
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
  ShieldOff,
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
  // ÍCONES ÁREA DO ALUNO
  Video,
  FileDown,
  Lightbulb,
  Network,
  HelpCircle,
  PenLine,
  Trophy,
  Medal,
  Star,
  MessageCircle,
  Radio,
  Eraser,
  Beaker,
  Calculator as CalcIcon,
  AtomIcon,
  Target,
  CalendarDays,
  Award,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions, type SystemArea } from "@/hooks/useRolePermissions";
import { useGodMode } from "@/stores/godModeStore";
import { useDynamicMenuItems } from "@/hooks/useDynamicMenuItems";
import { useMenuConfig, type MenuGroup as DBMenuGroup, type MenuItem as DBMenuItem } from "@/hooks/useMenuConfig";
import { getIconComponent } from "@/lib/iconMap";

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
import alunosCentralImg from "@/assets/alunos-central-cover.jpg";

// 🏛️ CONSTITUIÇÃO: OWNER EMAIL (IMUTÁVEL)
const OWNER_EMAIL = "moisesblank@gmail.com";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  area: SystemArea;
  badge?: string;
  textColor?: string; // Cor personalizada para o item (ex: "text-red-500")
}

interface MenuGroup {
  id: string;
  label: string;
  image: string;
  color: string;
  items: MenuItem[];
}

// ============================================
// MENUS DE GESTÃO (só visível em /gestaofc)
// Todos os paths são prefixados com /gestaofc
// ============================================
const gestaoMenuGroups: MenuGroup[] = [
  {
    id: "principal",
    label: "Principal",
    image: dashboardImg,
    color: "from-primary/80",
    items: [
      { title: "Central de Comando", url: "/gestaofc", icon: Brain, area: "dashboard" },
      { title: "Dashboard Executivo", url: "/gestaofc/dashboard-executivo", icon: Gauge, area: "dashboard-executivo" },
      { title: "Reset Segurança", url: "/gestaofc/reset-seguranca", icon: ShieldOff, area: "reset-seguranca", badge: "OWNER" },
      { title: "Tarefas", url: "/gestaofc/tarefas", icon: ClipboardCheck, area: "tarefas" },
      { title: "Integrações", url: "/gestaofc/integracoes", icon: Link2, area: "integracoes" },
      { title: "Calendário", url: "/gestaofc/calendario", icon: Calendar, area: "calendario" },
      { title: "Logs", url: "/gestaofc/logs", icon: Activity, area: "logs", badge: "LIVE" },
      { title: "Área Professor", url: "/gestaofc/area-professor", icon: ClipboardCheck, area: "area-professor" },
    ],
  },
  {
    id: "empresas",
    label: "EMPRESAS",
    image: financeImg,
    color: "from-purple-600/80",
    items: [
      { title: "Central Financeira", url: "/gestaofc/financas-empresa", icon: Wallet, area: "financas-empresa", badge: "CENTRAL" },
      { title: "Receitas", url: "/gestaofc/empresas/receitas", icon: TrendingUp, area: "receitas-empresariais", badge: "LIVE" },
      { title: "Contabilidade", url: "/gestaofc/contabilidade", icon: Calculator, area: "contabilidade" },
      { title: "Funcionários (RH)", url: "/gestaofc/empresas/rh", icon: Users, area: "rh-funcionarios" },
      { title: "Arquivos Empresariais", url: "/gestaofc/empresas/arquivos", icon: FolderOpen, area: "arquivos-empresariais" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Lançamento",
    image: marketingImg,
    color: "from-orange-600/80",
    items: [
      { title: "Central de Métricas", url: "/gestaofc/central-metricas", icon: Activity, area: "metricas", badge: "LIVE" },
      { title: "Marketing", url: "/gestaofc/marketing", icon: Megaphone, area: "marketing" },
      { title: "Lançamento", url: "/gestaofc/lancamento", icon: Rocket, area: "lancamento" },
      { title: "Métricas", url: "/gestaofc/metricas", icon: BarChart3, area: "metricas" },
      { title: "Arquivos", url: "/gestaofc/arquivos", icon: FolderOpen, area: "arquivos" },
    ],
  },
  {
    id: "aulas",
    label: "Aulas & Turmas",
    image: calendarImg,
    color: "from-blue-600/80",
    items: [
      { title: "Planejamento", url: "/gestaofc/planejamento", icon: PenTool, area: "planejamento" },
      { title: "Turmas Online", url: "/gestaofc/turmas-online", icon: Monitor, area: "turmas-online" },
      { title: "Turmas Presenciais", url: "/gestaofc/turmas-presenciais", icon: MapPin, area: "turmas-presenciais" },
      { title: "Simulados", url: "/gestaofc/simulados", icon: Brain, area: "simulados" },
    ],
  },
  {
    id: "financas",
    label: "Finanças",
    image: financeImg,
    color: "from-green-600/80",
    items: [
      { title: "Finanças Pessoais", url: "/gestaofc/financas-pessoais", icon: Wallet, area: "financas-pessoais" },
      { title: "Finanças Empresa", url: "/gestaofc/financas-empresa", icon: Building2, area: "financas-empresa", badge: "CENTRAL" },
      // 🔑 IMPORTANTE: 'area' precisa bater com nav_sidebar_layout_v1 (editable_content)
      { title: "Flashcards", url: "/gestaofc/flashcards", icon: Brain, area: "flashcards" },
      { title: "Materiais PDF", url: "/gestaofc/materiais", icon: FileDown, area: "materiais" },
      { title: "Mapas Mentais", url: "/gestaofc/mapas-mentais", icon: Network, area: "mapas-mentais" },
      { title: "Entradas", url: "/gestaofc/entradas", icon: TrendingUp, area: "entradas" },
      { title: "Contabilidade", url: "/gestaofc/contabilidade", icon: Calculator, area: "contabilidade" },
    ],
  },
  {
    id: "negocios",
    label: "Negócios",
    image: studentsImg,
    color: "from-purple-600/80",
    items: [
      { title: "Cursos", url: "/gestaofc/cursos", icon: PlayCircle, area: "cursos" },
      { title: "Afiliados", url: "/gestaofc/afiliados", icon: Handshake, area: "afiliados" },
      { title: "Gestão Alunos", url: "/gestaofc/gestao-alunos", icon: GraduationCap, area: "alunos" },
      { title: "Portal Aluno", url: "/gestaofc/portal-aluno", icon: UserCheck, area: "portal-aluno" },
      { title: "Relatórios", url: "/gestaofc/relatorios", icon: FileText, area: "relatorios" },
      { title: "Guia", url: "/gestaofc/guia", icon: BookOpen, area: "guia" },
    ],
  },
  {
    id: "site",
    label: "Site",
    image: devImg,
    color: "from-cyan-600/80",
    items: [
      { title: "Gestão Site", url: "/gestaofc/gestao-site", icon: Globe, area: "gestao-site" },
      { title: "Site/Programador", url: "/gestaofc/site-programador", icon: Code, area: "site-programador" },
      // 🔑 IMPORTANTE: 'area' precisa bater com nav_sidebar_layout_v1 (editable_content)
      { title: "Flashcards", url: "/gestaofc/flashcards", icon: Brain, area: "flashcards" },
      { title: "Materiais PDF", url: "/gestaofc/materiais", icon: FileDown, area: "materiais" },
      { title: "Cursos", url: "/gestaofc/cursos", icon: GraduationCap, area: "cursos", badge: "LMS" },
      { title: "Mapas Mentais", url: "/gestaofc/mapas-mentais", icon: Network, area: "mapas-mentais" },
      { title: "Livros Web", url: "/gestaofc/livros-web", icon: BookOpen, area: "livros-web" },
      { title: "Questões", url: "/gestaofc/questoes", icon: Brain, area: "questoes" },
      { title: "Lives", url: "/gestaofc/lives", icon: PlayCircle, area: "lives" },
      { title: "Laboratório", url: "/gestaofc/laboratorio", icon: Zap, area: "laboratorio" },
      { title: "Videoaulas", url: "/gestaofc/videoaulas", icon: PlayCircle, area: "videoaulas" },
      { title: "Tutoria", url: "/gestaofc/tutoria", icon: MessageSquareText, area: "tutoria" },
      { title: "Fórum", url: "/gestaofc/forum", icon: MessageCircle, area: "forum" },
      { title: "Cronograma", url: "/gestaofc/cronograma", icon: Calendar, area: "cronograma" },
      { title: "Planejamento", url: "/gestaofc/planejamento", icon: Target, area: "planejamento", badge: "NOVO" },
    ],
  },
  {
    id: "pessoal",
    label: "Vida Pessoal",
    image: personalLifeImg,
    color: "from-pink-600/80",
    items: [
      { title: "Pessoal", url: "/gestaofc/pessoal", icon: User, area: "pessoal" },
      { title: "Vida Pessoal", url: "/gestaofc/vida-pessoal", icon: Heart, area: "vida-pessoal" },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    image: teamImg,
    color: "from-slate-600/80",
    items: [
      { title: "Permissões", url: "/gestaofc/permissoes", icon: Shield, area: "permissoes" },
      { title: "Configurações", url: "/gestaofc/configuracoes", icon: Settings, area: "configuracoes" },
    ],
  },
  {
    id: "owner",
    label: "Modo Master",
    image: godModeImg,
    color: "from-purple-600/80 via-pink-600/80",
    items: [
      { title: "Monitoramento", url: "/gestaofc/monitoramento", icon: Activity, area: "monitoramento", badge: "MASTER" },
      { title: "Central WhatsApp", url: "/gestaofc/central-whatsapp", icon: MessageSquareText, area: "central-whatsapp", badge: "LIVE" },
      { title: "Diagnóstico WhatsApp", url: "/gestaofc/diagnostico-whatsapp", icon: Stethoscope, area: "diagnostico-whatsapp" },
      { title: "Auditoria Acessos", url: "/gestaofc/auditoria-acessos", icon: Shield, area: "auditoria-acessos", badge: "AUDIT" },
      { title: "Central Monitoramento", url: "/gestaofc/central-monitoramento", icon: Activity, area: "central-monitoramento", badge: "REAL-TIME" },
      { title: "Central IAs", url: "/gestaofc/central-ias", icon: Brain, area: "central-ias", badge: "AI" },
    ],
  },
];

// ============================================
// MENUS DE ALUNO (visível em /alunos)
// ============================================
const alunoMenuGroups: MenuGroup[] = [
  {
    id: "aluno-aprendizado",
    label: "📚 APRENDIZADO",
    image: alunosCentralImg,
    color: "from-cyan-600/80 via-blue-600/80",
    items: [
      { title: "Dashboard Aluno", url: "/alunos/dashboard", icon: LayoutDashboard, area: "aluno-dashboard", badge: "HOME" },
      { title: "Livro Web", url: "/alunos/livro-web", icon: BookOpen, area: "aluno-livro-web", badge: "NOVO" },
      { title: "Cursos", url: "/alunos/cursos", icon: GraduationCap, area: "aluno-cursos", badge: "NOVO" },
      { title: "Meu Planejamento", url: "/alunos/planejamento", icon: Target, area: "aluno-planejamento", badge: "NOVO" },
      { title: "Meu Cronograma", url: "/alunos/cronograma", icon: CalendarDays, area: "aluno-cronograma" },
      // HIDDEN_ITEMS: Videoaulas removida do menu (mantida no sistema)
      // { title: "Videoaulas", url: "/alunos/videoaulas", icon: Video, area: "aluno-videoaulas", badge: "HD" },
      // HIDDEN_ITEMS: Resumos e Mapas Mentais removidos do menu (mantidos no sistema)
      // { title: "Resumos", url: "/alunos/resumos", icon: Lightbulb, area: "aluno-resumos" },
      // { title: "Mapas Mentais", url: "/alunos/mapas-mentais", icon: Network, area: "aluno-mapas-mentais" },
    ],
  },
  {
    id: "aluno-pratica",
    label: "🧪 PRÁTICA & TREINO",
    image: alunosCentralImg,
    color: "from-emerald-600/80 via-green-600/80",
    items: [
      { title: "Banco de Questões", url: "/alunos/questoes", icon: HelpCircle, area: "aluno-questoes", badge: "+5000" },
      { title: "Simulados ENEM", url: "/alunos/simulados", icon: Brain, area: "aluno-simulados", badge: "REAL" },
      // HIDDEN_ITEMS: Redação Química removida do menu (mantida no sistema)
      // { title: "Redação Química", url: "/alunos/redacao", icon: PenLine, area: "aluno-redacao" },
      { title: "Flashcards", url: "/alunos/flashcards", icon: Sparkles, area: "aluno-flashcards" },
      { title: "Materiais PDF", url: "/alunos/materiais", icon: FileDown, area: "aluno-materiais", badge: "PDF" },
      // HIDDEN_ITEMS: Revisão Inteligente removida do menu (mantida no sistema)
      // { title: "Revisão Inteligente", url: "/alunos/revisao", icon: Eraser, area: "aluno-revisao", badge: "IA" },
    ],
  },
  // HIDDEN_GROUP: Ferramentas (Laboratório Virtual e Calculadora Química) removidas do menu (mantidas no sistema)
  // {
  //   id: "aluno-ferramentas",
  //   label: "🔬 FERRAMENTAS",
  //   image: alunosCentralImg,
  //   color: "from-violet-600/80 via-purple-600/80",
  //   items: [
  //     { title: "Laboratório Virtual", url: "/alunos/laboratorio", icon: Beaker, area: "aluno-laboratorio", badge: "3D" },
  //     { title: "Calculadora Química", url: "/alunos/calculadora", icon: CalcIcon, area: "aluno-calculadora" },
  //   ],
  // },
  // HIDDEN_GROUP: Performance (Meu Desempenho e Ranking) integradas no /alunos/dashboard (mantidas no sistema)
  // {
  //   id: "aluno-performance",
  //   label: "🏆 PERFORMANCE",
  //   image: alunosCentralImg,
  //   color: "from-amber-500/80 via-yellow-500/80",
  //   items: [
  //     { title: "Meu Desempenho", url: "/alunos/desempenho", icon: BarChart3, area: "aluno-desempenho" },
  //     { title: "Ranking Geral", url: "/alunos/ranking", icon: Trophy, area: "aluno-ranking", badge: "TOP" },
  //     // HIDDEN_ITEMS: Conquistas e Metas de Estudo removidas do menu (mantidas no sistema)
  //     // { title: "Conquistas", url: "/alunos/conquistas", icon: Medal, area: "aluno-conquistas" },
  //     // { title: "Metas de Estudo", url: "/alunos/metas", icon: Target, area: "aluno-metas" },
  //   ],
  // },
  {
    id: "aluno-comunidade",
    label: "💬 COMUNIDADE",
    image: alunosCentralImg,
    color: "from-rose-500/80 via-pink-600/80",
    items: [
      { title: "Tutoria ao Vivo", url: "/alunos/tutoria", icon: UserCheck, area: "aluno-tutoria", badge: "LIVE" },
      { title: "Fórum de Dúvidas", url: "/alunos/forum", icon: MessageCircle, area: "aluno-forum" },
      { title: "Lives Exclusivas", url: "/alunos/lives", icon: Radio, area: "aluno-lives", badge: "AO VIVO", textColor: "text-red-500" },
      // HIDDEN_ITEMS: Tire suas Dúvidas removida do menu (mantida no sistema)
      // { title: "Tire suas Dúvidas", url: "/alunos/duvidas", icon: HelpCircle, area: "aluno-duvidas" },
    ],
  },
  {
    id: "aluno-perfil",
    label: "👤 MEU PERFIL",
    image: alunosCentralImg,
    color: "from-slate-500/80 via-gray-600/80",
    items: [
      // HIDDEN_ITEMS: Minha Agenda integrada ao /alunos/perfil (mantida no sistema)
      // { title: "Minha Agenda", url: "/alunos/agenda", icon: Calendar, area: "aluno-agenda" },
      // HIDDEN_ITEMS: Certificados removido do menu (mantido no sistema)
      // { title: "Certificados", url: "/alunos/certificados", icon: Award, area: "aluno-certificados" },
      { title: "Meu Perfil", url: "/alunos/perfil", icon: User, area: "aluno-perfil" },
    ],
  },
];

// ✅ forwardRef para compatibilidade com Radix UI (evita warnings de ref)
export const RoleBasedSidebar = forwardRef<HTMLDivElement, Record<string, never>>(function RoleBasedSidebar(_props, ref) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { getContent, updateContent, isActive: isGodModeActive, isOwner: isGodModeOwner } = useGodMode();
  const { role, isGodMode, hasAccess, roleLabel, roleColor } = useRolePermissions();
  const { items: dynamicItems } = useDynamicMenuItems();
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // ============================================
  // INTEGRAÇÃO COM useMenuConfig (banco de dados)
  // ============================================
  const { 
    groupsWithItems: dbMenuGroups, 
    hasData: hasDbData, 
    isLoading: isMenuLoading 
  } = useMenuConfig();

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

  // ============================================
  // REGRA: Selecionar menus baseado na área atual
  // /gestaofc → gestaoMenuGroups (ou banco se disponível)
  // /alunos → alunoMenuGroups (hardcoded por enquanto)
  // Fora dessas áreas → vazio (sidebar não aparece)
  // ============================================
  const isGestaoArea = location.pathname.startsWith("/gestaofc");
  const isAlunosArea = location.pathname.startsWith("/alunos");
  
  // ============================================
  // CONVERTER DADOS DO BANCO PARA FORMATO DO SIDEBAR
  // ============================================
  const dbMenuGroupsConverted: MenuGroup[] = useMemo(() => {
    if (!hasDbData || !isGestaoArea) return [];
    
    return dbMenuGroups
      .filter(g => g.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(group => ({
        id: group.group_key,
        label: group.group_label,
        image: dashboardImg, // Imagem padrão, pode ser mapeada depois
        color: group.group_color || "from-primary/80",
        items: group.items
          .filter(item => item.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(item => {
            const IconComponent = getIconComponent(item.item_icon);
            return {
              title: item.item_label,
              url: item.item_url,
              icon: IconComponent || FileText,
              area: (item.item_area || "dashboard") as SystemArea,
              badge: item.item_badge || undefined
            };
          })
      }));
  }, [hasDbData, isGestaoArea, dbMenuGroups]);

  // Selecionar os menus apropriados baseado na área
  // PRIORIDADE: Banco de dados > Hardcoded
  const currentMenuGroups = useMemo(() => {
    if (isGestaoArea) {
      // Se há dados no banco, usar banco. Senão, fallback hardcoded
      return hasDbData && dbMenuGroupsConverted.length > 0 
        ? dbMenuGroupsConverted 
        : gestaoMenuGroups;
    }
    if (isAlunosArea) return alunoMenuGroups;
    return []; // Fora de /gestaofc ou /alunos, não mostra nada
  }, [isGestaoArea, isAlunosArea, hasDbData, dbMenuGroupsConverted]);

  // Merge static menu groups with dynamic items from database (para itens extras)
  const filteredMenuGroups = useMemo(() => {
    // Se não há menus (fora das áreas), retornar vazio
    if (currentMenuGroups.length === 0) return [];
    
    // Create a map of icons for dynamic items
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      FileText, Brain, Users, Wallet, Building2, TrendingUp, Handshake,
      GraduationCap, BookOpen, Calendar, Calculator, Globe, ClipboardCheck,
      UserCheck, Link2, Shield, PlayCircle, Megaphone, Rocket, BarChart3,
      FolderOpen, PenTool, Monitor, MapPin, Code, User, Heart, Gauge,
      Activity, Zap, Crown, Sparkles, MessageSquareText, Stethoscope, Settings, UserCog, CreditCard
    };
    
    // Se estamos usando dados do banco, não adicionar dynamicItems (já estão no banco)
    if (hasDbData && isGestaoArea) {
      return currentMenuGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(item.area)) }))
        .filter((group) => group.items.length > 0);
    }
    
    // Fallback: Add dynamic items to their respective groups (modo hardcoded)
    const enhancedGroups = currentMenuGroups.map(group => {
      const groupDynamicItems = dynamicItems
        .filter(di => di.group_id === group.id && di.is_active)
        .map(di => ({
          title: di.title,
          url: di.url,
          icon: iconMap[di.icon] || FileText,
          area: di.area as SystemArea,
          badge: di.badge || undefined
        }));
      
      return {
        ...group,
        items: [...group.items, ...groupDynamicItems]
      };
    });
    
    // Create new groups for dynamic items that don't match existing groups
    const customGroupIds = [...new Set(dynamicItems.filter(di => 
      di.is_active && !currentMenuGroups.some(g => g.id === di.group_id)
    ).map(di => di.group_id))];
    
    const customGroups: MenuGroup[] = customGroupIds.map(gid => ({
      id: gid,
      label: gid.charAt(0).toUpperCase() + gid.slice(1).replace(/-/g, ' '),
      image: dashboardImg,
      color: 'from-primary/80',
      items: dynamicItems
        .filter(di => di.group_id === gid && di.is_active)
        .map(di => ({
          title: di.title,
          url: di.url,
          icon: iconMap[di.icon] || FileText,
          area: di.area as SystemArea,
          badge: di.badge || undefined
        }))
    }));
    
    const allGroups = [...enhancedGroups, ...customGroups];
    
    return allGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => hasAccess(item.area)) }))
      .filter((group) => group.items.length > 0);
  }, [hasAccess, dynamicItems, currentMenuGroups, hasDbData, isGestaoArea]);

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
    <aside ref={ref} data-role-based-sidebar>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <div className={`flex flex-col gap-2 ${collapsed ? "items-center" : ""}`}>
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl brand-gradient shrink-0">
                <span className="text-sm font-bold text-primary-foreground">MM</span>
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-sidebar-foreground">Curso de Química</span>
                  <span className="text-xs font-bold text-muted-foreground">Moisés Medeiros</span>
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
          {/* 🏛️ REGRA: Armazenamento/Backup é exclusivo do OWNER e SOMENTE em /gestaofc */}
          {isGestaoArea && user?.email?.toLowerCase() === OWNER_EMAIL ? (
            <StorageAndBackupWidget collapsed={collapsed} />
          ) : null}

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
    </aside>
  );
});
RoleBasedSidebar.displayName = 'RoleBasedSidebar';
