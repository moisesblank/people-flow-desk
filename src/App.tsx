// ============================================
// ⚡ MATRIZ DIGITAL - APP CORE v5.1 ⚡
// ULTRA PERFORMANCE 3G - 5000 usuários simultâneos
// 🛡️ Evangelho da Segurança v2.0 Integrado
// 🛡️ DOGMA XI: Controle de Dispositivos
// ⚡ PERFORMANCE PROVIDER INTEGRADO
// ============================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/styles/performance.css"; // ⚡ ULTRA PERFORMANCE CSS
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GodModeProvider } from "@/contexts/GodModeContext";
import { DuplicationClipboardProvider } from "@/contexts/DuplicationClipboardContext";
import { ReactiveFinanceProvider } from "@/contexts/ReactiveFinanceContext";
import { LiveSheetProvider } from "@/contexts/LiveSheetContext";
import { RoleProtectedRoute } from "@/components/layout/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualEditMode } from "@/components/editor/VisualEditMode";
import { SessionTracker } from "@/components/SessionTracker";
import { KeyboardShortcutsOverlay } from "@/components/onboarding/KeyboardShortcutsOverlay";
import { DuplicationClipboardIndicator } from "@/components/admin/DuplicationClipboardIndicator";
import { SessionGuard } from "@/components/security/SessionGuard";
import { DeviceGuard } from "@/components/security/DeviceGuard";
import { Suspense, lazy, useState, useEffect, memo, useCallback } from "react";
import { useGlobalDevToolsBlock } from "@/hooks/useGlobalDevToolsBlock";
import { PerformanceProvider, PerformanceStyles } from "@/components/performance/PerformanceProvider";

// ⚡ DOGMA V: QueryClient otimizado com cache sagrado
import { createSacredQueryClient } from "@/lib/performance/cacheConfig";

// ⚡ DOGMA III: Lazy loading inteligente de todas as páginas
const Auth = lazy(() => import("./pages/Auth"));
const AreaGratuita = lazy(() => import("./pages/AreaGratuita"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
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
const Home = lazy(() => import("./pages/Home"));
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
const LeadsWhatsApp = lazy(() => import("./pages/LeadsWhatsApp"));
const CentralWhatsApp = lazy(() => import("./pages/CentralWhatsApp"));
const WhatsAppLive = lazy(() => import("./pages/WhatsAppLive"));
const DiagnosticoWhatsApp = lazy(() => import("./pages/DiagnosticoWhatsApp"));
const DiagnosticoWebhooks = lazy(() => import("./pages/DiagnosticoWebhooks"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Documentos = lazy(() => import("./pages/Documentos"));
const CentralMetricas = lazy(() => import("./pages/CentralMetricas"));
const AuditoriaAcessos = lazy(() => import("./pages/AuditoriaAcessos"));
const CentralMonitoramento = lazy(() => import("./pages/CentralMonitoramento"));
const CentralIAs = lazy(() => import("./pages/CentralIAs"));
const TransacoesHotmart = lazy(() => import("./pages/TransacoesHotmart"));
const Lives = lazy(() => import("./pages/Lives"));
// DashboardEmpresarial removido - migrado para FinancasEmpresa
const ArquivosEmpresariais = lazy(() => import("./pages/empresas/ArquivosEmpresariais"));
const RHFuncionarios = lazy(() => import("./pages/empresas/RHFuncionarios"));
const ReceitasEmpresariais = lazy(() => import("./pages/empresas/ReceitasEmpresariais"));
const Perfil = lazy(() => import("./pages/Perfil"));
const GestaoDispositivos = lazy(() => import("./pages/GestaoDispositivos"));
const CentralDiagnostico = lazy(() => import("./pages/CentralDiagnostico"));

// ===== COMUNIDADE (NÃO PAGANTE + BETA) =====
const ComunidadeForum = lazy(() => import("./pages/comunidade/ComunidadeForum"));
const ComunidadePosts = lazy(() => import("./pages/comunidade/ComunidadePosts"));
const ComunidadeMembros = lazy(() => import("./pages/comunidade/ComunidadeMembros"));
const ComunidadeEventos = lazy(() => import("./pages/comunidade/ComunidadeEventos"));
const ComunidadeChat = lazy(() => import("./pages/comunidade/ComunidadeChat"));

// ===== CENTRAL DO ALUNO - QUÍMICA ENEM =====
const AlunosRouteSwitcher = lazy(() => import("./pages/AlunosRouteSwitcher"));
const AlunoDashboard = lazy(() => import("./pages/aluno/AlunoDashboard"));
const AlunoLivroWeb = lazy(() => import("./pages/aluno/AlunoLivroWeb"));
const AlunoVideoaulas = lazy(() => import("./pages/aluno/AlunoVideoaulas"));
const AlunoQuestoes = lazy(() => import("./pages/aluno/AlunoQuestoes"));
const AlunoSimulados = lazy(() => import("./pages/aluno/AlunoSimulados"));
const AlunoRanking = lazy(() => import("./pages/RankingPage"));
const AlunoTabelaPeriodica = lazy(() => import("./pages/aluno/AlunoTabelaPeriodica"));
// Gestão de Livros (Owner)
const GestaoLivrosWeb = lazy(() => import("./pages/gestao/GestaoLivrosWeb"));
// Placeholders - Named exports
const AlunoCronograma = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoCronograma })));
const AlunoMateriais = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoMateriais })));
const AlunoResumos = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoResumos })));
const AlunoMapasMentais = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoMapasMentais })));
const AlunoRedacao = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoRedacao })));
const AlunoDesempenho = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoDesempenho })));
const AlunoConquistas = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoConquistas })));
const TutoriaIA = lazy(() => import("./pages/aluno/TutoriaIA"));
const AlunoForum = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoForum })));
const AlunoLives = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoLives })));
const AlunoDuvidas = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoDuvidas })));
const AlunoRevisao = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoRevisao })));
const AlunoLaboratorio = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoLaboratorio })));
const AlunoCalculadora = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoCalculadora })));
const AlunoFlashcards = lazy(() => import("./pages/FlashcardsPage"));
const AlunoMetas = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoMetas })));
const AlunoAgenda = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoAgenda })));
const AlunoCertificados = lazy(() => import("./pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoCertificados })));
const AlunoPerfil = lazy(() => import("./pages/ProfilePage"));

// ============================================
// 🚀 TTI OPTIMIZATION: Lazy load heavy components
// Defer hydration de componentes não-críticos
// ============================================

// Lazy load heavy components (DOGMA VIII) - com prefetch inteligente
const LazyAITramon = lazy(() => import("@/components/ai/AITramonGlobal").then(m => ({ default: m.AITramonGlobal })));
const LazyGodModePanel = lazy(() => import("@/components/editor/GodModePanel").then(m => ({ default: m.GodModePanel })));
const LazyInlineEditor = lazy(() => import("@/components/editor/InlineEditor").then(m => ({ default: m.InlineEditor })));
const LazyMasterQuickAddMenu = lazy(() => import("@/components/admin/MasterQuickAddMenu").then(m => ({ default: m.MasterQuickAddMenu })));
const LazyGlobalDuplication = lazy(() => import("@/components/admin/GlobalDuplicationSystem").then(m => ({ default: m.GlobalDuplicationSystem })));
const LazyMasterUndoIndicator = lazy(() => import("@/components/admin/MasterUndoIndicator").then(m => ({ default: m.MasterUndoIndicator })));
const LazyMasterDeleteOverlay = lazy(() => import("@/components/admin/MasterDeleteOverlay").then(m => ({ default: m.MasterDeleteOverlay })));
const LazyMasterContextMenu = lazy(() => import("@/components/admin/MasterContextMenu").then(m => ({ default: m.MasterContextMenu })));

// ⚡ DOGMA V: QueryClient Sagrado com cache otimizado
const queryClient = createSacredQueryClient();

// Listener global para limpeza de cache
if (typeof window !== 'undefined') {
  window.addEventListener('mm-clear-cache', () => {
    queryClient.clear();
    queryClient.invalidateQueries();
    console.log('[MATRIZ] 🧹 Cache purificado');
  });
  
  // 🚀 PREFETCH: Carregar componentes pesados após TTI
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      // Prefetch componentes de admin após idle
      import("@/components/ai/AITramonGlobal").catch(() => {});
      import("@/components/editor/GodModePanel").catch(() => {});
    }, { timeout: 5000 });
  }
}

// ⚡ DOGMA I: Ultra-fast loading - CSS only, minimal DOM
const PageLoader = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = 'PageLoader';

// Protected route wrapper - memoized
const ProtectedPage = memo(({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </RoleProtectedRoute>
));
ProtectedPage.displayName = 'ProtectedPage';

// Global keyboard shortcuts hook - optimized
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

// App Content - memoized for performance
const AppContent = memo(() => {
  const { isOpen, setIsOpen } = useGlobalShortcutsOverlay();
  useGlobalDevToolsBlock();

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      {/* 🛡️ DOGMA I: Guarda de Sessão Única */}
      <SessionGuard>
        {/* 🛡️ DOGMA XI: Guarda de Limite de Dispositivos */}
        <DeviceGuard>
          <SessionTracker />
      
      {/* Heavy components - deferred loading */}
      <Suspense fallback={null}>
        <LazyGodModePanel />
        <LazyInlineEditor />
        <LazyMasterQuickAddMenu />
        <LazyGlobalDuplication />
        <LazyMasterUndoIndicator />
        <LazyMasterDeleteOverlay />
        <LazyMasterContextMenu />
      </Suspense>
      
      <VisualEditMode />
      <KeyboardShortcutsOverlay isOpen={isOpen} onClose={handleClose} />
      
      {/* AI TRAMON - Lazy loaded */}
      <Suspense fallback={null}>
        <LazyAITramon />
      </Suspense>
      
      {/* Routes with optimized Suspense */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ========================================== */}
          {/* 🌐 ROTAS PÚBLICAS (SEM AUTH) */}
          {/* ========================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/site" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/area-gratuita" element={<AreaGratuita />} />
          
          {/* ========================================== */}
          {/* 🌐 COMUNIDADE (NÃO PAGANTE + BETA) */}
          {/* pro.moisesmedeiros.com.br/comunidade */}
          {/* ========================================== */}
          <Route path="/comunidade" element={<Comunidade />} />
          <Route path="/comunidade/forum" element={<ProtectedPage><ComunidadeForum /></ProtectedPage>} />
          <Route path="/comunidade/posts" element={<ProtectedPage><ComunidadePosts /></ProtectedPage>} />
          <Route path="/comunidade/membros" element={<ProtectedPage><ComunidadeMembros /></ProtectedPage>} />
          <Route path="/comunidade/eventos" element={<ProtectedPage><ComunidadeEventos /></ProtectedPage>} />
          <Route path="/comunidade/chat" element={<ProtectedPage><ComunidadeChat /></ProtectedPage>} />
          
          {/* ========================================== */}
          {/* 👔 GESTÃO - PREFIXO /gestao/ (FUNCIONÁRIOS) */}
          {/* gestao.moisesmedeiros.com.br/gestao/* */}
          {/* ========================================== */}
          <Route path="/gestao/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/gestao/dashboard-executivo" element={<ProtectedPage><DashboardExecutivo /></ProtectedPage>} />
          <Route path="/gestao/tarefas" element={<ProtectedPage><Tarefas /></ProtectedPage>} />
          <Route path="/gestao/funcionarios" element={<ProtectedPage><Funcionarios /></ProtectedPage>} />
          <Route path="/gestao/calendario" element={<ProtectedPage><Calendario /></ProtectedPage>} />
          <Route path="/gestao/integracoes" element={<ProtectedPage><Integracoes /></ProtectedPage>} />
          <Route path="/gestao/documentos" element={<ProtectedPage><Documentos /></ProtectedPage>} />
          <Route path="/gestao/perfil" element={<ProtectedPage><Perfil /></ProtectedPage>} />
          <Route path="/gestao/guia" element={<ProtectedPage><Guia /></ProtectedPage>} />
          
          {/* Gestão - Marketing */}
          <Route path="/gestao/marketing" element={<ProtectedPage><Marketing /></ProtectedPage>} />
          <Route path="/gestao/lancamento" element={<ProtectedPage><Lancamento /></ProtectedPage>} />
          <Route path="/gestao/metricas" element={<ProtectedPage><Metricas /></ProtectedPage>} />
          <Route path="/gestao/arquivos" element={<ProtectedPage><Arquivos /></ProtectedPage>} />
          <Route path="/gestao/leads-whatsapp" element={<ProtectedPage><LeadsWhatsApp /></ProtectedPage>} />
          
          {/* Gestão - Aulas */}
          <Route path="/gestao/area-professor" element={<ProtectedPage><AreaProfessor /></ProtectedPage>} />
          <Route path="/gestao/planejamento-aula" element={<ProtectedPage><PlanejamentoAula /></ProtectedPage>} />
          <Route path="/gestao/laboratorio" element={<ProtectedPage><Laboratorio /></ProtectedPage>} />
          <Route path="/gestao/turmas-online" element={<ProtectedPage><TurmasOnline /></ProtectedPage>} />
          <Route path="/gestao/turmas-presenciais" element={<ProtectedPage><TurmasPresenciais /></ProtectedPage>} />
          <Route path="/gestao/cursos" element={<ProtectedPage><Cursos /></ProtectedPage>} />
          <Route path="/gestao/simulados" element={<ProtectedPage><Simulados /></ProtectedPage>} />
          <Route path="/gestao/lives" element={<ProtectedPage><Lives /></ProtectedPage>} />
          <Route path="/gestao/livros-web" element={<ProtectedPage><GestaoLivrosWeb /></ProtectedPage>} />
          
          {/* Gestão - Finanças */}
          <Route path="/gestao/entradas" element={<ProtectedPage><Entradas /></ProtectedPage>} />
          <Route path="/gestao/financas-empresa" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/gestao/financas-pessoais" element={<ProtectedPage><FinancasPessoais /></ProtectedPage>} />
          <Route path="/gestao/pagamentos" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/gestao/contabilidade" element={<ProtectedPage><Contabilidade /></ProtectedPage>} />
          <Route path="/gestao/transacoes-hotmart" element={<ProtectedPage><TransacoesHotmart /></ProtectedPage>} />
          
          {/* Gestão - Alunos */}
          <Route path="/gestao/gestao-alunos" element={<ProtectedPage><Alunos /></ProtectedPage>} />
          <Route path="/gestao/portal-aluno" element={<ProtectedPage><PortalAluno /></ProtectedPage>} />
          <Route path="/gestao/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
          <Route path="/gestao/afiliados" element={<ProtectedPage><Afiliados /></ProtectedPage>} />
          
          {/* Gestão - Admin/Config */}
          <Route path="/gestao/permissoes" element={<ProtectedPage><Permissoes /></ProtectedPage>} />
          <Route path="/gestao/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
          <Route path="/gestao/gestao-equipe" element={<ProtectedPage><GestaoEquipe /></ProtectedPage>} />
          <Route path="/gestao/gestao-site" element={<ProtectedPage><GestaoSite /></ProtectedPage>} />
          <Route path="/gestao/gestao-dispositivos" element={<ProtectedPage><GestaoDispositivos /></ProtectedPage>} />
          <Route path="/gestao/auditoria-acessos" element={<ProtectedPage><AuditoriaAcessos /></ProtectedPage>} />
          
          {/* Gestão - Owner Only */}
          <Route path="/gestao/central-monitoramento" element={<ProtectedPage><CentralMonitoramento /></ProtectedPage>} />
          <Route path="/gestao/monitoramento" element={<ProtectedPage><Monitoramento /></ProtectedPage>} />
          <Route path="/gestao/central-whatsapp" element={<ProtectedPage><CentralWhatsApp /></ProtectedPage>} />
          <Route path="/gestao/whatsapp-live" element={<ProtectedPage><WhatsAppLive /></ProtectedPage>} />
          <Route path="/gestao/diagnostico-whatsapp" element={<ProtectedPage><DiagnosticoWhatsApp /></ProtectedPage>} />
          <Route path="/gestao/diagnostico-webhooks" element={<ProtectedPage><DiagnosticoWebhooks /></ProtectedPage>} />
          <Route path="/gestao/central-metricas" element={<ProtectedPage><CentralMetricas /></ProtectedPage>} />
          <Route path="/gestao/central-ias" element={<ProtectedPage><CentralIAs /></ProtectedPage>} />
          <Route path="/gestao/site-programador" element={<ProtectedPage><SiteProgramador /></ProtectedPage>} />
          <Route path="/gestao/central-diagnostico" element={<ProtectedPage><CentralDiagnostico /></ProtectedPage>} />
          <Route path="/gestao/vida-pessoal" element={<ProtectedPage><VidaPessoal /></ProtectedPage>} />
          <Route path="/gestao/pessoal" element={<ProtectedPage><Pessoal /></ProtectedPage>} />
          
          {/* Gestão - Empresas */}
          <Route path="/gestao/empresas/dashboard" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/gestao/empresas/receitas" element={<ProtectedPage><ReceitasEmpresariais /></ProtectedPage>} />
          <Route path="/gestao/empresas/arquivos" element={<ProtectedPage><ArquivosEmpresariais /></ProtectedPage>} />
          <Route path="/gestao/empresas/rh" element={<ProtectedPage><RHFuncionarios /></ProtectedPage>} />
          
          {/* ========================================== */}
          {/* 👨‍🎓 CENTRAL DO ALUNO BETA (PAGANTE) */}
          {/* pro.moisesmedeiros.com.br/alunos/* */}
          {/* ========================================== */}
          <Route path="/alunos" element={<ProtectedPage><AlunosRouteSwitcher /></ProtectedPage>} />
          <Route path="/alunos/dashboard" element={<ProtectedPage><AlunoDashboard /></ProtectedPage>} />
          <Route path="/alunos/livro-web" element={<ProtectedPage><AlunoLivroWeb /></ProtectedPage>} />
          <Route path="/alunos/cronograma" element={<ProtectedPage><AlunoCronograma /></ProtectedPage>} />
          <Route path="/alunos/videoaulas" element={<ProtectedPage><AlunoVideoaulas /></ProtectedPage>} />
          <Route path="/alunos/materiais" element={<ProtectedPage><AlunoMateriais /></ProtectedPage>} />
          <Route path="/alunos/resumos" element={<ProtectedPage><AlunoResumos /></ProtectedPage>} />
          <Route path="/alunos/mapas-mentais" element={<ProtectedPage><AlunoMapasMentais /></ProtectedPage>} />
          <Route path="/alunos/questoes" element={<ProtectedPage><AlunoQuestoes /></ProtectedPage>} />
          <Route path="/alunos/simulados" element={<ProtectedPage><AlunoSimulados /></ProtectedPage>} />
          <Route path="/alunos/redacao" element={<ProtectedPage><AlunoRedacao /></ProtectedPage>} />
          <Route path="/alunos/desempenho" element={<ProtectedPage><AlunoDesempenho /></ProtectedPage>} />
          <Route path="/alunos/ranking" element={<ProtectedPage><AlunoRanking /></ProtectedPage>} />
          <Route path="/alunos/conquistas" element={<ProtectedPage><AlunoConquistas /></ProtectedPage>} />
          <Route path="/alunos/tutoria" element={<ProtectedPage><TutoriaIA /></ProtectedPage>} />
          <Route path="/alunos/forum" element={<ProtectedPage><AlunoForum /></ProtectedPage>} />
          <Route path="/alunos/lives" element={<ProtectedPage><AlunoLives /></ProtectedPage>} />
          <Route path="/alunos/duvidas" element={<ProtectedPage><AlunoDuvidas /></ProtectedPage>} />
          <Route path="/alunos/revisao" element={<ProtectedPage><AlunoRevisao /></ProtectedPage>} />
          <Route path="/alunos/laboratorio" element={<ProtectedPage><AlunoLaboratorio /></ProtectedPage>} />
          <Route path="/alunos/calculadora" element={<ProtectedPage><AlunoCalculadora /></ProtectedPage>} />
          <Route path="/alunos/tabela-periodica" element={<ProtectedPage><AlunoTabelaPeriodica /></ProtectedPage>} />
          <Route path="/alunos/flashcards" element={<ProtectedPage><AlunoFlashcards /></ProtectedPage>} />
          <Route path="/alunos/metas" element={<ProtectedPage><AlunoMetas /></ProtectedPage>} />
          <Route path="/alunos/agenda" element={<ProtectedPage><AlunoAgenda /></ProtectedPage>} />
          <Route path="/alunos/certificados" element={<ProtectedPage><AlunoCertificados /></ProtectedPage>} />
          <Route path="/alunos/perfil" element={<ProtectedPage><AlunoPerfil /></ProtectedPage>} />
          
          {/* ========================================== */}
          {/* 🔄 ROTAS LEGADAS (COMPATIBILIDADE) */}
          {/* Mantidas para não quebrar links antigos */}
          {/* ========================================== */}
          <Route path="/app" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/dashboard-executivo" element={<ProtectedPage><DashboardExecutivo /></ProtectedPage>} />
          <Route path="/tarefas" element={<ProtectedPage><Tarefas /></ProtectedPage>} />
          <Route path="/funcionarios" element={<ProtectedPage><Funcionarios /></ProtectedPage>} />
          <Route path="/calendario" element={<ProtectedPage><Calendario /></ProtectedPage>} />
          <Route path="/integracoes" element={<ProtectedPage><Integracoes /></ProtectedPage>} />
          <Route path="/documentos" element={<ProtectedPage><Documentos /></ProtectedPage>} />
          <Route path="/perfil" element={<ProtectedPage><Perfil /></ProtectedPage>} />
          <Route path="/guia" element={<ProtectedPage><Guia /></ProtectedPage>} />
          <Route path="/marketing" element={<ProtectedPage><Marketing /></ProtectedPage>} />
          <Route path="/lancamento" element={<ProtectedPage><Lancamento /></ProtectedPage>} />
          <Route path="/metricas" element={<ProtectedPage><Metricas /></ProtectedPage>} />
          <Route path="/arquivos" element={<ProtectedPage><Arquivos /></ProtectedPage>} />
          <Route path="/leads-whatsapp" element={<ProtectedPage><LeadsWhatsApp /></ProtectedPage>} />
          <Route path="/area-professor" element={<ProtectedPage><AreaProfessor /></ProtectedPage>} />
          <Route path="/planejamento-aula" element={<ProtectedPage><PlanejamentoAula /></ProtectedPage>} />
          <Route path="/laboratorio" element={<ProtectedPage><Laboratorio /></ProtectedPage>} />
          <Route path="/turmas-online" element={<ProtectedPage><TurmasOnline /></ProtectedPage>} />
          <Route path="/turmas-presenciais" element={<ProtectedPage><TurmasPresenciais /></ProtectedPage>} />
          <Route path="/cursos" element={<ProtectedPage><Cursos /></ProtectedPage>} />
          <Route path="/cursos/:courseId" element={<ProtectedPage><CursoDetalhe /></ProtectedPage>} />
          <Route path="/cursos/:courseId/aula/:lessonId" element={<ProtectedPage><Aula /></ProtectedPage>} />
          <Route path="/simulados" element={<ProtectedPage><Simulados /></ProtectedPage>} />
          <Route path="/lives" element={<ProtectedPage><Lives /></ProtectedPage>} />
          <Route path="/entradas" element={<ProtectedPage><Entradas /></ProtectedPage>} />
          <Route path="/financas-empresa" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/financas-pessoais" element={<ProtectedPage><FinancasPessoais /></ProtectedPage>} />
          <Route path="/pagamentos" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/contabilidade" element={<ProtectedPage><Contabilidade /></ProtectedPage>} />
          <Route path="/transacoes-hotmart" element={<ProtectedPage><TransacoesHotmart /></ProtectedPage>} />
          <Route path="/gestao-alunos" element={<ProtectedPage><Alunos /></ProtectedPage>} />
          <Route path="/portal-aluno" element={<ProtectedPage><PortalAluno /></ProtectedPage>} />
          <Route path="/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
          <Route path="/afiliados" element={<ProtectedPage><Afiliados /></ProtectedPage>} />
          <Route path="/permissoes" element={<ProtectedPage><Permissoes /></ProtectedPage>} />
          <Route path="/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
          <Route path="/gestao-equipe" element={<ProtectedPage><GestaoEquipe /></ProtectedPage>} />
          <Route path="/gestao-site" element={<ProtectedPage><GestaoSite /></ProtectedPage>} />
          <Route path="/gestao-dispositivos" element={<ProtectedPage><GestaoDispositivos /></ProtectedPage>} />
          <Route path="/auditoria-acessos" element={<ProtectedPage><AuditoriaAcessos /></ProtectedPage>} />
          <Route path="/central-monitoramento" element={<ProtectedPage><CentralMonitoramento /></ProtectedPage>} />
          <Route path="/monitoramento" element={<ProtectedPage><Monitoramento /></ProtectedPage>} />
          <Route path="/central-whatsapp" element={<ProtectedPage><CentralWhatsApp /></ProtectedPage>} />
          <Route path="/whatsapp-live" element={<ProtectedPage><WhatsAppLive /></ProtectedPage>} />
          <Route path="/diagnostico-whatsapp" element={<ProtectedPage><DiagnosticoWhatsApp /></ProtectedPage>} />
          <Route path="/diagnostico-webhooks" element={<ProtectedPage><DiagnosticoWebhooks /></ProtectedPage>} />
          <Route path="/central-metricas" element={<ProtectedPage><CentralMetricas /></ProtectedPage>} />
          <Route path="/central-ias" element={<ProtectedPage><CentralIAs /></ProtectedPage>} />
          <Route path="/site-programador" element={<ProtectedPage><SiteProgramador /></ProtectedPage>} />
          <Route path="/central-diagnostico" element={<ProtectedPage><CentralDiagnostico /></ProtectedPage>} />
          <Route path="/vida-pessoal" element={<ProtectedPage><VidaPessoal /></ProtectedPage>} />
          <Route path="/pessoal" element={<ProtectedPage><Pessoal /></ProtectedPage>} />
          <Route path="/empresas/dashboard" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/empresas/receitas" element={<ProtectedPage><ReceitasEmpresariais /></ProtectedPage>} />
          <Route path="/empresas/arquivos" element={<ProtectedPage><ArquivosEmpresariais /></ProtectedPage>} />
          <Route path="/empresas/rh" element={<ProtectedPage><RHFuncionarios /></ProtectedPage>} />
          
          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
        </DeviceGuard>
      </SessionGuard>
    </>
  );
});
AppContent.displayName = 'AppContent';

// ⚡ App Principal - Estrutura de providers otimizada + PERFORMANCE PROVIDER
const App = memo(() => (
  <PerformanceProvider>
    <PerformanceStyles />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LiveSheetProvider>
          <ReactiveFinanceProvider>
            <GodModeProvider>
              <DuplicationClipboardProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppContent />
                    <DuplicationClipboardIndicator />
                  </BrowserRouter>
                </TooltipProvider>
              </DuplicationClipboardProvider>
            </GodModeProvider>
          </ReactiveFinanceProvider>
        </LiveSheetProvider>
      </AuthProvider>
    </QueryClientProvider>
  </PerformanceProvider>
));
App.displayName = 'App';

export default App;
