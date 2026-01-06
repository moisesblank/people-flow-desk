# 🧠 CONSTITUIÇÃO SYNAPSE Ω v10.4 — CÉREBRO DEFINITIVO

**Versão:** 10.4.1  
**Data:** 2026-01-06  
**Status:** VIGENTE E IMUTÁVEL  
**OWNER:** `MOISESBLANK@GMAIL.COM` (único, case-insensitive)  
**Projeto:** PRO.MOISESMEDEIROS.COM.BR  
**Regra-mãe:** SÓ AVANÇA • PATCH-ONLY • ZERO REGRESSÃO • 0 TELA PRETA

---

# 📋 ÍNDICE

1. [PARTE I — DOGMAS IMUTÁVEIS](#parte-i--dogmas-imutáveis)
2. [PARTE II — SISTEMA DE ROLES](#parte-ii--sistema-de-roles)
3. [PARTE III — ROTEAMENTO](#parte-iii--roteamento)
4. [PARTE IV — ALUNOSROUTESWITCHER (P0 CRÍTICO)](#parte-iv--alunosrouteswitcher-p0-crítico)
5. [PARTE V — SEGURANÇA EM 4 CAMADAS](#parte-v--segurança-em-4-camadas)
6. [PARTE VI — 8 LEIS DE EXECUÇÃO](#parte-vi--8-leis-de-execução)
7. [PARTE VII — PROTOCOLOS DE EMERGÊNCIA](#parte-vii--protocolos-de-emergência)
8. [PARTE VIII — INVENTÁRIO EDGE FUNCTIONS](#parte-viii--inventário-edge-functions)
9. [PARTE IX — NUCLEAR LOCKDOWN SYSTEM](#parte-ix--nuclear-lockdown-system)
10. [PARTE X — ZONAS PROTEGIDAS](#parte-x--zonas-protegidas)
11. [PARTE XI — QUESTION DOMAIN](#parte-xi--question-domain)
12. [PARTE XII — GAMIFICAÇÃO E RANKING](#parte-xii--gamificação-e-ranking)
13. [PARTE XIII — STORAGE E BUCKETS](#parte-xiii--storage-e-buckets)
14. [PARTE XIV — BYPASSES ATIVOS](#parte-xiv--bypasses-ativos)
15. [PARTE XV — LISTA NEGRA](#parte-xv--lista-negra)
16. [PARTE XVI — GLOSSÁRIO](#parte-xvi--glossário)

---

# 🏛️ PARTE I — DOGMAS IMUTÁVEIS

## DOGMA ZERO — IDENTIDADE SOBERANA

```yaml
OWNER:
  email: "MOISESBLANK@GMAIL.COM"
  role: "owner"
  bypass: "UX_ONLY"  # Bypass SOMENTE de proteções de UX, NUNCA de segurança server-side
  master_mode: "enabled_only_owner"

VERIFICACAO_OWNER:
  fonte_verdade: "user_roles.role = 'owner'"
  email_audit: "moisesblank@gmail.com"  # Apenas para logs/auditoria
  frontend_bypass: "Sessão, 2FA, onboarding"
  backend_bypass: "NUNCA"
```

## DOGMA UM — EVOLUÇÃO PERPÉTUA

```yaml
REGRA: "SÓ AVANÇA, MELHORA, CRIA E READAPTA"
PROIBIDO: "Excluir ou retroceder sem autorização explícita do OWNER"
MANTRA: "Se o atual é superior, manter. Se pode melhorar, evoluir."
```

## DOGMA DOIS — PATCH-ONLY

```yaml
MÉTODO: "Mudanças SEMPRE via diff incremental"
PROIBIDO: "Reescrever arquivos inteiros ou refatorar por conveniência"
FALLBACK: "SE quebrar → rollback imediato"
```

## DOGMA TRÊS — EVIDÊNCIA OBRIGATÓRIA

```yaml
ANTES: "Diagnosticar via console + network + logs + headers"
DURANTE: "Verificar antes de mudar"
DEPOIS: "Revalidar gates + checklist PASS/FAIL"
```

## DOGMA QUATRO — INTERNAL SECRET POLICY

```yaml
INTERNAL_SECRET_EXIGIDO:
  - perda irreversível de dados
  - alteração em auth/user_roles/RBAC/RLS
  - quebra ou duplicação de OWNER
  - mudança de arquitetura base
  - impacto global em login/permissões/pagamentos
  - deleção de componentes do Question Domain

INTERNAL_SECRET_NAO_EXIGIDO:
  - correções de bug
  - patches locais
  - extensões compatíveis
  - UI/UX
  - auditorias
  - melhorias incrementais
```

---

# 🎯 PARTE II — SISTEMA DE ROLES

## PRINCÍPIO FUNDAMENTAL

| Conceito | Definição | Exemplo |
|----------|-----------|---------|
| **ROLE** | Valor no banco que define PERMISSÕES | `suporte` |
| **CARGO** | Texto descritivo para humanos | "Atendente Nível 2" |
| **CATEGORIA** | Agrupamento lógico (NÃO é role!) | "Funcionário", "Aluno" |

> ⚠️ **REGRA DE OURO:** `"employee"` e `"funcionario"` são CATEGORIAS, **nunca roles!**

## BLOCO GESTÃO — Quem TRABALHA na empresa

```yaml
acesso_base: "/gestaofc/*"
verificacao_sql: "is_gestao_staff(_user_id)"

ROLES:
  owner:
    label: "Proprietário"
    nivel: 0
    quantidade: 1 (ÚNICO)
    acesso: "TUDO + god_mode"
    
  admin:
    label: "Administrador"
    nivel: 1
    quantidade: ∞
    acesso: "Dashboard, alunos, cursos, funcionários, relatórios, marketing, config, usuários"
    
  coordenacao:
    label: "Coordenação"
    nivel: 2
    quantidade: ∞
    acesso: "Dashboard, alunos, cursos, turmas, relatórios"
    
  contabilidade:
    label: "Contabilidade"
    nivel: 2
    quantidade: ∞
    acesso: "Dashboard, financeiro, relatórios, entradas, pagamentos, fluxo-caixa"
    
  suporte:
    label: "Suporte"
    nivel: 3
    quantidade: ∞
    acesso: "Dashboard, alunos, WhatsApp"
    
  monitoria:
    label: "Monitoria"
    nivel: 3
    quantidade: ∞
    acesso: "Dashboard, alunos, redações, dúvidas"
    
  marketing:
    label: "Marketing"
    nivel: 3
    quantidade: ∞
    acesso: "Dashboard, marketing, analytics, leads, lançamentos"
    
  afiliado:
    label: "Afiliado"
    nivel: 3
    quantidade: ∞
    acesso: "Dashboard, afiliados, comissões"
```

## BLOCO ALUNOS — Quem ESTUDA na plataforma

```yaml
acesso_base: "/alunos/*"
destino_canonico: "/alunos/dashboard"  # NUNCA apenas /alunos
verificacao_sql: "is_aluno(_user_id)"

ROLES:
  beta:
    label: "Aluno Beta/Premium"
    nivel: 1
    duracao: "365 dias"
    acesso: "Portal completo, videoaulas, materiais, simulados, redação, tutoria, lives, certificados, comunidade premium"
    xp_enabled: true
    redirect_pos_login: "/alunos/dashboard"
    
  aluno_gratuito:
    label: "Aluno Gratuito"
    nivel: 2
    duracao: "Indefinido"
    acesso: "Área gratuita, comunidade básica, materiais amostra"
    xp_enabled: false
    redirect_pos_login: "/comunidade"
    
  aluno_presencial:
    label: "Aluno Presencial"
    nivel: 1
    duracao: "Por turma"
    acesso: "Portal completo (equivalente beta)"
    xp_enabled: true
    redirect_pos_login: "/alunos/dashboard"
    
  beta_expira:
    label: "Beta com Expiração"
    nivel: 1
    duracao: "Configurável"
    acesso: "Portal completo até expiração"
    xp_enabled: true
    redirect_pos_login: "/alunos/dashboard"
```

## FUNÇÕES SQL (FONTE DA VERDADE)

```sql
-- Verifica se é staff de gestão
CREATE FUNCTION is_gestao_staff(_user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner', 'admin', 'coordenacao', 'contabilidade', 
                 'suporte', 'monitoria', 'marketing', 'afiliado')
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verifica se é aluno
CREATE FUNCTION is_aluno(_user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira')
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verifica se é owner
CREATE FUNCTION is_owner(_user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## ROLES DEPRECATED (NUNCA USAR)

```yaml
PROIBIDOS:
  - employee      # Use role específica
  - funcionario   # Use role específica  
  - user          # Use aluno_gratuito
  - aluno         # Use beta ou aluno_gratuito
  - moderator     # Use monitoria
```

---

# 🗺️ PARTE III — ROTEAMENTO

## REGRA CARDINAL — DESTINO CANÔNICO DO ALUNO

```yaml
REGRA_CRITICA: "Todo redirecionamento para área de aluno DEVE ir para /alunos/dashboard"
PROIBIDO: "Redirecionar para /alunos (raiz) como destino final"
MOTIVO: "/alunos é ROTEADOR, não DESTINO"

EXEMPLOS_CORRETOS:
  - navigate('/alunos/dashboard')
  - <Navigate to="/alunos/dashboard" replace />
  - href="/alunos/dashboard"

EXEMPLOS_PROIBIDOS:
  - navigate('/alunos')  # ❌ ERRADO
  - <Navigate to="/alunos" replace />  # ❌ ERRADO
  - href="/alunos"  # ❌ ERRADO
```

## MAPA CANÔNICO DE URLs

| Área | URL | Quem Acessa | Arquivo Fonte |
|------|-----|-------------|---------------|
| Hub Principal | pro.moisesmedeiros.com.br | Todos | - |
| Auth | `/auth` | Todos | publicRoutes.tsx |
| Público | `/`, `/sobre`, `/contato` | Anônimos | publicRoutes.tsx |
| Comunidade | `/comunidade/*` | Todos | comunidadeRoutes.tsx |
| Portal Aluno | `/alunos/dashboard` | beta, aluno_*, owner | alunoRoutes.tsx |
| Gestão | `/gestaofc/*` | Todas roles de gestão | gestaofcRoutes.tsx |
| Segurança | `/security/*` | Sistema | publicRoutes.tsx |

## MAPEAMENTO PÓS-LOGIN

```yaml
# Arquivo: src/core/urlAccessControl.ts

MAPEAMENTO:
  owner: "/gestaofc"
  admin: "/gestaofc"
  coordenacao: "/gestaofc"
  contabilidade: "/gestaofc"
  suporte: "/gestaofc"
  monitoria: "/gestaofc"
  marketing: "/gestaofc"
  afiliado: "/gestaofc"
  beta: "/alunos/dashboard"           # ← SEMPRE /alunos/dashboard
  aluno_gratuito: "/comunidade"
  aluno_presencial: "/alunos/dashboard"  # ← SEMPRE /alunos/dashboard
  beta_expira: "/alunos/dashboard"       # ← SEMPRE /alunos/dashboard
  sem_role: "/perfil-incompleto"
  autenticado_sem_sessao: "/auth"
```

## ROTAS OWNER ONLY

```yaml
EXCLUSIVAS_OWNER:
  - /gestaofc/central-monitoramento
  - /gestaofc/central-diagnostico
  - /gestaofc/diagnostico-whatsapp
  - /gestaofc/diagnostico-webhooks
  - /gestaofc/site-programador
  - /gestaofc/vida-pessoal
  - /gestaofc/pessoal
  - /gestaofc/master
  - /gestaofc/owner
  - /gestaofc/gestao-dispositivos
  - /gestaofc/auditoria-acessos
  - /gestaofc/central-ias
  - /gestaofc/central-metricas
  - /gestaofc/central-whatsapp
  - /gestaofc/whatsapp-live
  - /gestaofc/monitoramento
```

## ROTAS PÚBLICAS (SEM AUTH)

```yaml
PUBLICAS:
  - /
  - /site
  - /auth
  - /login
  - /cadastro
  - /registro
  - /recuperar-senha
  - /termos
  - /privacidade
  - /area-gratuita
  - /perfil-incompleto
  - /primeiro-acesso
  - /security/device-limit
  - /security/same-type-replacement
  - /qr
```

## ROTAS LEGADAS (REDIRECT SILENCIOSO)

```yaml
COMPORTAMENTO: "Rotas legadas redirecionam para destino canônico"

MAPEAMENTO_LEGADO:
  /aluno: "/alunos/dashboard"      # ← Atualizado
  /ALUNOS: "/alunos/dashboard"     # ← Atualizado
  /dashboard: "/"
  /admin: "/"
  /gestao/*: "/"
  /funcionarios: "/"
  /calendario: "/"
```

## ISOLAMENTO DE BLOCOS

```yaml
REGRA_CRITICA: "GESTÃO e ALUNOS não vazam acesso entre si"

IMPLEMENTACAO:
  - Sem bypass por URL direta
  - Sem bypass por refresh
  - Sem bypass por deep link
  - Segurança NO BACKEND, não no frontend
```

---

# 🚨 PARTE IV — ALUNOSROUTESWITCHER (P0 CRÍTICO)

```yaml
ARQUIVO: "src/pages/AlunosRouteSwitcher.tsx"
FUNCAO: "ROTEADOR, não RENDERIZADOR"

IMPORTS_PERMITIDOS:
  - useMemo, Navigate, Helmet
  - useAdminCheck, useRolePermissions
  - Alunos (APENAS para gestão)

IMPORTS_PROIBIDOS:
  - AlunoDashboard
  - AlunoHome
  - AlunoProfile
  - Qualquer @/pages/aluno/*

COMPORTAMENTO_ATUAL:
  owner_gestao: "<Alunos />"  # Gestão de alunos
  owner_pro: "<Navigate to='/alunos/dashboard' replace />"
  beta: "<Navigate to='/alunos/dashboard' replace />"
  aluno_gratuito: "<Navigate to='/comunidade' replace />"
  admin_gestao: "<Alunos />"
  admin_pro: "<Navigate to='/alunos/dashboard' replace />"
  outros: "<Navigate to='/comunidade' replace />"

REGRA: "NUNCA usar <Navigate to='/alunos' /> — SEMPRE /alunos/dashboard"
MOTIVO: "Renderizar <AlunoDashboard /> diretamente causa TELA PRETA"
VIOLACAO: "TELA PRETA = BUG P0 = ROLLBACK IMEDIATO"
```

---

# 🔒 PARTE V — SEGURANÇA EM 4 CAMADAS

## CAMADA 1 — BORDA (Edge Guard)

```yaml
quando: "Primeira linha de defesa"
componentes:
  - Rate limiting por IP/user
  - Turnstile (captcha) em forms críticos
  - Validação de headers
  - Bloqueio de IPs maliciosos
  
edge_functions:
  - rate-limit-gateway
  - verify-turnstile
  - api-gateway
  - secure-webhook-ultra
```

## CAMADA 2 — AUTENTICAÇÃO E AUTORIZAÇÃO

```yaml
quando: "Após passar pela borda"
componentes:
  - Supabase Auth (sessões, tokens)
  - RBAC via user_roles
  - RLS em TODAS as tabelas (default deny)
  - Funções SECURITY DEFINER
  
arquivos:
  - src/hooks/useAuth.tsx
  - src/hooks/useRolePermissions.tsx
  - src/core/urlAccessControl.ts
  - src/core/areas/index.ts

principio: "Sem role = sem acesso. Erro = deny."
```

## CAMADA 3 — PROTEÇÃO DE CONTEÚDO

```yaml
quando: "Acesso a conteúdo premium"
componentes:
  - Signed URLs curtas (expiração)
  - Watermark forense (nome + email + timestamp)
  - Logs de acesso detalhados
  - Proteção de vídeo (Panda)
  
edge_functions:
  - get-panda-signed-url
  - book-page-signed-url
  - secure-video-url
  - sanctum-report-violation
```

## CAMADA 4 — DETECÇÃO COMPORTAMENTAL (Sanctum)

```yaml
quando: "Monitoramento contínuo"
STATUS_ATUAL: "BYPASS_TEMPORARIO (Plano A Nuclear)"

componentes:
  - Threat score (0-100)
  - Fingerprint de dispositivo
  - Detecção de DevTools/print (sinais, não garantia)
  - Resposta progressiva: step-up → throttle → logout → ban

arquivos:
  - src/components/security/SessionGuard.tsx
  - src/components/security/DeviceGuard.tsx
  - src/components/security/DeviceMFAGuard.tsx
  - src/hooks/useSanctumCore.ts

owner_bypass: "UX e step-up apenas, server-side sempre valida"
```

## FLUXO DE SEGURANÇA COMPLETO

```
Request → [Camada 1: Edge] → [Camada 2: Auth/RLS] → [Camada 3: Signed URL] → [Camada 4: Sanctum]
              ↓                      ↓                      ↓                      ↓
         Rate limit?            Autenticado?            URL válida?           Threat score?
         IP bloqueado?          Tem role?               Não expirou?          Comportamento ok?
              ↓                      ↓                      ↓                      ↓
           BLOCK                   DENY                   DENY                 STEP-UP/BAN
```

---

# ⚡ PARTE VI — 8 LEIS DE EXECUÇÃO

## LEI I — PERFORMANCE

```yaml
budgets_p75:
  LCP: "<2.5s (ideal <2.0s)"
  INP: "<200ms"
  CLS: "<0.1"
  TTFB: "<800ms"

bundle_inicial: "<500KB (crítico: 1MB)"
3g_gate: "UI útil em 6-8s (Slow 3G + CPU 4x)"

react_query:
  staleTime: "5min"
  retry: 2
  refetchOnFocus: false
  refetchOnReconnect: true

regras:
  - Debounce 300ms em buscas
  - Virtualização para >50 itens
  - Polling mínimo 30s (preferir realtime)
```

## LEI II — DISPOSITIVOS

```yaml
breakpoints:
  xs: 0
  sm: 640
  md: 768
  lg: 1024
  xl: 1280
  2xl: 1536

touch:
  minimo: "44px"
  espacamento: "8px"
  fonte: "≥16px"

acessibilidade:
  - Foco visível
  - Contraste aceitável
  - Navegação por teclado
  - Sem hover obrigatório
```

## LEI III — SEGURANÇA

```yaml
principio: "Defense in depth"
camadas: 4

regras_absolutas:
  - RLS em TODAS as tabelas
  - Default deny
  - Secrets NUNCA no client
  - Auth server-side obrigatório
```

## LEI IV — SNA OMEGA v5.0

```yaml
gateway: "sna-gateway (único ponto de entrada)"

camadas:
  1. Ingestão
  2. Orquestração
  3. Processamento
  4. Inteligência
  5. Observabilidade

tabelas: "sna_jobs, sna_budgets, sna_cache, sna_tool_runs, sna_audit_log"
```

## LEI V — ESTABILIDADE SUPREMA

```yaml
PROIBIDO:
  - Service Workers
  - PWA/Offline
  - public/sw.js
  - public/offline.html
  - vite-plugin-pwa
  - Workbox

OBRIGATORIO:
  - manifest.json display: "browser"
  - sourcemap: false em produção
  - Sem manualChunks forçado
  - Bootstrap limpa caches legados
```

## LEI VI — IMUNIDADE E ALLOWLISTS

```yaml
outbound: "OMEGA/ALPHA são allowlists para APIs externas"
inbound: "NUNCA é bypass"

regras:
  - /functions/* exige JWT + rate limit
  - /webhooks/* exige assinatura + idempotência
  - /api/* exige autenticação

waf_skip: "Apenas assets públicos (/assets/*, manifest, favicon)"
```

## LEI VII — SANCTUM (FAIL-OPEN)

```yaml
arquitetura: "Fail-open para não travar a aplicação"
arquivo: "src/lib/constitution/executeLeiVII.ts"

deteccao: "F12, print, seleção, right-click = SINAIS (não garantia)"

watermark:
  conteudo: "nome + CPF/email + timestamp"
  formato: "grid"
  atualizacao: "15s"

threat_score:
  range: "0-100"
  threshold: 80
  resposta: "step-up → throttle → logout → auditoria"

owner_bypass: "UX apenas, server-side valida sempre"
```

## LEI VIII — INTEGRAÇÕES

```yaml
padrao:
  - Timeout obrigatório
  - Retry com backoff exponencial
  - Circuit breaker
  - Fallback definido

hotmart:
  - Webhook assinado (HOTTOK)
  - Idempotência por transaction_id
  - Edge Function: hotmart-webhook-processor

panda:
  - URLs assinadas curtas
  - Proteção de vídeo
  - Edge Function: get-panda-signed-url
```

---

# 🚨 PARTE VII — PROTOCOLOS DE EMERGÊNCIA

## PROTOCOLO P0 — TELA PRETA

```yaml
sintoma: "Aplicação não carrega / tela em branco"

runbook:
  1. HTML Gate:
     - View Source NÃO deve ter /@vite/client
     - DEVE ter /assets/*
     
  2. MIME Gate:
     - /assets/*.js deve retornar 200
     - Content-Type deve ser application/javascript
     
  3. SW Gate:
     - Nenhum Service Worker ativo
     - public/sw.js NÃO deve existir
     
  4. Se Cloudflare proxied:
     - Rocket Loader OFF
     - Minify JS OFF
     - HTML cache BYPASS
     
  5. Teste:
     - Aba anônima + hard reload
     
  6. Se persistir:
     - Rebind domínio no Lovable
     - Publish/update
```

## PROTOCOLO P1 — AUTH QUEBRADO

```yaml
sintoma: "Login não funciona / loop de redirect"

runbook:
  1. Verificar Supabase Auth status
  2. Verificar RLS policies em profiles e user_roles
  3. Verificar Edge Functions de auth
  4. Limpar cookies/sessão local
  5. Testar em aba anônima
```

## PROTOCOLO P2 — DADOS NÃO CARREGAM

```yaml
sintoma: "Tabelas vazias / erros de query"

runbook:
  1. Verificar RLS policies
  2. Verificar role do usuário
  3. Verificar logs de Edge Functions
  4. Verificar limites de query (1000 rows default)
```

---

# 🏗️ PARTE VIII — INVENTÁRIO EDGE FUNCTIONS

## TIER OMEGA (NUNCA DESATIVAR)

```yaml
CORE:
  - sna-gateway          # Gateway IA Enterprise
  - sna-worker           # Processamento background
  - orchestrator         # Tramon v9.0 - Coordenação IAs
  - event-router         # Roteador de eventos
  - webhook-receiver     # Recebimento webhooks
  - queue-worker         # Processamento filas

INTEGRACAO:
  - hotmart-webhook-processor  # Processador Hotmart
  - hotmart-fast               # Fast path Hotmart

SEGURANCA:
  - verify-turnstile           # Validação captcha
  - rate-limit-gateway         # Rate limiting
  - api-gateway                # Gateway API
  - api-fast                   # Fast path API
  - ia-gateway                 # Gateway IA
  - secure-webhook-ultra       # Webhook seguro
  - secure-video-url           # URLs seguras vídeo
```

## TIER ALPHA (MONITORAR)

```yaml
IA:
  - ai-tutor              # Tutor virtual
  - ai-assistant          # Assistente geral
  - book-chat-ai          # Chat livros
  - chat-tramon           # Interface Tramon
  - generate-ai-content   # Geração conteúdo

VIDEO:
  - video-authorize-omega   # Autorização vídeo
  - book-page-signed-url    # URLs livros
  - get-panda-signed-url    # URLs Panda

USUARIOS:
  - c-create-beta-user    # Criação usuário beta
  - c-handle-refund       # Reembolsos
  - c-grant-xp            # Concessão XP
  - invite-employee       # Convite funcionário
  - admin-delete-user     # Exclusão usuário

COMUNICACAO:
  - send-email               # Gateway email
  - send-notification-email  # Notificações
  - notify-owner             # Alertas owner
  - whatsapp-webhook         # WhatsApp
```

## TOTAL: 94 EDGE FUNCTIONS

---

# 🛡️ PARTE IX — NUCLEAR LOCKDOWN SYSTEM

```yaml
DOGMA: "Usuário EXCLUÍDO = ANIQUILAÇÃO TOTAL"

TABELAS_CRITICAS:
  - system_guard: "Controle global (auth_enabled, auth_epoch)"
  - active_sessions: "Sessões com auth_epoch_at_login"

FUNCOES_SQL:
  validate_session_epoch:
    verificacoes:
      - AUTH_LOCKDOWN (auth_enabled = false)
      - SESSION_NOT_FOUND (sessão não existe)
      - SESSION_EXPIRED (expirou)
      - AUTH_EPOCH_REVOKED (epoch diverge)
      - USER_DELETED (não existe em auth.users)
      - USER_DISABLED (profile.status = 'inativo')
      
  create_single_session:
    acoes:
      - Verifica lockdown
      - Revoga sessões anteriores
      - Registra epoch
      
  nuclear_revoke_all_sessions:
    restricao: "OWNER ONLY"
    efeito: "Incrementa epoch global (mata TODAS sessões)"
    
  toggle_auth_lockdown:
    restricao: "OWNER ONLY"
    efeito: "Desabilita auth globalmente"

PROTECOES:
  - Owner (moisesblank@gmail.com) IMUNE a exclusão
  - Epoch increment = TODAS as sessões morrem
  - auth_enabled = false = NINGUÉM pode logar
  - Broadcast Realtime = logout em <300ms
```

## POLÍTICA DE SESSÕES

```yaml
LOGOUT_EQUALS_DELETE:
  comportamento: "DELETE físico da tabela active_sessions"
  nao_usa: "UPDATE status='revoked'"
  
FLUXO_LOGOUT:
  1. Broadcast 'session-revoked' (reason: 'user_logout')
  2. DELETE FROM active_sessions WHERE session_token = ?
  3. Limpar localStorage/sessionStorage
  4. supabase.auth.signOut()
  5. Redirect /auth

FLUXO_NOVO_LOGIN:
  1. Verificar auth_enabled via system_guard
  2. DELETE sessões anteriores do usuário
  3. Criar nova sessão via create_single_session
  4. Registrar auth_epoch_at_login
  5. Redirect para área apropriada (/gestaofc ou /alunos/dashboard)
```

---

# 📜 PARTE X — ZONAS PROTEGIDAS

```yaml
AUTH_CORE:
  - src/pages/Auth.tsx
  - src/hooks/useAuth.tsx
  status: "NÃO TOCAR sem INTERNAL_SECRET"

SECURITY_GUARDS:
  - src/components/security/SessionGuard.tsx
  - src/components/security/DeviceGuard.tsx
  - src/components/security/DeviceMFAGuard.tsx
  - src/components/security/SessionRevokedOverlay.tsx
  - src/components/auth/ActiveSessionGate.tsx
  - src/components/auth/DeviceLimitGate.tsx
  status: "FUNCIONAIS (Plano A Nuclear = OPERACIONAL)"

EDGE_FUNCTIONS_CRITICAS:
  - supabase/functions/register-device-server/
  - supabase/functions/verify-2fa-code/
  status: "NÃO TOCAR"

TABELAS_CRITICAS:
  - active_sessions
  - user_devices
  - system_guard
  - user_roles
  - profiles
  status: "RLS OBRIGATÓRIO"

ACCESS_CONTROL:
  - src/core/urlAccessControl.ts
  - src/core/areas/index.ts
  - src/hooks/useRolePermissions.tsx
  status: "FONTE ÚNICA DA VERDADE"
```

---

# 📚 PARTE XI — QUESTION DOMAIN

## ESTRUTURA PROTEGIDA

```yaml
ARQUIVO_CONSTITUICAO: "src/lib/audits/CONSTITUTION_QUESTION_DOMAIN.ts"
STATUS: "VIGENTE E IMUTÁVEL (v1.1.0)"

TABELAS:
  quiz_questions:
    colunas_obrigatorias:
      - id (UUID)
      - question_text (TEXT)
      - question_type (multiple_choice | discursive)
      - options (JSONB)
      - correct_answer (TEXT)
      - explanation (TEXT)
      - difficulty (facil | medio | dificil)
      - macro (TEXT) # OBRIGATÓRIO
      
  question_taxonomy:
    hierarquia: "macro → micro → tema → subtema"
    colunas:
      - id, label, value, level, parent_value, position, is_active
```

## TAXONOMIA CANÔNICA (5 MACROS)

```yaml
MACROS_QUIMICA:
  quimica_geral:
    label: "Química Geral"
    icon: "⚗️"
    color: "amber"
    micros:
      - Propriedades da Matéria
      - Atomística
      - Tabela Periódica
      - Ligações Químicas
      - Estequiometria
      - Balanceamento
      - Conceitos Modernos
      
  fisico_quimica:
    label: "Físico-Química"
    icon: "⚡"
    color: "cyan"
    micros:
      - Termoquímica
      - Cinética Química
      - Equilíbrio Químico
      - Eletroquímica
      - Soluções
      - Propriedades Coligativas
      - Radioatividade
      - Cálculos Químicos
      
  quimica_organica:
    label: "Química Orgânica"
    icon: "🧪"
    color: "purple"
    micros:
      - Funções Orgânicas
      - Isomeria
      - Reações Orgânicas
      - Polímeros
      
  quimica_ambiental:
    label: "Química Ambiental"
    icon: "🌿"
    color: "green"
    micros:
      - Poluição
      - Ciclos Biogeoquímicos
      - Chuva Ácida
      - Efeito Estufa
      
  bioquimica:
    label: "Bioquímica"
    icon: "🧬"
    color: "pink"
    micros:
      - Proteínas
      - Carboidratos
      - Lipídios
      - Ácidos Nucleicos
      - Metabolismo
```

## COMPONENTES PROTEGIDOS

```yaml
PAGINAS:
  - src/pages/gestao/GestaoQuestoes.tsx        # /gestaofc/questoes
  - src/pages/gestao/GestaoQuestaoDetalhe.tsx  # /gestaofc/questoes/:id
  - src/pages/aluno/AlunoQuestoes.tsx          # /alunos/questoes

SHARED:
  - src/components/shared/QuestionEnunciado.tsx   # Renderização universal
  - src/components/shared/QuestionResolution.tsx  # Resoluções comentadas
  - src/components/gestao/questoes/TaxonomyManager.tsx

LMS:
  - src/components/lms/QuizPlayer.tsx          # Player de simulados
  - src/components/lms/QuestionPractice.tsx    # Prática de questões

HOOKS:
  - src/hooks/useQuestionTaxonomy.ts           # Hook principal
```

## PADRÃO OBRIGATÓRIO DE RENDERIZAÇÃO

```yaml
ENUNCIADO:
  componente: "QuestionEnunciado"
  regras:
    - Header da banca: centralizado, bold, UPPERCASE
    - Remoção de caracteres bugados
    - Formatação química automática (H2O → H₂O)
    - Imagens: max-h-[900px]

RESOLUCAO:
  componente: "QuestionResolution"
  blocos_visuais:
    - ✅ AFIRMAÇÃO (correta) → Verde
    - ❌ AFIRMAÇÃO (incorreta) → Vermelho
    - PASSO 1, 2, 3... → Azul
    - CONCLUSÃO → Esmeralda
    - COMPETÊNCIA ENEM → Roxo
    - ESTRATÉGIA → Âmbar
    - PEGADINHAS → Laranja
    - DICA DE OURO → Amarelo
```

---

# 🎮 PARTE XII — GAMIFICAÇÃO E RANKING

## ESTRUTURA DE DADOS

```yaml
TABELAS:
  user_gamification:
    colunas:
      - user_id (UNIQUE)
      - total_xp
      - current_level
      - current_streak
      - longest_streak
      - last_activity_date
      - courses_completed
      - lessons_completed
      - badges_earned
      
  xp_history:
    colunas:
      - user_id
      - amount
      - source
      - source_id
      - description
      - created_at
      
  badges / user_badges:
    funcao: "Conquistas e desbloqueios"
```

## SISTEMA DE XP

```yaml
SIMULADOS:
  xp_por_acerto: 10
  impacta_ranking: true
  rota: "/alunos/simulados"
  regra: "Apenas primeiro acerto conta"
  
MODO_TREINO:
  xp_por_acerto: 0
  impacta_ranking: false
  rota: "/alunos/questoes"
  funcao: "Evolução acadêmica"

MULTIPLICADORES_STREAK:
  7_dias: 1.5x
  30_dias: 2.0x
  100_dias: 3.0x
  365_dias: 5.0x
```

## NÍVEIS E TÍTULOS

```yaml
LEVEL_THRESHOLDS:
  - level: 1,  xp: 0,     title: "Iniciante"
  - level: 2,  xp: 100,   title: "Aprendiz"
  - level: 3,  xp: 250,   title: "Estudante"
  - level: 4,  xp: 500,   title: "Dedicado"
  - level: 5,  xp: 850,   title: "Conhecedor"
  - level: 10, xp: 2000,  title: "Especialista"
  - level: 15, xp: 4000,  title: "Avançado"
  - level: 20, xp: 7000,  title: "Mestre"
  - level: 30, xp: 15000, title: "Grão-Mestre"
  - level: 50, xp: 35000, title: "Lenda"

FORMULA: "Nível = floor(total_xp / 100) + 1"
```

## RANKING

```yaml
GLOBAL:
  ordenacao: "total_xp DESC"
  limite: 100
  
SEMANAL:
  tabela: "weekly_xp"
  reset: "Domingo 00:00"
  
VISUALIZACAO:
  arquivo: "src/pages/aluno/AlunoRanking.tsx"
  tema: "Spider-Man"
  podio: "Top 3 destacados"
```

---

# 📦 PARTE XIII — STORAGE E BUCKETS

```yaml
BUCKETS_ATIVOS:
  - arquivos
  - aulas
  - avatars
  - certificados
  - comprovantes
  - documentos
  - materiais
  - whatsapp-attachments
  - ena-assets-raw
  - ena-assets-transmuted

REGRAS:
  - Signed URLs para conteúdo privado
  - Validação de MIME type
  - Limite de tamanho por bucket
  - RLS em storage.objects
```

---

# 🔓 PARTE XIV — BYPASSES ATIVOS

## PLANO A NUCLEAR

```yaml
STATUS: "ATIVO"
DATA_ATIVACAO: "2026-01-06"
MOTIVO: "Estabilização após telas pretas"

COMPONENTES_EM_BYPASS:
  - SessionGuard → Funcional, não bloqueia
  - DeviceGuard → Funcional, não bloqueia
  - DeviceMFAGuard → Funcional, não bloqueia
  - ActiveSessionGate → Não usado
  - DeviceLimitGate → Disponível via rota
  
COMPORTAMENTO:
  - Guards renderizam children normalmente
  - Validação de sessão continua ativa (30s interval)
  - Realtime listeners funcionam
  - Bloqueio forçado não ocorre

CONDICAO_RESTAURACAO:
  - Zero telas pretas por 7 dias consecutivos
  - Testes manuais aprovados
  - INTERNAL_SECRET do OWNER
```

## OWNER BYPASS

```yaml
EMAIL: "moisesblank@gmail.com"
ROLE: "owner"

BYPASS_UX:
  - 2FA pendente
  - Onboarding obrigatório
  - Device limit
  - Session conflicts
  
BYPASS_SERVER: "NUNCA"
  - RLS sempre aplica
  - Auth sempre valida
  - Rate limit sempre aplica
```

## BETA TESTER BYPASS

```yaml
EMAIL: "moisescursoquimica@gmail.com"

BYPASS_UX:
  - 2FA pendente (para testes)
  
BYPASS_FUNCIONAL: "Nenhum"
```

---

# ❌ PARTE XV — LISTA NEGRA

```yaml
NUNCA_FAZER:
  # Roles
  - Usar "employee" ou "funcionario" como role
  
  # Service Worker
  - Registrar Service Workers
  - Criar public/sw.js ou offline.html
  - Usar manifest.json display: "standalone"
  - Instalar vite-plugin-pwa ou Workbox
  
  # Código
  - Forçar manualChunks em produção
  - Reescrever arquivos inteiros
  - Expor secrets no client
  - Segurança apenas no frontend
  
  # Decisões
  - Assumir decisões críticas sem perguntar
  - Retroceder sem autorização do OWNER
  
  # AlunosRouteSwitcher
  - Importar AlunoDashboard
  - Renderizar <AlunoDashboard /> diretamente
  - Usar <Navigate to="/alunos" /> (SEMPRE usar /alunos/dashboard)
  
  # Redirecionamentos
  - Redirecionar para /alunos como destino final
  - Usar href="/alunos" em navegação
  - navigate('/alunos') sem subrota
  
  # Dados
  - Deletar dados sem backup
  - Alterar user_roles sem validação
```

---

# 📚 PARTE XVI — GLOSSÁRIO

| Termo | Definição |
|-------|-----------|
| **ROLE** | Valor no banco que define PERMISSÕES |
| **CARGO** | Texto descritivo para humanos |
| **FUNCIONÁRIO** | CATEGORIA = qualquer pessoa que trabalha na empresa |
| **BETA** | Aluno PAGANTE com acesso completo |
| **ALUNO_GRATUITO** | Cadastro grátis com acesso limitado |
| **OWNER** | Dono do sistema. Único. Imutável. |
| **RLS** | Row Level Security |
| **RBAC** | Role Based Access Control |
| **SANCTUM** | Sistema de proteção de conteúdo |
| **SNA** | Sistema Neural Autônomo — orquestração de IA |
| **PATCH-ONLY** | Mudanças apenas incrementais |
| **EPOCH** | Contador global de sessões |
| **XP** | Experience Points (gamificação) |
| **MACRO** | Nível 1 da taxonomia de questões |
| **MICRO** | Nível 2 da taxonomia de questões |
| **/alunos/dashboard** | Destino canônico do Portal do Aluno |

---

# ✅ VERIFICAÇÃO FINAL

```yaml
GATE_VERIFICACAO_FINAL:
  obrigatorio: true
  checklist:
    - [ ] Console logs: zero erros
    - [ ] Preview: funcionando
    - [ ] Persistência: dados salvos
    - [ ] Rotas: navegação correta
    - [ ] Auth: login/logout funcional
    - [ ] RLS: dados isolados por usuário
    - [ ] Redirecionamentos: TODOS para /alunos/dashboard (não /alunos)

  se_falhar:
    - Declarar "NÃO PRONTO"
    - Análise de causa raiz
    - Rollback se necessário
    - Notificar OWNER
```

---

**FIM — CONSTITUIÇÃO SYNAPSE Ω v10.4.1**

**Status:** VIGENTE E IMUTÁVEL  
**Autoridade:** OWNER (moisesblank@gmail.com)  
**Data:** 2026-01-06  
**Mudança v10.4.1:** Destino canônico do Portal do Aluno atualizado para /alunos/dashboard  
**Assinatura Digital:** SYNAPSE Ω v10.4.1
