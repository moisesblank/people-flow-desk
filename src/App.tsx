import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GodModeProvider } from "@/contexts/GodModeContext";
import { RoleProtectedRoute } from "@/components/layout/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { GodModePanel } from "@/components/editor/GodModePanel";
import { VisualEditMode } from "@/components/editor/VisualEditMode";
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
const DashboardExecutivo = lazy(() => import("./pages/DashboardExecutivo"));
const Monitoramento = lazy(() => import("./pages/Monitoramento"));
const Simulados = lazy(() => import("./pages/Simulados"));
const Laboratorio = lazy(() => import("./pages/Laboratorio"));
const VidaPessoal = lazy(() => import("./pages/VidaPessoal"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Protected route wrapper component with role-based access
const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </RoleProtectedRoute>
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
      <VisualEditMode />
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
          
          <Route path="/dashboard-executivo" element={<ProtectedPage><DashboardExecutivo /></ProtectedPage>} />
          <Route path="/monitoramento" element={<ProtectedPage><Monitoramento /></ProtectedPage>} />
          <Route path="/simulados" element={<ProtectedPage><Simulados /></ProtectedPage>} />
          <Route path="/laboratorio" element={<ProtectedPage><Laboratorio /></ProtectedPage>} />
          <Route path="/vida-pessoal" element={<ProtectedPage><VidaPessoal /></ProtectedPage>} />
          <Route path="/tarefas" element={<ProtectedPage><Tarefas /></ProtectedPage>} />
          
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
