// ============================================
// ⚡ MATRIZ DIGITAL v11.0 - ROTEADOR /alunos
// ARQUITETURA MONO-DOMÍNIO:
// - pro.moisesmedeiros.com.br/gestaofc → Funcionários (Gestão)
// - pro.moisesmedeiros.com.br/alunos → Alunos Beta (Central)
// - pro.moisesmedeiros.com.br/ → Área pública
// HIERARQUIA (MONO-DOMÍNIO v2.0):
//   Owner (role='owner' do banco) = Acesso total
//   Beta = Aluno Pagante → vê Portal do Aluno
//   Staff = Funcionários → vê Gestão de Alunos (/gestaofc)
// ============================================

import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useRolePermissions, isGestaoHost, isProHost, isPublicHost } from "@/hooks/useRolePermissions";

// Importa apenas Alunos (gestão) - AlunoDashboard é acessado via redirect
import Alunos from "@/pages/Alunos";

export default function AlunosRouteSwitcher() {
  const { isAdminOrOwner, isLoading: adminLoading } = useAdminCheck();
  const { role, isLoading: roleLoading, isBeta, isOwner } = useRolePermissions();

  const isLoading = adminLoading || roleLoading;

  // 🔴 P0 DEBUG: Log para diagnóstico de tela preta
  console.log("[AlunosRouteSwitcher] 🚀 RENDER", {
    adminLoading,
    roleLoading,
    isLoading,
    role,
    isBeta,
    isOwner,
    isAdminOrOwner,
    timestamp: new Date().toISOString(),
  });

  // Detectar domínio atual usando funções centralizadas
  const { isGestao, isPro, isPublic } = useMemo(() => {
    if (typeof window === "undefined") {
      return { isGestao: false, isPro: false, isPublic: false };
    }
    const hostname = window.location.hostname;
    return {
      isGestao: isGestaoHost(hostname),
      isPro: isProHost(hostname),
      isPublic: isPublicHost(hostname),
    };
  }, []);

  // Loading state - P0: com timeout de segurança
  if (isLoading) {
    console.warn("[AlunosRouteSwitcher] ⏳ Aguardando loading...", { adminLoading, roleLoading });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // HIERARQUIA DE VISUALIZAÇÃO (LEI IV - SOBERANIA DO ARQUITETO):
  // 1. OWNER → Acesso total a qualquer domínio
  //    - gestao.* → Gestão de Alunos
  //    - pro.* ou outros → REDIRECT para /alunos/dashboard
  // 2. BETA (aluno pagante) → REDIRECT para /alunos/dashboard
  // 3. FUNCIONÁRIOS no domínio gestao.* → Gestão de Alunos
  // 4. Outros roles → redirecionados para /comunidade
  // ============================================

  // OWNER - ACESSO SUPREMO (LEI IV)
  // 🔐 P0 FIX: Owner NUNCA é forçado para /alunos/dashboard
  // Owner pode navegar livremente para /gestaofc via URL direta
  if (isOwner) {
    // Em ambiente mono-domínio (pro.* ou preview), Owner vê a lista de alunos
    // Isso permite que o Owner acesse /alunos sem ser redirecionado
    console.log("[AlunosRouteSwitcher] 👑 Owner acessando /alunos → renderiza Gestão de Alunos");
    return (
      <>
        <Helmet>
          <title>Gestão de Alunos | Matriz Digital</title>
          <meta
            name="description"
            content="Gestão de alunos: lista, filtros, status, auditoria e sincronização inteligente."
          />
          <link
            rel="canonical"
            href={typeof window !== "undefined" ? `${window.location.origin}/alunos` : "/alunos"}
          />
        </Helmet>
        <Alunos />
      </>
    );
  }

  // BETA = Aluno pagante → REDIRECT para /alunos/dashboard
  if (isBeta) {
    console.log("[AlunosRouteSwitcher] ✅ Beta → Redirect para /alunos/dashboard");
    return <Navigate to="/alunos/dashboard" replace />;
  }

  // ============================================
  // 🚫 ALUNO_GRATUITO = Acesso limitado → Redireciona para /comunidade
  // CONSTITUIÇÃO SYNAPSE Ω v10.x — PARTE 3
  // Role lida da tabela user_roles (não metadata)
  // ============================================
  if (role === "aluno_gratuito") {
    return <Navigate to="/comunidade" replace />;
  }

  // ADMIN/FUNCIONÁRIOS no domínio de gestão → Gestão de Alunos
  if (isAdminOrOwner && isGestao) {
    return (
      <>
        <Helmet>
          <title>Gestão de Alunos | Matriz Digital</title>
          <meta
            name="description"
            content="Gestão de alunos: lista, filtros, status, auditoria e sincronização inteligente."
          />
          <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/alunos` : "/alunos"} />
        </Helmet>
        <Alunos />
      </>
    );
  }

  // ADMIN fora do domínio gestão (ex: pro.*) → REDIRECT para /alunos/dashboard
  if (isAdminOrOwner) {
    console.log("[AlunosRouteSwitcher] ✅ Admin em pro.* → Redirect para /alunos/dashboard");
    return <Navigate to="/alunos/dashboard" replace />;
  }

  // Outros roles sem permissão → redireciona para /comunidade
  return <Navigate to="/comunidade" replace />;
}
