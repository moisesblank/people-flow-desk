# 🛡️🔥 ETAPA 0 — BASELINE + THREAT MODEL 🔥🛡️
## SECURITY OMEGA ULTRA — NÍVEL NASA + BRADESCO
### ANO 2300 — PROTEÇÃO FUTURISTA COM RENDIMENTO 3500

---

## 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA)

| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 **NÃO PAGANTE** | `pro.moisesmedeiros.com.br/` + `/comunidade` | Cadastro gratuito |
| 👨‍🎓 **ALUNO BETA** | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` + acesso válido |
| 👔 **FUNCIONÁRIO** | `gestao.moisesmedeiros.com.br/gestao` | `role='funcionario'` |
| 👑 **OWNER** | **TODAS** | `moisesblank@gmail.com` = MASTER |

---

# 📊 INVENTÁRIO DE SUPERFÍCIES DE ATAQUE

## 1. FRONTEND (React SPA)

| Superfície | Tecnologia | Exposição |
|------------|------------|-----------|
| Landing Page | React + Vite | Pública |
| Portal Aluno | React + Auth | Autenticada |
| Área Gestão | React + Auth | Role-based |
| Player de Vídeo | FortressVideoPlayer | Autenticada + DRM |
| Visualizador PDF | SecurePdfViewerOmega | Autenticada + Watermark |
| Livro Web | WebBookReader | Autenticada + SANCTUM |
| Chat Live | useLiveChat | Autenticada + Rate Limited |
| AI TRAMON | AITramonGlobal | Autenticada + Budgets |

**Arquivos Críticos Frontend:**
- `src/hooks/useSanctumCore.ts` — Detecção de ameaças client-side
- `src/hooks/useVideoFortressOmega.ts` — Proteção de vídeo
- `src/hooks/useSecurityGuard.ts` — Guarda de segurança
- `src/hooks/useSingleSession.ts` — Sessão única
- `src/lib/deviceFingerprint.ts` — Fingerprint de dispositivo
- `src/core/storage.ts` — Controle de buckets
- `src/core/urlAccessControl.ts` — Controle de URLs

---

## 2. EDGE FUNCTIONS (68 funções)

### 🔴 CRÍTICAS (P0) — Dados financeiros/acesso

| Função | Propósito | Risco |
|--------|-----------|-------|
| `hotmart-webhook-processor` | Pagamentos | CRÍTICO |
| `hotmart-fast` | Pagamentos | CRÍTICO |
| `c-handle-refund` | Reembolsos | CRÍTICO |
| `video-authorize` | Acesso a vídeo | CRÍTICO |
| `video-authorize-omega` | Acesso a vídeo v2 | CRÍTICO |
| `sanctum-asset-manifest` | Acesso a assets | CRÍTICO |
| `book-page-manifest` | Acesso a livros | CRÍTICO |
| `genesis-book-upload` | Upload de livros | CRÍTICO |
| `c-create-beta-user` | Criar usuário beta | ALTO |
| `invite-employee` | Criar funcionário | ALTO |

### 🟠 ALTO RISCO (P1) — Webhooks externos

| Função | Propósito | Risco |
|--------|-----------|-------|
| `webhook-handler` | Handler genérico | ALTO |
| `webhook-receiver` | Receptor | ALTO |
| `whatsapp-webhook` | WhatsApp | ALTO |
| `wordpress-webhook` | WordPress | ALTO |
| `webhook-curso-quimica` | Curso específico | ALTO |
| `secure-webhook-ultra` | Webhook seguro | ALTO |

### 🟡 MÉDIO RISCO (P2) — IA/Automação

| Função | Propósito | Risco |
|--------|-----------|-------|
| `ai-tramon` | Tutor IA | MÉDIO |
| `ai-assistant` | Assistente IA | MÉDIO |
| `ai-tutor` | Tutor genérico | MÉDIO |
| `ia-gateway` | Gateway IA | MÉDIO |
| `sna-gateway` | SNA Gateway | MÉDIO |
| `sna-worker` | SNA Worker | MÉDIO |
| `generate-ai-content` | Geração IA | MÉDIO |
| `chat-tramon` | Chat IA | MÉDIO |
| `book-chat-ai` | Chat em livros | MÉDIO |

### 🟢 BAIXO RISCO (P3) — Utilitários

| Função | Propósito | Risco |
|--------|-----------|-------|
| `send-email` | Envio de email | BAIXO |
| `send-notification-email` | Notificações | BAIXO |
| `backup-data` | Backup | BAIXO |
| `social-media-stats` | Métricas sociais | BAIXO |
| `youtube-sync` | Sync YouTube | BAIXO |

---

## 3. DADOS SENSÍVEIS (PII + Tokens)

| Tipo | Tabela/Local | Classificação |
|------|--------------|---------------|
| Email/Nome/CPF | `profiles`, `alunos` | PII CRÍTICO |
| Senhas (hash) | `auth.users` | CRÍTICO |
| Tokens de pagamento | `transacoes_hotmart` | CRÍTICO |
| Sessões | `user_sessions` | ALTO |
| Fingerprints | `device_fingerprints` | ALTO |
| Progress de estudo | `user_book_progress` | MÉDIO |
| Anotações | `user_annotations` | MÉDIO |
| Logs de acesso | `audit_log`, `book_access_logs` | AUDITORIA |

### Secrets Configurados (32 chaves):

| Categoria | Secrets |
|-----------|---------|
| IA | `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` |
| Hotmart | `HOTMART_CLIENT_ID`, `HOTMART_CLIENT_SECRET`, `HOTMART_HOTTOK` |
| WhatsApp | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN` |
| Panda | `PANDA_API_KEY` |
| Email | `RESEND_API_KEY` |
| Infraestrutura | `CLOUDFLARE_*`, `CPANEL_*` |

---

# 🔴 TOP 30 AMEAÇAS — THREAT MODEL

## CATEGORIA A: AUTENTICAÇÃO (AUTH)

| # | Ameaça | Impacto | Probabilidade | Risco | Vetor | Controle Existente | Lacuna | Prioridade |
|---|--------|---------|---------------|-------|-------|-------------------|--------|------------|
| A1 | Brute Force em Login | ALTO | MÉDIA | 🔴 | Tentativas massivas de senha | Rate limit básico | Sem progressive lockout | P0 |
| A2 | Credential Stuffing | ALTO | ALTA | 🔴 | Listas de senhas vazadas | Nenhum | Sem detecção de padrão | P0 |
| A3 | Session Hijacking | CRÍTICO | BAIXA | 🟠 | Roubo de token JWT | `useSingleSession` | Sem binding IP/UA forte | P1 |
| A4 | Session Fixation | ALTO | BAIXA | 🟡 | Forçar ID de sessão | Supabase Auth | OK | ✅ |
| A5 | Password Reset Abuse | MÉDIO | MÉDIA | 🟠 | Spam de reset | Rate limit | Sem anti-enumeration completo | P1 |

## CATEGORIA B: AUTORIZAÇÃO (AUTHZ)

| # | Ameaça | Impacto | Probabilidade | Risco | Vetor | Controle Existente | Lacuna | Prioridade |
|---|--------|---------|---------------|-------|-------|-------------------|--------|------------|
| B1 | IDOR (Insecure Direct Object Reference) | CRÍTICO | MÉDIA | 🔴 | Acessar recurso de outro usuário | RLS em 137 arquivos | Verificar 100% cobertura | P0 |
| B2 | Privilege Escalation | CRÍTICO | BAIXA | 🟠 | Virar admin sem permissão | Role checks | Verificar bypass no client | P1 |
| B3 | Role Bypass | ALTO | MÉDIA | 🔴 | Burlar verificação de role | `useRolePermissions` | Verificar server-side | P0 |
| B4 | Owner Impersonation | CRÍTICO | MUITO BAIXA | 🟡 | Fingir ser owner | Email hardcoded | Verificar múltiplos pontos | P1 |

## CATEGORIA C: WEBHOOKS

| # | Ameaça | Impacto | Probabilidade | Risco | Vetor | Controle Existente | Lacuna | Prioridade |
|---|--------|---------|---------------|-------|-------|-------------------|--------|------------|
| C1 | Webhook Forgery | CRÍTICO | MÉDIA | 🔴 | Criar pagamento falso | HMAC em 9 arquivos | Verificar todos endpoints | P0 |
| C2 | Replay Attack | ALTO | MÉDIA | 🔴 | Reenviar webhook válido | Parcial | Falta anti-replay universal | P0 |
| C3 | Webhook Flooding | MÉDIO | ALTA | 🟠 | DDoS via webhooks | Rate limit parcial | Falta rate limit universal | P1 |
| C4 | Payload Injection | ALTO | BAIXA | 🟡 | JSON malicioso | Validação parcial | Falta schema validation | P1 |

## CATEGORIA D: CONTEÚDO (VIDEO/PDF)

| # | Ameaça | Impacto | Probabilidade | Risco | Vetor | Controle Existente | Lacuna | Prioridade |
|---|--------|---------|---------------|-------|-------|-------------------|--------|------------|
| D1 | Link Sharing | CRÍTICO | ALTA | 🔴 | Compartilhar URL | Signed URLs | Verificar TTL curto | P0 |
| D2 | Direct Download | ALTO | MÉDIA | 🟠 | Baixar vídeo/PDF | Storage privado | Verificar 100% privado | P1 |
| D3 | Screen Recording | MÉDIO | ALTA | 🟡 | Gravar tela | Watermark | Aceitável (limite técnico) | P2 |
| D4 | Session Multiplexing | ALTO | MÉDIA | 🔴 | Múltiplos devices | `video_play_sessions` | Verificar enforcement | P0 |
| D5 | Token Theft | ALTO | BAIXA | 🟠 | Roubar token de conteúdo | Token binding | Verificar expiração | P1 |
| D6 | Watermark Removal | MÉDIO | BAIXA | 🟡 | Remover watermark | Dynamic watermark | Canvas rendering | P2 |

## CATEGORIA E: IA/AUTOMAÇÃO

| # | Ameaça | Impacto | Probabilidade | Risco | Vetor | Controle Existente | Lacuna | Prioridade |
|---|--------|---------|---------------|-------|-------|-------------------|--------|------------|
| E1 | Prompt Injection | ALTO | MÉDIA | 🔴 | Injetar comandos na IA | Parcial | Falta separação dados/instruções | P0 |
| E2 | Cost Attack | MÉDIO | MÉDIA | 🟠 | Estourar budget IA | Budgets em `ai_budgets` | Verificar enforcement | P1 |
| E3 | Tool Abuse | ALTO | BAIXA | 🟡 | IA executar ação indevida | Allowlist | Verificar cobertura | P1 |
| E4 | Data Exfiltration via IA | ALTO | BAIXA | 🟡 | Extrair dados via IA | Auditoria | Verificar logs | P1 |

## CATEGORIA F: INFRAESTRUTURA

| # | Ameaça | Impacto | Probabilidade | Risco | Vetor | Controle Existente | Lacuna | Prioridade |
|---|--------|---------|---------------|-------|-------|-------------------|--------|------------|
| F1 | Secret Exposure | CRÍTICO | BAIXA | 🟠 | Vazar API keys | Edge Functions | Verificar client-side | P0 |
| F2 | CORS Misconfiguration | ALTO | MÉDIA | 🟠 | Requisição cross-origin | Parcial | Verificar todas funções | P1 |
| F3 | SQL Injection | CRÍTICO | BAIXA | 🟡 | Injetar SQL | Supabase RPC | Verificar queries raw | P1 |
| F4 | XSS | ALTO | MÉDIA | 🟠 | Injetar script | React escape | Verificar dangerouslySetInnerHTML | P1 |
| F5 | SSRF | ALTO | BAIXA | 🟡 | Request interno | Parcial | Verificar fetch externos | P2 |

## CATEGORIA G: ABUSO/FRAUDE

| # | Ameaça | Impacto | Probabilidade | Risco | Vetor | Controle Existente | Lacuna | Prioridade |
|---|--------|---------|---------------|-------|-------|-------------------|--------|------------|
| G1 | Account Takeover | CRÍTICO | MÉDIA | 🔴 | Roubar conta | 2FA opcional | Falta step-up auth | P0 |
| G2 | Spam/Flood | MÉDIO | ALTA | 🟠 | Flood de mensagens | Rate limit | Verificar cobertura | P1 |
| G3 | Fake Accounts | MÉDIO | MÉDIA | 🟡 | Criar contas falsas | Email verification | Verificar enforcement | P2 |
| G4 | API Abuse | ALTO | MÉDIA | 🟠 | Scraping/automation | Rate limit | Verificar fingerprint | P1 |

---

# 📋 MATRIZ OWASP TOP 10 → CONTROLES

| OWASP 2021 | Descrição | Controle no Sistema | Status |
|------------|-----------|---------------------|--------|
| A01:2021 | Broken Access Control | RLS + Role checks + Owner bypass | 🟡 PARCIAL |
| A02:2021 | Cryptographic Failures | HTTPS + Supabase encryption | ✅ OK |
| A03:2021 | Injection | Supabase RPC + React escape | 🟡 VERIFICAR |
| A04:2021 | Insecure Design | Threat model (este doc) | 🟡 EM ANDAMENTO |
| A05:2021 | Security Misconfiguration | CORS + Headers | 🟡 VERIFICAR |
| A06:2021 | Vulnerable Components | NPM audit | 🟡 VERIFICAR |
| A07:2021 | Auth Failures | Supabase Auth + 2FA | 🟡 PARCIAL |
| A08:2021 | Data Integrity Failures | HMAC webhooks | 🟡 PARCIAL |
| A09:2021 | Logging Failures | Audit log + Sanctum | 🟡 PARCIAL |
| A10:2021 | SSRF | Validação de URLs | 🟡 VERIFICAR |

---

# 🔧 CONTROLES EXISTENTES (INVENTÁRIO)

## ✅ JÁ IMPLEMENTADOS

| Controle | Arquivo(s) | Cobertura |
|----------|------------|-----------|
| RLS (Row Level Security) | 137 arquivos SQL | 90% |
| Owner Bypass | 28 arquivos TS | 100% |
| HMAC Webhook | 9 arquivos | 60% |
| Rate Limit | 22 arquivos | 50% |
| Single Session | `useSingleSession.ts` | 80% |
| Device Fingerprint | `deviceFingerprint.ts` | 70% |
| Watermark Vídeo | `FortressVideoPlayer` | 90% |
| Watermark PDF | `SanctumWatermark` | 90% |
| DevTools Block | `useGlobalDevToolsBlock` | 80% |
| SANCTUM Core | `useSanctumCore` | 90% |
| Signed URLs | `sanctum-asset-manifest` | 90% |
| Token Binding | `video-authorize-omega` | 80% |
| Audit Log | `audit_log`, `sanctum_asset_access` | 70% |
| AI Budgets | `ai_budgets` | 60% |

## 🔴 LACUNAS CRÍTICAS

| Lacuna | Impacto | Onde Implementar |
|--------|---------|------------------|
| SANCTUM GATE universal | CRÍTICO | Todas Edge Functions |
| Anti-replay universal | ALTO | Todos webhooks |
| Progressive lockout | ALTO | Auth endpoints |
| Schema validation webhooks | MÉDIO | Webhook handlers |
| Idempotency universal | MÉDIO | Todas ações críticas |
| DLQ (Dead Letter Queue) | MÉDIO | SNA Worker |
| Modo LOCKDOWN | CRÍTICO | Feature flags |
| Step-up auth | ALTO | Ações sensíveis |
| Hash-chain audit | MÉDIO | Audit log |

---

# 📊 PLANO DE HARDENING EM ONDAS

## 🔴 ONDA P0 — CRÍTICO (Fazer Primeiro)

| # | Ação | Arquivos Alvo | Ameaça Mitigada |
|---|------|---------------|-----------------|
| 1 | Implementar SANCTUM GATE universal | Todas Edge Functions | A1, A2, B1, B3 |
| 2 | Anti-replay em TODOS webhooks | `*-webhook*` | C2 |
| 3 | Progressive lockout em auth | Auth hooks | A1, A2 |
| 4 | Verificar IDOR 100% | RLS policies | B1 |
| 5 | Modo LOCKDOWN | Feature flags globais | G1, F1 |
| 6 | Verificar secrets no client | Bundle analysis | F1 |

## 🟠 ONDA P1 — ALTO

| # | Ação | Arquivos Alvo | Ameaça Mitigada |
|---|------|---------------|-----------------|
| 7 | Step-up auth para ações críticas | Auth flows | G1 |
| 8 | Schema validation webhooks | Webhook handlers | C4 |
| 9 | Idempotency universal | SNA, Webhooks | C2 |
| 10 | Rate limit 100% cobertura | API Gateway | G2, G4 |
| 11 | CORS hardening | Edge Functions | F2 |
| 12 | XSS audit | Components com HTML | F4 |

## 🟡 ONDA P2 — MÉDIO

| # | Ação | Arquivos Alvo | Ameaça Mitigada |
|---|------|---------------|-----------------|
| 13 | DLQ para jobs | SNA Worker | Confiabilidade |
| 14 | Hash-chain audit log | Audit tables | Tamper-proof |
| 15 | AI guardrails completos | IA functions | E1, E3 |
| 16 | SSRF validation | Fetch externos | F5 |
| 17 | NPM audit | package.json | A06:2021 |

---

# 🎯 DEFINIÇÃO DE PRONTO (GO/NO-GO)

## CHECKLIST OBRIGATÓRIO

| # | Item | Status Atual | Meta |
|---|------|--------------|------|
| 1 | 0 segredos expostos em client/headers/logs | 🟡 VERIFICAR | ✅ |
| 2 | Auth resistente a brute-force | 🔴 FALTA | ✅ |
| 3 | Autorização impecável (RLS/ownership) | 🟡 90% | 100% |
| 4 | Webhooks com HMAC + anti-replay | 🟡 60% | 100% |
| 5 | Rate-limit em endpoints críticos | 🟡 50% | 100% |
| 6 | Conteúdo com TTL curto + watermark | 🟢 90% | 100% |
| 7 | AI com guardrails + budgets | 🟡 60% | 100% |
| 8 | Observabilidade + incident response | 🟡 70% | 100% |
| 9 | Modo LOCKDOWN disponível | 🔴 FALTA | ✅ |

---

# 📝 PRÓXIMAS ETAPAS

## ETAPA 1 — P0 "FECHAR BURACOS CRÍTICOS"
- SANCTUM GATE universal
- Anti-replay universal
- Progressive lockout
- Verificação IDOR 100%
- Modo LOCKDOWN

## ETAPA 2 — AUTH/AUTHZ BANK-GRADE
- Step-up auth
- Sessão com binding forte
- Rate limit completo

## ETAPA 3 — WEBHOOKS BANK-GRADE
- HMAC em todos
- Schema validation
- Idempotency + DLQ

## ETAPA 4 — CONTENTSHIELD BANK-GRADE
- DRM opcional (recomendação)
- Token binding forte
- Anti-leeching completo

## ETAPA 5 — IA/SNA HARDENING
- Prompt injection prevention
- Tool allowlist
- Auditoria completa

## ETAPA 6 — GO/NO-GO FINAL
- Checklist completo
- Pen test básico
- Incident response pronto

---

## ⚠️ RISCOS RESIDUAIS (NÃO ELIMINÁVEIS)

| Risco | Mitigação | Aceitação |
|-------|-----------|-----------|
| Screen recording | Watermark forense | ACEITO |
| Analog hole | Rastreabilidade | ACEITO |
| Zero-day browser | Monitoramento | ACEITO |
| Insider threat (owner) | Audit log | N/A (é o owner) |

---

**ETAPA 0 CONCLUÍDA ✅**

Aguardando aprovação para iniciar **ETAPA 1 — P0**.

---

*SECURITY OMEGA ULTRA v1.0*
*Prof. Moisés Medeiros — moisesblank@gmail.com*
*moisesmedeiros.com.br*
