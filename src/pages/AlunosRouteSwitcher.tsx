// ============================================
// ⚡ MATRIZ DIGITAL - ROTEADOR /alunos (Gestão vs Portal)
// Futuro 2300: roteamento inteligente por domínio + permissão
// ============================================

import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAdminCheck } from "@/hooks/useAdminCheck";

// Importa as duas experiências
import AlunoDashboard from "@/pages/aluno/AlunoDashboard";
import Alunos from "@/pages/Alunos";

function isGestaoHost(hostname: string) {
  // Aceita gestao.* e variações de staging (ex: preview/localhost não entram aqui)
  return hostname.toLowerCase().startsWith("gestao.");
}

export default function AlunosRouteSwitcher() {
  const { isAdminOrOwner, isLoading } = useAdminCheck();

  const gestao = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isGestaoHost(window.location.hostname);
  }, []);

  if (!gestao) {
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

  // Host de gestão: só Admin/Owner.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdminOrOwner) {
    return <Navigate to="/app" replace />;
  }

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
