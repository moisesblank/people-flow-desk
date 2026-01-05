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
import { Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useRolePermissions, isGestaoHost, isProHost, isPublicHost } from "@/hooks/useRolePermissions";

// Importa as duas experiências
import AlunoDashboard from "@/pages/aluno/AlunoDashboard";
import Alunos from "@/pages/Alunos";

export default function AlunosRouteSwitcher() {
  const location = useLocation();
  const { isAdminOrOwner, isLoading: adminLoading } = useAdminCheck();
  const { role, isLoading: roleLoading, isBeta, isOwner } = useRolePermissions();

  const isLoading = adminLoading || roleLoading;

  // 🔎 DEBUG temporário (P0): tornar visível o estado real quando /alunos fica “tela preta”
  // Ativa com ?debugAlunos=1
  const debugAlunos = new URLSearchParams(location.search).get('debugAlunos') === '1';

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

  const DebugPanel = debugAlunos ? (
    <div className="fixed left-3 top-3 z-[9999] max-w-[92vw] rounded-lg border border-border bg-card/95 backdrop-blur p-3 text-xs text-foreground shadow-lg">
      <div className="font-semibold">DEBUG /alunos</div>
      <pre className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">
        {JSON.stringify(
          {
            path: location.pathname,
            search: location.search,
            adminLoading,
            roleLoading,
            role,
            isBeta,
            isOwner,
            isAdminOrOwner,
            domain: { isGestao, isPro, isPublic },
          },
          null,
          2
        )}
      </pre>
    </div>
  ) : null;

  // Loading state
  if (isLoading) {
    return (
      <>
        {DebugPanel}
        <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  // ============================================
  // HIERARQUIA DE VISUALIZAÇÃO (LEI IV - SOBERANIA DO ARQUITETO):
  // 1. OWNER → Acesso total a qualquer domínio
  //    - gestao.* → Gestão de Alunos
  //    - pro.* ou outros → Portal do Aluno (para visualizar experiência)
  // 2. BETA (aluno pagante) → SEMPRE vê Portal do Aluno
  // 3. FUNCIONÁRIOS no domínio gestao.* → Gestão de Alunos
  // 4. Outros roles → redirecionados para /dashboard ou /app
  // ============================================

  // OWNER - ACESSO SUPREMO (LEI IV)
  if (isOwner) {
    // Owner no domínio gestão → vê Gestão de Alunos
    if (isGestao) {
      return (
        <>
          {DebugPanel}
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
    // Owner em pro.* ou outros domínios → vê Portal do Aluno (para testar experiência)
    return (
      <>
        {DebugPanel}
        <Helmet>
          <title>Dashboard do Aluno | Química ENEM</title>
          <meta
            name="description"
            content="Sua central de estudos com videoaulas, questões, simulados e progresso gamificado."
          />
          <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/alunos` : "/alunos"} />
        </Helmet>
        <AlunoDashboard />
      </>
    );
  }

// BETA = Aluno pagante → SEMPRE portal do aluno (pro.moisesmedeiros.com.br/alunos)
  if (isBeta) {
    return (
      <>
        {DebugPanel}
        <Helmet>
          <title>Dashboard do Aluno | Química ENEM</title>
          <meta
            name="description"
            content="Sua central de estudos com videoaulas, questões, simulados e progresso gamificado."
          />
          <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/alunos` : "/alunos"} />
        </Helmet>
        <AlunoDashboard />
      </>
    );
  }

  // ============================================
  // 🚫 ALUNO_GRATUITO = Acesso limitado → Redireciona para /comunidade
  // CONSTITUIÇÃO SYNAPSE Ω v10.x — PARTE 3
  // Role lida da tabela user_roles (não metadata)
  // ============================================
  if (role === "aluno_gratuito") {
    return (
      <>
        {DebugPanel}
        <Navigate to="/comunidade" replace />
      </>
    );
  }

  // ADMIN/FUNCIONÁRIOS no domínio de gestão → Gestão de Alunos
  if (isAdminOrOwner && isGestao) {
    return (
      <>
        {DebugPanel}
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

  // ADMIN fora do domínio gestão (ex: pro.*) → pode ver portal do aluno para testes
  if (isAdminOrOwner) {
    return (
      <>
        {DebugPanel}
        <Helmet>
          <title>Dashboard do Aluno | Química ENEM</title>
          <meta
            name="description"
            content="Dashboard do aluno com progresso, metas e próximos passos no curso de Química ENEM."
          />
          <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/alunos` : "/alunos"} />
        </Helmet>
        <AlunoDashboard />
      </>
    );
  }

  // Outros roles sem permissão → redireciona conforme MATRIZ SUPREMA v2.0.0
  // GESTAO roles → /gestaofc, outros → /comunidade
  return (
    <>
      {DebugPanel}
      <Navigate to="/comunidade" replace />
    </>
  );
}
