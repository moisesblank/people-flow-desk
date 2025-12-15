import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Funcionarios from "./pages/Funcionarios";
import FinancasPessoais from "./pages/FinancasPessoais";
import FinancasEmpresa from "./pages/FinancasEmpresa";
import Entradas from "./pages/Entradas";
import Afiliados from "./pages/Afiliados";
import Alunos from "./pages/Alunos";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import GestaoEquipe from "./pages/GestaoEquipe";
import Guia from "./pages/Guia";
import Calendario from "./pages/Calendario";
import Pagamentos from "./pages/Pagamentos";
import Contabilidade from "./pages/Contabilidade";
import GestaoSite from "./pages/GestaoSite";
import AreaProfessor from "./pages/AreaProfessor";
import PortalAluno from "./pages/PortalAluno";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes with layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/funcionarios"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Funcionarios />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/financas-pessoais"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FinancasPessoais />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/financas-empresa"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FinancasEmpresa />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/entradas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Entradas />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/afiliados"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Afiliados />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alunos"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Alunos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Relatorios />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Configuracoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestao-equipe"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GestaoEquipe />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/guia"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Guia />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/calendario" element={<ProtectedRoute><AppLayout><Calendario /></AppLayout></ProtectedRoute>} />
            <Route path="/pagamentos" element={<ProtectedRoute><AppLayout><Pagamentos /></AppLayout></ProtectedRoute>} />
            <Route path="/contabilidade" element={<ProtectedRoute><AppLayout><Contabilidade /></AppLayout></ProtectedRoute>} />
            <Route path="/gestao-site" element={<ProtectedRoute><AppLayout><GestaoSite /></AppLayout></ProtectedRoute>} />
            <Route path="/area-professor" element={<ProtectedRoute><AppLayout><AreaProfessor /></AppLayout></ProtectedRoute>} />
            <Route path="/portal-aluno" element={<ProtectedRoute><AppLayout><PortalAluno /></AppLayout></ProtectedRoute>} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
