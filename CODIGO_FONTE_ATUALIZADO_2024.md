# 📚 CÓDIGO FONTE COMPLETO - SISTEMA MOISÉS MEDEIROS
## Versão 14.0 - SYNAPSE | Atualizado: 15/12/2024
## Spider-Man Theme: Vermelho Vinho + Azul + Preto

---

# 📋 ÍNDICE

1. [Configurações Principais](#configurações-principais)
2. [App Principal](#app-principal)
3. [Sistema de Autenticação](#sistema-de-autenticação)
4. [Hooks Principais](#hooks-principais)
5. [Componentes de Layout](#componentes-de-layout)
6. [Páginas](#páginas)
7. [Design System (CSS)](#design-system-css)
8. [Tailwind Config](#tailwind-config)
9. [Edge Functions](#edge-functions)
10. [Tipos TypeScript](#tipos-typescript)

---

# 1. CONFIGURAÇÕES PRINCIPAIS

## index.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sistema de Gestão Empresarial - Curso Moisés Medeiros" />
    <meta name="theme-color" content="#8B1538" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cabinet+Grotesk:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <title>Curso Moisés Medeiros | Sistema de Gestão</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## supabase/config.toml

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://lovable.dev"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false
minimum_password_length = 6

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

---

# 2. APP PRINCIPAL

## src/main.tsx

```tsx
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
```

## src/App.tsx

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GodModeProvider } from "@/contexts/GodModeContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { GodModePanel } from "@/components/editor/GodModePanel";
import { SessionTracker } from "@/components/SessionTracker";
import { KeyboardShortcutsOverlay } from "@/components/onboarding/KeyboardShortcutsOverlay";
import { Suspense, lazy, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Funcionarios = lazy(() => import("./pages/Funcionarios"));
const FinancasPessoais = lazy(() => import("./pages/FinancasPessoais"));
const FinancasEmpresa = lazy(() => import("./pages/FinancasEmpresa"));
const Entradas = lazy(() => import("./pages/Entradas"));
const Afiliados = lazy(() => import("./pages/Afiliados"));
const Alunos = lazy(() => import("./pages/Alunos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const GestaoEquipe = lazy(() => import("./pages/GestaoEquipe"));
const Guia = lazy(() => import("./pages/Guia"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const Contabilidade = lazy(() => import("./pages/Contabilidade"));
const GestaoSite = lazy(() => import("./pages/GestaoSite"));
const AreaProfessor = lazy(() => import("./pages/AreaProfessor"));
const PortalAluno = lazy(() => import("./pages/PortalAluno"));
const Integracoes = lazy(() => import("./pages/Integracoes"));
const Permissoes = lazy(() => import("./pages/Permissoes"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const Cursos = lazy(() => import("./pages/Cursos"));
const CursoDetalhe = lazy(() => import("./pages/CursoDetalhe"));
const Aula = lazy(() => import("./pages/Aula"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Lancamento = lazy(() => import("./pages/Lancamento"));
const Metricas = lazy(() => import("./pages/Metricas"));
const Arquivos = lazy(() => import("./pages/Arquivos"));
const PlanejamentoAula = lazy(() => import("./pages/PlanejamentoAula"));
const TurmasOnline = lazy(() => import("./pages/TurmasOnline"));
const TurmasPresenciais = lazy(() => import("./pages/TurmasPresenciais"));
const SiteProgramador = lazy(() => import("./pages/SiteProgramador"));
const Pessoal = lazy(() => import("./pages/Pessoal"));
const PontoEletronico = lazy(() => import("./pages/PontoEletronico"));
const DashboardExecutivo = lazy(() => import("./pages/DashboardExecutivo"));
const Monitoramento = lazy(() => import("./pages/Monitoramento"));
const Simulados = lazy(() => import("./pages/Simulados"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Protected route wrapper component
const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

// Global keyboard shortcuts overlay hook
function useGlobalShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

// App wrapper with shortcuts overlay
function AppContent() {
  const { isOpen, setIsOpen } = useGlobalShortcutsOverlay();

  return (
    <>
      <SessionTracker />
      <GodModePanel />
      <KeyboardShortcutsOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/site" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />
          
          {/* Protected routes with layout */}
          <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/funcionarios" element={<ProtectedPage><Funcionarios /></ProtectedPage>} />
          <Route path="/financas-pessoais" element={<ProtectedPage><FinancasPessoais /></ProtectedPage>} />
          <Route path="/financas-empresa" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/entradas" element={<ProtectedPage><Entradas /></ProtectedPage>} />
          <Route path="/afiliados" element={<ProtectedPage><Afiliados /></ProtectedPage>} />
          <Route path="/alunos" element={<ProtectedPage><Alunos /></ProtectedPage>} />
          <Route path="/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
          <Route path="/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
          <Route path="/gestao-equipe" element={<ProtectedPage><GestaoEquipe /></ProtectedPage>} />
          <Route path="/guia" element={<ProtectedPage><Guia /></ProtectedPage>} />
          <Route path="/calendario" element={<ProtectedPage><Calendario /></ProtectedPage>} />
          <Route path="/pagamentos" element={<ProtectedPage><Pagamentos /></ProtectedPage>} />
          <Route path="/contabilidade" element={<ProtectedPage><Contabilidade /></ProtectedPage>} />
          <Route path="/gestao-site" element={<ProtectedPage><GestaoSite /></ProtectedPage>} />
          <Route path="/area-professor" element={<ProtectedPage><AreaProfessor /></ProtectedPage>} />
          <Route path="/portal-aluno" element={<ProtectedPage><PortalAluno /></ProtectedPage>} />
          <Route path="/integracoes" element={<ProtectedPage><Integracoes /></ProtectedPage>} />
          <Route path="/permissoes" element={<ProtectedPage><Permissoes /></ProtectedPage>} />
          <Route path="/cursos" element={<ProtectedPage><Cursos /></ProtectedPage>} />
          <Route path="/cursos/:courseId" element={<ProtectedPage><CursoDetalhe /></ProtectedPage>} />
          <Route path="/cursos/:courseId/aula/:lessonId" element={<ProtectedPage><Aula /></ProtectedPage>} />
          <Route path="/marketing" element={<ProtectedPage><Marketing /></ProtectedPage>} />
          <Route path="/lancamento" element={<ProtectedPage><Lancamento /></ProtectedPage>} />
          <Route path="/metricas" element={<ProtectedPage><Metricas /></ProtectedPage>} />
          <Route path="/arquivos" element={<ProtectedPage><Arquivos /></ProtectedPage>} />
          <Route path="/planejamento-aula" element={<ProtectedPage><PlanejamentoAula /></ProtectedPage>} />
          <Route path="/turmas-online" element={<ProtectedPage><TurmasOnline /></ProtectedPage>} />
          <Route path="/turmas-presenciais" element={<ProtectedPage><TurmasPresenciais /></ProtectedPage>} />
          <Route path="/site-programador" element={<ProtectedPage><SiteProgramador /></ProtectedPage>} />
          <Route path="/pessoal" element={<ProtectedPage><Pessoal /></ProtectedPage>} />
          <Route path="/ponto-eletronico" element={<ProtectedPage><PontoEletronico /></ProtectedPage>} />
          <Route path="/dashboard-executivo" element={<ProtectedPage><DashboardExecutivo /></ProtectedPage>} />
          <Route path="/monitoramento" element={<ProtectedPage><Monitoramento /></ProtectedPage>} />
          <Route path="/simulados" element={<ProtectedPage><Simulados /></ProtectedPage>} />
          
          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GodModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </GodModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

---

# 3. SISTEMA DE AUTENTICAÇÃO

## src/hooks/useAuth.tsx

```tsx
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "owner" | "admin" | "employee";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching role:", error);
        return;
      }
      
      setRole(data?.role as AppRole ?? null);
    } catch (err) {
      console.error("Error fetching role:", err);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome },
      },
    });
    return { error };
  };

  const signInWithProvider = async (provider: Provider) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      isLoading, 
      signIn, 
      signUp, 
      signInWithProvider,
      signOut,
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

## src/hooks/useAdminCheck.tsx

```tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "owner" | "admin" | "employee";

interface AdminCheckResult {
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrOwner: boolean;
  isEmployee: boolean;
  isGodMode: boolean;
  canEdit: boolean;
  role: AppRole | null;
  isLoading: boolean;
}

const OWNER_EMAIL = "moisesblank@gmail.com";

export function useAdminCheck(): AdminCheckResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        } else {
          setRole(data?.role as AppRole ?? null);
        }
      } catch (err) {
        console.error("Error:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isOwner = role === "owner" || user?.email === OWNER_EMAIL;
  const isAdmin = role === "admin";
  const isAdminOrOwner = isOwner || isAdmin;
  const isEmployee = role === "employee";
  const isGodMode = isOwner;
  const canEdit = isAdminOrOwner;

  return {
    isOwner,
    isAdmin,
    isAdminOrOwner,
    isEmployee,
    isGodMode,
    canEdit,
    role,
    isLoading,
  };
}
```

---

# 4. COMPONENTES DE LAYOUT

## src/components/layout/AppSidebar.tsx

```tsx
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
```

## src/components/layout/ProtectedRoute.tsx

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

---

# 5. DESIGN SYSTEM (CSS)

## src/index.css (Principais variáveis)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   MOISÉS MEDEIROS CURSO - Design System v7.0
   Spider-Man Theme: Vermelho Vinho + Azul + Preto
   Premium Dark Theme
   ============================================ */

@layer base {
  :root {
    /* Cores Principais - SPIDER-MAN THEME */
    --primary: 345 80% 35%;              /* Vermelho Vinho #8B1538 */
    --primary-foreground: 0 0% 100%;
    --primary-hover: 345 80% 30%;
    --primary-glow: 345 80% 45%;
    
    --secondary: 220 60% 25%;            /* Azul Spider-Man */
    --secondary-foreground: 0 0% 98%;
    
    --accent: 345 90% 40%;               /* Vermelho Vibrante */
    --accent-foreground: 0 0% 100%;
    
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    --destructive: 0 84% 60%;
    --info: 199 89% 48%;
    
    /* Background & Surfaces - Light */
    --background: 0 0% 100%;
    --foreground: 220 40% 10%;
    
    --card: 0 0% 100%;
    --card-foreground: 220 40% 10%;
    
    --muted: 220 14% 96%;
    --muted-foreground: 220 14% 46%;
    
    --border: 220 14% 90%;
    --input: 220 14% 90%;
    --ring: 345 80% 35%;
    
    /* Radius */
    --radius: 0.75rem;
  }

  .dark {
    /* Background & Surfaces - Dark Spider-Man */
    --background: 220 40% 6%;            /* Preto Azulado */
    --foreground: 0 0% 98%;
    
    --card: 220 35% 10%;
    --card-foreground: 0 0% 98%;
    
    --muted: 220 30% 15%;
    --muted-foreground: 220 14% 65%;
    
    --border: 220 30% 18%;
    
    /* Primary adjusted for dark */
    --primary: 345 85% 50%;
    --primary-hover: 345 85% 55%;
    --primary-glow: 345 85% 60%;
    
    /* Secondary - Azul Spider-Man */
    --secondary: 220 60% 35%;
  }
}
```

---

# 6. TAILWIND CONFIG

## tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Satoshi', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow': '0 0 40px hsl(var(--primary) / 0.3)',
        'spider': '0 0 30px hsl(345 85% 50% / 0.3), 0 0 60px hsl(220 70% 50% / 0.15)',
        'wine': '0 0 40px hsl(345 80% 40% / 0.3)',
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.5)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

# 7. EDGE FUNCTIONS

## supabase/functions/ai-assistant/index.ts

```typescript
import "jsr:@anthropic-ai/sdk";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, systemPrompt } = await req.json();
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: systemPrompt || 'Você é um assistente útil.',
        messages: [
          { role: 'user', content: message }
        ],
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({ 
      response: data.content?.[0]?.text || 'Sem resposta' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## supabase/functions/send-notification-email/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, type } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Moisés Medeiros <noreply@moisesmedeiros.com>',
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8B1538 0%, #1E3A5F 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Curso Moisés Medeiros</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              ${body}
            </div>
            <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
              © ${new Date().getFullYear()} Moisés Medeiros - Todos os direitos reservados
            </div>
          </div>
        `,
      }),
    });

    const result = await response.json();
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

# 8. TIPOS TYPESCRIPT

## src/types/employee.ts

```typescript
export type EmployeeStatus = "ativo" | "inativo" | "ferias" | "afastado";

export type SectorType = 
  | "administrativo"
  | "comercial" 
  | "producao"
  | "marketing"
  | "financeiro"
  | "rh"
  | "ti"
  | "operacional"
  | "atendimento"
  | "educacional";

export interface Employee {
  id: number;
  nome: string;
  funcao: string;
  email?: string | null;
  telefone?: string | null;
  setor?: SectorType | null;
  status?: EmployeeStatus | null;
  data_admissao?: string | null;
  horario_trabalho?: string | null;
  responsabilidades?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  user_id?: string | null;
}

export interface EmployeeCompensation {
  employee_id: number;
  salario: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithCompensation extends Employee {
  compensation?: EmployeeCompensation | null;
}
```

---

# 9. LISTA COMPLETA DE PÁGINAS

## Todas as páginas do sistema:

1. **Auth.tsx** - Página de login/cadastro
2. **Dashboard.tsx** - Central de comando principal
3. **DashboardExecutivo.tsx** - Dashboard executivo (Owner)
4. **Funcionarios.tsx** - Gestão de funcionários
5. **FinancasPessoais.tsx** - Finanças pessoais
6. **FinancasEmpresa.tsx** - Finanças da empresa
7. **Entradas.tsx** - Receitas
8. **Pagamentos.tsx** - Controle de pagamentos
9. **Contabilidade.tsx** - Contabilidade
10. **Afiliados.tsx** - Gestão de afiliados
11. **Alunos.tsx** - Gestão de alunos
12. **Cursos.tsx** - Lista de cursos
13. **CursoDetalhe.tsx** - Detalhes do curso
14. **Aula.tsx** - Player de aula
15. **Simulados.tsx** - Quizzes e simulados
16. **PortalAluno.tsx** - Portal do aluno
17. **Marketing.tsx** - Marketing
18. **Lancamento.tsx** - Lançamentos
19. **Metricas.tsx** - Métricas de marketing
20. **Calendario.tsx** - Calendário de tarefas
21. **GestaoEquipe.tsx** - Gestão de equipe
22. **AreaProfessor.tsx** - Área do professor
23. **PlanejamentoAula.tsx** - Planejamento de aulas
24. **TurmasOnline.tsx** - Turmas online
25. **TurmasPresenciais.tsx** - Turmas presenciais
26. **Arquivos.tsx** - Arquivos importantes
27. **Integracoes.tsx** - Integrações (Hotmart, etc)
28. **GestaoSite.tsx** - Gestão do site
29. **Relatorios.tsx** - Relatórios
30. **Configuracoes.tsx** - Configurações
31. **Permissoes.tsx** - Gestão de permissões
32. **PontoEletronico.tsx** - Ponto eletrônico
33. **Pessoal.tsx** - Vida pessoal
34. **SiteProgramador.tsx** - Área do programador
35. **Monitoramento.tsx** - Monitoramento (MODO DEUS)
36. **Guia.tsx** - Guia do sistema
37. **LandingPage.tsx** - Página pública
38. **TermosDeUso.tsx** - Termos de uso
39. **PoliticaPrivacidade.tsx** - Política de privacidade
40. **NotFound.tsx** - Página 404

---

# 10. INFORMAÇÕES DO PROJETO

## URLs Importantes

- **Preview**: https://lovable.dev/projects/[PROJECT_ID]
- **GitHub**: Conectado via Settings > GitHub

## Tecnologias Utilizadas

- **Frontend**: React 18.3 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/UI + Framer Motion
- **Backend**: Supabase (Lovable Cloud)
- **Auth**: Supabase Auth com RLS
- **Estado**: TanStack React Query
- **Roteamento**: React Router DOM

## Owner do Sistema

- **Email**: moisesblank@gmail.com
- **Role**: owner (MODO DEUS ativado)

---

## ✅ SEGURANÇA ATUALIZADA

As políticas RLS foram corrigidas para:
- **employees**: Apenas admin/owner podem ver todos, funcionários veem apenas seus próprios dados
- **affiliates**: Apenas admin/owner podem gerenciar, afiliados veem apenas seus próprios dados
- Todas as tabelas sensíveis têm RLS ativo com políticas restritivas

---

**Documento gerado automaticamente pelo Sistema Moisés Medeiros v14.0**
**Data: 15/12/2024**
