// ============================================
// 👔 GESTÃO FC - PREFIXO /gestaofc/ (FUNCIONÁRIOS)
// ÁREA INTERNA em pro.moisesmedeiros.com.br/gestaofc/*
// MIGRADO de gestao.moisesmedeiros.com.br/gestao/*
// ============================================

import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedPage } from "./routeHelpers";

// Lazy imports - Core
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DashboardExecutivo = lazy(() => import("@/pages/DashboardExecutivo"));
const Tarefas = lazy(() => import("@/pages/Tarefas"));
const Funcionarios = lazy(() => import("@/pages/Funcionarios"));
const Calendario = lazy(() => import("@/pages/Calendario"));
const Integracoes = lazy(() => import("@/pages/Integracoes"));
const Documentos = lazy(() => import("@/pages/Documentos"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const Guia = lazy(() => import("@/pages/Guia"));

// Marketing
const Marketing = lazy(() => import("@/pages/Marketing"));
const Lancamento = lazy(() => import("@/pages/Lancamento"));
const Metricas = lazy(() => import("@/pages/Metricas"));
const Arquivos = lazy(() => import("@/pages/Arquivos"));
const LeadsWhatsApp = lazy(() => import("@/pages/LeadsWhatsApp"));

// Aulas
const AreaProfessor = lazy(() => import("@/pages/AreaProfessor"));
const PlanejamentoAula = lazy(() => import("@/pages/PlanejamentoAula"));
const Laboratorio = lazy(() => import("@/pages/Laboratorio"));
const TurmasOnline = lazy(() => import("@/pages/TurmasOnline"));
const TurmasPresenciais = lazy(() => import("@/pages/TurmasPresenciais"));
const Cursos = lazy(() => import("@/pages/Cursos"));
const Simulados = lazy(() => import("@/pages/Simulados"));
const Lives = lazy(() => import("@/pages/Lives"));
const GestaoLivrosWeb = lazy(() => import("@/pages/gestao/GestaoLivrosWeb"));
const GestaoQuestoes = lazy(() => import("@/pages/gestao/GestaoQuestoes"));
const GestaoFlashcards = lazy(() => import("@/pages/gestao/GestaoFlashcards"));
const GestaoMapasMentais = lazy(() => import("@/pages/gestao/GestaoMapasMentais"));
const GestaoVideoaulas = lazy(() => import("@/pages/gestao/GestaoVideoaulas"));

// Finanças
const Entradas = lazy(() => import("@/pages/Entradas"));
const FinancasEmpresa = lazy(() => import("@/pages/FinancasEmpresa"));
const FinancasPessoais = lazy(() => import("@/pages/FinancasPessoais"));
const Contabilidade = lazy(() => import("@/pages/Contabilidade"));
const TransacoesHotmart = lazy(() => import("@/pages/TransacoesHotmart"));

// Alunos
const Alunos = lazy(() => import("@/pages/Alunos"));
const AlunoPerfilAdmin = lazy(() => import("@/pages/gestao/AlunoPerfilAdmin"));
const PortalAluno = lazy(() => import("@/pages/PortalAluno"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Afiliados = lazy(() => import("@/pages/Afiliados"));

// Admin/Config
const Permissoes = lazy(() => import("@/pages/Permissoes"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const GestaoEquipe = lazy(() => import("@/pages/GestaoEquipe"));
const GestaoSite = lazy(() => import("@/pages/GestaoSite"));
const GestaoDispositivos = lazy(() => import("@/pages/GestaoDispositivos"));
// AuditoriaAcessos removido - WordPress desativado em 2025-12-28

// Owner Only
const CentralMonitoramento = lazy(() => import("@/pages/CentralMonitoramento"));
const Monitoramento = lazy(() => import("@/pages/Monitoramento"));
const CentralWhatsApp = lazy(() => import("@/pages/CentralWhatsApp"));
const WhatsAppLive = lazy(() => import("@/pages/WhatsAppLive"));
const DiagnosticoWhatsApp = lazy(() => import("@/pages/DiagnosticoWhatsApp"));
const DiagnosticoWebhooks = lazy(() => import("@/pages/DiagnosticoWebhooks"));
const CentralMetricas = lazy(() => import("@/pages/CentralMetricas"));
const CentralIAs = lazy(() => import("@/pages/CentralIAs"));
const SiteProgramador = lazy(() => import("@/pages/SiteProgramador"));
const CentralDiagnostico = lazy(() => import("@/pages/CentralDiagnostico"));
const VidaPessoal = lazy(() => import("@/pages/VidaPessoal"));
const Pessoal = lazy(() => import("@/pages/Pessoal"));

// Empresas
const ArquivosEmpresariais = lazy(() => import("@/pages/empresas/ArquivosEmpresariais"));
const RHFuncionarios = lazy(() => import("@/pages/empresas/RHFuncionarios"));
const ReceitasEmpresariais = lazy(() => import("@/pages/empresas/ReceitasEmpresariais"));

export const gestaofcRoutes = (
  <>
    {/* Core */}
    <Route path="/gestaofc" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
    <Route path="/gestaofc/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
    <Route path="/gestaofc/dashboard-executivo" element={<ProtectedPage><DashboardExecutivo /></ProtectedPage>} />
    <Route path="/gestaofc/tarefas" element={<ProtectedPage><Tarefas /></ProtectedPage>} />
    <Route path="/gestaofc/funcionarios" element={<ProtectedPage><Funcionarios /></ProtectedPage>} />
    <Route path="/gestaofc/calendario" element={<ProtectedPage><Calendario /></ProtectedPage>} />
    <Route path="/gestaofc/integracoes" element={<ProtectedPage><Integracoes /></ProtectedPage>} />
    <Route path="/gestaofc/documentos" element={<ProtectedPage><Documentos /></ProtectedPage>} />
    <Route path="/gestaofc/perfil" element={<ProtectedPage><Perfil /></ProtectedPage>} />
    <Route path="/gestaofc/guia" element={<ProtectedPage><Guia /></ProtectedPage>} />
    
    {/* Marketing */}
    <Route path="/gestaofc/marketing" element={<ProtectedPage><Marketing /></ProtectedPage>} />
    <Route path="/gestaofc/lancamento" element={<ProtectedPage><Lancamento /></ProtectedPage>} />
    <Route path="/gestaofc/metricas" element={<ProtectedPage><Metricas /></ProtectedPage>} />
    <Route path="/gestaofc/arquivos" element={<ProtectedPage><Arquivos /></ProtectedPage>} />
    <Route path="/gestaofc/leads-whatsapp" element={<ProtectedPage><LeadsWhatsApp /></ProtectedPage>} />
    
    {/* Aulas */}
    <Route path="/gestaofc/area-professor" element={<ProtectedPage><AreaProfessor /></ProtectedPage>} />
    <Route path="/gestaofc/planejamento-aula" element={<ProtectedPage><PlanejamentoAula /></ProtectedPage>} />
    <Route path="/gestaofc/laboratorio" element={<ProtectedPage><Laboratorio /></ProtectedPage>} />
    <Route path="/gestaofc/turmas-online" element={<ProtectedPage><TurmasOnline /></ProtectedPage>} />
    <Route path="/gestaofc/turmas-presenciais" element={<ProtectedPage><TurmasPresenciais /></ProtectedPage>} />
    <Route path="/gestaofc/cursos" element={<ProtectedPage><Cursos /></ProtectedPage>} />
    <Route path="/gestaofc/simulados" element={<ProtectedPage><Simulados /></ProtectedPage>} />
    <Route path="/gestaofc/lives" element={<ProtectedPage><Lives /></ProtectedPage>} />
    <Route path="/gestaofc/livros-web" element={<ProtectedPage><GestaoLivrosWeb /></ProtectedPage>} />
    <Route path="/gestaofc/questoes" element={<ProtectedPage><GestaoQuestoes /></ProtectedPage>} />
    <Route path="/gestaofc/flashcards" element={<ProtectedPage><GestaoFlashcards /></ProtectedPage>} />
    <Route path="/gestaofc/mapas-mentais" element={<ProtectedPage><GestaoMapasMentais /></ProtectedPage>} />
    <Route path="/gestaofc/videoaulas" element={<ProtectedPage><GestaoVideoaulas /></ProtectedPage>} />
    
    {/* Finanças */}
    <Route path="/gestaofc/entradas" element={<ProtectedPage><Entradas /></ProtectedPage>} />
    <Route path="/gestaofc/financas-empresa" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
    <Route path="/gestaofc/financas-pessoais" element={<ProtectedPage><FinancasPessoais /></ProtectedPage>} />
    <Route path="/gestaofc/pagamentos" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
    <Route path="/gestaofc/contabilidade" element={<ProtectedPage><Contabilidade /></ProtectedPage>} />
    <Route path="/gestaofc/transacoes-hotmart" element={<ProtectedPage><TransacoesHotmart /></ProtectedPage>} />
    
    {/* Alunos */}
    <Route path="/gestaofc/gestao-alunos" element={<ProtectedPage><Alunos /></ProtectedPage>} />
    <Route path="/gestaofc/gestao-alunos/:id" element={<ProtectedPage><AlunoPerfilAdmin /></ProtectedPage>} />
    <Route path="/gestaofc/portal-aluno" element={<ProtectedPage><PortalAluno /></ProtectedPage>} />
    <Route path="/gestaofc/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
    <Route path="/gestaofc/afiliados" element={<ProtectedPage><Afiliados /></ProtectedPage>} />
    
    {/* Admin/Config */}
    <Route path="/gestaofc/permissoes" element={<ProtectedPage><Permissoes /></ProtectedPage>} />
    <Route path="/gestaofc/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
    <Route path="/gestaofc/gestao-equipe" element={<ProtectedPage><GestaoEquipe /></ProtectedPage>} />
    <Route path="/gestaofc/gestao-site" element={<ProtectedPage><GestaoSite /></ProtectedPage>} />
    <Route path="/gestaofc/gestao-dispositivos" element={<ProtectedPage><GestaoDispositivos /></ProtectedPage>} />
    {/* Rota auditoria-acessos removida - WordPress desativado em 2025-12-28 */}
    
    {/* Owner Only */}
    <Route path="/gestaofc/central-monitoramento" element={<ProtectedPage><CentralMonitoramento /></ProtectedPage>} />
    <Route path="/gestaofc/monitoramento" element={<ProtectedPage><Monitoramento /></ProtectedPage>} />
    <Route path="/gestaofc/central-whatsapp" element={<ProtectedPage><CentralWhatsApp /></ProtectedPage>} />
    <Route path="/gestaofc/whatsapp-live" element={<ProtectedPage><WhatsAppLive /></ProtectedPage>} />
    <Route path="/gestaofc/diagnostico-whatsapp" element={<ProtectedPage><DiagnosticoWhatsApp /></ProtectedPage>} />
    <Route path="/gestaofc/diagnostico-webhooks" element={<ProtectedPage><DiagnosticoWebhooks /></ProtectedPage>} />
    <Route path="/gestaofc/central-metricas" element={<ProtectedPage><CentralMetricas /></ProtectedPage>} />
    <Route path="/gestaofc/central-ias" element={<ProtectedPage><CentralIAs /></ProtectedPage>} />
    <Route path="/gestaofc/site-programador" element={<ProtectedPage><SiteProgramador /></ProtectedPage>} />
    <Route path="/gestaofc/central-diagnostico" element={<ProtectedPage><CentralDiagnostico /></ProtectedPage>} />
    <Route path="/gestaofc/vida-pessoal" element={<ProtectedPage><VidaPessoal /></ProtectedPage>} />
    <Route path="/gestaofc/pessoal" element={<ProtectedPage><Pessoal /></ProtectedPage>} />
    
    {/* Empresas */}
    <Route path="/gestaofc/empresas/dashboard" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
    <Route path="/gestaofc/empresas/receitas" element={<ProtectedPage><ReceitasEmpresariais /></ProtectedPage>} />
    <Route path="/gestaofc/empresas/arquivos" element={<ProtectedPage><ArquivosEmpresariais /></ProtectedPage>} />
    <Route path="/gestaofc/empresas/rh" element={<ProtectedPage><RHFuncionarios /></ProtectedPage>} />
  </>
);
