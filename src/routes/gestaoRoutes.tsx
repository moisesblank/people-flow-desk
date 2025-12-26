// ============================================
// 👔 GESTÃO - PREFIXO /gestao/ (FUNCIONÁRIOS)
// gestao.moisesmedeiros.com.br/gestao/*
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

// Finanças
const Entradas = lazy(() => import("@/pages/Entradas"));
const FinancasEmpresa = lazy(() => import("@/pages/FinancasEmpresa"));
const FinancasPessoais = lazy(() => import("@/pages/FinancasPessoais"));
const Contabilidade = lazy(() => import("@/pages/Contabilidade"));
const TransacoesHotmart = lazy(() => import("@/pages/TransacoesHotmart"));

// Alunos
const Alunos = lazy(() => import("@/pages/Alunos"));
const PortalAluno = lazy(() => import("@/pages/PortalAluno"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Afiliados = lazy(() => import("@/pages/Afiliados"));

// Admin/Config
const Permissoes = lazy(() => import("@/pages/Permissoes"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const GestaoEquipe = lazy(() => import("@/pages/GestaoEquipe"));
const GestaoSite = lazy(() => import("@/pages/GestaoSite"));
const GestaoDispositivos = lazy(() => import("@/pages/GestaoDispositivos"));
const AuditoriaAcessos = lazy(() => import("@/pages/AuditoriaAcessos"));

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

export const gestaoRoutes = (
  <>
    {/* Core */}
    <Route path="/gestao" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
    <Route path="/gestao/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
    <Route path="/gestao/dashboard-executivo" element={<ProtectedPage><DashboardExecutivo /></ProtectedPage>} />
    <Route path="/gestao/tarefas" element={<ProtectedPage><Tarefas /></ProtectedPage>} />
    <Route path="/gestao/funcionarios" element={<ProtectedPage><Funcionarios /></ProtectedPage>} />
    <Route path="/gestao/calendario" element={<ProtectedPage><Calendario /></ProtectedPage>} />
    <Route path="/gestao/integracoes" element={<ProtectedPage><Integracoes /></ProtectedPage>} />
    <Route path="/gestao/documentos" element={<ProtectedPage><Documentos /></ProtectedPage>} />
    <Route path="/gestao/perfil" element={<ProtectedPage><Perfil /></ProtectedPage>} />
    <Route path="/gestao/guia" element={<ProtectedPage><Guia /></ProtectedPage>} />
    
    {/* Marketing */}
    <Route path="/gestao/marketing" element={<ProtectedPage><Marketing /></ProtectedPage>} />
    <Route path="/gestao/lancamento" element={<ProtectedPage><Lancamento /></ProtectedPage>} />
    <Route path="/gestao/metricas" element={<ProtectedPage><Metricas /></ProtectedPage>} />
    <Route path="/gestao/arquivos" element={<ProtectedPage><Arquivos /></ProtectedPage>} />
    <Route path="/gestao/leads-whatsapp" element={<ProtectedPage><LeadsWhatsApp /></ProtectedPage>} />
    
    {/* Aulas */}
    <Route path="/gestao/area-professor" element={<ProtectedPage><AreaProfessor /></ProtectedPage>} />
    <Route path="/gestao/planejamento-aula" element={<ProtectedPage><PlanejamentoAula /></ProtectedPage>} />
    <Route path="/gestao/laboratorio" element={<ProtectedPage><Laboratorio /></ProtectedPage>} />
    <Route path="/gestao/turmas-online" element={<ProtectedPage><TurmasOnline /></ProtectedPage>} />
    <Route path="/gestao/turmas-presenciais" element={<ProtectedPage><TurmasPresenciais /></ProtectedPage>} />
    <Route path="/gestao/cursos" element={<ProtectedPage><Cursos /></ProtectedPage>} />
    <Route path="/gestao/simulados" element={<ProtectedPage><Simulados /></ProtectedPage>} />
    <Route path="/gestao/lives" element={<ProtectedPage><Lives /></ProtectedPage>} />
    <Route path="/gestao/livros-web" element={<ProtectedPage><GestaoLivrosWeb /></ProtectedPage>} />
    
    {/* Finanças */}
    <Route path="/gestao/entradas" element={<ProtectedPage><Entradas /></ProtectedPage>} />
    <Route path="/gestao/financas-empresa" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
    <Route path="/gestao/financas-pessoais" element={<ProtectedPage><FinancasPessoais /></ProtectedPage>} />
    <Route path="/gestao/pagamentos" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
    <Route path="/gestao/contabilidade" element={<ProtectedPage><Contabilidade /></ProtectedPage>} />
    <Route path="/gestao/transacoes-hotmart" element={<ProtectedPage><TransacoesHotmart /></ProtectedPage>} />
    
    {/* Alunos */}
    <Route path="/gestao/gestao-alunos" element={<ProtectedPage><Alunos /></ProtectedPage>} />
    <Route path="/gestao/portal-aluno" element={<ProtectedPage><PortalAluno /></ProtectedPage>} />
    <Route path="/gestao/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
    <Route path="/gestao/afiliados" element={<ProtectedPage><Afiliados /></ProtectedPage>} />
    
    {/* Admin/Config */}
    <Route path="/gestao/permissoes" element={<ProtectedPage><Permissoes /></ProtectedPage>} />
    <Route path="/gestao/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
    <Route path="/gestao/gestao-equipe" element={<ProtectedPage><GestaoEquipe /></ProtectedPage>} />
    <Route path="/gestao/gestao-site" element={<ProtectedPage><GestaoSite /></ProtectedPage>} />
    <Route path="/gestao/gestao-dispositivos" element={<ProtectedPage><GestaoDispositivos /></ProtectedPage>} />
    <Route path="/gestao/auditoria-acessos" element={<ProtectedPage><AuditoriaAcessos /></ProtectedPage>} />
    
    {/* Owner Only */}
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
    
    {/* Empresas */}
    <Route path="/gestao/empresas/dashboard" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
    <Route path="/gestao/empresas/receitas" element={<ProtectedPage><ReceitasEmpresariais /></ProtectedPage>} />
    <Route path="/gestao/empresas/arquivos" element={<ProtectedPage><ArquivosEmpresariais /></ProtectedPage>} />
    <Route path="/gestao/empresas/rh" element={<ProtectedPage><RHFuncionarios /></ProtectedPage>} />
  </>
);
