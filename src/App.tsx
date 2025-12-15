import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Suspense, lazy } from "react";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
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
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
