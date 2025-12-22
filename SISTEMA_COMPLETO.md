# 🧠 SISTEMA MOISÉS MEDEIROS - DOCUMENTAÇÃO MASTER
## Plataforma de Gestão Educacional - Curso de Química
## Versão 9.0 | Atualizado em: 22/12/2025

---

# 📋 ÍNDICE

1. [Resumo Executivo](#-resumo-executivo)
2. [Infraestrutura Cloud](#-infraestrutura-cloud)
3. [Banco de Dados](#-banco-de-dados)
4. [Edge Functions](#-edge-functions-54-funções)
5. [Armazenamento](#-armazenamento)
6. [Dados em Produção](#-dados-em-produção)
7. [Secrets Configurados](#-secrets-configurados-32-chaves)
8. [Sistema de Performance](#-sistema-de-performance)
9. [Frontend](#-frontend)
10. [Integrações](#-integrações)
11. [Capacidade e Limites](#-capacidade-e-limites)
12. [Como Usar](#-como-usar)
13. [Próximos Passos](#-próximos-passos)

---

# 🎯 RESUMO EXECUTIVO

## O Que É Este Sistema

Uma **plataforma completa de gestão** para o Curso de Química do Professor Moisés Medeiros, integrando:

- ✅ **Dashboard de gestão** - Visão 360° do negócio
- ✅ **Área do aluno** - Portal educacional
- ✅ **Automações** - Webhooks, IA, notificações
- ✅ **Finanças** - Controle total de receitas e despesas
- ✅ **Marketing** - Métricas de redes sociais integradas
- ✅ **Gamificação** - Sistema de XP e conquistas

## Dados do Proprietário

| Campo | Valor |
|-------|-------|
| **Nome** | Professor Moisés Medeiros |
| **Email** | moisesblank@gmail.com |
| **Empresa 1** | MMM CURSO DE QUÍMICA LTDA (CNPJ: 53.829.761/0001-17) |
| **Empresa 2** | CURSO QUÍMICA MOISES MEDEIROS (CNPJ: 44.979.308/0001-04) |
| **Domínio Principal** | moisesmedeiros.com.br |
| **Área do Aluno Atual** | app.moisesmedeiros.com.br (WordPress) |

---

# 🖥️ INFRAESTRUTURA CLOUD

## Lovable Cloud - Configuração

| Parâmetro | Valor |
|-----------|-------|
| **ID do Projeto** | `fyikfsasudgzsjmumdlw` |
| **Região** | AWS São Paulo (sa-east-1) |
| **Nível Ativo** | `ci_xlarge` (4 vCPU, 8GB RAM) |
| **Ativo Desde** | 20/12/2025 |
| **Status** | ✅ Ativo e operacional |
| **CDN** | Cloudflare ativo |
| **SSL** | Automático |

## URLs Base

```
Frontend:     https://lovable.dev/projects/fyikfsasudgzsjmumdlw
Supabase:     https://fyikfsasudgzsjmumdlw.supabase.co
Edge Funcs:   https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/
```

---

# 💾 BANCO DE DADOS

## PostgreSQL - Métricas Gerais

| Métrica | Valor |
|---------|-------|
| **Total de Tabelas** | 30+ tabelas ativas |
| **Funções SQL** | 119 funções |
| **Gatilhos Ativos** | 70+ triggers |
| **Índices** | 20+ índices otimizados |
| **Espaço Disponível** | 8 GB |
| **Espaço Usado** | ~27 MB (0.3%) |

## Top 5 Tabelas por Tamanho

| Tabela | Tamanho Total | Índices |
|--------|---------------|---------|
| `audit_logs` | 7,9 MB | 864 KB |
| `user_sessions` | 1,5 MB | 840 KB |
| `activity_logs` | 1,4 MB | 944 KB |
| `calendar_tasks` | 328 KB | 128 KB |
| `alunos` | 296 KB | 240 KB |

## Tabelas Principais (por Categoria)

### 👤 Usuários e Autenticação
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `profiles` | Perfis de usuários | ✅ |
| `user_roles` | Papéis (owner, admin, employee) | ✅ |
| `user_sessions` | Sessões ativas | ✅ |

### 👨‍🎓 Educacional
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `alunos` | Cadastro de alunos | ✅ |
| `flashcards` | Sistema de flashcards | ✅ |
| `questoes` | Banco de questões | ✅ |
| `simulados` | Simulados | ✅ |
| `conquistas` | Sistema de conquistas | ✅ |

### 💰 Financeiro
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `transacoes_hotmart_completo` | Transações Hotmart | ✅ |
| `company_fixed_expenses` | Gastos fixos empresa | ✅ |
| `company_extra_expenses` | Gastos extras empresa | ✅ |
| `income` | Receitas | ✅ |
| `comissoes` | Comissões de afiliados | ✅ |

### 👥 Equipe
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `employees` | Funcionários | ✅ |
| `calendar_tasks` | Tarefas do calendário | ✅ |
| `payments` | Pagamentos | ✅ |

### 📊 Analytics e Logs
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `audit_logs` | Logs de auditoria | ✅ |
| `activity_logs` | Logs de atividade | ✅ |
| `synapse_transactions` | Transações em tempo real | ✅ |
| `synapse_metrics` | Métricas agregadas | ✅ |

---

# ⚡ EDGE FUNCTIONS (54 Funções)

## Lista Completa de Funções Serverless

### 🤖 Inteligência Artificial
| Função | Descrição |
|--------|-----------|
| `ai-assistant` | Assistente IA geral |
| `ai-tramon` | IA especializada TRAMON |
| `ai-tutor` | Tutor IA para alunos |
| `chat-tramon` | Chat com IA TRAMON |
| `ia-gateway` | Gateway unificado de IA |
| `generate-ai-content` | Geração de conteúdo IA |
| `generate-context` | Geração de contexto |

### 🔥 Hotmart
| Função | Descrição |
|--------|-----------|
| `hotmart-fast` | Processamento rápido Hotmart |
| `hotmart-webhook-processor` | Processador de webhooks |
| `webhook-curso-quimica` | Webhook principal do curso |

### 📱 Redes Sociais
| Função | Descrição |
|--------|-----------|
| `youtube-api` | API do YouTube |
| `youtube-sync` | Sincronização YouTube |
| `youtube-live` | Lives do YouTube |
| `instagram-sync` | Sincronização Instagram |
| `tiktok-sync` | Sincronização TikTok |
| `facebook-ads-sync` | Sincronização Facebook Ads |
| `social-media-stats` | Estatísticas consolidadas |

### 📧 Comunicação
| Função | Descrição |
|--------|-----------|
| `send-email` | Envio de emails |
| `send-notification-email` | Emails de notificação |
| `send-report` | Envio de relatórios |
| `send-weekly-report` | Relatório semanal |
| `whatsapp-webhook` | Webhook WhatsApp |
| `notify-owner` | Notificar proprietário |
| `task-reminder` | Lembrete de tarefas |

### 🔐 Segurança
| Função | Descrição |
|--------|-----------|
| `send-2fa-code` | Envio código 2FA |
| `verify-2fa-code` | Verificação 2FA |
| `secure-api-proxy` | Proxy seguro de API |
| `secure-video-url` | URLs seguras de vídeo |
| `rate-limit-gateway` | Gateway de rate limiting |

### 🔧 Sistema
| Função | Descrição |
|--------|-----------|
| `api-fast` | API rápida |
| `api-gateway` | Gateway de API |
| `backup-data` | Backup de dados |
| `orchestrator` | Orquestrador de processos |
| `queue-worker` | Worker de filas |
| `event-router` | Roteador de eventos |
| `automacoes` | Automações gerais |

### 📚 Educacional
| Função | Descrição |
|--------|-----------|
| `reschedule-flashcard` | Reagendamento de flashcards |
| `atualizar-status-alunos` | Atualização de status |
| `check-vencimentos` | Verificar vencimentos |

### 🔗 WordPress
| Função | Descrição |
|--------|-----------|
| `wordpress-api` | API WordPress |
| `wordpress-webhook` | Webhook WordPress |
| `sync-wordpress-users` | Sincronização de usuários |

### 📄 Documentos
| Função | Descrição |
|--------|-----------|
| `extract-document` | Extração de documentos |
| `ocr-receipt` | OCR de recibos |
| `get-panda-signed-url` | URLs assinadas Panda |

### 🎮 Gamificação
| Função | Descrição |
|--------|-----------|
| `c-grant-xp` | Conceder XP |
| `c-create-beta-user` | Criar usuário beta |
| `c-handle-refund` | Tratar reembolsos |

### 📊 Relatórios
| Função | Descrição |
|--------|-----------|
| `reports-api` | API de relatórios |
| `generate-weekly-report` | Gerar relatório semanal |
| `google-analytics-sync` | Sincronização GA |
| `google-calendar` | Integração Google Calendar |

### 🔄 Webhooks
| Função | Descrição |
|--------|-----------|
| `webhook-handler` | Handler de webhooks |
| `webhook-receiver` | Receptor de webhooks |
| `invite-employee` | Convidar funcionário |

---

# 📁 ARMAZENAMENTO

## Storage (Arquivos)

| Bucket | Arquivos | Tamanho |
|--------|----------|---------|
| `arquivos` | 32 | 66 MB |
| `documentos` | 7 | 7,6 MB |
| **TOTAL** | **39 arquivos** | **~74 MB** |

## Capacidade

| Recurso | Disponível | Usado | % |
|---------|------------|-------|---|
| Storage | 100 GB | 74 MB | 0.07% |

---

# 👥 DADOS EM PRODUÇÃO

## Entidades Cadastradas

| Entidade | Quantidade |
|----------|------------|
| **Alunos** | 31 |
| **Funcionários** | 2 |
| **Afiliados** | 1 |
| **Usuários (perfis)** | 7 |
| **Transações Hotmart** | 0 (aguardando integração) |
| **Logs de Atividade** | 2.025 |
| **Sessões Registradas** | 1.197 |
| **Webhooks Pendentes** | 4 |

---

# 🔐 SECRETS CONFIGURADOS (32 Chaves)

## Por Categoria

### 🤖 Inteligência Artificial
| Secret | Status |
|--------|--------|
| `OPENAI_API_KEY` | ✅ Configurado |
| `ELEVENLABS_API_KEY` | ✅ Configurado |
| `LOVABLE_API_KEY` | ✅ Configurado |

### 🔥 Hotmart
| Secret | Status |
|--------|--------|
| `HOTMART_CLIENT_ID` | ✅ Configurado |
| `HOTMART_CLIENT_SECRET` | ✅ Configurado |
| `HOTMART_HOTTOK` | ✅ Configurado |

### 📱 WhatsApp
| Secret | Status |
|--------|--------|
| `WHATSAPP_ACCESS_TOKEN` | ✅ Configurado |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ Configurado |
| `WHATSAPP_VERIFY_TOKEN` | ✅ Configurado |

### 📺 Mídias Sociais
| Secret | Status |
|--------|--------|
| `YOUTUBE_API_KEY` | ✅ Configurado |
| `FACEBOOK_ACCESS_TOKEN` | ✅ Configurado |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ✅ Configurado |

### 📝 WordPress
| Secret | Status |
|--------|--------|
| `WP_API_URL` | ✅ Configurado |
| `WP_API_TOKEN` | ✅ Configurado |

### 🏗️ Infraestrutura
| Secret | Status |
|--------|--------|
| `CLOUDFLARE_*` | ✅ Configurado |
| `CPANEL_*` | ✅ Configurado |
| `REGISTROBR_*` | ✅ Configurado |

### 🔗 APIs Externas
| Secret | Status |
|--------|--------|
| `PANDA_API_KEY` | ✅ Configurado |
| `RESEND_API_KEY` | ✅ Configurado |
| `FIRECRAWL_API_KEY` | ✅ Configurado |

---

# 🚀 SISTEMA DE PERFORMANCE

## Configuração Gospel v3.0

| Configuração | Valor |
|--------------|-------|
| **Max First Paint** | 50ms |
| **Max Interactive** | 150ms |
| **Resposta máxima API** | 100ms |
| **Cache stale time** | 30 segundos |
| **Quantum Cache Size** | 200 itens |
| **Prefetch Distance** | 800px |
| **Max Query Time** | 25ms |

## Tiers de Performance

| Tier | Score | Capacidades |
|------|-------|-------------|
| 🟣 **QUANTUM** | 110+ | WebGPU, HDR, 120 fps |
| 🔵 **NEURAL** | 85+ | Capacidades avançadas |
| 🟢 **ENHANCED** | 60+ | Otimizado |
| 🟡 **STANDARD** | 35+ | Normal |
| 🔴 **LEGACY** | <35 | Modo econômico |

---

# 🔄 TRIGGERS AUTOMÁTICOS

| Tabela | Triggers | Função |
|--------|----------|--------|
| `auth.users` | 3 | Criação de perfil/role |
| `company_fixed_expenses` | 2 | Calendário + alertas |
| `company_extra_expenses` | 2 | Calendário + alertas |
| `alunos` | 2 | Auditoria + números |
| `comissoes` | 2 | Auditoria + afiliados |
| `user_sessions` | 2 | Auditoria + atividade |
| `transacoes_hotmart_completo` | ✅ | Triggers ativos |

---

# 🎨 FRONTEND

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 19 | Framework principal |
| **Vite** | 6.x | Build tool |
| **TypeScript** | 5.x | Tipagem |
| **Tailwind CSS** | 4.x | Estilização |
| **shadcn/ui** | Latest | Componentes UI |
| **Framer Motion** | Latest | Animações |
| **Zustand** | Latest | Estado global |
| **React Query** | 5.x | Cache de dados |
| **Supabase JS** | 2.87+ | Cliente Supabase |

## Estrutura do Projeto

```
src/
├── App.tsx              # Componente principal
├── main.tsx             # Entry point
├── index.css            # Estilos globais
├── components/          # 38 pastas de componentes
│   ├── ui/              # Componentes shadcn/ui
│   ├── dashboard/       # Dashboard components
│   ├── alunos/          # Gestão de alunos
│   ├── financas/        # Financeiro
│   └── ...
├── pages/               # Páginas da aplicação
├── hooks/               # Custom hooks
├── contexts/            # React contexts
├── stores/              # Zustand stores
├── lib/                 # Utilitários
├── types/               # TypeScript types
├── integrations/        # Integrações (Supabase)
└── assets/              # Imagens e assets
```

## Páginas do Sistema (19+)

| Página | Rota | Acesso |
|--------|------|--------|
| Dashboard | `/` | Todos |
| Calendário | `/calendario` | Todos |
| Funcionários | `/funcionarios` | Admin/Owner |
| Pagamentos | `/pagamentos` | Admin/Owner |
| Finanças Pessoais | `/financas-pessoais` | Todos |
| Finanças Empresa | `/financas-empresa` | Admin/Owner |
| Entradas | `/entradas` | Admin/Owner |
| Afiliados | `/afiliados` | Admin/Owner |
| Alunos | `/alunos` | Admin/Owner |
| Contabilidade | `/contabilidade` | Admin/Owner |
| Relatórios | `/relatorios` | Admin/Owner |
| Gestão do Site | `/gestao-site` | Admin/Owner |
| Portal do Aluno | `/portal-aluno` | Alunos |
| Área do Professor | `/area-professor` | Owner |
| Gestão de Equipe | `/gestao-equipe` | Admin/Owner |
| Configurações | `/configuracoes` | Todos |
| Integrações | `/integracoes` | Owner |
| Guia | `/guia` | Todos |
| Auth | `/auth` | Público |

---

# 🔌 INTEGRAÇÕES

## URL do Webhook Principal

```
https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/webhook-curso-quimica
```

## Integrações Configuradas

| Plataforma | Status | Função |
|------------|--------|--------|
| 🔥 **Hotmart** | ✅ Pronto | Vendas, assinaturas, reembolsos |
| 💳 **Asaas** | ⚙️ Configurável | Pagamentos |
| 📱 **WhatsApp** | ✅ Pronto | Notificações, chatbot |
| 📺 **YouTube** | ✅ Pronto | Métricas, lives |
| 📸 **Instagram** | ✅ Pronto | Métricas |
| 🎵 **TikTok** | ✅ Pronto | Métricas |
| 📊 **Facebook Ads** | ✅ Pronto | Métricas de anúncios |
| 📈 **Google Analytics** | ✅ Pronto | Analytics |
| 📅 **Google Calendar** | ✅ Pronto | Agenda |
| 📝 **WordPress** | ✅ Pronto | Sincronização de usuários |
| 🤖 **OpenAI** | ✅ Pronto | IA |
| 🎤 **ElevenLabs** | ✅ Pronto | Áudio IA |
| 📧 **Resend** | ✅ Pronto | Emails |
| 🐼 **Panda Video** | ✅ Pronto | Vídeos protegidos |

---

# 📈 CAPACIDADE E LIMITES

## Estimativa de Capacidade

| Métrica | Estimativa |
|---------|------------|
| **Usuários Simultâneos** | ~5.000+ |
| **Requisições/segundo** | ~1.000+ |
| **Conexões DB** | Pool otimizado |
| **Cold Start Edge Function** | <100ms |
| **Cache CDN** | Cloudflare ativo |

## Uso Atual vs Disponível

| Recurso | Disponível | Em Uso | Livre |
|---------|------------|--------|-------|
| **Database** | 8 GB | 27 MB | 99.7% |
| **Storage** | 100 GB | 74 MB | 99.9% |
| **Tabelas** | Ilimitado | 30+ | ∞ |
| **Edge Functions** | Ilimitado | 54 | ∞ |
| **Secrets** | Ilimitado | 32 | ∞ |

---

# ⚠️ ALERTAS DE SISTEMA

| Alerta | Severidade | Ação |
|--------|------------|------|
| Extensão `pg_net` no schema público | 🟡 Baixa | Não crítico |
| Proteção de senha vazada | 🟠 Média | Configurar manualmente |

---

# 📖 COMO USAR

## Para Administradores

1. **Dashboard** → Visão geral de todas as métricas
2. **Synapse Pulse** → Vendas em tempo real
3. **Funcionários** → `/funcionarios`
4. **Finanças** → `/financas-empresa` e `/entradas`
5. **Integrações** → `/integracoes`

## Para Funcionários

1. **Tarefas** → `/calendario`
2. **Gastos** → `/financas-pessoais`
3. **Perfil** → `/configuracoes`

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+K` / `Cmd+K` | Busca global |
| `Ctrl+1` | Dashboard |
| `Ctrl+2` | Calendário |
| `Ctrl+3` | Funcionários |
| `Ctrl+4` | Pagamentos |
| `Escape` | Fechar modais |

---

# 🚀 PRÓXIMOS PASSOS

## Prioridade 1: Configurar Domínio
- [ ] Adicionar domínio no Lovable
- [ ] Configurar DNS no Cloudflare
- [ ] Testar SSL

## Prioridade 2: Ativar Webhooks Hotmart
- [ ] Configurar webhook na Hotmart
- [ ] Testar transação de teste
- [ ] Verificar processamento

## Prioridade 3: Migração WordPress
- [ ] Backup completo
- [ ] Exportar lista de alunos
- [ ] Sincronizar dados

---

# 🚨 REGRAS INVIOLÁVEIS

1. **NUNCA** remover funcionalidades sem autorização do Owner
2. **NUNCA** expor dados sensíveis (salários, CPFs, etc.)
3. **NUNCA** desativar RLS nas tabelas
4. **SEMPRE** manter backup antes de mudanças críticas
5. **SEMPRE** testar em preview antes de publicar

---

# 📞 SUPORTE

**Assistente IA disponível 24/7**

Para ajuda, envie:
- Print do erro
- Descrição do que tentou fazer
- O que esperava acontecer

---

*SISTEMA MOISÉS MEDEIROS v9.0*
*Plataforma de Gestão Educacional*
*Documento gerado em: 22/12/2025*
*Mantido pelo SYNAPSE v15.0*
