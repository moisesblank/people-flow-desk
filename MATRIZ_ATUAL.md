# 🧬 MATRIZ SAGRADA - PLATAFORMA MOISÉS MEDEIROS
## Inventário Completo do Sistema
## Versão 1.0 | Criado em: 22/12/2025

---

# 🔒 REGRA DE OURO

```
╔══════════════════════════════════════════════════════════════╗
║  ❌ NÃO REMOVE    ❌ NÃO PIORA    ✅ SÓ MELHORA             ║
║  ✅ SÓ ADAPTA     ✅ SÓ EVOLUI    ✅ O QUE EXISTE É SAGRADO ║
╚══════════════════════════════════════════════════════════════╝
```

---

# 📊 RESUMO EXECUTIVO

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| **Páginas** | 65+ | ✅ Funcionando |
| **Componentes** | 49 pastas | ✅ Funcionando |
| **Edge Functions** | 55 | ✅ Prontas |
| **Migrações SQL** | 178 | ✅ Aplicadas |
| **Arquivos Total** | 883 | ✅ |
| **Arquivos TS/TSX** | 585 | ✅ |

---

# 📄 PÁGINAS DO SISTEMA (65+)

## 🌐 Páginas Públicas (Sem Login)

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Home | `Home.tsx` | `/` | Página inicial |
| Landing Page | `LandingPage.tsx` | `/site` | Site de vendas |
| Login/Cadastro | `Auth.tsx` | `/auth` | Autenticação |
| Termos de Uso | `TermosDeUso.tsx` | `/termos` | Termos legais |
| Política Privacidade | `PoliticaPrivacidade.tsx` | `/privacidade` | LGPD |
| Área Gratuita | `AreaGratuita.tsx` | `/area-gratuita` | Conteúdo free |

## 📊 Dashboard e Visão Geral

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Dashboard Principal | `Dashboard.tsx` | `/dashboard` | Centro de comando |
| Dashboard Executivo | `DashboardExecutivo.tsx` | `/dashboard-executivo` | Visão estratégica |
| Monitoramento | `Monitoramento.tsx` | `/monitoramento` | Status do sistema |
| Central Monitoramento | `CentralMonitoramento.tsx` | `/central-monitoramento` | Hub de monitoramento |
| Central Métricas | `CentralMetricas.tsx` | `/central-metricas` | Métricas unificadas |

## 💰 Financeiro

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Finanças Empresa | `FinancasEmpresa.tsx` | `/financas-empresa` | Gestão financeira empresa |
| Finanças Pessoais | `FinancasPessoais.tsx` | `/financas-pessoais` | Gestão financeira pessoal |
| Entradas | `Entradas.tsx` | `/entradas` | Receitas |
| Pagamentos | `Pagamentos.tsx` | `/pagamentos` | Controle de pagamentos |
| Contabilidade | `Contabilidade.tsx` | `/contabilidade` | Documentos contábeis |
| Transações Hotmart | `TransacoesHotmart.tsx` | `/transacoes-hotmart` | Vendas Hotmart |

## 👥 Gestão de Pessoas

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Funcionários | `Funcionarios.tsx` | `/funcionarios` | CRUD funcionários |
| Gestão Equipe | `GestaoEquipe.tsx` | `/gestao-equipe` | Visão da equipe |
| Afiliados | `Afiliados.tsx` | `/afiliados` | Gestão de afiliados |
| Permissões | `Permissoes.tsx` | `/permissoes` | Controle de acesso |
| RH Funcionários | `empresas/RHFuncionarios.tsx` | `/empresas/rh` | Recursos humanos |

## 👨‍🎓 Gestão de Alunos (Admin)

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Alunos | `Alunos.tsx` | `/gestao-alunos` | CRUD alunos |
| Alunos Route Switcher | `AlunosRouteSwitcher.tsx` | `/alunos` | Roteador inteligente |

## 📚 Central do Aluno (Portal Educacional)

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Dashboard Aluno | `aluno/AlunoDashboard.tsx` | `/alunos/dashboard` | Painel do aluno |
| Videoaulas | `aluno/AlunoVideoaulas.tsx` | `/alunos/videoaulas` | Aulas em vídeo |
| Questões | `aluno/AlunoQuestoes.tsx` | `/alunos/questoes` | Banco de questões |
| Simulados | `aluno/AlunoSimulados.tsx` | `/alunos/simulados` | Simulados ENEM |
| Ranking | `RankingPage.tsx` | `/alunos/ranking` | Gamificação |
| Tabela Periódica | `aluno/AlunoTabelaPeriodica.tsx` | `/alunos/tabela-periodica` | Tabela interativa |
| Flashcards | `FlashcardsPage.tsx` | `/alunos/flashcards` | Cartões de estudo |
| Perfil Aluno | `ProfilePage.tsx` | `/alunos/perfil` | Perfil do aluno |
| Cronograma | `aluno/AlunoPlaceholders.tsx` | `/alunos/cronograma` | Planejamento |
| Materiais | `aluno/AlunoPlaceholders.tsx` | `/alunos/materiais` | Downloads |
| Resumos | `aluno/AlunoPlaceholders.tsx` | `/alunos/resumos` | Resumos teóricos |
| Mapas Mentais | `aluno/AlunoPlaceholders.tsx` | `/alunos/mapas-mentais` | Mapas visuais |
| Redação | `aluno/AlunoPlaceholders.tsx` | `/alunos/redacao` | Redação ENEM |
| Desempenho | `aluno/AlunoPlaceholders.tsx` | `/alunos/desempenho` | Estatísticas |
| Conquistas | `aluno/AlunoPlaceholders.tsx` | `/alunos/conquistas` | Achievements |
| Tutoria | `aluno/AlunoPlaceholders.tsx` | `/alunos/tutoria` | Suporte IA/Humano |
| Fórum | `aluno/AlunoPlaceholders.tsx` | `/alunos/forum` | Comunidade |
| Lives | `aluno/AlunoPlaceholders.tsx` | `/alunos/lives` | Aulas ao vivo |
| Dúvidas | `aluno/AlunoPlaceholders.tsx` | `/alunos/duvidas` | Perguntas |
| Revisão | `aluno/AlunoPlaceholders.tsx` | `/alunos/revisao` | Revisão espaçada |
| Laboratório | `aluno/AlunoPlaceholders.tsx` | `/alunos/laboratorio` | Lab virtual |
| Calculadora | `aluno/AlunoPlaceholders.tsx` | `/alunos/calculadora` | Calc científica |
| Metas | `aluno/AlunoPlaceholders.tsx` | `/alunos/metas` | Objetivos |
| Agenda | `aluno/AlunoPlaceholders.tsx` | `/alunos/agenda` | Calendário pessoal |
| Certificados | `aluno/AlunoPlaceholders.tsx` | `/alunos/certificados` | Certificações |

## 👨‍🏫 Área do Professor

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Área Professor | `AreaProfessor.tsx` | `/area-professor` | Painel do professor |
| Portal Aluno (visão prof) | `PortalAluno.tsx` | `/portal-aluno` | Ver como aluno |
| Planejamento Aula | `PlanejamentoAula.tsx` | `/planejamento-aula` | Planejar aulas |
| Cursos | `Cursos.tsx` | `/cursos` | Lista de cursos |
| Curso Detalhe | `CursoDetalhe.tsx` | `/cursos/:courseId` | Detalhes do curso |
| Aula | `Aula.tsx` | `/cursos/:courseId/aula/:lessonId` | Player de aula |
| Simulados (gestão) | `Simulados.tsx` | `/simulados` | Criar simulados |
| Laboratório | `Laboratorio.tsx` | `/laboratorio` | Experimentos |
| Lives | `Lives.tsx` | `/lives` | Gerenciar lives |
| Turmas Online | `TurmasOnline.tsx` | `/turmas-online` | Turmas EAD |
| Turmas Presenciais | `TurmasPresenciais.tsx` | `/turmas-presenciais` | Turmas presenciais |

## 📅 Produtividade

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Calendário | `Calendario.tsx` | `/calendario` | Agenda |
| Tarefas | `Tarefas.tsx` | `/tarefas` | To-do list |
| Vida Pessoal | `VidaPessoal.tsx` | `/vida-pessoal` | Organização pessoal |
| Pessoal | `Pessoal.tsx` | `/pessoal` | Dados pessoais |

## 📁 Arquivos e Documentos

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Arquivos | `Arquivos.tsx` | `/arquivos` | Gestão de arquivos |
| Documentos | `Documentos.tsx` | `/documentos` | Documentos |
| Arquivos Empresariais | `empresas/ArquivosEmpresariais.tsx` | `/empresas/arquivos` | Docs empresa |

## 📈 Marketing e Vendas

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Marketing | `Marketing.tsx` | `/marketing` | Campanhas |
| Lançamento | `Lancamento.tsx` | `/lancamento` | Lançamentos |
| Métricas | `Metricas.tsx` | `/metricas` | Analytics |
| Relatórios | `Relatorios.tsx` | `/relatorios` | Reports |

## 💬 WhatsApp

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Central WhatsApp | `CentralWhatsApp.tsx` | `/central-whatsapp` | Hub WhatsApp |
| Leads WhatsApp | `LeadsWhatsApp.tsx` | `/leads-whatsapp` | Leads captados |
| WhatsApp Live | `WhatsAppLive.tsx` | `/whatsapp-live` | Chat ao vivo |
| Diagnóstico WhatsApp | `DiagnosticoWhatsApp.tsx` | `/diagnostico-whatsapp` | Debug |

## 🔧 Configurações e Sistema

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Configurações | `Configuracoes.tsx` | `/configuracoes` | Settings |
| Integrações | `Integracoes.tsx` | `/integracoes` | Webhooks/APIs |
| Gestão Site | `GestaoSite.tsx` | `/gestao-site` | CMS |
| Site Programador | `SiteProgramador.tsx` | `/site-programador` | Dev tools |
| Guia | `Guia.tsx` | `/guia` | Tutorial |
| Perfil | `Perfil.tsx` | `/perfil` | Perfil usuário |
| Gestão Dispositivos | `GestaoDispositivos.tsx` | `/gestao-dispositivos` | Segurança |

## 🤖 Inteligência Artificial

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Central IAs | `CentralIAs.tsx` | `/central-ias` | Hub de IAs |

## 🔍 Diagnóstico e Auditoria

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Diagnóstico Webhooks | `DiagnosticoWebhooks.tsx` | `/diagnostico-webhooks` | Debug webhooks |
| Auditoria Acessos | `AuditoriaAcessos.tsx` | `/auditoria-acessos` | Logs de acesso |

## 🏢 Empresarial

| Página | Arquivo | Rota | Descrição |
|--------|---------|------|-----------|
| Dashboard Empresa | Redirecionado | `/empresas/dashboard` | → FinancasEmpresa |
| Receitas Empresariais | `empresas/ReceitasEmpresariais.tsx` | `/empresas/receitas` | Faturamento |

---

# 📦 COMPONENTES (49 Pastas)

## 🎨 UI Base (shadcn/ui)
| Pasta | Componentes |
|-------|-------------|
| `ui/` | Button, Input, Card, Dialog, Toast, etc. |

## 🏠 Layout
| Pasta | Descrição |
|-------|-----------|
| `layout/` | AppLayout, Sidebar, Header, RoleProtectedRoute |

## 🔐 Segurança
| Pasta | Descrição |
|-------|-----------|
| `security/` | SessionGuard, DeviceGuard |
| `auth/` | Componentes de autenticação |

## 📊 Dashboard
| Pasta | Descrição |
|-------|-----------|
| `dashboard/` | Cards, Gráficos, Widgets |

## 🤖 Inteligência Artificial
| Pasta | Descrição |
|-------|-----------|
| `ai/` | AITramonGlobal, Chat IA |

## 👨‍🎓 Aluno
| Pasta | Descrição |
|-------|-----------|
| `aluno/` | Componentes do portal |
| `students/` | Gestão de alunos |
| `gamification/` | XP, Conquistas, Ranking |
| `lms/` | Learning Management System |

## 💰 Financeiro
| Pasta | Descrição |
|-------|-----------|
| `finance/` | Componentes financeiros |

## 📅 Calendário/Tarefas
| Pasta | Descrição |
|-------|-----------|
| `calendar/` | Calendário, Eventos |
| `tasks/` | Tarefas, Checklists |
| `checklists/` | Listas de verificação |

## 👥 Equipe
| Pasta | Descrição |
|-------|-----------|
| `employees/` | Funcionários |
| `affiliates/` | Afiliados |

## 📺 Mídia
| Pasta | Descrição |
|-------|-----------|
| `video/` | Player de vídeo |
| `player/` | Player avançado |
| `youtube/` | Integração YouTube |

## 💬 Comunicação
| Pasta | Descrição |
|-------|-----------|
| `chat/` | Sistema de chat |
| `whatsapp/` | Integração WhatsApp |
| `forum/` | Fórum/Comunidade |

## 🔧 Utilitários
| Pasta | Descrição |
|-------|-----------|
| `admin/` | Ferramentas admin |
| `editor/` | GodMode, Visual Edit |
| `settings/` | Configurações |
| `onboarding/` | Tour, Atalhos |
| `performance/` | Otimizações |
| `reactive/` | Componentes reativos |
| `mobile/` | Responsividade |
| `attachments/` | Anexos |
| `documents/` | Documentos |

## 🧪 Química
| Pasta | Descrição |
|-------|-----------|
| `chemistry/` | Tabela Periódica, Moléculas |

## 📈 Marketing
| Pasta | Descrição |
|-------|-----------|
| `marketing/` | Campanhas, Métricas |
| `landing/` | Landing pages |

## 🔗 Integrações
| Pasta | Descrição |
|-------|-----------|
| `integrations/` | Webhooks, APIs |

## 📊 Planilhas
| Pasta | Descrição |
|-------|-----------|
| `livesheet/` | Planilhas em tempo real |

## Componentes Standalone

| Arquivo | Descrição |
|---------|-----------|
| `Calculator.tsx` | Calculadora científica |
| `PeriodicTable.tsx` | Tabela periódica completa |
| `GlobalSearch.tsx` | Busca global |
| `FileUpload.tsx` | Upload de arquivos |
| `LiveChat.tsx` | Chat ao vivo |
| `ErrorBoundary.tsx` | Tratamento de erros |
| `VirtualList.tsx` | Lista virtualizada |
| `OptimizedImage.tsx` | Imagens otimizadas |

---

# ⚡ EDGE FUNCTIONS (55)

## 🤖 Inteligência Artificial
| Função | Descrição |
|--------|-----------|
| `ai-assistant` | Assistente IA geral |
| `ai-tramon` | IA especializada TRAMON |
| `ai-tutor` | Tutor IA para alunos |
| `chat-tramon` | Chat com IA |
| `ia-gateway` | Gateway unificado |
| `generate-ai-content` | Geração de conteúdo |
| `generate-context` | Geração de contexto |

## 🔥 Hotmart
| Função | Descrição |
|--------|-----------|
| `hotmart-fast` | Processamento rápido |
| `hotmart-webhook-processor` | Processador webhook |
| `webhook-curso-quimica` | Webhook principal |
| `c-handle-refund` | Reembolsos |

## 📱 Redes Sociais
| Função | Descrição |
|--------|-----------|
| `youtube-api` | API YouTube |
| `youtube-sync` | Sincronização |
| `youtube-live` | Lives |
| `instagram-sync` | Instagram |
| `tiktok-sync` | TikTok |
| `facebook-ads-sync` | Facebook Ads |
| `social-media-stats` | Estatísticas |

## 📧 Comunicação
| Função | Descrição |
|--------|-----------|
| `send-email` | Envio de emails |
| `send-notification-email` | Notificações |
| `send-report` | Relatórios |
| `send-weekly-report` | Relatório semanal |
| `generate-weekly-report` | Gerar relatório |
| `whatsapp-webhook` | Webhook WhatsApp |
| `notify-owner` | Notificar dono |
| `task-reminder` | Lembrete de tarefas |

## 🔐 Segurança
| Função | Descrição |
|--------|-----------|
| `send-2fa-code` | Envio 2FA |
| `verify-2fa-code` | Verificação 2FA |
| `secure-api-proxy` | Proxy seguro |
| `secure-video-url` | URLs seguras |
| `rate-limit-gateway` | Rate limiting |

## 🔧 Sistema
| Função | Descrição |
|--------|-----------|
| `api-fast` | API rápida |
| `api-gateway` | Gateway API |
| `backup-data` | Backup |
| `orchestrator` | Orquestrador |
| `queue-worker` | Worker de filas |
| `event-router` | Roteador eventos |
| `automacoes` | Automações |
| `check-vencimentos` | Vencimentos |

## 📚 Educacional
| Função | Descrição |
|--------|-----------|
| `reschedule-flashcard` | Reagendar flashcards |
| `atualizar-status-alunos` | Status alunos |

## 🔗 WordPress
| Função | Descrição |
|--------|-----------|
| `wordpress-api` | API WP |
| `wordpress-webhook` | Webhook WP |
| `sync-wordpress-users` | Sync usuários |

## 📄 Documentos
| Função | Descrição |
|--------|-----------|
| `extract-document` | Extrair docs |
| `ocr-receipt` | OCR recibos |
| `get-panda-signed-url` | URLs Panda |

## 🎮 Gamificação
| Função | Descrição |
|--------|-----------|
| `c-grant-xp` | Conceder XP |
| `c-create-beta-user` | Usuário beta |

## 📊 Relatórios
| Função | Descrição |
|--------|-----------|
| `reports-api` | API relatórios |
| `google-analytics-sync` | Sync GA |
| `google-calendar` | Google Calendar |

## 🔄 Webhooks
| Função | Descrição |
|--------|-----------|
| `webhook-handler` | Handler geral |
| `webhook-receiver` | Receptor |
| `invite-employee` | Convidar funcionário |

---

# 🔐 CONTEXTS (Providers)

| Context | Arquivo | Função |
|---------|---------|--------|
| `AuthProvider` | `hooks/useAuth` | Autenticação |
| `GodModeProvider` | `contexts/GodModeContext` | Modo edição |
| `DuplicationClipboardProvider` | `contexts/DuplicationClipboardContext` | Clipboard |
| `ReactiveFinanceProvider` | `contexts/ReactiveFinanceContext` | Finanças reativas |
| `LiveSheetProvider` | `contexts/LiveSheetContext` | Planilhas live |

---

# 🛡️ SISTEMA DE SEGURANÇA

## Guardas Ativos
| Guarda | Função |
|--------|--------|
| `SessionGuard` | Sessão única por usuário |
| `DeviceGuard` | Limite de dispositivos |
| `RoleProtectedRoute` | Proteção por role |

## Features de Segurança
- ✅ RLS em todas as tabelas
- ✅ 2FA disponível
- ✅ Bloqueio DevTools
- ✅ Sessão única
- ✅ Limite de dispositivos
- ✅ Auditoria de acessos

---

# ⚡ SISTEMA DE PERFORMANCE

## Dogmas Implementados
| Dogma | Descrição |
|-------|-----------|
| I | Ultra-fast loading - CSS only |
| III | Lazy loading de todas as páginas |
| V | QueryClient com cache sagrado |
| VII | SSG candidates para públicas |
| VIII | Heavy components deferred |
| XI | Controle de dispositivos |

## Configs
- Max First Paint: 50ms
- Max Interactive: 150ms
- Max API Response: 100ms
- Cache Stale Time: 30s

---

# 📊 ESTATÍSTICAS FINAIS

| Métrica | Valor |
|---------|-------|
| **Linhas de código (estimado)** | 100.000+ |
| **Páginas funcionais** | 65+ |
| **Componentes** | 200+ |
| **Edge Functions** | 55 |
| **Migrações SQL** | 178 |
| **Integrações** | 15+ |
| **Anos de desenvolvimento** | ~2 |

---

# 📝 NOTAS

1. Placeholders em `aluno/AlunoPlaceholders.tsx` precisam ser implementados
2. Algumas páginas empresariais foram consolidadas em `FinancasEmpresa`
3. Sistema de gamificação (XP, conquistas) está ativo
4. IA TRAMON está integrada globalmente

---

*MATRIZ SAGRADA v1.0*
*Criada pelo MESTRE em 22/12/2025*
*O QUE EXISTE É SAGRADO - NÃO PIORA, SÓ MELHORA*
