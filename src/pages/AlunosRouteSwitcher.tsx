// ============================================
// ⚡ MATRIZ DIGITAL - ROTEADOR /alunos (Gestão vs Portal)
// Futuro 2300: roteamento inteligente por role + domínio
// HIERARQUIA: Beta = Aluno Pagante → vê Portal do Aluno
//             Owner/Admin → vê Gestão de Alunos
// ============================================

import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useRolePermissions } from "@/hooks/useRolePermissions";

// Importa as duas experiências
import AlunoDashboard from "@/pages/aluno/AlunoDashboard";
import Alunos from "@/pages/Alunos";

function isGestaoHost(hostname: string) {
  return hostname.toLowerCase().startsWith("gestao.");
}

export default function AlunosRouteSwitcher() {
  const { isAdminOrOwner, isLoading: adminLoading } = useAdminCheck();
  const { role, isLoading: roleLoading, isBeta } = useRolePermissions();

  const isLoading = adminLoading || roleLoading;

  const gestao = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isGestaoHost(window.location.hostname);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================
  // HIERARQUIA DE VISUALIZAÇÃO:
  // 1. BETA (aluno pagante) → SEMPRE vê Portal do Aluno
  // 2. ADMIN/OWNER no domínio gestao.* → vê Gestão de Alunos
  // 3. ADMIN/OWNER em outros domínios → vê Portal do Aluno
  // 4. Outros roles → redirecionados para /app
  // ============================================

  // BETA = Aluno pagante → sempre portal do aluno
  if (isBeta) {
    return (
      <>
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

  // ADMIN/OWNER no domínio de gestão → Gestão de Alunos
  if (isAdminOrOwner && gestao) {
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

  // ADMIN/OWNER fora do domínio gestão → pode ver portal do aluno também
  if (isAdminOrOwner) {
    return (
      <>
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

  // Outros roles sem permissão → redireciona para /app
  return <Navigate to="/app" replace />;
}
