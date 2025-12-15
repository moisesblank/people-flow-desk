# 🔬 CÓDIGO FONTE COMPLETO - PLATAFORMA MOISÉS MEDEIROS
## Sistema de Gestão Empresarial v14.0 (SYNAPSE)
### Gerado em: 15/12/2024

---

# 📋 ÍNDICE

1. [Arquivos de Configuração](#1-arquivos-de-configuração)
2. [Arquivos Principais](#2-arquivos-principais)
3. [Páginas](#3-páginas)
4. [Componentes](#4-componentes)
5. [Hooks](#5-hooks)
6. [Estilos](#6-estilos)
7. [Edge Functions (Backend)](#7-edge-functions-backend)
8. [Tipos](#8-tipos)

---

# 1. ARQUIVOS DE CONFIGURAÇÃO

## 📄 index.html
```html
<!doctype html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Moisés Medeiros Curso | Transforme sua Vida com Gestão e Organização</title>
    <meta name="description" content="Aprenda gestão, organização, finanças e produtividade com o Professor Moisés Medeiros. Cursos online com certificado, metodologia comprovada e suporte completo." />
    <meta name="keywords" content="curso online, gestão, organização, finanças pessoais, produtividade, Moisés Medeiros" />
    <meta name="author" content="Moisés Medeiros" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#D4A017" />

    <!-- Open Graph -->
    <meta property="og:title" content="Moisés Medeiros Curso - Transforme sua Vida" />
    <meta property="og:description" content="Cursos online de gestão, organização e finanças com metodologia comprovada." />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Moisés Medeiros Curso" />
    <meta name="twitter:description" content="Cursos online de gestão e organização." />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
    <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />

    <link rel="canonical" href="/" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 📄 tailwind.config.ts
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
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        status: {
          active: "hsl(var(--status-active))",
          vacation: "hsl(var(--status-vacation))",
          away: "hsl(var(--status-away))",
          inactive: "hsl(var(--status-inactive))",
        },
        stats: {
          red: "hsl(var(--stats-red))",
          green: "hsl(var(--stats-green))",
          blue: "hsl(var(--stats-blue))",
          purple: "hsl(var(--stats-purple))",
          gold: "hsl(var(--stats-gold))",
          cyan: "hsl(var(--stats-cyan))",
          wine: "hsl(var(--stats-wine))",
        },
        glow: {
          red: "hsl(var(--glow-red))",
          green: "hsl(var(--glow-green))",
          blue: "hsl(var(--glow-blue))",
          purple: "hsl(var(--glow-purple))",
          gold: "hsl(var(--glow-gold))",
          cyan: "hsl(var(--glow-cyan))",
          wine: "hsl(var(--glow-wine))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        'glow': '0 0 40px hsl(var(--primary) / 0.3)',
        'glow-sm': '0 0 20px hsl(var(--primary) / 0.2)',
        'glow-lg': '0 0 60px hsl(var(--primary) / 0.4)',
        'spider': '0 0 30px hsl(345 85% 50% / 0.3), 0 0 60px hsl(220 70% 50% / 0.15)',
        'wine': '0 0 40px hsl(345 80% 40% / 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.5)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "web-swing": {
          "0%, 100%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "web-swing": "web-swing 3s ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))',
        'gradient-hero': 'linear-gradient(180deg, hsl(220 40% 6%) 0%, hsl(220 35% 12%) 100%)',
        'gradient-spider': 'linear-gradient(135deg, hsl(345 85% 45%) 0%, hsl(220 70% 45%) 100%)',
        'gradient-wine': 'linear-gradient(135deg, hsl(345 80% 40%) 0%, hsl(345 80% 30%) 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

## 📄 supabase/config.toml
```toml
project_id = "fyikfsasudgzsjmumdlw"

[functions.webhook-curso-quimica]
verify_jwt = false

[functions.ai-tutor]
verify_jwt = false

[functions.ai-assistant]
verify_jwt = false

[functions.send-report]
verify_jwt = true

[functions.backup-data]
verify_jwt = true

[functions.send-notification-email]
verify_jwt = false

[functions.youtube-api]
verify_jwt = false

[functions.google-calendar]
verify_jwt = true
```

---

# 2. ARQUIVOS PRINCIPAIS

## 📄 src/main.tsx
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

## 📄 src/App.tsx
```typescript
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

# 3. ESTRUTURA DE PÁGINAS

## Lista de todas as páginas:
- `/` - Dashboard (Central de Comando)
- `/auth` - Login/Cadastro
- `/site` - Landing Page
- `/dashboard-executivo` - Dashboard Executivo
- `/funcionarios` - Gestão de Funcionários
- `/financas-pessoais` - Finanças Pessoais
- `/financas-empresa` - Finanças da Empresa
- `/entradas` - Entradas/Receitas
- `/pagamentos` - Pagamentos
- `/contabilidade` - Contabilidade
- `/afiliados` - Gestão de Afiliados
- `/alunos` - Gestão de Alunos
- `/cursos` - Cursos/LMS
- `/simulados` - Simulados/Quizzes
- `/calendario` - Calendário
- `/marketing` - Marketing
- `/lancamento` - Lançamentos
- `/metricas` - Métricas
- `/arquivos` - Arquivos
- `/gestao-equipe` - Gestão de Equipe
- `/area-professor` - Área do Professor
- `/portal-aluno` - Portal do Aluno
- `/planejamento-aula` - Planejamento de Aulas
- `/turmas-online` - Turmas Online
- `/turmas-presenciais` - Turmas Presenciais
- `/ponto-eletronico` - Ponto Eletrônico
- `/integracoes` - Integrações
- `/relatorios` - Relatórios
- `/configuracoes` - Configurações
- `/permissoes` - Permissões
- `/gestao-site` - Gestão do Site
- `/guia` - Guia do Sistema
- `/monitoramento` - Monitoramento (OWNER)
- `/pessoal` - Área Pessoal
- `/site-programador` - Site Programador

---

# 4. HOOKS PRINCIPAIS

## 📄 src/hooks/useAuth.tsx
```typescript
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

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

---

# 5. COMPONENTES DE LAYOUT

## 📄 src/components/layout/AppSidebar.tsx
```typescript
// SYNAPSE v14.0 - SIDEBAR NAVIGATION
// Sistema de Navegação com suporte a Owner Mode

import {
  LayoutDashboard, Users, Wallet, Building2, TrendingUp, Handshake, 
  GraduationCap, FileText, LogOut, Settings, UserCog, BookOpen, Calendar,
  CreditCard, Calculator, Globe, ClipboardCheck, UserCheck, Brain, Link2,
  Shield, Trophy, PlayCircle, Megaphone, Rocket, BarChart3, FolderOpen,
  PenTool, Monitor, MapPin, Code, User, Clock, Gauge, Activity, Zap
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
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

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header, Content, Footer... */}
      {/* Ver arquivo completo no projeto */}
    </Sidebar>
  );
}
```

---

# 6. ESTILOS (CSS)

## 📄 src/index.css (Principais variáveis)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* MOISÉS MEDEIROS CURSO - Design System v7.0 */
/* Spider-Man Theme: Vermelho Vinho + Azul + Preto */

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
    
    /* Stats colors - Spider-Man Palette */
    --stats-red: 345 80% 40%;
    --stats-green: 142 71% 45%;
    --stats-blue: 220 70% 50%;
    --stats-purple: 270 80% 55%;
    --stats-gold: 43 74% 49%;
    --stats-wine: 345 80% 35%;
    
    --radius: 0.75rem;
  }

  .dark {
    /* Background & Surfaces - Dark Spider-Man */
    --background: 220 40% 6%;
    --foreground: 0 0% 98%;
    --card: 220 35% 10%;
    --card-foreground: 0 0% 98%;
    --muted: 220 30% 15%;
    --muted-foreground: 220 14% 65%;
    --border: 220 30% 18%;
    
    /* Primary adjusted for dark */
    --primary: 345 85% 50%;
    --primary-hover: 345 85% 55%;
  }
}

/* Classes Utilitárias */
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-hover)) 100%);
}

.brand-gradient {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
}

.shadow-glow {
  box-shadow: 0 0 40px hsl(var(--primary) / 0.3);
}

.animate-fade-in { animation: fade-in 0.5s ease-out; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
```

---

# 7. EDGE FUNCTIONS (BACKEND)

## 📄 supabase/functions/ai-assistant/index.ts
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
    const { message, context } = await req.json();
    
    // Processamento da IA
    const response = {
      success: true,
      message: `Assistente processou: ${message}`,
      context: context,
    };

    return new Response(JSON.stringify(response), {
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

## 📄 supabase/functions/send-notification-email/index.ts
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
    const { to, subject, body } = await req.json();
    
    console.log(`Enviando email para: ${to}`);
    console.log(`Assunto: ${subject}`);
    
    return new Response(JSON.stringify({ success: true }), {
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

# 8. TIPOS

## 📄 src/types/employee.ts
```typescript
export type EmployeeStatus = "ativo" | "ferias" | "afastado" | "inativo";

export type Sector = 
  | "Coordenação" 
  | "Suporte" 
  | "Monitoria" 
  | "Afiliados" 
  | "Marketing" 
  | "Administrativo";

export interface Employee {
  id: number;
  nome: string;
  funcao: string;
  setor: Sector;
  email: string;
  salario: number | null;
  dataAdmissao: string;
  status: EmployeeStatus;
}

export interface EmployeeFormData {
  nome: string;
  funcao: string;
  setor: Sector;
  email: string;
  salario: string;
  dataAdmissao: Date | undefined;
  status: EmployeeStatus;
}

export const SECTORS: Sector[] = [
  "Coordenação",
  "Suporte",
  "Monitoria",
  "Afiliados",
  "Marketing",
  "Administrativo",
];

export const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "ferias", label: "Férias" },
  { value: "afastado", label: "Afastado" },
  { value: "inativo", label: "Inativo" },
];
```

---

# 📊 RESUMO DO PROJETO

## Tecnologias Utilizadas:
- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth
- **Estado**: React Query + Context API
- **Animações**: Framer Motion

## Estrutura de Pastas:
```
src/
├── assets/           # Imagens e recursos
├── components/       # Componentes React
│   ├── ui/          # Componentes shadcn/ui
│   ├── layout/      # Layout (Sidebar, Header)
│   ├── dashboard/   # Widgets do dashboard
│   ├── editor/      # God Mode (edição inline)
│   ├── lms/         # Sistema de cursos
│   └── ...
├── hooks/           # Custom hooks
├── pages/           # Páginas da aplicação
├── contexts/        # React Contexts
├── lib/             # Utilitários
├── types/           # TypeScript types
└── integrations/    # Integrações (Supabase)

supabase/
├── functions/       # Edge Functions
└── config.toml      # Configuração
```

## Principais Funcionalidades:
1. ✅ Autenticação completa (login/registro/recuperação)
2. ✅ Sistema de permissões (Owner/Admin/Employee)
3. ✅ Dashboard executivo com KPIs
4. ✅ Gestão financeira (pessoal e empresa)
5. ✅ LMS completo (cursos/aulas/quizzes)
6. ✅ Gestão de funcionários
7. ✅ Ponto eletrônico
8. ✅ Calendário de tarefas
9. ✅ Monitoramento em tempo real (Owner)
10. ✅ God Mode (edição inline do site)
11. ✅ Integrações (Hotmart, Google Calendar)
12. ✅ Sistema de notificações

---

**📝 NOTA**: Este arquivo contém uma versão resumida do código-fonte. 
Para o código completo, conecte seu projeto ao GitHub através de Settings → GitHub.

**🔗 Projeto ID Supabase**: fyikfsasudgzsjmumdlw

---
*Gerado automaticamente pela plataforma Lovable*
*Data: 15/12/2024*
