// ============================================================
// 🧠 LEI IV - CONSTITUIÇÃO DO SISTEMA NERVOSO AUTÔNOMO (SNA OMEGA v5.0)
// ============================================================
// OBRIGATÓRIO em TODO código. Objetivo: Automação Inteligente Enterprise
// Autor: MESTRE PHD | Capacidade: 5.000+ usuários simultâneos
// Última atualização: 2025-12-22
// ============================================================

/**
 * 
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║           🧠 SNA OMEGA v5.0 — SISTEMA NERVOSO AUTÔNOMO                      ║
 * ║                    CONSTITUIÇÃO E ARQUITETURA COMPLETA                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO I — DEFINIÇÃO E PROPÓSITO (1-3)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. O SNA (Sistema Nervoso Autônomo) é a infraestrutura central de automação e
 *    orquestração de todas as Inteligências Artificiais da plataforma TRAMON.
 * 
 * 2. O SNA gerencia:
 *    - Processamento assíncrono de jobs
 *    - Rate limiting inteligente por workflow
 *    - Controle de custos e budgets
 *    - Cache de respostas para economia
 *    - Feature flags para rollout gradual
 *    - Healthchecks automáticos
 *    - Observability e métricas em tempo real
 * 
 * 3. CAPACIDADE: 5.000+ usuários simultâneos com failover automático
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO II — ARQUITETURA EM 5 CAMADAS (4-8)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 4. CAMADA 1 - INGESTÃO (Webhooks)
 *    ├── webhook-handler: Porteiro resiliente, valida HMAC, <50ms
 *    ├── webhook-receiver: Receptor genérico de webhooks
 *    ├── hotmart-webhook-processor: Específico para Hotmart
 *    ├── wordpress-webhook: Específico para WordPress
 *    └── whatsapp-webhook: Específico para WhatsApp Business
 * 
 * 5. CAMADA 2 - PROCESSAMENTO (Filas)
 *    ├── queue-worker: Processa webhooks_queue com retry exponencial
 *    ├── sna-worker: Processa sna_jobs com 20+ workflows
 *    └── event-router: Delega eventos para handlers específicos
 * 
 * 6. CAMADA 3 - ORQUESTRAÇÃO (Central)
 *    ├── orchestrator: Coordena ações entre IAs e sistemas
 *    ├── sna-gateway: Gateway único para chamadas de IA
 *    └── comandos_ia_central: Fila de comandos inter-IA
 * 
 * 7. CAMADA 4 - INTELIGÊNCIA (IAs)
 *    ├── ai-tramon: Superinteligência executiva (GPT-5)
 *    ├── ai-tutor: Professor personalizado para alunos
 *    ├── ai-assistant: Assistente geral da plataforma
 *    └── generate-ai-content: Gerador de conteúdo educacional
 * 
 * 8. CAMADA 5 - AÇÃO (Execução)
 *    ├── c-create-beta-user: Cria usuários pagantes
 *    ├── c-grant-xp: Concede pontos de experiência
 *    ├── c-handle-refund: Processa reembolsos
 *    ├── send-email: Disparo de emails
 *    ├── send-notification-email: Notificações por email
 *    └── wordpress-api: Integração com WordPress
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO III — EDGE FUNCTIONS PRINCIPAIS (9-14)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 9. SNA-GATEWAY (sna-gateway/index.ts)
 *    Propósito: Gateway único para todas as chamadas de IA
 *    Recursos: Auth, Rate Limit, Budget, Cache, Fallback, Observability
 *    Tamanho: 583 linhas
 *    Status: ✅ OPERACIONAL
 * 
 *    Providers suportados:
 *    - Lovable AI (gemini-flash, gemini-pro, gpt5, gpt5-mini, gpt5-nano)
 *    - Perplexity (sonar)
 *    
 *    Rate Limits por workflow:
 *    - tutor: 30 req/min
 *    - flashcards: 10 req/min
 *    - mindmap: 5 req/min
 *    - cronograma: 5 req/min
 *    - import: 2 req/min
 *    - live_summary: 10 req/min
 *    - classify: 100 req/min
 *    - chat: 60 req/min
 * 
 * 10. SNA-WORKER (sna-worker/index.ts)
 *     Propósito: Processador de jobs assíncronos enterprise
 *     Recursos: 20+ workflows, retry inteligente, DLQ automática
 *     Tamanho: 1237 linhas
 *     Status: ✅ OPERACIONAL
 *     Execução: Cron (1min) ou manual via API
 *     
 *     Workflows suportados:
 *     ┌────────────────────┬─────────────────────────────────────────────┐
 *     │ WF-TUTOR-01        │ Resposta do tutor IA personalizado          │
 *     │ WF-TUTOR-CONTEXT   │ Tutor com contexto expandido                │
 *     │ WF-FLASHCARDS      │ Geração de flashcards automáticos           │
 *     │ WF-MINDMAP         │ Geração de mapas mentais                    │
 *     │ WF-CRONOGRAMA      │ Geração de cronogramas de estudo            │
 *     │ WF-RESUMO          │ Geração de resumos de conteúdo              │
 *     │ WF-EXERCICIOS      │ Geração de exercícios práticos              │
 *     │ WF-IMPORT-URL      │ Importação de conteúdo de URL               │
 *     │ WF-IMPORT-PDF      │ Importação de conteúdo de PDF               │
 *     │ WF-TRANSCRIBE      │ Transcrição de áudio/vídeo                  │
 *     │ WF-LIVE-SUMMARY    │ Resumo de perguntas em lives                │
 *     │ WF-LIVE-HIGHLIGHT  │ Destaques de lives                          │
 *     │ WF-EMAIL           │ Disparo de emails automatizados             │
 *     │ WF-WHATSAPP        │ Mensagens WhatsApp                          │
 *     │ WF-NOTIFICATION    │ Notificações push                           │
 *     │ WF-ANALYZE-CHURN   │ Análise de risco de churn                   │
 *     │ WF-REPORT-WEEKLY   │ Relatório semanal automático                │
 *     │ WF-HEALTHCHECK     │ Verificação de saúde do sistema             │
 *     │ WF-EMBED-CONTENT   │ Embedding de conteúdo para RAG              │
 *     └────────────────────┴─────────────────────────────────────────────┘
 * 
 * 11. ORCHESTRATOR (orchestrator/index.ts)
 *     Propósito: Maestro das IAs, coordena ações entre sistemas
 *     Tamanho: 475 linhas
 *     Status: ✅ OPERACIONAL
 *     
 *     Eventos processados:
 *     - Hotmart: PURCHASE_APPROVED, PURCHASE_CANCELED, PURCHASE_REFUNDED
 *     - WordPress: user_created, user_updated, user_registered
 *     - WhatsApp: Mensagens recebidas, leads
 *     - RD Station: Leads sincronizados
 * 
 * 12. AI-TRAMON (ai-tramon/index.ts)
 *     Propósito: Superinteligência executiva com integração total
 *     Tamanho: 849 linhas
 *     Status: ✅ OPERACIONAL
 *     Modelo: OpenAI GPT-5 (ChatGPT Pro)
 *     
 *     Capacidades:
 *     - Detecção de intenção (despesa, receita, aluno, tarefa, funcionário)
 *     - Categorização automática de finanças
 *     - Extração de entidades (valor, email, telefone, nome)
 *     - Integração: Hotmart + YouTube + Instagram + WhatsApp + Finanças
 * 
 * 13. WEBHOOK-HANDLER (webhook-handler/index.ts)
 *     Propósito: Porteiro resiliente com validação HMAC
 *     Tamanho: 352 linhas
 *     Status: ✅ OPERACIONAL
 *     Tempo alvo: <50ms
 *     
 *     Recursos:
 *     - Validação HMAC SHA256
 *     - Idempotência automática por external_event_id
 *     - Logging em security_events
 *     - Suporte: Hotmart, WordPress, WhatsApp, genérico
 * 
 * 14. EVENT-ROUTER (event-router/index.ts)
 *     Propósito: Roteador de eventos para handlers específicos
 *     Tamanho: 153 linhas
 *     Status: ✅ OPERACIONAL
 *     
 *     Mapeamento de eventos:
 *     - payment.succeeded → c-create-beta-user
 *     - payment.refunded → c-handle-refund
 *     - lesson.completed → c-grant-xp
 *     - quiz.passed → c-grant-xp
 *     - badge.earned → c-handle-badge
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO IV — TABELAS DO BANCO DE DADOS (15-22)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 15. sna_jobs — Fila de execução de jobs
 *     ├── id: UUID (PK)
 *     ├── job_type: TEXT (tipo do workflow)
 *     ├── input: JSONB (parâmetros de entrada)
 *     ├── status: TEXT (pending, running, completed, failed)
 *     ├── priority: INT (0-5, menor = mais prioritário)
 *     ├── attempts: INT (tentativas atuais)
 *     ├── max_attempts: INT (máximo de tentativas)
 *     ├── timeout_seconds: INT (timeout do job)
 *     ├── worker_id: TEXT (ID do worker processando)
 *     ├── correlation_id: UUID (rastreamento)
 *     ├── created_at, started_at, completed_at: TIMESTAMPTZ
 *     ├── output: JSONB (resultado)
 *     └── error: JSONB (erro se falhou)
 * 
 * 16. sna_budgets — Controle de custos por scope
 *     ├── id: UUID (PK)
 *     ├── scope: TEXT (global, workflow, user)
 *     ├── scope_id: TEXT (ID do scope)
 *     ├── period: TEXT (daily, weekly, monthly)
 *     ├── limit_usd: NUMERIC (limite em USD)
 *     ├── spent_usd: NUMERIC (gasto atual)
 *     ├── warn_threshold: NUMERIC (% para aviso)
 *     ├── critical_threshold: NUMERIC (% crítico)
 *     ├── action_on_limit: TEXT (throttle, block, allow)
 *     └── is_active: BOOLEAN
 * 
 * 17. sna_cache — Cache de respostas
 *     ├── id: UUID (PK)
 *     ├── cache_key: TEXT (chave única)
 *     ├── cached_value: JSONB (valor cacheado)
 *     ├── expires_at: TIMESTAMPTZ
 *     ├── hit_count: INT (contagem de hits)
 *     ├── original_cost_usd: NUMERIC (custo original)
 *     └── saved_cost_usd: NUMERIC (custo economizado)
 * 
 * 18. sna_feature_flags — Controle de features
 *     ├── id: UUID (PK)
 *     ├── flag_key: TEXT (chave única)
 *     ├── description: TEXT
 *     ├── is_enabled: BOOLEAN
 *     ├── rollout_percentage: INT (0-100)
 *     ├── rollout_strategy: TEXT (percentage, users, roles)
 *     ├── allowed_roles: TEXT[]
 *     ├── allowed_users: UUID[]
 *     ├── blocked_users: UUID[]
 *     └── config: JSONB (configuração adicional)
 * 
 * 19. sna_conversations — Histórico de conversas com IAs
 *     ├── id: UUID (PK)
 *     ├── user_id: UUID (FK profiles)
 *     ├── agent_type: TEXT (tutor, assistant, tramon)
 *     ├── lesson_id, course_id: UUID (contexto)
 *     ├── message_count: INT
 *     ├── total_tokens: INT
 *     ├── total_cost_usd: NUMERIC
 *     └── status: TEXT (active, archived)
 * 
 * 20. sna_embeddings — Vetores para RAG
 *     ├── id: UUID (PK)
 *     ├── source_type: TEXT (lesson, transcript, question)
 *     ├── source_id: UUID
 *     ├── chunk_index: INT
 *     ├── content: TEXT
 *     ├── embedding: JSONB (vetor)
 *     └── tags: TEXT[]
 * 
 * 21. comandos_ia_central — Fila de comandos inter-IA
 *     ├── id: UUID (PK)
 *     ├── ia_destino: TEXT (tramon, tutor, assistant)
 *     ├── ia_origem: TEXT (orchestrator, webhook)
 *     ├── acao: TEXT (nome da ação)
 *     ├── parametros: JSONB
 *     ├── prioridade: INT (1-5)
 *     ├── status: TEXT (pending, running, completed, failed)
 *     ├── resultado: JSONB
 *     └── tempo_execucao_ms: INT
 * 
 * 22. contexto_compartilhado_ias — Contexto entre IAs
 *     ├── id: UUID (PK)
 *     ├── sessao_id: UUID
 *     ├── tipo_contexto: TEXT
 *     ├── entidade_id: TEXT
 *     ├── dados: JSONB
 *     ├── ia_criadora: TEXT
 *     ├── ias_com_acesso: TEXT[]
 *     ├── versao: INT
 *     └── expira_em: TIMESTAMPTZ
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO V — FUNÇÕES SQL (RPCs) (23-30)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 23. sna_claim_jobs(p_worker_id, p_job_types, p_max_priority, p_limit)
 *     → Reivindica jobs pendentes para processamento atômico
 * 
 * 24. sna_complete_job(p_job_id, p_output, p_cost_usd, p_tokens_in, p_tokens_out)
 *     → Marca job como concluído com métricas
 * 
 * 25. sna_fail_job(p_job_id, p_error)
 *     → Marca job como falho com erro detalhado
 * 
 * 26. sna_check_rate_limit(p_scope, p_scope_id, p_limit_per_minute)
 *     → Verifica e incrementa rate limit
 * 
 * 27. sna_check_budget(p_scope, p_scope_id, p_estimated_cost)
 *     → Verifica budget disponível
 * 
 * 28. sna_cache_get(p_cache_key)
 *     → Busca valor no cache
 * 
 * 29. sna_cache_set(p_cache_key, p_value, p_ttl_seconds, p_original_cost_usd)
 *     → Salva valor no cache
 * 
 * 30. sna_check_feature(p_flag_key, p_user_id)
 *     → Verifica se feature está habilitada
 * 
 * 31. sna_cleanup(p_job_retention_days, p_tool_run_retention_days, ...)
 *     → Limpeza automática de dados antigos
 * 
 * 32. sna_log_tool_run(p_tool_name, p_input, p_output, p_cost_usd, ...)
 *     → Auditoria imutável de execuções
 * 
 * 33. sna_get_metrics(p_hours)
 *     → Métricas agregadas do sistema
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO VI — FEATURE FLAGS ATIVOS (34)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 34. FLAGS ATIVOS NO SISTEMA (13 ativos):
 * 
 *     ┌─────────────────────────────┬─────────────────────────────┬────────────┬────────────────┐
 *     │ FLAG                        │ DESCRIÇÃO                   │ ATIVO      │ ROLLOUT        │
 *     ├─────────────────────────────┼─────────────────────────────┼────────────┼────────────────┤
 *     │ sna.tutor.enabled           │ IA Tutor para alunos        │ ✅         │ 100%           │
 *     │ sna.tutor.streaming         │ Streaming de respostas      │ ✅         │ 100%           │
 *     │ sna.tutor.context_window    │ Contexto expandido          │ ✅         │ 100%           │
 *     │ sna.flashcards.generate     │ Geração de flashcards       │ ✅         │ 100%           │
 *     │ sna.mindmap.generate        │ Geração de mapas mentais    │ ✅         │ 100%           │
 *     │ sna.cronograma.generate     │ Geração de cronogramas      │ ✅         │ 100%           │
 *     │ sna.live.summary            │ Resumo de lives             │ ✅         │ 100%           │
 *     │ sna.import.pdf              │ Importar de PDF             │ ✅         │ 100%           │
 *     │ sna.import.url              │ Importar de URL             │ ✅         │ 100%           │
 *     │ sna.rag.enabled             │ RAG para contexto           │ ✅         │ 100%           │
 *     │ sna.cache.responses         │ Cache de respostas          │ ✅         │ 100%           │
 *     │ sna.email.auto              │ Automações de email         │ ✅         │ 100%           │
 *     │ sna.whatsapp.auto           │ Automações WhatsApp         │ ✅         │ 100%           │
 *     │ sna.voice.narration         │ Narração com voz            │ ❌         │ 50% (beta)     │
 *     │ sna.perplexity.web          │ Respostas com fontes web    │ ❌         │ 30% (beta)     │
 *     └─────────────────────────────┴─────────────────────────────┴────────────┴────────────────┘
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO VII — HOOKS REACT (35-38)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 35. useAIMetrics(refreshInterval)
 *     → Métricas em tempo real do SNA
 *     Retorna: metrics, isLoading, error, refresh
 * 
 * 36. useAIAutomation()
 *     → Controle de jobs, flags e healthchecks
 *     Retorna: createJob, checkFeature, healthCheck, isLoading
 * 
 * 37. useAIJobs(filters)
 *     → Listagem e gestão de jobs
 *     Retorna: jobs, isLoading, cancelJob, retryJob, refetch
 * 
 * 38. useFeatureFlags()
 *     → Gestão de feature flags
 *     Retorna: flags, isLoading, toggleFlag, updateRollout, refetch
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO VIII — COMPONENTES UI (39-40)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 39. AIControlCenter (src/components/ai/AIControlCenter.tsx)
 *     → Dashboard administrativo enterprise futurista 2300
 *     Tamanho: 712 linhas
 *     Recursos:
 *     - Métricas em tempo real
 *     - Gestão de jobs (visualizar, cancelar, reprocessar)
 *     - Controle de feature flags
 *     - Healthchecks do sistema
 *     - Monitoramento de custos
 * 
 * 40. AICommandCenter (src/components/dashboard/AICommandCenter.tsx)
 *     → Interface de comando direto para as IAs
 *     Tamanho: 231 linhas
 *     IAs disponíveis: Manus, Lovable, TRAMON
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO IX — FLUXO DE PROCESSAMENTO (41-43)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 41. FLUXO DE WEBHOOK:
 *     1. Webhook chega → webhook-handler
 *     2. Valida HMAC + Idempotência
 *     3. Enfileira em webhooks_queue
 *     4. queue-worker processa (a cada 1min ou manual)
 *     5. Chama orchestrator
 *     6. orchestrator delega para IAs
 *     7. Resultado → logs_integracao_detalhado
 *     8. Falhas → dead_letter_queue (após 5 retries)
 * 
 * 42. FLUXO DE JOB IA:
 *     1. Frontend chama sna-gateway
 *     2. sna-gateway verifica: auth, rate limit, budget
 *     3. Se async → cria job em sna_jobs
 *     4. sna-worker reivindica job (sna_claim_jobs)
 *     5. Processa workflow específico
 *     6. Marca como completo (sna_complete_job)
 *     7. Se falha → retry ou DLQ
 * 
 * 43. FLUXO DE EVENTO:
 *     1. Ação do usuário → dispara evento
 *     2. event-router busca próximo evento pendente
 *     3. Identifica handler (EVENT_HANDLERS)
 *     4. Chama Edge Function correspondente
 *     5. Marca evento como processado
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO X — MÉTRICAS E MONITORAMENTO (44-46)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 44. MÉTRICAS DISPONÍVEIS:
 *     - jobs.total, jobs.pending, jobs.running, jobs.completed, jobs.failed
 *     - costs.total_usd, costs.today_usd, costs.budget_remaining
 *     - performance.success_rate, performance.avg_latency_ms
 *     - performance.cache_hit_rate
 *     - queue.oldest_job_age_seconds, queue.avg_wait_seconds
 *     - health.overall (healthy, degraded, critical)
 * 
 * 45. HEALTHCHECKS AUTOMÁTICOS:
 *     - Supabase DB: Conexão e latência
 *     - SNA Gateway: Disponibilidade
 *     - SNA Worker: Última execução
 *     - Cache: Hit rate
 *     - Queue: Tamanho e idade
 * 
 * 46. ALERTAS:
 *     - Budget > 80%: Aviso
 *     - Budget > 95%: Crítico
 *     - Queue > 100 jobs: Degraded
 *     - Falhas > 10%: Degraded
 *     - Latência > 5s: Warning
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO XI — INTEGRAÇÕES EXTERNAS (47-50)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 47. HOTMART (hotmart-webhook-processor)
 *     Eventos: PURCHASE_APPROVED, PURCHASE_CANCELED, PURCHASE_REFUNDED
 *     Ações: Criar aluno, atualizar status, registrar comissão, entrada financeira
 * 
 * 48. WORDPRESS (wordpress-webhook, wordpress-api)
 *     Eventos: user_created, user_updated, user_registered
 *     Ações: Sincronizar usuário, validar grupos, auditoria de acessos
 * 
 * 49. WHATSAPP (whatsapp-webhook)
 *     Eventos: Mensagens recebidas
 *     Ações: Salvar lead, resposta automática via IA, notificações
 * 
 * 50. YOUTUBE (youtube-api, youtube-sync)
 *     Eventos: Videos, Lives, Comentários
 *     Ações: Sincronizar conteúdo, métricas de canal
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO XII — SEGURANÇA (51-53)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 51. AUTENTICAÇÃO:
 *     - Validação HMAC para webhooks
 *     - Service Role Key para Edge Functions
 *     - JWT para chamadas de usuário
 * 
 * 52. IDEMPOTÊNCIA:
 *     - external_event_id único por webhook
 *     - Proteção contra processamento duplicado
 *     - Constraint UNIQUE na tabela webhooks_queue
 * 
 * 53. AUDITORIA:
 *     - security_events: Log de todos os eventos de segurança
 *     - logs_integracao_detalhado: Rastreamento completo de webhooks
 *     - sna_tool_runs: Auditoria de execuções de IA
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO XIII — CHECKLIST DE VERIFICAÇÃO (54)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 54. STATUS ATUAL DO SISTEMA (2025-12-22):
 * 
 *     ┌────────────────────────────────────────┬───────────────────────┬───────────┐
 *     │ COMPONENTE                             │ FUNÇÃO                │ STATUS    │
 *     ├────────────────────────────────────────┼───────────────────────┼───────────┤
 *     │ sna-gateway                            │ Gateway de IA         │ ✅ OK     │
 *     │ sna-worker                             │ Processador de jobs   │ ✅ OK     │
 *     │ orchestrator                           │ Maestro das IAs       │ ✅ OK     │
 *     │ ai-tramon                              │ Superinteligência     │ ✅ OK     │
 *     │ webhook-handler                        │ Porteiro resiliente   │ ✅ OK     │
 *     │ queue-worker                           │ Processador de fila   │ ✅ OK     │
 *     │ event-router                           │ Roteador de eventos   │ ✅ OK     │
 *     ├────────────────────────────────────────┼───────────────────────┼───────────┤
 *     │ sna_jobs (tabela)                      │ Fila de jobs          │ ✅ OK     │
 *     │ sna_budgets (tabela)                   │ Controle de custos    │ ✅ OK     │
 *     │ sna_cache (tabela)                     │ Cache de respostas    │ ✅ OK     │
 *     │ sna_feature_flags (tabela)             │ Feature flags         │ ✅ OK     │
 *     │ comandos_ia_central (tabela)           │ Comandos inter-IA     │ ✅ OK     │
 *     │ webhooks_queue (tabela)                │ Fila de webhooks      │ ✅ OK     │
 *     │ dead_letter_queue (tabela)             │ DLQ                   │ ✅ OK     │
 *     ├────────────────────────────────────────┼───────────────────────┼───────────┤
 *     │ sna_claim_jobs (RPC)                   │ Reivindicar jobs      │ ✅ OK     │
 *     │ sna_check_rate_limit (RPC)             │ Rate limiting         │ ✅ OK     │
 *     │ sna_check_budget (RPC)                 │ Verificar budget      │ ✅ OK     │
 *     │ sna_check_feature (RPC)                │ Verificar feature     │ ✅ OK     │
 *     │ sna_cache_get/set (RPC)                │ Cache                 │ ✅ OK     │
 *     ├────────────────────────────────────────┼───────────────────────┼───────────┤
 *     │ useAIMetrics (hook)                    │ Métricas React        │ ✅ OK     │
 *     │ useAIAutomation (hook)                 │ Controle React        │ ✅ OK     │
 *     │ useAIJobs (hook)                       │ Jobs React            │ ✅ OK     │
 *     │ useFeatureFlags (hook)                 │ Flags React           │ ✅ OK     │
 *     ├────────────────────────────────────────┼───────────────────────┼───────────┤
 *     │ AIControlCenter (UI)                   │ Dashboard admin       │ ✅ OK     │
 *     │ AICommandCenter (UI)                   │ Centro de comandos    │ ✅ OK     │
 *     └────────────────────────────────────────┴───────────────────────┴───────────┘
 * 
 *     MÉTRICAS EM TEMPO REAL:
 *     - Jobs pendentes: 0
 *     - Jobs concluídos: 0
 *     - Jobs falhados: 0
 *     - Feature flags ativos: 13
 *     - Cache ativos: 0
 *     - Webhooks pendentes: 0
 *     - DLQ pendentes: 0
 *     - Comandos IA pendentes: 0
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARTIGO XIV — REGRAS FINAIS (55-57)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 55. Toda nova funcionalidade de IA DEVE passar pelo SNA Gateway
 * 
 * 56. Novos workflows DEVEM ser registrados no SNA Worker
 * 
 * 57. NUNCA remover ou enfraquecer artigos desta lei, apenas expandir
 * 
 */

// ============================================================
// TIPOS EXPORTADOS
// ============================================================

export interface SNAConfig {
  gateway: {
    url: string;
    rateLimits: Record<string, number>;
    models: Record<string, ModelConfig>;
  };
  worker: {
    workflows: string[];
    maxAttempts: number;
    timeoutSeconds: number;
  };
  features: {
    enabled: string[];
    disabled: string[];
  };
}

export interface ModelConfig {
  id: string;
  maxTokens: number;
  costIn: number;
  costOut: number;
}

export interface WorkflowConfig {
  type: string;
  model: string;
  maxTokens: number;
  timeout: number;
  priority: number;
}

// ============================================================
// CONFIGURAÇÃO DO SNA
// ============================================================

export const SNA_CONFIG: SNAConfig = {
  gateway: {
    url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    rateLimits: {
      tutor: 30,
      flashcards: 10,
      mindmap: 5,
      cronograma: 5,
      import: 2,
      live_summary: 10,
      classify: 100,
      chat: 60,
      default: 30,
    },
    models: {
      'gemini-flash': { id: 'google/gemini-2.5-flash', maxTokens: 4096, costIn: 0.075, costOut: 0.30 },
      'gemini-pro': { id: 'google/gemini-2.5-pro', maxTokens: 8192, costIn: 1.25, costOut: 5.00 },
      'gpt5': { id: 'openai/gpt-5', maxTokens: 16384, costIn: 5.00, costOut: 15.00 },
      'gpt5-mini': { id: 'openai/gpt-5-mini', maxTokens: 8192, costIn: 0.15, costOut: 0.60 },
      'gpt5-nano': { id: 'openai/gpt-5-nano', maxTokens: 4096, costIn: 0.10, costOut: 0.40 },
    },
  },
  worker: {
    workflows: [
      'WF-TUTOR-01',
      'WF-TUTOR-CONTEXT',
      'WF-FLASHCARDS',
      'WF-MINDMAP',
      'WF-CRONOGRAMA',
      'WF-RESUMO',
      'WF-EXERCICIOS',
      'WF-IMPORT-URL',
      'WF-IMPORT-PDF',
      'WF-TRANSCRIBE',
      'WF-LIVE-SUMMARY',
      'WF-LIVE-HIGHLIGHT',
      'WF-EMAIL',
      'WF-WHATSAPP',
      'WF-NOTIFICATION',
      'WF-ANALYZE-CHURN',
      'WF-REPORT-WEEKLY',
      'WF-HEALTHCHECK',
      'WF-EMBED-CONTENT',
    ],
    maxAttempts: 5,
    timeoutSeconds: 120,
  },
  features: {
    enabled: [
      'sna.tutor.enabled',
      'sna.tutor.streaming',
      'sna.tutor.context_window',
      'sna.flashcards.generate',
      'sna.mindmap.generate',
      'sna.cronograma.generate',
      'sna.live.summary',
      'sna.import.pdf',
      'sna.import.url',
      'sna.rag.enabled',
      'sna.cache.responses',
      'sna.email.auto',
      'sna.whatsapp.auto',
    ],
    disabled: [
      'sna.voice.narration',
      'sna.perplexity.web',
    ],
  },
};

// ============================================================
// MAPEAMENTO DE EVENTOS
// ============================================================

export const EVENT_HANDLERS: Record<string, string> = {
  'payment.succeeded': 'c-create-beta-user',
  'payment.failed': 'c-handle-payment-failure',
  'payment.refunded': 'c-handle-refund',
  'access.granted': 'c-grant-access',
  'access.revoked': 'c-revoke-access',
  'lesson.completed': 'c-grant-xp',
  'quiz.passed': 'c-grant-xp',
  'correct.answer': 'c-grant-xp',
  'daily.login': 'c-grant-xp',
  'streak.achieved': 'c-grant-xp',
  'level.up': 'c-handle-level-up',
  'badge.earned': 'c-handle-badge',
  'churn.risk.detected': 'c-handle-churn-risk',
};

// ============================================================
// HOOK useSNAConstitution
// ============================================================

export function useSNAConstitution() {
  return {
    config: SNA_CONFIG,
    eventHandlers: EVENT_HANDLERS,
    version: 'v5.0',
    codename: 'OMEGA',
    capacity: '5.000+ usuários',
    author: 'MESTRE PHD',
  };
}

export default SNA_CONFIG;
