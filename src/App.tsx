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
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
