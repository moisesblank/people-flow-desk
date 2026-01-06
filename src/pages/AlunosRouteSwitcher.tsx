// ============================================
// ⚡ MATRIZ DIGITAL v11.0 - ROTEADOR /alunos
// ⚡ MATRIZ DIGITAL v11.1 - ROTEADOR /alunos
// ARQUITETURA MONO-DOMÍNIO:
// - pro.moisesmedeiros.com.br/gestaofc → Funcionários (Gestão)
// - pro.moisesmedeiros.com.br/alunos → Alunos Beta (Central)
// - pro.moisesmedeiros.com.br/ → Área pública
// HIERARQUIA (MONO-DOMÍNIO v2.0): 
//   Owner (role='owner' do banco) = Acesso total
//   Beta = Aluno Pagante → vê Portal do Aluno
//   Staff = Funcionários → vê Gestão de Alunos (/gestaofc)
// ⏱️ P0 FIX v11.1: Timeout para evitar loading infinito (tela preta)
// ============================================

import { useMemo } from "react";
import { useMemo, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useRolePermissions, isGestaoHost, isProHost, isPublicHost } from "@/hooks/useRolePermissions";

// Importa as duas experiências
import AlunoDashboard from "@/pages/aluno/AlunoDashboard";
import Alunos from "@/pages/Alunos";

// ⏱️ P0 FIX: Timeout máximo de loading (evita tela preta infinita)
const LOADING_TIMEOUT_MS = 6000;
const LOADING_SLOW_MS = 2000;

export default function AlunosRouteSwitcher() {
  // 🔴 DEBUG P0: Log para verificar se o componente está renderizando
  console.log('[AlunosRouteSwitcher] 🚀 COMPONENTE INICIANDO RENDER');
  
  // ============================================
  // 🔒 TODOS OS HOOKS DEVEM ESTAR NO TOPO (React Rules of Hooks)
  // ============================================
  
  const location = useLocation();
  const { isAdminOrOwner, isLoading: adminLoading } = useAdminCheck();
  const { isAdminOrOwner, isLoading: adminLoading, userEmail } = useAdminCheck();
  const { role, isLoading: roleLoading, isBeta, isOwner } = useRolePermissions();

  const isLoading = adminLoading || roleLoading;
  // ⏱️ P0 FIX: Timeout para evitar loading infinito (causa de tela preta)
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // ⏱️ Loading demorado: mostrar indicador visual de que está funcionando
  const [isLoadingSlow, setIsLoadingSlow] = useState(false);

  // 🔎 DEBUG temporário (P0): tornar visível o estado real quando /alunos fica “tela preta”
  // P0 FIX: Se timeout foi atingido, parar de esperar loading
  const rawLoading = adminLoading || roleLoading;
  const isLoading = rawLoading && !loadingTimeout;

  // 🔎 DEBUG temporário (P0): tornar visível o estado real quando /alunos fica "tela preta"
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
  
  // ⏱️ Timeout effect: evita loading infinito
  useEffect(() => {
    if (!rawLoading) {
      // Reset timeout quando loading termina naturalmente
      return;
    }
    
    const timeout = setTimeout(() => {
      if (rawLoading) {
        console.warn("[AlunosRouteSwitcher] ⚠️ Timeout de 6s atingido - prosseguindo com estado atual", {
          adminLoading,
          roleLoading,
          role,
          userEmail,
        });
        setLoadingTimeout(true);
      }
    }, LOADING_TIMEOUT_MS);
    
    return () => clearTimeout(timeout);
  }, [rawLoading, adminLoading, roleLoading, role, userEmail]);
  
  // ⏱️ Slow loading indicator
  useEffect(() => {
    if (!isLoading) {
      if (isLoadingSlow) setIsLoadingSlow(false);
      return;
    }
    
    const slowTimer = setTimeout(() => {
      if (isLoading) {
        setIsLoadingSlow(true);
      }
    }, LOADING_SLOW_MS);
    
    return () => clearTimeout(slowTimer);
  }, [isLoading, isLoadingSlow]);

  // ============================================
  // 🔒 FIM DOS HOOKS - LÓGICA DE RENDER ABAIXO
  // ============================================

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
            loadingTimeout,
            isLoading,
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
  // Loading state (P0: com feedback visual para o usuário, NUNCA tela preta)
  if (isLoading) {
    return (
      <>
        {DebugPanel}
        <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center relative z-10 gap-4 p-6">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Carregando...</p>
            {isLoadingSlow && (
              <p className="text-xs text-muted-foreground max-w-xs">
                Verificando permissões. Aguarde um momento...
              </p>
            )}
          </div>
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

  // ============================================
  // ⏱️ P0 FIX: Se chegou aqui após timeout sem role válido,
  // mostrar fallback ao invés de redirecionar cegamente
  // ============================================
  if (loadingTimeout && !role) {
    console.warn("[AlunosRouteSwitcher] ⚠️ Timeout sem role - mostrando AlunoDashboard como fallback seguro");
    return (
      <>
        {DebugPanel}
        <Helmet>
          <title>Dashboard do Aluno | Química ENEM</title>
          <meta
            name="description"
            content="Sua central de estudos com videoaulas, questões, simulados e progresso gamificado."
          />
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