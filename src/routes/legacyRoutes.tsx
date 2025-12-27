// ============================================
// 🔄 ROTAS LEGADAS v2.0 (MIGRADAS)
// Rotas antigas redirecionam para / (PRO)
// /gestaofc é SECRETO - não existe alias
// ============================================

import { Route, Navigate } from "react-router-dom";

// ============================================
// COMPONENTE: Redirect silencioso para home
// Não expõe /gestaofc, apenas redireciona para /
// ============================================
const LegacyRedirect = () => <Navigate to="/" replace />;

// ============================================
// ROTAS LEGADAS - TODAS redirecionam para /
// Nenhuma rota legada de gestão funciona mais
// /gestaofc é o único ponto de entrada (secreto)
// ============================================
export const legacyRoutes = (
  <>
    {/* === ROTAS DE GESTÃO ANTIGAS → REDIRECT PARA HOME === */}
    {/* Essas rotas NÃO levam para /gestaofc - são silenciadas */}
    <Route path="/app" element={<LegacyRedirect />} />
    <Route path="/dashboard" element={<LegacyRedirect />} />
    <Route path="/dashboard-executivo" element={<LegacyRedirect />} />
    <Route path="/tarefas" element={<LegacyRedirect />} />
    <Route path="/funcionarios" element={<LegacyRedirect />} />
    <Route path="/calendario" element={<LegacyRedirect />} />
    <Route path="/integracoes" element={<LegacyRedirect />} />
    <Route path="/documentos" element={<LegacyRedirect />} />
    <Route path="/perfil" element={<LegacyRedirect />} />
    <Route path="/guia" element={<LegacyRedirect />} />
    <Route path="/marketing" element={<LegacyRedirect />} />
    <Route path="/lancamento" element={<LegacyRedirect />} />
    <Route path="/metricas" element={<LegacyRedirect />} />
    <Route path="/arquivos" element={<LegacyRedirect />} />
    <Route path="/leads-whatsapp" element={<LegacyRedirect />} />
    <Route path="/area-professor" element={<LegacyRedirect />} />
    <Route path="/planejamento-aula" element={<LegacyRedirect />} />
    <Route path="/laboratorio" element={<LegacyRedirect />} />
    <Route path="/turmas-online" element={<LegacyRedirect />} />
    <Route path="/turmas-presenciais" element={<LegacyRedirect />} />
    <Route path="/cursos" element={<LegacyRedirect />} />
    <Route path="/cursos/:courseId" element={<LegacyRedirect />} />
    <Route path="/cursos/:courseId/aula/:lessonId" element={<LegacyRedirect />} />
    <Route path="/simulados" element={<LegacyRedirect />} />
    <Route path="/lives" element={<LegacyRedirect />} />
    <Route path="/entradas" element={<LegacyRedirect />} />
    <Route path="/financas-empresa" element={<LegacyRedirect />} />
    <Route path="/financas-pessoais" element={<LegacyRedirect />} />
    <Route path="/pagamentos" element={<LegacyRedirect />} />
    <Route path="/contabilidade" element={<LegacyRedirect />} />
    <Route path="/transacoes-hotmart" element={<LegacyRedirect />} />
    <Route path="/gestao-alunos" element={<LegacyRedirect />} />
    <Route path="/portal-aluno" element={<LegacyRedirect />} />
    <Route path="/relatorios" element={<LegacyRedirect />} />
    <Route path="/afiliados" element={<LegacyRedirect />} />
    <Route path="/permissoes" element={<LegacyRedirect />} />
    <Route path="/configuracoes" element={<LegacyRedirect />} />
    <Route path="/gestao-equipe" element={<LegacyRedirect />} />
    <Route path="/gestao-site" element={<LegacyRedirect />} />
    <Route path="/gestao-dispositivos" element={<LegacyRedirect />} />
    <Route path="/auditoria-acessos" element={<LegacyRedirect />} />
    <Route path="/central-monitoramento" element={<LegacyRedirect />} />
    <Route path="/monitoramento" element={<LegacyRedirect />} />
    <Route path="/central-whatsapp" element={<LegacyRedirect />} />
    <Route path="/whatsapp-live" element={<LegacyRedirect />} />
    <Route path="/diagnostico-whatsapp" element={<LegacyRedirect />} />
    <Route path="/diagnostico-webhooks" element={<LegacyRedirect />} />
    <Route path="/central-metricas" element={<LegacyRedirect />} />
    <Route path="/central-ias" element={<LegacyRedirect />} />
    <Route path="/site-programador" element={<LegacyRedirect />} />
    <Route path="/central-diagnostico" element={<LegacyRedirect />} />
    <Route path="/vida-pessoal" element={<LegacyRedirect />} />
    <Route path="/pessoal" element={<LegacyRedirect />} />
    <Route path="/empresas/dashboard" element={<LegacyRedirect />} />
    <Route path="/empresas/receitas" element={<LegacyRedirect />} />
    <Route path="/empresas/arquivos" element={<LegacyRedirect />} />
    <Route path="/empresas/rh" element={<LegacyRedirect />} />
    
    {/* === ALIASES PROIBIDOS → REDIRECT PARA HOME === */}
    {/* Esses paths NUNCA podem levar ao gestão */}
    <Route path="/gestao" element={<LegacyRedirect />} />
    <Route path="/gestao/*" element={<LegacyRedirect />} />
    <Route path="/admin" element={<LegacyRedirect />} />
    <Route path="/admin/*" element={<LegacyRedirect />} />
    <Route path="/backoffice" element={<LegacyRedirect />} />
    <Route path="/backoffice/*" element={<LegacyRedirect />} />
    <Route path="/staff" element={<LegacyRedirect />} />
    <Route path="/staff/*" element={<LegacyRedirect />} />
    <Route path="/painel" element={<LegacyRedirect />} />
    <Route path="/painel/*" element={<LegacyRedirect />} />
  </>
);
