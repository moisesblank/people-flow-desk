// ============================================
// 🔄 ROTAS LEGADAS (COMPATIBILIDADE)
// Mantidas para não quebrar links antigos
// ============================================

import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedPage } from "./routeHelpers";

// Core
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
const CursoDetalhe = lazy(() => import("@/pages/CursoDetalhe"));
const Aula = lazy(() => import("@/pages/Aula"));
const Simulados = lazy(() => import("@/pages/Simulados"));
const Lives = lazy(() => import("@/pages/Lives"));

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

export const legacyRoutes = (
  <>
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
  </>
);
