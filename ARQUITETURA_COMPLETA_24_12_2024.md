# 🏛️ ARQUITETURA COMPLETA DO PROJETO MOISÉS MEDEIROS
## Relatório de Auditoria - 24/12/2024 às 21:44

---

# 📋 ÍNDICE
1. [Identidade do Projeto](#identidade)
2. [Arquitetura de Infraestrutura](#infraestrutura)
3. [Domínios e DNS](#dominios)
4. [Banco de Dados](#banco-de-dados)
5. [Edge Functions](#edge-functions)
6. [Secrets e Integrações](#secrets)
7. [Constituição Synapse](#constituicao)
8. [Estrutura de Código](#estrutura-codigo)
9. [Sistema de Rotas](#rotas)
10. [Segurança](#seguranca)
11. [Performance](#performance)
12. [Cronologia de Dezembro/2024](#cronologia)

---

# 🎯 1. IDENTIDADE DO PROJETO {#identidade}

## Quem Somos
| Campo | Valor |
|-------|-------|
| **Projeto** | Plataforma Educacional Moisés Medeiros |
| **Produto Principal** | Curso de Química para ENEM |
| **Owner Soberano** | MOISESBLANK@GMAIL.COM |
| **Data de Criação** | Dezembro 2024 |
| **Versão Atual** | MATRIZ DIGITAL v5.1 |

## Missão
Plataforma completa de ensino de Química para ENEM com:
- Área do Aluno (Beta - Pagante)
- Área da Comunidade (Gratuita)
- Área de Gestão (Funcionários)
- Painel Administrativo (Owner/Master)

## Público-Alvo
| Público | Descrição |
|---------|-----------|
| **Alunos Beta** | Alunos pagantes via Hotmart com acesso completo |
| **Comunidade** | Usuários gratuitos com acesso à área da comunidade |
| **Funcionários** | Equipe interna com permissões específicas |
| **Owner** | Moises Medeiros - acesso total irrestrito |

---

# 🏗️ 2. ARQUITETURA DE INFRAESTRUTURA {#infraestrutura}

## Stack Tecnológico

### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| React | ^18.3.1 | Framework UI |
| Vite | Latest | Build Tool |
| TypeScript | Latest | Tipagem |
| Tailwind CSS | Latest | Estilização |
| Framer Motion | ^12.23.26 | Animações |
| React Router DOM | ^6.30.1 | Roteamento |
| TanStack Query | ^5.83.0 | Cache/State |
| Zustand | ^5.0.9 | Estado Global |
| Shadcn/UI | Latest | Componentes |

### Backend (Lovable Cloud)
| Serviço | Função |
|---------|--------|
| **Supabase Database** | PostgreSQL gerenciado |
| **Supabase Auth** | Autenticação |
| **Supabase Storage** | Armazenamento de arquivos |
| **Edge Functions** | Lógica serverless |
| **Realtime** | Websockets |

### Infraestrutura Externa
| Serviço | Função |
|---------|--------|
| **Lovable** | Hospedagem frontend (*.lovable.app) |
| **Cloudflare** | DNS + SSL + WAF |
| **Hotmart** | Gateway de pagamentos |
| **WordPress** | CMS legado (sincronização) |
| **WhatsApp Business** | Comunicação |
| **PandaVideo** | Vídeos protegidos |

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                               │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ pro.moisesmedeiros│  │gestao.moisesmedeiros│  DNS Only (Grey) │
│  │    .com.br       │  │    .com.br          │                   │
│  └────────┬─────────┘  └────────┬────────────┘                   │
│           │ A Record            │ A Record                       │
│           ▼                     ▼                                │
│        185.158.133.1 (Lovable Live Servers)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOVABLE PLATFORM                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    FRONTEND (React/Vite)                     ││
│  │  • 70+ páginas  • 40+ componentes  • 100+ hooks            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  LOVABLE CLOUD (Supabase)                    ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       ││
│  │  │ Database │ │   Auth   │ │ Storage  │ │ Realtime │       ││
│  │  │272 tables│ │  Users   │ │  Files   │ │WebSockets│       ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       ││
│  │                                                              ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │              EDGE FUNCTIONS (70+)                        │││
│  │  │  • sna-gateway  • ai-tramon  • hotmart-webhook          │││
│  │  │  • orchestrator • ai-tutor   • wordpress-sync           │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRAÇÕES EXTERNAS                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Hotmart  │ │WordPress │ │ WhatsApp │ │PandaVideo│           │
│  │ Webhooks │ │   API    │ │   API    │ │   API    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ YouTube  │ │ Facebook │ │Instagram │ │ TikTok   │           │
│  │   API    │ │   Ads    │ │   API    │ │   API    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🌐 3. DOMÍNIOS E DNS {#dominios}

## Domínios Configurados

| Domínio | Tipo | Destino | Status |
|---------|------|---------|--------|
| `pro.moisesmedeiros.com.br` | A Record | 185.158.133.1 | ✅ Ativo |
| `gestao.moisesmedeiros.com.br` | A Record | 185.158.133.1 | ✅ Ativo |

## Configuração Cloudflare

### DNS Records
```
pro.moisesmedeiros.com.br      A     185.158.133.1     DNS Only (Grey Cloud)
gestao.moisesmedeiros.com.br   A     185.158.133.1     DNS Only (Grey Cloud)
_lovable.pro.moisesmedeiros    TXT   (verification)    DNS Only
_lovable.gestao.moisesmedeiros TXT   (verification)    DNS Only
```

### SSL/TLS
| Configuração | Valor |
|--------------|-------|
| **Modo** | Full ou Full (Strict) |
| **Certificados** | Google Trust Services |
| **Validade** | ~90 dias (auto-renovável) |
| **Emissão** | 24/12/2024 |

### Rate Limiting
```
Regra: /auth* → Limite de requisições
Outros paths: Sem limite
```

### WAF (Web Application Firewall)
```
Bloqueios ativos:
- /.env
- /.git
- /wp-admin (opcional)
- /xmlrpc.php
```

### Configurações Críticas
| Item | Valor Correto |
|------|---------------|
| **Proxy Status** | DNS Only (GREY) - NÃO Proxied |
| **Development Mode** | OFF |
| **SSL Mode** | Full ou Full (Strict) |
| **Redirect Rules** | Nenhuma para *.lovable.app |

---

# 💾 4. BANCO DE DADOS {#banco-de-dados}

## Visão Geral
| Métrica | Valor |
|---------|-------|
| **Total de Tabelas** | 272 |
| **Project ID** | fyikfsasudgzsjmumdlw |
| **Instância** | ci_xlarge (desde 20/12/2024) |
| **Status** | ✅ Conectado |

## Tabelas Principais (Categorizado)

### 👨‍🎓 Alunos e Educação
| Tabela | Descrição |
|--------|-----------|
| `alunos` | Cadastro de alunos |
| `courses` | Cursos disponíveis |
| `lessons` | Aulas do curso |
| `areas` | Áreas/módulos do curso |
| `certificates` | Certificados emitidos |
| `student_progress` | Progresso do aluno |
| `student_daily_goals` | Metas diárias |
| `simulados` | Simulados/provas |
| `questoes` | Banco de questões |
| `flashcards` | Flashcards de estudo |

### 📚 Livro Web (Sanctum)
| Tabela | Descrição |
|--------|-----------|
| `web_books` | Livros digitais |
| `web_book_pages` | Páginas do livro |
| `web_book_chapters` | Capítulos |
| `book_reading_sessions` | Sessões de leitura |
| `book_chat_messages` | Chat IA do livro |
| `book_chat_threads` | Threads de chat |
| `book_access_logs` | Logs de acesso |
| `book_annotations` | Anotações do aluno |
| `book_highlights` | Destaques |

### 💰 Financeiro
| Tabela | Descrição |
|--------|-----------|
| `entradas` | Receitas |
| `company_fixed_expenses` | Gastos fixos |
| `company_extra_expenses` | Gastos extras |
| `contabilidade` | Registros contábeis |
| `comissoes` | Comissões de afiliados |
| `bank_accounts` | Contas bancárias |
| `contas_pagar` | Contas a pagar |
| `contas_receber` | Contas a receber |

### 👔 Funcionários
| Tabela | Descrição |
|--------|-----------|
| `funcionarios` | Cadastro de funcionários |
| `funcionarios_salarios` | Salários |
| `funcionarios_ferias` | Férias |
| `funcionarios_pontos` | Registro de ponto |
| `employee_invitations` | Convites |

### 🤝 Afiliados
| Tabela | Descrição |
|--------|-----------|
| `affiliates` | Cadastro de afiliados |
| `comissoes` | Comissões |
| `referrals` | Indicações |

### 🔐 Segurança
| Tabela | Descrição |
|--------|-----------|
| `active_sessions` | Sessões ativas (DOGMA I) |
| `user_devices` | Dispositivos registrados |
| `blocked_ips` | IPs bloqueados |
| `security_events` | Eventos de segurança |
| `rate_limits` | Limites de taxa |
| `audit_logs` | Logs de auditoria |
| `activity_log` | Log de atividades |

### 🎮 Gamificação
| Tabela | Descrição |
|--------|-----------|
| `user_xp` | XP dos usuários |
| `achievements` | Conquistas disponíveis |
| `user_achievements` | Conquistas do usuário |
| `badges` | Badges |
| `user_badges` | Badges do usuário |
| `leaderboard` | Ranking |

### 📱 WhatsApp
| Tabela | Descrição |
|--------|-----------|
| `whatsapp_conversations` | Conversas |
| `whatsapp_messages` | Mensagens |
| `whatsapp_contacts` | Contatos |
| `whatsapp_leads` | Leads |
| `whatsapp_attachments` | Anexos |

### 🤖 SNA (Sistema Neural Autônomo)
| Tabela | Descrição |
|--------|-----------|
| `sna_jobs` | Fila de jobs |
| `sna_budgets` | Orçamentos IA |
| `sna_cache` | Cache de respostas |
| `sna_feature_flags` | Feature flags |
| `sna_rate_limits` | Rate limits |
| `sna_tool_runs` | Logs de execução |
| `sna_conversations` | Conversas IA |
| `sna_messages` | Mensagens IA |
| `sna_embeddings` | Embeddings RAG |
| `sna_healthchecks` | Health checks |

### 📊 Analytics
| Tabela | Descrição |
|--------|-----------|
| `analytics_metrics` | Métricas |
| `performance_metrics` | Performance |
| `video_analytics` | Analytics de vídeo |

### 🔗 Integrações
| Tabela | Descrição |
|--------|-----------|
| `hotmart_transactions` | Transações Hotmart |
| `wordpress_users` | Usuários WP |
| `webhooks_queue` | Fila de webhooks |
| `youtube_videos` | Vídeos YouTube |
| `social_media_stats` | Stats redes sociais |

### 📁 Arquivos
| Tabela | Descrição |
|--------|-----------|
| `arquivos_universal` | Sistema de arquivos |
| `arquivos` | Arquivos gerais |
| `documents` | Documentos |

### 👥 Usuários e Perfis
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário |
| `user_roles` | Roles dos usuários |
| `user_preferences` | Preferências |
| `notifications` | Notificações |

---

# ⚡ 5. EDGE FUNCTIONS {#edge-functions}

## Total: 70+ Edge Functions

### 🤖 Inteligência Artificial
| Função | Descrição |
|--------|-----------|
| `sna-gateway` | Gateway único para todas as IAs (LEI IV) |
| `sna-worker` | Worker de jobs assíncronos |
| `orchestrator` | Orquestrador de eventos |
| `ai-tramon` | Superinteligência executiva |
| `ai-tutor` | Tutor virtual de química |
| `ia-gateway` | Tradutor universal |
| `generate-ai-content` | Gerador de conteúdo |
| `chat-tramon` | Chat contextual |
| `book-chat-ai` | Chat IA do livro |

### 💳 Hotmart & Pagamentos
| Função | Descrição |
|--------|-----------|
| `hotmart-webhook-processor` | Processador de webhooks |
| `hotmart-fast` | Endpoint otimizado |
| `secure-webhook` | Webhook seguro |
| `secure-webhook-ultra` | Webhook ultra-seguro |
| `c-create-beta-user` | Criar usuário beta |
| `c-handle-refund` | Processar reembolso |

### 📱 WhatsApp
| Função | Descrição |
|--------|-----------|
| `whatsapp-webhook` | Receptor de mensagens |
| `send-notification-email` | Envio de emails |

### 🔗 WordPress
| Função | Descrição |
|--------|-----------|
| `wordpress-webhook` | Sincronização WP |
| `wordpress-api` | API WordPress |
| `sync-wordpress-users` | Sincronizar usuários |

### 📹 Vídeo & Media
| Função | Descrição |
|--------|-----------|
| `secure-video-url` | URLs assinadas |
| `video-authorize-omega` | Autorização de vídeo |
| `video-violation-omega` | Detecção de violações |
| `get-panda-signed-url` | URLs PandaVideo |
| `youtube-api` | API YouTube |
| `youtube-live` | Lives YouTube |
| `youtube-sync` | Sincronização |

### 📚 Livro Web
| Função | Descrição |
|--------|-----------|
| `genesis-book-upload` | Upload de livros |
| `book-page-manifest` | Manifesto de páginas |
| `book-page-signed-url` | URLs assinadas |
| `sanctum-asset-manifest` | Assets do livro |
| `sanctum-report-violation` | Report de violações |

### 🔐 Segurança
| Função | Descrição |
|--------|-----------|
| `verify-turnstile` | Verificação Cloudflare |
| `send-2fa-code` | Envio de 2FA |
| `verify-2fa-code` | Verificação 2FA |
| `rate-limit-gateway` | Rate limiting |
| `secure-api-proxy` | Proxy seguro |

### 📊 Relatórios
| Função | Descrição |
|--------|-----------|
| `generate-weekly-report` | Relatório semanal |
| `send-weekly-report` | Envio de relatório |
| `reports-api` | API de relatórios |
| `send-report` | Envio genérico |

### 📱 Social Media
| Função | Descrição |
|--------|-----------|
| `facebook-ads-sync` | Sync Facebook Ads |
| `instagram-sync` | Sync Instagram |
| `tiktok-sync` | Sync TikTok |
| `google-analytics-sync` | Sync GA |
| `social-media-stats` | Stats consolidados |

### 🔧 Utilitários
| Função | Descrição |
|--------|-----------|
| `send-email` | Envio de emails |
| `task-reminder` | Lembretes |
| `backup-data` | Backup de dados |
| `extract-document` | Extração de docs |
| `ocr-receipt` | OCR de recibos |
| `google-calendar` | Calendário Google |
| `check-vencimentos` | Verificar vencimentos |
| `invite-employee` | Convite funcionário |
| `notify-owner` | Notificar owner |

---

# 🔑 6. SECRETS E INTEGRAÇÕES {#secrets}

## Secrets Configurados (33 total)

### 🔐 Cloudflare
| Secret | Descrição |
|--------|-----------|
| `CLOUDFLARE_EMAIL` | Email da conta |
| `CLOUDFLARE_PASSWORD` | Senha |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Turnstile captcha |

### 💳 Hotmart
| Secret | Descrição |
|--------|-----------|
| `HOTMART_CLIENT_ID` | Client ID |
| `HOTMART_CLIENT_SECRET` | Client Secret |
| `HOTMART_HOTTOK` | Token de webhook |

### 📱 WhatsApp Business
| Secret | Descrição |
|--------|-----------|
| `WHATSAPP_ACCESS_TOKEN` | Token de acesso |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificação |

### 🌐 WordPress
| Secret | Descrição |
|--------|-----------|
| `WP_API_URL` | URL da API |
| `WP_API_TOKEN` | Token de acesso |
| `WP_ACF_PRO_LICENSE` | Licença ACF Pro |
| `WP_FEEDBACKWP_LICENSE` | Licença FeedbackWP |
| `WP_MAILSMTP_LICENSE` | Licença MailSMTP |

### 📹 Vídeo
| Secret | Descrição |
|--------|-----------|
| `PANDA_API_KEY` | API PandaVideo |
| `YOUTUBE_API_KEY` | API YouTube |
| `YOUTUBE_CHANNEL_HANDLE` | Canal YouTube |

### 📱 Redes Sociais
| Secret | Descrição |
|--------|-----------|
| `FACEBOOK_ACCESS_TOKEN` | Token Facebook |
| `FACEBOOK_AD_ACCOUNT_ID` | Conta de Ads |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Conta Instagram |
| `TIKTOK_USERNAME` | Username TikTok |

### 🔐 Google
| Secret | Descrição |
|--------|-----------|
| `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |

### 🤖 IA
| Secret | Descrição |
|--------|-----------|
| `OPENAI_API_KEY` | API OpenAI |
| `ELEVENLABS_API_KEY` | API ElevenLabs (conector) |
| `FIRECRAWL_API_KEY` | API Firecrawl (conector) |
| `LOVABLE_API_KEY` | API Lovable (sistema) |

### 📧 Email
| Secret | Descrição |
|--------|-----------|
| `RESEND_API_KEY` | API Resend |

### 🖥️ cPanel/Registro.br
| Secret | Descrição |
|--------|-----------|
| `CPANEL_URL` | URL do cPanel |
| `CPANEL_USERNAME` | Username |
| `CPANEL_PASSWORD` | Password |
| `REGISTROBR_USER` | Usuário Registro.br |
| `REGISTROBR_PASSWORD` | Senha Registro.br |

---

# 🏛️ 7. CONSTITUIÇÃO SYNAPSE {#constituicao}

## As 4 Leis Fundamentais

### LEI I - PERFORMANCE (82 Artigos)
**Objetivo:** 3G = ZERO LAG

#### 6 Tiers de Performance
| Tier | Score | Conexão | Hardware |
|------|-------|---------|----------|
| critical | 0-9 | 2G/SaveData | Fraco |
| legacy | 10-29 | 3G | Mobile antigo |
| standard | 30-49 | 4G fraco | Mobile básico |
| enhanced | 50-69 | 4G bom | Mobile médio |
| neural | 70-84 | WiFi/4G+ | Hardware bom |
| quantum | 85+ | Fibra | Desktop top |

#### Core Web Vitals 3G
| Métrica | Target |
|---------|--------|
| FCP | < 1.5s |
| LCP | < 2s |
| CLS | < 0.08 |
| TBT | < 200ms |
| TTI | < 3s |
| FID | < 50ms |
| INP | < 150ms |

#### Bundle Budgets
| Item | Limite |
|------|--------|
| JS | < 350KB |
| CSS | < 60KB |
| Images | < 800KB |
| Fonts | < 100KB |
| Total | < 1.5MB |
| Requests | < 35 |
| DOM | < 1200 |

**Arquivo:** `src/lib/constitution/LEI_I_PERFORMANCE.ts`

---

### LEI II - DISPOSITIVOS (43 Artigos)
**Objetivo:** Funcionar de celular 3G a desktop fibra

#### Breakpoints
| Nome | Pixels |
|------|--------|
| xs | 0 |
| sm | 640 |
| md | 768 |
| lg | 1024 |
| xl | 1280 |
| 2xl | 1536 |

#### Touch Targets
| Item | Valor |
|------|-------|
| Mínimo | 44px |
| Espaçamento | 8px |

#### Sidebar Responsivo
| Dispositivo | Comportamento |
|-------------|---------------|
| Mobile | Gaveta (drawer) |
| Tablet | Recolhida (56px) |
| Desktop | Expandida (240px) |

**Arquivo:** `src/lib/constitution/LEI_II_DISPOSITIVOS.ts`

---

### LEI III - SEGURANÇA (43 Artigos)
**Objetivo:** Segurança nível NASA + Zero Trust

#### DOGMA I - Sessão Única
- UMA sessão ativa por usuário
- Token em localStorage + validação no banco
- Logout automático em outro dispositivo

#### DOGMA II - Controle de Dispositivos
- Máximo 3 dispositivos por usuário
- Fingerprint único: tela + áudio + WebGL + fontes
- device_hash SHA-256

#### DOGMA III - Proteção de Conteúdo
- PDFs: marca d'água dinâmica
- Vídeos: URLs assinadas (15-60min)
- Bloqueios: F12, Ctrl+S/P/U, print

#### Rate Limiting
| Endpoint | Limite |
|----------|--------|
| login | 5/5min |
| cadastro | 3/10min |
| 2fa | 5/5min |
| api | 100/min |

**Arquivo:** `src/lib/constitution/LEI_III_SEGURANCA.ts`

---

### LEI IV - SNA OMEGA (Sistema Neural Autônomo)
**Objetivo:** Orquestração total de IAs e automações

#### 5 Princípios Imutáveis
1. **SOBERANIA:** SNA é a única autoridade
2. **OBEDIÊNCIA:** Funcionar não basta, obedecer é obrigatório
3. **RASTREABILIDADE:** Nenhuma ação sem log
4. **EFICIÊNCIA:** Nenhum recurso sem orçamento
5. **SEGURANÇA:** Nenhuma decisão sem auditoria

#### Arquitetura Neural (5 Camadas)
| Camada | Função |
|--------|--------|
| INGESTÃO | webhooks-queue recebe eventos |
| ORQUESTRAÇÃO | orchestrator roteia eventos |
| PROCESSAMENTO | sna-worker executa workflows |
| INTELIGÊNCIA | sna-gateway é o Proxy de IAs |
| OBSERVABILIDADE | sna_tool_runs + healthchecks |

#### Roteamento de IAs
| Tarefa | Modelo |
|--------|--------|
| classificar_texto | gemini-flash |
| flashcards | gemini-pro |
| chat_simple | gpt5-mini |
| gerar_resumo | gpt5 |
| analisar_documento | gpt5 |

**Arquivo:** `src/lib/constitution/LEI_IV_SNA_OMEGA.ts`

---

# 📁 8. ESTRUTURA DE CÓDIGO {#estrutura-codigo}

## Diretório Raiz
```
projeto/
├── .github/              # GitHub Actions/workflows
├── docs/                 # Documentação
├── public/               # Assets estáticos
│   ├── sw.js            # Service Worker v3500.3
│   ├── manifest.json    # PWA manifest
│   └── favicon.ico
├── src/                  # Código fonte
├── supabase/            
│   ├── functions/       # 70+ Edge Functions
│   └── config.toml      # Config Supabase
├── *.md                  # Guias e relatórios
├── vite.config.ts        # Config Vite
├── tailwind.config.ts    # Config Tailwind
└── package.json
```

## Estrutura src/
```
src/
├── assets/              # Imagens e assets
├── components/          # Componentes React
│   ├── admin/          # Componentes admin
│   ├── ai/             # Componentes IA
│   ├── aluno/          # Área do aluno
│   ├── auth/           # Autenticação
│   ├── book/           # Livro Web
│   ├── dashboard/      # Dashboard
│   ├── editor/         # Editor visual
│   ├── finance/        # Finanças
│   ├── layout/         # Layout base
│   ├── performance/    # Performance
│   ├── security/       # Segurança
│   ├── ui/             # Shadcn/UI
│   └── ...             # 40+ pastas
├── config/              # Configurações
├── contexts/            # React Contexts
│   ├── AttachmentContext.tsx
│   ├── DuplicationClipboardContext.tsx
│   ├── GodModeContext.tsx
│   ├── LiveSheetContext.tsx
│   └── ReactiveFinanceContext.tsx
├── core/                # Core utilities
├── hooks/               # 100+ Custom hooks
│   ├── security/       # Hooks de segurança
│   ├── useAuth.tsx     # Autenticação
│   ├── useConstitution.ts
│   └── ...
├── integrations/        # Integrações
│   └── supabase/       # Cliente Supabase
├── lib/                 # Bibliotecas
│   ├── constitution/   # 4 Leis
│   ├── performance/    # Performance
│   ├── security/       # Segurança
│   └── sanctum/        # Proteção de conteúdo
├── pages/               # 70+ Páginas
│   ├── aluno/          # Área do aluno
│   ├── comunidade/     # Comunidade
│   ├── empresas/       # Módulo empresas
│   └── gestao/         # Área gestão
├── stores/              # Zustand stores
├── styles/              # CSS/Tailwind
├── types/               # TypeScript types
├── utils/               # Utilitários
├── workers/             # Web Workers
├── App.tsx              # App principal
├── main.tsx             # Entry point
└── index.css            # Estilos globais
```

## Componentes Principais
| Componente | Descrição |
|------------|-----------|
| `App.tsx` | Componente raiz (478 linhas) |
| `AppLayout.tsx` | Layout principal |
| `RoleProtectedRoute.tsx` | Proteção de rotas |
| `SessionGuard.tsx` | Guarda de sessão |
| `DeviceGuard.tsx` | Guarda de dispositivos |
| `PerformanceProvider.tsx` | Provider de performance |
| `AITramonGlobal.tsx` | IA assistente global |
| `GodModePanel.tsx` | Painel de edição |

---

# 🛣️ 9. SISTEMA DE ROTAS {#rotas}

## Mapa de URLs Oficial

### 🌐 Rotas Públicas (Sem Auth)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Home | Página inicial |
| `/site` | LandingPage | Landing page |
| `/auth` | Auth | Login/Cadastro |
| `/termos` | TermosDeUso | Termos |
| `/privacidade` | PoliticaPrivacidade | Privacidade |
| `/area-gratuita` | AreaGratuita | Área gratuita |

### 🌐 Comunidade (Gratuito + Beta)
**URL Base:** `pro.moisesmedeiros.com.br/comunidade`

| Rota | Página | Descrição |
|------|--------|-----------|
| `/comunidade` | Comunidade | Hub principal |
| `/comunidade/forum` | ComunidadeForum | Fórum |
| `/comunidade/posts` | ComunidadePosts | Posts |
| `/comunidade/membros` | ComunidadeMembros | Membros |
| `/comunidade/eventos` | ComunidadeEventos | Eventos |
| `/comunidade/chat` | ComunidadeChat | Chat |

### 👨‍🎓 Central do Aluno Beta (Pagante)
**URL Base:** `pro.moisesmedeiros.com.br/alunos`

| Rota | Página | Descrição |
|------|--------|-----------|
| `/alunos` | AlunosRouteSwitcher | Redirecionador |
| `/alunos/dashboard` | AlunoDashboard | Dashboard |
| `/alunos/livro-web` | AlunoLivroWeb | Livro digital |
| `/alunos/videoaulas` | AlunoVideoaulas | Videoaulas |
| `/alunos/questoes` | AlunoQuestoes | Questões |
| `/alunos/simulados` | AlunoSimulados | Simulados |
| `/alunos/ranking` | AlunoRanking | Ranking |
| `/alunos/tabela-periodica` | AlunoTabelaPeriodica | Tabela |
| `/alunos/flashcards` | AlunoFlashcards | Flashcards |
| `/alunos/tutoria` | TutoriaIA | Tutor IA |
| `/alunos/perfil` | AlunoPerfil | Perfil |

### 👔 Gestão (Funcionários)
**URL Base:** `gestao.moisesmedeiros.com.br/gestao`

#### Dashboard
| Rota | Página |
|------|--------|
| `/gestao/dashboard` | Dashboard |
| `/gestao/dashboard-executivo` | DashboardExecutivo |
| `/gestao/tarefas` | Tarefas |
| `/gestao/calendario` | Calendario |

#### Marketing
| Rota | Página |
|------|--------|
| `/gestao/marketing` | Marketing |
| `/gestao/lancamento` | Lancamento |
| `/gestao/metricas` | Metricas |
| `/gestao/leads-whatsapp` | LeadsWhatsApp |

#### Aulas
| Rota | Página |
|------|--------|
| `/gestao/area-professor` | AreaProfessor |
| `/gestao/cursos` | Cursos |
| `/gestao/simulados` | Simulados |
| `/gestao/lives` | Lives |
| `/gestao/livros-web` | GestaoLivrosWeb |

#### Finanças
| Rota | Página |
|------|--------|
| `/gestao/entradas` | Entradas |
| `/gestao/financas-empresa` | FinancasEmpresa |
| `/gestao/financas-pessoais` | FinancasPessoais |
| `/gestao/contabilidade` | Contabilidade |
| `/gestao/transacoes-hotmart` | TransacoesHotmart |

#### Alunos
| Rota | Página |
|------|--------|
| `/gestao/gestao-alunos` | Alunos |
| `/gestao/afiliados` | Afiliados |
| `/gestao/relatorios` | Relatorios |

#### Admin/Config
| Rota | Página |
|------|--------|
| `/gestao/funcionarios` | Funcionarios |
| `/gestao/permissoes` | Permissoes |
| `/gestao/configuracoes` | Configuracoes |
| `/gestao/gestao-dispositivos` | GestaoDispositivos |
| `/gestao/auditoria-acessos` | AuditoriaAcessos |

#### Owner Only
| Rota | Página |
|------|--------|
| `/gestao/central-monitoramento` | CentralMonitoramento |
| `/gestao/central-whatsapp` | CentralWhatsApp |
| `/gestao/central-metricas` | CentralMetricas |
| `/gestao/central-ias` | CentralIAs |
| `/gestao/central-diagnostico` | CentralDiagnostico |

---

# 🔐 10. SEGURANÇA {#seguranca}

## Camadas de Proteção

### 1. SessionGuard (DOGMA I)
```typescript
// Sessão única por usuário
- Token validado a cada 30s
- Logout automático em outro dispositivo
- Tabela: active_sessions
```

### 2. DeviceGuard (DOGMA XI)
```typescript
// Limite de dispositivos
- Máximo 3 dispositivos
- Fingerprint único
- Tabela: user_devices
```

### 3. RoleProtectedRoute
```typescript
// Proteção por role
- owner: acesso total
- admin: gestão
- funcionario: área específica
- beta: área do aluno
- user: comunidade
```

### 4. Rate Limiting
```typescript
// Por endpoint
- login: 5 tentativas/5min
- api: 100 req/min
- Tabela: api_rate_limits
```

### 5. WAF (Cloudflare)
```
Bloqueios:
- /.env, /.git
- SQL injection patterns
- XSS patterns
```

### 6. Content Protection (Sanctum)
```typescript
// Proteção de conteúdo
- Marca d'água em PDFs
- URLs assinadas para vídeos
- Bloqueio de DevTools
- Anti-screenshot overlay
```

## Alertas do Linter
| Nível | Issue | Ação |
|-------|-------|------|
| WARN | Extension in Public schema | Monitorar |
| WARN | Leaked Password Protection | Considerar habilitar |

---

# ⚡ 11. PERFORMANCE {#performance}

## Service Worker v3500.3 (public/sw.js)

### Configurações Atuais
```javascript
CACHE_VERSION = 'v3500.3'
STATIC_CACHE = 'static-v3500.3'
DYNAMIC_CACHE = 'dynamic-v3500.3'
```

### Correções Aplicadas em 24/12/2024
1. **Removido** `/` e `/index.html` do cache crítico
2. **Adicionado** fallback HTML com `cache: 'reload'`
3. **Modificado** navigation requests para `cache: 'no-store'`
4. **Objetivo:** Evitar cache de HTML incorreto (preview)

### Estratégias de Cache
| Tipo | Estratégia |
|------|------------|
| Static | Cache First |
| API | Network First |
| Images | Stale While Revalidate |
| Fonts | Cache First |
| Navigation | Network First + Fallback |

## Bundle Splitting (vite.config.ts)

### Chunks Configurados
```javascript
vendor-react-core
vendor-react-router
vendor-ui-overlays
vendor-ui-primitives
vendor-ui-radix
vendor-query
vendor-state
vendor-motion
vendor-forms
vendor-charts
vendor-date
vendor-supabase
vendor-pdf
vendor-css-utils
vendor-icons
```

## Providers de Performance
```typescript
<PerformanceProvider>
  <PerformanceStyles />
  <QueryClientProvider>
    // App
  </QueryClientProvider>
</PerformanceProvider>
```

---

# 📅 12. CRONOLOGIA DEZEMBRO/2024 {#cronologia}

## Timeline de Desenvolvimento

### Semana 1 (01-07/12)
- Estruturação inicial do projeto
- Setup Supabase/Lovable Cloud
- Criação das primeiras tabelas

### Semana 2 (08-14/12)
- Implementação do sistema de autenticação
- Criação da Constituição Synapse (4 Leis)
- Setup de Edge Functions principais
- **14/12:** Upgrade para instância ci_pico

### Semana 3 (15-21/12)
- Desenvolvimento do Livro Web (Sanctum)
- Integração Hotmart/WordPress
- Sistema de gamificação
- **20/12:** Upgrade para instância ci_xlarge

### Semana 4 (22-24/12)
- Configuração de domínios custom
- Resolução do problema de tela preta
- Correções no Service Worker
- Certificados SSL emitidos
- **24/12:** Auditoria completa

## Ações do Dia 24/12/2024

### Cloudflare
1. ✅ Verificação de DNS (DNS Only)
2. ✅ Verificação de Rate Limiting
3. ✅ Verificação de WAF
4. ✅ Confirmação de SSL (Google Trust Services)

### Lovable
1. ✅ Re-adição de domínios custom
2. ✅ Verificação de apontamento

### Service Worker
1. ✅ Incremento versão para v3500.3
2. ✅ Remoção de `/` e `/index.html` do cache
3. ✅ Fallback HTML com `cache: 'reload'`
4. ✅ Navigation com `cache: 'no-store'`

### Certificados SSL Emitidos
- `pro.moisesmedeiros.com.br` ✅
- `gestao.moisesmedeiros.com.br` ✅
- Emissor: Google Trust Services
- Validade: ~90 dias

---

# 📊 RESUMO EXECUTIVO

## Números do Projeto

| Métrica | Valor |
|---------|-------|
| **Tabelas no banco** | 272 |
| **Edge Functions** | 70+ |
| **Secrets configurados** | 33 |
| **Páginas frontend** | 70+ |
| **Hooks customizados** | 100+ |
| **Componentes** | 200+ |
| **Linhas de código** | 50.000+ |

## Status Geral

| Sistema | Status |
|---------|--------|
| **Frontend** | ✅ Operacional |
| **Backend** | ✅ Operacional |
| **Banco de dados** | ✅ Conectado |
| **Edge Functions** | ✅ Deployadas |
| **Domínios** | ✅ Configurados |
| **SSL** | ✅ Ativo |
| **CDN (Cloudflare)** | ✅ DNS Only |

## Integrações Ativas

| Serviço | Status |
|---------|--------|
| **Hotmart** | ✅ Conectado |
| **WordPress** | ✅ Sincronizado |
| **WhatsApp** | ✅ Configurado |
| **YouTube** | ✅ Conectado |
| **PandaVideo** | ✅ Conectado |
| **Facebook Ads** | ✅ Configurado |
| **Instagram** | ✅ Conectado |
| **Google Calendar** | ✅ Conectado |

---

## 📝 ASSINATURA

```
Relatório gerado em: 24/12/2024 às 21:44
Versão do sistema: MATRIZ DIGITAL v5.1
Owner: MOISESBLANK@GMAIL.COM
Gerado por: Lovable AI
```

---

*Este documento é a fonte única da verdade sobre a arquitetura do projeto Moisés Medeiros.*
