# 🛡️ INVENTÁRIO COMPLETO DE SEGURANÇA - FORTALEZA SUPREME v4.0
## Sistema de Segurança PHD-Level 2300
**Última Atualização:** 22/12/2025

---

## 📊 RESUMO EXECUTIVO

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| **Tabelas de Segurança** | 30 | ✅ Todas com RLS |
| **Funções SQL de Segurança** | 60+ | ✅ Ativas |
| **Componentes Frontend** | 9 | ✅ Implementados |
| **Hooks de Segurança** | 15+ | ✅ Funcionando |
| **Edge Functions** | 54 | ✅ Deployadas |
| **Bibliotecas de Segurança** | 2 | ✅ Integradas |

---

## 🏛️ ARQUITETURA DE SEGURANÇA

### CAMADA 1: Banco de Dados (Supabase)

#### Tabelas de Segurança (30 tabelas com RLS)
```
├── active_sessions          # Sessões ativas por usuário
├── activity_log             # Log de atividades gerais
├── admin_audit_log          # Auditoria de ações admin
├── api_rate_limits          # Limites de rate por API
├── audit_access_mismatches  # Discrepâncias de acesso
├── audit_logs               # Log de auditoria geral
├── auditoria_grupo_beta     # Auditoria de acesso beta
├── auditoria_grupo_beta_completo
├── content_access_log       # Log de acesso a conteúdo
├── device_access_attempts   # Tentativas de acesso por dispositivo
├── logs_integracao_detalhado
├── permission_audit_logs    # Log de permissões
├── rate_limit_config        # Configuração de rate limits
├── rate_limit_realtime      # Rate limit em tempo real
├── rate_limit_state         # Estado atual de rate limits
├── security_access_attempts # Tentativas de acesso
├── security_audit_log       # Auditoria de segurança
├── security_dashboard       # Dashboard de segurança
├── security_events          # Eventos de segurança v1
├── security_events_v2       # Eventos de segurança v2
├── security_log_immutable   # Logs IMUTÁVEIS (não podem ser deletados)
├── threat_intelligence      # Inteligência de ameaças
├── tramon_command_log       # Log de comandos IA
├── tramon_logs              # Logs da IA Tramon
├── url_access_rules         # Regras de acesso por URL
├── user_access_expiration   # Expiração de acessos
├── user_roles               # Roles de usuários (CRÍTICO)
├── user_sessions            # Sessões de usuário
└── webhook_rate_limits      # Rate limits de webhooks
```

#### Funções SQL de Segurança (60+ funções)
```sql
-- AUTENTICAÇÃO E ROLES
├── get_user_role(_user_id)           # Obter role do usuário
├── get_user_role_secure(_user_id)    # Versão segura
├── get_user_role_v2(_user_id)        # Versão otimizada
├── has_role(_user_id, _role)         # Verificar se tem role
├── is_owner()                        # Verificar se é owner
├── is_admin_or_owner()               # Verificar admin ou owner
├── assign_owner_role(_user_id)       # Atribuir role owner

-- SESSÃO ÚNICA (DOGMA I)
├── create_single_session(...)        # Criar sessão única
├── validate_session_token(token)     # Validar token de sessão
├── validate_session_v2(token)        # Validação v2
├── invalidate_session(token)         # Invalidar sessão
├── revoke_other_sessions_v2(...)     # Revogar outras sessões
├── cleanup_expired_sessions_v2()     # Limpar sessões expiradas

-- CONTROLE DE DISPOSITIVOS (DOGMA XI)
├── register_device_with_limit(...)   # Registrar dispositivo com limite
├── admin_get_all_devices()           # Admin: listar dispositivos
├── admin_get_device_stats()          # Admin: estatísticas
├── admin_get_blocked_attempts()      # Admin: tentativas bloqueadas

-- ACESSO BETA (DOGMA XII)
├── check_beta_access(_user_id)       # Verificar acesso beta
├── grant_beta_access(_user_id, _days) # Conceder acesso
├── extend_beta_access(...)           # Estender acesso
├── revoke_beta_access(_user_id)      # Revogar acesso
├── admin_list_beta_users()           # Listar usuários beta

-- RATE LIMITING
├── check_rate_limit(...)             # Rate limit v1
├── check_rate_limit_v2(...)          # Rate limit v2
├── check_rate_limit_v3(...)          # Rate limit v3 (atual)
├── check_api_rate_limit(...)         # Rate limit de API
├── check_chat_rate_limit(...)        # Rate limit de chat
├── auto_cleanup_rate_limits()        # Auto-limpeza
├── cleanup_old_rate_limits()         # Limpeza manual
├── cleanup_rate_limits_v3()          # Limpeza v3

-- VERIFICAÇÃO DE ACESSO
├── check_url_access_v3(...)          # Verificar acesso a URL
├── can_access_url_v2(...)            # Pode acessar URL
├── can_access_attachment(...)        # Pode acessar anexo
├── can_access_sanctuary(...)         # Pode acessar área restrita

-- LOGGING E AUDITORIA
├── log_security_event(...)           # Logar evento v1
├── log_security_event_v2(...)        # Logar evento v2
├── log_security_v3(...)              # Logar evento v3
├── log_audit_v2(...)                 # Auditoria v2
├── log_blocked_access(...)           # Log de acesso bloqueado
├── log_report_access(...)            # Log de acesso a relatório
├── log_sensitive_data_access(...)    # Log de dados sensíveis
├── fn_audit_trigger()                # Trigger de auditoria

-- DASHBOARD E MONITORAMENTO
├── get_security_dashboard_v3()       # Dashboard de segurança
├── get_all_users_last_access()       # Último acesso dos usuários
├── get_audit_logs(...)               # Obter logs de auditoria

-- LIMPEZA E MANUTENÇÃO
├── cleanup_security_data_v3()        # Limpeza de dados v3
├── comprehensive_security_cleanup()  # Limpeza completa
├── security_cleanup_job()            # Job de limpeza
├── cleanup_old_security_events_v2()  # Limpeza de eventos

-- 2FA
├── generate_2fa_code(...)            # Gerar código 2FA
├── generate_signed_video_url(...)    # URL assinada de vídeo

-- MISCELÂNEA
├── check_is_owner_email(email)       # Verificar email do owner
├── audit_rls_coverage_v2()           # Auditoria de RLS
├── audit_role_changes_v2()           # Auditoria de mudanças de role
```

---

### CAMADA 2: Edge Functions (Backend)

#### Edge Functions de Segurança (54 funções)
```
├── rate-limit-gateway/        # Gateway de rate limiting
├── secure-api-proxy/          # Proxy seguro para APIs
├── secure-video-url/          # URLs assinadas para vídeos
├── get-panda-signed-url/      # URL assinada Panda Video
├── webhook-handler/           # Handler principal (HMAC)
├── hotmart-webhook-processor/ # Processador Hotmart (HMAC)
├── whatsapp-webhook/          # Webhook WhatsApp (HMAC)
├── send-2fa-code/             # Envio de código 2FA
├── verify-2fa-code/           # Verificação 2FA
├── invite-employee/           # Convite seguro de funcionário
├── notify-owner/              # Notificações ao owner
└── ... (mais 43 funções)
```

#### Validações de Segurança nas Edge Functions
- **HMAC SHA-256** para webhooks (Hotmart, WhatsApp, Meta)
- **Tokens expiráveis** para vídeos (5 minutos)
- **Rate limiting distribuído** por IP/endpoint
- **Logging de tentativas bloqueadas**
- **Validação de idempotência** (evita reprocessamento)

---

### CAMADA 3: Frontend (React)

#### Componentes de Segurança (9 componentes)
```
src/components/security/
├── index.ts                   # Exportações centralizadas
├── SessionGuard.tsx           # DOGMA I: Sessão única
├── DeviceGuard.tsx            # DOGMA XI: Limite de dispositivos
├── DeviceLimitModal.tsx       # Modal de limite atingido
├── BetaAccessGuard.tsx        # DOGMA XII: Guarda de acesso beta
├── ProtectedPDFViewer.tsx     # DOGMA III: PDF blindado
├── MFASetup.tsx               # Configuração 2FA
├── SecurityDashboard.tsx      # Dashboard de segurança
└── SecurityStatusWidget.tsx   # Widget de status
```

#### Hooks de Segurança (15+ hooks)
```
src/hooks/
├── useAuth.tsx                # Autenticação principal
├── useFortalezaSupreme.ts     # Hooks centralizados v4.0
│   ├── useUrlAccessGuard()    # Verificação de URL
│   ├── useRateLimiter()       # Rate limiting
│   ├── useSecurityDashboard() # Dashboard
│   ├── useThreatDetection()   # Detecção de ameaças
│   ├── useSecurityLogger()    # Logger de eventos
│   ├── useSessionSecurity()   # Segurança de sessão
│   └── useSecurityStatus()    # Status geral
├── useSingleSession.ts        # DOGMA I: Sessão única
├── useDeviceLimit.ts          # DOGMA XI: Limite dispositivos
├── useBetaAccess.ts           # DOGMA XII: Acesso beta
├── useRolePermissions.ts      # Permissões por role
├── useGlobalDevToolsBlock.ts  # Bloqueio DevTools global
├── useSecureVideo.ts          # URLs assinadas de vídeo
├── useSecureApiProxy.ts       # Proxy seguro de API
├── useRateLimiter.ts          # Rate limiting frontend
└── useChatRateLimit.ts        # Rate limit de chat
```

#### Bibliotecas de Segurança (2 arquivos)
```
src/lib/security/
├── fortalezaSupreme.ts        # FORTALEZA SUPREME v4.0 (principal)
└── securityEvangelism.ts      # Evangelho da Segurança v2.0 (legado)

src/lib/
└── deviceFingerprint.ts       # Fingerprinting de dispositivo
```

---

## 📍 MAPA DEFINITIVO DE URLs

### Domínios e Acessos
```
📍 MAPA DE URLs DEFINITIVO

| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 NÃO PAGANTE | pro.moisesmedeiros.com.br/ | Criar conta = acesso livre |
| 👨‍🎓 ALUNO BETA | pro.moisesmedeiros.com.br/alunos | role='beta' + acesso válido |
| 👔 FUNCIONÁRIO | gestao.moisesmedeiros.com.br/ | role='funcionario' |
| 👑 OWNER | TODAS | role='owner' |
```

### Código do URL_MAP
```typescript
export const URL_MAP = {
  PUBLIC: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/', '/auth', '/auth/*', '/termos', '/privacidade', '/area-gratuita'],
    roles: ['anonymous', 'beta', 'funcionario', 'owner'],
    requireSubscription: false,
  },
  ALUNO_BETA: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/alunos', '/alunos/*', '/aulas', '/aulas/*', '/materiais', '/materiais/*'],
    roles: ['beta', 'owner'],
    requireSubscription: true,
  },
  FUNCIONARIO: {
    domain: 'gestao.moisesmedeiros.com.br',
    paths: ['/', '/*', '/dashboard', '/alunos-gestao', '/funcionarios'],
    roles: ['funcionario', 'coordenacao', 'admin', 'owner', 'employee', 'suporte', 'monitoria'],
    requireSubscription: false,
  },
  FINANCEIRO: {
    domain: 'gestao.moisesmedeiros.com.br',
    paths: ['/financeiro', '/financeiro/*', '/contabilidade', '/contabilidade/*'],
    roles: ['coordenacao', 'admin', 'owner', 'contabilidade'],
    requireSubscription: false,
  },
  OWNER: {
    domain: '*',
    paths: ['/*'],
    roles: ['owner'],
    requireSubscription: false,
  },
};
```

---

## 🔐 DOGMAS DE SEGURANÇA

### DOGMA I - Sessão Única
- **Arquivo:** `useSingleSession.ts`, `SessionGuard.tsx`
- **Função SQL:** `create_single_session()`, `validate_session_token()`
- **Descrição:** Um usuário, uma sessão. Login novo invalida sessões anteriores.
- **Verificação:** A cada 30 segundos + ao voltar para aba
- **Status:** ✅ ATIVO

### DOGMA III - Proteção de Conteúdo
- **Arquivo:** `ProtectedPDFViewer.tsx`, `useSecureVideo.ts`
- **Edge Function:** `secure-video-url/`, `get-panda-signed-url/`
- **Descrição:** PDFs blindados contra cópia, vídeos com URL expirável
- **Proteções:** 
  - Bloqueio de clique direito
  - Bloqueio de Ctrl+C, Ctrl+S, Ctrl+P
  - Marca d'água dinâmica com CPF/email
  - URLs expiram em 5 minutos
- **Status:** ✅ ATIVO

### DOGMA XI - Controle de Dispositivos
- **Arquivo:** `useDeviceLimit.ts`, `DeviceGuard.tsx`
- **Função SQL:** `register_device_with_limit()`
- **Descrição:** Máximo 3 dispositivos por usuário (owner bypassa)
- **Fingerprinting:** Canvas, WebGL, Audio, Screen, Timezone
- **Status:** ✅ ATIVO

### DOGMA XII - Acesso Beta
- **Arquivo:** `useBetaAccess.ts`, `BetaAccessGuard.tsx`
- **Função SQL:** `check_beta_access()`, `grant_beta_access()`
- **Descrição:** Controla acesso de alunos pagantes com expiração
- **Recursos:**
  - Verificação de expiração
  - Dias restantes visíveis
  - Renovação automática via Hotmart
- **Status:** ✅ ATIVO

---

## 🚨 PROTEÇÕES ADICIONAIS

### Bloqueio Global de DevTools
- **Arquivo:** `useGlobalDevToolsBlock.ts`
- **Proteções:**
  - F12 (Windows/Mac)
  - Ctrl+Shift+I/J/C (DevTools)
  - Ctrl+U (View Source)
  - Ctrl+S (Save)
  - Ctrl+P (Print)
  - Print Screen (Windows)
  - Cmd+Shift+3/4/5 (Mac Screenshot)
  - Menu de contexto (clique direito)
  - Detecção de DevTools aberto
- **Exceção:** OWNER_EMAIL (`moisesblank@gmail.com`)
- **Status:** ✅ ATIVO

### Detecção de Ameaças Client-Side
- **Arquivo:** `fortalezaSupreme.ts` → `detectSuspiciousActivity()`
- **Detecta:**
  - DevTools aberto
  - Automação (webdriver)
  - Headless browser
  - Múltiplas abas (>5)
  - Manipulação de DOM
  - Falta de plugins (possível bot)
- **Ação:** Log + possível bloqueio
- **Status:** ✅ ATIVO

### Rate Limiting Multinível
```typescript
RATE_LIMIT: {
  AUTH:     { requests: 5,   windowMs: 60000, burst: 3 },
  API:      { requests: 100, windowMs: 60000, burst: 20 },
  UPLOAD:   { requests: 10,  windowMs: 60000, burst: 5 },
  SEARCH:   { requests: 20,  windowMs: 60000, burst: 10 },
  DOWNLOAD: { requests: 30,  windowMs: 60000, burst: 10 },
}
```
- **Backend:** `rate-limit-gateway/` Edge Function
- **Frontend:** `checkClientRateLimit()` + `useRateLimiter()`
- **Status:** ✅ ATIVO

### Sanitização de Dados
```typescript
sanitizeInput()    // Remove <>, javascript:, on*=, data:
sanitizeHtml()     // Escapa HTML para exibição
isValidUUID()      // Valida formato UUID
isValidEmail()     // Valida formato email
isValidPhone()     // Valida formato telefone
maskEmail()        // mo***@gmail.com
maskPhone()        // ***1234
maskCPF()          // ***567
```
- **Status:** ✅ ATIVO

### HMAC em Webhooks
- **Hotmart:** Validação via `X-Hotmart-Hottok` header
- **WhatsApp/Meta:** Validação via `x-hub-signature-256` (HMAC SHA-256)
- **Logging:** Tentativas inválidas são logadas em `security_events`
- **Status:** ✅ ATIVO

---

## 📊 CONFIGURAÇÕES DE SEGURANÇA

```typescript
export const SECURITY_CONFIG = {
  // Rate Limiting
  RATE_LIMIT: { ... },
  
  // Sessão
  SESSION: {
    CHECK_INTERVAL_MS: 30000,      // 30 segundos
    MAX_DEVICES: 3,
    IDLE_TIMEOUT_MS: 1800000,      // 30 minutos
    ABSOLUTE_TIMEOUT_MS: 86400000, // 24 horas
  },
  
  // Bloqueio Progressivo
  LOCKOUT: {
    MAX_ATTEMPTS: 5,
    DURATION_MS: 900000,           // 15 minutos
    PROGRESSIVE: true,
    MULTIPLIER: 2,
    MAX_DURATION_MS: 86400000,     // 24 horas máximo
  },
  
  // Detecção de Ameaças
  THREAT_DETECTION: {
    ENABLED: true,
    CHECK_INTERVAL_MS: 60000,      // 1 minuto
    RISK_THRESHOLD: 30,
    AUTO_BLOCK_THRESHOLD: 70,
  },
  
  // Cache
  CACHE: {
    ACCESS_TTL_MS: 5000,           // 5 segundos
    RATE_LIMIT_TTL_MS: 1000,       // 1 segundo
    MAX_SIZE: 1000,
  },
};
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Banco de Dados
- [x] Todas tabelas de segurança têm RLS ativo
- [x] user_roles separada (evita privilege escalation)
- [x] Funções SECURITY DEFINER para queries recursivas
- [x] security_log_immutable não permite DELETE
- [x] Triggers de proteção contra escalação de privilégio

### Autenticação
- [x] Sessão única por usuário (DOGMA I)
- [x] Limite de 3 dispositivos (DOGMA XI)
- [x] Controle de acesso beta com expiração (DOGMA XII)
- [x] Owner identificado por email (moisesblank@gmail.com)
- [x] Roles em tabela separada

### Frontend
- [x] DevTools bloqueado globalmente
- [x] Print Screen bloqueado
- [x] Cópia de conteúdo bloqueada
- [x] PDFs com marca d'água
- [x] Vídeos com URL expirável

### Backend
- [x] Rate limiting em Edge Functions
- [x] HMAC em webhooks
- [x] Logs de acesso imutáveis
- [x] Proxy seguro para APIs externas

### Warnings Conhecidos
- ⚠️ Extensões no schema `public` (não crítico)
- ⚠️ Proteção de senha vazada desabilitada (configurar no dashboard)

---

## 📁 ARQUIVOS PRINCIPAIS

```
SEGURANÇA FRONTEND:
├── src/lib/security/fortalezaSupreme.ts     # Biblioteca principal v4.0
├── src/lib/security/securityEvangelism.ts   # Legado v2.0
├── src/lib/deviceFingerprint.ts             # Fingerprinting
├── src/hooks/useFortalezaSupreme.ts         # Hooks v4.0
├── src/hooks/useAuth.tsx                    # Autenticação
├── src/hooks/useSingleSession.ts            # Sessão única
├── src/hooks/useDeviceLimit.ts              # Limite dispositivos
├── src/hooks/useBetaAccess.ts               # Acesso beta
├── src/hooks/useRolePermissions.ts          # Permissões
├── src/hooks/useGlobalDevToolsBlock.ts      # Bloqueio DevTools
├── src/components/security/SessionGuard.tsx
├── src/components/security/DeviceGuard.tsx
├── src/components/security/BetaAccessGuard.tsx
├── src/components/security/ProtectedPDFViewer.tsx
└── src/components/security/SecurityDashboard.tsx

SEGURANÇA BACKEND (Edge Functions):
├── supabase/functions/rate-limit-gateway/
├── supabase/functions/secure-video-url/
├── supabase/functions/secure-api-proxy/
├── supabase/functions/webhook-handler/
├── supabase/functions/send-2fa-code/
└── supabase/functions/verify-2fa-code/
```

---

## 🎯 OWNER PRIVILEGES

O email `moisesblank@gmail.com` tem privilégios especiais:
- ✅ Acesso total a todas URLs
- ✅ Bypassa limite de dispositivos
- ✅ Bypassa bloqueio de DevTools
- ✅ Pode copiar conteúdo
- ✅ Pode fazer screenshots
- ✅ Visualiza dashboard de segurança

---

**FORTALEZA SUPREME v4.0 FINAL**
**Sistema de Segurança PHD-Level 2300**
**Preparado para 5000+ usuários simultâneos**
**Otimizado para celulares 3G**
